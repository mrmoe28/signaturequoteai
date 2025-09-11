import { chromium, FullConfig } from '@playwright/test';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-setup');

async function globalSetup(config: FullConfig) {
  logger.info('Setting up global test environment...');
  
  // Ensure reports directory exists
  const fs = require('fs');
  const path = require('path');
  const reportsDir = path.join(process.cwd(), 'reports');
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    logger.info('Created reports directory');
  }
  
  // You can add other global setup tasks here:
  // - Database setup
  // - Test data initialization
  // - External service mocking
  
  logger.info('Global setup completed');
}

export default globalSetup;