import pino from 'pino';
import { config } from '../config/config';

// Pino logger configuration
const pinoLogger = pino({
  level: config.log.level || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

/**
 * Logger wrapper for Pino.js
 */
class Logger {
  error(message: string, error?: Error): void {
    if (error) {
      pinoLogger.error({ err: error }, message);
    } else {
      pinoLogger.error(message);
    }
  }

  warn(message: string): void {
    pinoLogger.warn(message);
  }

  info(message: string): void {
    pinoLogger.info(message);
  }

  debug(message: string, data?: any): void {
    if (data) {
      pinoLogger.debug({ data }, message);
    } else {
      pinoLogger.debug(message);
    }
  }

  trace(message: string, data?: any): void {
    if (data) {
      pinoLogger.trace({ data }, message);
    } else {
      pinoLogger.trace(message);
    }
  }

  getRawLogger(): pino.Logger {
    return pinoLogger;
  }
}

export const logger = new Logger();
