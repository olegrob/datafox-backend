import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  let db = null;
  try {
    db = await getDb('products');
    
    const query = `
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
    `;

    const result = await db.sql(query);
    
    if (!Array.isArray(result)) {
      console.error('Unexpected query result format:', result);
      throw new Error('Invalid query result format');
    }

    return NextResponse.json({
      categories: result.map(row => ({
        category: row.product_category || '',
        warehouse: row.warehouse || '',
        productCount: parseInt(row.product_count) || 0,
        totalStock: parseInt(row.total_stock) || 0,
        mappedCategory: row.mapped_category || null,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null
      }))
    });
  } catch (error) {
    console.error('Database error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
