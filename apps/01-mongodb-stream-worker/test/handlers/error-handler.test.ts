import { errorHandler } from '../../src/handlers/error-handler';
import { logger } from '../../src/utils/logger';

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler.resetReconnectAttempts();
  });

  test('handleError should log and increment reconnect attempts', () => {
    const testError = new Error('Test error');

    expect(errorHandler.getReconnectAttempts()).toBe(0);
    const shouldReconnect = errorHandler.handleError(testError);

    expect(logger.error).toHaveBeenCalledWith('Error in change stream', testError);
    expect(errorHandler.getReconnectAttempts()).toBe(1);
    expect(shouldReconnect).toBe(true);
  });

  test('getReconnectAttempts should return attempts count', () => {
    expect(errorHandler.getReconnectAttempts()).toBe(0);

    errorHandler.handleError(new Error('Test'));
    errorHandler.handleError(new Error('Test'));

    expect(errorHandler.getReconnectAttempts()).toBe(2);
  });

  test('isMaxAttemptsExceeded should check max attempts', () => {
    for (let i = 0; i < 5; i++) {
      errorHandler.handleError(new Error(`Attempt ${i}`));
    }

    expect(errorHandler.getReconnectAttempts()).toBe(5);
    expect(errorHandler.isMaxAttemptsExceeded(3)).toBe(true);
    expect(errorHandler.isMaxAttemptsExceeded(5)).toBe(false);
    expect(errorHandler.isMaxAttemptsExceeded(10)).toBe(false);
  });

  test('resetReconnectAttempts should reset the counter', () => {
    errorHandler.handleError(new Error('Test'));
    errorHandler.handleError(new Error('Test'));

    expect(errorHandler.getReconnectAttempts()).toBe(2);

    errorHandler.resetReconnectAttempts();

    expect(errorHandler.getReconnectAttempts()).toBe(0);
  });
});
