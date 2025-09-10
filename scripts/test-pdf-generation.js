const { generateQuotePDF } = require('../lib/pdf-generator.ts');

async function testPDFGeneration() {
  try {
    console.log('Testing PDF generation...');
    
    // Create a test quote
    const testQuote = {
      id: 'test-quote-123',
      number: 'Q-2024-001',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      preparedBy: 'Test User',
      leadTimeNote: '2-3 weeks',
      discount: '0',
      shipping: '0',
      tax: '0',
      subtotal: '1000.00',
      total: '1000.00',
      terms: 'Net 30 days',
      customerCompany: 'Test Company',
      customerName: 'John Doe',
      customerEmail: 'john@testcompany.com',
      customerPhone: '555-1234',
      customerShipTo: '123 Test St, Test City, TC 12345',
      items: [
        {
          id: 'item-1',
          quoteId: 'test-quote-123',
          productId: 'product-1',
          name: 'Test Solar Panel',
          unitPrice: 500,
          quantity: 2,
          extended: 1000,
          notes: 'High efficiency panel',
        }
      ],
      customer: {
        company: 'Test Company',
        name: 'John Doe',
        email: 'john@testcompany.com',
        phone: '555-1234',
        shipTo: '123 Test St, Test City, TC 12345',
      }
    };

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(testQuote);
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
    
    // Save to file for inspection
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '../test-quote.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`💾 PDF saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
  }
}

testPDFGeneration();
