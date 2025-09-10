ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specifications" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "features" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "warranty" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "power_rating" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "voltage" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "efficiency" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "certifications" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "in_stock" text DEFAULT 'true';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "availability" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_quantity" numeric(10, 0);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "categories" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviews" text;--> statement-breakpoint
CREATE INDEX "products_in_stock_idx" ON "products" USING btree ("in_stock");