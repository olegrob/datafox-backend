import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    console.log('Database connection established');
    
    // Get table info
    const tableInfo = await db.sql(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='product_attributes'
    `);

    // If table doesn't exist or needs migration
    if (!tableInfo.length) {
      console.log('Table does not exist');
      return NextResponse.json({ 
        error: 'Table does not exist',
        needsMigration: true 
      }, { status: 409 });
    }

    // Get column info
    const columnInfo = await db.sql(`PRAGMA table_info(product_attributes)`);
    const columns = new Set(columnInfo.map(col => col.name));

    // Build dynamic query based on available columns
    const selectClauses = [];
    selectClauses.push('id');
    selectClauses.push(columns.has('name') ? 'name as original_name' : "'unknown' as original_name");
    selectClauses.push(columns.has('ee_translation') ? 'ee_translation' : "'' as ee_translation");
    selectClauses.push(columns.has('en_translation') ? 'en_translation' : "'' as en_translation");
    selectClauses.push(columns.has('ru_translation') ? 'ru_translation' : "'' as ru_translation");
    selectClauses.push(columns.has('attribute_type') ? 'attribute_type' : "'text' as attribute_type");
    selectClauses.push(columns.has('is_active') ? 'is_active' : '1 as is_active');
    selectClauses.push(columns.has('usage_count') ? 'usage_count' : '0 as usage_count');
    selectClauses.push('created_at');
    selectClauses.push('updated_at');

    const query = `
      SELECT 
        ${selectClauses.join(',\n        ')}
      FROM product_attributes 
      ORDER BY ${columns.has('usage_count') ? 'usage_count' : 'id'} DESC, ${columns.has('name') ? 'name' : 'id'}
    `;

    const attributes = await db.sql(query);

    return NextResponse.json({ attributes });
  } catch (error) {
    console.error('Detailed error in attributes API:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    if (error.message.includes('no such table: product_attributes')) {
      return NextResponse.json({ 
        error: 'Table does not exist',
        needsMigration: true 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch attributes',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const db = await getDb();

    const [attribute] = await db.sql(`
      INSERT INTO product_attributes (
        name,
        ee_translation,
        en_translation,
        ru_translation,
        attribute_type,
        is_active,
        usage_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [
      data.name,
      data.ee_translation || null,
      data.en_translation || null,
      data.ru_translation || null,
      data.attribute_type || 'text',
      data.is_active === false ? 0 : 1,
      data.usage_count || 0
    ]);

    return NextResponse.json(attribute);
  } catch (error) {
    console.error('Error in attributes API:', error);
    return NextResponse.json({ 
      error: 'Failed to create attribute',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;
    const db = await getDb();

    const [attribute] = await db.sql(`
      UPDATE product_attributes 
      SET 
        ee_translation = ?,
        en_translation = ?,
        ru_translation = ?,
        attribute_type = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `, [
      updateData.ee_translation,
      updateData.en_translation,
      updateData.ru_translation,
      updateData.attribute_type,
      updateData.is_active ? 1 : 0,
      id
    ]);

    return NextResponse.json(attribute);
  } catch (error) {
    console.error('Error in attributes API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 