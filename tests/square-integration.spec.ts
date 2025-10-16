import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PRODUCTION_URL = 'https://signaturequoteai-main-it5qwudt2-ekoapps.vercel.app';
const TEST_EMAIL = 'square-test-1760576747242@test.com';
const TEST_PASSWORD = 'TestPassword123!';
const SQUARE_ACCESS_TOKEN = 'EAAAlwR9zgftnMNK-Wath2OeTkpqg6VHVKV_XzPcCXqUVODR58caY4BxO64Fw9dh';
const SQUARE_LOCATION_ID = 'LMK858A133EV3';

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots', 'square-integration');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData: string | null;
  timestamp: string;
}

interface NetworkResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
}

interface ConsoleMessage {
  type: string;
  text: string;
  location: string;
  timestamp: string;
}

test.describe('Square Integration Connection Flow', () => {
  let consoleMessages: ConsoleMessage[] = [];
  let networkRequests: NetworkRequest[] = [];
  let networkResponses: NetworkResponse[] = [];
  let squareApiRequest: NetworkRequest | null = null;
  let squareApiResponse: NetworkResponse | null = null;

  test.beforeEach(async ({ page }) => {
    // Setup console listener
    page.on('console', async (msg) => {
      const msgText = msg.text();
      const msgType = msg.type();
      const location = msg.location();

      consoleMessages.push({
        type: msgType,
        text: msgText,
        location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
        timestamp: new Date().toISOString()
      });

      console.log(`[CONSOLE ${msgType.toUpperCase()}] ${msgText}`);
    });

    // Setup network request listener
    page.on('request', async (request) => {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.headers())) {
        headers[key] = value;
      }

      const reqData: NetworkRequest = {
        url: request.url(),
        method: request.method(),
        headers,
        postData: request.postData(),
        timestamp: new Date().toISOString()
      };

      networkRequests.push(reqData);

      // Capture Square API request
      if (request.url().includes('/api/integrations/square/connect')) {
        squareApiRequest = reqData;
        console.log('\n🔵 SQUARE API REQUEST CAPTURED:');
        console.log('URL:', request.url());
        console.log('Method:', request.method());
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('Body:', request.postData());
      }
    });

    // Setup network response listener
    page.on('response', async (response) => {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers())) {
        headers[key] = value;
      }

      let body = '';
      try {
        body = await response.text();
      } catch (e) {
        body = '[Unable to read response body]';
      }

      const resData: NetworkResponse = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers,
        body,
        timestamp: new Date().toISOString()
      };

      networkResponses.push(resData);

      // Capture Square API response
      if (response.url().includes('/api/integrations/square/connect')) {
        squareApiResponse = resData;
        console.log('\n🟢 SQUARE API RESPONSE CAPTURED:');
        console.log('Status:', response.status(), response.statusText());
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('Body:', body);
      }
    });
  });

  test('Complete Square Integration Flow', async ({ page }) => {
    console.log('\n=== STARTING SQUARE INTEGRATION TEST ===\n');

    // Step 1: Navigate to Sign-In Page
    console.log('📍 Step 1: Navigate to Sign-In Page');
    await page.goto(`${PRODUCTION_URL}/auth/sign-in`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-sign-in-page.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 01-sign-in-page.png');

    // Check for console errors
    const step1Errors = consoleMessages.filter(m => m.type === 'error');
    if (step1Errors.length > 0) {
      console.log('⚠️  Console errors on sign-in page:', step1Errors);
    }

    // Step 2: Sign In
    console.log('\n📍 Step 2: Sign In');

    // Fill in email
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.clear();
    await emailInput.fill(TEST_EMAIL);
    console.log('✅ Email filled');

    // Fill in password
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.clear();
    await passwordInput.fill(TEST_PASSWORD);
    console.log('✅ Password filled');

    // Take screenshot before clicking sign in
    await page.screenshot({
      path: path.join(screenshotsDir, '02-credentials-filled.png'),
      fullPage: true
    });

    // Click sign-in button
    const signInButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await signInButton.click();
    console.log('✅ Sign-in button clicked');

    // Wait for navigation or error message
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(screenshotsDir, '03-after-login.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 03-after-login.png');

    // Check for error messages
    const errorMessage = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').first().textContent().catch(() => null);
    if (errorMessage) {
      console.log('❌ Error message displayed:', errorMessage);
    } else {
      console.log('✅ No error messages visible');
    }

    // Step 3: Navigate to Settings
    console.log('\n📍 Step 3: Navigate to Settings');
    await page.goto(`${PRODUCTION_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, '04-settings-page.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 04-settings-page.png');

    const step3Errors = consoleMessages.filter(m => m.type === 'error' && m.timestamp > new Date(Date.now() - 5000).toISOString());
    if (step3Errors.length > 0) {
      console.log('⚠️  Console errors on settings page:', step3Errors);
    }

    // Step 4: Locate Square Integration Section
    console.log('\n📍 Step 4: Locate Square Integration Section');

    // Look for Square integration card
    const squareCard = page.locator('text=Square Payment Integration').first();
    await squareCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Check for setup/expand button
    const setupButton = page.locator('button:has-text("Setup"), button:has-text("Show"), button:has-text("Configure")').first();
    const setupButtonVisible = await setupButton.isVisible().catch(() => false);

    if (setupButtonVisible) {
      console.log('✅ Found Setup/Show button, clicking...');
      await setupButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(screenshotsDir, '05-square-section.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 05-square-section.png');

    // Step 5: Fill Square Credentials
    console.log('\n📍 Step 5: Fill Square Credentials');

    // Find and fill Access Token
    const accessTokenInput = page.locator('input[name="squareAccessToken"], input[id*="accessToken"], input[placeholder*="Access Token"]').first();
    await accessTokenInput.scrollIntoViewIfNeeded();
    await accessTokenInput.clear();
    await accessTokenInput.fill(SQUARE_ACCESS_TOKEN);
    console.log('✅ Access Token filled');

    // Find and fill Location ID
    const locationIdInput = page.locator('input[name="squareLocationId"], input[id*="locationId"], input[placeholder*="Location ID"]').first();
    await locationIdInput.scrollIntoViewIfNeeded();
    await locationIdInput.clear();
    await locationIdInput.fill(SQUARE_LOCATION_ID);
    console.log('✅ Location ID filled');

    await page.screenshot({
      path: path.join(screenshotsDir, '06-credentials-filled.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 06-credentials-filled.png');

    // Step 6 & 7: Monitor Network & Click Connect
    console.log('\n📍 Step 6-7: Click Connect and Monitor Network');

    // Clear previous captures
    squareApiRequest = null;
    squareApiResponse = null;

    // Find and click Connect button
    const connectButton = page.locator('button:has-text("Connect Square"), button:has-text("Connect Account")').first();
    await connectButton.scrollIntoViewIfNeeded();
    await connectButton.click();
    console.log('✅ Connect button clicked');

    // Wait for loading state and response
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(screenshotsDir, '07-after-connect-click.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 07-after-connect-click.png');

    // Step 8: Verify Connection Status
    console.log('\n📍 Step 8: Verify Connection Status');

    // Wait for any UI updates
    await page.waitForTimeout(3000);

    // Check for success/error messages
    const successMessage = await page.locator('[role="status"], .success, .text-green-500, text=Connected, text=Success').first().textContent().catch(() => null);
    const errorMsg = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').first().textContent().catch(() => null);

    if (successMessage) {
      console.log('✅ Success message:', successMessage);
    }
    if (errorMsg) {
      console.log('❌ Error message:', errorMsg);
    }

    // Check for Connected badge
    const connectedBadge = await page.locator('text=Connected, [class*="badge"]:has-text("Connected")').first().isVisible().catch(() => false);
    console.log('Connection badge visible:', connectedBadge);

    // Look for connection details
    const connectionDetails = await page.locator('text=Location ID, text=Environment, text=Sandbox, text=Production').count();
    console.log('Connection details found:', connectionDetails);

    await page.screenshot({
      path: path.join(screenshotsDir, '08-final-state.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 08-final-state.png');

    // Generate detailed report
    console.log('\n=== DETAILED TEST REPORT ===\n');

    console.log('📊 CONSOLE MESSAGES:');
    console.log('Total messages:', consoleMessages.length);
    console.log('Errors:', consoleMessages.filter(m => m.type === 'error').length);
    console.log('Warnings:', consoleMessages.filter(m => m.type === 'warning').length);

    if (consoleMessages.filter(m => m.type === 'error').length > 0) {
      console.log('\n❌ ERROR DETAILS:');
      consoleMessages.filter(m => m.type === 'error').forEach(msg => {
        console.log(`  - [${msg.timestamp}] ${msg.text}`);
        console.log(`    Location: ${msg.location}`);
      });
    }

    console.log('\n📡 SQUARE API REQUEST:');
    if (squareApiRequest) {
      console.log('Method:', squareApiRequest.method);
      console.log('URL:', squareApiRequest.url);
      console.log('Headers:', JSON.stringify(squareApiRequest.headers, null, 2));
      console.log('Body:', squareApiRequest.postData);
    } else {
      console.log('❌ No Square API request captured!');
    }

    console.log('\n📥 SQUARE API RESPONSE:');
    if (squareApiResponse) {
      console.log('Status:', squareApiResponse.status, squareApiResponse.statusText);
      console.log('Headers:', JSON.stringify(squareApiResponse.headers, null, 2));
      console.log('Body:', squareApiResponse.body);
    } else {
      console.log('❌ No Square API response captured!');
    }

    console.log('\n✅ TEST SUMMARY:');
    console.log('- Sign-in page loaded:', '✓');
    console.log('- Login attempted:', '✓');
    console.log('- Settings page loaded:', '✓');
    console.log('- Credentials filled:', '✓');
    console.log('- Connect button clicked:', '✓');
    console.log('- API request captured:', squareApiRequest ? '✓' : '✗');
    console.log('- API response captured:', squareApiResponse ? '✓' : '✗');
    console.log('- Connection status:', connectedBadge ? 'Connected ✓' : 'Not Connected ✗');

    // Save detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      testUrl: PRODUCTION_URL,
      summary: {
        signInPageLoaded: true,
        loginAttempted: true,
        settingsPageLoaded: true,
        credentialsFilled: true,
        connectButtonClicked: true,
        apiRequestCaptured: !!squareApiRequest,
        apiResponseCaptured: !!squareApiResponse,
        connectionEstablished: connectedBadge
      },
      consoleMessages,
      squareApiRequest,
      squareApiResponse,
      allNetworkRequests: networkRequests.filter(r => r.url.includes('square')),
      allNetworkResponses: networkResponses.filter(r => r.url.includes('square'))
    };

    fs.writeFileSync(
      path.join(screenshotsDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('\n📄 Detailed report saved to test-report.json');

    console.log('\n=== TEST COMPLETED ===\n');
  });
});
