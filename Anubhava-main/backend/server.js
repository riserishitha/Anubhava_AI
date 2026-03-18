import fetch, { Headers, Request, Response } from 'node-fetch';

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';

// Config imports
import config, { validateConfig } from './config/environment.js';
import database from './config/database.js';
import geminiConfig from './config/gemini.js';
import pineconeConfig from './config/pinecone.js';

// GraphQL imports
import schema from './graphql/schema.js';
import resolvers from './graphql/resolvers/index.js';

// Middleware imports
import { authenticate } from './middleware/auth.middleware.js';
import { errorHandler, notFoundHandler, formatError } from './middleware/errorHandler.js';
import { rateLimitMiddleware } from './middleware/rateLimiter.js';

// Utils
import logger from './utils/logger.js';

/**
 * Initialize Express App
 */
const app = express();
const httpServer = http.createServer(app);

/**
 * Middleware Setup
 */
// Security
app.use(helmet({
  contentSecurityPolicy: config.server.isProduction,
  crossOriginEmbedderPolicy: config.server.isProduction,
}));

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.server.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(rateLimitMiddleware);

/**
 * Health Check Endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const dbStatus = database.getStatus();
    const geminiHealth = await geminiConfig.healthCheck();
    const pineconeHealth = await pineconeConfig.healthCheck();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.env,
      services: {
        database: {
          status: dbStatus.isConnected ? 'healthy' : 'unhealthy',
          ...dbStatus,
        },
        gemini: geminiHealth,
        pinecone: pineconeHealth,
      },
    };

    const isHealthy = dbStatus.isConnected &&
                      geminiHealth.status === 'healthy' &&
                      pineconeHealth.status === 'healthy';

    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * Root Endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Powered Learning Path Generator API',
    version: '1.0.0',
    status: 'running',
    graphql: '/graphql',
    health: '/health',
  });
});

/**
 * Initialize Apollo Server
 */
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    formatError,
    introspection: config.server.isDevelopment,
  });

  await server.start();

  // Mount Apollo middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        // Authenticate user from request
        const authContext = await authenticate(req);

        return {
          req,
          res,
          ...authContext,
        };
      },
    })
  );

  logger.info('Apollo Server initialized');
}

/**
 * Initialize Application
 */
async function initialize() {
  try {
    logger.info('Initializing application...');

    // Validate environment variables
    validateConfig();
    logger.info('Environment configuration validated');

    // Connect to MongoDB
    await database.connect();
    logger.info('Database connected');

    // Initialize Gemini AI
    geminiConfig.initialize();
    logger.info('Gemini AI initialized');

    // Initialize Pinecone
    await pineconeConfig.initialize();
    logger.info('Pinecone initialized');

    // Start Apollo Server
    await startApolloServer();

    /**
     * 404 Handler (must be after all routes, including /graphql)
     */
    app.use(notFoundHandler);

    /**
     * Error Handler (must be last)
     */
    app.use(errorHandler);

    // Start Express server
    const PORT = config.server.port;
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${config.server.env}`);
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await database.disconnect();
  process.exit(0);
});

/**
 * Unhandled Rejection Handler
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

/**
 * Uncaught Exception Handler
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
initialize();

export default app;