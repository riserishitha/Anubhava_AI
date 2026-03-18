import logger from '../utils/logger.js';
import { formatGraphQLError, isOperationalError } from '../utils/errors.js';

/**
 * Global Error Handler
 * Catches and formats errors for GraphQL and Express
 */
export const errorHandler = (error, req, res, next) => {
  // Log error
  logger.error('Error occurred:', error);

  // Check if error is operational (expected)
  const isOperational = isOperationalError(error);

  // In production, don't expose internal errors
  if (!isOperational && process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        name: 'InternalServerError',
      },
    });
  }

  // Send error response
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    error: {
      name: error.name,
      ...(error.details && { details: error.details }),
      ...(error.code && { code: error.code }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

/**
 * GraphQL Error Formatter
 * Formats errors for Apollo Server
 */
export const formatError = (formattedError, error) => {
  // Log the error
  logger.error('GraphQL Error:', error);

  // Use custom error formatting
  if (error.originalError) {
    const formatted = formatGraphQLError(error.originalError);
    return {
      ...formattedError,
      message: formatted.message,
      extensions: {
        ...formattedError.extensions,
        code: formatted.name,
        statusCode: formatted.statusCode,
        ...(formatted.details && { details: formatted.details }),
      },
    };
  }

  return formattedError;
};

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler
 * Handles 404 errors
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      name: 'NotFoundError',
      path: req.originalUrl,
    },
  });
};

export default {
  errorHandler,
  formatError,
  asyncHandler,
  notFoundHandler,
};