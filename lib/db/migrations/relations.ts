import { relations } from "drizzle-orm/relations";
import { quotes, quoteItems, products, priceSnapshots } from "./schema";

export const quoteItemsRelations = relations(quoteItems, ({one}) => ({
	quote: one(quotes, {
		fields: [quoteItems.quoteId],
		references: [quotes.id]
	}),
	product: one(products, {
		fields: [quoteItems.productId],
		references: [products.id]
	}),
}));

export const quotesRelations = relations(quotes, ({many}) => ({
	quoteItems: many(quoteItems),
}));

export const productsRelations = relations(products, ({many}) => ({
	quoteItems: many(quoteItems),
	priceSnapshots: many(priceSnapshots),
}));

export const priceSnapshotsRelations = relations(priceSnapshots, ({one}) => ({
	product: one(products, {
		fields: [priceSnapshots.productId],
		references: [products.id]
	}),
}));