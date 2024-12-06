import { dbService } from '@/lib/dbService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results = await dbService.query(`
      WITH category_stats AS (
        SELECT 
          p.product_category,
          p.warehouse,
          COUNT(*) as product_count,
          SUM(CAST(p.stock as INTEGER)) as total_stock
        FROM products p
        WHERE p.product_category IS NOT NULL
          AND p.product_category != ''
          AND p.stock > 0
        GROUP BY p.product_category, p.warehouse
      )
      SELECT 
        COALESCE(sc.original_category, cs.product_category) as product_category,
        COALESCE(sc.warehouse, cs.warehouse) as warehouse,
        COALESCE(cs.product_count, 0) as product_count,
        COALESCE(cs.total_stock, 0) as total_stock,
        sc.mapped_category,
        sc.created_at,
        sc.updated_at
      FROM sync_categories sc
      LEFT JOIN category_stats cs 
        ON sc.original_category = cs.product_category 
        AND sc.warehouse = cs.warehouse
      UNION
      SELECT 
        cs.product_category,
        cs.warehouse,
        cs.product_count,
        cs.total_stock,
        NULL as mapped_category,
        NULL as created_at,
        NULL as updated_at
      FROM category_stats cs
      WHERE NOT EXISTS (
        SELECT 1 FROM sync_categories sc 
        WHERE sc.original_category = cs.product_category 
        AND sc.warehouse = cs.warehouse
      )
      ORDER BY total_stock DESC, product_category;
    `);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
