import { dbService } from '@/lib/dbService';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // First verify the table exists
    const tableInfo = await dbService.queryOne(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='product_attributes'
    `);

    if (!tableInfo) {
      return NextResponse.json({ 
        error: 'Table not found',
        message: 'The product_attributes table does not exist. Please run the sync script first.'
      }, { status: 404 });
    }

    // Build search condition
    let whereClause = 'WHERE is_active = 1';
    const params = [];
    
    if (search) {
      whereClause += ` AND (
        name LIKE ? OR 
        ee_translation LIKE ? OR 
        en_translation LIKE ? OR 
        ru_translation LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const totalResult = await dbService.queryOne(`
      SELECT COUNT(*) as total 
      FROM product_attributes 
      ${whereClause}
    `, params);

    const total = totalResult?.total || 0;

    // Get paginated attributes
    const results = await dbService.query(`
      SELECT 
        name,
        warehouse,
        ee_translation,
        en_translation,
        ru_translation,
        attribute_type,
        is_active,
        usage_count,
        created_at,
        updated_at
      FROM product_attributes
      ${whereClause}
      GROUP BY name, warehouse
      ORDER BY usage_count DESC, name ASC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return NextResponse.json({
      attributes: results.map(attr => ({
        name: attr.name,
        warehouse: attr.warehouse || '',
        translations: {
          ee: attr.ee_translation || '',
          en: attr.en_translation || '',
          ru: attr.ru_translation || ''
        },
        type: attr.attribute_type || 'text',
        isActive: Boolean(attr.is_active),
        usageCount: attr.usage_count || 0,
        createdAt: attr.created_at,
        updatedAt: attr.updated_at
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + results.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const result = await dbService.query(`
      INSERT INTO product_attributes (
        name,
        value,
        product_id,
        warehouse
      )
      VALUES (?, ?, ?, ?)
      RETURNING *
    `, [
      data.name,
      data.value || null,
      data.product_id || null,
      data.warehouse || null
    ]);

    return NextResponse.json(result[0]);
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
    const { name, warehouse, translations } = data;
    
    if (!name || !warehouse) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Both name and warehouse are required'
      }, { status: 400 });
    }

    const result = await dbService.query(`
      UPDATE product_attributes 
      SET 
        ee_translation = ?,
        en_translation = ?,
        ru_translation = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE name = ? AND warehouse = ?
      RETURNING *
    `, [
      translations?.ee || null,
      translations?.en || null,
      translations?.ru || null,
      name,
      warehouse
    ]);

    if (!result.length) {
      return NextResponse.json({ 
        error: 'Not found',
        message: 'Attribute not found with the given name and warehouse'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      attribute: {
        name: result[0].name,
        warehouse: result[0].warehouse || '',
        translations: {
          ee: result[0].ee_translation || '',
          en: result[0].en_translation || '',
          ru: result[0].ru_translation || ''
        },
        type: result[0].attribute_type || 'text',
        isActive: Boolean(result[0].is_active),
        usageCount: result[0].usage_count || 0,
        updatedAt: result[0].updated_at
      }
    });

  } catch (error) {
    console.error('Error updating attribute:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 