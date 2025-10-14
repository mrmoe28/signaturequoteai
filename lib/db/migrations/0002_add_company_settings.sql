-- Add company settings table
CREATE TABLE IF NOT EXISTS "company_settings" (
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

-- Create index for company name
CREATE INDEX IF NOT EXISTS "company_settings_name_idx" ON "company_settings" ("company_name");

-- Insert default company settings
INSERT INTO "company_settings" (
  "company_name",
  "company_logo",
  "company_address",
  "company_city",
  "company_state",
  "company_zip",
  "company_phone",
  "company_email",
  "company_website",
  "default_terms",
  "default_lead_time",
  "quote_prefix"
) VALUES (
  'Signature QuoteCrawler',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'quotes@signaturequotecrawler.com',
  NULL,
  'Payment terms: Net 30 days. Prices valid for 30 days from quote date.',
  'Typical lead time 1–2 weeks',
  'Q'
) ON CONFLICT DO NOTHING;
