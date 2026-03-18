import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import { AuthenticationError } from '../utils/errors.js';
import User from '../models/User.model.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to context
 */
export const authenticate = async (req) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, isAuthenticated: false };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    return {
      user,
      isAuthenticated: true,
      userId: user._id,
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    }

    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired');
    }

    throw error;
  }
};

/**
 * Require authentication
 * Throws error if user is not authenticated
 */
export const requireAuth = (context) => {
  if (!context.isAuthenticated || !context.user) {
    throw new AuthenticationError('Authentication required');
  }
  return context.user;
};

/**
 * Optional authentication
 * Returns user if authenticated, null otherwise
 */
export const optionalAuth = (context) => {
  return context.isAuthenticated ? context.user : null;
};

export default {
  authenticate,
  requireAuth,
  optionalAuth,
};