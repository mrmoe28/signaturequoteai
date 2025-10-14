import { createLogger } from './logger';
import { sendQuoteEmailGmail, GmailQuoteData } from './gmail-service';
import { sendQuoteEmailSimple, SimpleEmailData } from './simple-email-service';

const logger = createLogger('email');

export interface EmailQuoteData {
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

export async function sendQuoteEmail(data: EmailQuoteData) {
  try {
    // Try SMTP first (more reliable), fallback to Gmail API if it fails
    try {
      const smtpData: SimpleEmailData = {
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerCompany: data.customerCompany,
        total: data.total,
        validUntil: data.validUntil,
        pdfBuffer: data.pdfBuffer,
        items: data.items,
      };

      return await sendQuoteEmailSimple(smtpData);
    } catch (smtpError) {
      logger.warn({ error: smtpError, quoteId: data.quoteId }, 'SMTP failed, trying Gmail API fallback');

      // Fallback to Gmail API
      const gmailData: GmailQuoteData = {
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerCompany: data.customerCompany,
        total: data.total,
        validUntil: data.validUntil,
        pdfBuffer: data.pdfBuffer,
        items: data.items,
      };

      return await sendQuoteEmailGmail(gmailData);
    }

  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Error sending quote email');
    throw error;
  }
}

