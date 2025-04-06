import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
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

interface MockedConfig {
  config: {
    mongodb: {
      uri: string;
    };
  };
}

jest.mock('../../src/config/config', () => ({
  config: {
    mongodb: {
      uri: 'mongodb://localhost:27017/'
    }
  }
}));

describe('MongoDB Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mockConfig = require('../../src/config/config') as MockedConfig;
    mockConfig.config.mongodb.uri = mongoServer.getUri();
  });

  afterAll(async () => {
    await mongoDbService.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('connect should establish a MongoDB connection', async () => {
    const client = await mongoDbService.connect();

    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(MongoClient);
    expect(logger.info).toHaveBeenCalledWith('Connected to MongoDB');
  });

  test('getClient should return the MongoDB client', async () => {
    await mongoDbService.connect();
    const client = mongoDbService.getClient();

    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(MongoClient);
  });

  test('isConnected should return connection status', async () => {
    await mongoDbService.connect();
    const isConnected = mongoDbService.isConnected();

    expect(isConnected).toBe(true);
  });

  test('close should close the MongoDB connection', async () => {
    await mongoDbService.connect();
    await mongoDbService.close();

    expect(mongoDbService.isConnected()).toBe(false);
    expect(logger.info).toHaveBeenCalledWith('MongoDB connection closed');
  });

  test('connect should handle connection errors', async () => {
    const mockConfig = require('../../src/config/config') as MockedConfig;
    const originalUri = mockConfig.config.mongodb.uri;
    mockConfig.config.mongodb.uri = 'mongodb://invalid-host:12345/';

    await expect(mongoDbService.connect()).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();

    mockConfig.config.mongodb.uri = originalUri;
  });
});
