#!/usr/bin/env tsx
/**
 * UI Test Runner Script
 * 
 * Provides a simple CLI interface for running UI tests with different configurations
 */

import 'dotenv/config';
import { runUITests, UIAutoFixer } from './ui-test-agent';
import { UIMonitor } from './ui-monitor';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../lib/logger';

const logger = createLogger('ui-test-runner');

interface Config {
  baseUrl?: string;
  routes?: string[];
  excludeRoutes?: string[];
  autoFix?: boolean;
  headless?: boolean;
  outputDir?: string;
  thresholds?: {
    maxCriticalIssues: number;
    maxHighIssues: number;
    maxMediumIssues: number;
    maxLowIssues: number;
  };
}

async function loadConfig(): Promise<Config> {
  const configPath = join(process.cwd(), 'ui-test-config.json');
  
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);
      logger.info('Loaded configuration from ui-test-config.json');
      return config;
    } catch (error) {
      logger.warn(`Failed to load config file: ${error}`);
    }
  }
  
  // Default configuration
  return {
    baseUrl: 'http://localhost:3000',
    autoFix: false,
    headless: true,
    outputDir: './reports',
    thresholds: {
      maxCriticalIssues: 0,
      maxHighIssues: 3,
      maxMediumIssues: 10,
      maxLowIssues: 20
    }
  };
}

async function runTests(options: {
  config?: Config;
  autoFix?: boolean;
  watch?: boolean;
  ci?: boolean;
  generateTrend?: boolean;
}) {
  const config = options.config || await loadConfig();
  
  try {
    logger.info('🚀 Starting UI Test Suite');
    logger.info(`📍 Base URL: ${config.baseUrl}`);
    
    const report = await runUITests(config.baseUrl, options.autoFix);
    
    // Check thresholds in CI mode
    if (options.ci) {
      const thresholds = config.thresholds!;
      let exitCode = 0;
      
      if (report.summary.criticalIssues > thresholds.maxCriticalIssues) {
        logger.error(`❌ Critical issues exceed threshold: ${report.summary.criticalIssues} > ${thresholds.maxCriticalIssues}`);
        exitCode = 1;
      }
      
      if (report.summary.highIssues > thresholds.maxHighIssues) {
        logger.error(`❌ High priority issues exceed threshold: ${report.summary.highIssues} > ${thresholds.maxHighIssues}`);
        exitCode = 1;
      }
      
      if (exitCode === 1) {
        process.exit(exitCode);
      } else {
        logger.info('✅ All thresholds passed');
      }
    }
    
    // Generate trend report if requested
    if (options.generateTrend) {
      try {
        const monitor = new UIMonitor({
          interval: '0 */6 * * *',
          baseUrl: config.baseUrl || 'http://localhost:3000',
          thresholds: config.thresholds!
        });
        
        const trendReportPath = await monitor.generateTrendReport();
        logger.info(`📈 Trend report generated: ${trendReportPath}`);
      } catch (error) {
        logger.warn(`Could not generate trend report: ${error}`);
      }
    }
    
    // Watch mode for continuous testing during development
    if (options.watch) {
      logger.info('👀 Watch mode enabled - will re-run tests when changes detected');
      
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(['app/**/*', 'components/**/*'], {
        ignored: /node_modules/,
        persistent: true
      });
      
      let isRunning = false;
      const debounce = (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      };
      
      const runTestsDebounced = debounce(async () => {
        if (isRunning) return;
        isRunning = true;
        
        try {
          logger.info('🔄 File changes detected, re-running tests...');
          await runUITests(config.baseUrl, options.autoFix);
        } catch (error) {
          logger.error(`Watch mode test failed: ${error}`);
        } finally {
          isRunning = false;
        }
      }, 2000);
      
      watcher.on('change', runTestsDebounced);
      watcher.on('add', runTestsDebounced);
      watcher.on('unlink', runTestsDebounced);
      
      // Keep the process running
      process.on('SIGINT', () => {
        logger.info('Stopping watch mode...');
        watcher.close();
        process.exit(0);
      });
      
      // Prevent the process from exiting
      setInterval(() => {}, 1000);
    }
    
    return report;
    
  } catch (error) {
    logger.error(`UI tests failed: ${error}`);
    if (options.ci) {
      process.exit(1);
    }
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    autoFix: args.includes('--auto-fix'),
    watch: args.includes('--watch'),
    ci: args.includes('--ci'),
    generateTrend: args.includes('--trend'),
  };
  
  // Handle custom base URL
  const baseUrlArg = args.find(arg => arg.startsWith('--url='));
  const baseUrl = baseUrlArg ? baseUrlArg.split('=')[1] : undefined;
  
  const config = await loadConfig();
  if (baseUrl) {
    config.baseUrl = baseUrl;
  }
  
  // Handle help command
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 UI Test Runner

Usage:
  tsx scripts/run-ui-tests.ts [options]

Options:
  --url=<url>        Base URL to test (default: http://localhost:3000)
  --auto-fix         Attempt to automatically fix issues where possible
  --watch            Watch for file changes and re-run tests
  --ci               Run in CI mode with strict threshold checking
  --trend            Generate trend analysis report
  --help, -h         Show this help message

Examples:
  tsx scripts/run-ui-tests.ts                           # Run basic tests
  tsx scripts/run-ui-tests.ts --auto-fix                # Run tests with auto-fix
  tsx scripts/run-ui-tests.ts --watch                   # Run in watch mode
  tsx scripts/run-ui-tests.ts --ci                      # Run in CI mode
  tsx scripts/run-ui-tests.ts --url=http://localhost:3001  # Test different URL
  tsx scripts/run-ui-tests.ts --trend                   # Include trend analysis

Configuration:
  Create ui-test-config.json to customize test settings, routes, and thresholds.
    `);
    return;
  }
  
  try {
    await runTests({ config, ...options });
    logger.info('✅ UI testing completed successfully');
  } catch (error) {
    logger.error('❌ UI testing failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runTests, loadConfig };