import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { Quote } from './types';
import QuotePDFDocument from './pdf-generator-react';
import { createLogger } from './logger';

const logger = createLogger('pdf-generator-stable');

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
}

export async function generateQuotePDFStable(quote: Quote, companySettings: CompanySettings | null = null): Promise<Buffer> {
  try {
    logger.info({ quoteId: quote.id }, 'Starting PDF generation with React-PDF');

    // Create the PDF document
    const pdfDocument = <QuotePDFDocument quote={quote} companySettings={companySettings} />;

    // Render to stream
    const stream = await renderToStream(pdfDocument);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        logger.info({ quoteId: quote.id, size: pdfBuffer.length }, 'PDF generated successfully with React-PDF');
        resolve(pdfBuffer);
      });
      
      stream.on('error', (error) => {
        logger.error({ error, quoteId: quote.id }, 'Failed to generate PDF with React-PDF');
        reject(error);
      });
    });

  } catch (error) {
    logger.error({ error, quoteId: quote.id }, 'Failed to generate PDF');
    throw error;
  }
}

// Fallback function for simple text-based PDF if React-PDF fails
export function generateSimpleTextPDF(quote: Quote): Buffer {
  const content = `
QUOTE #${quote.id}
Date: ${new Date(quote.createdAt).toLocaleDateString()}

Customer: ${quote.customer.name}
Email: ${quote.customer.email}
${quote.customer.phone ? `Phone: ${quote.customer.phone}` : ''}

ITEMS:
${quote.lineItems.map(item => 
  `${item.description} - Qty: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.extended.toFixed(2)}`
).join('\n')}

Subtotal: $${quote.lineItems.reduce((sum, item) => sum + item.extended, 0).toFixed(2)}
Tax (8%): $${(quote.lineItems.reduce((sum, item) => sum + item.extended, 0) * 0.08).toFixed(2)}
Total: $${(quote.lineItems.reduce((sum, item) => sum + item.extended, 0) * 1.08).toFixed(2)}

Thank you for your business!
  `.trim();

  // Create a simple PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
endobj

4 0 obj
<<
/Length ${content.length + 200}
>>
stream
BT
/F1 12 Tf
72 720 Td
(${content.replace(/[()\\]/g, '\\$&')}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${300 + content.length}
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}

// Get company settings (you might want to implement this based on your database)
async function getCompanySettings(): Promise<CompanySettings | null> {
  // This is a placeholder - implement based on your actual company settings storage
  return {
    name: 'Signature Solar Solutions',
    address: '123 Solar Street, Renewable City, RC 12345',
    phone: '(555) 123-SOLAR',
    email: 'quotes@signaturesolar.com',
    website: 'https://signaturesolar.com',
  };
}

// Main export function that tries React-PDF first, falls back to simple PDF
// Type for database quote (with null values)
type DatabaseQuote = {
  id: string;
  number: string | null;
  createdAt: Date | string | null;
  validUntil: Date | string | null;
  preparedBy: string | null;
  leadTimeNote: string | null;
  discount: string | number | null;
  shipping: string | number | null;
  tax: string | number | null;
  subtotal: string | number;
  total: string | number;
  terms: string | null;
  customerCompany: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerShipTo: string | null;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    unitPrice: string | number;
    quantity: string | number;
    extended: string | number;
    notes: string | null;
    imageUrl: string | null | undefined;
  }>;
};

// Normalize database quote to Quote type
function normalizeQuote(dbQuote: DatabaseQuote): Quote {
  return {
    id: dbQuote.id,
    number: dbQuote.number || undefined,
    createdAt: dbQuote.createdAt ? (typeof dbQuote.createdAt === 'string' ? dbQuote.createdAt : dbQuote.createdAt.toISOString()) : new Date().toISOString(),
    validUntil: dbQuote.validUntil ? (typeof dbQuote.validUntil === 'string' ? dbQuote.validUntil : dbQuote.validUntil.toISOString()) : undefined,
    preparedBy: dbQuote.preparedBy || undefined,
    leadTimeNote: dbQuote.leadTimeNote || undefined,
    discount: typeof dbQuote.discount === 'string' ? parseFloat(dbQuote.discount) : (dbQuote.discount || 0),
    shipping: typeof dbQuote.shipping === 'string' ? parseFloat(dbQuote.shipping) : (dbQuote.shipping || 0),
    tax: typeof dbQuote.tax === 'string' ? parseFloat(dbQuote.tax) : (dbQuote.tax || 0),
    subtotal: typeof dbQuote.subtotal === 'string' ? parseFloat(dbQuote.subtotal) : dbQuote.subtotal,
    total: typeof dbQuote.total === 'string' ? parseFloat(dbQuote.total) : dbQuote.total,
    terms: dbQuote.terms || undefined,
    customer: {
      company: dbQuote.customerCompany || undefined,
      name: dbQuote.customerName,
      email: dbQuote.customerEmail || undefined,
      phone: dbQuote.customerPhone || undefined,
      shipTo: dbQuote.customerShipTo || undefined,
    },
    items: dbQuote.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
      quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
      extended: typeof item.extended === 'string' ? parseFloat(item.extended) : item.extended,
      notes: item.notes || undefined,
      imageUrl: item.imageUrl || undefined,
    })),
  };
}

export async function generateQuotePDF(quote: Quote | DatabaseQuote): Promise<Buffer> {
  try {
    const companySettings = await getCompanySettings();
    const normalizedQuote = 'items' in quote ? normalizeQuote(quote as DatabaseQuote) : quote as Quote;
    return await generateQuotePDFStable(normalizedQuote, companySettings);
  } catch (error) {
    logger.warn({ error, quoteId: quote.id }, 'React-PDF failed, falling back to simple PDF');
    const normalizedQuote = 'items' in quote ? normalizeQuote(quote as DatabaseQuote) : quote as Quote;
    return generateSimpleTextPDF(normalizedQuote);
  }
}
