import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse');

    const db = await getDb();
    const [product] = await db.sql(`
      SELECT * FROM products 
      WHERE warehouse = ? 
      AND height IS NOT NULL 
      AND width IS NOT NULL 
      AND depth IS NOT NULL 
      AND weight IS NOT NULL
      ORDER BY RANDOM() 
      LIMIT 1
    `, [warehouse]);

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching random product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random product' },
      { status: 500 }
    );
  }
} 