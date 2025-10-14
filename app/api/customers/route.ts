import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getAllCustomers, findOrCreateCustomer, searchCustomers } from '@/lib/db/customer-queries';

const logger = createLogger('api-customers');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (search) {
      // Search customers
      logger.info({ search }, 'Searching customers');
      const customers = await searchCustomers(search, limit);

      return NextResponse.json({
        success: true,
        data: {
          customers,
          total: customers.length,
        },
      });
    } else {
      // Get all customers
      logger.info({ limit, offset }, 'Fetching all customers');
      const result = await getAllCustomers(limit, offset);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to fetch customers');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.info('Creating new customer');

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const customerId = await findOrCreateCustomer({
      company: body.company,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country || 'USA',
      notes: body.notes,
    });

    logger.info({ customerId }, 'Customer created successfully');

    return NextResponse.json({
      success: true,
      data: { id: customerId },
      message: 'Customer created successfully',
    });

  } catch (error) {
    logger.error({ error }, 'Failed to create customer');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create customer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
