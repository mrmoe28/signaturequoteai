import { test, expect } from '@playwright/test';

test('Test quote sending functionality', async ({ page }) => {
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

  // Take screenshot of landing page
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/1-landing.png', fullPage: true });

  // Check if already signed in or need to sign in
  console.log('2. Checking authentication state...');
  const isSignedIn = await page.locator('text=/sign out|logout|dashboard/i').first().isVisible().catch(() => false);

  if (!isSignedIn) {
    console.log('Not signed in. Looking for sign-in button...');

    // Look for sign-in link/button
    const signInButton = page.locator('a[href*="auth"], button:has-text("Sign In"), a:has-text("Sign In")').first();

    if (await signInButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/2-signin-page.png', fullPage: true });

      console.log('⚠️ Manual sign-in required. Current URL:', page.url());
      console.log('Please sign in manually if needed, or provide test credentials.');
    }
  } else {
    console.log('✓ Already signed in');
  }

  // Navigate to quotes page
  console.log('3. Looking for quotes page...');

  // Try multiple possible navigation paths
  const quotesLinkSelectors = [
    'a[href*="/quotes"]',
    'a:has-text("Quotes")',
    'nav a:has-text("Quotes")',
    '[data-test="quotes-link"]'
  ];

  let quotesFound = false;
  for (const selector of quotesLinkSelectors) {
    const link = page.locator(selector).first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`Found quotes link with selector: ${selector}`);
      await link.click();
      await page.waitForLoadState('networkidle');
      quotesFound = true;
      break;
    }
  }

  if (!quotesFound) {
    console.log('Could not find quotes navigation link. Trying direct navigation...');
    await page.goto('https://signaturequoteai-main-ekoapps.vercel.app/quotes');
    await page.waitForLoadState('networkidle');
  }

  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/3-quotes-page.png', fullPage: true });
  console.log('Current URL:', page.url());

  // Look for any quotes in the list
  console.log('4. Looking for existing quotes...');

  // Wait a bit for data to load
  await page.waitForTimeout(2000);

  // Try to find quote items with various selectors
  const quoteSelectors = [
    '[data-test="quote-item"]',
    '[data-quote-id]',
    'div:has-text("Quote #")',
    'tr:has-text("Q-")',
    '.quote-item',
    '[class*="quote"]'
  ];

  let quoteElement = null;
  for (const selector of quoteSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      console.log(`Found ${count} quote(s) with selector: ${selector}`);
      quoteElement = elements.first();
      break;
    }
  }

  if (!quoteElement) {
    console.log('⚠️ No quotes found. Looking for "Create Quote" or "New Quote" button...');
    await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/4-no-quotes.png', fullPage: true });

    // Check page content
    const pageContent = await page.content();
    console.log('Page title:', await page.title());

    throw new Error('No quotes found on the page. Cannot test send functionality.');
  }

  // Try to find and click the send button
  console.log('5. Looking for send quote button...');

  // First, try to click on the quote to see details
  await quoteElement.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/5-quote-details.png', fullPage: true });

  // Look for send button with various selectors
  const sendButtonSelectors = [
    'button:has-text("Send")',
    'button:has-text("Send Quote")',
    'button:has-text("Email")',
    '[data-test="send-quote"]',
    'button[type="submit"]:has-text("Send")'
  ];

  let sendButton = null;
  for (const selector of sendButtonSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`Found send button with selector: ${selector}`);
      sendButton = button;
      break;
    }
  }

  if (!sendButton) {
    console.log('⚠️ Send button not found. Taking screenshot...');
    await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/6-no-send-button.png', fullPage: true });
    throw new Error('Could not find send quote button');
  }

  // Set up request interception for the send API
  const sendApiRequests: any[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/quotes/') && request.url().includes('/send')) {
      sendApiRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  const sendApiResponses: any[] = [];
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
    }
  });

  // Click the send button
  console.log('6. Clicking send button...');
  await sendButton.click();

  // Wait for any modals or dialogs
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/7-after-send-click.png', fullPage: true });

  // Look for error messages
  const errorSelectors = [
    '[role="alert"]',
    '.error',
    '[class*="error"]',
    'div:has-text("Error")',
    'div:has-text("Failed")',
    '.toast',
    '[data-sonner-toast]'
  ];

  const errors: string[] = [];
  for (const selector of errorSelectors) {
    const errorElements = page.locator(selector);
    const count = await errorElements.count();
    for (let i = 0; i < count; i++) {
      const text = await errorElements.nth(i).textContent();
      if (text && text.trim()) {
        errors.push(text.trim());
      }
    }
  }

  // Wait a bit more for network requests to complete
  await page.waitForTimeout(3000);

  // Final screenshot
  await page.screenshot({ path: '/Users/ekodevapps/Desktop/signaturequoteai-main/screenshots/8-final-state.png', fullPage: true });

  // Compile results
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS');
  console.log('='.repeat(80));

  console.log('\n📋 UI ERROR MESSAGES:');
  if (errors.length > 0) {
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('  No error messages found in UI');
  }

  console.log('\n🌐 API REQUESTS TO /send:');
  if (sendApiRequests.length > 0) {
    sendApiRequests.forEach(req => {
      console.log(`  URL: ${req.url}`);
      console.log(`  Method: ${req.method}`);
      console.log(`  Post Data: ${req.postData || 'None'}`);
    });
  } else {
    console.log('  No API requests to /send endpoint captured');
  }

  console.log('\n📡 API RESPONSES FROM /send:');
  if (sendApiResponses.length > 0) {
    sendApiResponses.forEach(res => {
      console.log(`  URL: ${res.url}`);
      console.log(`  Status: ${res.status} ${res.statusText}`);
      console.log(`  Body: ${res.body}`);
    });
  } else {
    console.log('  No API responses from /send endpoint captured');
  }

  console.log('\n🖥️ CONSOLE ERRORS:');
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('  No console errors');
  }

  console.log('\n📝 ALL CONSOLE MESSAGES (last 20):');
  consoleMessages.slice(-20).forEach(msg => console.log(`  ${msg}`));

  console.log('\n🌐 RELEVANT NETWORK RESPONSES:');
  networkResponses
    .filter(r => r.url.includes('/api/') || r.status >= 400)
    .slice(-10)
    .forEach(r => console.log(`  [${r.status}] ${r.url}`));

  console.log('\n' + '='.repeat(80));
});
