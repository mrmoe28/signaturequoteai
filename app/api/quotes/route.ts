import { NextRequest, NextResponse } from 'next/server';
import { createQuote, getQuotes } from '@/lib/db/queries';
import { createLogger } from '@/lib/logger';
import type { Quote } from '@/lib/types';

const logger = createLogger('api-quotes');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 quotes per page
    
    logger.info({ page, limit }, 'Fetching quotes');
    
    const result = await getQuotes(page, limit);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    logger.error({ error }, 'Failed to fetch quotes');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotes',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.customer?.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer name is required',
        },
        { status: 400 }
      );
    }
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote items are required',
        },
        { status: 400 }
      );
    }
    
    // Validate each item
    for (const item of body.items) {
      if (!item.productId || !item.name || item.unitPrice == null || !item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: 'All quote items must have productId, name, unitPrice (can be null), and quantity',
          },
          { status: 400 }
        );
      }
    }
    
    // Calculate totals if not provided
    const subtotal = body.subtotal || body.items.reduce(
      (sum: number, item: any) => sum + ((item.unitPrice || 0) * item.quantity),
      0
    );
    
    const discount = body.discount || 0;
    const shipping = body.shipping || 0;
    const tax = body.tax || 0;
    
    const total = body.total || (subtotal - discount + shipping + tax);
    
    const quoteData: Omit<Quote, 'id' | 'createdAt'> = {
      number: body.number,
      validUntil: body.validUntil,
      preparedBy: body.preparedBy,
      leadTimeNote: body.leadTimeNote,
      discount,
      shipping,
      tax,
      items: body.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : null,
        quantity: parseFloat(item.quantity),
        extended: (item.unitPrice ? parseFloat(item.unitPrice) : 0) * parseFloat(item.quantity),
        notes: item.notes,
        imageUrl: item.imageUrl,
      })),
      subtotal,
      total,
      terms: body.terms,
      shipTo: body.customer.shipTo || body.shipTo,
      customer: {
        company: body.customer.company,
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
      },
    };
    
    logger.info({ 
      customerName: quoteData.customer.name,
      itemCount: quoteData.items.length,
      total: quoteData.total 
    }, 'Creating quote');
    
    const quote = await createQuote(quoteData);
    
    return NextResponse.json({
      success: true,
      data: quote,
      message: 'Quote created successfully',
    });
    
  } catch (error) {
    logger.error({ error }, 'Failed to create quote');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quote',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}