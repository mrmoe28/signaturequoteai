// This file contains the updated query functions that use the new customers table
// After migration, merge these changes into queries.ts

import { eq, desc, and, isNotNull, isNull, gte, like, sql as drizzleSql } from 'drizzle-orm';
import { db, sql } from './index';
import { products, priceSnapshots, quotes, quoteItems, crawlJobs, companySettings, customers } from './schema';
import type { Product, ProductFilter, Quote, CrawlJob, CompanySettings } from '../types';
import { createLogger } from '../logger';
import { findOrCreateCustomer, getCustomerById } from './customer-queries';

const logger = createLogger('db-queries');

/**
 * UPDATED: Create a new quote with customer relationship
 */
export async function createQuote(quote: Quote): Promise<Quote> {
  logger.info({ quote }, 'Creating quote with customer');
  
  // Validate required fields
  if (!quote.customer?.name) {
    throw new Error('Customer name is required');
  }
  if (quote.subtotal == null || isNaN(Number(quote.subtotal))) {
    throw new Error('Valid subtotal is required');
  }
  if (quote.total == null || isNaN(Number(quote.total))) {
    throw new Error('Valid total is required');
  }

  // Product validation (keep existing logic)
  const productIds = quote.items.map(item => item.productId);
  logger.info({ productIds }, `Checking ${productIds.length} products before quote creation`);
  
  const existingProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(and(
      isNotNull(products.id),
      eq(products.isActive, 'true')
    ));
  
  const existingProductIds = new Set(existingProducts.map(p => p.id));
  const missingIds = productIds.filter(id => !existingProductIds.has(id));
  
  if (missingIds.length > 0) {
    logger.error({ missingIds }, 'Some products not found');
    throw new Error(`Cannot create quote: Products not found: ${missingIds.join(', ')}`);
  }

  // Find or create customer
  const customerId = await findOrCreateCustomer(quote.customer);
  logger.info({ customerId }, 'Customer ID resolved');

  // Prepare numeric values
  const discountValue = quote.discount != null ? String(quote.discount) : '0';
  const shippingValue = quote.shipping != null ? String(quote.shipping) : '0';  
  const taxValue = quote.tax != null ? String(quote.tax) : '0';
  const subtotalValue = String(quote.subtotal || 0);
  const totalValue = String(quote.total || 0);

  // Insert quote with customer reference
  let insertedQuote;
  try {
    insertedQuote = await db
      .insert(quotes)
      .values({
        number: quote.number || null,
        customerId: customerId, // NEW: Use customer ID
        createdAt: new Date(),
        validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
        preparedBy: quote.preparedBy || null,
        leadTimeNote: quote.leadTimeNote || null,
        discount: discountValue,
        shipping: shippingValue,
        tax: taxValue,
        subtotal: subtotalValue,
        total: totalValue,
        terms: quote.terms || null,
        shipTo: quote.shipTo || null, // NEW: Ship-to is now quote-specific
        status: 'draft',
        sentAt: null,
        viewedAt: null,
        acceptedAt: null,
        declinedAt: null,
        paymentStatus: 'pending',
        paymentLink: null,
        paymentId: null,
        paidAt: null,
        pdfUrl: null,
        notes: null,
        updatedAt: new Date(),
        deletedAt: null,
      })
      .returning();
  } catch (insertError) {
    logger.error({ error: insertError, customerId }, 'Failed to insert quote');
    throw insertError;
  }

  if (!insertedQuote || insertedQuote.length === 0) {
    throw new Error('Failed to create quote: No quote returned');
  }

  const quoteId = insertedQuote[0].id;
  logger.info({ quoteId }, 'Quote created successfully');

  // Insert quote items
  const itemsToInsert = quote.items.map(item => ({
    quoteId,
    productId: item.productId,
    name: item.name,
    unitPrice: String(item.unitPrice || 0),
    quantity: String(item.quantity || 0),
    extended: String(item.extended || 0),
    notes: item.notes || null,
    imageUrl: item.imageUrl || null,
  }));

  await db.insert(quoteItems).values(itemsToInsert);
  logger.info({ quoteId, itemCount: itemsToInsert.length }, 'Quote items inserted');

  // Fetch and return the complete quote
  const createdQuote = await getQuoteById(quoteId);
  if (!createdQuote) {
    throw new Error('Failed to fetch created quote');
  }

  return createdQuote;
}

/**
 * UPDATED: Get quote by ID with customer data
 */
export async function getQuoteById(id: string): Promise<Quote | null> {
  const quote = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, id))
    .limit(1);

  if (!quote[0]) return null;

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id))
    .orderBy(quoteItems.id);

  // Fetch customer data
  const customer = await getCustomerById(quote[0].customerId);
  
  if (!customer) {
    logger.error({ quoteId: id, customerId: quote[0].customerId }, 'Customer not found for quote');
    throw new Error('Customer not found for quote');
  }

  return {
    id: quote[0].id,
    number: quote[0].number || undefined,
    customerId: quote[0].customerId,
    createdAt: quote[0].createdAt?.toISOString(),
    validUntil: quote[0].validUntil?.toISOString(),
    preparedBy: quote[0].preparedBy || undefined,
    leadTimeNote: quote[0].leadTimeNote || undefined,
    discount: quote[0].discount ? parseFloat(quote[0].discount) : undefined,
    shipping: quote[0].shipping ? parseFloat(quote[0].shipping) : undefined,
    tax: quote[0].tax ? parseFloat(quote[0].tax) : undefined,
    subtotal: parseFloat(quote[0].subtotal),
    total: parseFloat(quote[0].total),
    terms: quote[0].terms || undefined,
    shipTo: quote[0].shipTo || undefined,
    customer, // Populated customer object
    items: items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      unitPrice: parseFloat(item.unitPrice),
      quantity: parseFloat(item.quantity),
      extended: parseFloat(item.extended),
      notes: item.notes || undefined,
      imageUrl: item.imageUrl || undefined,
    })),
    status: quote[0].status as any,
    sentAt: quote[0].sentAt?.toISOString(),
    viewedAt: quote[0].viewedAt?.toISOString(),
    acceptedAt: quote[0].acceptedAt?.toISOString(),
    declinedAt: quote[0].declinedAt?.toISOString(),
    paymentStatus: quote[0].paymentStatus as any,
    paymentLink: quote[0].paymentLink || undefined,
    paymentId: quote[0].paymentId || undefined,
    paidAt: quote[0].paidAt?.toISOString(),
    pdfUrl: quote[0].pdfUrl || undefined,
    notes: quote[0].notes || undefined,
    updatedAt: quote[0].updatedAt?.toISOString(),
    deletedAt: quote[0].deletedAt?.toISOString(),
  };
}

/**
 * UPDATED: Transform DB quote to API quote with customer data
 */
async function transformQuoteWithCustomer(dbQuote: any): Promise<Quote> {
  const customer = await getCustomerById(dbQuote.customerId);
  
  if (!customer) {
    logger.error({ quoteId: dbQuote.id, customerId: dbQuote.customerId }, 'Customer not found');
    throw new Error('Customer not found for quote');
  }

  return {
    id: dbQuote.id,
    number: dbQuote.number || undefined,
    customerId: dbQuote.customerId,
    createdAt: dbQuote.createdAt?.toISOString(),
    validUntil: dbQuote.validUntil?.toISOString(),
    preparedBy: dbQuote.preparedBy || undefined,
    leadTimeNote: dbQuote.leadTimeNote || undefined,
    discount: dbQuote.discount ? parseFloat(dbQuote.discount) : undefined,
    shipping: dbQuote.shipping ? parseFloat(dbQuote.shipping) : undefined,
    tax: dbQuote.tax ? parseFloat(dbQuote.tax) : undefined,
    subtotal: parseFloat(dbQuote.subtotal),
    total: parseFloat(dbQuote.total),
    terms: dbQuote.terms || undefined,
    shipTo: dbQuote.shipTo || undefined,
    customer,
    items: [], // Items will be populated separately if needed
    status: dbQuote.status || undefined,
    sentAt: dbQuote.sentAt?.toISOString(),
    viewedAt: dbQuote.viewedAt?.toISOString(),
    acceptedAt: dbQuote.acceptedAt?.toISOString(),
    declinedAt: dbQuote.declinedAt?.toISOString(),
    paymentStatus: dbQuote.paymentStatus || undefined,
    paymentLink: dbQuote.paymentLink || undefined,
    paymentId: dbQuote.paymentId || undefined,
    paidAt: dbQuote.paidAt?.toISOString(),
    pdfUrl: dbQuote.pdfUrl || undefined,
    notes: dbQuote.notes || undefined,
    updatedAt: dbQuote.updatedAt?.toISOString(),
  };
}

/**
 * UPDATED: Get quotes with customer data (paginated)
 */
export async function getQuotes(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [quoteList, totalCount] = await Promise.all([
    db
      .select()
      .from(quotes)
      .orderBy(desc(quotes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(quotes)
      .then(result => result[0]?.count || 0)
  ]);

  // Transform all quotes with customer data
  const items = await Promise.all(
    quoteList.map(quote => transformQuoteWithCustomer(quote))
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * UPDATED: Update quote - handle customer updates
 */
export async function updateQuote(id: string, updates: Partial<Quote>): Promise<Quote> {
  logger.info({ quoteId: id, updates }, 'Updating quote');

  // If customer data is being updated, find or create customer
  let customerId: string | undefined;
  if (updates.customer) {
    customerId = await findOrCreateCustomer(updates.customer);
    logger.info({ customerId }, 'Customer updated for quote');
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (customerId) updateData.customerId = customerId;
  if (updates.number !== undefined) updateData.number = updates.number;
  if (updates.validUntil !== undefined) updateData.validUntil = updates.validUntil ? new Date(updates.validUntil) : null;
  if (updates.preparedBy !== undefined) updateData.preparedBy = updates.preparedBy || null;
  if (updates.leadTimeNote !== undefined) updateData.leadTimeNote = updates.leadTimeNote || null;
  if (updates.discount !== undefined) updateData.discount = String(updates.discount);
  if (updates.shipping !== undefined) updateData.shipping = String(updates.shipping);
  if (updates.tax !== undefined) updateData.tax = String(updates.tax);
  if (updates.subtotal !== undefined) updateData.subtotal = String(updates.subtotal);
  if (updates.total !== undefined) updateData.total = String(updates.total);
  if (updates.terms !== undefined) updateData.terms = updates.terms || null;
  if (updates.shipTo !== undefined) updateData.shipTo = updates.shipTo || null;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.paymentStatus !== undefined) updateData.paymentStatus = updates.paymentStatus;
  if (updates.paymentLink !== undefined) updateData.paymentLink = updates.paymentLink || null;
  if (updates.paymentId !== undefined) updateData.paymentId = updates.paymentId || null;
  if (updates.pdfUrl !== undefined) updateData.pdfUrl = updates.pdfUrl || null;
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;

  await db
    .update(quotes)
    .set(updateData)
    .where(eq(quotes.id, id));

  // If items are being updated, handle them
  if (updates.items) {
    // Delete existing items
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    
    // Insert new items
    if (updates.items.length > 0) {
      const itemsToInsert = updates.items.map(item => ({
        quoteId: id,
        productId: item.productId,
        name: item.name,
        unitPrice: String(item.unitPrice || 0),
        quantity: String(item.quantity || 0),
        extended: String(item.extended || 0),
        notes: item.notes || null,
        imageUrl: item.imageUrl || null,
      }));

      await db.insert(quoteItems).values(itemsToInsert);
    }
  }

  const updatedQuote = await getQuoteById(id);
  if (!updatedQuote) {
    throw new Error('Failed to fetch updated quote');
  }

  logger.info({ quoteId: id }, 'Quote updated successfully');
  return updatedQuote;
}


