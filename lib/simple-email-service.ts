import { sendQuoteEmailGmail } from './gmail-service';
import { createLogger } from './logger';

const logger = createLogger('simple-email-service');

export interface SimpleEmailData {
  quoteId: string;
  quoteNumber?: string | null;
  customerName: string;
  customerEmail: string;
  customerCompany?: string | null;
  total: number;
  validUntil?: string | null;
  pdfBuffer?: Buffer;
  items?: Array<{ name: string; sku?: string | null; quantity: number; unitPrice: number; extended: number; }>;
}

export async function sendQuoteEmailSimple(data: SimpleEmailData) {
  try {
    if (!data.customerEmail) {
      throw new Error('Customer email is required');
    }

    // Prefer Gmail API if credentials exist
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      const result = await sendQuoteEmailGmail({
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerCompany: data.customerCompany,
        total: data.total,
        validUntil: data.validUntil,
        pdfBuffer: data.pdfBuffer,
        items: data.items,
      });
      return result;
    }

    // Fall back to simulation when Gmail API is not configured
    console.log(`Email service not configured - simulating quote email send for quote ${data.quoteId} to ${data.customerEmail}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const messageId = `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`Quote email simulated successfully. Message ID: ${messageId}`);

      return {
        success: true,
        messageId,
        message: 'Quote email simulated (configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY to enable Gmail API send)',
      };
    }
  } catch (error) {
    console.error(`Error sending quote email for ${data.quoteId}:`, error);
    throw error;
  }
}

function generateQuoteEmailHTML(data: SimpleEmailData, validUntilText: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const itemsTable = data.items && data.items.length > 0 ? `
    <table class="items" role="presentation" style="width:100%; border-collapse:collapse; margin: 20px 0;">
      <thead>
        <tr>
          <th style="background:#0f766e; color:#ffffff; text-align:left; padding:10px 8px;">Item</th>
          <th style="background:#0f766e; color:#ffffff; text-align:center; padding:10px 8px;">Qty</th>
          <th style="background:#0f766e; color:#ffffff; text-align:right; padding:10px 8px;">Unit</th>
          <th style="background:#0f766e; color:#ffffff; text-align:right; padding:10px 8px;">Extended</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(i => `
          <tr>
            <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb;">${i.name}${i.sku ? ` <span style=\"color:#6b7280\">(${i.sku})</span>` : ''}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:center;">${i.quantity}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:right;">$${i.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:right;">$${i.extended.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : '';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote ${data.quoteNumber || data.quoteId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 720px; margin: 0 auto; padding: 24px; background-color: #f6faf8; }
        .container { background: #ffffff; border-radius: 10px; padding: 32px; border: 1px solid #e5f2ea; }
        .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: bold; color: #0f766e; margin-bottom: 8px; }
        .section-title { color: #0f766e; font-weight: 700; margin: 0 0 12px 0; }
        .info { background: #f7fbf9; border: 1px solid #e5f2ea; border-radius: 8px; padding: 12px 16px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #374151; }
        .value { color: #4b5563; }
        .notice { background: #fff7e6; border: 1px solid #f59e0b; color: #92400e; padding: 10px 14px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .total { text-align: center; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 18px; font-weight: 800; font-size: 22px; border-radius: 10px; }
        .cta { text-align: center; background: #eef7ff; border-radius: 8px; padding: 18px; margin-top: 18px; }
        .btn { display: inline-block; background: #0f766e; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Signature QuoteCrawler</div>
          <div>Professional Solar Equipment Quotes</div>
        </div>

        <h2 class="section-title">Quote ${data.quoteNumber || data.quoteId}</h2>
        <div class="info">
          <div class="row"><span class="label">Quote Number:</span><span class="value">${data.quoteNumber || data.quoteId}</span></div>
          <div class="row"><span class="label">Customer:</span><span class="value">${data.customerName}</span></div>
          ${data.customerCompany ? `<div class=\"row\"><span class=\"label\">Company:</span><span class=\"value\">${data.customerCompany}</span></div>` : ''}
          <div class="row"><span class="label">Total Amount:</span><span class="value">$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
        </div>

        <div class="notice"><strong>This quote is valid until ${validUntilText}</strong></div>
        ${itemsTable}
        <div class="total">Total Quote Amount: $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>

        <div class="cta">
          <div style="margin-bottom:12px; color:#374151;">Please review the attached PDF for itemized pricing and terms.</div>
          <a class="btn" href="${baseUrl}/quote-view/${data.quoteId}">View Quote Online</a>
        </div>

        <div class="footer">
          <p><strong>Signature QuoteCrawler</strong></p>
          <p>Professional Solar Equipment Solutions</p>
          <p>This quote was generated automatically. For questions, please contact our sales team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateQuoteEmailText(data: SimpleEmailData, validUntilText: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const items = (data.items || []).map(i => `- ${i.name}${i.sku ? ` (${i.sku})` : ''} | Qty: ${i.quantity} | Unit: $${i.unitPrice?.toFixed(2)} | Ext: $${i.extended?.toFixed(2)}`).join('\n');
  return `
Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment

Dear ${data.customerName},

Thank you for your interest in our solar equipment solutions. We're pleased to provide you with a detailed quote for your project.

QUOTE INFORMATION:
- Quote Number: ${data.quoteNumber || data.quoteId}
- Customer: ${data.customerName}
${data.customerCompany ? `- Company: ${data.customerCompany}` : ''}
- Total Amount: $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}

IMPORTANT: This quote is valid until ${validUntilText}

TOTAL QUOTE AMOUNT: $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}

ITEMS:
${items}

NEXT STEPS:
Please review the attached PDF for complete details of your quote, including itemized pricing, specifications, and terms.

You can also view your quote online at:
${baseUrl}/quote-view/${data.quoteId}

If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

Best regards,
Signature QuoteCrawler
Professional Solar Equipment Solutions

This quote was generated automatically. For questions, please contact our sales team.
  `;
}
