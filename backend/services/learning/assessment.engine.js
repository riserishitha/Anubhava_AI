import geminiService from '../ai/gemini.service.js';
import promptService from '../ai/prompt.service.js';
import responseParser from '../ai/response.parser.js';
import Assessment from '../../models/Assessment.model.js';
import User from '../../models/User.model.js';
import Module from '../../models/Module.model.js';
import {
  ASSESSMENT_TYPES,
  SCORE_THRESHOLDS,
  SKILL_LEVEL_MAPPING,
  PROMPT_VERSIONS,
} from '../../constants/index.js';
import { BusinessLogicError, ValidationError } from '../../utils/errors.js';
import { validateAssessmentAnswers } from '../../utils/validators.js';
import logger from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import {
  JAVASCRIPT_BASELINE_QUESTIONS,
  calculateSkillLevel,
  generateRecommendations,
} from '../../data/baseline-questions.js';

/**
 * Assessment Engine
 * Generates and evaluates assessments
 * Determines skill levels and pass/fail outcomes
 */
class AssessmentEngine {
  /**
   * Generate baseline assessment
   */
  async generateBaselineAssessment({ userId, learningGoal, skillLevel }) {
    try {
      logger.info('Generating baseline assessment', { userId, learningGoal });

      const user = await User.findById(userId);

      if (!user) {
        throw new ValidationError('User not found');
      }

      // Check if baseline already completed
      if (user.baselineAssessmentCompleted) {
        const existing = await Assessment.findOne({
          userId,
          type: ASSESSMENT_TYPES.BASELINE,
        });

        if (existing) {
          return existing;
        }
      }

      // Generate prompt
      const prompt = promptService.generateBaselineAssessmentPrompt({
        learningGoal,
        skillLevel,
      });

      // Generate assessment using AI
      const aiResponse = await geminiService.generateJSON(prompt);

      // Parse and validate
      const parsedAssessment = responseParser.parseAssessment(aiResponse);

      // Add unique IDs to questions if not present
      parsedAssessment.questions = parsedAssessment.questions.map((q) => ({
        ...q,
        questionId: q.questionId || uuidv4(),
      }));

      // Create assessment in database
      const assessment = await Assessment.create({
        userId,
        type: ASSESSMENT_TYPES.BASELINE,
        title: parsedAssessment.title,
        description: parsedAssessment.description,
        questions: parsedAssessment.questions,
        totalMarks: parsedAssessment.totalMarks,
        passingScore: parsedAssessment.passingScore || SCORE_THRESHOLDS.PASS,
        timeLimit: parsedAssessment.timeLimit,
        maxAttempts: 3,
        generationMetadata: {
          aiModel: 'gemini-pro',
          promptVersion: PROMPT_VERSIONS.ASSESSMENT_CREATION,
          generatedAt: new Date(),
        },
      });

      logger.info('Baseline assessment generated', {
        userId,
        assessmentId: assessment._id,
        questionCount: assessment.questions.length,
      });

      return assessment;
    } catch (error) {
      logger.error('Baseline assessment generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate module assessment
   */
  async generateModuleAssessment({ moduleId, userId }) {
    try {
      logger.info('Generating module assessment', { moduleId, userId });

      const module = await Module.findById(moduleId).populate('lessons');

      if (!module) {
        throw new ValidationError('Module not found');
      }

      // Check if assessment already exists
      if (module.assessmentId) {
        const existing = await Assessment.findById(module.assessmentId);
        if (existing) {
          return existing;
        }
      }

      // Generate prompt
      const prompt = promptService.generateModuleAssessmentPrompt({
        moduleTitle: module.title,
        learningObjectives: module.learningObjectives,
        difficulty: module.difficulty,
      });

      // Generate using AI
      const aiResponse = await geminiService.generateJSON(prompt);

      // Parse and validate
      const parsedAssessment = responseParser.parseAssessment(aiResponse);

      // Add unique IDs
      parsedAssessment.questions = parsedAssessment.questions.map((q) => ({
        ...q,
        questionId: q.questionId || uuidv4(),
      }));

      // Create assessment
      const assessment = await Assessment.create({
        userId,
        moduleId,
        type: ASSESSMENT_TYPES.MODULE_POST,
        title: parsedAssessment.title || `${module.title} Assessment`,
        description: parsedAssessment.description,
        questions: parsedAssessment.questions,
        totalMarks: parsedAssessment.totalMarks,
        passingScore: parsedAssessment.passingScore || SCORE_THRESHOLDS.PASS,
        timeLimit: parsedAssessment.timeLimit || 20,
        maxAttempts: 3,
        generationMetadata: {
          aiModel: 'gemini-pro',
          promptVersion: PROMPT_VERSIONS.ASSESSMENT_CREATION,
          generatedAt: new Date(),
        },
      });

      // Update module with assessment reference
      module.assessmentId = assessment._id;
      await module.save();

      logger.info('Module assessment generated', {
        moduleId,
        assessmentId: assessment._id,
      });

      return assessment;
    } catch (error) {
      logger.error('Module assessment generation failed:', error);
      throw error;
    }
  }

  /**
   * Get existing baseline assessment for a user, or create a new one.
   * Returns a GraphQL-safe shape (question.id etc.)
   */
  async getOrCreateBaselineAssessment({ userId }) {
    // Try to reuse the latest baseline assessment (even if not completed yet)
    const existing = await Assessment.findOne({
      userId,
      type: ASSESSMENT_TYPES.BASELINE,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (existing) {
      return this.formatAssessmentForGraphQL(existing);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Get user's learning goal from registration
    const learningGoal = user.learningGoals?.[0];
    
    let assessment;
    
    if (learningGoal) {
      try {
        // Generate AI-based assessment using user's learning goal
        logger.info('Generating AI-based baseline assessment', { userId, learningGoal });
        
        const prompt = promptService.generateBaselineAssessmentPrompt({
          learningGoal,
          skillLevel: user.skillLevel || 'BEGINNER',
        });

        // Generate assessment using Gemini AI
        const aiResponse = await geminiService.generateJSON(prompt);
        
        // Parse and validate
        const parsedAssessment = responseParser.parseAssessment(aiResponse);

        // Ensure we have exactly 10 questions
        if (!parsedAssessment.questions || parsedAssessment.questions.length !== 10) {
          throw new Error(`Expected 10 questions, got ${parsedAssessment.questions?.length || 0}`);
        }

        // Add unique IDs to questions if not present
        parsedAssessment.questions = parsedAssessment.questions.map((q, index) => ({
          ...q,
          questionId: q.questionId || `baseline-q${index + 1}`,
        }));

        assessment = await Assessment.create({
          userId,
          type: ASSESSMENT_TYPES.BASELINE,
          title: parsedAssessment.title || `Baseline Assessment for ${learningGoal}`,
          description: parsedAssessment.description ||
            'Answer these questions to help us determine your current knowledge level and personalize your learning path.',
          questions: parsedAssessment.questions,
          totalMarks: parsedAssessment.totalMarks || 10,
          passingScore: parsedAssessment.passingScore || 50,
          timeLimit: parsedAssessment.timeLimit || 20,
          maxAttempts: 3,
          generationMetadata: {
            aiModel: 'gemini-pro',
            promptVersion: PROMPT_VERSIONS.ASSESSMENT_CREATION,
            source: 'ai-generated',
            learningGoal,
            generatedAt: new Date(),
          },
        });

        logger.info('AI-based baseline assessment created', {
          userId,
          assessmentId: assessment._id,
          questionCount: assessment.questions.length,
          learningGoal,
        });
      } catch (error) {
        logger.warn('AI assessment generation failed, falling back to hardcoded questions', { 
          error: error.message,
          userId,
        });
        
        // Fallback to hardcoded questions if AI generation fails
        assessment = await Assessment.create({
          userId,
          type: ASSESSMENT_TYPES.BASELINE,
          title: 'JavaScript Baseline Assessment',
          description:
            'Answer these questions to help us determine your current JavaScript level and personalize your learning path.',
          questions: JAVASCRIPT_BASELINE_QUESTIONS,
          totalMarks: JAVASCRIPT_BASELINE_QUESTIONS.length,
          passingScore: 50,
          timeLimit: 20,
          maxAttempts: 3,
          generationMetadata: {
            source: 'hardcoded-fallback',
            version: '1.0',
            generatedAt: new Date(),
            fallbackReason: error.message,
          },
        });

        logger.info('Baseline assessment created with hardcoded questions (fallback)', {
          userId,
          assessmentId: assessment._id,
          questionCount: assessment.questions.length,
        });
      }
    } else {
      // No learning goal set, use hardcoded questions
      logger.info('No learning goal set, using hardcoded questions', { userId });
      
      assessment = await Assessment.create({
        userId,
        type: ASSESSMENT_TYPES.BASELINE,
        title: 'JavaScript Baseline Assessment',
        description:
          'Answer these questions to help us determine your current JavaScript level and personalize your learning path.',
        questions: JAVASCRIPT_BASELINE_QUESTIONS,
        totalMarks: JAVASCRIPT_BASELINE_QUESTIONS.length,
        passingScore: 50,
        timeLimit: 20,
        maxAttempts: 3,
        generationMetadata: {
          source: 'hardcoded',
          version: '1.0',
          generatedAt: new Date(),
          reason: 'no-learning-goal',
        },
      });

      logger.info('Baseline assessment created with hardcoded questions', {
        userId,
        assessmentId: assessment._id,
        questionCount: assessment.questions.length,
      });
    }

    return this.formatAssessmentForGraphQL(assessment);
  }

  /**
   * Get existing module assessment for a user/module, or create a new one.
   */
  async getOrCreateModuleAssessment({ userId, moduleId }) {
    const existing = await Assessment.findOne({
      userId,
      moduleId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (existing) {
      return this.formatAssessmentForGraphQL(existing);
    }

    const assessment = await this.generateModuleAssessment({ moduleId, userId });
    return this.formatAssessmentForGraphQL(assessment);
  }

  /**
   * Fetch assessment by id and ensure it belongs to the user.
   */
  async getAssessmentById({ assessmentId, userId }) {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new ValidationError('Assessment not found');
    }

    if (String(assessment.userId) !== String(userId)) {
      throw new ValidationError('Assessment not found');
    }

    return this.formatAssessmentForGraphQL(assessment);
  }

  /**
   * Map DB Assessment -> GraphQL Assessment type shape.
   * (Important: GraphQL expects Question.id, while DB stores questionId.)
   */
  formatAssessmentForGraphQL(assessmentDoc) {
    const obj = assessmentDoc?.toObject ? assessmentDoc.toObject() : assessmentDoc;

    return {
      id: obj?._id?.toString?.() || obj?._id,
      type: obj?.type,
      title: obj?.title,
      description: obj?.description || null,

      questions: (obj?.questions || []).map((q) => ({
        id: q.questionId,
        question: q.question,
        type: q.type,
        options: q.options || null,
        points: q.points ?? 1,
        difficulty: q.difficulty || 'INTERMEDIATE',
      })),

      timeLimit: obj?.timeLimit ?? 30,
      passingScore: obj?.passingScore ?? 70,
      totalMarks: obj?.totalMarks ?? 0,

      canAttempt: typeof assessmentDoc?.canAttempt === 'function'
        ? assessmentDoc.canAttempt()
        : Boolean(obj?.canAttempt),
      totalAttempts: obj?.totalAttempts ?? obj?.attempts?.length ?? 0,
      bestScore: obj?.bestScore ?? 0,
    };
  }

  /**
   * Submit and evaluate assessment
   */
  async submitAssessment({ assessmentId, userId, answers }) {
    try {
      logger.info('Submitting assessment', { assessmentId, userId });

      // Validate inputs
      validateAssessmentAnswers(answers);

      // Get assessment
      const assessment = await Assessment.findById(assessmentId);

      if (!assessment) {
        throw new ValidationError('Assessment not found');
      }

      // Check if user can attempt
      if (!assessment.canAttempt()) {
        throw new BusinessLogicError('Maximum attempts reached');
      }

      // Record start time
      const startedAt = new Date();

      // Evaluate answers
      const evaluation = assessment.evaluateAnswers(answers);

      // Record completion time
      const submittedAt = new Date();
      const timeTaken = Math.round((submittedAt - startedAt) / 1000 / 60); // minutes

      // Add attempt to assessment
      await assessment.addAttempt({
        startedAt,
        submittedAt,
        answers: evaluation.answers,
        score: evaluation.score,
        percentage: evaluation.percentage,
        passed: evaluation.passed,
        timeTaken,
      });

      // Update user if baseline assessment
      let recommendations = null;
      if (assessment.type === ASSESSMENT_TYPES.BASELINE) {
        const skillLevel = await this.updateUserAfterBaseline(userId, evaluation.percentage);
        
        // Generate recommendations based on results
        const wrongTopics = evaluation.answers
          .filter(a => !a.isCorrect)
          .map(a => {
            const q = assessment.questions.find(q => q.questionId === a.questionId);
            return q?.topic;
          })
          .filter(Boolean);

        recommendations = generateRecommendations({
          percentage: evaluation.percentage,
          wrongTopics,
          skillLevel,
        });
      }

      // Determine next action
      const nextAction = this.determineNextAction(evaluation.passed, assessment.type);

      logger.info('Assessment submitted', {
        assessmentId,
        userId,
        score: evaluation.percentage,
        passed: evaluation.passed,
        recommendations,
      });

      return {
        assessmentId: assessment._id,
        type: assessment.type,
        score: evaluation.score,
        percentage: evaluation.percentage,
        passed: evaluation.passed,
        totalQuestions: evaluation.totalQuestions,
        correctAnswers: evaluation.correctCount,
        passingScore: assessment.passingScore,
        feedback: this.generateFeedback(evaluation.percentage, evaluation.passed),
        nextAction,
        detailedResults: evaluation.answers,
        recommendations, // Include recommendations for baseline assessments
      };
    } catch (error) {
      logger.error('Assessment submission failed:', error);
      throw error;
    }
  }

  /**
   * Update user after baseline assessment
   * Returns the determined skill level
   */
  async updateUserAfterBaseline(userId, score) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new ValidationError('User not found');
      }

      // Determine skill level from score using our new function
      const determinedSkillLevel = calculateSkillLevel(score);

      // Update user
      user.skillLevel = determinedSkillLevel;
      user.baselineAssessmentCompleted = true;
      await user.save();

      logger.info('User updated after baseline', {
        userId,
        score,
        determinedSkillLevel,
      });

      return determinedSkillLevel;
    } catch (error) {
      logger.error('User update after baseline failed:', error);
      throw error;
    }
  }

  /**
   * Determine skill level from score
   * @deprecated Use calculateSkillLevel from baseline-questions.js instead
   */
  determineSkillLevel(score) {
    return calculateSkillLevel(score);
  }

  /**
   * Generate feedback based on score
   */
  generateFeedback(score, passed) {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) {
      return 'Outstanding! You have an excellent grasp of the material.';
    } else if (score >= SCORE_THRESHOLDS.GOOD) {
      return 'Great job! You have a solid understanding of the concepts.';
    } else if (passed) {
      return 'Well done! You passed the assessment.';
    } else if (score >= SCORE_THRESHOLDS.FAIL - 10) {
      return 'You\'re close! Review the material and try again.';
    } else {
      return 'Let\'s work on understanding these concepts better. Review and retry.';
    }
  }

  /**
   * Determine next action based on result
   */
  determineNextAction(passed, assessmentType) {
    if (!passed) {
      return 'REMEDIATE';
    }

    if (assessmentType === ASSESSMENT_TYPES.BASELINE) {
      return 'START_NEXT_MODULE';
    }

    if (assessmentType === ASSESSMENT_TYPES.MODULE_POST) {
      return 'START_NEXT_MODULE';
    }

    return 'CONTINUE_LESSON';
  }

  /**
   * Get assessment for user (without correct answers)
   */
  async getAssessmentForUser(assessmentId) {
    try {
      const assessment = await Assessment.findById(assessmentId).lean();

      if (!assessment) {
        throw new ValidationError('Assessment not found');
      }

      // Remove correct answers from questions
      assessment.questions = assessment.questions.map((q) => ({
        questionId: q.questionId,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
        // correctAnswer is excluded
      }));

      return assessment;
    } catch (error) {
      logger.error('Get assessment failed:', error);
      throw error;
    }
  }
}

export default new AssessmentEngine();