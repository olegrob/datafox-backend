import { dbService } from '@/lib/dbService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results = await dbService.transaction(async (connection) => {
      // Get pricing rules
      const rules = await connection.sql(`
        SELECT * FROM pricing_rules 
        ORDER BY priority DESC
      `);

      // Get statistics
      const stats = await connection.sql(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN sale_price > 0 THEN 1 END) as products_on_sale,
          AVG(CAST(regular_price as DECIMAL)) as avg_price
        FROM products
        WHERE regular_price > 0
      `);

      return {
        rules,
        stats: stats[0]
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 