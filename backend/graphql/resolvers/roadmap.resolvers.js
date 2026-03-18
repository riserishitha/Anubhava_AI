import roadmapEngine from '../../services/learning/roadmap.engine.js';
import progressEngine from '../../services/learning/progress.engine.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { formatRoadmap } from '../../utils/formatters.js';
import logger from '../../utils/logger.js';

import User from '../../models/User.model.js';
import Assessment from '../../models/Assessment.model.js';

export default {
  Query: {
    myRoadmap: async (_, __, context) => {
      const user = requireAuth(context);

      try {
        const { roadmap, progress } = await roadmapEngine.getRoadmapWithProgress(
          null,
          user._id
        );

        if (!roadmap) return null;

        return formatRoadmap(roadmap, progress);
      } catch (error) {
        logger.error('Get my roadmap failed:', error);
        throw error;
      }
    },

    getRoadmap: async (_, { id }, context) => {
      const user = requireAuth(context);

      try {
        const { roadmap, progress } = await roadmapEngine.getRoadmapWithProgress(
          id,
          user._id
        );
        return formatRoadmap(roadmap, progress);
      } catch (error) {
        logger.error('Get roadmap failed:', error);
        throw error;
      }
    },

    getModule: async (_, { id }, context) => {
      const user = requireAuth(context);

      try {
        const Module = (await import('../../models/Module.model.js')).default;
        const Progress = (await import('../../models/Progress.model.js')).default;
        
        const module = await Module.findById(id).populate('lessons');

        if (!module) throw new Error('Module not found');

        // Get user progress to calculate module progress
        const progress = await Progress.findOne({
          userId: user._id,
          roadmapId: module.roadmapId,
        });

        // Calculate module progress based on completed lessons
        let moduleProgress = 0;
        if (progress && module.lessons && module.lessons.length > 0) {
          const completedLessonsInModule = progress.completedLessons.filter((cl) =>
            module.lessons.some((l) => l._id.toString() === cl.lessonId.toString())
          ).length;
          moduleProgress = Math.round((completedLessonsInModule / module.lessons.length) * 100);
        }

        // Determine if module is unlocked
        const isUnlocked = module.status !== 'LOCKED';

        // Format and return module with progress
        return {
          id: module._id,
          title: module.title,
          description: module.description,
          order: module.order,
          status: module.status,
          lessons: module.lessons.map((lesson) => ({
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            contentType: lesson.contentType,
            estimatedMinutes: lesson.estimatedMinutes,
            difficulty: lesson.difficulty,
            status: lesson.status,
            learningObjectives: lesson.learningObjectives || [],
            keyTakeaways: lesson.keyTakeaways || [],
          })),
          estimatedHours: module.estimatedHours,
          difficulty: module.difficulty,
          learningObjectives: module.learningObjectives || [],
          isUnlocked,
          progress: moduleProgress,
        };
      } catch (error) {
        logger.error('Get module failed:', error);
        throw error;
      }
    },

    getLesson: async (_, { id }, context) => {
      requireAuth(context);

      try {
        const Lesson = (await import('../../models/Lesson.model.js')).default;
        const lesson = await Lesson.findById(id);

        if (!lesson) throw new Error('Lesson not found');
        return lesson;
      } catch (error) {
        logger.error('Get lesson failed:', error);
        throw error;
      }
    },
  },

  Mutation: {
    generateRoadmap: async (_, { input }, context) => {
      const user = requireAuth(context);

      try {
        logger.graphql('generateRoadmap', input, user._id);

        const createdRoadmap = await roadmapEngine.generateRoadmap({
          userId: user._id,
          learningGoal: input.learningGoal,
          skillLevel: input.skillLevel,
          duration: input.duration,
        });

        const { roadmap, progress } = await roadmapEngine.getRoadmapWithProgress(
          createdRoadmap._id,
          user._id
        );

        return formatRoadmap(roadmap, progress);
      } catch (error) {
        logger.error('Generate roadmap mutation failed:', error);
        throw error;
      }
    },

    /**
     * Generate roadmap strictly from the user's baseline quiz result + stored learning goal.
     * Frontend should call this immediately after baseline quiz completion.
     */
    generateRoadmapFromBaseline: async (_, { duration }, context) => {
      const authUser = requireAuth(context);

      try {
        const user = await User.findById(authUser._id);
        if (!user) throw new Error('User not found');

        if (!user.baselineAssessmentCompleted) {
          throw new Error('Baseline assessment not completed');
        }

        const learningGoal = user.learningGoals?.[0];
        if (!learningGoal) {
          throw new Error('User learning goal not set. Update profile with a learning goal first.');
        }

        const baseline = await Assessment.findOne({
          userId: user._id,
          type: 'BASELINE',
        }).sort({ createdAt: -1 });

        const lastAttempt = baseline?.attempts?.[baseline.attempts.length - 1];
        const baselineScore = lastAttempt?.percentage;

        if (typeof baselineScore !== 'number') {
          throw new Error('Baseline score not found. Please submit the baseline assessment first.');
        }

        const createdRoadmap = await roadmapEngine.generateRoadmap({
          userId: user._id,
          learningGoal,
          skillLevel: user.skillLevel, // derived from baseline by backend
          duration,
          baselineScore, // strictly from quiz
        });

        const { roadmap, progress } = await roadmapEngine.getRoadmapWithProgress(
          createdRoadmap._id,
          user._id
        );

        return formatRoadmap(roadmap, progress);
      } catch (error) {
        logger.error('generateRoadmapFromBaseline failed:', error);
        throw error;
      }
    },

    startRoadmap: async (_, { roadmapId }, context) => {
      const user = requireAuth(context);

      try {
        const Roadmap = (await import('../../models/Roadmap.model.js')).default;
        const roadmap = await Roadmap.findById(roadmapId);

        if (!roadmap) throw new Error('Roadmap not found');
        if (roadmap.userId.toString() !== user._id.toString()) throw new Error('Access denied');

        await roadmap.markStarted();

        await progressEngine.updateProgress({
          userId: user._id,
          roadmapId,
          event: 'ROADMAP_STARTED',
        });

        return roadmap;
      } catch (error) {
        logger.error('Start roadmap mutation failed:', error);
        throw error;
      }
    },
  },
};
