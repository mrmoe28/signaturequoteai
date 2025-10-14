import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getQuoteHistory } from '@/lib/db/queries';

const logger = createLogger('api-quotes-history');

export async function GET(request: Request) {
  try {
    logger.info('Fetching quote history from database');

    const quotes = await getQuoteHistory();

    logger.info({ count: quotes.length }, 'Quote history fetched successfully');

    return NextResponse.json({
      success: true,
      quotes,
      total: quotes.length
    });

  } catch (error) {
    logger.error({ error }, 'Failed to fetch quote history');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quote history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}