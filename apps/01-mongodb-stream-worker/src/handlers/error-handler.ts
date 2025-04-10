import { logger } from '../utils/logger';

/**
 * Handles error and Reconnection
 */
export class ErrorHandler {
  private reconnectAttempts = 0;

  /**
   * Handle an error from the change stream.
   * @param error
   * @returns true if reconnection should be done
   */
  handleError(error: Error): boolean {
    logger.error('Error in change stream', error);
    this.reconnectAttempts++;

    return true;
  }

  /**
   * Get the current number of reconnection attempts
   * @returns
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Check if maximum number of reconnection have been reached
   * @param maxAttempts
   * @returns
   */
  isMaxAttemptsExceeded(maxAttempts: number): boolean {
    return this.reconnectAttempts > maxAttempts;
  }

  /**
   * Reset the reconnection counter
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }
}

export const errorHandler = new ErrorHandler();
