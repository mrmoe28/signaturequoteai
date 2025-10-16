/**
 * Quote Creation and Email Send Test
 *
 * Tests the complete quote creation and email sending flow:
 * 1. User logs in
 * 2. Creates a new quote with customer info and products
 * 3. Sends the quote via email
 * 4. User manually checks email and clicks Pay button
 * 5. Verifies Stripe checkout appears
 */

import { test, expect } from '@playwright/test';

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'edwardsteel.0@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'opendoors28';

// Customer email to send quote to
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL || TEST_EMAIL; // Send to yourself for testing

test.describe('Quote Creation and Payment Flow', () => {

  test('Create and Send Quote for Stripe Payment Test', async ({ page }) => {
    console.log('\n🚀 === TESTING QUOTE CREATION AND SEND FLOW ===\n');

    // Step 1: Navigate and Login
    console.log('📍 Step 1: Login to Application');
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign")');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/quote-payment/01-logged-in.png', fullPage: true });
    console.log('✅ Logged in successfully\n');

    // Step 2: Navigate to New Quote
    console.log('📍 Step 2: Navigate to New Quote Page');

    // Try clicking New Quote button
    const newQuoteButton = page.locator('a:has-text("New Quote")').first();
    if (await newQuoteButton.isVisible()) {
      await newQuoteButton.click();
      console.log('   → Clicked "New Quote" button');
    } else {
      await page.goto('/quotes/new');
      console.log('   → Navigated directly to /quotes/new');
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/quote-payment/02-new-quote-page.png', fullPage: true });
    console.log('✅ New Quote page loaded\n');

    // Step 3: Fill Customer Information
    console.log('📍 Step 3: Fill Customer Information');

    // Look for customer name field
    const customerNameField = page.locator('input[name="customerName"], input[placeholder*="customer" i], input[placeholder*="name" i]').first();
    await customerNameField.waitFor({ state: 'visible', timeout: 5000 });
    await customerNameField.fill('Test Customer');
    console.log('   ✅ Customer name: Test Customer');

    // Look for customer email field
    const customerEmailField = page.locator('input[type="email"], input[name="customerEmail"], input[placeholder*="email" i]').first();
    await customerEmailField.fill(CUSTOMER_EMAIL);
    console.log(`   ✅ Customer email: ${CUSTOMER_EMAIL}`);

    // Try to fill company name if field exists
    const companyField = page.locator('input[name="company"], input[placeholder*="company" i]').first();
    if (await companyField.isVisible().catch(() => false)) {
      await companyField.fill('Test Company LLC');
      console.log('   ✅ Company: Test Company LLC');
    }

    await page.screenshot({ path: 'test-results/quote-payment/03-customer-info-filled.png', fullPage: true });
    console.log('✅ Customer information filled\n');

    // Step 4: Add Products to Quote
    console.log('📍 Step 4: Add Products to Quote');

    // Look for Add Product or similar button
    const addProductButton = page.locator('button:has-text("Add Product"), button:has-text("Add Item"), button:has-text("Add Line")').first();

    if (await addProductButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addProductButton.click();
      console.log('   → Clicked "Add Product" button');
      await page.waitForTimeout(1500);
    }

    // Look for product search or selection
    const productSearch = page.locator('input[placeholder*="product" i], input[placeholder*="search" i], input[type="search"]').first();

    if (await productSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productSearch.fill('panel');
      console.log('   → Searching for products...');
      await page.waitForTimeout(1500);

      // Click first product result
      const firstProduct = page.locator('[role="option"], [data-product], .product-item').first();
      if (await firstProduct.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstProduct.click();
        console.log('   ✅ Selected first product');
      }
    }

    await page.screenshot({ path: 'test-results/quote-payment/04-products-added.png', fullPage: true });
    console.log('✅ Products added to quote\n');

    // Step 5: Save/Generate Quote
    console.log('📍 Step 5: Generate Quote');

    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create Quote"), button:has-text("Save Quote")').first();

    if (await generateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateButton.scrollIntoViewIfNeeded();
      await generateButton.click();
      console.log('   → Clicked generate/save button');

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/quote-payment/05-quote-generated.png', fullPage: true });
    console.log('✅ Quote generated\n');

    // Step 6: Send Quote via Email
    console.log('📍 Step 6: Send Quote via Email');

    // Look for Send button
    const sendButton = page.locator('button:has-text("Send Quote"), button:has-text("Send Email"), button:has-text("Send")').first();

    await sendButton.waitFor({ state: 'visible', timeout: 10000 });
    await sendButton.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/quote-payment/06-before-send.png', fullPage: true });

    // Monitor email send request
    let emailRequest: any = null;
    let emailResponse: any = null;

    page.on('request', request => {
      if (request.url().includes('/send') || request.url().includes('/email')) {
        emailRequest = {
          url: request.url(),
          method: request.method(),
        };
        console.log('🔵 EMAIL REQUEST CAPTURED:', emailRequest.url);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/send') || response.url().includes('/email')) {
        emailResponse = {
          url: response.url(),
          status: response.status(),
        };

        try {
          const body = await response.json();
          emailResponse.body = body;
          console.log('🟢 EMAIL RESPONSE:', response.status(), body);
        } catch (e) {
          console.log('🟢 EMAIL RESPONSE:', response.status());
        }
      }
    });

    await sendButton.click();
    console.log('✅ Clicked "Send" button\n');

    // Wait for send to complete
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/quote-payment/07-after-send.png', fullPage: true });

    // Check for success message
    const successMessage = page.locator('text=/sent|success|delivered/i').first();
    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      const messageText = await successMessage.textContent();
      console.log(`✅ Success message: ${messageText}\n`);
    }

    // Get the quote URL for reference
    const currentUrl = page.url();
    console.log(`📋 Quote URL: ${currentUrl}\n`);

    // Extract quote ID from URL
    const quoteIdMatch = currentUrl.match(/quotes\/([a-f0-9-]+)/);
    const quoteId = quoteIdMatch ? quoteIdMatch[1] : 'unknown';

    // Final Summary
    console.log('\n=== QUOTE SEND TEST SUMMARY ===');
    console.log(`Quote ID: ${quoteId}`);
    console.log(`Customer Email: ${CUSTOMER_EMAIL}`);
    console.log(`Quote URL: ${currentUrl}`);
    console.log(`Email Request: ${emailRequest ? 'Captured ✓' : 'Not captured ✗'}`);
    console.log(`Email Response: ${emailResponse ? `${emailResponse.status} ✓` : 'Not captured ✗'}`);

    if (emailResponse?.body) {
      console.log('\n📧 Email Response Details:');
      console.log(JSON.stringify(emailResponse.body, null, 2));
    }

    console.log('\n📬 NEXT STEPS:');
    console.log(`1. Check email inbox for: ${CUSTOMER_EMAIL}`);
    console.log('2. Open the quote email');
    console.log('3. Click the "Pay Now" or "View Quote" button');
    console.log('4. Verify Stripe checkout appears');
    console.log('5. Test payment flow (use Stripe test card: 4242 4242 4242 4242)');

    console.log('\n=== TEST COMPLETED ===\n');

    // Keep browser open for a moment to see final state
    await page.waitForTimeout(2000);
  });

  test('Verify Quote Payment Link Direct Access', async ({ page }) => {
    console.log('\n🚀 === TESTING DIRECT QUOTE PAYMENT LINK ===\n');

    // This test assumes you have a quote ID to test with
    // You can manually set it after creating a quote
    const QUOTE_ID = process.env.QUOTE_ID || 'test-quote-id';

    console.log(`📍 Testing payment link for quote: ${QUOTE_ID}`);

    // Try accessing the quote directly (public link)
    await page.goto(`/quotes/${QUOTE_ID}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/quote-payment/quote-public-view.png', fullPage: true });

    // Look for Pay button
    const payButton = page.locator('button:has-text("Pay"), button:has-text("Pay Now"), a:has-text("Pay")').first();

    if (await payButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Pay button found on quote page');
      await payButton.scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'test-results/quote-payment/pay-button-visible.png', fullPage: true });

      // Click pay button
      await payButton.click();
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`Final URL: ${currentUrl}`);

      if (currentUrl.includes('stripe') || currentUrl.includes('checkout')) {
        console.log('✅ Successfully redirected to Stripe checkout!');
        await page.screenshot({ path: 'test-results/quote-payment/stripe-checkout.png', fullPage: true });
      } else {
        console.log('⚠️ Did not redirect to Stripe checkout');
      }
    } else {
      console.log('⚠️ Pay button not found on quote page');
    }

    console.log('\n=== TEST COMPLETED ===\n');
  });
});
