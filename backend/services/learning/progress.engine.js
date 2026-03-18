import Progress from '../../models/Progress.model.js';
import Module from '../../models/Module.model.js';
import Lesson from '../../models/Lesson.model.js';
import Roadmap from '../../models/Roadmap.model.js';
import {
  PROGRESS_EVENTS,
  NEXT_ACTIONS,
  ACHIEVEMENTS,
  MILESTONES,
} from '../../constants/index.js';
import { BusinessLogicError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/**
 * Progress Engine
 * Tracks user progress and determines next actions
 * Handles module unlocking and achievement tracking
 */
class ProgressEngine {
  /**
   * Update progress after an action
   */
  async updateProgress({ userId, roadmapId, event, data = {} }) {
    try {
      logger.info('Updating progress', { userId, roadmapId, event });

      let progress = await Progress.findOne({ userId, roadmapId });

      if (!progress) {
        progress = await Progress.create({
          userId,
          roadmapId,
          completionPercentage: 0,
          totalTimeSpent: 0,
          nextAction: NEXT_ACTIONS.START_BASELINE,
        });
      }

      // Update streak
      progress.updateStreak();

      // Handle different events
      switch (event) {
        case PROGRESS_EVENTS.LESSON_COMPLETED:
          await this.handleLessonCompleted(progress, data);
          break;

        case PROGRESS_EVENTS.QUIZ_PASSED:
          await this.handleQuizPassed(progress, data);
          break;

        case PROGRESS_EVENTS.MODULE_COMPLETED:
          await this.handleModuleCompleted(progress, data);
          break;

        case PROGRESS_EVENTS.QUIZ_FAILED:
          await this.handleQuizFailed(progress, data);
          break;

        default:
          logger.warn('Unknown progress event', { event });
      }

      // Recalculate completion percentage
      await this.calculateCompletionPercentage(progress);

      // Determine next action
      await this.determineNextAction(progress);

      // Check for achievements
      await this.checkAchievements(progress);

      // Save progress
      await progress.save();

      logger.info('Progress updated', {
        userId,
        roadmapId,
        completionPercentage: progress.completionPercentage,
        nextAction: progress.nextAction,
      });

      return progress;
    } catch (error) {
      logger.error('Progress update failed:', error);
      throw error;
    }
  }

  /**
   * Handle lesson completed event
   */
  async handleLessonCompleted(progress, data) {
    const { lessonId } = data;

    // Add to completed lessons
    await progress.addCompletedLesson(lessonId);

    // Update current lesson
    progress.currentLessonId = null;

    // Record daily progress
    await progress.recordDailyProgress({
      lessonsCompleted: 1,
    });

    logger.debug('Lesson completed handled', { lessonId });
  }

  /**
   * Handle quiz passed event
   */
  async handleQuizPassed(progress, data) {
    const { lessonId, score } = data;

    // Record daily progress
    await progress.recordDailyProgress({
      quizzesTaken: 1,
    });

    // Check for perfect quiz achievement
    if (score === 100) {
      await progress.addAchievement(ACHIEVEMENTS.PERFECT_QUIZ, { lessonId, score });
    }

    logger.debug('Quiz passed handled', { lessonId, score });
  }

  /**
   * Handle quiz failed event
   */
  async handleQuizFailed(progress, data) {
    const { lessonId, score } = data;

    // Set next action to remediate
    progress.nextAction = NEXT_ACTIONS.REMEDIATE;

    logger.debug('Quiz failed handled', { lessonId, score });
  }

  /**
   * Handle module completed event
   */
  async handleModuleCompleted(progress, data) {
    const { moduleId, score } = data;

    // Add to completed modules
    await progress.addCompletedModule(moduleId, score);

    // Unlock next module
    await this.unlockNextModule(progress);

    // Check for first module achievement
    if (progress.completedModules.length === 1) {
      await progress.addAchievement(ACHIEVEMENTS.FIRST_MODULE, { moduleId });
    }

    logger.debug('Module completed handled', { moduleId, score });
  }

  /**
   * Unlock next module
   */
  async unlockNextModule(progress) {
    try {
      const roadmap = await Roadmap.findById(progress.roadmapId).populate('modules');

      if (!roadmap) {
        throw new BusinessLogicError('Roadmap not found');
      }

      // Find next locked module
      const modules = await Module.find({ roadmapId: roadmap._id }).sort({ order: 1 });

      for (const module of modules) {
        if (module.status === 'LOCKED') {
          // Check unlock conditions
          const canUnlock = await this.checkUnlockConditions(module, progress);

          if (canUnlock) {
            await module.unlock();
            progress.currentModuleId = module._id;

            logger.info('Module unlocked', {
              moduleId: module._id,
              moduleTitle: module.title,
            });

            break;
          }
        }
      }
    } catch (error) {
      logger.error('Unlock next module failed:', error);
      throw error;
    }
  }

  /**
   * Check if module can be unlocked
   */
  async checkUnlockConditions(module, progress) {
    const unlockRules = module.unlockRules;

    switch (unlockRules.type) {
      case 'SEQUENTIAL':
        // Check if previous module is completed
        if (module.order === 0) {
          return true; // First module always unlockable
        }

        // Find previous module
        const previousModule = await Module.findOne({
          roadmapId: module.roadmapId,
          order: module.order - 1,
        });

        if (previousModule) {
          return progress.isModuleCompleted(previousModule._id);
        }

        return false;

      case 'SCORE_BASED':
        // Check if previous modules have minimum score
        if (unlockRules.requiredScore) {
          const completedModules = progress.completedModules;
          const avgScore =
            completedModules.reduce((sum, m) => sum + (m.score || 0), 0) /
            completedModules.length;
          return avgScore >= unlockRules.requiredScore;
        }
        return true;

      case 'TIME_BASED':
        // Check if enough time has passed
        if (unlockRules.unlockAfterDays) {
          const roadmap = await Roadmap.findById(module.roadmapId);
          const daysPassed = Math.floor(
            (new Date() - roadmap.startedAt) / (1000 * 60 * 60 * 24)
          );
          return daysPassed >= unlockRules.unlockAfterDays;
        }
        return true;

      case 'MANUAL':
        // Requires manual unlock (admin action)
        return false;

      default:
        return true;
    }
  }

  /**
   * Calculate completion percentage
   */
  async calculateCompletionPercentage(progress) {
    try {
      const roadmap = await Roadmap.findById(progress.roadmapId).populate({
        path: 'modules',
        populate: {
          path: 'lessons',
        },
      });

      if (!roadmap || !roadmap.modules) {
        progress.completionPercentage = 0;
        return;
      }

      // Calculate total lessons
      const totalLessons = roadmap.modules.reduce(
        (sum, module) => sum + (module.lessons?.length || 0),
        0
      );

      if (totalLessons === 0) {
        progress.completionPercentage = 0;
        return;
      }

      // Calculate completed lessons
      const completedLessons = progress.completedLessons.length;

      // Calculate percentage
      progress.completionPercentage = Math.round((completedLessons / totalLessons) * 100);

      // Check for milestone achievements
      await this.checkMilestones(progress);

      logger.debug('Completion percentage calculated', {
        completedLessons,
        totalLessons,
        percentage: progress.completionPercentage,
      });
    } catch (error) {
      logger.error('Calculate completion percentage failed:', error);
      progress.completionPercentage = 0;
    }
  }

  /**
   * Check for milestone achievements
   */
  async checkMilestones(progress) {
    const percentage = progress.completionPercentage;

    if (percentage >= MILESTONES.COMPLETE && !progress.achievements.some(a => a.type === ACHIEVEMENTS.COMPLETE_ROADMAP)) {
      await progress.addAchievement(ACHIEVEMENTS.COMPLETE_ROADMAP, { percentage });
    } else if (percentage >= MILESTONES.THREE_QUARTER) {
      // Could add three-quarter achievement
    } else if (percentage >= MILESTONES.HALF) {
      // Could add half-way achievement
    }
  }

  /**
   * Determine next action
   */
  async determineNextAction(progress) {
    try {
      // Check if roadmap is complete
      if (progress.completionPercentage >= 100) {
        progress.nextAction = NEXT_ACTIONS.COMPLETE_ASSESSMENT;
        return;
      }

      // Check if there's a current lesson
      if (progress.currentLessonId) {
        progress.nextAction = NEXT_ACTIONS.CONTINUE_LESSON;
        return;
      }

      // Check if there's a current module
      if (progress.currentModuleId) {
        const module = await Module.findById(progress.currentModuleId).populate('lessons');

        if (module) {
          // Find next incomplete lesson
          for (const lesson of module.lessons) {
            if (!progress.isLessonCompleted(lesson._id)) {
              progress.currentLessonId = lesson._id;
              progress.nextAction = NEXT_ACTIONS.CONTINUE_LESSON;
              return;
            }
          }

          // All lessons complete, take module assessment
          if (module.assessmentRequired && module.assessmentId) {
            progress.nextAction = NEXT_ACTIONS.TAKE_QUIZ;
            return;
          }
        }
      }

      // No current module, start next unlocked module
      progress.nextAction = NEXT_ACTIONS.START_NEXT_MODULE;
    } catch (error) {
      logger.error('Determine next action failed:', error);
      progress.nextAction = NEXT_ACTIONS.CONTINUE_LESSON;
    }
  }

  /**
   * Check for achievements
   */
  async checkAchievements(progress) {
    // Check for first lesson
    if (progress.completedLessons.length === 1) {
      await progress.addAchievement(ACHIEVEMENTS.FIRST_LESSON);
    }

    // Check for streaks
    if (progress.streak.current === 7) {
      await progress.addAchievement(ACHIEVEMENTS.WEEK_STREAK);
    }

    if (progress.streak.current === 30) {
      await progress.addAchievement(ACHIEVEMENTS.MONTH_STREAK);
    }

    logger.debug('Achievements checked', {
      achievementsCount: progress.achievements.length,
    });
  }

  /**
   * Get progress summary
   */
  async getProgressSummary({ userId, roadmapId }) {
    try {
      const progress = await Progress.findOne({ userId, roadmapId })
        .populate('currentModuleId')
        .populate('currentLessonId')
        .populate({
          path: 'completedModules.moduleId',
          select: 'title description',
        });

      if (!progress) {
        throw new BusinessLogicError('Progress not found');
      }

      return progress;
    } catch (error) {
      logger.error('Get progress summary failed:', error);
      throw error;
    }
  }

  /**
   * Resolver helper: get progress for the user's latest roadmap
   */
  async getUserProgress(userId) {
    const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
    if (!roadmap) return null;

    const progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
    return progress;
  }

  /**
   * Resolver helper: get progress for a specific roadmap
   */
  async getProgressByRoadmap(userId, roadmapId) {
    return Progress.findOne({ userId, roadmapId });
  }

  /**
   * Resolver helper: mark a lesson complete and update progress
   */
  async markLessonComplete(userId, lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new BusinessLogicError('Lesson not found');
    }

    // Update lesson status to COMPLETED
    lesson.status = 'COMPLETED';
    await lesson.save();

    const module = await Module.findById(lesson.moduleId);
    if (!module) {
      throw new BusinessLogicError('Module not found');
    }

    const roadmapId = module.roadmapId;

    // Get progress record
    let progress = await Progress.findOne({ userId, roadmapId });
    if (!progress) {
      progress = await Progress.create({
        userId,
        roadmapId,
        completionPercentage: 0,
      });
    }

    // Add completed lesson with name and estimated minutes
    await progress.addCompletedLesson(lessonId);

    // Check if all lessons in module are completed
    const moduleWithLessons = await Module.findById(lesson.moduleId).populate('lessons');
    const allLessonsCompleted = moduleWithLessons.lessons.every(l => l.status === 'COMPLETED');
    
    if (allLessonsCompleted) {
      // Mark module as completed
      module.status = 'COMPLETED';
      module.completedAt = new Date();
      await module.save();

      // Add completed module with name
      await progress.addCompletedModule(module._id, null);

      // Update completion percentage
      await this.calculateCompletionPercentage(progress);

      // Unlock next module if exists
      const nextModule = await Module.findOne({
        roadmapId,
        order: module.order + 1,
      });

      if (nextModule) {
        nextModule.status = 'UNLOCKED';
        await nextModule.save();
        logger.info('Next module unlocked', { moduleId: nextModule._id, userId });
      }
    }

    // Record daily activity
    const today = new Date().toISOString().split('T')[0];
    const dailyProgressEntry = progress.dailyProgress.find(
      (dp) => dp.date.toISOString().split('T')[0] === today
    );

    if (!dailyProgressEntry) {
      progress.dailyProgress.push({
        date: new Date(),
        lessonsCompleted: 1,
        quizzesTaken: 0,
      });
    } else {
      dailyProgressEntry.lessonsCompleted = (dailyProgressEntry.lessonsCompleted || 0) + 1;
    }

    // Update streak
    progress.updateStreak();

    // Recalculate completion percentage
    await this.calculateCompletionPercentage(progress);

    // Save progress
    await progress.save();

    return progress;
  }

  /**
   * Resolver helper: record activity (streak tracking)
   */
  async recordActivity(userId) {
    const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
    if (!roadmap) {
      throw new BusinessLogicError('No roadmap found. Please create a roadmap first.');
    }

    let progress = await Progress.findOne({ userId, roadmapId: roadmap._id });

    if (!progress) {
      progress = await Progress.create({
        userId,
        roadmapId: roadmap._id,
        completionPercentage: 0,
        totalTimeSpent: 0,
        nextAction: NEXT_ACTIONS.START_BASELINE,
      });
    }

    progress.updateStreak();
    progress.lastActivityDate = new Date();
    await progress.save();

    return progress;
  }
}

export default new ProgressEngine();