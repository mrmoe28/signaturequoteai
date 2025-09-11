import { pgTable, index, uuid, text, timestamp, numeric, foreignKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const crawlJobs = pgTable("crawl_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: text().notNull(),
	status: text().default('pending').notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	targetUrl: text("target_url"),
	productsProcessed: numeric("products_processed", { precision: 10, scale:  0 }).default('0'),
	productsUpdated: numeric("products_updated", { precision: 10, scale:  0 }).default('0'),
	errorMessage: text("error_message"),
	metadata: text(),
}, (table) => [
	index("crawl_jobs_started_at_idx").using("btree", table.startedAt.asc().nullsLast().op("timestamp_ops")),
	index("crawl_jobs_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("crawl_jobs_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

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

export const quotes = pgTable("quotes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	number: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	validUntil: timestamp("valid_until", { mode: 'string' }),
	preparedBy: text("prepared_by"),
	leadTimeNote: text("lead_time_note"),
	discount: numeric({ precision: 12, scale:  2 }).default('0'),
	shipping: numeric({ precision: 12, scale:  2 }).default('0'),
	tax: numeric({ precision: 12, scale:  2 }).default('0'),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
	total: numeric({ precision: 12, scale:  2 }).notNull(),
	terms: text(),
	customerCompany: text("customer_company"),
	customerName: text("customer_name").notNull(),
	customerEmail: text("customer_email"),
	customerPhone: text("customer_phone"),
	customerShipTo: text("customer_ship_to"),
}, (table) => [
	index("quotes_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("quotes_customer_email_idx").using("btree", table.customerEmail.asc().nullsLast().op("text_ops")),
	index("quotes_number_idx").using("btree", table.number.asc().nullsLast().op("text_ops")),
]);

export const priceSnapshots = pgTable("price_snapshots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: text("product_id"),
	price: numeric({ precision: 12, scale:  2 }).notNull(),
	currency: text().default('USD'),
	capturedAt: timestamp("captured_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("price_snapshots_captured_at_idx").using("btree", table.capturedAt.asc().nullsLast().op("timestamp_ops")),
	index("price_snapshots_product_id_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "price_snapshots_product_id_products_id_fk"
		}),
]);

export const companySettings = pgTable("company_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyName: text("company_name").notNull(),
	companyLogo: text("company_logo"),
	companyAddress: text("company_address"),
	companyCity: text("company_city"),
	companyState: text("company_state"),
	companyZip: text("company_zip"),
	companyPhone: text("company_phone"),
	companyEmail: text("company_email"),
	companyWebsite: text("company_website"),
	taxId: text("tax_id"),
	defaultTerms: text("default_terms"),
	defaultLeadTime: text("default_lead_time"),
	quotePrefix: text("quote_prefix").default('Q'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("company_settings_name_idx").using("btree", table.companyName.asc().nullsLast().op("text_ops")),
]);

export const products = pgTable("products", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	sku: text(),
	vendor: text().default('SignatureSolar').notNull(),
	category: text(),
	unit: text().default('ea'),
	price: numeric({ precision: 12, scale:  2 }),
	currency: text().default('USD'),
	url: text(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	isActive: text("is_active").default('true'),
	primaryImageUrl: text("primary_image_url"),
	description: text(),
	shortDescription: text("short_description"),
	images: text(),
	specifications: text(),
	features: text(),
	dimensions: text(),
	weight: text(),
	warranty: text(),
	powerRating: text("power_rating"),
	voltage: text(),
	efficiency: text(),
	certifications: text(),
	inStock: text("in_stock").default('true'),
	availability: text(),
	stockQuantity: numeric("stock_quantity", { precision: 10, scale:  0 }),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	categories: text(),
	tags: text(),
	reviews: text(),
}, (table) => [
	index("products_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("products_in_stock_idx").using("btree", table.inStock.asc().nullsLast().op("text_ops")),
	index("products_last_updated_idx").using("btree", table.lastUpdated.asc().nullsLast().op("timestamp_ops")),
	index("products_sku_idx").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	index("products_vendor_idx").using("btree", table.vendor.asc().nullsLast().op("text_ops")),
	unique("products_sku_unique").on(table.sku),
]);
