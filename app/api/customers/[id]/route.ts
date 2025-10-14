import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getCustomerById, updateCustomer, deactivateCustomer, getCustomerWithQuotes } from '@/lib/db/customer-queries';

const logger = createLogger('api-customers-id');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const includeQuotes = request.nextUrl.searchParams.get('includeQuotes') === 'true';

    if (includeQuotes) {
      logger.info({ customerId }, 'Fetching customer with quotes');
      const result = await getCustomerWithQuotes(customerId);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } else {
      logger.info({ customerId }, 'Fetching customer');
      const customer = await getCustomerById(customerId);

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: customer,
      });
    }
  } catch (error) {
    logger.error({ error, customerId: params.id }, 'Failed to fetch customer');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    logger.info({ customerId }, 'Updating customer');

    const updatedCustomer = await updateCustomer(customerId, {
      company: body.company,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country,
      notes: body.notes,
      isActive: body.isActive,
    });

    logger.info({ customerId }, 'Customer updated successfully');

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully',
    });

  } catch (error) {
    logger.error({ error, customerId: params.id }, 'Failed to update customer');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update customer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    logger.info({ customerId }, 'Deactivating customer');

    await deactivateCustomer(customerId);

    logger.info({ customerId }, 'Customer deactivated successfully');

    return NextResponse.json({
      success: true,
      message: 'Customer deactivated successfully',
    });

  } catch (error) {
    logger.error({ error, customerId: params.id }, 'Failed to deactivate customer');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to deactivate customer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
