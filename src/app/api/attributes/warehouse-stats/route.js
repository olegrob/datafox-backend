import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get attribute usage by warehouse
    const results = await db.sql(`
      WITH AttributeList AS (
        SELECT DISTINCT 
          p.warehouse,
          json_each.key as attribute_name
        FROM products p
        CROSS JOIN json_each(p.product_attributes)
        WHERE p.product_attributes IS NOT NULL
      )
      SELECT 
        warehouse,
        COUNT(DISTINCT attribute_name) as attribute_count
      FROM AttributeList
      GROUP BY warehouse
      ORDER BY attribute_count DESC
    `);

    // Transform the results into an object with warehouse as key
    const stats = results.reduce((acc, { warehouse, attribute_count }) => {
      acc[warehouse || 'Unknown'] = attribute_count;
      return acc;
    }, {});

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 