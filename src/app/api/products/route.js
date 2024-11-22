import { Database } from '@sqlitecloud/drivers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 30;
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'default';
  const warehouse = searchParams.get('warehouse') || 'all';
  const manufacturer = searchParams.get('manufacturer') || 'all';
  const showInStock = searchParams.get('showInStock') === 'true';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const offset = (page - 1) * limit;
  let db;

  try {
    db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
    
    await db.sql('USE DATABASE products;');

    // Build the WHERE clause based on filters
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(
        name LIKE ? 
        OR manufacturer LIKE ? 
        OR short_description LIKE ? 
        OR long_description LIKE ?
        OR wpsso_product_mfr_part_no LIKE ?
        OR wpsso_product_gtin13 LIKE ?
        OR CAST(product_id AS TEXT) LIKE ?
      )`);
      params.push(
        `%${search}%`, 
        `%${search}%`, 
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
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
      whereConditions.push("stock > 0");
    }

    if (minPrice) {
      whereConditions.push("regular_price >= ?");
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereConditions.push("regular_price <= ?");
      params.push(parseFloat(maxPrice));
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Build the ORDER BY clause
    let orderByClause = '';
    switch (sortBy) {
      case 'price-high':
        orderByClause = 'ORDER BY regular_price DESC';
        break;
      case 'price-low':
        orderByClause = 'ORDER BY regular_price ASC';
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
    
    const [{ total }] = await db.sql(countQuery, ...params);

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

    // Get warehouse counts with current filters (except warehouse filter)
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

    // Get manufacturer counts with current filters (except manufacturer filter)
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

    const response = {
      products: results,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      warehouseCounts,
      manufacturerCounts
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}
