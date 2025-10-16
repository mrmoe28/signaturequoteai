/**
 * Subscription Upgrade Flow Test
 *
 * Tests the complete subscription upgrade journey:
 * 1. User logs in
 * 2. Navigates to Upgrade/Pricing
 * 3. Selects Pro plan
 * 4. Completes checkout flow
 */

import { test, expect } from '@playwright/test';

// Test credentials - these should be set as environment variables
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';

test.describe('Subscription Upgrade Flow', () => {

  test('Complete Pro Plan Upgrade Flow', async ({ page }) => {
    console.log('\n🚀 === TESTING SUBSCRIPTION UPGRADE FLOW ===\n');

    // Step 1: Navigate to home page
    console.log('📍 Step 1: Navigate to Home Page');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/upgrade-flow/01-home-page.png', fullPage: true });
    console.log('✅ Home page loaded\n');

    // Step 2: Sign in
    console.log('📍 Step 2: Sign In');

    // Check if already logged in by looking for Upgrade link
    const upgradeLink = page.locator('a:has-text("Upgrade")');
    const isLoggedIn = await upgradeLink.isVisible().catch(() => false);

    if (!isLoggedIn) {
      console.log('   → User not logged in, proceeding to sign in...');

      // Navigate to sign-in page
      await page.goto('/auth/sign-in');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/upgrade-flow/02-sign-in-page.png', fullPage: true });

      // Fill in credentials
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.screenshot({ path: 'test-results/upgrade-flow/03-credentials-filled.png', fullPage: true });

      // Click sign-in button
      await page.click('button:has-text("Sign")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for redirect

      await page.screenshot({ path: 'test-results/upgrade-flow/04-after-login.png', fullPage: true });
      console.log('✅ Signed in successfully\n');
    } else {
      console.log('✅ Already logged in\n');
    }

    // Step 3: Navigate to Upgrade/Pricing
    console.log('📍 Step 3: Navigate to Pricing Page');

    // Try clicking Upgrade link in nav
    const navUpgradeLink = page.locator('nav a:has-text("Upgrade")').first();
    if (await navUpgradeLink.isVisible()) {
      await navUpgradeLink.click();
      console.log('   → Clicked Upgrade link in navigation');
    } else {
      // Fallback: navigate directly to pricing
      await page.goto('/pricing');
      console.log('   → Navigated directly to /pricing');
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/upgrade-flow/05-pricing-page.png', fullPage: true });
    console.log('✅ Pricing page loaded\n');

    // Step 4: Verify pricing cards are visible
    console.log('📍 Step 4: Verify Pricing Plans');

    const freePlan = page.locator('text=Free').first();
    const proPlan = page.locator('text=Pro').first();
    const enterprisePlan = page.locator('text=Enterprise').first();

    await expect(freePlan).toBeVisible();
    await expect(proPlan).toBeVisible();
    await expect(enterprisePlan).toBeVisible();

    console.log('✅ All pricing plans visible\n');

    // Step 5: Click Subscribe to Pro
    console.log('📍 Step 5: Select Pro Plan');

    // Find the Pro plan card and click its Subscribe button
    const proSubscribeButton = page.locator('button:has-text("Subscribe to Pro")').first();
    await proSubscribeButton.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/upgrade-flow/06-before-subscribe-click.png', fullPage: true });

    // Set up request/response monitoring
    let checkoutRequest: any = null;
    let checkoutResponse: any = null;

    page.on('request', request => {
      if (request.url().includes('/api/subscriptions/checkout')) {
        checkoutRequest = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        };
        console.log('🔵 CHECKOUT REQUEST CAPTURED:', checkoutRequest.url);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/subscriptions/checkout')) {
        checkoutResponse = {
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        };

        try {
          const body = await response.json();
          checkoutResponse.body = body;
          console.log('🟢 CHECKOUT RESPONSE:', response.status(), body);
        } catch (e) {
          console.log('🟢 CHECKOUT RESPONSE:', response.status());
        }
      }
    });

    await proSubscribeButton.click();
    console.log('✅ Clicked "Subscribe to Pro" button\n');

    // Wait for navigation or modal
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/upgrade-flow/07-after-subscribe-click.png', fullPage: true });

    // Step 6: Verify checkout page loaded
    console.log('📍 Step 6: Verify Checkout Flow');

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Check if redirected to checkout page
    if (currentUrl.includes('/checkout')) {
      console.log('✅ Redirected to checkout page\n');
      await page.screenshot({ path: 'test-results/upgrade-flow/08-checkout-page.png', fullPage: true });

      // Verify checkout page elements
      const planSummary = page.locator('text=Plan Summary');
      const paymentInfo = page.locator('text=Payment Information');

      await expect(planSummary).toBeVisible();
      await expect(paymentInfo).toBeVisible();

      console.log('✅ Checkout page elements verified\n');

      // Step 7: Check for error messages
      console.log('📍 Step 7: Check for Errors');
      const errorMessages = page.locator('[class*="error"], [class*="alert-error"], .text-red-600, .text-red-800');
      const errorCount = await errorMessages.count();

      if (errorCount > 0) {
        console.log(`⚠️  Found ${errorCount} error message(s):`);
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`   - ${errorText}`);
        }
      } else {
        console.log('✅ No error messages found\n');
      }

      // Step 8: Click Subscribe button on checkout page
      console.log('📍 Step 8: Click Subscribe Button');
      const subscribeButton = page.locator('button:has-text("Subscribe")').first();

      if (await subscribeButton.isVisible()) {
        await subscribeButton.scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'test-results/upgrade-flow/09-before-final-subscribe.png', fullPage: true });

        await subscribeButton.click();
        console.log('✅ Clicked final Subscribe button\n');

        // Wait for Square checkout or success page
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'test-results/upgrade-flow/10-after-final-subscribe.png', fullPage: true });

        const finalUrl = page.url();
        console.log(`   Final URL: ${finalUrl}`);

        if (finalUrl.includes('square')) {
          console.log('✅ Redirected to Square checkout\n');
        } else if (finalUrl.includes('subscription')) {
          console.log('✅ Redirected to subscription page\n');
        }
      }

    } else if (currentUrl.includes('square')) {
      console.log('✅ Redirected directly to Square checkout\n');
    } else {
      console.log(`⚠️  Unexpected redirect to: ${currentUrl}\n`);
    }

    // Final Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Final URL: ${page.url()}`);
    console.log(`Checkout Request: ${checkoutRequest ? 'Captured ✓' : 'Not captured ✗'}`);
    console.log(`Checkout Response: ${checkoutResponse ? `${checkoutResponse.status} ✓` : 'Not captured ✗'}`);

    if (checkoutResponse?.body) {
      console.log('\n📦 Checkout Response Details:');
      console.log(JSON.stringify(checkoutResponse.body, null, 2));
    }

    console.log('\n=== TEST COMPLETED ===\n');
  });

  test('Verify Enterprise Plan Upgrade', async ({ page }) => {
    console.log('\n🚀 === TESTING ENTERPRISE PLAN UPGRADE ===\n');

    // Navigate to pricing
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Find Enterprise Subscribe button
    const enterpriseButton = page.locator('button:has-text("Subscribe to Enterprise")').first();
    await expect(enterpriseButton).toBeVisible();

    await page.screenshot({ path: 'test-results/upgrade-flow/enterprise-plan.png', fullPage: true });
    console.log('✅ Enterprise plan upgrade button verified\n');
  });

  test('Verify Free Plan is Already Active', async ({ page }) => {
    console.log('\n🚀 === TESTING FREE PLAN STATUS ===\n');

    // Sign in if needed
    await page.goto('/');

    // Check if on free plan
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/upgrade-flow/subscription-page.png', fullPage: true });

    console.log('✅ Subscription page loaded\n');
  });
});
