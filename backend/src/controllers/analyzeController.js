const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');
const storageService = require('../services/storageService');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Controller handling Code Analysis & Error Diagnostics
 */
const analyzeCode = async (req, res, next) => {
  try {
    const { code, error, language = 'auto' } = req.body;
    const id = `analysis-${uuidv4().slice(0, 8)}`;
    const timestamp = new Date().toISOString();

    logger.info(`Received analysis request [ID: ${id}]`, { language, codeLength: code.length, errorLength: error.length });

    // Call AI Service (Gemini API or Intelligent Fallback)
    const result = await aiService.analyzeCode({ code, error, language });

    const analysisPayload = {
      id,
      timestamp,
      input: {
        code,
        error,
        language
      },
      analysis: {
        rootCause: result.rootCause,
        explanation: result.explanation,
        fixSteps: result.fixSteps,
        fixedCode: result.fixedCode,
        confidenceScore: result.confidenceScore
      },
      metadata: result.metadata
    };

    // Save result to Cloud Storage / S3 abstraction layer
    const storageResult = await storageService.saveAnalysis(id, analysisPayload);

    logger.info(`Analysis completed successfully [ID: ${id}]`, { mode: result.metadata.mode, storage: storageResult.storage });

    return res.status(200).json({
      success: true,
      data: analysisPayload,
      storage: storageResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller handling System Health Check Endpoint
 */
const getHealth = async (req, res, next) => {
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    const storageStatus = storageService.getStorageStatus();

    const healthData = {
      status: 'UP',
      service: 'StackFix AI Engine API',
      version: '2.0.0',
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`
      },
      system: {
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      integrations: {
        geminiAi: {
          configured: Boolean(config.gemini.apiKey && config.gemini.apiKey !== 'your_gemini_api_key_here' && config.gemini.apiKey !== 'demo_key_placeholder'),
          model: config.gemini.model
        },
        cloudStorage: storageStatus
      }
    };

    return res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch analysis log history
 */
const getHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const history = await storageService.getRecentAnalyses(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch specific analysis log by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await storageService.getAnalysis(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Analysis record with ID '${id}' was not found.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  analyzeCode,
  getHealth,
  getHistory,
  getById
};
