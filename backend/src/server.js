const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: config.clientUrl === '*' ? true : [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  }
});

app.use('/api/', limiter);

// Request parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging middleware
app.use(loggerMiddleware);

// API Routes (Mounted at root and /api for convenience)
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Direct routes POST /analyze, GET /health

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if executed directly (not required in Jest tests)
if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info(`=======================================================`);
    logger.info(`  StackFix AI Backend Server Running on Port ${config.port}`);
    logger.info(`  Environment: ${config.env}`);
    logger.info(`  Health Endpoint: http://localhost:${config.port}/health`);
    logger.info(`  Analyze Endpoint: http://localhost:${config.port}/analyze`);
    logger.info(`=======================================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    logger.info('Received shutdown signal. Closing HTTP server gracefully...');
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
