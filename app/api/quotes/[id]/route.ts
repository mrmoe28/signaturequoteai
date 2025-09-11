import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getQuoteById } from '@/lib/db/queries';

const logger = createLogger('api-quotes-detail');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    
    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    logger.info({ quoteId }, 'Fetching quote details');

    // Get quote from database
    const quote = await getQuoteById(quoteId);
    
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    logger.info({ quoteId }, 'Quote fetched successfully');

    return NextResponse.json({
      success: true,
      data: quote,
    });

  } catch (error) {
    logger.error({ error, quoteId: params.id }, 'Failed to fetch quote');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quote',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}