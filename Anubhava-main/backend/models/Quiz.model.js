import mongoose from 'mongoose';

/**
 * Quiz Model Schema
 * Represents quizzes within lessons
 */
const quizSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    questions: [
      {
        questionId: {
          type: String,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODE_SNIPPET'],
          required: true,
        },
        options: [String],
        correctAnswer: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        points: {
          type: Number,
          default: 1,
        },
        explanation: String,
      },
    ],
    passingScore: {
      type: Number,
      default: 70,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
quizSchema.index({ lessonId: 1 });

/**
 * Calculate total marks
 */
quizSchema.methods.getTotalMarks = function () {
  return this.questions.reduce((total, q) => total + q.points, 0);
};

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;