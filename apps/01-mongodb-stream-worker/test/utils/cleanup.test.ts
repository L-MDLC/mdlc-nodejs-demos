import { ChangeStream } from 'mongodb';
import { cleanupUtil } from '../../src/utils/cleanup';
import { mongoDbService } from '../../src/services/mongodb.service';
import { logger } from '../../src/utils/logger';

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../../src/services/mongodb.service', () => ({
  mongoDbService: {
    close: jest.fn()
  }
}));

describe('Cleanup Utility', () => {
  const originalProcess = process;
  type ProcessExit = (code?: number) => never;
  const mockExit = jest.fn() as unknown as ProcessExit;

  beforeEach(() => {
    jest.clearAllMocks();
    process.exit = mockExit;
  });

  afterAll(() => {
    process = originalProcess;
  });

  test('cleanup should close change stream and MongoDB connection', async () => {
    const mockChangeStream = {
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as ChangeStream;

    await cleanupUtil.cleanup(mockChangeStream);

    expect(mockChangeStream.close).toHaveBeenCalled();
    expect(mongoDbService.close).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Change stream closed');
  });

  test('cleanup should handle null change stream', async () => {
    await cleanupUtil.cleanup(null);

    expect(mongoDbService.close).toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalledWith('Change stream closed');
  });

  test('cleanup should handle change stream close errors', async () => {
    const mockError = new Error('Close error');
    const mockChangeStream = {
      close: jest.fn().mockRejectedValue(mockError)
    } as unknown as ChangeStream;

    await cleanupUtil.cleanup(mockChangeStream);

    expect(logger.error).toHaveBeenCalledWith('Error closing change stream', mockError);
    expect(mongoDbService.close).toHaveBeenCalled();
  });

  test('registerShutdownHandlers should set up process handlers', () => {
    const mockChangeStream = {} as ChangeStream;

    // Store original handlers
    const originalHandlers = {
      SIGINT: process.listeners('SIGINT'),
      SIGTERM: process.listeners('SIGTERM'),
      uncaughtException: process.listeners('uncaughtException')
    };

    cleanupUtil.registerShutdownHandlers(mockChangeStream);

    // Verify handlers were added
    expect(process.listeners('SIGINT').length).toBeGreaterThan(originalHandlers.SIGINT.length);
    expect(process.listeners('SIGTERM').length).toBeGreaterThan(originalHandlers.SIGTERM.length);
    expect(process.listeners('uncaughtException').length).toBeGreaterThan(originalHandlers.uncaughtException.length);

    // Remove our handlers to prevent interference with other tests
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('uncaughtException');

    // Re-add original handlers if any
    originalHandlers.SIGINT.forEach(handler => process.on('SIGINT', handler));
    originalHandlers.SIGTERM.forEach(handler => process.on('SIGTERM', handler));
    originalHandlers.uncaughtException.forEach(handler => process.on('uncaughtException', handler));
  });
});
