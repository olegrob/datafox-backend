import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (search) {
      const searchTerms = search.split(' ').filter(term => term.length > 0);
      const searchConditions = searchTerms.map(() => `(
        LOWER(name) LIKE LOWER(?) 
        OR LOWER(manufacturer) LIKE LOWER(?) 
        OR LOWER(short_description) LIKE LOWER(?) 
        OR LOWER(long_description) LIKE LOWER(?)
      )`);

      whereConditions.push(`(${searchConditions.join(' AND ')})`);
      
      searchTerms.forEach(term => {
        const wildcardTerm = `%${term}%`;
        params.push(wildcardTerm, wildcardTerm, wildcardTerm, wildcardTerm);
      });
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const [{ total }] = await db.execute(countQuery, params);

    const query = `
      SELECT * FROM products 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const products = await db.execute(query, [...params, limit, offset]);
    
    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
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
      long_description,
      price,
      quantity,
      category
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
        long_description,
        price,
        quantity,
        category
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.execute(query, [
      name,
      manufacturer,
      short_description || '',
      long_description || '',
      price,
      quantity,
      category || 'Uncategorized'
    ]);

    return NextResponse.json({ id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}