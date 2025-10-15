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
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Quote ${data.quoteNumber || data.quoteId}</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
      <style>
        /* Reset styles */
        body, p, h1, h2, h3, h4 {
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f3f4f6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .email-wrapper {
          max-width: 650px;
          margin: 0 auto;
          background-color: #f3f4f6;
          padding: 20px 10px;
        }

        .email-container {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }

        /* Header */
        .email-header {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }

        .logo-text {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .tagline {
          font-size: 15px;
          opacity: 0.95;
          font-weight: 500;
        }

        /* Content sections */
        .email-body {
          padding: 40px 30px;
        }

        .quote-title {
          font-size: 32px;
          font-weight: 700;
          color: #0f766e;
          margin-bottom: 25px;
          text-align: center;
          letter-spacing: -0.5px;
        }

        .greeting {
          font-size: 17px;
          color: #374151;
          margin-bottom: 15px;
          line-height: 1.7;
        }

        /* Info card */
        .info-card {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 25px;
          margin: 30px 0;
        }

        .info-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f766e;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }

        .info-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 15px;
        }

        /* Product items */
        .items-section {
          margin: 35px 0;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f766e;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 3px solid #d1fae5;
        }

        .product-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .product-image {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          padding: 8px;
        }

        .no-image {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          border-radius: 8px;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 600;
        }

        .product-details {
          flex: 1;
        }

        .product-name {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .product-meta {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .product-price {
          font-size: 20px;
          font-weight: 700;
          color: #0f766e;
          text-align: right;
        }

        /* Validity notice */
        .validity-badge {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 10px;
          padding: 20px;
          margin: 30px 0;
          text-align: center;
        }

        .validity-badge strong {
          font-size: 16px;
          color: #92400e;
          display: block;
          margin-bottom: 5px;
        }

        .validity-text {
          color: #78350f;
          font-size: 14px;
        }

        /* Total section */
        .total-section {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 3px solid #0f766e;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }

        .total-label {
          font-size: 16px;
          color: #065f46;
          font-weight: 600;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .total-amount {
          font-size: 42px;
          font-weight: 800;
          color: #0f766e;
          line-height: 1;
        }

        /* CTA section */
        .cta-section {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          padding: 35px;
          text-align: center;
          margin: 35px 0;
        }

        .cta-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 15px;
        }

        .cta-text {
          font-size: 15px;
          color: #1e3a8a;
          margin-bottom: 25px;
          line-height: 1.6;
        }

        .payment-card {
          background: white;
          border: 3px solid #0f766e;
          border-radius: 12px;
          padding: 30px;
          margin: 25px 0;
        }

        .payment-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f766e;
          margin-bottom: 12px;
        }

        .payment-subtitle {
          font-size: 15px;
          color: #6b7280;
          margin-bottom: 25px;
        }

        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          color: white !important;
          padding: 18px 45px;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 17px;
          box-shadow: 0 4px 14px rgba(15, 118, 110, 0.4);
          transition: transform 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(15, 118, 110, 0.5);
        }

        .secure-badge {
          display: inline-block;
          background: #f0fdf4;
          color: #065f46;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 20px;
          border: 1px solid #86efac;
        }

        .payment-link-text {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 20px;
          word-break: break-all;
          line-height: 1.6;
        }

        /* Trust indicators */
        .trust-section {
          text-align: center;
          padding: 25px;
          background: #f9fafb;
          border-radius: 10px;
          margin: 25px 0;
        }

        .trust-items {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 20px;
        }

        .trust-item {
          flex: 1;
          min-width: 150px;
          padding: 15px;
        }

        .trust-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .trust-text {
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
        }

        /* Footer */
        .email-footer {
          background: #1f2937;
          padding: 35px 30px;
          text-align: center;
          color: #d1d5db;
        }

        .footer-brand {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 10px;
        }

        .footer-text {
          font-size: 14px;
          line-height: 1.8;
          margin: 8px 0;
        }

        .footer-divider {
          width: 60px;
          height: 3px;
          background: #0f766e;
          margin: 20px auto;
          border-radius: 2px;
        }

        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
          .email-wrapper {
            padding: 10px 5px;
          }

          .email-body {
            padding: 25px 20px;
          }

          .email-header {
            padding: 30px 20px;
          }

          .logo-text {
            font-size: 26px;
          }

          .quote-title {
            font-size: 26px;
          }

          .product-card {
            flex-direction: column;
            text-align: center;
          }

          .product-price {
            text-align: center;
            margin-top: 10px;
          }

          .total-amount {
            font-size: 34px;
          }

          .cta-button {
            padding: 15px 35px;
            font-size: 15px;
          }

          .trust-items {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <!-- Header -->
          <div class="email-header">
            <div class="logo-text">Signature QuoteCrawler</div>
            <div class="tagline">Professional Solar Equipment Solutions</div>
          </div>

          <!-- Body -->
          <div class="email-body">
            <h1 class="quote-title">Quote #${data.quoteNumber || data.quoteId}</h1>

            <p class="greeting">
              <strong>Dear ${data.customerName},</strong>
            </p>
            <p class="greeting">
              Thank you for your interest in our professional solar equipment solutions. We're excited to provide you with this comprehensive quote tailored specifically for your project needs.
            </p>

            <!-- Quote Info Card -->
            <div class="info-card">
              <div class="info-card-title">Quote Details</div>
              <div class="info-row">
                <span class="info-label">Quote Number</span>
                <span class="info-value">#${data.quoteNumber || data.quoteId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Customer Name</span>
                <span class="info-value">${data.customerName}</span>
              </div>
              ${data.customerCompany ? `
              <div class="info-row">
                <span class="info-label">Company</span>
                <span class="info-value">${data.customerCompany}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Quote Date</span>
                <span class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            ${data.items && data.items.length > 0 ? `
            <!-- Items Section -->
            <div class="items-section">
              <h2 class="section-title">Quote Items</h2>
              ${data.items.map(item => `
                <div class="product-card">
                  ${item.imageUrl ?
                    `<img src="${item.imageUrl}" alt="${item.name}" class="product-image" />` :
                    `<div class="no-image">NO IMAGE</div>`
                  }
                  <div class="product-details">
                    <div class="product-name">${item.name}</div>
                    <div class="product-meta">Quantity: ${item.quantity} × $${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div class="product-price">
                    $${item.extended.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Validity Notice -->
            <div class="validity-badge">
              <strong>⏰ Quote Valid Until</strong>
              <div class="validity-text">${validUntilText}</div>
            </div>

            <!-- Total Section -->
            <div class="total-section">
              <div class="total-label">Total Quote Amount</div>
              <div class="total-amount">$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <!-- CTA Section -->
            <div class="cta-section">
              <h2 class="cta-title">🎯 Ready to Get Started?</h2>
              <p class="cta-text">
                Review the attached PDF for complete specifications and terms, then proceed with secure payment when you're ready.
              </p>

              <div class="payment-card">
                <div class="payment-title">💳 Secure Online Payment</div>
                <p class="payment-subtitle">
                  Pay for this quote instantly using our secure Square payment system
                </p>
                <a href="${paymentLink}" class="cta-button">
                  Pay Now with Square
                </a>
                <div class="secure-badge">
                  🔒 256-bit SSL Encrypted
                </div>
                <div class="payment-link-text">
                  Payment link: ${paymentLink}
                </div>
              </div>

              <p class="greeting">
                Have questions? Our team is here to help! Simply reply to this email or contact our sales team directly.
              </p>
            </div>

            <!-- Trust Indicators -->
            <div class="trust-section">
              <div class="trust-items">
                <div class="trust-item">
                  <div class="trust-icon">✅</div>
                  <div class="trust-text">Professional Grade Equipment</div>
                </div>
                <div class="trust-item">
                  <div class="trust-icon">⚡</div>
                  <div class="trust-text">Fast Shipping</div>
                </div>
                <div class="trust-item">
                  <div class="trust-icon">🛡️</div>
                  <div class="trust-text">Warranty Protected</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="email-footer">
            <div class="footer-brand">Signature QuoteCrawler</div>
            <div class="footer-divider"></div>
            <p class="footer-text">Professional Solar Equipment Solutions</p>
            <p class="footer-text">This quote was generated automatically from our system.</p>
            <p class="footer-text">For assistance, please contact our sales team.</p>
          </div>
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
