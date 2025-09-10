import { eq, desc, and, isNotNull, gte, like, sql } from 'drizzle-orm';
import { db } from './index';
import { products, priceSnapshots, quotes, quoteItems, crawlJobs } from './schema';
import type { Product, ProductFilter, Quote, CrawlJob } from '../types';
import { createLogger } from '../logger';

const logger = createLogger('db-queries');

// Product Queries
export async function getProducts(filter: ProductFilter = {}, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  
  const conditions = [];
  
  if (filter.category) {
    conditions.push(eq(products.category, filter.category));
  }
  
  if (filter.vendor) {
    conditions.push(eq(products.vendor, filter.vendor));
  }
  
  if (filter.sku) {
    conditions.push(like(products.sku, `%${filter.sku}%`));
  }
  
  if (filter.updated_since) {
    conditions.push(gte(products.lastUpdated, new Date(filter.updated_since)));
  }
  
  if (filter.active_only) {
    conditions.push(eq(products.isActive, 'true'));
  }

  const baseQuery = db.select().from(products);
  const query = conditions.length > 0 
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  const [items, totalCount] = await Promise.all([
    query
      .orderBy(desc(products.lastUpdated))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .then(result => result[0]?.count || 0)
  ]);

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

export async function getProductById(id: string) {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function upsertProduct(product: Omit<Product, 'lastUpdated'>) {
  const now = new Date();
  
  // Check if product exists
  const existing = await getProductById(product.id);
  
  if (existing) {
    // Update existing product
    const updated = await db
      .update(products)
      .set({
        name: product.name,
        sku: product.sku,
        vendor: product.vendor,
        category: product.category,
        unit: product.unit,
        price: product.price.toString(),
        currency: product.currency,
        url: product.url,
        primaryImageUrl: product.primaryImageUrl || null,
        isActive: product.isActive ? 'true' : 'false',
        lastUpdated: now,
      })
      .where(eq(products.id, product.id))
      .returning();
    
    // Create price snapshot if price changed
    if (existing.price !== product.price.toString()) {
      await createPriceSnapshot(product.id, product.price);
    }
    
    return updated[0];
  } else {
    // Insert new product
    const inserted = await db
      .insert(products)
      .values({
        id: product.id,
        name: product.name,
        sku: product.sku,
        vendor: product.vendor,
        category: product.category,
        unit: product.unit,
        price: product.price.toString(),
        currency: product.currency,
        url: product.url,
        primaryImageUrl: product.primaryImageUrl || null,
        isActive: product.isActive ? 'true' : 'false',
        lastUpdated: now,
      })
      .returning();
    
    // Create initial price snapshot
    await createPriceSnapshot(product.id, product.price);
    
    return inserted[0];
  }
}

export async function createPriceSnapshot(productId: string, price: number) {
  return db
    .insert(priceSnapshots)
    .values({
      productId,
      price: price.toString(),
      currency: 'USD',
    })
    .returning();
}

export async function getPriceHistory(productId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  return db
    .select()
    .from(priceSnapshots)
    .where(and(
      eq(priceSnapshots.productId, productId),
      gte(priceSnapshots.capturedAt, since)
    ))
    .orderBy(desc(priceSnapshots.capturedAt));
}

// Quote Queries
export async function createQuote(quote: Omit<Quote, 'id' | 'createdAt'>) {
  const now = new Date();
  
  const insertedQuote = await db
    .insert(quotes)
    .values({
      number: quote.number,
      validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
      preparedBy: quote.preparedBy,
      leadTimeNote: quote.leadTimeNote,
      discount: quote.discount?.toString() || '0',
      shipping: quote.shipping?.toString() || '0',
      tax: quote.tax?.toString() || '0',
      subtotal: quote.subtotal.toString(),
      total: quote.total.toString(),
      terms: quote.terms,
      customerCompany: quote.customer.company,
      customerName: quote.customer.name,
      customerEmail: quote.customer.email,
      customerPhone: quote.customer.phone,
      customerShipTo: quote.customer.shipTo,
    })
    .returning();

  const quoteId = insertedQuote[0].id;

  // Insert quote items
  if (quote.items.length > 0) {
    await db
      .insert(quoteItems)
      .values(
        quote.items.map(item => ({
          quoteId,
          productId: item.productId,
          name: item.name,
          unitPrice: item.unitPrice.toString(),
          quantity: item.quantity.toString(),
          extended: item.extended.toString(),
          notes: item.notes,
        }))
      );
  }

  return getQuoteById(quoteId);
}

export async function getQuoteById(id: string) {
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

  return {
    ...quote[0],
    items: items.map(item => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice),
      quantity: parseFloat(item.quantity),
      extended: parseFloat(item.extended),
    })),
    customer: {
      company: quote[0].customerCompany || undefined,
      name: quote[0].customerName,
      email: quote[0].customerEmail || undefined,
      phone: quote[0].customerPhone || undefined,
      shipTo: quote[0].customerShipTo || undefined,
    },
  };
}

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
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .then(result => result[0]?.count || 0)
  ]);

  return {
    items: quoteList,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

// Crawl Job Queries
export async function createCrawlJob(
  type: CrawlJob['type'],
  targetUrl?: string,
  metadata?: Record<string, any>
) {
  const inserted = await db
    .insert(crawlJobs)
    .values({
      type,
      status: 'pending',
      targetUrl,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .returning();

  return inserted[0];
}

export async function updateCrawlJob(
  id: string,
  updates: Partial<Pick<CrawlJob, 'status' | 'productsProcessed' | 'productsUpdated' | 'errorMessage'>>
) {
  const updateData: any = {};
  
  if (updates.status) {
    updateData.status = updates.status;
    
    if (updates.status === 'running' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    
    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completedAt = new Date();
    }
  }
  
  if (updates.productsProcessed !== undefined) {
    updateData.productsProcessed = updates.productsProcessed.toString();
  }
  
  if (updates.productsUpdated !== undefined) {
    updateData.productsUpdated = updates.productsUpdated.toString();
  }
  
  if (updates.errorMessage !== undefined) {
    updateData.errorMessage = updates.errorMessage;
  }

  const updated = await db
    .update(crawlJobs)
    .set(updateData)
    .where(eq(crawlJobs.id, id))
    .returning();

  return updated[0];
}

export async function getCrawlJobs(status?: CrawlJob['status'], limit = 50) {
  const baseQuery = db
    .select()
    .from(crawlJobs)
    .orderBy(desc(crawlJobs.startedAt))
    .limit(limit);

  if (status) {
    return baseQuery.where(eq(crawlJobs.status, status));
  }

  return baseQuery;
}

export async function getActiveCrawlJob() {
  const active = await db
    .select()
    .from(crawlJobs)
    .where(eq(crawlJobs.status, 'running'))
    .limit(1);

  return active[0] || null;
}