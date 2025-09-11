import { createLogger } from './logger';
import { sendQuoteEmailGmail, GmailQuoteData } from './gmail-service';

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
  items?: Array<{ name: string; sku?: string | null; quantity: number; unitPrice: number; extended: number; }>
}

export async function sendQuoteEmail(data: EmailQuoteData) {
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
      items: data.items,
    };

    return await sendQuoteEmailGmail(gmailData);
  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Error sending quote email');
    throw error;
  }
}

