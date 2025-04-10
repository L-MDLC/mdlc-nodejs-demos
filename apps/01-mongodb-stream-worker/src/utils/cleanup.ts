import { ChangeStream } from 'mongodb';
import { mongoDbService } from '../services/mongodb.service';
import { logger } from './logger';

/**
 * Manage application cleanup (exit, shutdown)
 */
export class CleanupUtil {
  /**
   * Clean resources before shutdown
   * @param changeStream MongoDB Change Stream to close
   */
  async cleanup(changeStream: ChangeStream | null): Promise<void> {
    logger.info('Cleaning up resources...');

    if (changeStream) {
      try {
        await changeStream.close();
        logger.info('Change stream closed');
        await mongoDbService.close();
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error('Error during cleanup', error as Error);
      }
    }
  }

  /**
   * Register process signal handlers for graceful shutdown
   * @param changeStream MongoDB Change Stream to close
   */
  registerShutdownHandlers(changeStream: ChangeStream | null): void {
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal');
      await this.cleanup(changeStream);
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal');
      await this.cleanup(changeStream);
      process.exit(0);
    });

    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception', error);
      await this.cleanup(changeStream);
      process.exit(1);
    });
  }
}

export const cleanupUtil = new CleanupUtil();
