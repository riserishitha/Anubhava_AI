import { VALIDATION_RULES } from '../../constants/index.js';
import { AIServiceError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/**
 * Response Parser
 * Validates and normalizes AI responses
 */
class ResponseParser {
  /**
   * Parse and validate roadmap response
   */
  parseRoadmap(response) {
    try {
      const rules = VALIDATION_RULES.ROADMAP;

      // Validate required fields
      this.validateRequiredFields(response, rules.REQUIRED_FIELDS, 'Roadmap');

      // Validate modules
      if (!Array.isArray(response.modules)) {
        throw new AIServiceError('Roadmap modules must be an array');
      }

      if (
        response.modules.length < rules.MIN_MODULES ||
        response.modules.length > rules.MAX_MODULES
      ) {
        throw new AIServiceError(
          `Roadmap must have between ${rules.MIN_MODULES} and ${rules.MAX_MODULES} modules`
        );
      }

      // Validate each module
      response.modules.forEach((module, index) => {
        this.validateModule(module, index);
      });

      // Normalize response
      return this.normalizeRoadmap(response);
    } catch (error) {
      logger.error('Roadmap parsing failed:', error);
      throw error;
    }
  }

  /**
   * Validate module structure
   */
  validateModule(module, index) {
    const requiredFields = ['title', 'description', 'order', 'estimatedHours', 'lessons'];

    this.validateRequiredFields(module, requiredFields, `Module ${index + 1}`);

    // Validate lessons
    if (!Array.isArray(module.lessons) || module.lessons.length === 0) {
      throw new AIServiceError(`Module ${index + 1} must have at least one lesson`);
    }

    module.lessons.forEach((lesson, lessonIndex) => {
      this.validateLesson(lesson, index, lessonIndex);
    });
  }

  /**
   * Validate lesson structure
   */
  validateLesson(lesson, moduleIndex, lessonIndex) {
    const requiredFields = [
      'title',
      'description',
      'order',
      'contentType',
      'estimatedMinutes',
    ];

    this.validateRequiredFields(
      lesson,
      requiredFields,
      `Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}`
    );
  }

  /**
   * Parse and validate assessment response
   */
  parseAssessment(response) {
    try {
      const rules = VALIDATION_RULES.ASSESSMENT;

      // Validate required fields
      this.validateRequiredFields(response, rules.REQUIRED_FIELDS, 'Assessment');

      // Validate questions
      if (!Array.isArray(response.questions)) {
        throw new AIServiceError('Assessment questions must be an array');
      }

      if (
        response.questions.length < rules.MIN_QUESTIONS ||
        response.questions.length > rules.MAX_QUESTIONS
      ) {
        throw new AIServiceError(
          `Assessment must have between ${rules.MIN_QUESTIONS} and ${rules.MAX_QUESTIONS} questions`
        );
      }

      // Validate each question
      response.questions.forEach((question, index) => {
        this.validateQuestion(question, index);
      });

      // Calculate total marks
      response.totalMarks = response.questions.reduce((sum, q) => sum + (q.points || 1), 0);

      return this.normalizeAssessment(response);
    } catch (error) {
      logger.error('Assessment parsing failed:', error);
      throw error;
    }
  }

  /**
   * Validate question structure
   */
  validateQuestion(question, index) {
    const requiredFields = ['questionId', 'question', 'type', 'correctAnswer'];

    this.validateRequiredFields(question, requiredFields, `Question ${index + 1}`);

    // Validate question type specific fields
    if (question.type === 'MULTIPLE_CHOICE' && !Array.isArray(question.options)) {
      throw new AIServiceError(
        `Question ${index + 1}: Multiple choice questions must have options`
      );
    }

    if (question.type === 'MULTIPLE_CHOICE' && question.options.length < 2) {
      throw new AIServiceError(
        `Question ${index + 1}: Multiple choice must have at least 2 options`
      );
    }
  }

  /**
   * Parse and validate explanation response
   */
  parseExplanation(response) {
    try {
      const rules = VALIDATION_RULES.EXPLANATION;

      this.validateRequiredFields(response, rules.REQUIRED_FIELDS, 'Explanation');

      // Validate explanation length
      if (
        response.explanation.length < rules.MIN_LENGTH ||
        response.explanation.length > rules.MAX_LENGTH
      ) {
        throw new AIServiceError(
          `Explanation must be between ${rules.MIN_LENGTH} and ${rules.MAX_LENGTH} characters`
        );
      }

      return this.normalizeExplanation(response);
    } catch (error) {
      logger.error('Explanation parsing failed:', error);
      throw error;
    }
  }

  /**
   * Validate required fields exist
   */
  validateRequiredFields(object, requiredFields, objectName) {
    const missing = requiredFields.filter((field) => {
      return object[field] === undefined || object[field] === null;
    });

    if (missing.length > 0) {
      throw new AIServiceError(
        `${objectName} missing required fields: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Normalize roadmap response
   */
  normalizeRoadmap(roadmap) {
    return {
      ...roadmap,
      difficulty: roadmap.difficulty || 'INTERMEDIATE',
      prerequisites: roadmap.prerequisites || [],
      learningOutcomes: roadmap.learningOutcomes || [],
      modules: roadmap.modules.map((module, index) => ({
        ...module,
        order: index,
        difficulty: module.difficulty || roadmap.difficulty,
        learningObjectives: module.learningObjectives || [],
        lessons: module.lessons.map((lesson, lessonIndex) => ({
          ...lesson,
          order: lessonIndex,
          difficulty: lesson.difficulty || module.difficulty,
          learningObjectives: lesson.learningObjectives || [],
          keyTakeaways: lesson.keyTakeaways || [],
        })),
      })),
    };
  }

  /**
   * Normalize assessment response
   */
  normalizeAssessment(assessment) {
    return {
      ...assessment,
      passingScore: assessment.passingScore || 70,
      timeLimit: assessment.timeLimit || 30,
      questions: assessment.questions.map((question) => ({
        ...question,
        points: question.points || 1,
        difficulty: question.difficulty || 'INTERMEDIATE',
        explanation: question.explanation || '',
      })),
    };
  }

  /**
   * Normalize explanation response
   */
  normalizeExplanation(explanation) {
    return {
      ...explanation,
      examples: explanation.examples || [],
      relatedConcepts: explanation.relatedConcepts || [],
      furtherReading: explanation.furtherReading || [],
    };
  }

  /**
   * Safe parse JSON with fallback
   */
  safeParseJSON(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      logger.error('JSON parse failed:', { text, error });
      throw new AIServiceError('Failed to parse AI response as JSON');
    }
  }
}

export default new ResponseParser();