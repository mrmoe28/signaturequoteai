-- Add primary image URL column to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "primary_image_url" text;

-- Backfill step is optional; leaving empty as images are new in crawler

