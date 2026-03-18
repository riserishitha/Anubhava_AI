import mongoose from 'mongoose';

/**
 * Assessment Model Schema
 * Represents assessments (baseline, module, final)
 */
const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    type: {
      type: String,
      enum: ['BASELINE', 'MODULE_PRE', 'MODULE_POST', 'QUIZ', 'FINAL'],
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
        difficulty: {
          type: String,
          enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
          default: 'INTERMEDIATE',
        },
        topic: String,
        explanation: String,
      },
    ],
    totalMarks: {
      type: Number,
      required: true,
    },
    passingScore: {
      type: Number,
      required: true,
      default: 70,
    },
    timeLimit: {
      type: Number, // in minutes
      default: 30,
    },
    attempts: [
      {
        attemptNumber: Number,
        startedAt: Date,
        submittedAt: Date,
        answers: [
          {
            questionId: String,
            selectedOption: mongoose.Schema.Types.Mixed,
            isCorrect: Boolean,
            points: Number,
          },
        ],
        score: Number,
        percentage: Number,
        passed: Boolean,
        timeTaken: Number, // in minutes
      },
    ],
    maxAttempts: {
      type: Number,
      default: 3,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    generationMetadata: {
      aiModel: String,
      promptVersion: String,
      generatedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
assessmentSchema.index({ userId: 1, type: 1 });
assessmentSchema.index({ roadmapId: 1, type: 1 });
assessmentSchema.index({ moduleId: 1 });
assessmentSchema.index({ createdAt: -1 });

/**
 * Virtual: Total attempts count
 */
assessmentSchema.virtual('totalAttempts').get(function () {
  return this.attempts.length;
});

/**
 * Virtual: Best score
 */
assessmentSchema.virtual('bestScore').get(function () {
  if (this.attempts.length === 0) return 0;
  return Math.max(...this.attempts.map((a) => a.percentage));
});

/**
 * Virtual: Has passed
 */
assessmentSchema.virtual('hasPassed').get(function () {
  return this.attempts.some((a) => a.passed);
});

/**
 * Check if user can attempt
 */
assessmentSchema.methods.canAttempt = function () {
  return this.isActive && this.attempts.length < this.maxAttempts;
};

/**
 * Add attempt
 */
assessmentSchema.methods.addAttempt = function (attemptData) {
  this.attempts.push({
    attemptNumber: this.attempts.length + 1,
    ...attemptData,
  });
  return this.save();
};

/**
 * Evaluate answers
 */
assessmentSchema.methods.evaluateAnswers = function (userAnswers) {
  let totalScore = 0;
  let correctCount = 0;

  const evaluatedAnswers = userAnswers.map((userAnswer) => {
    const question = this.questions.find(
      (q) => q.questionId === userAnswer.questionId
    );

    if (!question) {
      return {
        questionId: userAnswer.questionId,
        isCorrect: false,
        points: 0,
      };
    }

    const isCorrect = this.checkAnswer(
      question,
      userAnswer.selectedOption || userAnswer.answer
    );

    const points = isCorrect ? question.points : 0;

    if (isCorrect) correctCount++;
    totalScore += points;

    return {
      questionId: userAnswer.questionId,
      selectedOption: userAnswer.selectedOption || userAnswer.answer,
      isCorrect,
      points,
    };
  });

  const percentage = (totalScore / this.totalMarks) * 100;
  const passed = percentage >= this.passingScore;

  return {
    answers: evaluatedAnswers,
    score: totalScore,
    percentage: Math.round(percentage),
    passed,
    correctCount,
    totalQuestions: this.questions.length,
  };
};

/**
 * Check if answer is correct
 */
assessmentSchema.methods.checkAnswer = function (question, userAnswer) {
  if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
    return String(question.correctAnswer) === String(userAnswer);
  }

  if (question.type === 'SHORT_ANSWER') {
    return (
      String(question.correctAnswer).toLowerCase().trim() ===
      String(userAnswer).toLowerCase().trim()
    );
  }

  return false;
};

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;