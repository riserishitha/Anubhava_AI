/**
 * Assessment Constants
 * Centralized configuration for assessment logic
 */

export const ASSESSMENT_TYPES = {
  BASELINE: 'BASELINE',
  MODULE_PRE: 'MODULE_PRE',
  MODULE_POST: 'MODULE_POST',
  QUIZ: 'QUIZ',
  FINAL: 'FINAL',
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
};

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  CODE_SNIPPET: 'CODE_SNIPPET',
};

// Scoring thresholds (percentages)
export const SCORE_THRESHOLDS = {
  PASS: 70,
  GOOD: 80,
  EXCELLENT: 90,
  FAIL: 69,
};

// Baseline assessment configuration
export const BASELINE_CONFIG = {
  MIN_QUESTIONS: 10,
  MAX_QUESTIONS: 10, // Changed to exactly 10 questions
  TIME_LIMIT_MINUTES: 20, // Changed to 20 minutes for 10 questions
  TOPICS_TO_ASSESS: [
    'fundamentals',
    'problem_solving',
    'technical_knowledge',
  ],
};

// Skill level determination based on baseline score
export const SKILL_LEVEL_MAPPING = {
  0: DIFFICULTY_LEVELS.BEGINNER,
  40: DIFFICULTY_LEVELS.INTERMEDIATE,
  70: DIFFICULTY_LEVELS.ADVANCED,
  90: DIFFICULTY_LEVELS.EXPERT,
};

// Remediation triggers
export const REMEDIATION_CONFIG = {
  TRIGGER_SCORE: 60, // Below this triggers remediation
  MAX_ATTEMPTS: 3,
  COOLDOWN_HOURS: 24,
};

export default {
  ASSESSMENT_TYPES,
  DIFFICULTY_LEVELS,
  QUESTION_TYPES,
  SCORE_THRESHOLDS,
  BASELINE_CONFIG,
  SKILL_LEVEL_MAPPING,
  REMEDIATION_CONFIG,
};