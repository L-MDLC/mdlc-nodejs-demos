import { MongoClient } from 'mongodb';
import { config } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Manage MongoDB connection
 */
export class MongoDbService {
  private client: MongoClient | null = null;

  /**
   * Connect to MongoDB
   * @returns Promise<MongoDB client>
   */
  async connect(): Promise<MongoClient> {
    try {
      if (this.client) { return this.client; }
      this.client = new MongoClient(config.mongodb.uri);

      await this.client.connect();
      logger.info('Connected to MongoDB');

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to MongoDB', error as Error);
      throw error;
    }
  }

  /**
   * Get the current MongoDB client
   * @returns MongoDB client or null if not connected
   */
  getClient(): MongoClient | null {
    return this.client;
  }

  /**
   * Check if the MongoDB client is connected
   * @returns
   */
  isConnected(): boolean {
    return !!this.client;
  }

  /**
   * Close the MongoDB connection
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        this.client = null;
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error('Error closing MongoDB connection', error as Error);
        throw error;
      }
    }
  }
}

export const mongoDbService = new MongoDbService();
