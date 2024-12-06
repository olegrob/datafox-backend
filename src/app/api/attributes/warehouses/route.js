import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get distinct warehouses and their attribute counts
    const warehouses = await db.sql(`
      SELECT DISTINCT 
        warehouse,
        COUNT(*) as count
      FROM product_attributes
      WHERE warehouse IS NOT NULL
      GROUP BY warehouse
      ORDER BY count DESC
    `);

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
