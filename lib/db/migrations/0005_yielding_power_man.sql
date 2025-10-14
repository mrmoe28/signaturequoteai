ALTER TABLE "quotes" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "viewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "declined_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_sent_at_idx" ON "quotes" USING btree ("sent_at");