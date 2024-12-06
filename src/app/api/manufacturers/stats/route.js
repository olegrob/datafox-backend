import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getDb('products');
    
    const query = `
      WITH product_stats AS (
        SELECT 
          COUNT(DISTINCT manufacturer) as total_manufacturers,
          COUNT(DISTINCT warehouse) as total_warehouses,
          COUNT(*) as total_products,
          COUNT(DISTINCT CASE WHEN manufacturer != '' AND manufacturer IS NOT NULL THEN manufacturer END) as unique_manufacturers
        FROM products
        WHERE manufacturer IS NOT NULL AND manufacturer != ''
      ),
      mapping_stats AS (
        SELECT 
          COUNT(DISTINCT original_manufacturer) as mapped_manufacturers,
          COUNT(DISTINCT warehouse) as mapped_warehouses,
          COUNT(*) as total_mappings,
          COUNT(CASE WHEN mapped_manufacturer IS NOT NULL AND mapped_manufacturer != '' THEN 1 END) as completed_mappings
        FROM product_manufacturers
      ),
      warehouse_stats AS (
        SELECT 
          warehouse,
          COUNT(DISTINCT manufacturer) as manufacturer_count
        FROM products
        WHERE manufacturer IS NOT NULL AND manufacturer != ''
        GROUP BY warehouse
      )
      SELECT 
        ps.total_manufacturers,
        ps.total_warehouses,
        ps.total_products,
        ps.unique_manufacturers,
        ms.mapped_manufacturers,
        ms.mapped_warehouses,
        ms.total_mappings,
        ms.completed_mappings,
        json_group_array(
          json_object(
            'warehouse', ws.warehouse,
            'count', ws.manufacturer_count
          )
        ) as warehouse_distribution
      FROM product_stats ps, mapping_stats ms, warehouse_stats ws;
    `;

    const result = await db.sql(query);
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid query result format');
    }

    const stats = result[0];
    let warehouseDistribution = [];
    try {
      warehouseDistribution = JSON.parse(stats.warehouse_distribution);
    } catch (e) {
      console.error('Failed to parse warehouse distribution:', e);
    }

    return NextResponse.json({
      totalManufacturers: stats.total_manufacturers || 0,
      totalWarehouses: stats.total_warehouses || 0,
      totalProducts: stats.total_products || 0,
      uniqueManufacturers: stats.unique_manufacturers || 0,
      mappedManufacturers: stats.mapped_manufacturers || 0,
      mappedWarehouses: stats.mapped_warehouses || 0,
      totalMappings: stats.total_mappings || 0,
      completedMappings: stats.completed_mappings || 0,
      mappingProgress: stats.total_mappings ? 
        Math.round((stats.completed_mappings / stats.total_mappings) * 100) : 0,
      warehouseDistribution
    });
  } catch (error) {
    console.error('Error fetching manufacturer stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 