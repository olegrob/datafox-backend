import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const db = await getDb('products');

    // Get all unique manufacturers from products
    const products = await db.sql(`
      SELECT DISTINCT manufacturer, warehouse
      FROM products
      WHERE manufacturer IS NOT NULL
        AND manufacturer != ''
        AND manufacturer != 'null'
    `);

    let syncCount = 0;
    // Insert or update manufacturers
    for (const product of products) {
      await db.sql(`
        INSERT INTO product_manufacturers (original_manufacturer, warehouse)
        VALUES (?, ?)
        ON CONFLICT(original_manufacturer, warehouse) DO NOTHING
      `, [product.manufacturer, product.warehouse]);
      syncCount++;
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully synced ${syncCount} manufacturers`
    });
  } catch (error) {
    console.error('Error syncing manufacturers:', error);
    return NextResponse.json({ 
      error: error.message,
      details: 'Failed to sync manufacturers'
    }, { status: 500 });
  }
} 