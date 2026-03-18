import ProgressEngine from '../../services/learning/progress.engine.js';
import { AuthenticationError, ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

export default {
  Query: {
    /**
     * Get current user's progress
     */
    myProgress: async (_, __, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const progress = await ProgressEngine.getUserProgress(context.user.id);

        if (!progress) {
          throw new ValidationError('No progress found. Please create a roadmap first.');
        }

        return progress;
      } catch (error) {
        logger.error('Error fetching user progress:', error);
        throw error;
      }
    },

    /**
     * Get progress for a specific roadmap
     */
    getProgress: async (_, { roadmapId }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        if (!roadmapId) {
          throw new ValidationError('Roadmap ID is required');
        }

        const progress = await ProgressEngine.getProgressByRoadmap(
          context.user.id,
          roadmapId
        );

        if (!progress) {
          throw new ValidationError('Progress not found for this roadmap');
        }

        return progress;
      } catch (error) {
        logger.error('Error fetching progress:', error);
        throw error;
      }
    },
  },

  Mutation: {
    /**
     * Mark a lesson as complete
     */
    markLessonComplete: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const { lessonId } = input;

        if (!lessonId) {
          throw new ValidationError('Lesson ID is required');
        }

        const progress = await ProgressEngine.markLessonComplete(
          context.user.id,
          lessonId
        );

        return progress;
      } catch (error) {
        logger.error('Error marking lesson complete:', error);
        throw error;
      }
    },

    /**
     * Record user activity for streak tracking
     */
    recordActivity: async (_, __, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const progress = await ProgressEngine.recordActivity(context.user.id);

        return progress;
      } catch (error) {
        logger.error('Error recording activity:', error);
        throw error;
      }
    },
  },

  Progress: {
    /**
     * Resolve completed modules with module names
     * Uses stored moduleName from DB, falls back to lookup if needed
     */
    completedModules: async (progress) => {
      try {
        if (!progress.completedModules || progress.completedModules.length === 0) {
          return [];
        }

        const Module = (await import('../../models/Module.model.js')).default;
        
        const enrichedModules = await Promise.all(
          progress.completedModules.map(async (cm) => {
            // Use stored name first, lookup if not available
            let moduleName = cm.moduleName;
            if (!moduleName) {
              const module = await Module.findById(cm.moduleId);
              moduleName = module?.title;
            }

            // Convert completedAt to ISO string (handle timestamps and Date objects)
            let completedAtISO = new Date().toISOString();
            if (cm.completedAt) {
              if (typeof cm.completedAt === 'string') {
                const timestamp = parseInt(cm.completedAt, 10);
                if (!isNaN(timestamp)) {
                  completedAtISO = new Date(timestamp).toISOString();
                } else {
                  completedAtISO = cm.completedAt;
                }
              } else {
                completedAtISO = new Date(cm.completedAt).toISOString();
              }
            }

            return {
              moduleId: cm.moduleId?.toString(),
              moduleName: moduleName || `Module ${cm.moduleId}`,
              completedAt: completedAtISO,
              score: cm.score || null,
            };
          })
        );
        return enrichedModules;
      } catch (error) {
        logger.error('Error resolving completed modules:', error);
        return progress.completedModules?.map(cm => {
          let completedAtISO = new Date().toISOString();
          if (cm.completedAt) {
            if (typeof cm.completedAt === 'string') {
              const timestamp = parseInt(cm.completedAt, 10);
              if (!isNaN(timestamp)) {
                completedAtISO = new Date(timestamp).toISOString();
              } else {
                completedAtISO = cm.completedAt;
              }
            } else {
              completedAtISO = new Date(cm.completedAt).toISOString();
            }
          }
          return {
            moduleId: cm.moduleId?.toString(),
            moduleName: cm.moduleName || `Module ${cm.moduleId}`,
            completedAt: completedAtISO,
            score: cm.score || null,
          };
        }) || [];
      }
    },

    /**
     * Resolve completed lessons with lesson names and details
     * Uses stored lessonName from DB, falls back to lookup if needed
     */
    completedLessons: async (progress) => {
      try {
        if (!progress.completedLessons || progress.completedLessons.length === 0) {
          return [];
        }

        const Lesson = (await import('../../models/Lesson.model.js')).default;
        
        const enrichedLessons = await Promise.all(
          progress.completedLessons.map(async (cl) => {
            // Use stored values first, lookup if not available
            let lessonName = cl.lessonName;
            let estimatedMinutes = cl.estimatedMinutes;

            if (!lessonName || !estimatedMinutes) {
              const lesson = await Lesson.findById(cl.lessonId);
              lessonName = lessonName || lesson?.title;
              estimatedMinutes = estimatedMinutes || lesson?.estimatedMinutes;
            }

            // Convert completedAt to ISO string (handle timestamps and Date objects)
            let completedAtISO = new Date().toISOString();
            if (cl.completedAt) {
              if (typeof cl.completedAt === 'string') {
                const timestamp = parseInt(cl.completedAt, 10);
                if (!isNaN(timestamp)) {
                  completedAtISO = new Date(timestamp).toISOString();
                } else {
                  completedAtISO = cl.completedAt;
                }
              } else {
                completedAtISO = new Date(cl.completedAt).toISOString();
              }
            }

            return {
              lessonId: cl.lessonId?.toString(),
              lessonName: lessonName || `Lesson ${cl.lessonId}`,
              estimatedMinutes: estimatedMinutes || 0,
              completedAt: completedAtISO,
            };
          })
        );
        return enrichedLessons;
      } catch (error) {
        logger.error('Error resolving completed lessons:', error);
        return progress.completedLessons?.map(cl => {
          let completedAtISO = new Date().toISOString();
          if (cl.completedAt) {
            if (typeof cl.completedAt === 'string') {
              const timestamp = parseInt(cl.completedAt, 10);
              if (!isNaN(timestamp)) {
                completedAtISO = new Date(timestamp).toISOString();
              } else {
                completedAtISO = cl.completedAt;
              }
            } else {
              completedAtISO = new Date(cl.completedAt).toISOString();
            }
          }
          return {
            lessonId: cl.lessonId?.toString(),
            lessonName: cl.lessonName || `Lesson ${cl.lessonId}`,
            estimatedMinutes: cl.estimatedMinutes || 0,
            completedAt: completedAtISO,
          };
        }) || [];
      }
    },
  },
};