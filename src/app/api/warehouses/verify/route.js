import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const warehouses = await db.sql(`
      SELECT DISTINCT warehouse 
      FROM products 
      WHERE warehouse IS NOT NULL 
      ORDER BY warehouse
    `);

    return NextResponse.json({ warehouses: warehouses.map(w => w.warehouse) });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
} 