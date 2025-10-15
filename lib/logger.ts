import pino from 'pino';
import type { LogLevel, LogContext } from './types';

const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

// Use simpler logger configuration to prevent worker crashes in development
export const logger = pino({
  level: logLevel,
  browser: {
    asObject: true,
  },
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