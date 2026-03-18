import mongoose from 'mongoose';
import config from './environment.js';
import logger from '../utils/logger.js';

/**
 * MongoDB Connection Handler
 * Manages database connection lifecycle with retry logic
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Establish MongoDB connection
   */
  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Using existing database connection');
        return;
      }

      mongoose.set('strictQuery', false);

      const conn = await mongoose.connect(config.database.uri, config.database.options);

      this.isConnected = true;

      logger.info(`MongoDB Connected: ${conn.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

export default new DatabaseConnection();