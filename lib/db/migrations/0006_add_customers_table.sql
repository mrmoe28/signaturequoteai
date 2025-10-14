-- Migration: Add customers table and update quotes
-- This migration creates the customers table and adds customer_id to quotes
-- Old customer columns remain for data migration, to be dropped later

-- Create customers table
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text DEFAULT 'USA',
	"notes" text,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create indexes on customers table
CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers" USING btree ("email");
CREATE INDEX IF NOT EXISTS "customers_name_idx" ON "customers" USING btree ("name");
CREATE INDEX IF NOT EXISTS "customers_company_idx" ON "customers" USING btree ("company");
CREATE INDEX IF NOT EXISTS "customers_is_active_idx" ON "customers" USING btree ("is_active");

-- Add customer_id column to quotes (nullable for now, during migration)
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "customer_id" uuid;

-- Add ship_to column to quotes (quote-specific shipping address)
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "ship_to" text;

-- Create index on customer_id in quotes
CREATE INDEX IF NOT EXISTS "quotes_customer_id_idx" ON "quotes" USING btree ("customer_id");

-- Add foreign key constraint (after data migration, this should be made NOT NULL)
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" 
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE restrict ON UPDATE cascade;

-- Note: Old customer columns (customer_company, customer_name, customer_email, customer_phone, customer_ship_to)
-- are kept temporarily for data migration. They will be dropped after migration is complete.
-- To drop them later, run:
-- ALTER TABLE quotes DROP COLUMN customer_company;
-- ALTER TABLE quotes DROP COLUMN customer_name;
-- ALTER TABLE quotes DROP COLUMN customer_email;
-- ALTER TABLE quotes DROP COLUMN customer_phone;
-- ALTER TABLE quotes DROP COLUMN customer_ship_to;
-- DROP INDEX IF EXISTS quotes_customer_email_idx;


