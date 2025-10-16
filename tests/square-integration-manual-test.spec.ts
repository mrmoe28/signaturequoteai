import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Square Integration Manual Connection Test
 *
 * This test validates the Square integration on the settings page by:
 * 1. Navigating to the settings page
 * 2. Looking for the Square Payment Integration section
 * 3. Attempting to connect with provided credentials
 * 4. Monitoring network requests and responses
 * 5. Capturing errors, success messages, and state changes
 *
 * Prerequisites:
 * - User must be logged in (or test will handle login)
 * - Square Access Token and Location ID must be provided as environment variables
 *
 * Environment Variables:
 * - TEST_SQUARE_ACCESS_TOKEN: Your Square access token (sandbox or production)
 * - TEST_SQUARE_LOCATION_ID: Your Square location ID
 * - TEST_USER_EMAIL: Email for login (if not already logged in)
 * - TEST_USER_PASSWORD: Password for login (if not already logged in)
 */

const PRODUCTION_URL = 'https://signaturequoteai-main-it5qwudt2-ekoapps.vercel.app';
const SETTINGS_URL = `${PRODUCTION_URL}/settings`;

// Test credentials from environment
const SQUARE_ACCESS_TOKEN = process.env.TEST_SQUARE_ACCESS_TOKEN || '';
const SQUARE_LOCATION_ID = process.env.TEST_SQUARE_LOCATION_ID || '';
const USER_EMAIL = process.env.TEST_USER_EMAIL || '';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || '';

// Create results directory
const RESULTS_DIR = path.join(__dirname, '../test-results/square-integration');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

interface NetworkRequest {
  url: string;
  method: string;
  timestamp: string;
  requestHeaders: Record<string, string>;
  requestBody?: any;
}

interface NetworkResponse {
  url: string;
  status: number;
  statusText: string;
  timestamp: string;
  responseHeaders: Record<string, string>;
  responseBody?: any;
}

interface TestReport {
  timestamp: string;
  testDuration: number;
  credentialsProvided: {
    accessToken: boolean;
    locationId: boolean;
    userEmail: boolean;
    userPassword: boolean;
  };
  steps: Array<{
    step: string;
    status: 'success' | 'failed' | 'skipped';
    details?: string;
    screenshot?: string;
    timestamp: string;
  }>;
  networkRequests: NetworkRequest[];
  networkResponses: NetworkResponse[];
  consoleErrors: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  finalState: {
    connected: boolean;
    errorMessage?: string;
    connectionStatus?: string;
  };
}

test.describe('Square Integration Manual Connection Test', () => {
  let testReport: TestReport;
  let startTime: number;

  test.beforeEach(async ({ page }) => {
    startTime = Date.now();
    testReport = {
      timestamp: new Date().toISOString(),
      testDuration: 0,
      credentialsProvided: {
        accessToken: !!SQUARE_ACCESS_TOKEN,
        locationId: !!SQUARE_LOCATION_ID,
        userEmail: !!USER_EMAIL,
        userPassword: !!USER_PASSWORD,
      },
      steps: [],
      networkRequests: [],
      networkResponses: [],
      consoleErrors: [],
      finalState: {
        connected: false,
      },
    };

    // Monitor network requests
    page.on('request', (request) => {
      if (request.url().includes('/api/integrations/square') ||
          request.url().includes('/api/users/') && request.url().includes('square')) {
        const networkRequest: NetworkRequest = {
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString(),
          requestHeaders: request.headers(),
        };

        try {
          const postData = request.postData();
          if (postData) {
            networkRequest.requestBody = JSON.parse(postData);
            // Redact sensitive data in logs
            if (networkRequest.requestBody.accessToken) {
              networkRequest.requestBody.accessToken = networkRequest.requestBody.accessToken.substring(0, 10) + '...';
            }
          }
        } catch (e) {
          // Ignore parse errors
        }

        testReport.networkRequests.push(networkRequest);
      }
    });

    // Monitor network responses
    page.on('response', async (response) => {
      if (response.url().includes('/api/integrations/square') ||
          response.url().includes('/api/users/') && response.url().includes('square')) {
        const networkResponse: NetworkResponse = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString(),
          responseHeaders: response.headers(),
        };

        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            networkResponse.responseBody = await response.json();
          }
        } catch (e) {
          // Ignore parse errors
        }

        testReport.networkResponses.push(networkResponse);
      }
    });

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        testReport.consoleErrors.push({
          type: msg.type(),
          message: msg.text(),
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  test.afterEach(async () => {
    testReport.testDuration = Date.now() - startTime;

    // Save detailed report
    const reportPath = path.join(RESULTS_DIR, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

    // Print summary to console
    console.log('\n=== SQUARE INTEGRATION TEST REPORT ===');
    console.log(`Test Duration: ${testReport.testDuration}ms`);
    console.log(`\nCredentials Provided:`);
    console.log(`  Access Token: ${testReport.credentialsProvided.accessToken ? 'YES' : 'NO'}`);
    console.log(`  Location ID: ${testReport.credentialsProvided.locationId ? 'YES' : 'NO'}`);
    console.log(`  User Email: ${testReport.credentialsProvided.userEmail ? 'YES' : 'NO'}`);
    console.log(`  User Password: ${testReport.credentialsProvided.userPassword ? 'YES' : 'NO'}`);

    console.log(`\nTest Steps:`);
    testReport.steps.forEach((step, index) => {
      console.log(`  ${index + 1}. [${step.status.toUpperCase()}] ${step.step}`);
      if (step.details) {
        console.log(`     ${step.details}`);
      }
    });

    console.log(`\nNetwork Requests: ${testReport.networkRequests.length}`);
    testReport.networkRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      if (req.requestBody) {
        console.log(`     Body: ${JSON.stringify(req.requestBody)}`);
      }
    });

    console.log(`\nNetwork Responses: ${testReport.networkResponses.length}`);
    testReport.networkResponses.forEach((res, index) => {
      console.log(`  ${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
      if (res.responseBody) {
        console.log(`     Body: ${JSON.stringify(res.responseBody)}`);
      }
    });

    console.log(`\nConsole Errors: ${testReport.consoleErrors.length}`);
    testReport.consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.type}] ${error.message}`);
    });

    console.log(`\nFinal State:`);
    console.log(`  Connected: ${testReport.finalState.connected ? 'YES' : 'NO'}`);
    if (testReport.finalState.errorMessage) {
      console.log(`  Error: ${testReport.finalState.errorMessage}`);
    }
    if (testReport.finalState.connectionStatus) {
      console.log(`  Status: ${testReport.finalState.connectionStatus}`);
    }

    console.log(`\nDetailed report saved to: ${reportPath}`);
    console.log('=====================================\n');
  });

  const addStep = (step: string, status: 'success' | 'failed' | 'skipped', details?: string, screenshot?: string) => {
    testReport.steps.push({
      step,
      status,
      details,
      screenshot,
      timestamp: new Date().toISOString(),
    });
  };

  const takeScreenshot = async (page: Page, name: string): Promise<string> => {
    const screenshotPath = path.join(RESULTS_DIR, `${name}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  };

  test('Complete Square Integration Test', async ({ page }) => {
    // Check if credentials are provided
    if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
      addStep('Check credentials', 'skipped', 'Square credentials not provided. Set TEST_SQUARE_ACCESS_TOKEN and TEST_SQUARE_LOCATION_ID environment variables.');
      console.log('\n⚠️  CREDENTIALS REQUIRED ⚠️');
      console.log('To run this test, set the following environment variables:');
      console.log('  TEST_SQUARE_ACCESS_TOKEN=<your-square-access-token>');
      console.log('  TEST_SQUARE_LOCATION_ID=<your-square-location-id>');
      console.log('  TEST_USER_EMAIL=<your-email> (if not logged in)');
      console.log('  TEST_USER_PASSWORD=<your-password> (if not logged in)');
      console.log('\nExample:');
      console.log('  TEST_SQUARE_ACCESS_TOKEN=EAAAl... TEST_SQUARE_LOCATION_ID=L... npx playwright test tests/square-integration-manual-test.spec.ts');
      return;
    }

    addStep('Check credentials', 'success', 'Credentials provided');

    // Step 1: Navigate to production URL
    try {
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      const screenshot1 = await takeScreenshot(page, 'home-page');
      addStep('Navigate to production URL', 'success', `Navigated to ${PRODUCTION_URL}`, screenshot1);
    } catch (error) {
      const screenshot1 = await takeScreenshot(page, 'home-page-error');
      addStep('Navigate to production URL', 'failed', `Failed to navigate: ${error}`, screenshot1);
      throw error;
    }

    // Step 2: Check if login is required
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/sign-in') || currentUrl.includes('/login')) {
      if (!USER_EMAIL || !USER_PASSWORD) {
        const screenshot2 = await takeScreenshot(page, 'login-required');
        addStep('Check authentication', 'failed', 'Login required but credentials not provided', screenshot2);
        throw new Error('Login required but TEST_USER_EMAIL and TEST_USER_PASSWORD not provided');
      }

      try {
        // Attempt login
        await page.fill('input[type="email"], input[name="email"]', USER_EMAIL);
        await page.fill('input[type="password"], input[name="password"]', USER_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle' });
        const screenshot2 = await takeScreenshot(page, 'after-login');
        addStep('Login to application', 'success', 'Successfully logged in', screenshot2);
      } catch (error) {
        const screenshot2 = await takeScreenshot(page, 'login-error');
        addStep('Login to application', 'failed', `Login failed: ${error}`, screenshot2);
        throw error;
      }
    } else {
      addStep('Check authentication', 'success', 'Already authenticated');
    }

    // Step 3: Navigate to settings page
    try {
      await page.goto(SETTINGS_URL, { waitUntil: 'networkidle' });
      const screenshot3 = await takeScreenshot(page, 'settings-page');
      addStep('Navigate to settings page', 'success', `Navigated to ${SETTINGS_URL}`, screenshot3);
    } catch (error) {
      const screenshot3 = await takeScreenshot(page, 'settings-page-error');
      addStep('Navigate to settings page', 'failed', `Failed to navigate: ${error}`, screenshot3);
      throw error;
    }

    // Step 4: Find Square Integration section
    try {
      await page.waitForSelector('text=Square Payment Integration', { timeout: 10000 });
      const screenshot4 = await takeScreenshot(page, 'square-section-found');
      addStep('Locate Square Integration section', 'success', 'Square Payment Integration section found', screenshot4);
    } catch (error) {
      const screenshot4 = await takeScreenshot(page, 'square-section-not-found');
      addStep('Locate Square Integration section', 'failed', 'Square Payment Integration section not found', screenshot4);
      throw error;
    }

    // Step 5: Check current connection status
    try {
      const connectedBadge = await page.locator('text=Connected').count();
      const notConnectedBadge = await page.locator('text=Not Connected').count();

      if (connectedBadge > 0) {
        const screenshot5 = await takeScreenshot(page, 'already-connected');
        addStep('Check connection status', 'success', 'Square already connected. Will test disconnect first.', screenshot5);

        // Click Setup/Hide button to expand if collapsed
        const setupButton = page.locator('button:has-text("Setup"), button:has-text("Hide")');
        if (await setupButton.count() > 0) {
          await setupButton.click();
          await page.waitForTimeout(1000);
        }

        // Disconnect first
        try {
          page.once('dialog', dialog => dialog.accept());
          await page.click('button:has-text("Disconnect Square Account")');
          await page.waitForTimeout(2000);
          const screenshot5b = await takeScreenshot(page, 'after-disconnect');
          addStep('Disconnect existing connection', 'success', 'Disconnected successfully', screenshot5b);

          // Wait for page reload
          await page.waitForLoadState('networkidle');
        } catch (disconnectError) {
          const screenshot5b = await takeScreenshot(page, 'disconnect-error');
          addStep('Disconnect existing connection', 'failed', `Disconnect failed: ${disconnectError}`, screenshot5b);
        }
      } else if (notConnectedBadge > 0) {
        const screenshot5 = await takeScreenshot(page, 'not-connected');
        addStep('Check connection status', 'success', 'Square not connected. Ready to test connection.', screenshot5);
      }
    } catch (error) {
      const screenshot5 = await takeScreenshot(page, 'status-check-error');
      addStep('Check connection status', 'failed', `Failed to check status: ${error}`, screenshot5);
    }

    // Step 6: Expand Square Integration section if collapsed
    try {
      const setupButton = page.locator('button:has-text("Setup")');
      if (await setupButton.count() > 0) {
        await setupButton.click();
        await page.waitForTimeout(1000);
        const screenshot6 = await takeScreenshot(page, 'section-expanded');
        addStep('Expand Square Integration section', 'success', 'Section expanded', screenshot6);
      } else {
        addStep('Expand Square Integration section', 'success', 'Section already expanded');
      }
    } catch (error) {
      const screenshot6 = await takeScreenshot(page, 'expand-error');
      addStep('Expand Square Integration section', 'failed', `Failed to expand: ${error}`, screenshot6);
    }

    // Step 7: Fill in Square Access Token
    try {
      const accessTokenInput = page.locator('input#accessToken');
      await accessTokenInput.clear();
      await accessTokenInput.fill(SQUARE_ACCESS_TOKEN);
      const screenshot7 = await takeScreenshot(page, 'access-token-filled');
      addStep('Fill Square Access Token', 'success', `Token filled (${SQUARE_ACCESS_TOKEN.substring(0, 10)}...)`, screenshot7);
    } catch (error) {
      const screenshot7 = await takeScreenshot(page, 'access-token-error');
      addStep('Fill Square Access Token', 'failed', `Failed to fill token: ${error}`, screenshot7);
      throw error;
    }

    // Step 8: Fill in Square Location ID
    try {
      const locationIdInput = page.locator('input#locationId');
      await locationIdInput.clear();
      await locationIdInput.fill(SQUARE_LOCATION_ID);
      const screenshot8 = await takeScreenshot(page, 'location-id-filled');
      addStep('Fill Square Location ID', 'success', `Location ID filled (${SQUARE_LOCATION_ID})`, screenshot8);
    } catch (error) {
      const screenshot8 = await takeScreenshot(page, 'location-id-error');
      addStep('Fill Square Location ID', 'failed', `Failed to fill location ID: ${error}`, screenshot8);
      throw error;
    }

    // Step 9: Click Connect Square Account button
    try {
      const screenshot9a = await takeScreenshot(page, 'before-connect');
      await page.click('button:has-text("Connect Square Account")');
      addStep('Click Connect button', 'success', 'Connect button clicked', screenshot9a);

      // Wait for response
      await page.waitForTimeout(3000);
      const screenshot9b = await takeScreenshot(page, 'after-connect-click');
      addStep('Wait for response', 'success', 'Waited for response', screenshot9b);
    } catch (error) {
      const screenshot9 = await takeScreenshot(page, 'connect-click-error');
      addStep('Click Connect button', 'failed', `Failed to click connect: ${error}`, screenshot9);
      throw error;
    }

    // Step 10: Check for alerts or messages
    try {
      // Check for alert dialogs
      page.on('dialog', async (dialog) => {
        const message = dialog.message();
        testReport.finalState.errorMessage = message;

        if (message.includes('success')) {
          addStep('Check alert messages', 'success', `Success alert: ${message}`);
          testReport.finalState.connected = true;
        } else {
          addStep('Check alert messages', 'failed', `Error alert: ${message}`);
        }

        await dialog.accept();
      });

      // Wait a bit for any dialogs
      await page.waitForTimeout(2000);
    } catch (error) {
      addStep('Check alert messages', 'failed', `Error checking alerts: ${error}`);
    }

    // Step 11: Check final connection status
    try {
      // Wait for potential page reload
      await page.waitForLoadState('networkidle');

      const screenshot11 = await takeScreenshot(page, 'final-state');

      // Check if connected badge appears
      const connectedBadge = await page.locator('text=Connected').count();
      const notConnectedBadge = await page.locator('text=Not Connected').count();

      if (connectedBadge > 0) {
        testReport.finalState.connected = true;
        testReport.finalState.connectionStatus = 'Connected';
        addStep('Verify final connection status', 'success', 'Square successfully connected!', screenshot11);
      } else if (notConnectedBadge > 0) {
        testReport.finalState.connected = false;
        testReport.finalState.connectionStatus = 'Not Connected';
        addStep('Verify final connection status', 'failed', 'Connection failed - still showing Not Connected', screenshot11);
      } else {
        testReport.finalState.connectionStatus = 'Unknown';
        addStep('Verify final connection status', 'failed', 'Could not determine connection status', screenshot11);
      }
    } catch (error) {
      const screenshot11 = await takeScreenshot(page, 'final-state-error');
      addStep('Verify final connection status', 'failed', `Failed to check final status: ${error}`, screenshot11);
    }

    // Step 12: Capture connection details if connected
    if (testReport.finalState.connected) {
      try {
        const screenshot12 = await takeScreenshot(page, 'connection-details');

        // Try to read connection details from the page
        const locationIdText = await page.locator('text=/Location ID:.*/')?.textContent() || '';
        const environmentText = await page.locator('text=/Environment:.*/')?.textContent() || '';
        const connectedAtText = await page.locator('text=/Connected:.*/')?.textContent() || '';

        addStep('Capture connection details', 'success',
          `Details captured:\n${locationIdText}\n${environmentText}\n${connectedAtText}`,
          screenshot12);
      } catch (error) {
        addStep('Capture connection details', 'failed', `Failed to capture details: ${error}`);
      }
    }

    // Final assertion
    expect(testReport.finalState.connected).toBe(true);
  });
});
