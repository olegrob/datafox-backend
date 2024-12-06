import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const db = await getDb('products');

    // Create the product_warranties table
    await db.sql(`
      CREATE TABLE IF NOT EXISTS product_warranties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_warranty TEXT NOT NULL,
        warehouse TEXT NOT NULL,
        eraisik_garantii TEXT,
        juriidiline_garantii TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(original_warranty, warehouse)
      )
    `);

    return NextResponse.json({ 
      success: true,
      message: 'Product warranties table created successfully'
    });
  } catch (error) {
    console.error('Error creating warranties table:', error);
    return NextResponse.json({ 
      error: error.message,
      details: 'Failed to create warranties table'
    }, { status: 500 });
  }
} 