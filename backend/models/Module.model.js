import mongoose from 'mongoose';

/**
 * Module Model Schema
 * Represents a module within a roadmap
 */
const moduleSchema = new mongoose.Schema(
  {
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'LOCKED',
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    estimatedHours: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
      required: true,
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    unlockRules: {
      type: {
        type: String,
        enum: ['SEQUENTIAL', 'SCORE_BASED', 'TIME_BASED', 'MANUAL'],
        default: 'SEQUENTIAL',
      },
      requiredScore: Number,
      unlockAfterDays: Number,
      previousModuleId: mongoose.Schema.Types.ObjectId,
    },
    assessmentRequired: {
      type: Boolean,
      default: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
    },
    resources: [
      {
        title: String,
        type: {
          type: String,
          enum: ['ARTICLE', 'VIDEO', 'DOCUMENTATION', 'TOOL', 'OTHER'],
        },
        url: String,
        description: String,
      },
    ],
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
moduleSchema.index({ roadmapId: 1, order: 1 });
moduleSchema.index({ roadmapId: 1, status: 1 });

/**
 * Virtual: Total lessons count
 */
moduleSchema.virtual('totalLessons').get(function () {
  return this.lessons.length;
});

/**
 * Check if module is unlocked
 */
moduleSchema.methods.isUnlocked = function () {
  return this.status !== 'LOCKED';
};

/**
 * Unlock module
 */
moduleSchema.methods.unlock = function () {
  if (this.status === 'LOCKED') {
    this.status = 'UNLOCKED';
  }
  return this.save();
};

/**
 * Mark module as started
 */
moduleSchema.methods.markStarted = function () {
  if (!this.startedAt) {
    this.startedAt = new Date();
    this.status = 'IN_PROGRESS';
  }
  return this.save();
};

/**
 * Mark module as completed
 */
moduleSchema.methods.markCompleted = function () {
  this.completedAt = new Date();
  this.status = 'COMPLETED';
  return this.save();
};

const Module = mongoose.model('Module', moduleSchema);

export default Module;