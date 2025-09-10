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
}

export async function sendQuoteEmail(data: EmailQuoteData) {
  try {
    // Convert to Gmail format and send via Gmail API
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

  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Error sending quote email');
    throw error;
  }
}

