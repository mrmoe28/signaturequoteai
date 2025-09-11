import { createLogger } from './logger';
import { Quote, CompanySettings } from './types';
import { money } from './formatting';
import { getCompanySettings } from './db/queries';

// Database quote type (from queries)
type DatabaseQuote = {
  id: string;
  number: string | null;
  createdAt: Date | null;
  validUntil: Date | null;
  preparedBy: string | null;
  leadTimeNote: string | null;
  discount: string | null;
  shipping: string | null;
  tax: string | null;
  subtotal: string;
  total: string;
  terms: string | null;
  customerCompany: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerShipTo: string | null;
  items: Array<{
    id: string;
    quoteId: string;
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    extended: number;
    notes: string | null;
  }>;
  customer: {
    company: string | undefined;
    name: string;
    email: string | undefined;
    phone: string | undefined;
    shipTo: string | undefined;
  };
};

const logger = createLogger('pdf-generator');

async function generatePDFFromUrl(url: string): Promise<Buffer> {
  const puppeteer = require('puppeteer');
  
  // Check if we're running on Vercel
  const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  let browser;
  
  if (isVercel) {
    // Use chromium for Vercel deployment
    const chromium = require('@sparticuz/chromium');
    
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // Use local puppeteer for development
    browser = await puppeteer.launch({
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
  }
  
  const page = await browser.newPage();
  
  // Navigate to the quote page
  await page.goto(url, { 
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 30000
  });
  
  // Wait a bit more for any dynamic content
  await page.waitForTimeout(2000);
  
  // Generate PDF with proper settings
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true,
    scale: 0.9
  });

  // Some Puppeteer versions type this as Uint8Array; coerce to Node Buffer
  const pdfBuffer: Buffer = Buffer.from(pdf);

  await browser.close();

  return pdfBuffer;
}

export async function generateQuotePDF(quote: Quote | DatabaseQuote): Promise<Buffer> {
  try {
    // Convert database quote to standard quote format
    const normalizedQuote = normalizeQuote(quote);
    
    // Try to use the dedicated quote view page for better rendering
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const quoteUrl = `${baseUrl}/quote-view/${normalizedQuote.id}?format=pdf`;
    
    try {
      const pdfBuffer = await generatePDFFromUrl(quoteUrl);
      logger.info({ quoteId: normalizedQuote.id }, 'PDF generated successfully from URL');
      return pdfBuffer;
    } catch (urlError) {
      logger.warn({ error: urlError, quoteId: normalizedQuote.id }, 'URL-based PDF generation failed, falling back to HTML');
      
      // Fallback to HTML generation
      const companySettings = await getCompanySettings();
      const html = generateQuoteHTML(normalizedQuote, companySettings);
      const pdfBuffer = await htmlToPDF(html);
      
      logger.info({ quoteId: normalizedQuote.id }, 'PDF generated successfully from HTML fallback');
      return pdfBuffer;
    }
    
  } catch (error) {
    logger.error({ error, quoteId: quote.id }, 'Failed to generate PDF');
    throw error;
  }
}

function normalizeQuote(quote: Quote | DatabaseQuote): Quote {
  // If it's already a Quote type, return as is
  if ('customer' in quote && typeof quote.customer === 'object' && 'createdAt' in quote && typeof quote.createdAt === 'string') {
    return quote as Quote;
  }
  
  // Convert DatabaseQuote to Quote
  const dbQuote = quote as DatabaseQuote;
  return {
    id: dbQuote.id,
    number: dbQuote.number || undefined,
    createdAt: dbQuote.createdAt?.toISOString() || new Date().toISOString(),
    validUntil: dbQuote.validUntil?.toISOString(),
    preparedBy: dbQuote.preparedBy || undefined,
    leadTimeNote: dbQuote.leadTimeNote || undefined,
    discount: parseFloat(dbQuote.discount || '0'),
    shipping: parseFloat(dbQuote.shipping || '0'),
    tax: parseFloat(dbQuote.tax || '0'),
    subtotal: parseFloat(dbQuote.subtotal),
    total: parseFloat(dbQuote.total),
    terms: dbQuote.terms || undefined,
    customer: dbQuote.customer,
    items: dbQuote.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      extended: item.extended,
      notes: item.notes || undefined,
    })),
  };
}

function generateQuoteHTML(quote: Quote, companySettings: CompanySettings | null): string {
  const validUntilText = quote.validUntil 
    ? new Date(quote.validUntil).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '30 days from receipt';

  const createdDate = new Date(quote.createdAt || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quote ${quote.number || quote.id}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #0f766e;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #0f766e;
          margin-bottom: 5px;
        }
        .tagline {
          color: #6b7280;
          font-size: 14px;
        }
        .logo-container {
          margin-bottom: 10px;
        }
        .company-logo {
          max-height: 60px;
          max-width: 200px;
          object-fit: contain;
        }
        .company-info {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }
        .quote-title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0;
        }
        .quote-info {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        .info-section {
          flex: 1;
          min-width: 250px;
          margin: 10px;
        }
        .info-section h3 {
          color: #0f766e;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .info-row {
          margin: 8px 0;
          display: flex;
          justify-content: space-between;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
        }
        .info-value {
          color: #6b7280;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
        }
        .items-table th {
          background: #0f766e;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
        }
        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table tr:nth-child(even) {
          background: #f9fafb;
        }
        .items-table .text-right {
          text-align: right;
        }
        .items-table .text-center {
          text-align: center;
        }
        .totals-section {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          width: 300px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals-table .label {
          font-weight: 600;
          color: #374151;
        }
        .totals-table .value {
          text-align: right;
          color: #6b7280;
        }
        .totals-table .total-row {
          background: #0f766e;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        .totals-table .total-row .label,
        .totals-table .total-row .value {
          color: white;
        }
        .terms-section {
          margin-top: 40px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .terms-section h3 {
          color: #0f766e;
          margin-top: 0;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .validity-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
          font-weight: 600;
          color: #92400e;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .header { page-break-inside: avoid; }
          .items-table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${companySettings?.companyName || 'Signature QuoteCrawler'}</div>
        <div class="tagline">Professional Solar Equipment Solutions</div>
        ${companySettings?.companyAddress || companySettings?.companyPhone || companySettings?.companyEmail ? `
          <div class="company-info">
            ${companySettings?.companyAddress ? `<div>${companySettings.companyAddress}</div>` : ''}
            ${companySettings?.companyCity && companySettings?.companyState && companySettings?.companyZip ? 
              `<div>${companySettings.companyCity}, ${companySettings.companyState} ${companySettings.companyZip}</div>` : ''}
            ${companySettings?.companyPhone ? `<div>${companySettings.companyPhone}</div>` : ''}
            ${companySettings?.companyEmail ? `<div>${companySettings.companyEmail}</div>` : ''}
          </div>
        ` : ''}
      </div>

      <h1 class="quote-title">QUOTE ${quote.number || quote.id}</h1>

      <div class="quote-info">
        <div class="info-section">
          <h3>Quote Details</h3>
          <div class="info-row">
            <span class="info-label">Quote Number:</span>
            <span class="info-value">${quote.number || quote.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date Created:</span>
            <span class="info-value">${createdDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valid Until:</span>
            <span class="info-value">${validUntilText}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Prepared By:</span>
            <span class="info-value">${quote.preparedBy || 'Sales Team'}</span>
          </div>
        </div>

        <div class="info-section">
          <h3>Customer Information</h3>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${quote.customer.name}</span>
          </div>
          ${quote.customer.company ? `
          <div class="info-row">
            <span class="info-label">Company:</span>
            <span class="info-value">${quote.customer.company}</span>
          </div>
          ` : ''}
          ${quote.customer.email ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${quote.customer.email}</span>
          </div>
          ` : ''}
          ${quote.customer.phone ? `
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${quote.customer.phone}</span>
          </div>
          ` : ''}
          ${quote.customer.shipTo ? `
          <div class="info-row">
            <span class="info-label">Ship To:</span>
            <span class="info-value">${quote.customer.shipTo}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="validity-notice">
        This quote is valid until ${validUntilText}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Extended</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map(item => `
            <tr>
              <td>
                <strong>${item.name}</strong>
                ${item.notes ? `<br><small style="color: #6b7280;">${item.notes}</small>` : ''}
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">${money(item.unitPrice)}</td>
              <td class="text-right">${money(item.extended)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td class="label">Subtotal:</td>
            <td class="value">${money(quote.subtotal)}</td>
          </tr>
          ${(quote.discount || 0) > 0 ? `
          <tr>
            <td class="label">Discount:</td>
            <td class="value">-${money(quote.discount)}</td>
          </tr>
          ` : ''}
          ${(quote.shipping || 0) > 0 ? `
          <tr>
            <td class="label">Shipping:</td>
            <td class="value">${money(quote.shipping)}</td>
          </tr>
          ` : ''}
          ${(quote.tax || 0) > 0 ? `
          <tr>
            <td class="label">Tax:</td>
            <td class="value">${money(quote.tax)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td class="label">TOTAL:</td>
            <td class="value">${money(quote.total)}</td>
          </tr>
        </table>
      </div>

      ${quote.leadTimeNote ? `
      <div class="terms-section">
        <h3>Lead Time</h3>
        <p>${quote.leadTimeNote}</p>
      </div>
      ` : ''}

      ${quote.terms ? `
      <div class="terms-section">
        <h3>Terms & Conditions</h3>
        <p>${quote.terms}</p>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Signature QuoteCrawler</strong> | Professional Solar Equipment Solutions</p>
        <p>This quote was generated automatically. For questions, please contact our sales team.</p>
      </div>
    </body>
    </html>
  `;
}

async function htmlToPDF(html: string): Promise<Buffer> {
  try {
    // Use puppeteer for real PDF generation
    const puppeteer = require('puppeteer');
    
    // Check if we're running on Vercel
    const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    let browser;
    
    if (isVercel) {
      // Use chromium for Vercel deployment
      const chromium = require('@sparticuz/chromium');
      
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      // Use local puppeteer for development
      browser = await puppeteer.launch({
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
    }
    
    const page = await browser.newPage();
    
    // Set content and wait for it to load completely
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });
    
    // Wait a bit more for any dynamic content
    await page.waitForTimeout(1000);
    
    // Generate PDF with proper settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      scale: 0.8
    });
    
    // Coerce Uint8Array to Node Buffer for consistent typing
    const pdfBuffer: Buffer = Buffer.from(pdf);

    await browser.close();
    
    logger.info('PDF generated successfully using Puppeteer');
    return pdfBuffer;
    
  } catch (error) {
    logger.error({ error }, 'Failed to generate PDF from HTML');
    
    // Fallback to a simple text-based PDF if puppeteer fails
    logger.info('Falling back to simple PDF generation');
    return generateSimplePDF(html);
  }
}

function generateSimplePDF(html: string): Buffer {
  // Extract text content from HTML for a simple PDF
  const textContent = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Create a simple PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length ${textContent.length + 100}
>>
stream
BT
/F1 12 Tf
72 720 Td
(${textContent.substring(0, 200)}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${300 + textContent.length}
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}
