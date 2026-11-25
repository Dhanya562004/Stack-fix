const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

// Load .env via backend config (never logs or exposes API key)
const config = require('../backend/src/config');
const aiService = require('../backend/src/services/aiService');

const CASES_PATH = path.resolve(__dirname, 'cases.json');
const RETRY_DELAYS_MS = [10000, 30000, 60000];
const DEFAULT_GEMINI_DELAY_MS = 4500;
const EXEC_TIMEOUT_MS = 10000;
const API_TIMEOUT_MS = 60000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(text) {
  if (!text) return '';
  let s = String(text);
  const key = config.gemini.apiKey;
  if (key && key.length > 4) {
    s = s.split(key).join('[REDACTED]');
  }
  s = s.replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]');
  s = s.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]');
  s = s.replace(/AQ\.[0-9A-Za-z_.-]{10,}/g, '[REDACTED]');
  return s;
}

function parseArgs(argv) {
  const args = {
    gemini: false,
    caseId: null,
    out: null,
    delayMs: null,
    only: null
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--gemini') {
      args.gemini = true;
    } else if (a === '--case' && argv[i + 1]) {
      args.caseId = parseInt(argv[++i], 10);
    } else if (a === '--out' && argv[i + 1]) {
      args.out = argv[++i];
    } else if (a === '--delay' && argv[i + 1]) {
      args.delayMs = parseInt(argv[++i], 10);
    } else if (a === '--only' && argv[i + 1]) {
      args.only = argv[++i].split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !Number.isNaN(n));
    }
  }

  return args;
}

function runCodeCheck(language, code) {
  if (typeof code !== 'string' || code.trim() === '') {
    return { runs: false, error: 'Empty fixedCode' };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackfix-bench-'));
  try {
    if (language === 'python') {
      const filePath = path.join(tmpDir, 'check.py');
      fs.writeFileSync(filePath, code, 'utf8');
      const res = spawnSync('python', [filePath], {
        encoding: 'utf8',
        timeout: EXEC_TIMEOUT_MS
      });
      if (res.error) {
        return { runs: false, error: res.error.message };
      }
      if (res.status !== 0) {
        const stderr = (res.stderr || res.stdout || '').trim().split('\n').slice(-3).join(' | ');
        return { runs: false, error: stderr || `Exit code ${res.status}` };
      }
      return { runs: true, error: null };
    }

    if (language === 'javascript') {
      const filePath = path.join(tmpDir, 'check.js');
      fs.writeFileSync(filePath, code, 'utf8');
      const res = spawnSync('node', [filePath], {
        encoding: 'utf8',
        timeout: EXEC_TIMEOUT_MS
      });
      if (res.error) {
        return { runs: false, error: res.error.message };
      }
      if (res.status !== 0) {
        const stderr = (res.stderr || res.stdout || '').trim().split('\n').slice(-3).join(' | ');
        return { runs: false, error: stderr || `Exit code ${res.status}` };
      }
      return { runs: true, error: null };
    }

    return { runs: false, error: `Unsupported language: ${language}` };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function evaluatePassRule(inputCode, fixedCode, language) {
  const changed = typeof fixedCode === 'string' && fixedCode.trim() !== '' && fixedCode.trim() !== inputCode.trim();
  if (!changed) {
    return {
      changed: false,
      runs: false,
      passed: false,
      reason: 'fixedCode is identical to input or empty'
    };
  }

  const execResult = runCodeCheck(language, fixedCode);
  if (!execResult.runs) {
    return {
      changed: true,
      runs: false,
      passed: false,
      reason: `fixedCode changed but failed execution: ${sanitizeText(execResult.error)}`
    };
  }

  return {
    changed: true,
    runs: true,
    passed: true,
    reason: 'fixedCode differs from input and runs without error'
  };
}

/**
 * Observe fetch calls made by aiService.analyzeCode so we can distinguish
 * transient API errors (429, 500, 503, timeout) from silent fallbacks,
 * without altering aiService.js itself.
 */
function installFetchObserver() {
  const originalFetch = global.fetch;
  let lastApiEvent = null;

  global.fetch = async function observedFetch(url, options = {}) {
    lastApiEvent = { status: null, error: null, retryable: false };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await originalFetch(url, {
        ...options,
        signal: options.signal || controller.signal
      });
      lastApiEvent.status = res.status;
      if ([429, 500, 503].includes(res.status)) {
        lastApiEvent.retryable = true;
        lastApiEvent.error = `HTTP ${res.status}`;
      } else if (!res.ok) {
        lastApiEvent.error = `HTTP ${res.status}`;
      }
      return res;
    } catch (err) {
      const isAbort = err && err.name === 'AbortError';
      lastApiEvent.retryable = true;
      lastApiEvent.error = isAbort ? `Timeout after ${API_TIMEOUT_MS}ms` : sanitizeText(err.message);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    reset() {
      lastApiEvent = null;
    },
    getLastEvent() {
      return lastApiEvent;
    },
    restore() {
      global.fetch = originalFetch;
    }
  };
}

async function runCaseGemini(testCase, observer) {
  const maxAttempts = 1 + RETRY_DELAYS_MS.length; // initial + 3 retries (10s, 30s, 60s)
  let lastResult = null;
  let lastEvent = null;
  const attemptLog = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    observer.reset();
    const result = await aiService.analyzeCode({
      code: testCase.code,
      error: testCase.error,
      language: testCase.language
    });
    lastResult = result;
    lastEvent = observer.getLastEvent();

    const engineUsed = result?.metadata?.mode || 'unknown';
    attemptLog.push({
      attempt,
      timestamp: new Date().toISOString(),
      httpStatus: lastEvent ? lastEvent.status : null,
      engineUsed,
      error: lastEvent && lastEvent.error ? sanitizeText(lastEvent.error) : null
    });

    if (engineUsed === 'gemini_ai') {
      const evalRes = evaluatePassRule(testCase.code, result.fixedCode, testCase.language);
      return {
        id: testCase.id,
        language: testCase.language,
        status: evalRes.passed ? 'PASS' : 'FAIL',
        passed: evalRes.passed,
        changed: evalRes.changed,
        runs: evalRes.runs,
        reason: evalRes.reason,
        engineUsed,
        model: result?.metadata?.model || config.gemini.model,
        httpStatus: lastEvent ? lastEvent.status : null,
        responseTimeMs: result?.metadata?.executionTimeMs ?? null,
        attempts: attempt,
        attemptLog,
        timestamp: new Date().toISOString(),
        rawResponse: result
      };
    }

    // Did not use gemini_ai: check if it was a retryable API error (429, 500, 503, timeout)
    if (lastEvent && lastEvent.retryable && attempt < maxAttempts) {
      const waitMs = RETRY_DELAYS_MS[attempt - 1];
      console.error(
        `[Case ${testCase.id}] API error (${lastEvent.error}) on attempt ${attempt}/${maxAttempts}. Retrying in ${waitMs / 1000}s...`
      );
      await sleep(waitMs);
      continue;
    }

    break;
  }

  const engineUsed = lastResult?.metadata?.mode || 'unknown';
  if (lastEvent && lastEvent.retryable) {
    return {
      id: testCase.id,
      language: testCase.language,
      status: 'API_ERROR',
      passed: null,
      changed: null,
      runs: null,
      reason: `API_ERROR after ${maxAttempts} attempts: ${sanitizeText(lastEvent.error)}`,
      engineUsed,
      model: lastResult?.metadata?.model || config.gemini.model,
      httpStatus: lastEvent ? lastEvent.status : null,
      responseTimeMs: lastResult?.metadata?.executionTimeMs ?? null,
      attempts: maxAttempts,
      attemptLog,
      timestamp: new Date().toISOString(),
      rawResponse: lastResult
    };
  }

  return {
    id: testCase.id,
    language: testCase.language,
    status: 'FALLBACK_USED',
    passed: null,
    changed: null,
    runs: null,
    reason: `FALLBACK_USED (engineUsed=${engineUsed}${lastEvent?.error ? `, api=${sanitizeText(lastEvent.error)}` : ''})`,
    engineUsed,
    model: lastResult?.metadata?.model || 'unknown',
    httpStatus: lastEvent ? lastEvent.status : null,
    responseTimeMs: lastResult?.metadata?.executionTimeMs ?? null,
    attempts: attemptLog.length,
    attemptLog,
    timestamp: new Date().toISOString(),
    rawResponse: lastResult
  };
}

function runCaseHeuristic(testCase) {
  const start = Date.now();
  const res = aiService.runHeuristicFallback(testCase.code, testCase.error, testCase.language);
  const executionTimeMs = Date.now() - start;
  const fullResult = {
    ...res,
    metadata: {
      executionTimeMs,
      mode: 'heuristic_fallback',
      model: 'heuristic-engine-v2'
    }
  };
  const evalRes = evaluatePassRule(testCase.code, fullResult.fixedCode, testCase.language);
  return {
    id: testCase.id,
    language: testCase.language,
    status: evalRes.passed ? 'PASS' : 'FAIL',
    passed: evalRes.passed,
    changed: evalRes.changed,
    runs: evalRes.runs,
    reason: evalRes.reason,
    engineUsed: 'heuristic_fallback',
    model: 'heuristic-engine-v2',
    responseTimeMs: executionTimeMs,
    attempts: 1,
    timestamp: new Date().toISOString(),
    rawResponse: fullResult
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, 'utf8'));

  let selected = cases;
  if (args.caseId !== null) {
    selected = cases.filter((c) => c.id === args.caseId);
  } else if (args.only && args.only.length > 0) {
    selected = cases.filter((c) => args.only.includes(c.id));
  }

  if (selected.length === 0) {
    console.error('No matching cases found.');
    process.exit(1);
  }

  const delayMs = args.delayMs !== null ? args.delayMs : (args.gemini ? DEFAULT_GEMINI_DELAY_MS : 0);
  const observer = args.gemini ? installFetchObserver() : null;
  const results = [];

  try {
    for (let i = 0; i < selected.length; i++) {
      const testCase = selected[i];
      const entry = args.gemini
        ? await runCaseGemini(testCase, observer)
        : runCaseHeuristic(testCase);

      results.push(entry);
      console.log(
        `Case ${entry.id} (${entry.language}): ${entry.status} | engine=${entry.engineUsed} | model=${entry.model} | ${entry.responseTimeMs}ms | ${entry.reason}`
      );

      if (i < selected.length - 1 && delayMs > 0) {
        await sleep(delayMs);
      }
    }
  } finally {
    if (observer) observer.restore();
  }

  const payload = {
    mode: args.gemini ? 'gemini' : 'heuristic',
    configuredModel: args.gemini ? config.gemini.model : 'heuristic-engine-v2',
    runTimestamp: new Date().toISOString(),
    totalCases: results.length,
    summary: {
      passed: results.filter((r) => r.status === 'PASS').length,
      failed: results.filter((r) => r.status === 'FAIL').length,
      fallbackUsed: results.filter((r) => r.status === 'FALLBACK_USED').length,
      apiError: results.filter((r) => r.status === 'API_ERROR').length
    },
    results
  };

  if (args.out) {
    const outPath = path.resolve(process.cwd(), args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, sanitizeText(JSON.stringify(payload, null, 2)), 'utf8');
    console.log(`Saved results to ${outPath}`);
  } else if (args.caseId !== null) {
    console.log('\n--- RAW DRY CHECK JSON ---');
    console.log(sanitizeText(JSON.stringify(payload.results[0], null, 2)));
  }
}

main().catch((err) => {
  console.error(sanitizeText(err && err.stack ? err.stack : String(err)));
  process.exit(1);
});
