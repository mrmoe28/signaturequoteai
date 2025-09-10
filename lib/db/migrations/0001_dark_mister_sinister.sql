CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"company_logo" text,
	"company_address" text,
	"company_city" text,
	"company_state" text,
	"company_zip" text,
	"company_phone" text,
	"company_email" text,
	"company_website" text,
	"tax_id" text,
	"default_terms" text,
	"default_lead_time" text,
	"quote_prefix" text DEFAULT 'Q',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_image_url" text;--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "image_url" text;--> statement-breakpoint
CREATE INDEX "company_settings_name_idx" ON "company_settings" USING btree ("company_name");