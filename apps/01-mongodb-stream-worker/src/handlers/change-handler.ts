import { ChangeStreamDocument } from 'mongodb';
import { logger } from '../utils/logger';

/**
 * MongoDB Change Stream Event Interface
 */
export interface ChangeEvent {
  _id: any;
  operationType: string;
  fullDocument?: any;
  documentKey?: any;
  updateDescription?: {
    updatedFields: any;
    removedFields: string[];
  };
  ns?: {
    db: string;
    coll: string;
  };
}

export class ChangeHandler {
  private resumeToken: any = null;

  /**
   * Handle a MongoDB Change event
   * @param change
   */
  handleChange(change: ChangeStreamDocument<any>): void {
    this.resumeToken = change._id; // Store the resume token for reconnection
    const changeEvent = change as unknown as ChangeEvent;
    logger.info(`Change detected of type: ${changeEvent.operationType}`);

    // Log based on operation type
    switch (changeEvent.operationType) {
      case 'insert':
        logger.info('New document inserted');
        logger.debug('Document details:', changeEvent.fullDocument);
        break;

      case 'update':
        logger.info('Document updated');
        if (changeEvent.updateDescription) {
          logger.debug('Updated fields:', changeEvent.updateDescription.updatedFields);

          if (changeEvent.updateDescription.removedFields.length > 0) {
            logger.debug('Removed fields:', changeEvent.updateDescription.removedFields);
          }
        }
        break;

      case 'delete':
        logger.info('Document deleted');
        logger.debug('Deleted document key:', changeEvent.documentKey);
        break;

      case 'replace':
        logger.info('Document replaced');
        logger.debug('New document:', changeEvent.fullDocument);
        break;

      default:
        logger.info(`Other operation: ${changeEvent.operationType}`);
        logger.debug('Change details:', changeEvent);
    }
  }

  /**
   * Get the current MongoDB resume token
   * @returns Current resume token or null if no token is available
   */
  getResumeToken(): any {
    return this.resumeToken;
  }

  /**
   * Set the MongoDB resume token
   * @param token
   */
  setResumeToken(token: any): void {
    this.resumeToken = token;
  }
}

export const changeHandler = new ChangeHandler();
