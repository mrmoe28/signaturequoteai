import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read the signature solar data file
    const dataPath = path.join(process.cwd(), 'public', 'data', 'signature-solar-products.json');
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      const products = JSON.parse(data);
      return NextResponse.json(products);
    }
    
    // Fallback: return empty array if file doesn't exist (e.g., on Vercel)
    console.warn('Signature solar data file not found, returning empty array');
    return NextResponse.json([]);
    
  } catch (error) {
    console.error('Error reading signature solar data:', error);
    // Return empty array instead of error to prevent client-side crashes
    return NextResponse.json([]);
  }
}
