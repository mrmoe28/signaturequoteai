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
    // Use SMTP only (Gmail OAuth API requires domain-wide delegation which we don't have)
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

  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Failed to send quote email via SMTP');

    // Provide helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send email: ${errorMessage}. Please check Gmail SMTP credentials (GOOGLE_CLIENT_EMAIL and GOOGLE_APP_PASSWORD).`);
  }
}

