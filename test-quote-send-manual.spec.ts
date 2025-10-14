import { test, expect } from '@playwright/test';

test('Test quote sending functionality with manual sign-in', async ({ page }) => {
  // Enable console logging
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // Capture network responses
  const networkResponses: any[] = [];
  page.on('response', response => {
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
  });

  // Navigate to the site
  console.log('1. Navigating to production site...');
  await page.goto('https://signaturequoteai-main-ekoapps.vercel.app');
  await page.waitForLoadState('networkidle');

  // Check if already signed in or need to sign in
  console.log('2. Checking authentication state...');
  const isSignedIn = await page.locator('text=/dashboard|quotes/i').first().isVisible({ timeout: 5000 }).catch(() => false);

  if (!isSignedIn) {
    console.log('\n⏸️  PAUSED FOR MANUAL SIGN-IN');
    console.log('=' .repeat(80));
    console.log('Please sign in manually in the browser window that opened.');
    console.log('After signing in and reaching the dashboard, press Enter in this terminal.');
    console.log('=' .repeat(80));

    // Wait for user to sign in manually - 3 minutes timeout
    await page.waitForURL('**/dashboard', { timeout: 180000 }).catch(async () => {
      // If dashboard URL didn't load, check if we can navigate there
      const navToDashboard = page.locator('a[href*="/dashboard"]').first();
      if (await navToDashboard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await navToDashboard.click();
        await page.waitForLoadState('networkidle');
      }
    });

    console.log('✓ Detected sign-in success!');
  }

  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/authenticated.png', fullPage: true });

  // Navigate to quotes page
  console.log('3. Navigating to quotes page...');

  // Try to find quotes link
  const quotesLink = page.locator('a[href*="/quotes"], a:has-text("Quotes")').first();
  if (await quotesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await quotesLink.click();
  } else {
    await page.goto('https://signaturequoteai-main-ekoapps.vercel.app/quotes');
  }

  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/quotes-page.png', fullPage: true });

  // Wait for quotes to load
  console.log('4. Looking for existing quotes...');
  await page.waitForTimeout(2000);

  // Look for quote items
  const quoteRows = page.locator('[data-quote-id], tr:has-text("Q-"), div:has-text("Quote #")');
  const quoteCount = await quoteRows.count();

  console.log(`Found ${quoteCount} quote(s)`);

  if (quoteCount === 0) {
    console.log('⚠️ No quotes found. Please create a quote first.');
    throw new Error('No quotes available for testing');
  }

  // Click on first quote
  console.log('5. Opening first quote...');
  await quoteRows.first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/quote-opened.png', fullPage: true });

  // Set up API monitoring for /send endpoint
  const sendApiRequests: any[] = [];
  const sendApiResponses: any[] = [];

  page.on('request', request => {
    if (request.url().includes('/api/quotes/') && request.url().includes('/send')) {
      sendApiRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📤 API Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/quotes/') && response.url().includes('/send')) {
      const responseBody = await response.text().catch(() => 'Could not read response body');
      sendApiResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: responseBody
      });
      console.log(`📥 API Response: ${response.status()} ${response.statusText()}`);
      console.log(`   Body: ${responseBody}`);
    }
  });

  // Look for send button
  console.log('6. Looking for Send button...');
  const sendButtonSelectors = [
    'button:has-text("Send Quote")',
    'button:has-text("Send")',
    'button:has-text("Email Quote")',
    'button:has-text("Email")',
    '[data-test*="send"]',
    'button[type="submit"]:has-text("Send")'
  ];

  let sendButton = null;
  for (const selector of sendButtonSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`✓ Found send button: ${selector}`);
      sendButton = button;
      break;
    }
  }

  if (!sendButton) {
    console.log('❌ Send button not found!');
    await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/no-send-button.png', fullPage: true });

    // Log all visible buttons for debugging
    const allButtons = await page.locator('button').allTextContents();
    console.log('All visible buttons:', allButtons);

    throw new Error('Could not find send quote button');
  }

  // Click the send button
  console.log('7. Clicking Send button...');
  await sendButton.click();

  // Wait for response or error
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/after-send-click.png', fullPage: true });

  // Look for any UI feedback (success or error)
  const uiFeedback: string[] = [];

  const feedbackSelectors = [
    '[role="alert"]',
    '[role="status"]',
    '.toast',
    '[data-sonner-toast]',
    '.error',
    '.success',
    '[class*="toast"]',
    '[class*="alert"]',
    '[class*="notification"]'
  ];

  for (const selector of feedbackSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent();
      if (text && text.trim()) {
        uiFeedback.push(text.trim());
      }
    }
  }

  // Wait a bit more for network requests to complete
  await page.waitForTimeout(2000);

  // Final screenshot
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/final-state.png', fullPage: true });

  // Generate detailed report
  console.log('\n' + '='.repeat(80));
  console.log('📊 DETAILED TEST REPORT');
  console.log('='.repeat(80));

  console.log('\n🎨 UI FEEDBACK MESSAGES:');
  if (uiFeedback.length > 0) {
    uiFeedback.forEach(msg => console.log(`  ➤ ${msg}`));
  } else {
    console.log('  ⚠️ No UI feedback messages detected');
  }

  console.log('\n📤 API REQUESTS TO /send:');
  if (sendApiRequests.length > 0) {
    sendApiRequests.forEach((req, idx) => {
      console.log(`  Request #${idx + 1}:`);
      console.log(`    URL: ${req.url}`);
      console.log(`    Method: ${req.method}`);
      console.log(`    Post Data: ${req.postData || 'None'}`);
    });
  } else {
    console.log('  ⚠️ No API requests captured (API might not have been called!)');
  }

  console.log('\n📥 API RESPONSES FROM /send:');
  if (sendApiResponses.length > 0) {
    sendApiResponses.forEach((res, idx) => {
      console.log(`  Response #${idx + 1}:`);
      console.log(`    URL: ${res.url}`);
      console.log(`    Status: ${res.status} ${res.statusText}`);
      console.log(`    Body: ${res.body}`);

      // Try to parse JSON response
      try {
        const jsonBody = JSON.parse(res.body);
        console.log(`    Parsed JSON:`, JSON.stringify(jsonBody, null, 2).split('\n').map(l => `      ${l}`).join('\n'));
      } catch (e) {
        // Not JSON or couldn't parse
      }
    });
  } else {
    console.log('  ⚠️ No API responses captured');
  }

  console.log('\n🔴 CONSOLE ERRORS:');
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(err => console.log(`  ➤ ${err}`));
  } else {
    console.log('  ✓ No console errors');
  }

  console.log('\n📝 RECENT CONSOLE MESSAGES (last 30):');
  consoleMessages.slice(-30).forEach(msg => console.log(`  ${msg}`));

  console.log('\n🌐 RELEVANT NETWORK ACTIVITY:');
  const relevantResponses = networkResponses.filter(r =>
    r.url.includes('/api/') || r.status >= 400
  ).slice(-15);

  if (relevantResponses.length > 0) {
    relevantResponses.forEach(r => console.log(`  [${r.status}] ${r.url}`));
  } else {
    console.log('  No relevant network activity');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test completed. Screenshots saved to /screenshots directory');
  console.log('='.repeat(80));
});
