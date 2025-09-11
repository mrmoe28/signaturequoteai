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
}

export async function sendQuoteEmail(data: EmailQuoteData) {
  try {
    // Try Gmail API first, fallback to SMTP if it fails
    try {
      const gmailData: GmailQuoteData = {
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerCompany: data.customerCompany,
        total: data.total,
        validUntil: data.validUntil,
        pdfBuffer: data.pdfBuffer,
      };

      return await sendQuoteEmailGmail(gmailData);
    } catch (gmailError) {
      logger.warn({ error: gmailError, quoteId: data.quoteId }, 'Gmail API failed, trying SMTP fallback');
      
      // Fallback to SMTP
      const smtpData: SimpleEmailData = {
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerCompany: data.customerCompany,
        total: data.total,
        validUntil: data.validUntil,
        pdfBuffer: data.pdfBuffer,
      };

      return await sendQuoteEmailSimple(smtpData);
    }

  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Error sending quote email');
    throw error;
  }
}

