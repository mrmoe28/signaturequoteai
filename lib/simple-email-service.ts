import nodemailer from 'nodemailer';
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
}

export async function sendQuoteEmailSimple(data: SimpleEmailData) {
  try {
    if (!data.customerEmail) {
      throw new Error('Customer email is required');
    }

    // Check if we have SMTP credentials
    if (!process.env.GOOGLE_APP_PASSWORD || !process.env.GOOGLE_CLIENT_EMAIL) {
      console.log(`SMTP not configured - simulating quote email send for quote ${data.quoteId} to ${data.customerEmail}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const messageId = `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`Quote email simulated successfully. Message ID: ${messageId}`);

      return {
        success: true,
        messageId,
        message: 'Quote email simulated (SMTP not configured - add GOOGLE_APP_PASSWORD to .env.local)',
      };
    }

    // Use real SMTP with Gmail App Password
    console.log(`Sending real quote email for quote ${data.quoteId} to ${data.customerEmail}`);
    console.log(`SMTP Email: ${process.env.GOOGLE_CLIENT_EMAIL?.substring(0, 3)}***, Password length: ${process.env.GOOGLE_APP_PASSWORD?.length}`);

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_CLIENT_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    const validUntilText = data.validUntil 
      ? new Date(data.validUntil).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '30 days from receipt';

    const mailOptions = {
      from: `"Signature QuoteCrawler" <${process.env.GOOGLE_CLIENT_EMAIL}>`,
      to: data.customerEmail,
      subject: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
      html: generateQuoteEmailHTML(data, validUntilText),
      text: generateQuoteEmailText(data, validUntilText),
      attachments: data.pdfBuffer ? [
        {
          filename: `quote-${data.quoteNumber || data.quoteId}.pdf`,
          content: data.pdfBuffer,
          contentType: 'application/pdf',
        }
      ] : [],
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`Quote email sent successfully via SMTP. Message ID: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Quote sent successfully via Gmail SMTP',
    };

  } catch (error) {
    console.error(`Error sending quote email for ${data.quoteId}:`, error);
    throw error;
  }
}

function generateQuoteEmailHTML(data: SimpleEmailData, validUntilText: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
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
          <p style="margin: 20px 0;">
            <a href="${baseUrl}/quote-view/${data.quoteId}" 
               style="display: inline-block; background: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Quote Online
            </a>
          </p>
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

function generateQuoteEmailText(data: SimpleEmailData, validUntilText: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
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

You can also view your quote online at:
${baseUrl}/quote-view/${data.quoteId}

If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

Best regards,
Signature QuoteCrawler
Professional Solar Equipment Solutions

This quote was generated automatically. For questions, please contact our sales team.
  `;
}
