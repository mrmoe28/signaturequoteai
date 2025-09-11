import { NextRequest, NextResponse } from 'next/server';
import { createQuote, getAllQuotes } from '@/lib/db/raw-queries';
import { createLogger } from '@/lib/logger';
import type { Quote } from '@/lib/types';

const logger = createLogger('api-quotes');

export async function GET(request: NextRequest) {
  try {
    logger.info('Fetching quotes');
    
    const quotes = await getAllQuotes();
    
    return NextResponse.json({
      success: true,
      data: quotes,
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
    
    const quoteData = {
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        company: body.customer.company,
        shipTo: body.customer.shipTo,
      },
      items: body.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        unitPrice: parseFloat(item.unitPrice),
        quantity: parseFloat(item.quantity),
        notes: item.notes,
        imageUrl: item.imageUrl,
      })),
      preparedBy: body.preparedBy,
      leadTimeNote: body.leadTimeNote,
      discount,
      shipping,
      tax,
      terms: body.terms,
      validUntil: body.validUntil,
    };
    
    logger.info({ 
      customerName: quoteData.customer.name,
      itemCount: quoteData.items.length,
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