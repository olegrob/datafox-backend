import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { createClientsTable } from '@/app/db/migrations/create_clients_table';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const db = await getDb();
    
    let whereClause = '';
    let queryParams = [];
    
    if (search) {
      whereClause = `
        WHERE first_name LIKE ? 
        OR last_name LIKE ? 
        OR company LIKE ?
        OR email LIKE ?
      `;
      const searchTerm = `%${search}%`;
      queryParams = [searchTerm, searchTerm, searchTerm, searchTerm];
    }

    // Get total count with search
    const [{ total }] = await db.sql(
      `SELECT COUNT(*) as total FROM clients ${whereClause}`,
      queryParams
    );
    
    // Get paginated clients with search
    const clients = await db.sql(`
      SELECT * FROM clients 
      ${whereClause}
      ORDER BY last_order_date DESC NULLS LAST 
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    return NextResponse.json({
      clients,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + clients.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
} 