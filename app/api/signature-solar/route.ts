import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'signature-solar-products.json');
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({ error: 'No signature solar data found' }, { status: 404 });
    }
    
    const data = fs.readFileSync(dataPath, 'utf8');
    const products = JSON.parse(data);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error reading signature solar data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
