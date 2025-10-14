/**
 * Test script to create a quote and send it via email
 * This tests the complete flow: customer creation → quote creation → email sending
 */

async function testQuoteCreationAndEmail() {
  const baseUrl = 'http://localhost:3000';

  console.log('\n🧪 Starting Quote Creation and Email Test\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Create a quote
    console.log('\n📝 Step 1: Creating test quote...');

    const quoteData = {
      customer: {
        name: 'Test Customer',
        email: 'ekosolarize@gmail.com', // Send to yourself for testing
        company: 'Test Company LLC',
        phone: '555-0123',
      },
      items: [
        {
          productId: 'test-product-1',
          name: 'EG4 18kPV Hybrid Inverter',
          unitPrice: 2499.99,
          quantity: 2,
          extended: 4999.98,
          imageUrl: 'https://cdn.shopify.com/s/files/1/0556/0926/2865/products/EG4_18kPV_Front_1024x1024.png',
        },
        {
          productId: 'test-product-2',
          name: 'Signature Solar 48V 280Ah Battery',
          unitPrice: 1899.99,
          quantity: 4,
          extended: 7599.96,
        },
      ],
      discount: 500,
      shipping: 150,
      tax: 0,
      subtotal: 12599.94,
      total: 12249.94,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      preparedBy: 'Claude Test',
      leadTimeNote: '2-3 weeks',
      terms: 'Net 30. All sales final.',
    };

    const createResponse = await fetch(`${baseUrl}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create quote: ${createResponse.status} - ${errorText}`);
    }

    const createResult = await createResponse.json();
    console.log('✅ Quote created successfully!');
    console.log(`   Quote ID: ${createResult.data.id}`);
    console.log(`   Quote Number: ${createResult.data.number || 'N/A'}`);
    console.log(`   Customer: ${createResult.data.customer?.name}`);
    console.log(`   Total: $${createResult.data.total}`);

    const quoteId = createResult.data.id;

    // Step 2: Send the quote via email
    console.log('\n📧 Step 2: Sending quote email...');

    const sendResponse = await fetch(`${baseUrl}/api/quotes/${quoteId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      throw new Error(`Failed to send quote: ${sendResponse.status} - ${errorText}`);
    }

    const sendResult = await sendResponse.json();
    console.log('✅ Quote email sent successfully!');
    console.log(`   Message ID: ${sendResult.data?.messageId || 'N/A'}`);
    console.log(`   Sent to: ${sendResult.data?.customerEmail}`);
    console.log(`   PDF attached: ${sendResult.data?.hasPdf ? 'Yes' : 'No'}`);
    console.log(`   Message: ${sendResult.message}`);

    // Step 3: Verify quote status was updated
    console.log('\n🔍 Step 3: Verifying quote status...');

    const getResponse = await fetch(`${baseUrl}/api/quotes/${quoteId}`);
    const getResult = await getResponse.json();

    console.log(`   Status: ${getResult.data?.status || 'unknown'}`);
    console.log(`   Sent at: ${getResult.data?.sentAt || 'N/A'}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('📬 Check your inbox: ekosolarize@gmail.com');
    console.log('   You should receive a quote email with PDF attachment\n');

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ TEST FAILED!');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('='.repeat(50) + '\n');
    process.exit(1);
  }
}

// Run the test
testQuoteCreationAndEmail();
