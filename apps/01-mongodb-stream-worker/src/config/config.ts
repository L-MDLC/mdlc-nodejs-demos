import * as dotenv from 'dotenv';
dotenv.config();

interface MongoDbConfig {
  uri: string;
  dbName: string;
  collectionName: string;
}

interface WorkerConfig {
  pipelineFilter: [];
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

interface LogConfig {
  level: string;
}

interface AppConfig {
  mongodb: MongoDbConfig;
  worker: WorkerConfig;
  log: LogConfig;
}

export const config: AppConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
    dbName: process.env.MONGODB_DB || 'mdlcDatabase',
    collectionName: process.env.MONGODB_COLLECTION || 'mdlcCollection'
  },
  worker: {
    pipelineFilter: process.env.PIPELINE_FILTER ? JSON.parse(process.env.PIPELINE_FILTER) : [],
    reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL || '5000', 10),
    maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '10', 10)
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
