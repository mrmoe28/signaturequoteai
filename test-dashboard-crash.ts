/**
 * Test script to debug dashboard crash after sign-in
 */

import { chromium } from 'playwright';

async function testDashboardCrash() {
  const baseUrl = 'https://signaturequoteai-main-ekoapps.vercel.app';

  console.log('\n🧪 Testing Dashboard Crash\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs: any[] = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  // Collect page errors
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error);
  });

  // Collect network errors
  const networkErrors: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('\n📋 Step 1: Loading dashboard directly...');
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`✅ Page loaded: ${page.url()}`);

    // Wait to see if any crashes occur
    console.log('\n📋 Step 2: Waiting 5 seconds for potential crashes...');
    await page.waitForTimeout(5000);

    // Check for error dialogs
    const errorDialog = await page.locator('text=Application error').count();
    const crashMessage = await page.locator('text=has occurred').count();

    if (errorDialog > 0 || crashMessage > 0) {
      console.log('❌ Error dialog detected on page!');
    } else {
      console.log('✅ No error dialog visible');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-crash-test.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/dashboard-crash-test.png');

    // Report findings
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results:');
    console.log('='.repeat(60));

    console.log('\n📝 Console Logs:');
    if (consoleLogs.length > 0) {
      consoleLogs.forEach((log, i) => {
        if (log.type === 'error' || log.type === 'warning') {
          console.log(`  [${log.type.toUpperCase()}] ${log.text}`);
          if (log.location.url) {
            console.log(`    at ${log.location.url}:${log.location.lineNumber}`);
          }
        }
      });
    } else {
      console.log('  No console logs');
    }

    console.log('\n❌ Page Errors:');
    if (pageErrors.length > 0) {
      pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message}`);
        if (err.stack) {
          console.log(`     ${err.stack.split('\n').slice(0, 3).join('\n     ')}`);
        }
      });
    } else {
      console.log('  No page errors');
    }

    console.log('\n🌐 Network Errors:');
    if (networkErrors.length > 0) {
      networkErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    } else {
      console.log('  No network errors');
    }

    // Check localStorage and sessionStorage
    const storageState = await page.evaluate(() => {
      return {
        localStorage: {
          'stack-has-session': localStorage.getItem('stack-has-session'),
        },
        sessionStorage: {
          'stack-session-active': sessionStorage.getItem('stack-session-active'),
        }
      };
    });

    console.log('\n💾 Storage State:');
    console.log('  localStorage:', JSON.stringify(storageState.localStorage, null, 2));
    console.log('  sessionStorage:', JSON.stringify(storageState.sessionStorage, null, 2));

    if (pageErrors.length > 0 || errorDialog > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ CRASH DETECTED');
      console.log('='.repeat(60) + '\n');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('✅ NO CRASH - Dashboard loaded successfully');
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
    await page.screenshot({ path: 'test-results/crash-error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved: test-results/crash-error-screenshot.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardCrash();
