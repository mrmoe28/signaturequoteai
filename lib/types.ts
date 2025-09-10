export type Vendor = 'SignatureSolar';

export type Product = {
  id: string;
  name: string;
  sku?: string;
  vendor: Vendor;
  category?: string;
  unit: 'ea'|'ft'|'pack';
  price: number;
  currency: 'USD';
  url?: string;
  lastUpdated: string; // ISO
};

export type QuoteItem = {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  extended: number;
  notes?: string;
};

export type Customer = {
  company?: string;
  name: string;
  email?: string;
  phone?: string;
  shipTo?: string;
};

export type Quote = {
  id: string;
  number?: string;
  createdAt: string;
  validUntil?: string;
  preparedBy?: string;
  leadTimeNote?: string;
  discount?: number; // order-level %
  shipping?: number;
  tax?: number;
  items: QuoteItem[];
  subtotal: number;
  total: number;
  terms?: string;
};