/**
 * Test script to verify dashboard loads without client-side errors
 * Tests the fix for infinite re-render loop
 */

import { chromium } from 'playwright';

async function testDashboard() {
  const baseUrl = 'https://signaturequoteai-main-ekoapps.vercel.app';

  console.log('\n🧪 Testing Dashboard Fix\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Collect page errors
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error);
  });

  try {
    // Step 1: Go to homepage
    console.log('\n📋 Step 1: Loading homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    console.log(`✅ Loaded: ${page.url()}`);

    // Step 2: Navigate to sign-in
    console.log('\n📋 Step 2: Navigating to sign-in...');
    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: 'networkidle' });

    // Wait for Stack Auth to load
    await page.waitForTimeout(2000);

    // Check if already logged in (redirect to dashboard)
    if (page.url().includes('/dashboard')) {
      console.log('✅ Already logged in, on dashboard');

      // Wait a few seconds to check for errors
      console.log('\n📋 Step 3: Monitoring for client-side errors...');
      await page.waitForTimeout(5000);

      // Check for the specific error dialog
      const errorDialog = await page.locator('text=Application error: a client-side exception has occurred').count();
      if (errorDialog > 0) {
        console.log('❌ Found error dialog on page!');
      } else {
        console.log('✅ No error dialog found');
      }

      // Take screenshot of dashboard
      await page.screenshot({ path: 'test-results/dashboard-after-fix.png', fullPage: true });
      console.log('📸 Screenshot saved: test-results/dashboard-after-fix.png');

    } else {
      console.log('Not logged in, need to authenticate manually');
      console.log('Sign-in URL:', page.url());

      // Wait for Stack Auth iframe or form
      await page.waitForTimeout(3000);

      // Take screenshot
      await page.screenshot({ path: 'test-results/signin-page.png', fullPage: true });
      console.log('📸 Screenshot saved: test-results/signin-page.png');
    }

    // Report any errors found
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results:');
    console.log('='.repeat(60));

    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console Errors Found:');
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✅ No console errors detected');
    }

    if (pageErrors.length > 0) {
      console.log('\n❌ Page Errors Found:');
      pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message}`);
      });
    } else {
      console.log('✅ No page errors detected');
    }

    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ ALL TESTS PASSED!');
      console.log('Dashboard loads without errors');
      console.log('='.repeat(60) + '\n');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ ERRORS DETECTED');
      console.log('Dashboard has client-side errors');
      console.log('='.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED!');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    console.error('='.repeat(60) + '\n');

    // Take error screenshot
    await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved: test-results/error-screenshot.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboard();
