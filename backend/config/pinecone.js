import { Pinecone } from '@pinecone-database/pinecone';
import config from './environment.js';
import logger from '../utils/logger.js';

/**
 * Pinecone Vector Database Configuration
 * Manages vector DB connection and index operations
 */
class PineconeConfig {
  constructor() {
    this.client = null;
    this.index = null;
  }

  /**
   * Initialize Pinecone client and index
   */
  async initialize() {
    try {
      if (this.client && this.index) {
        logger.info('Using existing Pinecone connection');
        return this.index;
      }

      if (!config.pinecone.apiKey) {
        throw new Error('Pinecone API key is not configured');
      }

      // Initialize Pinecone client
      this.client = new Pinecone({
        apiKey: config.pinecone.apiKey,
      });

      // Get index reference
      this.index = this.client.index(config.pinecone.indexName);

      logger.info(`Pinecone initialized with index: ${config.pinecone.indexName}`);

      return this.index;
    } catch (error) {
      logger.error('Failed to initialize Pinecone:', error);
      throw error;
    }
  }

  /**
   * Get index instance
   */
  async getIndex() {
    if (!this.index) {
      return await this.initialize();
    }
    return this.index;
  }

  /**
   * Upsert vectors to index
   */
  async upsert(vectors) {
    try {
      const index = await this.getIndex();
      const result = await index.upsert(vectors);
      logger.info(`Upserted ${vectors.length} vectors to Pinecone`);
      return result;
    } catch (error) {
      logger.error('Pinecone upsert error:', error);
      throw error;
    }
  }

  /**
   * Query vectors by similarity
   */
  async query({ vector, topK = 5, filter = {} }) {
    try {
      const index = await this.getIndex();
      const result = await index.query({
        vector,
        topK,
        filter,
        includeMetadata: true,
      });
      return result.matches || [];
    } catch (error) {
      logger.error('Pinecone query error:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  async deleteVectors(ids) {
    try {
      const index = await this.getIndex();
      await index.deleteMany(ids);
      logger.info(`Deleted ${ids.length} vectors from Pinecone`);
    } catch (error) {
      logger.error('Pinecone delete error:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const index = await this.getIndex();
      const stats = await index.describeIndexStats();
      return { 
        status: 'healthy', 
        indexName: config.pinecone.indexName,
        vectorCount: stats.totalVectorCount 
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new PineconeConfig();