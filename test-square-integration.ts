import { chromium, type Browser, type Page } from 'playwright';

const PROD_URL = 'https://signaturequoteai-main-3nkfwuszx-ekoapps.vercel.app';
const TEST_EMAIL = 'square-test-1760576747242@test.com';
const TEST_PASSWORD = 'TestPassword123!';
const SQUARE_ACCESS_TOKEN = 'EAAAlwR9zgftnMNK-Wath2OeTkpqg6VHVKV_XzPcCXqUVODR58caY4BxO64Fw9dh';
const SQUARE_LOCATION_ID = 'LMK858A133EV3';

async function testSquareIntegration() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Starting Square Integration Test...\n');

    // Launch browser
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();

    // Set up network monitoring for API requests
    const apiResponses: Array<{ url: string; status: number; body: any }> = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/integrations/square/connect')) {
        try {
          const body = await response.json();
          apiResponses.push({
            url,
            status: response.status(),
            body
          });
          console.log('📡 API Response Captured:', {
            status: response.status(),
            environment: body.environment || 'NOT FOUND',
            success: body.success
          });
        } catch (e) {
          console.error('❌ Failed to parse API response:', e);
        }
      }
    });

    // Step 1: Navigate to sign-in page
    console.log('1️⃣ Navigating to sign-in page...');
    await page.goto(`${PROD_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/Users/ekodevapps/Desktop/step1-signin-page.png' });
    console.log('✅ Sign-in page loaded\n');

    // Step 2: Sign in with test account
    console.log('2️⃣ Signing in with test account...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.screenshot({ path: '/Users/ekodevapps/Desktop/step2-credentials-filled.png' });

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: '/Users/ekodevapps/Desktop/step3-logged-in.png' });
    console.log('✅ Successfully signed in\n');

    // Step 3: Navigate to settings page
    console.log('3️⃣ Navigating to settings page...');
    await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/Users/ekodevapps/Desktop/step4-settings-page.png' });
    console.log('✅ Settings page loaded\n');

    // Step 4: Expand Square integration section
    console.log('4️⃣ Looking for Square integration section...');

    // Wait for the page to fully load
    await page.waitForTimeout(2000);

    // Try to find and click the Square section
    const squareSection = page.locator('text=/Square.*Integration/i').first();
    if (await squareSection.isVisible()) {
      console.log('✅ Found Square Integration section');
      await squareSection.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️ Square section not immediately visible, scrolling...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: '/Users/ekodevapps/Desktop/step5-square-section.png' });
    console.log('✅ Square section expanded\n');

    // Step 5: Fill in Square credentials
    console.log('5️⃣ Filling in Square credentials...');

    // Look for input fields
    const accessTokenInput = page.locator('input[name*="access" i], input[placeholder*="access" i]').first();
    const locationIdInput = page.locator('input[name*="location" i], input[placeholder*="location" i]').first();

    await accessTokenInput.fill(SQUARE_ACCESS_TOKEN);
    await locationIdInput.fill(SQUARE_LOCATION_ID);

    await page.screenshot({ path: '/Users/ekodevapps/Desktop/step6-credentials-filled.png' });
    console.log('✅ Credentials filled\n');

    // Step 6: Click Connect button and monitor network
    console.log('6️⃣ Clicking "Connect Square Account" button...');
    const connectButton = page.locator('button:has-text("Connect")').first();

    // Start waiting for the API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/integrations/square/connect'),
      { timeout: 15000 }
    );

    await connectButton.click();
    console.log('⏳ Waiting for API response...\n');

    // Wait for the response
    const response = await responsePromise;
    const responseBody = await response.json();

    console.log('📊 API RESPONSE DETAILS:');
    console.log('━'.repeat(50));
    console.log('Status:', response.status());
    console.log('Full Response:', JSON.stringify(responseBody, null, 2));
    console.log('━'.repeat(50));
    console.log('\n');

    // Step 7: Verify environment value
    console.log('7️⃣ CRITICAL CHECK - Verifying environment value...');
    const environment = responseBody.environment;

    if (environment === 'production') {
      console.log('✅ ✅ ✅ SUCCESS! Environment is "production" ✅ ✅ ✅\n');
    } else if (environment === 'sandbox') {
      console.log('❌ ❌ ❌ FAILURE! Environment is still "sandbox" ❌ ❌ ❌\n');
    } else {
      console.log(`⚠️ WARNING! Environment value is: "${environment}"\n`);
    }

    // Step 8: Wait for success/error message
    console.log('8️⃣ Waiting for UI feedback...');
    await page.waitForTimeout(3000);

    // Check for success or error messages
    const successMessage = await page.locator('text=/success|connected/i').first().isVisible().catch(() => false);
    const errorMessage = await page.locator('text=/error|failed/i').first().isVisible().catch(() => false);

    if (successMessage) {
      console.log('✅ Success message displayed\n');
    } else if (errorMessage) {
      console.log('❌ Error message displayed\n');
    } else {
      console.log('⚠️ No clear success/error message found\n');
    }

    // Step 9: Take final screenshot
    console.log('9️⃣ Taking final screenshot...');
    await page.screenshot({
      path: '/Users/ekodevapps/Desktop/final-square-integration-result.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved\n');

    // Final Report
    console.log('\n' + '='.repeat(70));
    console.log('📋 FINAL TEST REPORT');
    console.log('='.repeat(70));
    console.log(`Production URL: ${PROD_URL}`);
    console.log(`API Endpoint: /api/integrations/square/connect`);
    console.log(`Response Status: ${response.status()}`);
    console.log(`Environment Value: "${environment}" ${environment === 'production' ? '✅' : '❌'}`);
    console.log(`Connection Success: ${responseBody.success ? '✅ Yes' : '❌ No'}`);
    console.log(`UI Feedback: ${successMessage ? 'Success message shown' : errorMessage ? 'Error message shown' : 'No clear message'}`);

    if (responseBody.error) {
      console.log(`Error Details: ${responseBody.error}`);
    }

    console.log('\n📸 Screenshots saved to Desktop:');
    console.log('  - step1-signin-page.png');
    console.log('  - step2-credentials-filled.png');
    console.log('  - step3-logged-in.png');
    console.log('  - step4-settings-page.png');
    console.log('  - step5-square-section.png');
    console.log('  - step6-credentials-filled.png');
    console.log('  - final-square-integration-result.png');
    console.log('='.repeat(70));

    // Return test result
    return {
      success: environment === 'production' && responseBody.success,
      environment,
      responseStatus: response.status(),
      responseBody
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);

    if (page) {
      await page.screenshot({
        path: '/Users/ekodevapps/Desktop/error-screenshot.png',
        fullPage: true
      });
      console.log('\n📸 Error screenshot saved to Desktop');
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
  }
}

// Run the test
testSquareIntegration()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ ✅ ✅ ALL CHECKS PASSED! ✅ ✅ ✅');
      process.exit(0);
    } else {
      console.log('\n❌ ❌ ❌ TEST FAILED! ❌ ❌ ❌');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  });
