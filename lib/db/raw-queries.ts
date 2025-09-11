import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Quote {
  id: string;
  number: string | null;
  createdAt: string;
  validUntil: string | null;
  preparedBy: string | null;
  leadTimeNote: string | null;
  discount: number;
  shipping: number;
  tax: number;
  subtotal: number;
  total: number;
  terms: string | null;
  customerCompany: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerShipTo: string | null;
  items: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  extended: number;
  notes: string | null;
  imageUrl: string | null;
}

export interface CreateQuoteData {
  customer: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    shipTo?: string;
  };
  items: {
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    notes?: string;
    imageUrl?: string;
  }[];
  preparedBy?: string;
  leadTimeNote?: string;
  discount?: number;
  shipping?: number;
  tax?: number;
  terms?: string;
  validUntil?: string;
}

export async function createQuote(data: CreateQuoteData): Promise<Quote> {
  const quoteId = crypto.randomUUID();
  const quoteNumber = `Q-${Date.now()}`;
  
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const discount = data.discount || 0;
  const shipping = data.shipping || 0;
  const tax = data.tax || 0;
  const total = subtotal - discount + shipping + tax;

  // Insert quote
  await sql`
    INSERT INTO quotes (
      id, number, created_at, valid_until, prepared_by, lead_time_note,
      discount, shipping, tax, subtotal, total, terms,
      customer_company, customer_name, customer_email, customer_phone, customer_ship_to
    ) VALUES (
      ${quoteId}, ${quoteNumber}, NOW(), ${data.validUntil || null}, ${data.preparedBy || null}, ${data.leadTimeNote || null},
      ${discount}, ${shipping}, ${tax}, ${subtotal}, ${total}, ${data.terms || null},
      ${data.customer.company || null}, ${data.customer.name}, ${data.customer.email || null}, 
      ${data.customer.phone || null}, ${data.customer.shipTo || null}
    )
  `;

  // Insert quote items
  if (data.items.length > 0) {
    for (const item of data.items) {
      const itemId = crypto.randomUUID();
      const extended = item.unitPrice * item.quantity;
      
      await sql`
        INSERT INTO quote_items (
          id, quote_id, product_id, name, unit_price, quantity, extended, notes, image_url
        ) VALUES (
          ${itemId}, ${quoteId}, ${item.productId}, ${item.name}, ${item.unitPrice}, 
          ${item.quantity}, ${extended}, ${item.notes || null}, ${item.imageUrl || null}
        )
      `;
    }
  }

  return getQuoteById(quoteId);
}

export async function getQuoteById(id: string): Promise<Quote> {
  // Get quote
  const quoteResult = await sql`
    SELECT 
      id, number, created_at, valid_until, prepared_by, lead_time_note,
      discount, shipping, tax, subtotal, total, terms,
      customer_company, customer_name, customer_email, customer_phone, customer_ship_to
    FROM quotes 
    WHERE id = ${id}
  `;

  if (quoteResult.length === 0) {
    throw new Error('Quote not found');
  }

  const quote = quoteResult[0];

  // Get quote items
  const itemsResult = await sql`
    SELECT 
      id, quote_id, product_id, name, unit_price, quantity, extended, notes, image_url
    FROM quote_items 
    WHERE quote_id = ${id}
    ORDER BY id
  `;

  return {
    id: quote.id,
    number: quote.number,
    createdAt: quote.created_at,
    validUntil: quote.valid_until,
    preparedBy: quote.prepared_by,
    leadTimeNote: quote.lead_time_note,
    discount: parseFloat(quote.discount),
    shipping: parseFloat(quote.shipping),
    tax: parseFloat(quote.tax),
    subtotal: parseFloat(quote.subtotal),
    total: parseFloat(quote.total),
    terms: quote.terms,
    customerCompany: quote.customer_company,
    customerName: quote.customer_name,
    customerEmail: quote.customer_email,
    customerPhone: quote.customer_phone,
    customerShipTo: quote.customer_ship_to,
    items: itemsResult.map(item => ({
      id: item.id,
      quoteId: item.quote_id,
      productId: item.product_id,
      name: item.name,
      unitPrice: parseFloat(item.unit_price),
      quantity: parseFloat(item.quantity),
      extended: parseFloat(item.extended),
      notes: item.notes,
      imageUrl: item.image_url,
    })),
  };
}

export async function getAllQuotes(): Promise<Quote[]> {
  const quotesResult = await sql`
    SELECT 
      id, number, created_at, valid_until, prepared_by, lead_time_note,
      discount, shipping, tax, subtotal, total, terms,
      customer_company, customer_name, customer_email, customer_phone, customer_ship_to
    FROM quotes 
    ORDER BY created_at DESC
  `;

  const quotes = [];
  for (const quote of quotesResult) {
    const itemsResult = await sql`
      SELECT 
        id, quote_id, product_id, name, unit_price, quantity, extended, notes, image_url
      FROM quote_items 
      WHERE quote_id = ${quote.id}
      ORDER BY id
    `;

    quotes.push({
      id: quote.id,
      number: quote.number,
      createdAt: quote.created_at,
      validUntil: quote.valid_until,
      preparedBy: quote.prepared_by,
      leadTimeNote: quote.lead_time_note,
      discount: parseFloat(quote.discount),
      shipping: parseFloat(quote.shipping),
      tax: parseFloat(quote.tax),
      subtotal: parseFloat(quote.subtotal),
      total: parseFloat(quote.total),
      terms: quote.terms,
      customerCompany: quote.customer_company,
      customerName: quote.customer_name,
      customerEmail: quote.customer_email,
      customerPhone: quote.customer_phone,
      customerShipTo: quote.customer_ship_to,
      items: itemsResult.map(item => ({
        id: item.id,
        quoteId: item.quote_id,
        productId: item.product_id,
        name: item.name,
        unitPrice: parseFloat(item.unit_price),
        quantity: parseFloat(item.quantity),
        extended: parseFloat(item.extended),
        notes: item.notes,
        imageUrl: item.image_url,
      })),
    });
  }

  return quotes;
}
