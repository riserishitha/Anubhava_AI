import mongoose from 'mongoose';

/**
 * Roadmap Model Schema
 * Represents a personalized learning path
 */
const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    learningGoal: {
      type: String,
      required: true,
    },
    targetSkillLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
      },
    ],
    estimatedDuration: {
      weeks: {
        type: Number,
        required: true,
      },
      hours: {
        type: Number,
        required: true,
      },
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
      required: true,
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    learningOutcomes: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    generationMetadata: {
      aiModel: {
        type: String,
        default: 'gemini-pro',
      },
      promptVersion: String,
      generatedAt: {
        type: Date,
        default: Date.now,
      },
      baselineScore: Number,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
roadmapSchema.index({ userId: 1, status: 1 });
roadmapSchema.index({ createdAt: -1 });
roadmapSchema.index({ tags: 1 });

/**
 * Virtual: Total modules count
 */
roadmapSchema.virtual('totalModules').get(function () {
  return this.modules.length;
});

/**
 * Check if roadmap is active
 */
roadmapSchema.methods.isActive = function () {
  return this.status === 'ACTIVE';
};

/**
 * Mark roadmap as started
 */
roadmapSchema.methods.markStarted = function () {
  if (!this.startedAt) {
    this.startedAt = new Date();
    this.status = 'ACTIVE';
  }
  return this.save();
};

/**
 * Mark roadmap as completed
 */
roadmapSchema.methods.markCompleted = function () {
  this.completedAt = new Date();
  this.status = 'COMPLETED';
  return this.save();
};

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

export default Roadmap;