import mongoose from 'mongoose';

/**
 * Progress Model Schema
 * Tracks user progress through roadmaps
 */
const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
      index: true,
    },
    currentModuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    currentLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    completedModules: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Module',
        },
        moduleName: String,
        completedAt: {
          type: Date,
          default: () => new Date(),
        },
        score: Number,
      },
    ],
    completedLessons: [
      {
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lesson',
        },
        lessonName: String,
        estimatedMinutes: Number,
        completedAt: {
          type: Date,
          default: () => new Date(),
        },
      },
    ],
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    streak: {
      current: {
        type: Number,
        default: 0,
      },
      longest: {
        type: Number,
        default: 0,
      },
      lastActivityDate: Date,
    },
    dailyProgress: [
      {
        date: {
          type: Date,
          required: true,
        },
        lessonsCompleted: {
          type: Number,
          default: 0,
        },
        quizzesTaken: {
          type: Number,
          default: 0,
        },
      },
    ],
    achievements: [
      {
        type: {
          type: String,
          enum: [
            'FIRST_LESSON',
            'FIRST_MODULE',
            'WEEK_STREAK',
            'MONTH_STREAK',
            'PERFECT_QUIZ',
            'FAST_LEARNER',
            'PERSISTENT',
            'COMPLETE_ROADMAP',
          ],
        },
        achievedAt: {
          type: Date,
          default: Date.now,
        },
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
    nextAction: {
      type: String,
      enum: [
        'START_BASELINE',
        'CONTINUE_LESSON',
        'TAKE_QUIZ',
        'REVIEW_MODULE',
        'START_NEXT_MODULE',
        'COMPLETE_ASSESSMENT',
        'REMEDIATE',
      ],
      default: 'START_BASELINE',
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
    estimatedCompletionDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
progressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });
progressSchema.index({ userId: 1, isActive: 1 });
progressSchema.index({ lastActivityDate: -1 });

/**
 * Virtual: Is module completed
 */
progressSchema.methods.isModuleCompleted = function (moduleId) {
  return this.completedModules.some(
    (m) => m.moduleId.toString() === moduleId.toString()
  );
};

/**
 * Virtual: Is lesson completed
 */
progressSchema.methods.isLessonCompleted = function (lessonId) {
  return this.completedLessons.some(
    (l) => l.lessonId.toString() === lessonId.toString()
  );
};

/**
 * Add completed lesson
 */
progressSchema.methods.addCompletedLesson = async function (lessonId) {
  if (!this.isLessonCompleted(lessonId)) {
    const Lesson = (await import('./Lesson.model.js')).default;
    const lesson = await Lesson.findById(lessonId);
    
    this.completedLessons.push({
      lessonId,
      lessonName: lesson?.title,
      estimatedMinutes: lesson?.estimatedMinutes,
      completedAt: new Date(),
    });
    this.lastActivityDate = new Date();
  }
  return this.save();
};

/**
 * Add completed module
 */
progressSchema.methods.addCompletedModule = async function (moduleId, score = null) {
  if (!this.isModuleCompleted(moduleId)) {
    const Module = (await import('./Module.model.js')).default;
    const module = await Module.findById(moduleId);
    
    this.completedModules.push({
      moduleId,
      moduleName: module?.title,
      completedAt: new Date(),
      score,
    });
    this.lastActivityDate = new Date();
  }
  return this.save();
};

/**
 * Update streak
 */
progressSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = this.streak.lastActivityDate
    ? new Date(this.streak.lastActivityDate)
    : null;

  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);

    const dayDifference = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDifference === 0) {
      // Same day, no change
      return;
    } else if (dayDifference === 1) {
      // Consecutive day, increment streak
      this.streak.current += 1;
    } else {
      // Streak broken, reset
      this.streak.current = 1;
    }
  } else {
    // First activity
    this.streak.current = 1;
  }

  // Update longest streak
  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
  }

  this.streak.lastActivityDate = new Date();
};

/**
 * Add achievement
 */
progressSchema.methods.addAchievement = function (type, metadata = {}) {
  const exists = this.achievements.some((a) => a.type === type);
  if (!exists) {
    this.achievements.push({ type, metadata });
  }
  return this.save();
};

/**
 * Record daily progress
 */
progressSchema.methods.recordDailyProgress = function (data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingIndex = this.dailyProgress.findIndex((dp) => {
    const dpDate = new Date(dp.date);
    dpDate.setHours(0, 0, 0, 0);
    return dpDate.getTime() === today.getTime();
  });

  if (existingIndex >= 0) {
    this.dailyProgress[existingIndex].lessonsCompleted += data.lessonsCompleted || 0;
    this.dailyProgress[existingIndex].quizzesTaken += data.quizzesTaken || 0;
  } else {
    this.dailyProgress.push({
      date: today,
      lessonsCompleted: data.lessonsCompleted || 0,
      quizzesTaken: data.quizzesTaken || 0,
    });
  }

  return this.save();
};

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;