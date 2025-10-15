import nodemailer from 'nodemailer';
import { createLogger } from './logger';
import {
  createPlaceholderPaymentLink,
  type PaymentLinkData,
} from './square-client';
import { createUserSquarePaymentLink } from './square-user-client';

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
  userId?: string; // User ID for Square OAuth
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    extended: number;
    imageUrl?: string | null;
  }>;
}

export async function sendQuoteEmailSimple(data: SimpleEmailData) {
  try {
    if (!data.customerEmail) {
      throw new Error('Customer email is required');
    }

    // Check if we have SMTP credentials
    const hasEmailConfig = process.env.GOOGLE_APP_PASSWORD && process.env.GOOGLE_CLIENT_EMAIL;
    const isPlaceholder = process.env.GOOGLE_CLIENT_EMAIL === 'your-gmail@gmail.com' || 
                         process.env.GOOGLE_APP_PASSWORD === 'your-app-specific-password';
    
    if (!hasEmailConfig || isPlaceholder) {
      logger.info({ quoteId: data.quoteId, customerEmail: data.customerEmail }, 'SMTP not configured - simulating quote email send');
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const messageId = `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logger.info({ quoteId: data.quoteId, messageId }, 'Quote email simulated successfully');

      return {
        success: true,
        messageId,
        message: 'Quote email simulated successfully (SMTP not configured)',
      };
    }

    // Use real SMTP with Gmail App Password
    // Remove spaces from app password (Gmail displays them with spaces but they should work without)
    const appPassword = process.env.GOOGLE_APP_PASSWORD?.replace(/\s/g, '') || '';
    const fromEmail = process.env.SUPPORT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || '';

    logger.info({
      quoteId: data.quoteId,
      customerEmail: data.customerEmail,
      fromEmail: fromEmail?.substring(0, 3) + '***',
      passwordLength: appPassword.length
    }, 'Sending quote email via Gmail SMTP');

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: fromEmail,
        pass: appPassword,
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
      from: `"Signature QuoteCrawler" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
      html: await generateQuoteEmailHTML(data, validUntilText),
      text: await generateQuoteEmailText(data, validUntilText),
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

async function generateSquarePaymentLink(data: SimpleEmailData): Promise<string> {
  // If no userId provided, use placeholder
  if (!data.userId) {
    logger.warn(
      { quoteId: data.quoteId },
      'No userId provided - using placeholder payment link'
    );
    return createPlaceholderPaymentLink({
      quoteId: data.quoteId,
      quoteNumber: data.quoteNumber || undefined,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      amount: data.total,
      description: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
    });
  }

  try {
    // Create a real Square payment link using user's OAuth tokens
    const paymentUrl = await createUserSquarePaymentLink(data.userId, {
      quoteId: data.quoteId,
      quoteNumber: data.quoteNumber || undefined,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      amount: data.total,
      description: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quotes/${data.quoteId}/payment-success`,
    });

    // If payment link creation failed, fall back to placeholder
    if (!paymentUrl) {
      logger.warn(
        { quoteId: data.quoteId, userId: data.userId },
        'Square payment link creation returned null, using placeholder'
      );
      return createPlaceholderPaymentLink({
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber || undefined,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        amount: data.total,
        description: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
      });
    }

    return paymentUrl;
  } catch (error) {
    logger.error(
      { error, quoteId: data.quoteId, userId: data.userId },
      'Failed to create user Square payment link, falling back to placeholder'
    );

    // Fall back to placeholder if Square API fails
    return createPlaceholderPaymentLink({
      quoteId: data.quoteId,
      quoteNumber: data.quoteNumber || undefined,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      amount: data.total,
      description: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
    });
  }
}

async function generateQuoteEmailHTML(data: SimpleEmailData, validUntilText: string): Promise<string> {
  const paymentLink = await generateSquarePaymentLink(data);
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
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
        }
        .product-image {
          width: 60px;
          height: 60px;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .no-image {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 10px;
          color: #9ca3af;
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

        ${data.items && data.items.length > 0 ? `
        <div class="items-section">
          <h3 style="color: #0f766e; margin-top: 30px;">Quote Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 80px;">Image</th>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>
                    ${item.imageUrl ?
                      `<img src="${item.imageUrl}" alt="${item.name}" class="product-image" />` :
                      `<div class="no-image">No Image</div>`
                    }
                  </td>
                  <td><strong>${item.name}</strong></td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right;"><strong>$${item.extended.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="validity-notice">
          <strong>This quote is valid until ${validUntilText}</strong>
        </div>

        <div class="total">
          Total Quote Amount: $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>

        <div class="cta-section">
          <h3>Next Steps</h3>
          <p>Please review the attached PDF for complete details of your quote, including itemized pricing, specifications, and terms.</p>
          
          <div style="margin: 25px 0; padding: 20px; background: #fff; border: 2px solid #0f766e; border-radius: 8px;">
            <h4 style="color: #0f766e; margin-top: 0;">Ready to Pay?</h4>
            <p style="margin: 10px 0;">You can pay for this quote securely online using Square:</p>
            <a href="${paymentLink}"
               style="display: inline-block;
                      background: #0f766e;
                      color: white;
                      padding: 12px 30px;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: bold;
                      margin-top: 10px;">
              Pay Now with Square
            </a>
            <p style="font-size: 12px; color: #6b7280; margin-top: 15px;">
              Payment link: ${paymentLink}
            </p>
          </div>
          
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

async function generateQuoteEmailText(data: SimpleEmailData, validUntilText: string): Promise<string> {
  const paymentLink = await generateSquarePaymentLink(data);

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

READY TO PAY?
You can pay for this quote securely online using Square:
${paymentLink}

If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

Best regards,
Signature QuoteCrawler
Professional Solar Equipment Solutions

This quote was generated automatically. For questions, please contact our sales team.
  `;
}
