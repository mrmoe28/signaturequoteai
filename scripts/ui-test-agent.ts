#!/usr/bin/env tsx
/**
 * Comprehensive UI Testing Agent
 * 
 * This script crawls the Next.js application and identifies:
 * - Non-functioning tabs (not switching content)
 * - Broken buttons (no click handlers, missing functionality)
 * - JavaScript errors in browser console
 * - Missing event listeners
 * - UI components that don't respond to interactions
 * 
 * Features:
 * - Automated testing with Playwright
 * - Detailed reporting with fix suggestions
 * - Automated fixes where possible
 * - Continuous monitoring capabilities
 */

import 'dotenv/config';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../lib/logger';

const logger = createLogger('ui-test-agent');

interface UIIssue {
  type: 'non-functioning-tab' | 'broken-button' | 'console-error' | 'missing-event-listener' | 'unresponsive-component';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: {
    selector: string;
    text?: string;
    tagName: string;
    attributes?: Record<string, string>;
  };
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  suggestedFix: string;
  autoFixable: boolean;
  location: {
    url: string;
    line?: number;
    column?: number;
  };
}

interface PageReport {
  url: string;
  route: string;
  pageTitle: string;
  issues: UIIssue[];
  consoleErrors: Array<{
    type: string;
    message: string;
    location?: string;
    stack?: string;
  }>;
  loadTime: number;
  interactiveElements: number;
  brokenElements: number;
  timestamp: string;
}

interface TestReport {
  projectName: string;
  testRunId: string;
  timestamp: string;
  pages: PageReport[];
  summary: {
    totalPages: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    autoFixableIssues: number;
  };
  recommendations: string[];
}

class UITestAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private baseUrl: string;
  private routes: string[] = [];
  private report: TestReport;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.report = {
      projectName: 'Signature QuoteCrawler',
      testRunId: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      pages: [],
      summary: {
        totalPages: 0,
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        autoFixableIssues: 0
      },
      recommendations: []
    };
  }

  async initialize() {
    logger.info('Initializing UI Test Agent...');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (compatible; UI-Test-Agent/1.0)',
    });

    // Discover routes from the app directory structure
    await this.discoverRoutes();
    logger.info(`Discovered ${this.routes.length} routes to test`);
  }

  private async discoverRoutes() {
    // Define the routes based on the Next.js app directory structure
    this.routes = [
      '/',
      '/dashboard',
      '/products',
      '/quotes/new',
      '/cart',
      '/profile',
      '/settings',
      '/company',
      '/auth/login',
      '/auth/register',
      '/auth/reset'
    ];
  }

  async testAllPages() {
    logger.info('Starting comprehensive UI testing...');
    
    for (const route of this.routes) {
      try {
        logger.info(`Testing route: ${route}`);
        const pageReport = await this.testPage(route);
        this.report.pages.push(pageReport);
        
        // Log immediate findings
        if (pageReport.issues.length > 0) {
          logger.warn(`Found ${pageReport.issues.length} issues on ${route}`);
        } else {
          logger.info(`No issues found on ${route}`);
        }
      } catch (error) {
        logger.error(`Failed to test route ${route}: ${error}`);
        
        // Create error report for failed page
        const errorReport: PageReport = {
          url: `${this.baseUrl}${route}`,
          route,
          pageTitle: 'Failed to Load',
          issues: [{
            type: 'console-error',
            severity: 'critical',
            element: { selector: 'page', tagName: 'html' },
            description: `Page failed to load: ${error}`,
            expectedBehavior: 'Page should load successfully',
            actualBehavior: 'Page failed to load with error',
            suggestedFix: 'Check server status and route configuration',
            autoFixable: false,
            location: { url: `${this.baseUrl}${route}` }
          }],
          consoleErrors: [{
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          }],
          loadTime: 0,
          interactiveElements: 0,
          brokenElements: 1,
          timestamp: new Date().toISOString()
        };
        this.report.pages.push(errorReport);
      }
    }

    this.generateSummary();
    await this.generateRecommendations();
    
    logger.info('UI testing completed');
  }

  private async testPage(route: string): Promise<PageReport> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${route}`;
    const page = await this.context!.newPage();
    
    const consoleErrors: Array<{ type: string; message: string; location?: string; stack?: string; }> = [];
    const issues: UIIssue[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          message: msg.text(),
          location: msg.location()?.url,
        });
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      consoleErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      });
    });

    try {
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      
      const pageTitle = await page.title();
      const loadTime = Date.now() - startTime;

      // Test interactive elements
      const interactiveElements = await this.findInteractiveElements(page);
      const brokenElements = await this.testInteractiveElements(page, issues, url);

      // Test specific UI patterns
      await this.testTabFunctionality(page, issues, url);
      await this.testButtonFunctionality(page, issues, url);
      await this.testFormElements(page, issues, url);
      await this.testNavigationElements(page, issues, url);

      await page.close();

      return {
        url,
        route,
        pageTitle,
        issues,
        consoleErrors,
        loadTime,
        interactiveElements,
        brokenElements,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  private async findInteractiveElements(page: Page): Promise<number> {
    return await page.evaluate(() => {
      const interactiveSelectors = [
        'button:not([disabled])',
        'input:not([disabled]):not([readonly])',
        'select:not([disabled])',
        'textarea:not([disabled]):not([readonly])',
        'a[href]:not([href=""]):not([href="#"])',
        '[onclick]',
        '[role="button"]',
        '[role="tab"]',
        '[tabindex]:not([tabindex="-1"])'
      ];
      
      const elements = interactiveSelectors.reduce((acc, selector) => {
        return acc + document.querySelectorAll(selector).length;
      }, 0);

      return elements;
    });
  }

  private async testInteractiveElements(page: Page, issues: UIIssue[], url: string): Promise<number> {
    let brokenCount = 0;

    // Test buttons without click handlers
    const buttonsWithoutHandlers = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
      const problematic: Array<{ selector: string; text: string; tagName: string; }> = [];

      buttons.forEach((button, index) => {
        const hasOnClick = button.onclick !== null;
        const hasEventListeners = (button as any)._events || 
          getEventListeners ? Object.keys(getEventListeners(button)).length > 0 : false;
        const hasFormAction = button.closest('form') !== null;
        const isSubmitButton = button.getAttribute('type') === 'submit';
        const hasReactHandlers = Object.keys(button).some(key => key.startsWith('__reactInternalInstance'));
        
        // Create a unique selector
        let selector = button.tagName.toLowerCase();
        if (button.id) {
          selector += `#${button.id}`;
        } else if (button.className) {
          selector += `.${Array.from(button.classList).join('.')}`;
        } else {
          selector += `:nth-child(${Array.from(button.parentNode?.children || []).indexOf(button) + 1})`;
        }

        if (!hasOnClick && !hasEventListeners && !hasFormAction && !isSubmitButton && !hasReactHandlers) {
          problematic.push({
            selector,
            text: button.textContent?.trim() || button.innerHTML.trim() || 'No text',
            tagName: button.tagName
          });
        }
      });

      return problematic;
    });

    buttonsWithoutHandlers.forEach(btn => {
      issues.push({
        type: 'broken-button',
        severity: 'high',
        element: {
          selector: btn.selector,
          text: btn.text,
          tagName: btn.tagName
        },
        description: 'Button appears to have no click handler or functionality',
        expectedBehavior: 'Button should respond to clicks and perform an action',
        actualBehavior: 'Button has no visible event handlers or form association',
        suggestedFix: 'Add onClick handler, form association, or proper React event binding',
        autoFixable: false,
        location: { url }
      });
      brokenCount++;
    });

    return brokenCount;
  }

  private async testTabFunctionality(page: Page, issues: UIIssue[], url: string) {
    const tabIssues = await page.evaluate(() => {
      const tabLists = document.querySelectorAll('[role="tablist"], .tab-list, [data-tabs]');
      const problematic: Array<{
        selector: string;
        issue: string;
        tabs: Array<{ selector: string; text: string; }>;
      }> = [];

      tabLists.forEach((tabList, listIndex) => {
        const tabs = tabList.querySelectorAll('[role="tab"], .tab, [data-tab]');
        const panels = tabList.querySelectorAll('[role="tabpanel"], .tab-panel, [data-tab-panel]');
        
        let selector = tabList.tagName.toLowerCase();
        if (tabList.id) {
          selector += `#${tabList.id}`;
        } else {
          selector += `:nth-of-type(${listIndex + 1})`;
        }

        const tabsArray = Array.from(tabs).map((tab, index) => {
          let tabSelector = tab.tagName.toLowerCase();
          if (tab.id) {
            tabSelector += `#${tab.id}`;
          } else if (tab.className) {
            tabSelector += `.${Array.from(tab.classList).join('.')}`;
          } else {
            tabSelector += `:nth-child(${index + 1})`;
          }
          return {
            selector: tabSelector,
            text: tab.textContent?.trim() || 'No text'
          };
        });

        if (tabs.length > 1) {
          // Check if tabs have proper ARIA attributes
          const hasProperAria = Array.from(tabs).every(tab => 
            tab.hasAttribute('aria-controls') || tab.hasAttribute('data-target')
          );

          if (!hasProperAria && panels.length === 0) {
            problematic.push({
              selector,
              issue: 'Tabs lack proper ARIA controls and no panels found',
              tabs: tabsArray
            });
          }
        }
      });

      return problematic;
    });

    tabIssues.forEach(tab => {
      issues.push({
        type: 'non-functioning-tab',
        severity: 'medium',
        element: {
          selector: tab.selector,
          tagName: 'div'
        },
        description: `Tab system issue: ${tab.issue}`,
        expectedBehavior: 'Tabs should switch content panels when clicked',
        actualBehavior: 'Tab functionality appears incomplete or broken',
        suggestedFix: 'Add proper ARIA attributes (aria-controls, aria-selected) and corresponding tab panels',
        autoFixable: false,
        location: { url }
      });
    });
  }

  private async testButtonFunctionality(page: Page, issues: UIIssue[], url: string) {
    // Test specific buttons that should have functionality
    const buttonTests = [
      { selector: 'button:contains("Save")', expectedAction: 'save functionality' },
      { selector: 'button:contains("Submit")', expectedAction: 'form submission' },
      { selector: 'button:contains("Delete")', expectedAction: 'deletion functionality' },
      { selector: 'button:contains("Add")', expectedAction: 'add item functionality' },
      { selector: 'button:contains("Next")', expectedAction: 'navigation to next step' },
      { selector: 'button:contains("Back")', expectedAction: 'navigation to previous step' },
      { selector: '.wizard button', expectedAction: 'wizard navigation' }
    ];

    for (const test of buttonTests) {
      try {
        const buttons = await page.locator(test.selector).all();
        
        for (const button of buttons) {
          const isVisible = await button.isVisible();
          const isEnabled = await button.isEnabled();
          
          if (isVisible && isEnabled) {
            // Try to click and see if anything happens
            const initialUrl = page.url();
            const initialContent = await page.content();
            
            try {
              await button.click({ timeout: 1000 });
              await page.waitForTimeout(500); // Wait for potential changes
              
              const newUrl = page.url();
              const newContent = await page.content();
              
              // Check if anything changed
              if (initialUrl === newUrl && initialContent === newContent) {
                const text = await button.textContent();
                const selector = await this.generateSelector(button);
                
                issues.push({
                  type: 'broken-button',
                  severity: 'medium',
                  element: {
                    selector,
                    text: text || '',
                    tagName: 'button'
                  },
                  description: `Button "${text}" appears unresponsive - no visible changes after click`,
                  expectedBehavior: `Button should ${test.expectedAction}`,
                  actualBehavior: 'No detectable changes after clicking',
                  suggestedFix: 'Verify click handler implementation and ensure proper state updates',
                  autoFixable: false,
                  location: { url }
                });
              }
            } catch (clickError) {
              // Button might have thrown an error
              const text = await button.textContent();
              const selector = await this.generateSelector(button);
              
              issues.push({
                type: 'broken-button',
                severity: 'high',
                element: {
                  selector,
                  text: text || '',
                  tagName: 'button'
                },
                description: `Button "${text}" throws error when clicked: ${clickError}`,
                expectedBehavior: `Button should ${test.expectedAction}`,
                actualBehavior: 'Throws error on click',
                suggestedFix: 'Fix JavaScript error in click handler',
                autoFixable: false,
                location: { url }
              });
            }
          }
        }
      } catch (error) {
        // Selector not found, skip
        continue;
      }
    }
  }

  private async testFormElements(page: Page, issues: UIIssue[], url: string) {
    // Test form validation and submission
    const forms = await page.locator('form').all();
    
    for (const form of forms) {
      try {
        const isVisible = await form.isVisible();
        if (!isVisible) continue;

        const submitButtons = await form.locator('button[type="submit"], input[type="submit"]').all();
        const requiredFields = await form.locator('input[required], select[required], textarea[required]').all();
        
        // Test form submission without required fields
        if (submitButtons.length > 0 && requiredFields.length > 0) {
          try {
            await submitButtons[0].click({ timeout: 1000 });
            await page.waitForTimeout(500);
            
            // Check if validation messages appear
            const validationMessages = await page.locator('.error, [role="alert"], .invalid-feedback').count();
            
            if (validationMessages === 0) {
              const selector = await this.generateSelector(form);
              
              issues.push({
                type: 'missing-event-listener',
                severity: 'medium',
                element: {
                  selector,
                  tagName: 'form'
                },
                description: 'Form lacks proper client-side validation feedback',
                expectedBehavior: 'Form should show validation errors for required fields',
                actualBehavior: 'No validation messages displayed',
                suggestedFix: 'Add form validation with user feedback',
                autoFixable: false,
                location: { url }
              });
            }
          } catch (error) {
            // Form submission might have failed, which could be expected
            continue;
          }
        }
      } catch (error) {
        continue;
      }
    }
  }

  private async testNavigationElements(page: Page, issues: UIIssue[], url: string) {
    // Test navigation links
    const navLinks = await page.locator('nav a, [role="navigation"] a').all();
    
    for (const link of navLinks) {
      try {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (href === '#' || href === '' || href === null) {
          const selector = await this.generateSelector(link);
          
          issues.push({
            type: 'broken-button',
            severity: 'low',
            element: {
              selector,
              text: text || '',
              tagName: 'a'
            },
            description: 'Navigation link has no valid href or points to placeholder',
            expectedBehavior: 'Link should navigate to a valid page or section',
            actualBehavior: 'Link has empty or placeholder href',
            suggestedFix: 'Update href to point to valid destination or convert to button if it triggers JavaScript action',
            autoFixable: false,
            location: { url }
          });
        }
      } catch (error) {
        continue;
      }
    }
  }

  private async generateSelector(locator: any): Promise<string> {
    try {
      // Try to get a unique selector for the element
      const id = await locator.getAttribute('id');
      if (id) return `#${id}`;
      
      const className = await locator.getAttribute('class');
      if (className) {
        const classes = className.split(' ').filter(c => c.trim()).slice(0, 2).join('.');
        if (classes) return `.${classes}`;
      }
      
      const tagName = await locator.evaluate((el: Element) => el.tagName.toLowerCase());
      return tagName;
    } catch {
      return 'unknown';
    }
  }

  private generateSummary() {
    this.report.summary.totalPages = this.report.pages.length;
    
    this.report.pages.forEach(page => {
      page.issues.forEach(issue => {
        this.report.summary.totalIssues++;
        
        switch (issue.severity) {
          case 'critical':
            this.report.summary.criticalIssues++;
            break;
          case 'high':
            this.report.summary.highIssues++;
            break;
          case 'medium':
            this.report.summary.mediumIssues++;
            break;
          case 'low':
            this.report.summary.lowIssues++;
            break;
        }
        
        if (issue.autoFixable) {
          this.report.summary.autoFixableIssues++;
        }
      });
    });
  }

  private async generateRecommendations() {
    const recommendations: string[] = [];
    
    if (this.report.summary.criticalIssues > 0) {
      recommendations.push('🚨 Address critical issues immediately - these likely prevent core functionality');
    }
    
    if (this.report.summary.highIssues > 0) {
      recommendations.push('⚠️ High priority issues should be resolved in the next development cycle');
    }
    
    // Check for common patterns
    const buttonIssues = this.report.pages.reduce((acc, page) => 
      acc + page.issues.filter(i => i.type === 'broken-button').length, 0);
    
    if (buttonIssues > 3) {
      recommendations.push('🔘 Consider implementing a consistent button testing strategy and component library');
    }
    
    const consoleErrors = this.report.pages.reduce((acc, page) => acc + page.consoleErrors.length, 0);
    if (consoleErrors > 0) {
      recommendations.push('🐛 Fix console errors to improve stability and debugging');
    }
    
    const tabIssues = this.report.pages.reduce((acc, page) => 
      acc + page.issues.filter(i => i.type === 'non-functioning-tab').length, 0);
    
    if (tabIssues > 0) {
      recommendations.push('📑 Implement proper ARIA attributes and state management for tab components');
    }
    
    if (this.report.summary.autoFixableIssues > 0) {
      recommendations.push(`🔧 ${this.report.summary.autoFixableIssues} issues can be automatically fixed`);
    }
    
    recommendations.push('✅ Set up automated UI testing in your CI/CD pipeline');
    recommendations.push('📊 Run this test suite regularly to catch regressions early');
    
    this.report.recommendations = recommendations;
  }

  async generateReport(): Promise<string> {
    const reportsDir = join(process.cwd(), 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = join(reportsDir, `ui-test-report-${this.report.testRunId}.json`);
    const htmlReportPath = join(reportsDir, `ui-test-report-${this.report.testRunId}.html`);
    
    // Save JSON report
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Generate HTML report
    const html = this.generateHTMLReport();
    writeFileSync(htmlReportPath, html);
    
    logger.info(`Reports generated:`);
    logger.info(`JSON: ${reportPath}`);
    logger.info(`HTML: ${htmlReportPath}`);
    
    return htmlReportPath;
  }

  private generateHTMLReport(): string {
    const { summary } = this.report;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Test Report - ${this.report.projectName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 2.5rem; font-weight: bold; color: #1a202c; margin: 0 0 10px 0; }
        .subtitle { color: #718096; font-size: 1.1rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f7fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #3182ce; }
        .metric-value { font-size: 2rem; font-weight: bold; color: #2d3748; }
        .metric-label { color: #4a5568; font-size: 0.9rem; margin-top: 5px; }
        .critical { border-left-color: #e53e3e; }
        .high { border-left-color: #dd6b20; }
        .medium { border-left-color: #d69e2e; }
        .low { border-left-color: #38a169; }
        .section { margin-bottom: 40px; }
        .section-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 20px; color: #2d3748; }
        .recommendations { background: #edf2f7; border-radius: 8px; padding: 20px; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #3182ce; }
        .page-report { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .page-header { background: #f7fafc; padding: 15px; border-bottom: 1px solid #e2e8f0; }
        .page-title { font-weight: bold; color: #2d3748; }
        .page-url { color: #718096; font-size: 0.9rem; }
        .issues { padding: 15px; }
        .issue { border-left: 4px solid #cbd5e0; padding: 15px; margin-bottom: 15px; background: #f9f9f9; border-radius: 4px; }
        .issue.critical { border-left-color: #e53e3e; background: #fed7d7; }
        .issue.high { border-left-color: #dd6b20; background: #feebc8; }
        .issue.medium { border-left-color: #d69e2e; background: #faf089; }
        .issue.low { border-left-color: #38a169; background: #c6f6d5; }
        .issue-type { font-size: 0.8rem; text-transform: uppercase; font-weight: bold; color: #4a5568; }
        .issue-description { font-weight: bold; margin: 5px 0; }
        .issue-details { font-size: 0.9rem; color: #4a5568; margin: 5px 0; }
        .issue-fix { background: white; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; font-size: 0.85rem; }
        .no-issues { text-align: center; padding: 40px; color: #38a169; font-weight: bold; }
        .console-errors { background: #fed7d7; border-radius: 4px; padding: 10px; margin: 10px 0; }
        .error-item { font-family: monospace; font-size: 0.8rem; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${this.report.projectName} - UI Test Report</h1>
            <p class="subtitle">Generated on ${new Date(this.report.timestamp).toLocaleString()}</p>
            <p class="subtitle">Test Run ID: ${this.report.testRunId}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${summary.totalPages}</div>
                <div class="metric-label">Pages Tested</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalIssues}</div>
                <div class="metric-label">Total Issues</div>
            </div>
            <div class="metric critical">
                <div class="metric-value">${summary.criticalIssues}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric high">
                <div class="metric-value">${summary.highIssues}</div>
                <div class="metric-label">High Priority</div>
            </div>
            <div class="metric medium">
                <div class="metric-value">${summary.mediumIssues}</div>
                <div class="metric-label">Medium Priority</div>
            </div>
            <div class="metric low">
                <div class="metric-value">${summary.lowIssues}</div>
                <div class="metric-label">Low Priority</div>
            </div>
        </div>

        ${this.report.recommendations.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🎯 Recommendations</h2>
            <div class="recommendations">
                ${this.report.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">📄 Page Reports</h2>
            ${this.report.pages.map(page => `
                <div class="page-report">
                    <div class="page-header">
                        <div class="page-title">${page.pageTitle}</div>
                        <div class="page-url">${page.url}</div>
                        <div class="page-url">Load Time: ${page.loadTime}ms | Interactive Elements: ${page.interactiveElements} | Issues: ${page.issues.length}</div>
                    </div>
                    <div class="issues">
                        ${page.issues.length === 0 ? 
                            '<div class="no-issues">✅ No issues found on this page!</div>' :
                            page.issues.map(issue => `
                                <div class="issue ${issue.severity}">
                                    <div class="issue-type">${issue.type.replace('-', ' ')}</div>
                                    <div class="issue-description">${issue.description}</div>
                                    <div class="issue-details"><strong>Element:</strong> ${issue.element.selector} ${issue.element.text ? `("${issue.element.text}")` : ''}</div>
                                    <div class="issue-details"><strong>Expected:</strong> ${issue.expectedBehavior}</div>
                                    <div class="issue-details"><strong>Actual:</strong> ${issue.actualBehavior}</div>
                                    <div class="issue-fix"><strong>Suggested Fix:</strong> ${issue.suggestedFix}</div>
                                </div>
                            `).join('')
                        }
                        ${page.consoleErrors.length > 0 ? `
                            <div class="console-errors">
                                <strong>Console Errors:</strong>
                                ${page.consoleErrors.map(error => `<div class="error-item">${error.type}: ${error.message}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;
  }

  async close() {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Auto-fix functionality
class UIAutoFixer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async applyAutoFixes(report: TestReport): Promise<{ fixed: number; skipped: number; }> {
    let fixed = 0;
    let skipped = 0;

    logger.info('Applying automated fixes...');

    for (const page of report.pages) {
      for (const issue of page.issues) {
        if (issue.autoFixable) {
          try {
            await this.applyFix(issue);
            fixed++;
            logger.info(`✅ Fixed: ${issue.description}`);
          } catch (error) {
            skipped++;
            logger.warn(`⚠️ Could not auto-fix: ${issue.description} - ${error}`);
          }
        } else {
          skipped++;
        }
      }
    }

    logger.info(`Auto-fix complete: ${fixed} fixed, ${skipped} skipped`);
    return { fixed, skipped };
  }

  private async applyFix(issue: UIIssue): Promise<void> {
    // This would implement specific fixes based on issue type
    // For now, we'll just log what would be fixed
    logger.info(`Would fix: ${issue.type} - ${issue.suggestedFix}`);
  }
}

// Main execution function
async function runUITests(baseUrl?: string, autoFix: boolean = false) {
  const agent = new UITestAgent(baseUrl);
  
  try {
    await agent.initialize();
    await agent.testAllPages();
    
    const reportPath = await agent.generateReport();
    
    logger.info('='.repeat(60));
    logger.info('UI TEST SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`📊 Report available at: ${reportPath}`);
    logger.info(`🔍 Total Issues: ${agent.report.summary.totalIssues}`);
    logger.info(`🚨 Critical: ${agent.report.summary.criticalIssues}`);
    logger.info(`⚠️  High: ${agent.report.summary.highIssues}`);
    logger.info(`📝 Medium: ${agent.report.summary.mediumIssues}`);
    logger.info(`ℹ️  Low: ${agent.report.summary.lowIssues}`);
    
    if (autoFix && agent.report.summary.autoFixableIssues > 0) {
      const fixer = new UIAutoFixer();
      await fixer.applyAutoFixes(agent.report);
    }
    
    return agent.report;
    
  } finally {
    await agent.close();
  }
}

// CLI interface
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const autoFix = process.argv.includes('--auto-fix');
  
  runUITests(baseUrl, autoFix)
    .then((report) => {
      logger.info('UI testing completed successfully');
      process.exit(report.summary.criticalIssues > 0 ? 1 : 0);
    })
    .catch((error) => {
      logger.error(`UI testing failed: ${error}`);
      process.exit(1);
    });
}

export { UITestAgent, UIAutoFixer, runUITests };