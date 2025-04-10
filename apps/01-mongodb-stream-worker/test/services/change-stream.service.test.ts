import { EventEmitter } from 'events';
import { changeStreamService } from '../../src/services/change-stream.service';
import { mongoDbService } from '../../src/services/mongodb.service';
import { changeHandler } from '../../src/handlers/change-handler';
import { errorHandler } from '../../src/handlers/error-handler';
import { config } from '../../src/config/config';
import { logger } from '../../src/utils/logger';

// Mock dependencies
jest.mock('../../src/services/mongodb.service');
jest.mock('../../src/handlers/change-handler');
jest.mock('../../src/handlers/error-handler');
jest.mock('../../src/config/config');
jest.mock('../../src/utils/logger');

describe('Change Stream Service', () => {
  const mockChangeStream = new EventEmitter() as EventEmitter & { close: jest.Mock };
  mockChangeStream.close = jest.fn().mockResolvedValue(undefined);

  const mockCollection = {
    watch: jest.fn().mockReturnValue(mockChangeStream)
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
  };

  const mockClient = {
    db: jest.fn().mockReturnValue(mockDb)
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (mongoDbService.getClient as jest.Mock).mockReturnValue(mockClient);
    (config.mongodb.dbName as string) = 'testdb';
    (config.mongodb.collectionName as string) = 'testcoll';
    (config.worker.reconnectInterval as number) = 1000;
    (config.worker.maxReconnectAttempts as number) = 3;
    (changeHandler.getResumeToken as jest.Mock).mockReturnValue(null);
  });

  test('setupChangeStream should create a change stream', async () => {
    const result = await changeStreamService.setupChangeStream();

    expect(mongoDbService.getClient).toHaveBeenCalled();
    expect(mockClient.db).toHaveBeenCalledWith('testdb');
    expect(mockDb.collection).toHaveBeenCalledWith('testcoll');
    expect(mockCollection.watch).toHaveBeenCalled();
    expect(result).toBe(mockChangeStream);
  });

  test('setupChangeStream should use resume token if available', async () => {
    const mockToken = { _data: 'resume-token' };
    (changeHandler.getResumeToken as jest.Mock).mockReturnValue(mockToken);

    await changeStreamService.setupChangeStream();

    expect(mockCollection.watch).toHaveBeenCalledWith([], { resumeAfter: mockToken });
  });

  test('setupChangeStream should set up event handlers', async () => {
    await changeStreamService.setupChangeStream();

    expect(mockChangeStream.listenerCount('change')).toBe(1);
    expect(mockChangeStream.listenerCount('error')).toBe(1);
  });

  test('change event should call change handler', async () => {
    await changeStreamService.setupChangeStream();

    const mockChange = { _id: 'change-id' };
    mockChangeStream.emit('change', mockChange);

    expect(changeHandler.handleChange).toHaveBeenCalledWith(mockChange);
    expect(errorHandler.resetReconnectAttempts).toHaveBeenCalled();
  });

  test('error event should handle errors and reconnect', async () => {
    // Setup mocks for reconnect scenario
    jest.useFakeTimers();
    (errorHandler.handleError as jest.Mock).mockReturnValue(true);
    (errorHandler.isMaxAttemptsExceeded as jest.Mock).mockReturnValue(false);

    await changeStreamService.setupChangeStream();

    const mockError = new Error('Test error');
    mockChangeStream.emit('error', mockError);

    expect(errorHandler.handleError).toHaveBeenCalledWith(mockError);
    expect(mockChangeStream.close).toHaveBeenCalled();

    // Timers to trigger reconnect
    jest.runAllTimers();

    // Clean up
    jest.useRealTimers();
  });

  test('closeChangeStream should close the change stream', async () => {
    await changeStreamService.setupChangeStream();
    await changeStreamService.closeChangeStream();

    expect(mockChangeStream.close).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Change stream closed');
  });

  test('getChangeStream should return the current change stream', async () => {
    await changeStreamService.setupChangeStream();

    const result = changeStreamService.getChangeStream();

    expect(result).toBe(mockChangeStream);
  });
});
