import AssessmentEngine from '../../services/learning/assessment.engine.js';
import { AuthenticationError, ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

import roadmapEngine from '../../services/learning/roadmap.engine.js';
import { formatRoadmap } from '../../utils/formatters.js';

export default {
  Query: {
    /**
     * Get baseline assessment for new users
     */
    getBaselineAssessment: async (_, __, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const assessment = await AssessmentEngine.getOrCreateBaselineAssessment({
          userId: context.user.id,
        });

        return assessment;
      } catch (error) {
        logger.error('Error fetching baseline assessment:', error);
        throw error;
      }
    },

    /**
     * Get assessment for a specific module
     */
    getModuleAssessment: async (_, { moduleId }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        if (!moduleId) {
          throw new ValidationError('Module ID is required');
        }

        const assessment = await AssessmentEngine.getOrCreateModuleAssessment({
          userId: context.user.id,
          moduleId,
        });

        return assessment;
      } catch (error) {
        logger.error('Error fetching module assessment:', error);
        throw error;
      }
    },

    /**
     * Get assessment by ID
     */
    getAssessment: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        if (!id) {
          throw new ValidationError('Assessment ID is required');
        }

        const assessment = await AssessmentEngine.getAssessmentById({
          assessmentId: id,
          userId: context.user.id,
        });

        if (!assessment) {
          throw new ValidationError('Assessment not found');
        }

        return assessment;
      } catch (error) {
        logger.error('Error fetching assessment:', error);
        throw error;
      }
    },
  },

  Mutation: {
    /**
     * Submit assessment answers
     */
    submitAssessment: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const { assessmentId, answers } = input;

        if (!assessmentId || !answers || !answers.length) {
          throw new ValidationError('Assessment ID and answers are required');
        }

        const result = await AssessmentEngine.submitAssessment({
          assessmentId,
          userId: context.user.id,
          answers,
        });

        return result;
      } catch (error) {
        logger.error('Error submitting assessment:', error);
        throw error;
      }
    },

    /**
     * Submit baseline assessment + immediately generate personalized roadmap
     * This is the primary flow: Quiz → AI roadmap generation
     */
    submitAssessmentAndGenerateRoadmap: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const { assessmentId, answers, roadmapDuration } = input;

        if (!assessmentId || !answers || !answers.length) {
          throw new ValidationError('Assessment ID and answers are required');
        }

        if (!roadmapDuration || roadmapDuration < 1 || roadmapDuration > 52) {
          throw new ValidationError('Roadmap duration must be between 1 and 52 weeks');
        }

        // Step 1: Submit assessment
        const assessmentResult = await AssessmentEngine.submitAssessment({
          assessmentId,
          userId: context.user.id,
          answers,
        });

        // Step 2: Get updated user (now has skillLevel + baselineCompleted set)
        const User = (await import('../../models/User.model.js')).default;
        const user = await User.findById(context.user.id);

        if (!user) {
          throw new ValidationError('User not found');
        }

        const learningGoal = user.learningGoals?.[0];
        if (!learningGoal) {
          throw new ValidationError(
            'Learning goal not set. Please update your profile with a learning goal.'
          );
        }

        // Step 3: Generate roadmap using baseline score + user goal
        const createdRoadmap = await roadmapEngine.generateRoadmap({
          userId: user._id,
          learningGoal,
          skillLevel: user.skillLevel, // determined by baseline
          duration: roadmapDuration,
          baselineScore: assessmentResult.percentage, // from quiz
        });

        // Step 4: Fetch formatted roadmap with progress
        const { roadmap, progress } = await roadmapEngine.getRoadmapWithProgress(
          createdRoadmap._id,
          user._id
        );

        logger.info('Baseline + roadmap generation completed', {
          userId: user._id,
          assessmentId,
          percentage: assessmentResult.percentage,
          roadmapId: createdRoadmap._id,
        });

        return {
          assessmentResult,
          roadmap: formatRoadmap(roadmap, progress),
        };
      } catch (error) {
        logger.error('Error submitting assessment and generating roadmap:', error);
        throw error;
      }
    },
  },
};