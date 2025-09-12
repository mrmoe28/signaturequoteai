const { generateQuotePDF } = require('../lib/pdf-generator-stable');

// Test data
const testQuote = {
  id: 'test-123',
  number: 'Q-2024-001',
  createdAt: new Date().toISOString(),
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, ST 12345',
    shipTo: '123 Main St, Anytown, ST 12345'
  },
  lineItems: [
    {
      description: 'Solar Panel - 400W Monocrystalline',
      quantity: 20,
      unitPrice: 250.00,
      extended: 5000.00
    },
    {
      description: 'Inverter - 8kW String Inverter',
      quantity: 2,
      unitPrice: 1200.00,
      extended: 2400.00
    },
    {
      description: 'Installation Labor',
      quantity: 1,
      unitPrice: 3000.00,
      extended: 3000.00
    }
  ]
};

async function testStablePDF() {
  try {
    console.log('🧪 Testing stable PDF generation...');
    
    const startTime = Date.now();
    const pdfBuffer = await generateQuotePDF(testQuote);
    const endTime = Date.now();
    
    console.log(`✅ PDF generated successfully!`);
    console.log(`📄 Size: ${pdfBuffer.length} bytes`);
    console.log(`⏱️  Time: ${endTime - startTime}ms`);
    
    // Save test PDF
    const fs = require('fs');
    const path = require('path');
    const testPdfPath = path.join(__dirname, '..', 'test-stable.pdf');
    fs.writeFileSync(testPdfPath, pdfBuffer);
    console.log(`💾 Test PDF saved to: ${testPdfPath}`);
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
  }
}

testStablePDF();
