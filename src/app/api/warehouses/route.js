import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const warehouses = await db.sql(`
      SELECT DISTINCT warehouse 
      FROM products 
      WHERE warehouse IS NOT NULL 
      AND warehouse != ''
      ORDER BY warehouse
    `);

    return NextResponse.json({ warehouses: warehouses.map(w => w.warehouse) });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
} 