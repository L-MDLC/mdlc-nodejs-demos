import { mongoDbService } from '../src/services/mongodb.service';
import { changeStreamService } from '../src/services/change-stream.service';
import { cleanupUtil } from '../src/utils/cleanup';
import { logger } from '../src/utils/logger';

jest.mock('../src/services/mongodb.service', () => ({
  mongoDbService: {
    connect: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../src/services/change-stream.service', () => ({
  changeStreamService: {
    setupChangeStream: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../src/utils/cleanup', () => ({
  cleanupUtil: {
    registerShutdownHandlers: jest.fn()
  }
}));

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../src/config/config', () => ({
  config: {
    mongodb: { uri: 'test-uri', dbName: 'test-db', collectionName: 'test-coll' },
    worker: { reconnectInterval: 1000, maxReconnectAttempts: 3 },
    log: { level: 'info' }
  }
}));

describe('Main Application', () => {
  type ProcessExit = (code?: number) => never;
  const originalExit = process.exit;

  beforeEach(() => {
    jest.clearAllMocks();
    process.exit = jest.fn() as unknown as ProcessExit;
  });

  afterAll(() => {
    process.exit = originalExit;
  });

  test('should initialize application correctly', async () => {
    const { main } = require('../src/main');
    await main();

    expect(logger.info).toHaveBeenCalledWith('MongoDB Change Stream Worker starting...');
    expect(mongoDbService.connect).toHaveBeenCalled();
    expect(changeStreamService.setupChangeStream).toHaveBeenCalled();
    expect(cleanupUtil.registerShutdownHandlers).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Worker started successfully!');
  });

  test('should handle initialization errors', async () => {
    (mongoDbService.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection error'));

    const { main } = require('../src/main');
    await main();

    expect(logger.error).toHaveBeenCalledWith('Error starting worker', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
