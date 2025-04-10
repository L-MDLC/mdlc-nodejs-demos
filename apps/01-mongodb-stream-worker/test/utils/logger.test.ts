import { Logger as PinoLogger } from 'pino';

// Create mock type for Pino
interface MockPinoInstance extends PinoLogger {
  error: jest.Mock;
  warn: jest.Mock;
  info: jest.Mock;
  debug: jest.Mock;
  trace: jest.Mock;
}

jest.mock('pino', () => {
  const mockPino: {
    error: jest.Mock;
    warn: jest.Mock;
    info: jest.Mock;
    debug: jest.Mock;
    fatal: jest.Mock;
    level: string;
    levels: { values: object; labels: object }
  } = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    level: 'info',
    levels: { values: {}, labels: {} }
  };

  return jest.fn(() => mockPino);
});

jest.mock('../../src/config/config', () => ({
  config: {
    log: {
      level: 'debug'
    }
  }
}));

import pino from 'pino';
import { logger } from '../../src/utils/logger';

describe('Logger', () => {
  const mockPinoInstance = (pino as unknown as jest.Mock)() as MockPinoInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('error method should call pino error', () => {
    logger.error('Test error message');
    expect(mockPinoInstance.error).toHaveBeenCalledWith('Test error message');
  });

  test('error method with Error object should include error in the log', () => {
    const testError = new Error('Test error');
    logger.error('Error occurred', testError);
    expect(mockPinoInstance.error).toHaveBeenCalledWith(
      { err: testError },
      'Error occurred'
    );
  });

  test('should call appropriate log methods', () => {
    const testData = { key: 'value' };
    logger.warn('Test warning');
    logger.info('Test info');
    logger.debug('Test debug', testData);
    logger.trace('Test trace');

    expect(mockPinoInstance.warn).toHaveBeenCalledWith('Test warning');
    expect(mockPinoInstance.info).toHaveBeenCalledWith('Test info');
    expect(mockPinoInstance.debug).toHaveBeenCalledWith({ data: testData }, 'Test debug');
    expect(mockPinoInstance.trace).toHaveBeenCalledWith('Test trace');
  });
});
