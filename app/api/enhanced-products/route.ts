import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

const logger = createLogger('api-enhanced-products');

export async function GET(request: NextRequest) {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'enhanced-signature-solar-products.json');
    
    if (!fs.existsSync(dataPath)) {
      logger.warn('Enhanced products file not found, returning empty array');
      return NextResponse.json([]);
    }
    
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const products = JSON.parse(fileContent);
    
    logger.info({ count: products.length }, 'Serving enhanced products');
    
    return NextResponse.json(products);
    
  } catch (error) {
    logger.error({ error }, 'Failed to fetch enhanced products');
    return NextResponse.json(
      { error: 'Failed to fetch enhanced products' },
      { status: 500 }
    );
  }
}
