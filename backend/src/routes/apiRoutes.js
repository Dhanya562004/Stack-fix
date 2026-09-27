const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const { validateAnalyzeInput } = require('../middleware/validationMiddleware');

// Health Check
router.get('/health', analyzeController.getHealth);

// Core Analysis Endpoint
router.post('/analyze', validateAnalyzeInput, analyzeController.analyzeCode);

// Log History & Single Retrieval Endpoints
router.get('/analyze/history', analyzeController.getHistory);
router.get('/analyze/:id', analyzeController.getById);

module.exports = router;
