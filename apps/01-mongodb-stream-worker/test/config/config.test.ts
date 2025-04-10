import * as dotenv from 'dotenv';

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Configuration Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (dotenv.config as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should load default configuration when environment variables are missing', () => {
    const { config } = require('../../src/config/config');

    expect(dotenv.config).toHaveBeenCalled();
    expect(config.mongodb.uri).toBe('mongodb://localhost:27017/');
    expect(config.mongodb.dbName).toBe('test');
    expect(config.worker.reconnectInterval).toBe(5000);
  });

  test('should use environment variables when available', () => {
    process.env.MONGODB_URI = 'mongodb://testserver:27017/';
    process.env.MONGODB_DB = 'testdb';
    process.env.RECONNECT_INTERVAL = '3000';

    const { config } = require('../../src/config/config');

    expect(config.mongodb.uri).toBe('mongodb://testserver:27017/');
    expect(config.mongodb.dbName).toBe('testdb');
    expect(config.worker.reconnectInterval).toBe(3000);
  });

  test('should handle invalid numeric environment variables', () => {
    process.env.RECONNECT_INTERVAL = 'not-a-number';

    const { config } = require('../../src/config/config');

    expect(config.worker.reconnectInterval).toBe(5000);
  });
});
