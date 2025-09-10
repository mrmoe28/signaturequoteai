import pino from 'pino';
import type { LogLevel, LogContext } from './types';

const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export const logger = pino({
  level: logLevel,
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export function createLogger(component: string) {
  return logger.child({ component });
}

export function logOperation(
  logger: pino.Logger,
  operation: string,
  fn: () => Promise<any>,
  context: LogContext = {}
): Promise<any> {
  const startTime = Date.now();
  const logContext = { operation, ...context };
  
  logger.info(logContext, `Starting ${operation}`);
  
  return fn()
    .then((result) => {
      const duration = Date.now() - startTime;
      logger.info({ ...logContext, duration }, `Completed ${operation}`);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      logger.error({ 
        ...logContext, 
        duration, 
        error: error.message || error,
        stack: error.stack 
      }, `Failed ${operation}`);
      throw error;
    });
}