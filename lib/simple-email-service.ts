import { sendQuoteEmailGmail, GmailQuoteData } from './gmail-service';

export interface SimpleEmailData {
  quoteId: string;
  quoteNumber?: string | null;
  customerName: string;
  customerEmail: string;
  customerCompany?: string | null;
  total: number;
  validUntil?: string | null;
  pdfBuffer?: Buffer;
  items?: Array<{ name: string; sku?: string | null; quantity: number; unitPrice: number; extended: number; }>; 
}

export async function sendQuoteEmailSimple(data: SimpleEmailData) {
  if (!data.customerEmail) {
    throw new Error('Customer email is required');
  }

  // Use Gmail API when credentials are configured
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
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

  // Otherwise simulate a send so flows can proceed in non-configured environments
  await new Promise(resolve => setTimeout(resolve, 300));
  const messageId = `simulated-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    success: true,
    messageId,
    message: 'Simulated email send (configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY for Gmail API)'
  };
}
