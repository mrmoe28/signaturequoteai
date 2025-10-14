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
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    extended: number;
    imageUrl?: string | null;
  }>;
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
    subject: process.env.GOOGLE_CLIENT_EMAIL, // Use the service account email as the subject
  });

  return google.gmail({ version: 'v1', auth });
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
  
  let message = [
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
  ];

  // Add PDF attachment if provided
  if (pdfBuffer) {
    const pdfBase64 = pdfBuffer.toString('base64');
    message.push(
      '',
      `--${boundary}`,
      'Content-Type: application/pdf; name="quote-' + quoteNumber + '.pdf"',
      'Content-Disposition: attachment; filename="quote-' + quoteNumber + '.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      pdfBase64,
    );
  }

  message.push(`--${boundary}--`);

  return Buffer.from(message.join('\n')).toString('base64url');
}

function generateQuoteEmailHTML(data: GmailQuoteData): string {
  const validUntilText = data.validUntil 
    ? new Date(data.validUntil).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '30 days from receipt';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote ${data.quoteNumber || data.quoteId}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0f766e;
          margin-bottom: 10px;
        }
        .quote-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0;
        }
        .quote-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .quote-details h3 {
          margin-top: 0;
          color: #0f766e;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #6b7280;
        }
        .total {
          font-size: 24px;
          font-weight: bold;
          color: #0f766e;
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #ecfdf5;
          border-radius: 6px;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 6px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .validity-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .validity-notice strong {
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Signature QuoteCrawler</div>
          <div>Professional Solar Equipment Quotes</div>
        </div>

        <h1 class="quote-title">Quote ${data.quoteNumber || data.quoteId}</h1>

        <p>Dear ${data.customerName},</p>

        <p>Thank you for your interest in our solar equipment solutions. We're pleased to provide you with a detailed quote for your project.</p>

        <div class="quote-details">
          <h3>Quote Information</h3>
          <div class="detail-row">
            <span class="detail-label">Quote Number:</span>
            <span class="detail-value">${data.quoteNumber || data.quoteId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Customer:</span>
            <span class="detail-value">${data.customerName}</span>
          </div>
          ${data.customerCompany ? `
          <div class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${data.customerCompany}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value">$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="validity-notice">
          <strong>This quote is valid until ${validUntilText}</strong>
        </div>

        <div class="total">
          Total Quote Amount: $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>

        <div class="cta-section">
          <h3>Next Steps</h3>
          <p>Please review the attached PDF for complete details of your quote, including itemized pricing, specifications, and terms.</p>
          <p>If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.</p>
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

function generateQuoteEmailText(data: GmailQuoteData): string {
  const validUntilText = data.validUntil 
    ? new Date(data.validUntil).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '30 days from receipt';

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

NEXT STEPS:
Please review the attached PDF for complete details of your quote, including itemized pricing, specifications, and terms.

If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

Best regards,
Signature QuoteCrawler
Professional Solar Equipment Solutions

This quote was generated automatically. For questions, please contact our sales team.
  `;
}
