CREATE TABLE "crawl_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"target_url" text,
	"products_processed" numeric(10, 0) DEFAULT '0',
	"products_updated" numeric(10, 0) DEFAULT '0',
	"error_message" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"captured_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"vendor" text DEFAULT 'SignatureSolar' NOT NULL,
	"category" text,
	"unit" text DEFAULT 'ea',
	"price" numeric(12, 2),
	"currency" text DEFAULT 'USD',
	"url" text,
	"last_updated" timestamp DEFAULT now(),
	"is_active" text DEFAULT 'true',
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"extended" numeric(12, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text,
	"created_at" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"prepared_by" text,
	"lead_time_note" text,
	"discount" numeric(12, 2) DEFAULT '0',
	"shipping" numeric(12, 2) DEFAULT '0',
	"tax" numeric(12, 2) DEFAULT '0',
	"subtotal" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"terms" text,
	"customer_company" text,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"customer_ship_to" text
);
--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crawl_jobs_type_idx" ON "crawl_jobs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "crawl_jobs_status_idx" ON "crawl_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crawl_jobs_started_at_idx" ON "crawl_jobs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "price_snapshots_product_id_idx" ON "price_snapshots" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "price_snapshots_captured_at_idx" ON "price_snapshots" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_vendor_idx" ON "products" USING btree ("vendor");--> statement-breakpoint
CREATE INDEX "products_last_updated_idx" ON "products" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "quote_items_quote_id_idx" ON "quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quote_items_product_id_idx" ON "quote_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "quotes_number_idx" ON "quotes" USING btree ("number");--> statement-breakpoint
CREATE INDEX "quotes_created_at_idx" ON "quotes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "quotes_customer_email_idx" ON "quotes" USING btree ("customer_email");