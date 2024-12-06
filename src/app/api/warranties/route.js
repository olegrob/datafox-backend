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
        original_warranty,
        warehouse,
        eraisik_garantii,
        juriidiline_garantii,
        created_at,
        updated_at
      FROM product_warranties
      ${warehouse && warehouse !== 'all' ? 'WHERE warehouse = ?' : ''}
      ORDER BY warehouse, original_warranty
    `;
    
    const warranties = await db.sql(query, warehouse !== 'all' ? [warehouse] : []);
    
    if (!Array.isArray(warranties)) {
      throw new Error('Invalid response from database');
    }

    return NextResponse.json({ warranties });
  } catch (error) {
    console.error('Error fetching warranties:', error);
    return NextResponse.json({ 
      error: error.message,
      warranties: [] 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDb('products');
    const data = await request.json();

    await db.sql(`
      INSERT INTO product_warranties (
        original_warranty, 
        warehouse, 
        eraisik_garantii, 
        juriidiline_garantii
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(original_warranty, warehouse) 
      DO UPDATE SET 
        eraisik_garantii = excluded.eraisik_garantii,
        juriidiline_garantii = excluded.juriidiline_garantii,
        updated_at = CURRENT_TIMESTAMP
    `, [
      data.original_warranty,
      data.warehouse,
      data.eraisik_garantii,
      data.juriidiline_garantii
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving warranty:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 