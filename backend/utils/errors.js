/**
 * Custom Error Classes
 * Structured error handling with specific error types
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * AI Service Error (503)
 */
export class AIServiceError extends AppError {
  constructor(message = 'AI service unavailable', service = 'Unknown') {
    super(message, 503);
    this.name = 'AIServiceError';
    this.service = service;
  }
}

/**
 * Vector DB Error (503)
 */
export class VectorDBError extends AppError {
  constructor(message = 'Vector database operation failed') {
    super(message, 503);
    this.name = 'VectorDBError';
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Business Logic Error (422)
 */
export class BusinessLogicError extends AppError {
  constructor(message, code = null) {
    super(message, 422);
    this.name = 'BusinessLogicError';
    this.code = code;
  }
}

/**
 * External Service Error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service = 'External service', message = 'Service unavailable') {
    super(message, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Error formatter for GraphQL responses
 */
export const formatGraphQLError = (error) => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      name: error.name,
      ...(error.details && { details: error.details }),
      ...(error.code && { code: error.code }),
    };
  }

  // Unknown errors - don't expose internal details in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An unexpected error occurred',
      statusCode: 500,
      name: 'InternalServerError',
    };
  }

  return {
    message: error.message,
    statusCode: 500,
    name: error.name || 'Error',
  };
};

/**
 * Check if error is operational (expected) or programming error
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  AIServiceError,
  VectorDBError,
  RateLimitError,
  BusinessLogicError,
  ExternalServiceError,
  formatGraphQLError,
  isOperationalError,
};