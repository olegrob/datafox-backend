import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb('products');
    
    const query = `
      WITH product_stats AS (
        SELECT 
          COUNT(DISTINCT warehouse) as total_warehouses,
          COUNT(*) as total_products,
          COUNT(DISTINCT product_category) as unique_categories,
          SUM(CASE 
            WHEN CAST(stock as INTEGER) >= 0 AND CAST(stock as INTEGER) <= 10000 
            THEN CAST(stock as INTEGER) 
            ELSE 0 
          END) as total_stock
        FROM products
        WHERE stock > 0
      ),
      mapping_stats AS (
        SELECT 
          COUNT(DISTINCT warehouse) as mapped_warehouses,
          COUNT(DISTINCT original_category) as mapped_categories
        FROM sync_categories
        WHERE mapped_category IS NOT NULL
      ),
      mapped_products AS (
        SELECT 
          COUNT(*) as mapped_product_count,
          SUM(CASE 
            WHEN CAST(p.stock as INTEGER) >= 0 AND CAST(p.stock as INTEGER) <= 10000 
            THEN CAST(p.stock as INTEGER) 
            ELSE 0 
          END) as mapped_stock
        FROM products p
        INNER JOIN sync_categories sc 
          ON p.product_category = sc.original_category 
          AND p.warehouse = sc.warehouse
        WHERE sc.mapped_category IS NOT NULL
          AND p.stock > 0
      ),
      stock_distribution AS (
        SELECT 
          COUNT(*) as products_count,
          CASE 
            WHEN CAST(stock as INTEGER) < 0 THEN 'negative'
            WHEN CAST(stock as INTEGER) = 0 THEN 'zero'
            WHEN CAST(stock as INTEGER) <= 10 THEN '1-10'
            WHEN CAST(stock as INTEGER) <= 100 THEN '11-100'
            WHEN CAST(stock as INTEGER) <= 1000 THEN '101-1000'
            WHEN CAST(stock as INTEGER) <= 10000 THEN '1001-10000'
            ELSE 'over_10000'
          END as stock_range
        FROM products
        GROUP BY stock_range
      )
      SELECT 
        ps.total_warehouses,
        ps.total_products,
        ps.unique_categories,
        ps.total_stock,
        ms.mapped_warehouses,
        ms.mapped_categories,
        mp.mapped_product_count,
        mp.mapped_stock,
        ROUND(CAST(mp.mapped_product_count AS FLOAT) / NULLIF(ps.total_products, 0) * 100, 2) as mapped_products_percentage,
        ROUND(CAST(mp.mapped_stock AS FLOAT) / NULLIF(ps.total_stock, 0) * 100, 2) as mapped_stock_percentage,
        json_group_array(
          json_object(
            'range', sd.stock_range,
            'count', sd.products_count
          )
        ) as stock_distribution
      FROM product_stats ps, mapping_stats ms, mapped_products mp, stock_distribution sd;
    `;

    const result = await db.sql(query);
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid query result format');
    }

    const stats = result[0];
    let stockDistribution = [];
    try {
      stockDistribution = JSON.parse(stats.stock_distribution);
    } catch (e) {
      console.error('Failed to parse stock distribution:', e);
    }

    console.log('Stock Distribution:', stockDistribution);

    return NextResponse.json({
      totalWarehouses: stats.total_warehouses || 0,
      totalProducts: stats.total_products || 0,
      uniqueCategories: stats.unique_categories || 0,
      totalStock: stats.total_stock || 0,
      mappedWarehouses: stats.mapped_warehouses || 0,
      mappedCategories: stats.mapped_categories || 0,
      mappedProductCount: stats.mapped_product_count || 0,
      mappedStock: stats.mapped_stock || 0,
      mappedProductsPercentage: stats.mapped_products_percentage || 0,
      mappedStockPercentage: stats.mapped_stock_percentage || 0,
      stockDistribution
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category statistics', details: error.message },
      { status: 500 }
    );
  }
}
