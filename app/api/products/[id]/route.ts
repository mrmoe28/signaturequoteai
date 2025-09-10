import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/db/queries';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-product');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id);
    
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: product,
    });
    
  } catch (error) {
    logger.error({ productId: params.id, error }, 'Failed to fetch product');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}