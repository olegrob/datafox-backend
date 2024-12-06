import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const db = await getDb('products');

    // Get all unique warranty periods from products
    const products = await db.sql(`
      SELECT DISTINCT warranty_period, warehouse
      FROM products
      WHERE warranty_period IS NOT NULL
        AND warranty_period != ''
        AND warranty_period != 'null'
    `);

    let syncCount = 0;
    // Insert or update warranties
    for (const product of products) {
      // Clean up the warranty period value
      const warranty = product.warranty_period.replace('L', '').trim();
      
      await db.sql(`
        INSERT INTO product_warranties (original_warranty, warehouse)
        VALUES (?, ?)
        ON CONFLICT(original_warranty, warehouse) DO NOTHING
      `, [warranty, product.warehouse]);
      syncCount++;
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully synced ${syncCount} warranty periods`
    });
  } catch (error) {
    console.error('Error syncing warranties:', error);
    return NextResponse.json({ 
      error: error.message,
      details: 'Failed to sync warranties'
    }, { status: 500 });
  }
} 