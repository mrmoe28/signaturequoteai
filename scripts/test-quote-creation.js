// Test quote creation to diagnose the database error
const baseUrl = 'https://signaturequoteai.vercel.app';

async function testQuoteCreation() {
  try {
    console.log('🔍 Testing quote creation...');
    
    const quoteData = {
      customer: {
        name: 'Test Customer',
        email: 'ekosolarize@gmail.com',
        company: 'Test Company',
        phone: '123-456-7890',
        shipTo: '123 Test St, Test City, TC 12345'
      },
      items: [
        {
          productId: 'test-product-123',
          name: 'Test Product',
          unitPrice: 100.00,
          quantity: 1,
          extended: 100.00,
          notes: 'Test item',
          imageUrl: 'https://example.com/test-image.jpg'
        }
      ],
      subtotal: 100.00,
      total: 100.00,
      discount: 0,
      shipping: 0,
      tax: 0,
      preparedBy: 'Test User',
      leadTimeNote: 'Test lead time',
      terms: 'Test terms'
    };
    
    const response = await fetch(`${baseUrl}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData)
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Quote created successfully');
      return data.data.id;
    } else {
      console.log('❌ Quote creation failed');
      return null;
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testQuoteSending(quoteId) {
  if (!quoteId) return;
  
  try {
    console.log(`\n📧 Testing quote sending for quote ${quoteId}...`);
    
    const response = await fetch(`${baseUrl}/api/quotes/${quoteId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Quote sent successfully');
    } else {
      console.log('❌ Quote sending failed');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Testing quote creation and sending...');
  
  const quoteId = await testQuoteCreation();
  await testQuoteSending(quoteId);
  
  console.log('\n✅ Test completed');
}

runTest();
