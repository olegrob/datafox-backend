import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse');
    const onlyUnmapped = searchParams.get('onlyUnmapped') === 'true';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const db = await getDb();

    // Build the query based on filters
    let query = `
      SELECT DISTINCT
        pa.id,
        pa.name as original_name,
        pa.warehouse,
        pa.ee_translation,
        pa.en_translation,
        pa.ru_translation,
        pa.attribute_type,
        pa.is_active
      FROM product_attributes pa
      WHERE 1=1
    `;

    const params = [];

    if (warehouse) {
      query += ` AND pa.warehouse = ?`;
      params.push(warehouse);
    }

    if (onlyUnmapped) {
      query += ` AND (pa.ee_translation IS NULL OR pa.ee_translation = '')`;
    }

    query += ` ORDER BY pa.id LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const attributes = await db.sql(query, params);

    return NextResponse.json({ 
      attributes,
      metadata: {
        offset,
        limit,
        count: attributes.length
      }
    });
  } catch (error) {
    console.error('Error in attributes export API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
