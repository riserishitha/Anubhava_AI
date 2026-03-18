import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Model Schema
 * Represents a learner in the system
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    learningGoals: {
      type: [String],
      default: [],
    },
    skillLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
      default: 'BEGINNER',
    },
    preferences: {
      learningPace: {
        type: String,
        enum: ['SLOW', 'MODERATE', 'FAST', 'CUSTOM'],
        default: 'MODERATE',
      },
      dailyGoalMinutes: {
        type: Number,
        default: 30,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
    },
    profile: {
      avatar: String,
      bio: String,
      location: String,
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    baselineAssessmentCompleted: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
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

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ skillLevel: 1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

/**
 * Get full name virtual
 */
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Remove sensitive data from JSON output
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;