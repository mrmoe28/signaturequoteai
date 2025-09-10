import { NextRequest, NextResponse } from 'next/server';
import { getQuoteById } from '@/lib/db/queries';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-quote');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await getQuoteById(params.id);
    
    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: quote,
    });
    
  } catch (error) {
    logger.error({ quoteId: params.id, error }, 'Failed to fetch quote');
    
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