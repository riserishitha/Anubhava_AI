import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './environment.js';
import logger from '../utils/logger.js';

/**
 * Gemini AI Configuration and Initialization
 * Singleton pattern for AI client management
 */
class GeminiConfig {
  constructor() {
    this.client = null;
    this.model = null;
  }

  /**
   * Initialize Gemini AI client
   */
  initialize() {
    try {
      if (this.client) {
        logger.info('Using existing Gemini client');
        return this.model;
      }

      if (!config.gemini.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      this.client = new GoogleGenerativeAI(config.gemini.apiKey);
      this.model = this.client.getGenerativeModel({ 
        model: config.gemini.model 
      });

      logger.info(`Gemini AI initialized with model: ${config.gemini.model}`);
      
      return this.model;
    } catch (error) {
      logger.error('Failed to initialize Gemini AI:', error);
      throw error;
    }
  }

  /**
   * Get model instance
   */
  getModel() {
    if (!this.model) {
      return this.initialize();
    }
    return this.model;
  }

  /**
   * Generate content with safety settings
   */
  async generateContent(prompt, options = {}) {
    try {
      const model = this.getModel();

      const generationConfig = {
        temperature: options.temperature || config.gemini.temperature,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 2048,
        ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
      };

      // When supported by the SDK/model, forces the response to be valid JSON.
      // (Older SDK versions may not support this option.)
      if (options.responseMimeType) {
        generationConfig.responseMimeType = options.responseMimeType;
      }

      const safetySettings = [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ];

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Gemini content generation error:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const model = this.getModel();
      return { status: 'healthy', model: config.gemini.model };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new GeminiConfig();