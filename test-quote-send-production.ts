/**
 * Test script to send an existing quote via email on production
 * This tests the email sending functionality directly via API
 */

async function testQuoteSending() {
  const baseUrl = 'https://signaturequoteai-main-ekoapps.vercel.app';

  console.log('\n🧪 Testing Quote Email Sending on Production\n');
  console.log('='.repeat(60));

  try {
    // Step 1: List existing quotes to find one to send
    console.log('\n📋 Step 1: Fetching existing quotes...');

    const listResponse = await fetch(`${baseUrl}/api/quotes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.log('❌ Failed to fetch quotes:', listResponse.status, errorText);
      throw new Error(`Failed to fetch quotes: ${listResponse.status} - ${errorText}`);
    }

    const listResult = await listResponse.json();
    console.log(`✅ Found ${listResult.data?.items?.length || 0} quotes`);

    if (!listResult.data?.items || listResult.data.items.length === 0) {
      console.log('\n📝 No quotes found. Creating a test quote first...');

      // Create a test quote
      const quoteData = {
        customer: {
          name: 'Test Customer',
          email: 'ekosolarize@gmail.com',
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
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        preparedBy: 'Test Script',
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
        console.log('❌ Failed to create quote:', createResponse.status, errorText);
        throw new Error(`Failed to create quote: ${createResponse.status} - ${errorText}`);
      }

      const createResult = await createResponse.json();
      console.log('✅ Test quote created successfully!');
      console.log(`   Quote ID: ${createResult.data.id}`);

      // Use the newly created quote
      listResult.data = { items: [createResult.data] };
    }

    // Get the first quote
    const firstQuote = listResult.data.items[0];
    const quoteId = firstQuote.id;

    console.log('\n📌 Using quote:');
    console.log(`   ID: ${quoteId}`);
    console.log(`   Number: ${firstQuote.number || 'N/A'}`);
    console.log(`   Total: $${firstQuote.total}`);
    console.log(`   Status: ${firstQuote.status || 'draft'}`);

    // Step 2: Attempt to send the quote
    console.log('\n📧 Step 2: Attempting to send quote email...');
    console.log(`   URL: ${baseUrl}/api/quotes/${quoteId}/send`);

    const sendResponse = await fetch(`${baseUrl}/api/quotes/${quoteId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Response Status: ${sendResponse.status} ${sendResponse.statusText}`);

    // Get response body
    const responseText = await sendResponse.text();
    console.log(`   Response Body (raw): ${responseText}`);

    // Try to parse as JSON
    let sendResult;
    try {
      sendResult = JSON.parse(responseText);
      console.log(`   Response Body (parsed):`, JSON.stringify(sendResult, null, 2));
    } catch (e) {
      console.log(`   ⚠️ Response is not JSON`);
    }

    if (!sendResponse.ok) {
      console.log('\n❌ SEND REQUEST FAILED');
      console.log('='.repeat(60));
      console.log('ERROR DETAILS:');
      console.log(`  Status Code: ${sendResponse.status}`);
      console.log(`  Status Text: ${sendResponse.statusText}`);
      console.log(`  Error Message: ${sendResult?.error || sendResult?.message || responseText}`);

      if (sendResult?.details) {
        console.log(`  Error Details:`, JSON.stringify(sendResult.details, null, 2));
      }

      console.log('='.repeat(60));
      throw new Error(`Failed to send quote: ${sendResponse.status} - ${sendResult?.error || sendResult?.message || responseText}`);
    }

    console.log('\n✅ Quote email sent successfully!');
    console.log(`   Message: ${sendResult.message}`);
    if (sendResult.data) {
      console.log(`   Message ID: ${sendResult.data.messageId || 'N/A'}`);
      console.log(`   Customer Email: ${sendResult.data.customerEmail || 'N/A'}`);
      console.log(`   PDF Attached: ${sendResult.data.hasPdf ? 'Yes' : 'No'}`);
    }

    // Step 3: Verify quote status was updated
    console.log('\n🔍 Step 3: Verifying quote status...');

    const getResponse = await fetch(`${baseUrl}/api/quotes/${quoteId}`);
    const getResult = await getResponse.json();

    console.log(`   Status: ${getResult.data?.status || 'unknown'}`);
    console.log(`   Sent at: ${getResult.data?.sentAt || 'N/A'}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('📬 Check inbox: ekosolarize@gmail.com');
    console.log('   You should receive a quote email with PDF attachment\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED!');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Run the test
testQuoteSending();
