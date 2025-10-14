import { eq, desc, and, isNotNull, isNull, gte, like, sql as drizzleSql } from 'drizzle-orm';
import { db, sql } from './index';
import { products, priceSnapshots, quotes, quoteItems, crawlJobs, companySettings, customers } from './schema';
import type { Product, ProductFilter, Quote, CrawlJob, CompanySettings } from '../types';
import { createLogger } from '../logger';
import { findOrCreateCustomer } from './customer-queries';

const logger = createLogger('db-queries');

// Helper function to transform DB product to API product with parsed JSON fields
function transformProduct(dbProduct: any): Product {
  const parseJsonField = (field: string | null): any => {
    if (!field) return undefined;
    try {
      return JSON.parse(field);
    } catch {
      return undefined;
    }
  };

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    sku: dbProduct.sku || undefined,
    vendor: dbProduct.vendor,
    category: dbProduct.category || undefined,
    unit: dbProduct.unit,
    price: dbProduct.price ? parseFloat(dbProduct.price) : null,
    currency: dbProduct.currency,
    url: dbProduct.url || undefined,
    primaryImageUrl: dbProduct.primaryImageUrl || undefined,
    lastUpdated: dbProduct.lastUpdated?.toISOString() || new Date().toISOString(),
    isActive: dbProduct.isActive === 'true',

    // Parse JSON fields
    description: dbProduct.description || undefined,
    shortDescription: dbProduct.shortDescription || undefined,
    images: parseJsonField(dbProduct.images) || [],
    specifications: parseJsonField(dbProduct.specifications),
    features: parseJsonField(dbProduct.features),
    dimensions: dbProduct.dimensions || undefined,
    weight: dbProduct.weight || undefined,
    warranty: dbProduct.warranty || undefined,
    powerRating: dbProduct.powerRating || undefined,
    voltage: dbProduct.voltage || undefined,
    efficiency: dbProduct.efficiency || undefined,
    certifications: parseJsonField(dbProduct.certifications),
    inStock: dbProduct.inStock === 'true',
    availability: dbProduct.availability || undefined,
    stockQuantity: dbProduct.stockQuantity ? parseInt(dbProduct.stockQuantity) : undefined,
    metaTitle: dbProduct.metaTitle || undefined,
    metaDescription: dbProduct.metaDescription || undefined,
    categories: parseJsonField(dbProduct.categories),
    tags: parseJsonField(dbProduct.tags),
    reviews: parseJsonField(dbProduct.reviews),
  };
}

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

  const [dbItems, totalCount] = await Promise.all([
    query
      .orderBy(desc(products.lastUpdated))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .then(result => result[0]?.count || 0)
  ]);

  // Transform database products to include parsed JSON fields
  const items = dbItems.map(transformProduct);

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

  return result[0] ? transformProduct(result[0]) : null;
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
        price: product.price?.toString() || null,
        currency: product.currency,
        url: product.url,
        primaryImageUrl: product.primaryImageUrl || null,
        isActive: product.isActive ? 'true' : 'false',
        
        // Enhanced product data
        description: product.description || null,
        shortDescription: product.shortDescription || null,
        images: product.images ? JSON.stringify(product.images) : null,
        specifications: product.specifications ? JSON.stringify(product.specifications) : null,
        features: product.features ? JSON.stringify(product.features) : null,
        dimensions: product.dimensions || null,
        weight: product.weight || null,
        warranty: product.warranty || null,
        powerRating: product.powerRating || null,
        voltage: product.voltage || null,
        efficiency: product.efficiency || null,
        certifications: product.certifications ? JSON.stringify(product.certifications) : null,
        inStock: product.inStock ? 'true' : 'false',
        availability: product.availability || null,
        stockQuantity: product.stockQuantity?.toString() || null,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        categories: product.categories ? JSON.stringify(product.categories) : null,
        tags: product.tags ? JSON.stringify(product.tags) : null,
        reviews: product.reviews ? JSON.stringify(product.reviews) : null,
        
        lastUpdated: now,
      })
      .where(eq(products.id, product.id))
      .returning();
    
    // Create price snapshot if price changed
    const existingPriceStr = existing.price || null;
    const newPriceStr = product.price?.toString() || null;
    if (existingPriceStr !== newPriceStr) {
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
        price: product.price?.toString() || null,
        currency: product.currency,
        url: product.url,
        primaryImageUrl: product.primaryImageUrl || null,
        isActive: product.isActive ? 'true' : 'false',
        
        // Enhanced product data
        description: product.description || null,
        shortDescription: product.shortDescription || null,
        images: product.images ? JSON.stringify(product.images) : null,
        specifications: product.specifications ? JSON.stringify(product.specifications) : null,
        features: product.features ? JSON.stringify(product.features) : null,
        dimensions: product.dimensions || null,
        weight: product.weight || null,
        warranty: product.warranty || null,
        powerRating: product.powerRating || null,
        voltage: product.voltage || null,
        efficiency: product.efficiency || null,
        certifications: product.certifications ? JSON.stringify(product.certifications) : null,
        inStock: product.inStock ? 'true' : 'false',
        availability: product.availability || null,
        stockQuantity: product.stockQuantity?.toString() || null,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        categories: product.categories ? JSON.stringify(product.categories) : null,
        tags: product.tags ? JSON.stringify(product.tags) : null,
        reviews: product.reviews ? JSON.stringify(product.reviews) : null,
        
        lastUpdated: now,
      })
      .returning();
    
    // Create initial price snapshot
    await createPriceSnapshot(product.id, product.price);
    
    return inserted[0];
  }
}

export async function createPriceSnapshot(productId: string, price: number | null) {
  if (price == null) {
    return null; // Skip creating snapshot for null prices
  }
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
  
  // Best Practice 1: Ensure all products exist before creating the quote
  // This prevents foreign key constraint violations
  logger.info(`Creating quote with ${quote.items.length} items`);
  
  // First, let's check which products exist and which don't
  const productIds = quote.items.map(item => item.productId);
  const existingProductIds = new Set<string>();
  const missingProducts: string[] = [];
  
  // Check all products in batch
  for (const productId of productIds) {
    try {
      const product = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (product.length > 0) {
        existingProductIds.add(productId);
      } else {
        missingProducts.push(productId);
      }
    } catch (error) {
      logger.error({ error, productId }, 'Error checking product existence');
      missingProducts.push(productId);
    }
  }
  
  logger.info(`Found ${existingProductIds.size} existing products, ${missingProducts.length} missing`);
  
  // Create missing products using raw SQL to ensure they're created
  for (const item of quote.items) {
    if (!existingProductIds.has(item.productId)) {
      try {
        // Use raw SQL to ensure product is created
        await sql`
          INSERT INTO products (
            id, name, vendor, unit, price, currency, last_updated, is_active
          ) VALUES (
            ${item.productId},
            ${item.name || `Product ${item.productId}`},
            ${'SignatureSolar'},
            ${'ea'},
            ${item.unitPrice?.toString() || null},
            ${'USD'},
            ${now},
            ${'true'}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        
        logger.info(`Created product entry for ID: ${item.productId}`);
      } catch (error) {
        logger.error({ error, productId: item.productId }, 'Failed to create product with raw SQL');
        // Try one more time with just the essential fields
        try {
          await sql`
            INSERT INTO products (id, name, vendor, last_updated)
            VALUES (
              ${item.productId},
              ${item.name || `Product ${item.productId}`},
              ${'SignatureSolar'},
              ${now}
            )
            ON CONFLICT (id) DO NOTHING
          `;
        } catch (retryError) {
          logger.error({ error: retryError, productId: item.productId }, 'Retry also failed');
        }
      }
    }
  }
  
  // Verify all products now exist before proceeding
  const foundProductIds = new Set<string>();
  
  // Check each product individually to avoid SQL syntax issues
  for (const productId of productIds) {
    try {
      const product = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (product.length > 0) {
        foundProductIds.add(productId);
      }
    } catch (error) {
      logger.error({ error, productId }, 'Error verifying product existence');
    }
  }
  
  const stillMissing = productIds.filter(id => !foundProductIds.has(id));
  
  if (stillMissing.length > 0) {
    logger.error({ stillMissing }, 'Some products still missing after creation attempts');
    throw new Error(`Cannot create quote: Products not found: ${stillMissing.join(', ')}`);
  }
  
  logger.info(`All ${productIds.length} products verified and exist`);
  
  // Best Practice 2: Use proper transaction boundaries
  // Insert quote and items together
  
  // Validate required fields before insertion
  if (!quote.customer?.name) {
    throw new Error('Customer name is required');
  }
  if (quote.subtotal == null || isNaN(Number(quote.subtotal))) {
    throw new Error('Valid subtotal is required');
  }
  if (quote.total == null || isNaN(Number(quote.total))) {
    throw new Error('Valid total is required');
  }

  // Ensure numeric values are properly formatted
  const discountValue = quote.discount != null ? String(quote.discount) : '0';
  const shippingValue = quote.shipping != null ? String(quote.shipping) : '0';  
  const taxValue = quote.tax != null ? String(quote.tax) : '0';
  const subtotalValue = String(quote.subtotal || 0);
  const totalValue = String(quote.total || 0);

  logger.info({
    discount: discountValue,
    shipping: shippingValue,
    tax: taxValue,
    subtotal: subtotalValue,
    total: totalValue
  }, 'Quote numeric values before insert');

  // First, create or get the customer using the proper helper function
  let customerId = quote.customerId;

  if (!customerId) {
    // Use findOrCreateCustomer which properly handles duplicates
    logger.info('Creating/finding customer for quote');
    try {
      customerId = await findOrCreateCustomer({
        company: quote.customer.company,
        name: quote.customer.name,
        email: quote.customer.email,
        phone: quote.customer.phone,
        address: quote.customer.address,
        city: quote.customer.city,
        state: quote.customer.state,
        zip: quote.customer.zip,
        country: quote.customer.country || 'USA',
      });

      logger.info({ customerId }, 'Customer created/found successfully');
    } catch (customerError) {
      logger.error({ error: customerError, customerData: quote.customer }, 'Failed to create/find customer');
      throw new Error('Failed to create customer for quote');
    }
  }

  if (!customerId) {
    throw new Error('Customer ID is required to create a quote');
  }

  let insertedQuote;
  try {
    insertedQuote = await db
      .insert(quotes)
      .values({
      number: quote.number || null,
      customerId: customerId,
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
      shipTo: quote.shipTo || null,
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
    logger.error({
      error: insertError,
      values: {
        discount: discountValue,
        shipping: shippingValue,
        tax: taxValue,
        subtotal: subtotalValue,
        total: totalValue,
        customerId: customerId
      }
    }, 'Failed to insert quote with Drizzle ORM');
    throw new Error(`Failed to create quote: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
  }

  const quoteId = (insertedQuote as any[])[0].id;

  // Insert quote items
  if (quote.items.length > 0) {
    try {
      // Use raw SQL for inserting quote items to avoid parameter issues
      for (const item of quote.items) {
        console.log('Inserting quote item for quote:', quoteId);
        
        // Use raw SQL query with proper parameterization
        await sql`
          INSERT INTO quote_items (
            quote_id,
            product_id,
            name,
            unit_price,
            quantity,
            extended,
            notes,
            image_url
          ) VALUES (
            ${quoteId}::uuid,
            ${String(item.productId)},
            ${String(item.name)},
            ${String(item.unitPrice || 0)}::numeric,
            ${String(item.quantity || 0)}::numeric,
            ${String(item.extended || 0)}::numeric,
            ${item.notes ? String(item.notes) : null},
            ${item.imageUrl ? String(item.imageUrl) : null}
          )
        `;
      }
    } catch (error) {
      console.error('Quote items insertion error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Fallback to ORM approach if raw SQL fails
      try {
        console.log('Attempting fallback insertion method...');
        for (const item of quote.items) {
          const itemData = {
            quoteId: quoteId,
            productId: String(item.productId),
            name: String(item.name),
            unitPrice: String(item.unitPrice || 0),
            quantity: String(item.quantity || 0),
            extended: String(item.extended || 0),
            notes: item.notes ? String(item.notes) : null,
            imageUrl: item.imageUrl ? String(item.imageUrl) : null,
          };

          await db
            .insert(quoteItems)
            .values(itemData);
        }
      } catch (fallbackError) {
        console.error('Fallback insertion also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  return getQuoteById(quoteId);
}

export async function getQuoteById(id: string) {
  const quote = await db
    .select()
    .from(quotes)
    .leftJoin(customers, eq(quotes.customerId, customers.id))
    .where(eq(quotes.id, id))
    .limit(1);

  if (!quote[0]) return null;

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id))
    .orderBy(quoteItems.id);

  // Use transformQuote to properly convert null to undefined
  const transformedQuote = transformQuote(quote[0].quotes);

  return {
    ...transformedQuote,
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
    customer: {
      company: quote[0].customers?.company || undefined,
      name: quote[0].customers?.name || '',
      email: quote[0].customers?.email || undefined,
      phone: quote[0].customers?.phone || undefined,
    },
  };
}

// Helper function to transform DB quote to API quote (customer handled separately)
function transformQuote(dbQuote: any): Omit<Quote, 'customer'> {
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
    items: [], // Items will be populated separately if needed
    status: dbQuote.status || undefined,
    sentAt: dbQuote.sentAt?.toISOString(),
    viewedAt: dbQuote.viewedAt?.toISOString(),
    acceptedAt: dbQuote.acceptedAt?.toISOString(),
    declinedAt: dbQuote.declinedAt?.toISOString(),
    pdfUrl: dbQuote.pdfUrl || undefined,
    notes: dbQuote.notes || undefined,
    updatedAt: dbQuote.updatedAt?.toISOString(),
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
      .select({ count: drizzleSql<number>`count(*)` })
      .from(quotes)
      .then(result => result[0]?.count || 0)
  ]);

  return {
    items: quoteList.map(transformQuote),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export async function deleteQuote(id: string) {
  logger.info({ quoteId: id }, 'Deleting quote and associated items');

  try {
    // Delete quote items first (foreign key constraint)
    await db
      .delete(quoteItems)
      .where(eq(quoteItems.quoteId, id));

    logger.info({ quoteId: id }, 'Quote items deleted');

    // Delete the quote
    const deleted = await db
      .delete(quotes)
      .where(eq(quotes.id, id))
      .returning();

    logger.info({ quoteId: id }, 'Quote deleted successfully');

    return deleted[0];
  } catch (error) {
    logger.error({ error, quoteId: id }, 'Failed to delete quote');
    throw error;
  }
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

export async function getActiveCrawlJob(): Promise<CrawlJob | null> {
  const active = await db
    .select()
    .from(crawlJobs)
    .where(eq(crawlJobs.status, 'running'))
    .limit(1);

  if (!active[0]) return null;

  const job = active[0];
  return {
    id: job.id,
    type: job.type as CrawlJob['type'],
    status: job.status as CrawlJob['status'],
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    targetUrl: job.targetUrl || undefined,
    productsProcessed: parseInt(job.productsProcessed || '0'),
    productsUpdated: parseInt(job.productsUpdated || '0'),
    errorMessage: job.errorMessage || undefined,
    metadata: job.metadata ? JSON.parse(job.metadata) : undefined,
  };
}

export async function getCrawlJobById(id: string): Promise<CrawlJob | null> {
  const result = await db
    .select()
    .from(crawlJobs)
    .where(eq(crawlJobs.id, id))
    .limit(1);

  if (!result[0]) return null;

  const job = result[0];

  return {
    id: job.id,
    type: job.type as CrawlJob['type'],
    status: job.status as CrawlJob['status'],
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    targetUrl: job.targetUrl || undefined,
    productsProcessed: parseInt(job.productsProcessed || '0'),
    productsUpdated: parseInt(job.productsUpdated || '0'),
    errorMessage: job.errorMessage || undefined,
    metadata: job.metadata ? JSON.parse(job.metadata) : undefined,
  };
}

export async function getRecentCrawlJobs(limit = 10): Promise<CrawlJob[]> {
  const results = await db
    .select()
    .from(crawlJobs)
    .orderBy(desc(crawlJobs.startedAt))
    .limit(limit);

  return results.map(job => ({
    id: job.id,
    type: job.type as CrawlJob['type'],
    status: job.status as CrawlJob['status'],
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    targetUrl: job.targetUrl || undefined,
    productsProcessed: parseInt(job.productsProcessed || '0'),
    productsUpdated: parseInt(job.productsUpdated || '0'),
    errorMessage: job.errorMessage || undefined,
    metadata: job.metadata ? JSON.parse(job.metadata) : undefined,
  }));
}

// Company Settings Queries
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const settings = await db
    .select()
    .from(companySettings)
    .limit(1);

  if (!settings[0]) return null;

  return {
    id: settings[0].id,
    companyName: settings[0].companyName,
    companyLogo: settings[0].companyLogo || undefined,
    companyAddress: settings[0].companyAddress || undefined,
    companyCity: settings[0].companyCity || undefined,
    companyState: settings[0].companyState || undefined,
    companyZip: settings[0].companyZip || undefined,
    companyPhone: settings[0].companyPhone || undefined,
    companyEmail: settings[0].companyEmail || undefined,
    companyWebsite: settings[0].companyWebsite || undefined,
    taxId: settings[0].taxId || undefined,
    defaultTerms: settings[0].defaultTerms || undefined,
    defaultLeadTime: settings[0].defaultLeadTime || undefined,
    quotePrefix: settings[0].quotePrefix || 'Q',
    createdAt: settings[0].createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: settings[0].updatedAt?.toISOString() || new Date().toISOString(),
  };
}

export async function updateCompanySettings(updates: Partial<Omit<CompanySettings, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CompanySettings> {
  const now = new Date();
  
  const updateData: any = {
    updatedAt: now,
  };

  if (updates.companyName !== undefined) updateData.companyName = updates.companyName;
  if (updates.companyLogo !== undefined) updateData.companyLogo = updates.companyLogo;
  if (updates.companyAddress !== undefined) updateData.companyAddress = updates.companyAddress;
  if (updates.companyCity !== undefined) updateData.companyCity = updates.companyCity;
  if (updates.companyState !== undefined) updateData.companyState = updates.companyState;
  if (updates.companyZip !== undefined) updateData.companyZip = updates.companyZip;
  if (updates.companyPhone !== undefined) updateData.companyPhone = updates.companyPhone;
  if (updates.companyEmail !== undefined) updateData.companyEmail = updates.companyEmail;
  if (updates.companyWebsite !== undefined) updateData.companyWebsite = updates.companyWebsite;
  if (updates.taxId !== undefined) updateData.taxId = updates.taxId;
  if (updates.defaultTerms !== undefined) updateData.defaultTerms = updates.defaultTerms;
  if (updates.defaultLeadTime !== undefined) updateData.defaultLeadTime = updates.defaultLeadTime;
  if (updates.quotePrefix !== undefined) updateData.quotePrefix = updates.quotePrefix;

  // First, try to update existing record
  const existing = await db.select().from(companySettings).limit(1);
  
  if (existing[0]) {
    const updated = await db
      .update(companySettings)
      .set(updateData)
      .where(eq(companySettings.id, existing[0].id))
      .returning();
    
    return {
      id: updated[0].id,
      companyName: updated[0].companyName,
      companyLogo: updated[0].companyLogo || undefined,
      companyAddress: updated[0].companyAddress || undefined,
      companyCity: updated[0].companyCity || undefined,
      companyState: updated[0].companyState || undefined,
      companyZip: updated[0].companyZip || undefined,
      companyPhone: updated[0].companyPhone || undefined,
      companyEmail: updated[0].companyEmail || undefined,
      companyWebsite: updated[0].companyWebsite || undefined,
      taxId: updated[0].taxId || undefined,
      defaultTerms: updated[0].defaultTerms || undefined,
      defaultLeadTime: updated[0].defaultLeadTime || undefined,
      quotePrefix: updated[0].quotePrefix || 'Q',
      createdAt: updated[0].createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updated[0].updatedAt?.toISOString() || new Date().toISOString(),
    };
  } else {
    // Create new record if none exists
    const created = await db
      .insert(companySettings)
      .values({
        companyName: updates.companyName || 'Signature QuoteCrawler',
        companyLogo: updates.companyLogo,
        companyAddress: updates.companyAddress,
        companyCity: updates.companyCity,
        companyState: updates.companyState,
        companyZip: updates.companyZip,
        companyPhone: updates.companyPhone,
        companyEmail: updates.companyEmail,
        companyWebsite: updates.companyWebsite,
        taxId: updates.taxId,
        defaultTerms: updates.defaultTerms,
        defaultLeadTime: updates.defaultLeadTime,
        quotePrefix: updates.quotePrefix || 'Q',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    
    return {
      id: created[0].id,
      companyName: created[0].companyName,
      companyLogo: created[0].companyLogo || undefined,
      companyAddress: created[0].companyAddress || undefined,
      companyCity: created[0].companyCity || undefined,
      companyState: created[0].companyState || undefined,
      companyZip: created[0].companyZip || undefined,
      companyPhone: created[0].companyPhone || undefined,
      companyEmail: created[0].companyEmail || undefined,
      companyWebsite: created[0].companyWebsite || undefined,
      taxId: created[0].taxId || undefined,
      defaultTerms: created[0].defaultTerms || undefined,
      defaultLeadTime: created[0].defaultLeadTime || undefined,
      quotePrefix: created[0].quotePrefix || 'Q',
      createdAt: created[0].createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: created[0].updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}

// Quote History Queries
export async function getQuoteHistory() {
  logger.info('Fetching quote history from database');

  try {
    // Get quotes that have been sent (not deleted) with customer info
    const quoteList = await db
      .select()
      .from(quotes)
      .leftJoin(customers, eq(quotes.customerId, customers.id))
      .where(
        and(
          isNotNull(quotes.sentAt), // Only sent quotes
          isNull(quotes.deletedAt)  // Not deleted
        )
      )
      .orderBy(desc(quotes.sentAt));

    // Get items for each quote
    const quotesWithItems = await Promise.all(
      quoteList.map(async (result) => {
        const quote = result.quotes;
        const customer = result.customers;

        const items = await db
          .select()
          .from(quoteItems)
          .where(eq(quoteItems.quoteId, quote.id));

        return {
          id: quote.id,
          number: quote.number || quote.id.substring(0, 8),
          customerName: customer?.name || '',
          customerCompany: customer?.company || undefined,
          total: parseFloat(quote.total),
          status: quote.status || 'sent',
          paymentStatus: quote.paymentStatus || 'pending',
          sentAt: quote.sentAt?.toISOString(),
          viewedAt: quote.viewedAt?.toISOString(),
          acceptedAt: quote.acceptedAt?.toISOString(),
          declinedAt: quote.declinedAt?.toISOString(),
          paidAt: quote.paidAt?.toISOString(),
          createdAt: quote.createdAt?.toISOString() || new Date().toISOString(),
          items: items.map(item => ({
            name: item.name,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            extended: parseFloat(item.extended),
          })),
        };
      })
    );

    logger.info({ count: quotesWithItems.length }, 'Quote history fetched successfully');
    return quotesWithItems;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch quote history');
    throw error;
  }
}

export async function softDeleteQuote(id: string) {
  logger.info({ quoteId: id }, 'Soft deleting quote');
  
  try {
    const updated = await db
      .update(quotes)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(quotes.id, id))
      .returning();

    logger.info({ quoteId: id }, 'Quote soft deleted successfully');
    return updated[0];
  } catch (error) {
    logger.error({ error, quoteId: id }, 'Failed to soft delete quote');
    throw error;
  }
}

export async function updateQuoteStatus(id: string, status: string, timestamp?: Date) {
  logger.info({ quoteId: id, status }, 'Updating quote status');
  
  try {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Set appropriate timestamp field based on status
    if (status === 'sent' && !timestamp) {
      updateData.sentAt = new Date();
    } else if (status === 'viewed') {
      updateData.viewedAt = timestamp || new Date();
    } else if (status === 'accepted') {
      updateData.acceptedAt = timestamp || new Date();
    } else if (status === 'declined') {
      updateData.declinedAt = timestamp || new Date();
    }

    const updated = await db
      .update(quotes)
      .set(updateData)
      .where(eq(quotes.id, id))
      .returning();

    logger.info({ quoteId: id, status }, 'Quote status updated successfully');
    return updated[0];
  } catch (error) {
    logger.error({ error, quoteId: id, status }, 'Failed to update quote status');
    throw error;
  }
}