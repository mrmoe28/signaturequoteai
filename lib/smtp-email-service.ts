import nodemailer from 'nodemailer';
import { createLogger } from './logger';

const logger = createLogger('smtp-email-service');

export interface SMTPQuoteData {
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

// Initialize SMTP transporter
function getSMTPTransporter() {
  if (!process.env.GOOGLE_APP_PASSWORD) {
    throw new Error('SMTP credentials not configured. Please set GOOGLE_APP_PASSWORD environment variable.');
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'ekosolarize@gmail.com', // Your Gmail address
      pass: process.env.GOOGLE_APP_PASSWORD
    }
  });
}

// Test SMTP connectivity
export async function verifySMTPConnectivity(): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getSMTPTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    logger.error({ error }, 'SMTP connectivity check failed');
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendQuoteEmailSMTP(data: SMTPQuoteData) {
  try {
    if (!data.customerEmail) {
      throw new Error('Customer email is required');
    }

    const transporter = getSMTPTransporter();
    
    // Verify connectivity first
    const connectivity = await verifySMTPConnectivity();
    if (!connectivity.ok) {
      throw new Error(`SMTP not accessible: ${connectivity.error}`);
    }

    // Create email content
    const htmlContent = generateQuoteEmailHTML(data);
    const textContent = generateQuoteEmailText(data);
    
    const mailOptions = {
      from: 'ekosolarize@gmail.com',
      to: data.customerEmail,
      subject: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
      html: htmlContent,
      text: textContent,
      attachments: data.pdfBuffer ? [{
        filename: `quote-${data.quoteNumber || data.quoteId}.pdf`,
        content: data.pdfBuffer,
        contentType: 'application/pdf'
      }] : []
    };

    logger.info({ 
      quoteId: data.quoteId, 
      customerEmail: data.customerEmail,
      hasPdf: !!data.pdfBuffer
    }, 'Sending quote email via SMTP');

    // Send email
    const result = await transporter.sendMail(mailOptions);

    logger.info({ 
      messageId: result.messageId,
      quoteId: data.quoteId 
    }, 'Quote email sent successfully via SMTP');

    return {
      success: true,
      messageId: result.messageId,
      message: 'Quote sent successfully via SMTP',
    };

  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Error sending quote email via SMTP');
    throw error;
  }
}

function generateQuoteEmailHTML(data: SMTPQuoteData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const validUntilText = data.validUntil 
    ? new Date(data.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '30 days from receipt';

  // Build optional items table
  const itemsTable = data.items && data.items.length > 0 ? `
    <table class="items" role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Item</th>
          <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Qty</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">Unit</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">Extended</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(i => `
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${i.name}${i.sku ? ` <span style="color:#6b7280">(${i.sku})</span>` : ''}</td>
            <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">${i.quantity}</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">$${i.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">$${i.extended.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
          ${data.customerCompany ? `<div class="row"><span class="label">Company:</span><span class="value">${data.customerCompany}</span></div>` : ''}
          <div class="row"><span class="label">Total Amount:</span><span class="value">$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
        </div>

        <div class="notice"><strong>This quote is valid until ${validUntilText}</strong></div>
        ${itemsTable}
        <div class="total">Total Quote Amount: $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>

        <div class="cta">
          <div style="margin-bottom:12px; color:#374151;">Please review the attached PDF for itemized pricing and terms.</div>
          <a class="btn" href="${baseUrl}/quote-view/${data.quoteId}">View Quote Online</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateQuoteEmailText(data: SMTPQuoteData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const validUntilText = data.validUntil 
    ? new Date(data.validUntil).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '30 days from receipt';

  const items = (data.items || []).map(i => `- ${i.name}${i.sku ? ` (${i.sku})` : ''} | Qty: ${i.quantity} | Unit: $${i.unitPrice.toFixed(2)} | Ext: $${i.extended.toFixed(2)}`).join('\n');

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

If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

View online: ${baseUrl}/quote-view/${data.quoteId}

Best regards,
Signature QuoteCrawler
Professional Solar Equipment Solutions

This quote was generated automatically. For questions, please contact our sales team.
  `;
}
