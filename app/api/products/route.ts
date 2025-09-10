import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/db/queries';
import { createLogger } from '@/lib/logger';
import type { ProductFilter } from '@/lib/types';

const logger = createLogger('api-products');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filter: ProductFilter = {
      category: searchParams.get('category') || undefined,
      vendor: (searchParams.get('vendor') as 'SignatureSolar') || undefined,
      sku: searchParams.get('sku') || undefined,
      updated_since: searchParams.get('updated_since') || undefined,
      active_only: searchParams.get('active_only') === 'true',
    };
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 items per page
    
    logger.info({ filter, page, limit }, 'Fetching products');
    
    const result = await getProducts(filter, page, limit);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    logger.error({ error }, 'Failed to fetch products');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}