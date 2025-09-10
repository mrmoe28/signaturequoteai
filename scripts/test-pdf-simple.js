const puppeteer = require('puppeteer');

async function testPDFGeneration() {
  try {
    console.log('Testing PDF generation with Puppeteer...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Create a simple HTML content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Quote</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
          .content { margin: 20px 0; }
          .total { font-size: 24px; font-weight: bold; color: #0f766e; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Signature QuoteCrawler</h1>
          <h2>Test Quote - Q-2024-001</h2>
        </div>
        <div class="content">
          <p><strong>Customer:</strong> Test Customer</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Items:</strong></p>
          <ul>
            <li>Test Solar Panel - $500.00 x 2 = $1,000.00</li>
          </ul>
        </div>
        <div class="total">
          Total: $1,000.00
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF size: ${pdf.length} bytes`);
    
    // Save to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '../test-simple.pdf');
    fs.writeFileSync(outputPath, pdf);
    console.log(`💾 PDF saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
  }
}

testPDFGeneration();
