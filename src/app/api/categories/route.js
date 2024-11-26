import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  let db = null;
  try {
    db = await getDb('products');
    
    const query = `
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
      ORDER BY total_stock DESC, p.product_category;
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
        totalStock: parseInt(row.total_stock) || 0
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
