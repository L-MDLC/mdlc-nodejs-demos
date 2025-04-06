import { ChangeStream } from 'mongodb';
import { mongoDbService } from './mongodb.service';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { changeHandler } from '../handlers/change-handler';
import { errorHandler } from '../handlers/error-handler';

export class ChangeStreamService {
  private changeStream: ChangeStream | null = null;

  /**
   * Set up a MongoDB change stream based on pipelineFilter.
   * Ex :
   * - pipelineFilter = [{ $match: { operationType: { $in: ['insert', 'update', 'delete'] } } }];
   * @returns Promise
   */
  async setupChangeStream(pipelineFilter: [] = []): Promise<ChangeStream> {
    const client = mongoDbService.getClient();
    if (!client) {
      throw new Error('MongoDB client not initialized');
    }

    const db = client.db(config.mongodb.dbName);
    const collection = db.collection(config.mongodb.collectionName);

    const options = {
      resumeAfter: undefined
    };
    const resumeToken = changeHandler.getResumeToken();

    if (resumeToken) {
      options.resumeAfter = resumeToken;
      logger.info('Resuming change stream after token');
      logger.debug('Resume token:', resumeToken);
    }

    // Create the change stream
    this.changeStream = collection.watch(pipelineFilter, options);
    this.changeStream.on('change', (change) => {
      changeHandler.handleChange(change);
      errorHandler.resetReconnectAttempts(); // Reset reconnect attempts on successful operation
    });

    this.changeStream.on('error', (error) => {
      if (errorHandler.handleError(error)) {
        this.closeChangeStream();

        if (errorHandler.isMaxAttemptsExceeded(config.worker.maxReconnectAttempts)) {
          logger.error(`Exceeded maximum reconnection attempts (${config.worker.maxReconnectAttempts})`);
          process.exit(1);
        } else {
          this.scheduleReconnect();
        }
      }
    });

    logger.info(`Watching for changes in ${config.mongodb.dbName}.${config.mongodb.collectionName}...`);

    return this.changeStream;
  }

  /**
   * Close the current change stream
   */
  async closeChangeStream(): Promise<void> {
    if (this.changeStream) {
      try {
        await this.changeStream.close();
        this.changeStream = null;
        logger.info('Change stream closed');
      } catch (error) {
        logger.error('Error closing change stream', error as Error);
      }
    }
  }

  /**
   * Get the current change stream
   * @returns
   */
  getChangeStream(): ChangeStream | null {
    return this.changeStream;
  }

  /**
   * Schedule a reconnection
   */
  private scheduleReconnect(): void {
    const attempts = errorHandler.getReconnectAttempts();
    logger.info(`Attempting to reconnect (${attempts}/${config.worker.maxReconnectAttempts}) in ${config.worker.reconnectInterval}ms...`);

    setTimeout(async () => {
      try {
        if (!mongoDbService.isConnected()) {
          await mongoDbService.connect();
        }

        await this.setupChangeStream();
        logger.info('Successfully reconnected and resumed change stream');
      } catch (error) {
        logger.error('Reconnection attempt failed', error as Error);
        this.scheduleReconnect();
      }
    }, config.worker.reconnectInterval);
  }
}

export const changeStreamService = new ChangeStreamService();
