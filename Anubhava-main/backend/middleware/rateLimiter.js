import { RateLimitError } from '../utils/errors.js';
import config from '../config/environment.js';

/**
 * Rate Limiter
 * In-memory rate limiting (use Redis in production)
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = config.rateLimit.windowMs;
    this.maxRequests = config.rateLimit.maxRequests;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request should be rate limited
   */
  check(identifier) {
    const now = Date.now();
    const key = identifier;

    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const timestamps = this.requests.get(key);

    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = validTimestamps[0];
      const retryAfter = Math.ceil((this.windowMs - (now - oldestTimestamp)) / 1000);
      throw new RateLimitError('Too many requests, please try again later', retryAfter);
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < this.windowMs
      );
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }
}

const rateLimiter = new RateLimiter();

/**
 * Express middleware for rate limiting
 */
export const rateLimitMiddleware = (req, res, next) => {
  try {
    // Use IP address as identifier
    const identifier = req.ip || req.connection.remoteAddress;
    rateLimiter.check(identifier);
    next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.set('Retry-After', error.retryAfter);
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        retryAfter: error.retryAfter,
      });
    }
    next(error);
  }
};

/**
 * GraphQL context rate limiting
 */
export const rateLimitGraphQL = (context) => {
  const identifier = context.req.ip || context.req.connection.remoteAddress;
  return rateLimiter.check(identifier);
};

export default {
  rateLimiter,
  rateLimitMiddleware,
  rateLimitGraphQL,
};