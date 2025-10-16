import { pgTable, text, timestamp, numeric, uuid, index, integer } from 'drizzle-orm/pg-core';

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
  isActive: text('is_active').default('true').notNull(),
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

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  company: text('company'),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  country: text('country').default('USA'),
  notes: text('notes'),
  isActive: text('is_active').default('true').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIndex: index('customers_email_idx').on(table.email),
  nameIndex: index('customers_name_idx').on(table.name),
  companyIndex: index('customers_company_idx').on(table.company),
  isActiveIndex: index('customers_is_active_idx').on(table.isActive),
}));

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: text('number'),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
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
  shipTo: text('ship_to'), // Ship-to address specific to this quote (optional override)

  // Status tracking
  status: text('status').default('draft').notNull(), // 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined'
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  acceptedAt: timestamp('accepted_at'),
  declinedAt: timestamp('declined_at'),

  // Payment tracking
  paymentStatus: text('payment_status').default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  paymentLink: text('payment_link'),
  paymentId: text('payment_id'),
  paidAt: timestamp('paid_at'),

  // Additional metadata
  pdfUrl: text('pdf_url'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  numberIndex: index('quotes_number_idx').on(table.number),
  createdAtIndex: index('quotes_created_at_idx').on(table.createdAt),
  customerIdIndex: index('quotes_customer_id_idx').on(table.customerId),
  statusIndex: index('quotes_status_idx').on(table.status),
  sentAtIndex: index('quotes_sent_at_idx').on(table.sentAt),
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
  imageUrl: text('image_url'),
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

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'), // For NextAuth compatibility
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'), // Changed to timestamp for NextAuth
  image: text('image'), // For NextAuth OAuth
  passwordHash: text('password_hash'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('user').notNull(), // 'admin' | 'user'
  isActive: text('is_active').default('true').notNull(),
  registrationIp: text('registration_ip'), // IP address used during registration
  lastLoginIp: text('last_login_ip'), // IP address of last login
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),

  // Square Integration fields
  squareMerchantId: text('square_merchant_id'),
  squareAccessToken: text('square_access_token'),
  squareRefreshToken: text('square_refresh_token'),
  squareTokenExpiresAt: timestamp('square_token_expires_at'),
  squareLocationId: text('square_location_id'),
  squareEnvironment: text('square_environment'), // Set by OAuth, not defaulted
  squareConnectedAt: timestamp('square_connected_at'),
  squareScopes: text('square_scopes'), // JSON array

  // Stripe Integration fields
  stripeAccountId: text('stripe_account_id'),
  stripeAccessToken: text('stripe_access_token'),
  stripeRefreshToken: text('stripe_refresh_token'),
  stripeTokenExpiresAt: timestamp('stripe_token_expires_at'),
  stripeConnectedAt: timestamp('stripe_connected_at'),
  stripeScopes: text('stripe_scopes'), // JSON array
}, (table) => ({
  emailIndex: index('users_email_idx').on(table.email),
  roleIndex: index('users_role_idx').on(table.role),
  isActiveIndex: index('users_is_active_idx').on(table.isActive),
  squareMerchantIdIndex: index('users_square_merchant_id_idx').on(table.squareMerchantId),
  stripeAccountIdIndex: index('users_stripe_account_id_idx').on(table.stripeAccountId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
}, (table) => ({
  userIdIndex: index('sessions_user_id_idx').on(table.userId),
  tokenIndex: index('sessions_token_idx').on(table.token),
  expiresIndex: index('sessions_expires_at_idx').on(table.expiresAt),
}));

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'oauth' | 'email' | 'credentials'
  provider: text('provider').notNull(), // 'google' | 'github' | etc
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'), // Unix timestamp for NextAuth
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  userIdIndex: index('accounts_user_id_idx').on(table.userId),
  providerIndex: index('accounts_provider_idx').on(table.provider),
  providerAccountIndex: index('accounts_provider_account_idx').on(table.provider, table.providerAccountId),
}));

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(), // email address
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  identifierTokenIndex: index('verification_tokens_identifier_token_idx').on(table.identifier, table.token),
  tokenIndex: index('verification_tokens_token_idx').on(table.token),
}));

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  used: text('used').default('false').notNull(),
}, (table) => ({
  userIdIndex: index('password_reset_tokens_user_id_idx').on(table.userId),
  tokenIndex: index('password_reset_tokens_token_idx').on(table.token),
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

// Subscription Plans
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // 'Free', 'Pro', 'Enterprise'
  slug: text('slug').notNull().unique(), // 'free', 'pro', 'enterprise'
  description: text('description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(), // Monthly price
  currency: text('currency').default('USD').notNull(),
  billingPeriod: text('billing_period').default('monthly').notNull(), // 'monthly' | 'yearly'
  trialDays: integer('trial_days').default(0),

  // Square-specific fields
  squareCatalogId: text('square_catalog_id'), // Square Subscription Plan ID
  squareVariationId: text('square_variation_id'), // Square Plan Variation ID

  // Features and Limits (stored as JSON)
  features: text('features'), // JSON array of feature names
  limits: text('limits'), // JSON object: { quotes: 10, products: 100, storage: '1GB' }

  // Status
  isActive: text('is_active').default('true').notNull(),
  isPopular: text('is_popular').default('false').notNull(),
  displayOrder: integer('display_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIndex: index('subscription_plans_slug_idx').on(table.slug),
  isActiveIndex: index('subscription_plans_active_idx').on(table.isActive),
  displayOrderIndex: index('subscription_plans_order_idx').on(table.displayOrder),
}));

// User Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => subscriptionPlans.id).notNull(),

  // Square Subscription Info
  squareSubscriptionId: text('square_subscription_id').unique(),
  squareCustomerId: text('square_customer_id'),
  squareLocationId: text('square_location_id'),

  // Subscription Status
  status: text('status').default('active').notNull(),
  // 'active' | 'canceled' | 'past_due' | 'paused' | 'pending' | 'trialing'

  // Billing Dates
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  canceledAt: timestamp('canceled_at'),
  cancelAt: timestamp('cancel_at'), // Scheduled cancellation date
  endedAt: timestamp('ended_at'),

  // Billing Info
  price: numeric('price', { precision: 12, scale: 2 }),
  currency: text('currency').default('USD'),
  billingPeriod: text('billing_period').default('monthly'),

  // Metadata
  cancelReason: text('cancel_reason'),
  cancelFeedback: text('cancel_feedback'),
  metadata: text('metadata'), // JSON for additional data

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIndex: index('subscriptions_user_id_idx').on(table.userId),
  planIdIndex: index('subscriptions_plan_id_idx').on(table.planId),
  statusIndex: index('subscriptions_status_idx').on(table.status),
  squareSubscriptionIndex: index('subscriptions_square_id_idx').on(table.squareSubscriptionId),
  periodEndIndex: index('subscriptions_period_end_idx').on(table.currentPeriodEnd),
}));

// Subscription Invoices
export const subscriptionInvoices = pgTable('subscription_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Square Invoice Info
  squareInvoiceId: text('square_invoice_id').unique(),
  squareOrderId: text('square_order_id'),
  squarePaymentId: text('square_payment_id'),

  // Invoice Details
  invoiceNumber: text('invoice_number'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  tax: numeric('tax', { precision: 12, scale: 2 }).default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),

  // Status
  status: text('status').default('pending').notNull(),
  // 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled'

  // Dates
  billingPeriodStart: timestamp('billing_period_start'),
  billingPeriodEnd: timestamp('billing_period_end'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  attemptedAt: timestamp('attempted_at'),

  // Payment Info
  paymentMethod: text('payment_method'), // 'card', 'ach', etc
  lastFour: text('last_four'), // Last 4 digits of payment method
  failureReason: text('failure_reason'),

  // Metadata
  metadata: text('metadata'), // JSON for additional data

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  subscriptionIdIndex: index('invoices_subscription_id_idx').on(table.subscriptionId),
  userIdIndex: index('invoices_user_id_idx').on(table.userId),
  statusIndex: index('invoices_status_idx').on(table.status),
  squareInvoiceIndex: index('invoices_square_id_idx').on(table.squareInvoiceId),
  dueDateIndex: index('invoices_due_date_idx').on(table.dueDate),
}));

// Subscription Usage Tracking (for metered features)
export const subscriptionUsage = pgTable('subscription_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Usage Metrics
  metric: text('metric').notNull(), // 'quotes', 'products', 'emails', 'storage', etc
  quantity: integer('quantity').default(0).notNull(),
  limit: integer('limit'), // null = unlimited

  // Period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  // Metadata
  metadata: text('metadata'), // JSON for additional tracking data

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  subscriptionIdIndex: index('usage_subscription_id_idx').on(table.subscriptionId),
  userIdIndex: index('usage_user_id_idx').on(table.userId),
  metricIndex: index('usage_metric_idx').on(table.metric),
  periodIndex: index('usage_period_idx').on(table.periodStart, table.periodEnd),
}));