import mongoose from 'mongoose';

/**
 * Lesson Model Schema
 * Represents individual lessons within modules
 */
const lessonSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
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
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVIEW_NEEDED'],
      default: 'NOT_STARTED',
    },
    contentType: {
      type: String,
      enum: ['VIDEO', 'ARTICLE', 'INTERACTIVE', 'QUIZ', 'PROJECT', 'EXERCISE'],
      required: true,
    },
    content: {
      text: String,
      videoUrl: String,
      interactiveUrl: String,
      codeSnippets: [
        {
          language: String,
          code: String,
          explanation: String,
        },
      ],
      images: [
        {
          url: String,
          caption: String,
        },
      ],
    },
    estimatedMinutes: {
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
    keyTakeaways: {
      type: [String],
      default: [],
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
    },
    hasQuiz: {
      type: Boolean,
      default: false,
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    // Vector embedding metadata for RAG
    embeddingMetadata: {
      vectorId: String,
      embeddedAt: Date,
      version: String,
    },
    // Content chunks for RAG
    contentChunks: [
      {
        text: String,
        order: Number,
        vectorId: String,
      },
    ],
    resources: [
      {
        title: String,
        url: String,
        type: String,
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

// Indexes
lessonSchema.index({ moduleId: 1, order: 1 });
lessonSchema.index({ moduleId: 1, status: 1 });
lessonSchema.index({ 'embeddingMetadata.vectorId': 1 });

/**
 * Check if lesson is completed
 */
lessonSchema.methods.isCompleted = function () {
  return this.status === 'COMPLETED';
};

/**
 * Mark lesson as started
 */
lessonSchema.methods.markStarted = function () {
  if (!this.startedAt) {
    this.startedAt = new Date();
    this.status = 'IN_PROGRESS';
  }
  return this.save();
};

/**
 * Mark lesson as completed
 */
lessonSchema.methods.markCompleted = function () {
  this.completedAt = new Date();
  this.status = 'COMPLETED';
  return this.save();
};

/**
 * Get text content for embedding
 */
lessonSchema.methods.getTextForEmbedding = function () {
  const parts = [
    this.title,
    this.description,
    this.content.text || '',
    this.learningObjectives.join(' '),
    this.keyTakeaways.join(' '),
  ];

  return parts.filter(Boolean).join('\n\n');
};

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;