import { NextResponse } from 'next/server';
import data from '@/lib/seed/catalog.json';

export async function GET() { 
  return NextResponse.json(data); 
}