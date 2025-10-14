import { db } from './index';
import { customers } from './schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import type { Customer } from '../types';
import { createLogger } from '../logger';

const logger = createLogger('customer-queries');

/**
 * Find or create a customer based on provided data
 * This helps avoid duplicates while allowing new customer creation
 */
export async function findOrCreateCustomer(customerData: Customer): Promise<string> {
  try {
    // Try to find existing customer by email (if provided) or exact name match
    let existingCustomer;
    
    if (customerData.email) {
      // Try to find by email first (most reliable)
      const byEmail = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.email, customerData.email),
            eq(customers.isActive, 'true')
          )
        )
        .limit(1);
      
      if (byEmail.length > 0) {
        existingCustomer = byEmail[0];
        logger.info({ customerId: existingCustomer.id, email: customerData.email }, 'Found existing customer by email');
      }
    }
    
    // If not found by email, try by name and company combination
    if (!existingCustomer && customerData.company) {
      const byNameAndCompany = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.name, customerData.name),
            eq(customers.company, customerData.company),
            eq(customers.isActive, 'true')
          )
        )
        .limit(1);
      
      if (byNameAndCompany.length > 0) {
        existingCustomer = byNameAndCompany[0];
        logger.info({ customerId: existingCustomer.id, name: customerData.name, company: customerData.company }, 'Found existing customer by name and company');
      }
    }
    
    // If customer exists, optionally update their information
    if (existingCustomer) {
      // Update customer info if new data is provided
      const hasUpdates = 
        (customerData.phone && customerData.phone !== existingCustomer.phone) ||
        (customerData.address && customerData.address !== existingCustomer.address) ||
        (customerData.city && customerData.city !== existingCustomer.city) ||
        (customerData.state && customerData.state !== existingCustomer.state) ||
        (customerData.zip && customerData.zip !== existingCustomer.zip);
      
      if (hasUpdates) {
        await db
          .update(customers)
          .set({
            phone: customerData.phone || existingCustomer.phone,
            address: customerData.address || existingCustomer.address,
            city: customerData.city || existingCustomer.city,
            state: customerData.state || existingCustomer.state,
            zip: customerData.zip || existingCustomer.zip,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, existingCustomer.id));
        
        logger.info({ customerId: existingCustomer.id }, 'Updated existing customer information');
      }
      
      return existingCustomer.id;
    }
    
    // Create new customer
    const newCustomer = await db
      .insert(customers)
      .values({
        company: customerData.company || null,
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        city: customerData.city || null,
        state: customerData.state || null,
        zip: customerData.zip || null,
        country: customerData.country || 'USA',
        notes: customerData.notes || null,
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    logger.info({ customerId: newCustomer[0].id, name: customerData.name }, 'Created new customer');
    return newCustomer[0].id;
    
  } catch (error) {
    logger.error({ error, customerData }, 'Error in findOrCreateCustomer');
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const customer = result[0];
    return {
      id: customer.id,
      company: customer.company || undefined,
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
      city: customer.city || undefined,
      state: customer.state || undefined,
      zip: customer.zip || undefined,
      country: customer.country || undefined,
      notes: customer.notes || undefined,
      isActive: customer.isActive === 'true',
      createdAt: customer.createdAt?.toISOString(),
      updatedAt: customer.updatedAt?.toISOString(),
    };
  } catch (error) {
    logger.error({ error, customerId }, 'Error getting customer by ID');
    throw error;
  }
}

/**
 * Search customers by name, email, or company
 */
export async function searchCustomers(searchTerm: string, limit = 50): Promise<Customer[]> {
  try {
    const searchPattern = `%${searchTerm}%`;
    
    const results = await db
      .select()
      .from(customers)
      .where(
        and(
          or(
            like(customers.name, searchPattern),
            like(customers.email, searchPattern),
            like(customers.company, searchPattern)
          ),
          eq(customers.isActive, 'true')
        )
      )
      .orderBy(desc(customers.updatedAt))
      .limit(limit);
    
    return results.map(customer => ({
      id: customer.id,
      company: customer.company || undefined,
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
      city: customer.city || undefined,
      state: customer.state || undefined,
      zip: customer.zip || undefined,
      country: customer.country || undefined,
      notes: customer.notes || undefined,
      isActive: customer.isActive === 'true',
      createdAt: customer.createdAt?.toISOString(),
      updatedAt: customer.updatedAt?.toISOString(),
    }));
  } catch (error) {
    logger.error({ error, searchTerm }, 'Error searching customers');
    throw error;
  }
}

/**
 * Get all active customers
 */
export async function getAllCustomers(limit = 100, offset = 0): Promise<{ customers: Customer[]; total: number }> {
  try {
    const [customerResults, countResult] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(eq(customers.isActive, 'true'))
        .orderBy(desc(customers.updatedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.isActive, 'true'))
    ]);
    
    const customerList = customerResults.map(customer => ({
      id: customer.id,
      company: customer.company || undefined,
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
      city: customer.city || undefined,
      state: customer.state || undefined,
      zip: customer.zip || undefined,
      country: customer.country || undefined,
      notes: customer.notes || undefined,
      isActive: customer.isActive === 'true',
      createdAt: customer.createdAt?.toISOString(),
      updatedAt: customer.updatedAt?.toISOString(),
    }));
    
    return {
      customers: customerList,
      total: Number(countResult[0]?.count || 0),
    };
  } catch (error) {
    logger.error({ error, limit, offset }, 'Error getting all customers');
    throw error;
  }
}

/**
 * Update customer information
 */
export async function updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (updates.company !== undefined) updateData.company = updates.company || null;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.address !== undefined) updateData.address = updates.address || null;
    if (updates.city !== undefined) updateData.city = updates.city || null;
    if (updates.state !== undefined) updateData.state = updates.state || null;
    if (updates.zip !== undefined) updateData.zip = updates.zip || null;
    if (updates.country !== undefined) updateData.country = updates.country || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive ? 'true' : 'false';
    
    const result = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, customerId))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Customer not found: ${customerId}`);
    }
    
    const customer = result[0];
    logger.info({ customerId, updates }, 'Updated customer');
    
    return {
      id: customer.id,
      company: customer.company || undefined,
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
      city: customer.city || undefined,
      state: customer.state || undefined,
      zip: customer.zip || undefined,
      country: customer.country || undefined,
      notes: customer.notes || undefined,
      isActive: customer.isActive === 'true',
      createdAt: customer.createdAt?.toISOString(),
      updatedAt: customer.updatedAt?.toISOString(),
    };
  } catch (error) {
    logger.error({ error, customerId, updates }, 'Error updating customer');
    throw error;
  }
}

/**
 * Soft delete a customer (mark as inactive)
 */
export async function deactivateCustomer(customerId: string): Promise<void> {
  try {
    await db
      .update(customers)
      .set({
        isActive: 'false',
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));
    
    logger.info({ customerId }, 'Deactivated customer');
  } catch (error) {
    logger.error({ error, customerId }, 'Error deactivating customer');
    throw error;
  }
}

/**
 * Get customer with their quote history
 */
export async function getCustomerWithQuotes(customerId: string): Promise<{ customer: Customer; quoteCount: number }> {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }
    
    // Get quote count
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM quotes
      WHERE customer_id = ${customerId}
      AND deleted_at IS NULL
    `);
    
    const quoteCount = Number(countResult.rows[0]?.count || 0);
    
    return {
      customer,
      quoteCount,
    };
  } catch (error) {
    logger.error({ error, customerId }, 'Error getting customer with quotes');
    throw error;
  }
}


