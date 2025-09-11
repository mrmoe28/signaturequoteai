import { createLogger } from '../lib/logger';

const logger = createLogger('test-teardown');

async function globalTeardown() {
  logger.info('Running global test teardown...');
  
  // You can add cleanup tasks here:
  // - Database cleanup
  // - Temporary file cleanup
  // - External service cleanup
  
  logger.info('Global teardown completed');
}

export default globalTeardown;