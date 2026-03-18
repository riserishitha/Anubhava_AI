/**
 * Roadmap Constants
 * Centralized configuration for learning path roadmaps
 */

export const ROADMAP_STATES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
};

export const MODULE_STATUS = {
  LOCKED: 'LOCKED',
  UNLOCKED: 'UNLOCKED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
};

export const LESSON_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REVIEW_NEEDED: 'REVIEW_NEEDED',
};

export const CONTENT_TYPES = {
  VIDEO: 'VIDEO',
  ARTICLE: 'ARTICLE',
  INTERACTIVE: 'INTERACTIVE',
  QUIZ: 'QUIZ',
  PROJECT: 'PROJECT',
  EXERCISE: 'EXERCISE',
};

// Module unlock rules
export const UNLOCK_RULES = {
  SEQUENTIAL: 'SEQUENTIAL', // Must complete previous module
  SCORE_BASED: 'SCORE_BASED', // Unlock based on assessment score
  TIME_BASED: 'TIME_BASED', // Unlock after time period
  MANUAL: 'MANUAL', // Manual unlock by admin
};

// Roadmap duration presets (in weeks)
export const DURATION_PRESETS = {
  INTENSIVE: 4,
  STANDARD: 8,
  RELAXED: 12,
  EXTENDED: 16,
};

// Learning pace
export const LEARNING_PACE = {
  SLOW: 'SLOW',
  MODERATE: 'MODERATE',
  FAST: 'FAST',
  CUSTOM: 'CUSTOM',
};

// Completion criteria
export const COMPLETION_CRITERIA = {
  ALL_MODULES: 'ALL_MODULES',
  PASSING_SCORE: 'PASSING_SCORE',
  FINAL_ASSESSMENT: 'FINAL_ASSESSMENT',
  PROJECT_SUBMISSION: 'PROJECT_SUBMISSION',
};

// Roadmap generation configuration
export const GENERATION_CONFIG = {
  MIN_MODULES: 3,
  MAX_MODULES: 12,
  MIN_LESSONS_PER_MODULE: 2,
  MAX_LESSONS_PER_MODULE: 8,
  ESTIMATED_HOURS_PER_LESSON: 1.5,
};

// Adaptive adjustment triggers
export const ADAPTIVE_TRIGGERS = {
  CONSECUTIVE_FAILURES: 2,
  LOW_ENGAGEMENT_DAYS: 7,
  FAST_COMPLETION_THRESHOLD: 0.5, // Completing in 50% of estimated time
};

export default {
  ROADMAP_STATES,
  MODULE_STATUS,
  LESSON_STATUS,
  CONTENT_TYPES,
  UNLOCK_RULES,
  DURATION_PRESETS,
  LEARNING_PACE,
  COMPLETION_CRITERIA,
  GENERATION_CONFIG,
  ADAPTIVE_TRIGGERS,
};