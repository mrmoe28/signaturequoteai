import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { Buffer } from 'node:buffer';
import { createLogger } from './logger';
import { Quote, CompanySettings } from './types';
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
    imageUrl?: string | null;
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

export async function generateQuotePDF(quote: Quote | DatabaseQuote): Promise<Buffer> {
  let browser;
  
  try {
    logger.info({ quoteId: quote.id }, 'Starting Puppeteer PDF generation');
    
    // Convert database quote to standard quote format
    const normalizedQuote = normalizeQuote(quote);
    
    // Get company settings
    const companySettings = await getCompanySettings();
    
    if (!companySettings) {
      throw new Error('Company settings not found');
    }
    
    // Detect if running in serverless environment (Vercel)
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    // Launch Puppeteer browser with appropriate configuration
    browser = await puppeteer.launch({
      args: isServerless 
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ],
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      executablePath: isServerless 
        ? await chromium.executablePath() 
        : puppeteer.executablePath(),
      headless: true
    });
    
    const page = await browser.newPage();
    
    // Generate HTML content for the quote
    const html = generateQuoteHTML(normalizedQuote, companySettings);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    // Convert Uint8Array to Buffer - ensure proper type conversion
    const pdfBuffer: Buffer = Buffer.from(pdfUint8Array.buffer, pdfUint8Array.byteOffset, pdfUint8Array.byteLength);
    
    logger.info({ 
      quoteId: normalizedQuote.id, 
      size: pdfBuffer.length 
    }, 'PDF generated successfully with Puppeteer');
    
    return pdfBuffer;
    
  } catch (error) {
    logger.error({ error, quoteId: quote.id }, 'Failed to generate PDF with Puppeteer');
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
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

function generateQuoteHTML(quote: Quote, companySettings: CompanySettings): string {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quote ${quote.number || quote.id}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          color: #333;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #0f766e; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .company-info {
          margin-bottom: 20px;
        }
        .company-info a {
          color: #0f766e;
          text-decoration: none;
        }
        .company-info a:hover {
          text-decoration: underline;
        }
        .quote-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .customer-info, .quote-details {
          flex: 1;
        }
        .customer-info {
          margin-right: 20px;
        }
        .customer-email {
          color: #0f766e;
          text-decoration: none;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th, .items-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .items-table .text-right {
          text-align: right;
        }
        .interactive-field {
          border: 1px solid #ccc;
          padding: 5px;
          background-color: #fff;
          min-height: 20px;
          position: relative;
        }
        .interactive-field::after {
          content: "📝";
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          opacity: 0.5;
        }
        .totals {
          margin-top: 30px;
          text-align: right;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          padding: 5px 0;
        }
        .total-line.final {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #0f766e;
          padding-top: 10px;
          margin-top: 15px;
        }
        .terms {
          margin-top: 40px;
          padding: 20px;
          background-color: #f8f9fa;
          border-left: 4px solid #0f766e;
        }
        .signature-section {
          margin-top: 40px;
          border: 1px solid #ddd;
          padding: 20px;
          background-color: #fafafa;
        }
        .signature-fields {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        .signature-field {
          flex: 1;
          margin: 0 10px;
        }
        .signature-line {
          border-bottom: 2px solid #333;
          height: 60px;
          margin-bottom: 10px;
          position: relative;
        }
        .signature-line::after {
          content: "✍️ Sign here";
          position: absolute;
          bottom: -25px;
          left: 0;
          font-size: 12px;
          color: #666;
        }
        .acceptance-section {
          margin-top: 30px;
          padding: 20px;
          border: 2px solid #0f766e;
          background-color: #f0fdf4;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          margin: 10px 0;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #0f766e;
          margin-right: 10px;
          position: relative;
          background-color: white;
        }
        .checkbox::after {
          content: "☐";
          font-size: 16px;
          position: absolute;
          top: -2px;
          left: 1px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .action-buttons {
          margin-top: 20px;
          text-align: center;
        }
        .action-button {
          display: inline-block;
          padding: 12px 24px;
          margin: 0 10px;
          background-color: #0f766e;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
        .action-button.secondary {
          background-color: #6b7280;
        }
        @media print {
          .action-buttons {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companySettings.companyName || 'Signature QuoteCrawler'}</h1>
        <h2>Quote ${quote.number || quote.id}</h2>
      </div>
      
      <div class="company-info">
        <p><strong>${companySettings.companyName || 'Company Name'}</strong></p>
        <p>${companySettings.companyAddress || 'Address'}</p>
        <p>
          ${companySettings.companyPhone ? `<a href="tel:${companySettings.companyPhone}">${companySettings.companyPhone}</a>` : 'Phone'} | 
          ${companySettings.companyEmail ? `<a href="mailto:${companySettings.companyEmail}">${companySettings.companyEmail}</a>` : 'Email'}
        </p>
      </div>
      
      <div class="quote-info">
        <div class="customer-info">
          <h3>Bill To:</h3>
          <p><strong>${quote.customer.name}</strong></p>
          ${quote.customer.company ? `<p>${quote.customer.company}</p>` : ''}
          ${quote.customer.email ? `<p><a href="mailto:${quote.customer.email}" class="customer-email">${quote.customer.email}</a></p>` : ''}
          ${quote.customer.phone ? `<p><a href="tel:${quote.customer.phone}" class="customer-email">${quote.customer.phone}</a></p>` : ''}
          ${quote.shipTo ? `<p><strong>Ship To:</strong><br>${quote.shipTo}</p>` : ''}
        </div>
        
        <div class="quote-details">
          <p><strong>Quote Date:</strong> ${formatDate(quote.createdAt || new Date().toISOString())}</p>
          ${quote.validUntil ? `<p><strong>Valid Until:</strong> ${formatDate(quote.validUntil)}</p>` : ''}
          ${quote.preparedBy ? `<p><strong>Prepared By:</strong> ${quote.preparedBy}</p>` : ''}
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Extended</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map(item => `
            <tr>
              <td>
                <strong>${item.name}</strong>
                ${item.notes ? `<br><small>${item.notes}</small>` : ''}
              </td>
              <td class="text-right">${formatCurrency(item.unitPrice || 0)}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.extended)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${formatCurrency(quote.subtotal)}</span>
        </div>
        ${(quote.discount || 0) > 0 ? `
          <div class="total-line">
            <span>Discount:</span>
            <span>-${formatCurrency(quote.discount || 0)}</span>
          </div>
        ` : ''}
        ${(quote.shipping || 0) > 0 ? `
          <div class="total-line">
            <span>Shipping:</span>
            <span>${formatCurrency(quote.shipping || 0)}</span>
          </div>
        ` : ''}
        ${(quote.tax || 0) > 0 ? `
          <div class="total-line">
            <span>Tax:</span>
            <span>${formatCurrency(quote.tax || 0)}</span>
          </div>
        ` : ''}
        <div class="total-line final">
          <span>Total:</span>
          <span>${formatCurrency(quote.total)}</span>
        </div>
      </div>
      
      ${quote.leadTimeNote ? `
        <div class="terms">
          <h3>Lead Time:</h3>
          <p>${quote.leadTimeNote}</p>
        </div>
      ` : ''}
      
      ${quote.terms ? `
        <div class="terms">
          <h3>Terms & Conditions:</h3>
          <p>${quote.terms}</p>
        </div>
      ` : ''}
      
      <!-- Interactive Acceptance Section -->
      <div class="acceptance-section">
        <h3>Quote Acceptance</h3>
        <div class="checkbox-item">
          <div class="checkbox"></div>
          <span>I accept the terms and conditions of this quote</span>
        </div>
        <div class="checkbox-item">
          <div class="checkbox"></div>
          <span>I authorize the work to proceed as outlined</span>
        </div>
        <div class="checkbox-item">
          <div class="checkbox"></div>
          <span>I agree to the payment terms specified</span>
        </div>
      </div>
      
      <!-- Interactive Signature Section -->
      <div class="signature-section">
        <h3>Signatures</h3>
        <div class="signature-fields">
          <div class="signature-field">
            <div class="signature-line"></div>
            <p><strong>Customer Signature</strong></p>
            <div class="interactive-field" style="margin-top: 10px;">
              <small>Print Name</small>
            </div>
            <div class="interactive-field" style="margin-top: 10px;">
              <small>Date</small>
            </div>
          </div>
          <div class="signature-field">
            <div class="signature-line"></div>
            <p><strong>Company Representative</strong></p>
            <div class="interactive-field" style="margin-top: 10px;">
              <small>Print Name</small>
            </div>
            <div class="interactive-field" style="margin-top: 10px;">
              <small>Date</small>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons for Interactive PDF -->
      <div class="action-buttons">
        <a href="mailto:${quote.customer.email}?subject=Quote%20${quote.number || quote.id}%20-%20Follow%20Up&body=Thank%20you%20for%20your%20interest%20in%20our%20quote.%20Please%20let%20us%20know%20if%20you%20have%20any%20questions." class="action-button">
          📧 Email Quote
        </a>
        <a href="tel:${companySettings.companyPhone || ''}" class="action-button secondary">
          📞 Call Us
        </a>
        <a href="${companySettings.companyWebsite || '#'}" class="action-button secondary">
          🌐 Visit Website
        </a>
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p><em>This is an interactive PDF document. Click on links and fill in signature fields as needed.</em></p>
      </div>
    </body>
    </html>
  `;
}