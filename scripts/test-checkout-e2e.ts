/**
 * End-to-End Square Checkout Link Test
 *
 * This script tests the complete Square checkout workflow:
 * 1. Creates a test quote in the database
 * 2. Generates a Square payment link
 * 3. Returns the link for manual browser testing
 *
 * Prerequisites:
 * - User must be authenticated
 * - User must have connected Square OAuth in settings
 */

import { db } from '../lib/db';
import { quotes, users } from '../lib/db/schema';
import { createUserSquarePaymentLink, isUserSquareConnected } from '../lib/square-user-client';
import { createLogger } from '../lib/logger';
import { eq } from 'drizzle-orm';

const logger = createLogger('test-checkout-e2e');

async function testEndToEndCheckout() {
  console.log('\n🚀 End-to-End Square Checkout Test\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Find a user with Square connected
    console.log('\n📋 Step 1: Finding user with Square OAuth connected...\n');

    const usersWithSquare = await db
      .select({
        id: users.id,
        email: users.email,
        squareMerchantId: users.squareMerchantId,
        squareEnvironment: users.squareEnvironment,
        squareAccessToken: users.squareAccessToken,
      })
      .from(users)
      .limit(10);

    console.log(`Found ${usersWithSquare.length} users in database`);

    // Filter users with Square actually connected
    const connectedUsers = usersWithSquare.filter(
      u => u.squareMerchantId !== null &&
           u.squareMerchantId !== undefined &&
           u.squareAccessToken !== null &&
           u.squareAccessToken !== undefined
    );

    console.log(`Found ${connectedUsers.length} users with Square connected`);

    if (connectedUsers.length === 0) {
      console.log('\n⚠️  No users found with Square OAuth connected!');
      console.log('\nTo test Square checkout:');
      console.log('1. Open your browser to: http://localhost:3000/settings');
      console.log('2. Log in to your account');
      console.log('3. Click "Connect Square Account"');
      console.log('4. Complete the OAuth authorization');
      console.log('5. Run this script again');
      console.log('\n' + '='.repeat(60));
      return;
    }

    const testUser = connectedUsers[0];
    console.log(`\n✅ Using user: ${testUser.email} (${testUser.id})`);
    console.log(`   Square Environment: ${testUser.squareEnvironment || 'Not set'}`);
    console.log(`   Merchant ID: ${testUser.squareMerchantId?.substring(0, 20)}...`);

    // Step 2: Create a test quote
    console.log('\n📝 Step 2: Creating test quote...\n');

    const testQuoteData = {
      userId: testUser.id,
      number: `TEST-${Date.now()}`,
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        company: 'Test Solar Company',
      },
      items: [
        {
          productId: 'test-product-1',
          name: 'Solar Panel - 400W',
          quantity: 10,
          unitPrice: 250.00,
          extended: 2500.00,
        },
        {
          productId: 'test-product-2',
          name: 'Solar Inverter - 5kW',
          quantity: 2,
          unitPrice: 1200.00,
          extended: 2400.00,
        },
      ],
      subtotal: 4900.00,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 4900.00,
      status: 'draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    const [createdQuote] = await db
      .insert(quotes)
      .values({
        userId: testQuoteData.userId,
        number: testQuoteData.number,
        customer: JSON.stringify(testQuoteData.customer),
        items: JSON.stringify(testQuoteData.items),
        subtotal: testQuoteData.subtotal.toString(),
        discount: testQuoteData.discount.toString(),
        shipping: testQuoteData.shipping.toString(),
        tax: testQuoteData.tax.toString(),
        total: testQuoteData.total.toString(),
        status: testQuoteData.status,
        validUntil: testQuoteData.validUntil,
      })
      .returning();

    console.log(`✅ Quote created: ${createdQuote.number}`);
    console.log(`   Quote ID: ${createdQuote.id}`);
    console.log(`   Total: $${testQuoteData.total.toFixed(2)}`);

    // Step 3: Generate Square payment link
    console.log('\n💳 Step 3: Generating Square payment link...\n');

    const paymentLink = await createUserSquarePaymentLink(testUser.id, {
      quoteId: createdQuote.id,
      quoteNumber: createdQuote.number,
      customerName: testQuoteData.customer.name,
      customerEmail: testQuoteData.customer.email,
      amount: testQuoteData.total,
      description: `Quote ${createdQuote.number} - Solar Equipment`,
    });

    if (!paymentLink) {
      console.log('❌ Failed to generate payment link');
      console.log('\nPossible reasons:');
      console.log('1. Square OAuth token may have expired');
      console.log('2. Square API error');
      console.log('3. Network connectivity issue');
      console.log('\nCheck the logs above for detailed error information.');

      // Clean up test quote
      await db.delete(quotes).where(eq(quotes.id, createdQuote.id));
      console.log('\n🧹 Cleaned up test quote');
      return;
    }

    console.log('✅ Payment link generated successfully!');
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 SUCCESS! Here\'s your Square checkout link:\n');
    console.log('🔗 ' + paymentLink);
    console.log('\n' + '='.repeat(60));

    console.log('\n📋 Test Details:');
    console.log(`   Quote Number: ${createdQuote.number}`);
    console.log(`   Quote ID: ${createdQuote.id}`);
    console.log(`   Total Amount: $${testQuoteData.total.toFixed(2)}`);
    console.log(`   Customer: ${testQuoteData.customer.name}`);
    console.log(`   Environment: ${testUser.squareEnvironment || 'Sandbox'}`);

    console.log('\n📝 Next Steps:');
    console.log('1. Copy the payment link above');
    console.log('2. Open it in your browser');
    console.log('3. Test the checkout process');
    if (testUser.squareEnvironment === 'sandbox') {
      console.log('4. Use Square test card: 4111 1111 1111 1111');
      console.log('   CVV: any 3 digits, Expiry: any future date');
    }
    console.log('\n' + '='.repeat(60));

    // Keep the test quote for manual inspection
    console.log('\n💡 Note: Test quote has been kept in database for inspection.');
    console.log(`   To delete it later, use quote ID: ${createdQuote.id}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);

    if (error instanceof Error) {
      console.error('\nError details:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }

    process.exit(1);
  }
}

// Run the test
testEndToEndCheckout().then(() => {
  console.log('\n✅ Test completed successfully!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test script failed:', error);
  process.exit(1);
});
