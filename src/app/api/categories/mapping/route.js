import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/categories/mapping
export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse');

    let query = 'SELECT * FROM sync_categories';
    const params = [];

    if (warehouse) {
      query += ' WHERE warehouse = ?';
      params.push(warehouse);
    }

    query += ' ORDER BY original_category';
    
    const mappings = await db.sql(query, params);
    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('Error fetching category mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch category mappings' }, { status: 500 });
  }
}

// POST /api/categories/mapping
export async function POST(request) {
  try {
    const db = await getDb();
    const { original_category, mapped_category, warehouse } = await request.json();

    if (!original_category || !warehouse) {
      return NextResponse.json(
        { error: 'Original category and warehouse are required' },
        { status: 400 }
      );
    }

    // First try to update
    const updateResult = await db.sql(
      `UPDATE sync_categories 
       SET mapped_category = ?, updated_at = CURRENT_TIMESTAMP
       WHERE original_category = ? AND warehouse = ?`,
      [mapped_category, original_category, warehouse]
    );

    // If no rows were updated, insert a new record
    if (updateResult.changes === 0) {
      await db.sql(
        `INSERT INTO sync_categories (original_category, mapped_category, warehouse)
         VALUES (?, ?, ?)`,
        [original_category, mapped_category, warehouse]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving category mapping:', error);
    return NextResponse.json({ error: 'Failed to save category mapping' }, { status: 500 });
  }
}

// DELETE /api/categories/mapping
export async function DELETE(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const original_category = searchParams.get('original_category');
    const warehouse = searchParams.get('warehouse');

    if (!original_category || !warehouse) {
      return NextResponse.json(
        { error: 'Original category and warehouse are required' },
        { status: 400 }
      );
    }

    await db.sql(
      'DELETE FROM sync_categories WHERE original_category = ? AND warehouse = ?',
      [original_category, warehouse]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category mapping:', error);
    return NextResponse.json({ error: 'Failed to delete category mapping' }, { status: 500 });
  }
}
