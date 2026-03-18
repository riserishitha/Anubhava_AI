import RAGService from '../../services/rag/rag.service.js';
import { AuthenticationError, ValidationError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

export default {
  Query: {
    /**
     * Ask a question and get AI explanation with RAG context
     */
    askQuestion: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const { question, lessonId } = input;

        if (!question || question.trim().length === 0) {
          throw new ValidationError('Question is required');
        }

        // Get relevant context + AI-generated explanation via RAG
        const ragResult = await RAGService.answerQuestion({
          question,
          userId: context.user.id,
          lessonId,
          userLevel: context.user.skillLevel || 'INTERMEDIATE',
        });

        // Format response
        const response = {
          explanation: ragResult.answer,
          examples: ragResult.examples || [],
          relatedConcepts: ragResult.relatedConcepts || [],
          furtherReading: ragResult.furtherReading || [],
          sources: ragResult.sources?.map(source => ({
            lessonId: source.lessonId,
            relevance: source.relevance,
          })) || [],
        };

        return response;
      } catch (error) {
        logger.error('Error processing question:', error);
        throw error;
      }
    },
  },

  Mutation: {
    /**
     * Resolve a specific doubt with lesson context
     */
    resolveDoubt: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const { doubt, currentLessonId } = input;

        if (!doubt || doubt.trim().length === 0) {
          throw new ValidationError('Doubt description is required');
        }

        // Get doubt resolution with lesson context
        const resolution = await RAGService.resolveDoubt({
          doubt,
          currentLessonId,
          userId: context.user.id,
          userLevel: context.user.skillLevel || 'INTERMEDIATE',
        });

        return {
          answer: resolution.answer,
          examples: resolution.examples || [],
          tips: resolution.tips || [],
          nextSteps: resolution.nextSteps || [],
        };
      } catch (error) {
        logger.error('Error resolving doubt:', error);
        throw error;
      }
    },
  },
};