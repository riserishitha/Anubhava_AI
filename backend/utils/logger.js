/**
 * Centralized Logger
 * Production-ready logging with different levels
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'INFO';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format log message with timestamp and level
   */
  format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      message,
      ...meta,
    };

    if (this.isDevelopment) {
      return JSON.stringify(logObject, null, 2);
    }

    return JSON.stringify(logObject);
  }

  /**
   * Log error messages
   */
  error(message, errorOrMeta = null) {
    // Backwards compatible:
    // - If passed an Error, log its message/stack.
    // - If passed an object, treat it as metadata (useful for structured logs).
    let meta = {};

    if (errorOrMeta instanceof Error) {
      meta = {
        error: {
          message: errorOrMeta.message,
          stack: errorOrMeta.stack,
          name: errorOrMeta.name,
        },
      };
    } else if (errorOrMeta) {
      meta = errorOrMeta;
    }

    console.error(this.format(LOG_LEVELS.ERROR, message, meta));
  }

  /**
   * Log warning messages
   */
  warn(message, meta = {}) {
    console.warn(this.format(LOG_LEVELS.WARN, message, meta));
  }

  /**
   * Log info messages
   */
  info(message, meta = {}) {
    console.log(this.format(LOG_LEVELS.INFO, message, meta));
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.log(this.format(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /**
   * Log GraphQL operations
   */
  graphql(operation, variables = {}, userId = null) {
    this.info('GraphQL Operation', {
      operation,
      variables,
      userId,
      type: 'GRAPHQL',
    });
  }

  /**
   * Log AI service calls
   */
  ai(service, prompt, responseTime = null) {
    this.info('AI Service Call', {
      service,
      promptLength: prompt.length,
      responseTime,
      type: 'AI',
    });
  }

  /**
   * Log database operations
   */
  database(operation, collection, query = {}) {
    this.debug('Database Operation', {
      operation,
      collection,
      query,
      type: 'DATABASE',
    });
  }

  /**
   * Log authentication events
   */
  auth(event, userId = null, success = true) {
    this.info('Authentication Event', {
      event,
      userId,
      success,
      type: 'AUTH',
    });
  }
}

export default new Logger();