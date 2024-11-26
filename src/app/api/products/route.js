import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/config';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 30;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'default';
    const warehouse = searchParams.get('warehouse') || 'all';
    const manufacturer = searchParams.get('manufacturer') || 'all';
    const showInStock = searchParams.get('showInStock') === 'true';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const offset = (page - 1) * limit;
    const db = await getDb();

    // Build the WHERE clause based on filters
    let whereConditions = [];
    let params = [];

    if (category) {
      whereConditions.push("product_category = ?");
      params.push(category);
    } else if (search) {
      whereConditions.push(`(
        LOWER(name) LIKE LOWER(?) 
        OR LOWER(manufacturer) LIKE LOWER(?) 
        OR LOWER(short_description) LIKE LOWER(?) 
        OR LOWER(long_description) LIKE LOWER(?) 
        OR LOWER(wpsso_product_mfr_part_no) LIKE LOWER(?) 
        OR LOWER(wpsso_product_gtin13) LIKE LOWER(?) 
        OR CAST(product_id AS TEXT) LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (warehouse !== 'all') {
      whereConditions.push("warehouse = ?");
      params.push(warehouse);
    }

    if (manufacturer !== 'all') {
      whereConditions.push("manufacturer = ?");
      params.push(manufacturer);
    }

    if (showInStock) {
      whereConditions.push("CAST(stock AS INTEGER) > 0");
    }

    if (minPrice) {
      whereConditions.push("CAST(regular_price AS DECIMAL) >= ?");
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereConditions.push("CAST(regular_price AS DECIMAL) <= ?");
      params.push(parseFloat(maxPrice));
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Build the ORDER BY clause
    let orderByClause = '';
    switch (sortBy) {
      case 'price-high':
        orderByClause = 'ORDER BY CAST(regular_price AS DECIMAL) DESC';
        break;
      case 'price-low':
        orderByClause = 'ORDER BY CAST(regular_price AS DECIMAL) ASC';
        break;
      case 'name-asc':
        orderByClause = 'ORDER BY name ASC';
        break;
      case 'name-desc':
        orderByClause = 'ORDER BY name DESC';
        break;
      default:
        orderByClause = 'ORDER BY id ASC';
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products
      ${whereClause}
    `;
    
    const countResult = await db.sql(countQuery, ...params);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const query = `
      SELECT 
        id, 
        product_id,
        warehouse,
        manufacturer,
        name,
        short_description,
        long_description,
        regular_price,
        sale_price,
        stock,
        product_category,
        external_image_urls,
        product_attributes,
        warranty_period,
        wpsso_product_gtin13,
        wpsso_product_mfr_part_no,
        created_at,
        updated_at
      FROM products
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const results = await db.sql(query, ...params, limit, offset);

    // Get warehouse counts
    let warehouseWhereConditions = whereConditions.filter(condition => !condition.includes('warehouse ='));
    let warehouseParams = params.filter((_, index) => !whereConditions[index]?.includes('warehouse ='));
    
    const warehouseCountQuery = `
      SELECT 
        warehouse,
        COUNT(*) as count
      FROM products
      ${warehouseWhereConditions.length > 0 ? 'WHERE ' + warehouseWhereConditions.join(' AND ') : ''}
      GROUP BY warehouse
      ORDER BY warehouse
    `;
    
    const warehouseCounts = await db.sql(warehouseCountQuery, ...warehouseParams);

    // Get manufacturer counts
    let manufacturerWhereConditions = whereConditions.filter(condition => !condition.includes('manufacturer ='));
    let manufacturerParams = params.filter((_, index) => !whereConditions[index]?.includes('manufacturer ='));
    
    const manufacturerCountQuery = `
      SELECT 
        manufacturer,
        COUNT(*) as count
      FROM products
      ${manufacturerWhereConditions.length > 0 ? 'WHERE ' + manufacturerWhereConditions.join(' AND ') : ''}
      GROUP BY manufacturer
      ORDER BY manufacturer
    `;
    
    const manufacturerCounts = await db.sql(manufacturerCountQuery, ...manufacturerParams);

    return NextResponse.json({
      products: results,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      warehouseCounts,
      manufacturerCounts
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const data = await request.json();

    const {
      name,
      manufacturer,
      short_description,
      price,
      quantity
    } = data;

    if (!name || !manufacturer || !price || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO products (
        name,
        manufacturer,
        short_description,
        price,
        quantity,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = await db.sql(query, [
      name,
      manufacturer,
      short_description || null,
      price,
      quantity
    ]);

    return NextResponse.json({
      message: 'Product created successfully',
      productId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}