import { NextRequest, NextResponse } from 'next/server';
import { getProductById, upsertProduct } from '@/lib/db/queries';
import { crawler } from '@/lib/crawler';
import { createLogger, logOperation } from '@/lib/logger';

const logger = createLogger('api-product-refresh');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get existing product to get URL
    const existingProduct = await getProductById(params.id);
    
    if (!existingProduct || !existingProduct.url) {
      return NextResponse.json(
        {
          success: false,
          error: existingProduct ? 'Product has no URL to crawl' : 'Product not found',
        },
        { status: 404 }
      );
    }
    
    logger.info({ productId: params.id, url: existingProduct.url }, 'Refreshing product');
    
    // Crawl the product
    const crawlResult = await logOperation(
      logger,
      'crawl_product_refresh',
      () => crawler.crawlProduct(existingProduct.url!),
      { productId: params.id }
    );
    
    if (!crawlResult.success || !crawlResult.product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to crawl product',
          message: crawlResult.error,
        },
        { status: 500 }
      );
    }
    
    // Update the product in database
    const updatedProduct = await upsertProduct(crawlResult.product);
    
    logger.info({ 
      productId: params.id,
      oldPrice: existingProduct.price,
      newPrice: updatedProduct.price 
    }, 'Product refreshed successfully');
    
    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product refreshed successfully',
    });
    
  } catch (error) {
    logger.error({ productId: params.id, error }, 'Failed to refresh product');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}