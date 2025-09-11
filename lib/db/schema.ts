import { pgTable, text, timestamp, numeric, uuid, index, foreignKey, boolean, integer } from 'drizzle-orm/pg-core';

// Authentication tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: text('password'), // For credentials provider
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Stripe integration fields
  stripeCustomerId: text('stripe_customer_id').unique(),
  subscriptionStatus: text('subscription_status').default('inactive'), // 'active' | 'inactive' | 'past_due' | 'canceled'
  subscriptionId: text('subscription_id'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  
  // Usage tracking for paywall
  quotesUsed: numeric('quotes_used', { precision: 10, scale: 0 }).default('0'),
  quotesLimit: numeric('quotes_limit', { precision: 10, scale: 0 }).default('3'), // Free tier limit
}, (table) => ({
  emailIndex: index('users_email_idx').on(table.email),
  stripeCustomerIdIndex: index('users_stripe_customer_id_idx').on(table.stripeCustomerId),
  subscriptionStatusIndex: index('users_subscription_status_idx').on(table.subscriptionStatus),
}));

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  userIdIndex: index('accounts_user_id_idx').on(table.userId),
  providerIndex: index('accounts_provider_idx').on(table.provider, table.providerAccountId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  sessionTokenIndex: index('sessions_session_token_idx').on(table.sessionToken),
  userIdIndex: index('sessions_user_id_idx').on(table.userId),
}));

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierTokenIndex: index('verification_tokens_identifier_token_idx').on(table.identifier, table.token),
}));

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
  primaryImageUrl: text('primary_image_url'),
  
  // Enhanced product data
  description: text('description'),
  shortDescription: text('short_description'),
  images: text('images'), // JSON array of image URLs
  specifications: text('specifications'), // JSON object of specs
  features: text('features'), // JSON array of features
  dimensions: text('dimensions'),
  weight: text('weight'),
  warranty: text('warranty'),
  powerRating: text('power_rating'),
  voltage: text('voltage'),
  efficiency: text('efficiency'),
  certifications: text('certifications'), // JSON array
  inStock: text('in_stock').default('true'),
  availability: text('availability'),
  stockQuantity: numeric('stock_quantity', { precision: 10, scale: 0 }),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  categories: text('categories'), // JSON array
  tags: text('tags'), // JSON array
  reviews: text('reviews'), // JSON object with review data
  
  lastUpdated: timestamp('last_updated').defaultNow(),
  isActive: text('is_active').default('true'),
}, (table) => ({
  skuIndex: index('products_sku_idx').on(table.sku),
  categoryIndex: index('products_category_idx').on(table.category),
  vendorIndex: index('products_vendor_idx').on(table.vendor),
  lastUpdatedIndex: index('products_last_updated_idx').on(table.lastUpdated),
  inStockIndex: index('products_in_stock_idx').on(table.inStock),
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
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  userIdIndex: index('quotes_user_id_idx').on(table.userId),
  numberIndex: index('quotes_number_idx').on(table.number),
  createdAtIndex: index('quotes_created_at_idx').on(table.createdAt),
  customerEmailIndex: index('quotes_customer_email_idx').on(table.customerEmail),
}));

export const quoteItems = pgTable("quote_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quoteId: uuid("quote_id").notNull(),
	productId: text("product_id").notNull(),
	name: text().notNull(),
	unitPrice: numeric("unit_price", { precision: 12, scale:  2 }).notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	extended: numeric({ precision: 12, scale:  2 }).notNull(),
	notes: text(),
	imageUrl: text("image_url"),
}, (table) => [
	index("quote_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("quote_items_quote_id_idx").using("btree", table.quoteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.quoteId],
			foreignColumns: [quotes.id],
			name: "quote_items_quote_id_quotes_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "quote_items_product_id_products_id_fk"
		}),
]);

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

export const companySettings = pgTable('company_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: text('company_name').notNull(),
  companyLogo: text('company_logo'),
  companyAddress: text('company_address'),
  companyCity: text('company_city'),
  companyState: text('company_state'),
  companyZip: text('company_zip'),
  companyPhone: text('company_phone'),
  companyEmail: text('company_email'),
  companyWebsite: text('company_website'),
  taxId: text('tax_id'),
  defaultTerms: text('default_terms'),
  defaultLeadTime: text('default_lead_time'),
  quotePrefix: text('quote_prefix').default('Q'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  companyNameIndex: index('company_settings_name_idx').on(table.companyName),
}));