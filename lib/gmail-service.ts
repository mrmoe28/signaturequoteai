import { google } from 'googleapis';
import { createLogger } from './logger';

const logger = createLogger('gmail-service');

export interface GmailQuoteData {
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

// Initialize Gmail API
function getGmailService() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Gmail API credentials not configured. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.');
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: 'ekosolarize@gmail.com', // Use your personal Gmail account as the subject
  });

  return google.gmail({ version: 'v1', auth });
}

// Lightweight connectivity check for API credentials
export async function verifyGmailConnectivity(): Promise<{ ok: boolean; email?: string }>{
  const gmail = getGmailService();
  const profile = await gmail.users.getProfile({ userId: 'me' });
  return { ok: true, email: profile.data.emailAddress || undefined };
}

export async function sendQuoteEmailGmail(data: GmailQuoteData) {
  try {
    if (!data.customerEmail) {
      throw new Error('Customer email is required');
    }

    const gmail = getGmailService();
    
    // Create email content
    const htmlContent = generateQuoteEmailHTML(data);
    const textContent = generateQuoteEmailText(data);
    
    // Create email message
    const message = createEmailMessage({
      to: data.customerEmail,
      subject: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
      html: htmlContent,
      text: textContent,
      pdfBuffer: data.pdfBuffer,
      quoteNumber: data.quoteNumber || data.quoteId,
    });

    logger.info({ 
      quoteId: data.quoteId, 
      customerEmail: data.customerEmail,
      hasPdf: !!data.pdfBuffer 
    }, 'Sending quote email via Gmail API');

    // Send email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: message,
      },
    });

    logger.info({ 
      messageId: result.data.id,
      quoteId: data.quoteId 
    }, 'Quote email sent successfully via Gmail API');

    return {
      success: true,
      messageId: result.data.id,
      message: 'Quote sent successfully via Gmail',
    };

  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Error sending quote email via Gmail API');
    throw error;
  }
}

function createEmailMessage({ to, subject, html, text, pdfBuffer, quoteNumber }: {
  to: string;
  subject: string;
  html: string;
  text: string;
  pdfBuffer?: Buffer;
  quoteNumber: string;
}): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);

  // Use CRLF line endings per RFC 2822/ MIME to avoid attachment corruption in some clients
  const CRLF = '\r\n';

  let message = [
    `From: ${process.env.GOOGLE_CLIENT_EMAIL}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: multipart/alternative; boundary="' + boundary + '_alt"',
    '',
    `--${boundary}_alt`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    text,
    '',
    `--${boundary}_alt`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}_alt--`,
  ].join(CRLF);

  // Add PDF attachment if provided
  if (pdfBuffer) {
    const pdfBase64 = pdfBuffer.toString('base64');
    message += CRLF + [
      '',
      `--${boundary}`,
      'Content-Type: application/pdf; name="quote-' + quoteNumber + '.pdf"',
      'Content-Disposition: attachment; filename="quote-' + quoteNumber + '.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      pdfBase64,
    ].join(CRLF);
  }

  message += CRLF + `--${boundary}--` + CRLF;

  return Buffer.from(message).toString('base64url');
}

function generateQuoteEmailHTML(data: GmailQuoteData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const validUntilText = data.validUntil 
    ? new Date(data.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '30 days from receipt';

  // Build optional items table
  const itemsTable = data.items && data.items.length > 0 ? `
    <table class="items" role="presentation">
      <thead>
        <tr><th>Item</th><th class="center">Qty</th><th class="right">Unit</th><th class="right">Extended</th></tr>
      </thead>
      <tbody>
        ${data.items.map(i => `
          <tr>
            <td>${i.name}${i.sku ? ` <span style=\"color:#6b7280\">(${i.sku})</span>` : ''}</td>
            <td class="center">${i.quantity}</td>
            <td class="right">$${i.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td class="right">$${i.extended.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
      </div>
    </body>
    </html>
  `;
}

function generateQuoteEmailText(data: GmailQuoteData): string {
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
