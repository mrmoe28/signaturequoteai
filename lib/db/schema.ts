import { pgTable, text, timestamp, numeric, uuid, index } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  vendor: text('vendor').default('SignatureSolar').notNull(),
  category: text('category'),
  unit: text('unit').default('ea'),
  price: numeric('price', { precision: 12, scale: 2 }),
  currency: text('currency').default('USD'),
  url: text('url'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  isActive: text('is_active').default('true'),
}, (table) => ({
  skuIndex: index('products_sku_idx').on(table.sku),
  categoryIndex: index('products_category_idx').on(table.category),
  vendorIndex: index('products_vendor_idx').on(table.vendor),
  lastUpdatedIndex: index('products_last_updated_idx').on(table.lastUpdated),
}));

export const priceSnapshots = pgTable('price_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: text('product_id').references(() => products.id),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  capturedAt: timestamp('captured_at').defaultNow(),
}, (table) => ({
  productIdIndex: index('price_snapshots_product_id_idx').on(table.productId),
  capturedAtIndex: index('price_snapshots_captured_at_idx').on(table.capturedAt),
}));

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: text('number'),
  createdAt: timestamp('created_at').defaultNow(),
  validUntil: timestamp('valid_until'),
  preparedBy: text('prepared_by'),
  leadTimeNote: text('lead_time_note'),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),
  shipping: numeric('shipping', { precision: 12, scale: 2 }).default('0'),
  tax: numeric('tax', { precision: 12, scale: 2 }).default('0'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  terms: text('terms'),
  customerCompany: text('customer_company'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  customerShipTo: text('customer_ship_to'),
}, (table) => ({
  numberIndex: index('quotes_number_idx').on(table.number),
  createdAtIndex: index('quotes_created_at_idx').on(table.createdAt),
  customerEmailIndex: index('quotes_customer_email_idx').on(table.customerEmail),
}));

export const quoteItems = pgTable('quote_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteId: uuid('quote_id').references(() => quotes.id).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  name: text('name').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  extended: numeric('extended', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
}, (table) => ({
  quoteIdIndex: index('quote_items_quote_id_idx').on(table.quoteId),
  productIdIndex: index('quote_items_product_id_idx').on(table.productId),
}));

export const crawlJobs = pgTable('crawl_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // 'full' | 'category' | 'product'
  status: text('status').default('pending').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  targetUrl: text('target_url'),
  productsProcessed: numeric('products_processed', { precision: 10, scale: 0 }).default('0'),
  productsUpdated: numeric('products_updated', { precision: 10, scale: 0 }).default('0'),
  errorMessage: text('error_message'),
  metadata: text('metadata'), // JSON string for additional data
}, (table) => ({
  typeIndex: index('crawl_jobs_type_idx').on(table.type),
  statusIndex: index('crawl_jobs_status_idx').on(table.status),
  startedAtIndex: index('crawl_jobs_started_at_idx').on(table.startedAt),
}));