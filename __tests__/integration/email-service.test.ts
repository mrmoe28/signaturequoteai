// @ts-nocheck - Jest test file with mocking
import { describe, expect, test, beforeAll, afterEach, jest } from '@jest/globals';
import { sendQuoteEmailSimple, type SimpleEmailData } from '@/lib/simple-email-service';
import nodemailer from 'nodemailer';

/**
 * Integration tests for Email Service
 *
 * Tests the complete email flow including:
 * - Email template rendering (HTML & plain text)
 * - Square payment link generation
 * - SMTP delivery (mocked)
 * - PDF attachment handling
 * - Error scenarios
 *
 * Based on best practices:
 * - Template consistency across email clients
 * - Fallback to plain text
 * - Graceful degradation when services unavailable
 */

// Mock nodemailer for testing
jest.mock('nodemailer');

const mockSendMail = jest.fn();
const mockCreateTransport = nodemailer.createTransport as jest.MockedFunction<typeof nodemailer.createTransport>;

mockCreateTransport.mockReturnValue({
  sendMail: mockSendMail,
} as any);

describe('Email Service Integration', () => {
  beforeAll(() => {
    // Setup environment for testing
    process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
    process.env.GOOGLE_APP_PASSWORD = 'test-app-password';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Sending', () => {
    test('should send email with valid quote data', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id-123',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-123',
        quoteNumber: 'Q-2024-001',
        customerName: 'John Doe',
        customerEmail: 'customer@example.com',
        customerCompany: 'Acme Solar Inc',
        total: 15000.50,
        validUntil: new Date('2024-12-31').toISOString(),
        items: [
          {
            name: 'Solar Panel 400W',
            quantity: 10,
            unitPrice: 250.00,
            extended: 2500.00,
            imageUrl: 'https://example.com/panel.jpg'
          },
          {
            name: 'Inverter 5kW',
            quantity: 2,
            unitPrice: 1500.00,
            extended: 3000.00,
          }
        ]
      };

      const result = await sendQuoteEmailSimple(quoteData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe('customer@example.com');
      expect(mailOptions.subject).toContain('Q-2024-001');
      expect(mailOptions.html).toBeTruthy();
      expect(mailOptions.text).toBeTruthy();
    });

    test('should include PDF attachment when provided', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id-pdf',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const pdfBuffer = Buffer.from('Mock PDF content');
      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-pdf',
        quoteNumber: 'Q-2024-002',
        customerName: 'Jane Smith',
        customerEmail: 'customer@example.com',
        total: 5000.00,
        pdfBuffer,
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.attachments).toHaveLength(1);
      expect(mailOptions.attachments[0].filename).toBe('quote-Q-2024-002.pdf');
      expect(mailOptions.attachments[0].content).toBe(pdfBuffer);
      expect(mailOptions.attachments[0].contentType).toBe('application/pdf');
    });

    test('should handle email without PDF attachment', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id-no-pdf',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-no-pdf',
        customerName: 'Bob Johnson',
        customerEmail: 'customer@example.com',
        total: 3000.00,
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.attachments).toHaveLength(0);
    });
  });

  describe('Email Template Rendering', () => {
    test('HTML template should include all quote details', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-template',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-template',
        quoteNumber: 'Q-2024-003',
        customerName: 'Alice Williams',
        customerEmail: 'customer@example.com',
        customerCompany: 'Green Energy Co',
        total: 25000.00,
        validUntil: new Date('2024-12-31').toISOString(),
        items: [
          {
            name: 'Battery Pack 10kWh',
            quantity: 5,
            unitPrice: 3000.00,
            extended: 15000.00,
            imageUrl: 'https://example.com/battery.jpg'
          }
        ]
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      const htmlContent = mailOptions.html as string;

      // Verify HTML structure
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('Quote Q-2024-003');
      expect(htmlContent).toContain('Alice Williams');
      expect(htmlContent).toContain('Green Energy Co');
      expect(htmlContent).toContain('$25,000.00');
      expect(htmlContent).toContain('Battery Pack 10kWh');
      expect(htmlContent).toContain('December 31, 2024'); // Valid until formatted
      expect(htmlContent).toContain('Pay Now with Square');
      expect(htmlContent).toContain('<table'); // Items table
      expect(htmlContent).toContain('https://example.com/battery.jpg'); // Product image
    });

    test('HTML template should show "No Image" for products without images', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-no-image',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-no-image',
        quoteNumber: 'Q-2024-004',
        customerName: 'Test User',
        customerEmail: 'customer@example.com',
        total: 1000.00,
        items: [
          {
            name: 'Solar Cable 50ft',
            quantity: 10,
            unitPrice: 15.00,
            extended: 150.00,
            // No imageUrl
          }
        ]
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      const htmlContent = mailOptions.html as string;

      expect(htmlContent).toContain('No Image');
      expect(htmlContent).not.toContain('<img'); // No image tag for this item
    });

    test('Plain text template should include all essential information', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-plaintext',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-text',
        quoteNumber: 'Q-2024-005',
        customerName: 'Charlie Brown',
        customerEmail: 'customer@example.com',
        total: 8500.00,
        validUntil: new Date('2024-12-31').toISOString(),
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      const textContent = mailOptions.text as string;

      // Verify plain text structure
      expect(textContent).toContain('Quote Q-2024-005');
      expect(textContent).toContain('Charlie Brown');
      expect(textContent).toContain('$8,500.00');
      expect(textContent).toContain('December 31, 2024');
      expect(textContent).toContain('READY TO PAY?');
      expect(textContent).toContain('http'); // Payment link
      expect(textContent).not.toContain('<'); // No HTML tags
    });

    test('should handle missing optional fields gracefully', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-minimal',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-minimal',
        customerName: 'Minimal User',
        customerEmail: 'customer@example.com',
        total: 1000.00,
        // No quoteNumber, company, validUntil, or items
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      const htmlContent = mailOptions.html as string;
      const textContent = mailOptions.text as string;

      // Should use quoteId when quoteNumber is missing
      expect(mailOptions.subject).toContain('test-quote-minimal');
      expect(htmlContent).toContain('test-quote-minimal');

      // Should show default validity
      expect(htmlContent).toContain('30 days from receipt');
      expect(textContent).toContain('30 days from receipt');

      // Should not show company section
      expect(htmlContent).not.toContain('Company:');
    });
  });

  describe('Square Payment Link Integration', () => {
    test('should include Square payment link in email', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-payment-link',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-payment',
        quoteNumber: 'Q-2024-006',
        customerName: 'Payment User',
        customerEmail: 'customer@example.com',
        total: 5000.00,
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      const htmlContent = mailOptions.html as string;
      const textContent = mailOptions.text as string;

      // Should contain payment link (either real Square link or placeholder)
      expect(htmlContent).toContain('href="http');
      expect(htmlContent).toContain('Pay Now with Square');
      expect(textContent).toContain('http');

      // Payment link should include quote identifier
      const linkMatch = htmlContent.match(/href="([^"]+)"/);
      expect(linkMatch).toBeTruthy();
      if (linkMatch) {
        const paymentUrl = linkMatch[1];
        expect(paymentUrl).toMatch(/Q-2024-006|test-quote-payment/);
      }
    });
  });

  describe('SMTP Configuration Handling', () => {
    test('should simulate email when SMTP not configured', async () => {
      // Temporarily remove SMTP config
      const originalEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const originalPassword = process.env.GOOGLE_APP_PASSWORD;

      delete process.env.GOOGLE_CLIENT_EMAIL;
      delete process.env.GOOGLE_APP_PASSWORD;

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-simulated',
        customerName: 'Simulated User',
        customerEmail: 'customer@example.com',
        total: 2000.00,
      };

      const result = await sendQuoteEmailSimple(quoteData);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^simulated-/);
      expect(result.message).toContain('simulated');
      expect(mockSendMail).not.toHaveBeenCalled();

      // Restore SMTP config
      process.env.GOOGLE_CLIENT_EMAIL = originalEmail;
      process.env.GOOGLE_APP_PASSWORD = originalPassword;
    });

    test('should detect placeholder credentials and simulate', async () => {
      // Set placeholder credentials
      const originalEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const originalPassword = process.env.GOOGLE_APP_PASSWORD;

      process.env.GOOGLE_CLIENT_EMAIL = 'your-gmail@gmail.com';
      process.env.GOOGLE_APP_PASSWORD = 'your-app-specific-password';

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-placeholder',
        customerName: 'Placeholder User',
        customerEmail: 'customer@example.com',
        total: 1500.00,
      };

      const result = await sendQuoteEmailSimple(quoteData);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^simulated-/);
      expect(mockSendMail).not.toHaveBeenCalled();

      // Restore real config
      process.env.GOOGLE_CLIENT_EMAIL = originalEmail;
      process.env.GOOGLE_APP_PASSWORD = originalPassword;
    });
  });

  describe('Error Handling', () => {
    test('should throw error when customer email is missing', async () => {
      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-no-email',
        customerName: 'No Email User',
        customerEmail: '', // Empty email
        total: 1000.00,
      };

      await expect(sendQuoteEmailSimple(quoteData)).rejects.toThrow('Customer email is required');
    });

    test('should propagate SMTP errors', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-smtp-error',
        customerName: 'Error User',
        customerEmail: 'customer@example.com',
        total: 1000.00,
      };

      await expect(sendQuoteEmailSimple(quoteData)).rejects.toThrow('SMTP connection failed');
    });

    test('should handle email rejection by server', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'rejected-message',
        accepted: [],
        rejected: ['customer@example.com'],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-rejected',
        customerName: 'Rejected User',
        customerEmail: 'customer@example.com',
        total: 1000.00,
      };

      // Should not throw, but email was rejected
      const result = await sendQuoteEmailSimple(quoteData);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('rejected-message');
    });
  });

  describe('Email Headers and Metadata', () => {
    test('should set correct email headers', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-headers',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-headers',
        quoteNumber: 'Q-2024-007',
        customerName: 'Header User',
        customerEmail: 'customer@example.com',
        total: 3000.00,
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];

      expect(mailOptions.from).toContain('Signature QuoteCrawler');
      expect(mailOptions.from).toContain(process.env.GOOGLE_CLIENT_EMAIL);
      expect(mailOptions.to).toBe('customer@example.com');
      expect(mailOptions.subject).toBe('Quote Q-2024-007 - Signature Solar Equipment');
    });

    test('should use quote ID in subject when number is not provided', async () => {
      mockSendMail.mockResolvedValue({
        messageId: 'test-subject-id',
        accepted: ['customer@example.com'],
        rejected: [],
      });

      const quoteData: SimpleEmailData = {
        quoteId: 'test-quote-subject',
        customerName: 'Subject User',
        customerEmail: 'customer@example.com',
        total: 2000.00,
        // No quoteNumber
      };

      await sendQuoteEmailSimple(quoteData);

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.subject).toBe('Quote test-quote-subject - Signature Solar Equipment');
    });
  });
});
