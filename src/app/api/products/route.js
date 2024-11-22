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
    console.log('Attempting to connect to SQLite Cloud...');
    
    // Initialize database connection
    db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
    
    console.log('Connected to SQLite Cloud successfully');
    
    // Set the database
    console.log('Setting database to "products"...');
    await db.sql('USE DATABASE products;');
    console.log('Database set successfully');

    // Test query to verify connection
    const testQuery = await db.sql('SELECT COUNT(*) as count FROM products LIMIT 1;');
    console.log('Test query result:', testQuery);

    // Build the WHERE clause based on filters
    let whereConditions = [];
    let params = [];

    if (search) {
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
    console.log('Executing count query...');
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products
      ${whereClause}
    `;
    
    const countResult = await db.sql(countQuery, ...params);
    console.log('Count query result:', countResult);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    console.log('Executing main query...');
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

    console.log('Query:', query);
    console.log('Params:', [...params, limit, offset]);

    const results = await db.sql(query, ...params, limit, offset);
    console.log('Query results count:', results.length);

    // Get warehouse counts
    console.log('Getting warehouse counts...');
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
    console.log('Warehouse counts:', warehouseCounts);

    // Get manufacturer counts
    console.log('Getting manufacturer counts...');
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
    console.log('Manufacturer counts:', manufacturerCounts);

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
  } finally {
    if (db) {
      try {
        await db.close();
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }
}