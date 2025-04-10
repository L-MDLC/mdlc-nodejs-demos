import { logger } from './utils/logger';
import { mongoDbService } from './services/mongodb.service';
import { changeStreamService } from './services/change-stream.service';
import { cleanupUtil } from './utils/cleanup';

/**
 * Main function to start the worker
 */
async function main(): Promise<void> {
  logger.info('MongoDB Change Stream Worker starting...');

  try {
    await mongoDbService.connect();
    const changeStream = await changeStreamService.setupChangeStream();
    cleanupUtil.registerShutdownHandlers(changeStream);
    logger.info('✅ Worker started successfully!');
  } catch (error) {
    logger.error('❌ Error starting worker', error as Error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Unhandled error in main', error as Error);
  process.exit(1);
});
