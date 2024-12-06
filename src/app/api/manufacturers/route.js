import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = await getDb('products');
    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse');

    let query = `
      SELECT 
        id,
        original_manufacturer,
        warehouse,
        mapped_manufacturer,
        created_at,
        updated_at
      FROM product_manufacturers
      ${warehouse && warehouse !== 'all' ? 'WHERE warehouse = ?' : ''}
      ORDER BY warehouse, original_manufacturer
    `;
    
    const manufacturers = await db.sql(query, warehouse !== 'all' ? [warehouse] : []);
    
    if (!Array.isArray(manufacturers)) {
      throw new Error('Invalid response from database');
    }

    return NextResponse.json({ manufacturers });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return NextResponse.json({ 
      error: error.message,
      manufacturers: [] 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDb('products');
    const data = await request.json();

    await db.sql(`
      INSERT INTO product_manufacturers (
        original_manufacturer, 
        warehouse, 
        mapped_manufacturer
      ) VALUES (?, ?, ?)
      ON CONFLICT(original_manufacturer, warehouse) 
      DO UPDATE SET 
        mapped_manufacturer = excluded.mapped_manufacturer,
        updated_at = CURRENT_TIMESTAMP
    `, [
      data.original_manufacturer,
      data.warehouse,
      data.mapped_manufacturer
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving manufacturer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 