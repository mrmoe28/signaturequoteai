/**
 * Test Square Checkout Link Generation
 *
 * This script tests the Square checkout link functionality by:
 * 1. Checking if Square is configured
 * 2. Creating a test payment link
 * 3. Displaying the link for manual testing
 */

import { createUserSquarePaymentLink, isUserSquareConnected } from '../lib/square-user-client';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-checkout-link');

async function testCheckoutLink() {
  console.log('\n🧪 Square Checkout Link Test\n');
  console.log('='.repeat(50));

  // Test data - you can modify this
  const testData = {
    quoteId: 'test-quote-' + Date.now(),
    quoteNumber: 'TEST-2025-001',
    customerName: 'John Doe',
    customerEmail: 'test@example.com',
    amount: 1250.00,
    description: 'Test Solar Panel Quote',
    redirectUrl: 'http://localhost:3000/payment-success'
  };

  console.log('\n📋 Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '='.repeat(50));

  // Check environment configuration
  console.log('\n🔍 Checking Configuration...\n');

  const config = {
    appId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
    clientSecret: process.env.SQUARE_CLIENT_SECRET,
    environment: process.env.SQUARE_ENVIRONMENT,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };

  console.log('Configuration Status:');
  Object.entries(config).forEach(([key, value]) => {
    const status = value && !value.startsWith('your_') ? '✅' : '❌';
    const displayValue = value ? value.substring(0, 20) + '...' : 'NOT SET';
    console.log(`  ${status} ${key}: ${displayValue}`);
  });

  console.log('\n' + '='.repeat(50));

  // Important note about user-specific OAuth
  console.log('\n⚠️  IMPORTANT NOTE:');
  console.log('This app uses user-specific Square OAuth integration.');
  console.log('Each user must connect their own Square account via the Settings page.');
  console.log('');
  console.log('To test checkout links:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Navigate to http://localhost:3000/settings');
  console.log('3. Connect your Square account via OAuth');
  console.log('4. Create a quote and send it to generate a payment link');
  console.log('');
  console.log('Alternative test using placeholder link:');
  console.log('If Square is not configured, the system will generate a');
  console.log('placeholder link that shows Square setup instructions.');
  console.log('\n' + '='.repeat(50));

  // Generate placeholder link for testing
  const placeholderLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-error?` +
    `reason=square_not_configured&` +
    `quoteId=${testData.quoteId}&` +
    `quoteNumber=${testData.quoteNumber || ''}&` +
    `amount=${testData.amount}`;

  console.log('\n🔗 Sample Placeholder Link:');
  console.log(placeholderLink);
  console.log('\n📝 This link will show if Square is not yet connected.');

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Test complete!\n');
  console.log('Next steps:');
  console.log('1. Ensure dev server is running: npm run dev');
  console.log('2. Visit: http://localhost:3000/settings');
  console.log('3. Connect Square OAuth');
  console.log('4. Create and send a quote to test real payment links\n');
}

// Run the test
testCheckoutLink().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
