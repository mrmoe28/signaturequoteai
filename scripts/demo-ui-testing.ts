#!/usr/bin/env tsx
/**
 * UI Testing Demo Script
 * 
 * Demonstrates the capabilities of the UI testing system
 * by running tests and showing the results
 */

import 'dotenv/config';
import { runUITests } from './ui-test-agent';
import { createLogger } from '../lib/logger';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const logger = createLogger('ui-demo');

async function demoUITesting() {
  logger.info('🎬 Starting UI Testing Demo');
  logger.info('=' .repeat(60));
  
  try {
    // Check if server is running
    try {
      const response = await fetch('http://localhost:3000');
      if (!response.ok) {
        throw new Error('Server not responding');
      }
      logger.info('✅ Development server is running at http://localhost:3000');
    } catch (error) {
      logger.error('❌ Development server is not running!');
      logger.info('Please start the server with: npm run dev');
      return;
    }

    logger.info('🔍 Running comprehensive UI analysis...');
    logger.info('   This will test the following areas:');
    logger.info('   • Interactive buttons and their functionality');
    logger.info('   • Tab switching and navigation');
    logger.info('   • Form validation and submission');
    logger.info('   • Console errors and JavaScript issues');
    logger.info('   • Navigation links and routing');
    logger.info('   • Component responsiveness');
    
    console.log(''); // Add spacing
    
    const report = await runUITests('http://localhost:3000', false);
    
    logger.info('=' .repeat(60));
    logger.info('📊 UI TESTING RESULTS');
    logger.info('=' .repeat(60));
    
    // Display summary
    logger.info(`🔍 Pages Tested: ${report.summary.totalPages}`);
    logger.info(`📋 Total Issues Found: ${report.summary.totalIssues}`);
    
    if (report.summary.criticalIssues > 0) {
      logger.error(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
    }
    
    if (report.summary.highIssues > 0) {
      logger.warn(`⚠️  High Priority Issues: ${report.summary.highIssues}`);
    }
    
    if (report.summary.mediumIssues > 0) {
      logger.info(`📝 Medium Priority Issues: ${report.summary.mediumIssues}`);
    }
    
    if (report.summary.lowIssues > 0) {
      logger.info(`ℹ️  Low Priority Issues: ${report.summary.lowIssues}`);
    }
    
    console.log(''); // Add spacing
    
    // Show some sample issues by category
    const allIssues = report.pages.flatMap(page => page.issues);
    
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const brokenButtons = allIssues.filter(i => i.type === 'broken-button');
    const tabIssues = allIssues.filter(i => i.type === 'non-functioning-tab');
    const consoleErrors = report.pages.flatMap(p => p.consoleErrors);
    
    if (criticalIssues.length > 0) {
      logger.error('🚨 CRITICAL ISSUES FOUND:');
      criticalIssues.slice(0, 3).forEach(issue => {
        logger.error(`   • ${issue.description}`);
        logger.error(`     Location: ${issue.location.url}`);
        logger.error(`     Fix: ${issue.suggestedFix}`);
      });
      console.log('');
    }
    
    if (brokenButtons.length > 0) {
      logger.warn('🔘 BROKEN BUTTONS DETECTED:');
      brokenButtons.slice(0, 3).forEach(issue => {
        logger.warn(`   • ${issue.element.text || 'Unnamed button'} (${issue.element.selector})`);
        logger.warn(`     Issue: ${issue.actualBehavior}`);
        logger.warn(`     Fix: ${issue.suggestedFix}`);
      });
      console.log('');
    }
    
    if (tabIssues.length > 0) {
      logger.info('📑 TAB FUNCTIONALITY ISSUES:');
      tabIssues.forEach(issue => {
        logger.info(`   • ${issue.description}`);
        logger.info(`     Fix: ${issue.suggestedFix}`);
      });
      console.log('');
    }
    
    if (consoleErrors.length > 0) {
      logger.warn('🐛 CONSOLE ERRORS DETECTED:');
      consoleErrors.slice(0, 3).forEach(error => {
        logger.warn(`   • ${error.type}: ${error.message}`);
      });
      console.log('');
    }
    
    // Show page-by-page breakdown
    logger.info('📄 PAGE-BY-PAGE BREAKDOWN:');
    report.pages.forEach(page => {
      const status = page.issues.length === 0 ? '✅' : 
                     page.issues.some(i => i.severity === 'critical') ? '🚨' :
                     page.issues.some(i => i.severity === 'high') ? '⚠️' : '📝';
      
      logger.info(`   ${status} ${page.route} - ${page.issues.length} issues (${page.loadTime}ms)`);
      
      // Show top issue for this page
      if (page.issues.length > 0) {
        const topIssue = page.issues.sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })[0];
        
        logger.info(`      └─ ${topIssue.description}`);
      }
    });
    
    console.log('');
    
    // Show recommendations
    if (report.recommendations.length > 0) {
      logger.info('🎯 TOP RECOMMENDATIONS:');
      report.recommendations.slice(0, 5).forEach(rec => {
        logger.info(`   • ${rec}`);
      });
      console.log('');
    }
    
    // Show report location
    const reportPath = join(process.cwd(), 'reports', `ui-test-report-${report.testRunId}.html`);
    if (existsSync(reportPath)) {
      logger.info('📊 DETAILED REPORT GENERATED:');
      logger.info(`   HTML Report: ${reportPath}`);
      logger.info(`   JSON Report: ${reportPath.replace('.html', '.json')}`);
      logger.info('');
      logger.info('💡 To view the interactive report, open the HTML file in your browser:');
      logger.info(`   open ${reportPath}`);
    }
    
    console.log('');
    logger.info('=' .repeat(60));
    logger.info('🎯 NEXT STEPS');
    logger.info('=' .repeat(60));
    
    if (report.summary.totalIssues === 0) {
      logger.info('🎉 Congratulations! No UI issues detected.');
      logger.info('   Your application appears to have good UI quality.');
      logger.info('   Consider setting up monitoring to catch future regressions:');
      logger.info('   npm run monitor:ui');
    } else {
      logger.info('📋 To improve your UI quality:');
      logger.info('   1. Review the detailed HTML report for specific fixes');
      logger.info('   2. Address critical and high-priority issues first');
      logger.info('   3. Run tests again after making fixes: npm run test:ui');
      logger.info('   4. Set up watch mode for continuous testing: npm run test:ui:watch');
      logger.info('   5. Configure CI/CD integration: npm run test:ui:ci');
      
      if (report.summary.autoFixableIssues > 0) {
        logger.info('   6. Try auto-fix for supported issues: npm run test:ui:fix');
      }
    }
    
    console.log('');
    logger.info('📚 For more information, see: UI_TESTING_README.md');
    
  } catch (error) {
    logger.error(`Demo failed: ${error}`);
    logger.info('💡 Troubleshooting tips:');
    logger.info('   • Ensure the development server is running: npm run dev');
    logger.info('   • Check that port 3000 is accessible');
    logger.info('   • Verify all dependencies are installed: npm install');
    throw error;
  }
}

// Run demo if called directly
if (require.main === module) {
  demoUITesting()
    .then(() => {
      logger.info('✅ Demo completed successfully');
    })
    .catch((error) => {
      logger.error('❌ Demo failed');
      process.exit(1);
    });
}

export { demoUITesting };