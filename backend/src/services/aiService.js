const config = require('../config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.modelName = config.gemini.model;
    this.isAiEnabled = Boolean(this.apiKey && this.apiKey !== 'your_gemini_api_key_here' && this.apiKey !== 'demo_key_placeholder');
  }

  /**
   * Main entry point to analyze code and error
   */
  async analyzeCode({ code, error, language = 'auto' }) {
    const startTime = Date.now();

    // Try Gemini API if API key is provided
    if (this.isAiEnabled) {
      try {
        logger.info('Calling Gemini API for code analysis...', { model: this.modelName, language });
        const aiResult = await this.callGeminiAPI(code, error, language);
        const executionTimeMs = Date.now() - startTime;

        return {
          ...aiResult,
          metadata: {
            executionTimeMs,
            mode: 'gemini_ai',
            model: this.modelName
          }
        };
      } catch (err) {
        logger.warn(`Gemini API call failed (${err.message}). Falling back to Heuristic Engine.`);
      }
    } else {
      logger.info('Gemini API key not configured or set to demo. Using Deterministic Heuristic Engine.');
    }

    // Fallback: Intelligent Heuristic Debugging Engine
    const fallbackResult = this.runHeuristicFallback(code, error, language);
    const executionTimeMs = Date.now() - startTime;

    return {
      ...fallbackResult,
      metadata: {
        executionTimeMs,
        mode: 'heuristic_fallback',
        model: 'heuristic-engine-v2'
      }
    };
  }

  /**
   * Call Gemini API with structured prompt expecting JSON response
   */
  async callGeminiAPI(code, error, language) {
    // We can use standard fetch to Gemini REST API or @google/genai SDK
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

    const promptText = `
You are an expert software engineer and AI code debugging engine.
Analyze the following source code and error stack trace/message.

Target Language: ${language}

=== SOURCE CODE ===
${code}

=== ERROR STACK TRACE / DESCRIPTION ===
${error}

Respond STRICTLY with a valid JSON object (no markdown formatting, no code blocks, no text outside JSON) in this exact schema:
{
  "rootCause": "Detailed explanation of why this error happened",
  "explanation": "Clear, developer-friendly explanation of the issue",
  "fixSteps": [
    "Step 1 to fix",
    "Step 2 to fix"
  ],
  "fixedCode": "Complete corrected replacement code string",
  "confidenceScore": 0.95
}
`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini HTTP Error ${response.status}: ${errText}`);
    }

    const resData = await response.json();
    const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini API returned empty candidate response.');
    }

    // Clean JSON text if wrapped in markdown ```json ... ```
    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    return {
      rootCause: parsed.rootCause || 'Root cause analyzed by Gemini AI.',
      explanation: parsed.explanation || 'Issue detected and explained by Gemini AI.',
      fixSteps: Array.isArray(parsed.fixSteps) ? parsed.fixSteps : ['Apply fixed code.'],
      fixedCode: parsed.fixedCode || code,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.92
    };
  }

  /**
   * Deterministic Heuristic Debugging Engine
   * Provides accurate analysis & fixes for common programming errors when offline or key is omitted.
   */
  runHeuristicFallback(code, error, language) {
    const errorLower = error.toLowerCase();
    const lines = code.split('\n');
    let fixedCodeLines = [...lines];
    let rootCause = 'An issue was detected in the code based on the provided error stack trace.';
    let explanation = 'The system analyzed the runtime error pattern and generated corrective modifications.';
    let fixSteps = ['Inspect variable references and scopes.', 'Ensure proper declaration before usage.'];
    let confidenceScore = 0.88;

    // Pattern 1: Python NameError / KeyError / Undefined Variable
    if (errorLower.includes('nameerror') || errorLower.includes('is not defined') || errorLower.includes('keyerror')) {
      const match = error.match(/name ['"](\w+)['"] is not defined/i) || error.match(/KeyError: ['"]?(\w+)['"]?/i);
      const missingVar = match ? match[1] : null;

      if (missingVar) {
        rootCause = `The identifier '${missingVar}' is referenced but was not defined or initialized in the current scope.`;
        explanation = `In Python, referencing '${missingVar}' before assignment raises a NameError/KeyError. You must define '${missingVar}' prior to reading it.`;
        fixSteps = [
          `Declare and initialize '${missingVar}' before it is referenced.`,
          `Check for typos between variable declaration and usage.`
        ];

        // Attempt smart replacement if similar variable exists
        let replaceIndex = -1;
        lines.forEach((line, idx) => {
          if (line.includes(missingVar) && !line.includes('=')) {
            replaceIndex = idx;
          }
        });

        // Find potential variable declaration in earlier lines
        let declaredVar = null;
        lines.forEach(line => {
          const assignMatch = line.match(/^\s*([a-zA-Z_]\w*)\s*=/);
          if (assignMatch && assignMatch[1] !== missingVar) {
            declaredVar = assignMatch[1];
          }
        });

        if (replaceIndex !== -1 && declaredVar) {
          fixedCodeLines[replaceIndex] = fixedCodeLines[replaceIndex].replace(new RegExp(`\\b${missingVar}\\b`, 'g'), declaredVar);
          explanation += ` Auto-corrected '${missingVar}' to declared variable '${declaredVar}'.`;
        } else if (replaceIndex !== -1) {
          fixedCodeLines.unshift(`${missingVar} = ""  # Fixed: initialized variable`);
        }
      }
    }
    // Pattern 2: JavaScript ReferenceError / TypeError / Cannot read property of undefined
    else if (errorLower.includes('referenceerror') || errorLower.includes('cannot read property') || errorLower.includes('is not defined') || errorLower.includes('typeerror')) {
      rootCause = 'Attempted to access a variable or property on an undefined or uninitialized reference.';
      explanation = 'In JavaScript/TypeScript, referencing an undeclared variable or accessing properties on null/undefined throws a runtime exception.';
      fixSteps = [
        'Add optional chaining (?.) or defensive null check before accessing object properties.',
        'Verify variable declaration using const/let before referencing.'
      ];

      fixedCodeLines = lines.map(line => {
        if (line.includes('.') && !line.includes('?.') && !line.includes('console.log')) {
          return line.replace(/(\w+)\.(\w+)/g, '$1?.$2');
        }
        return line;
      });
    }
    // Pattern 3: Java NullPointerException
    else if (errorLower.includes('nullpointerexception') || errorLower.includes('java.lang.nullpointerexception')) {
      rootCause = 'NullPointerException occurred due to invoking a method or accessing a field on a null object reference.';
      explanation = 'A variable was initialized to null or returned null from a method call, and an operation was performed on it without a null check.';
      fixSteps = [
        'Add a null safety check before method invocation.',
        'Ensure proper object initialization using the constructor.'
      ];
      fixedCodeLines = lines.map(line => {
        if (line.includes('.') && !line.includes('if (') && !line.includes('System.out')) {
          const match = line.match(/(\w+)\.(\w+)/);
          if (match) {
            const indent = line.match(/^\s*/)[0];
            return `${indent}if (${match[1]} != null) {\n${line}\n${indent}}`;
          }
        }
        return line;
      });
    }
    // Pattern 4: SyntaxError / Missing parenthesis/bracket
    else if (errorLower.includes('syntaxerror') || errorLower.includes('unexpected token') || errorLower.includes('invalid syntax')) {
      rootCause = 'Syntax error detected. Code fails parsing due to mismatched brackets, quotes, or missing punctuation.';
      explanation = 'The compiler/interpreter encountered unexpected syntax structure that violates language grammar specifications.';
      fixSteps = [
        'Inspect brackets, parentheses, and quote matching.',
        'Check for missing colons, semicolons, or indentation.'
      ];
    }
    // Default fallback analysis
    else {
      rootCause = `Execution failed with message: "${error.slice(0, 150)}..."`;
      explanation = 'The error trace indicates a runtime exception during program execution.';
      fixSteps = [
        'Review the stack trace line numbers against the code.',
        'Validate input arguments and handle exceptions defensively.'
      ];
    }

    return {
      rootCause,
      explanation,
      fixSteps,
      fixedCode: fixedCodeLines.join('\n'),
      confidenceScore
    };
  }
}

module.exports = new AIService();
