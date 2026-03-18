/**
 * Input Validators
 * Centralized validation logic for user inputs
 */

import validator from 'validator';
import { ValidationError } from './errors.js';

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }

  if (!validator.isEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  return email.toLowerCase().trim();
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number');
  }

  return password;
};

/**
 * Validate user name
 */
export const validateName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError(`${fieldName} is required`);
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    throw new ValidationError(`${fieldName} must be at least 2 characters long`);
  }

  if (trimmedName.length > 50) {
    throw new ValidationError(`${fieldName} must not exceed 50 characters`);
  }

  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    throw new ValidationError(`${fieldName} contains invalid characters`);
  }

  return trimmedName;
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (!validator.isMongoId(id.toString())) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }

  return id;
};

/**
 * Validate learning goal
 */
export const validateLearningGoal = (goal) => {
  if (!goal || typeof goal !== 'string') {
    throw new ValidationError('Learning goal is required');
  }

  const trimmedGoal = goal.trim();

  if (trimmedGoal.length < 10) {
    throw new ValidationError('Learning goal must be at least 10 characters long');
  }

  if (trimmedGoal.length > 500) {
    throw new ValidationError('Learning goal must not exceed 500 characters');
  }

  return trimmedGoal;
};

/**
 * Validate skill level
 */
export const validateSkillLevel = (level) => {
  const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  if (!level) {
    throw new ValidationError('Skill level is required');
  }

  if (!validLevels.includes(level)) {
    throw new ValidationError(`Skill level must be one of: ${validLevels.join(', ')}`);
  }

  return level;
};

/**
 * Validate duration (in weeks)
 */
export const validateDuration = (duration) => {
  if (!duration || typeof duration !== 'number') {
    throw new ValidationError('Duration is required');
  }

  if (duration < 1 || duration > 52) {
    throw new ValidationError('Duration must be between 1 and 52 weeks');
  }

  return duration;
};

/**
 * Validate assessment answers
 */
export const validateAssessmentAnswers = (answers) => {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ValidationError('Assessment answers are required');
  }

  answers.forEach((answer, index) => {
    if (!answer.questionId) {
      throw new ValidationError(`Answer ${index + 1} is missing questionId`);
    }

    if (answer.selectedOption === undefined && !answer.answer) {
      throw new ValidationError(`Answer ${index + 1} is missing a response`);
    }
  });

  return answers;
};

/**
 * Validate score (0-100)
 */
export const validateScore = (score) => {
  if (score === undefined || score === null) {
    throw new ValidationError('Score is required');
  }

  if (typeof score !== 'number' || score < 0 || score > 100) {
    throw new ValidationError('Score must be a number between 0 and 100');
  }

  return score;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page = 1, limit = 10) => {
  const validatedPage = parseInt(page, 10);
  const validatedLimit = parseInt(limit, 10);

  if (validatedPage < 1) {
    throw new ValidationError('Page must be at least 1');
  }

  if (validatedLimit < 1 || validatedLimit > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }

  return {
    page: validatedPage,
    limit: validatedLimit,
    skip: (validatedPage - 1) * validatedLimit,
  };
};

/**
 * Sanitize HTML input
 */
export const sanitizeHTML = (input) => {
  if (!input || typeof input !== 'string') {
    return input;
  }

  return validator.escape(input);
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    throw new ValidationError('Invalid start date');
  }

  if (isNaN(end.getTime())) {
    throw new ValidationError('Invalid end date');
  }

  if (start >= end) {
    throw new ValidationError('Start date must be before end date');
  }

  return { start, end };
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validateObjectId,
  validateLearningGoal,
  validateSkillLevel,
  validateDuration,
  validateAssessmentAnswers,
  validateScore,
  validatePagination,
  sanitizeHTML,
  validateDateRange,
};