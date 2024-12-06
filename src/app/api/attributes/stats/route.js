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

    // Get total count
    const [{ total }] = await db.sql(`
      SELECT COUNT(*) as total 
      FROM product_attributes
    `);

    // Get warehouse distribution
    const warehouseStats = await db.sql(`
      SELECT 
        COALESCE(NULLIF(TRIM(warehouse), ''), 'Unknown') as warehouse,
        COUNT(*) as count
      FROM product_attributes
      GROUP BY COALESCE(NULLIF(TRIM(warehouse), ''), 'Unknown')
      ORDER BY count DESC
    `);

    // Get translation progress
    const translationStats = await db.sql(`
      SELECT
        SUM(CASE WHEN ee_translation != '' AND ee_translation IS NOT NULL THEN 1 ELSE 0 END) as ee_count,
        SUM(CASE WHEN en_translation != '' AND en_translation IS NOT NULL THEN 1 ELSE 0 END) as en_count,
        SUM(CASE WHEN ru_translation != '' AND ru_translation IS NOT NULL THEN 1 ELSE 0 END) as ru_count,
        COUNT(*) as total
      FROM product_attributes
    `);

    // Get attribute types distribution
    const typeStats = await db.sql(`
      SELECT 
        attribute_type,
        COUNT(*) as count
      FROM product_attributes
      GROUP BY attribute_type
      ORDER BY count DESC
    `);

    // Get active attributes count
    const [{ active_count }] = await db.sql(`
      SELECT COUNT(*) as active_count
      FROM product_attributes
      WHERE is_active = 1
    `);

    // Get translated attributes count (any translation)
    const [{ translated_count }] = await db.sql(`
      SELECT COUNT(*) as translated_count
      FROM product_attributes
      WHERE (ee_translation != '' AND ee_translation IS NOT NULL)
         OR (en_translation != '' AND en_translation IS NOT NULL)
         OR (ru_translation != '' AND ru_translation IS NOT NULL)
    `);

    return NextResponse.json({
      total,
      warehouses: warehouseStats,
      translations: {
        estonian: translationStats[0]?.ee_count || 0,
        english: translationStats[0]?.en_count || 0,
        russian: translationStats[0]?.ru_count || 0,
        total: translationStats[0]?.total || 0
      },
      types: typeStats,
      activeCount: active_count,
      translatedCount: translated_count
    });
  } catch (error) {
    console.error('Error fetching attribute stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
