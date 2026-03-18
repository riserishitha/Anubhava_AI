import jwt from 'jsonwebtoken';
import config from '../../config/environment.js';
import User from '../../models/User.model.js';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '../../utils/errors.js';
import {
  validateEmail,
  validatePassword,
  validateName,
} from '../../utils/validators.js';
import logger from '../../utils/logger.js';

/**
 * Authentication Service
 * Handles user registration, login, and token management
 */
class AuthService {
  /**
   * Register new user
   */
  async register({ email, password, firstName, lastName, learningGoal }) {
    try {
      // Validate inputs
      const validatedEmail = validateEmail(email);
      validatePassword(password);
      const validatedFirstName = validateName(firstName, 'First name');
      const validatedLastName = validateName(lastName, 'Last name');

      if (!learningGoal || learningGoal.trim().length < 10) {
        throw new ValidationError('Learning goal is required (minimum 10 characters)');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: validatedEmail });
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user
      const user = await User.create({
        email: validatedEmail,
        password, // Will be hashed by pre-save hook
        firstName: validatedFirstName,
        lastName: validatedLastName,
        learningGoals: [learningGoal.trim()], // Store learning goal
      });

      // Generate token
      const token = this.generateToken(user._id);

      logger.auth('USER_REGISTERED', user._id, true);

      return {
        user,
        token,
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login({ email, password }) {
    try {
      // Validate inputs
      const validatedEmail = validateEmail(email);

      if (!password) {
        throw new ValidationError('Password is required');
      }

      // Find user with password field
      const user = await User.findOne({ email: validatedEmail }).select('+password');

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        logger.auth('LOGIN_FAILED', user._id, false);
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      logger.auth('USER_LOGGED_IN', user._id, true);

      return {
        user,
        token,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get user failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Update allowed fields
      const allowedFields = [
        'firstName',
        'lastName',
        'learningGoals',
        'skillLevel',
        'preferences',
        'profile',
      ];

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          user[field] = updates[field];
        }
      });

      await user.save();

      logger.info('User profile updated', { userId });

      return user;
    } catch (error) {
      logger.error('Update profile failed:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}

export default new AuthService();