import geminiService from '../ai/gemini.service.js';
import promptService from '../ai/prompt.service.js';
import pineconeService from '../vector/pinecone.service.js';
import embeddingService from '../vector/embedding.service.js';
import { RAG_CONFIG } from '../../constants/index.js';
import logger from '../../utils/logger.js';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Orchestrates vector retrieval and AI generation
 * Backend-only, frontend never touches this
 */
class RAGService {
  /**
   * Answer user question with RAG
   */
  async answerQuestion({ question, userId, lessonId = null, userLevel = 'INTERMEDIATE' }) {
    try {
      logger.info('RAG question answering started', { userId, lessonId });

      // Step 1: Retrieve relevant content from vector DB
      const retrievedContent = await this.retrieveRelevantContent(question, {
        lessonId,
      });

      // Step 2: Format context from retrieved content
      const context = this.formatRetrievedContext(retrievedContent);

      // Step 3: Generate prompt with retrieved context
      const prompt = promptService.generateExplanationPrompt({
        question,
        context,
        userLevel,
      });

      // Step 4: Generate answer using AI
      const response = await geminiService.generateJSON(prompt);

      logger.info('RAG question answered', { userId, lessonId });

      return {
        answer: response.explanation,
        examples: response.examples || [],
        relatedConcepts: response.relatedConcepts || [],
        furtherReading: response.furtherReading || [],
        sources: retrievedContent.map((c) => ({
          lessonId: c.lessonId,
          relevance: c.score,
        })),
      };
    } catch (error) {
      logger.error('RAG answer failed:', error);
      throw error;
    }
  }

  /**
   * Resolve doubt with contextual RAG
   */
  async resolveDoubt({ doubt, currentLessonId, userId, userLevel = 'INTERMEDIATE' }) {
    try {
      logger.info('RAG doubt resolution started', { userId, currentLessonId });

      // Retrieve content relevant to the doubt
      const retrievedContent = await this.retrieveRelevantContent(doubt, {
        lessonId: currentLessonId,
        topK: RAG_CONFIG.TOP_K_RESULTS,
      });

      // Get current lesson context (if available)
      const lessonContext = await this.getLessonContext(currentLessonId);

      // Format retrieved content
      const formattedContent = this.formatRetrievedContext(retrievedContent);

      // Generate prompt
      const prompt = promptService.generateDoubtResolutionPrompt({
        doubt,
        lessonContext,
        retrievedContent: formattedContent,
      });

      // Generate response
      const response = await geminiService.generateJSON(prompt);

      logger.info('RAG doubt resolved', { userId, currentLessonId });

      return {
        answer: response.answer,
        examples: response.examples || [],
        tips: response.tips || [],
        nextSteps: response.nextSteps || [],
      };
    } catch (error) {
      logger.error('RAG doubt resolution failed:', error);
      throw error;
    }
  }

  /**
   * Generate explanation with RAG
   */
  async generateExplanation({ topic, context = {}, userLevel = 'INTERMEDIATE' }) {
    try {
      // Retrieve relevant educational content
      const retrievedContent = await this.retrieveRelevantContent(topic, {
        topK: RAG_CONFIG.TOP_K_RESULTS,
      });

      const formattedContext = this.formatRetrievedContext(retrievedContent);

      const prompt = promptService.generateExplanationPrompt({
        question: `Explain: ${topic}`,
        context: formattedContext,
        userLevel,
      });

      const response = await geminiService.generateJSON(prompt);

      return response;
    } catch (error) {
      logger.error('RAG explanation failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant content from vector DB
   */
  async retrieveRelevantContent(query, options = {}) {
    try {
      const { lessonId = null, topK = RAG_CONFIG.TOP_K_RESULTS } = options;

      // Build filter
      const filter = {};
      if (lessonId) {
        filter.lessonId = lessonId.toString();
      }

      // Query vector database
      const results = await pineconeService.queryRelevantContent({
        query,
        topK,
        filter,
      });

      // Filter by similarity threshold
      const filtered = results.filter(
        (result) => result.score >= RAG_CONFIG.SIMILARITY_THRESHOLD
      );

      logger.debug('Retrieved relevant content', {
        query,
        resultsCount: filtered.length,
        topK,
      });

      return filtered;
    } catch (error) {
      logger.error('Content retrieval failed:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Format retrieved context for prompts
   */
  formatRetrievedContext(retrievedContent) {
    if (!retrievedContent || retrievedContent.length === 0) {
      return 'No specific context available. Provide a general explanation.';
    }

    return retrievedContent
      .map((content, index) => {
        return `[Source ${index + 1}] (Relevance: ${(content.score * 100).toFixed(1)}%)\n${content.text}`;
      })
      .join('\n\n');
  }

  /**
   * Get lesson context (placeholder)
   */
  async getLessonContext(lessonId) {
    try {
      if (!lessonId) {
        return 'General learning context';
      }

      // In production, fetch actual lesson from database
      // const lesson = await Lesson.findById(lessonId);
      // return `Lesson: ${lesson.title}\n${lesson.description}`;

      return `Lesson context for ID: ${lessonId}`;
    } catch (error) {
      logger.error('Get lesson context failed:', error);
      return 'General learning context';
    }
  }

  /**
   * Embed lesson content for RAG
   * Called when lessons are created/updated
   */
  async embedLessonContent({ lessonId, content }) {
    try {
      logger.info('Embedding lesson content', { lessonId });

      // Chunk content
      const chunks = embeddingService.chunkText(content);

      // Generate embeddings
      const preparedChunks = await embeddingService.prepareContentForEmbedding(content);

      // Store in vector database
      const vectorIds = await pineconeService.upsertLessonContent({
        lessonId,
        chunks: preparedChunks,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      });

      logger.info('Lesson content embedded', {
        lessonId,
        chunkCount: chunks.length,
      });

      return {
        lessonId,
        vectorIds,
        chunkCount: chunks.length,
      };
    } catch (error) {
      logger.error('Lesson embedding failed:', error);
      throw error;
    }
  }

  /**
   * Delete lesson embeddings
   */
  async deleteLessonEmbeddings(lessonId) {
    try {
      await pineconeService.deleteLessonContent(lessonId);
      logger.info('Lesson embeddings deleted', { lessonId });
    } catch (error) {
      logger.error('Delete lesson embeddings failed:', error);
      throw error;
    }
  }
}

export default new RAGService();