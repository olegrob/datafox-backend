import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const db = await getDb('products');

    // Create the product_manufacturers table
    await db.sql(`
      CREATE TABLE IF NOT EXISTS product_manufacturers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_manufacturer TEXT NOT NULL,
        warehouse TEXT NOT NULL,
        mapped_manufacturer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(original_manufacturer, warehouse)
      )
    `);

    return NextResponse.json({ 
      success: true,
      message: 'Product manufacturers table created successfully'
    });
  } catch (error) {
    console.error('Error creating manufacturers table:', error);
    return NextResponse.json({ 
      error: error.message,
      details: 'Failed to create manufacturers table'
    }, { status: 500 });
  }
} 