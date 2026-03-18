import authService from '../../services/auth/auth.service.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { formatUser } from '../../utils/formatters.js';
import logger from '../../utils/logger.js';

/**
 * Auth Resolvers
 * Handles authentication and user management
 */
export default {
  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_, __, context) => {
      const user = requireAuth(context);
      return formatUser(user);
    },
  },

  Mutation: {
    /**
     * Register new user
     */
    register: async (_, { input }) => {
      try {
        logger.graphql('register', { email: input.email });

        const result = await authService.register(input);

        return {
          user: formatUser(result.user),
          token: result.token,
        };
      } catch (error) {
        logger.error('Register mutation failed:', error);
        throw error;
      }
    },

    /**
     * Login user
     */
    login: async (_, { input }) => {
      try {
        logger.graphql('login', { email: input.email });

        const result = await authService.login(input);

        return {
          user: formatUser(result.user),
          token: result.token,
        };
      } catch (error) {
        logger.error('Login mutation failed:', error);
        throw error;
      }
    },

    /**
     * Update user profile
     */
    updateProfile: async (_, { input }, context) => {
      const user = requireAuth(context);

      try {
        logger.graphql('updateProfile', input, user._id);

        const updatedUser = await authService.updateProfile(user._id, input);

        return formatUser(updatedUser);
      } catch (error) {
        logger.error('Update profile mutation failed:', error);
        throw error;
      }
    },
  },
};