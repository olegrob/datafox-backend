export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbService } from '@/lib/dbService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { findOrCreateCustomer } from '@/lib/customerService';
import { initializeTables } from '@/lib/migrations';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '30');
      const search = url.searchParams.get('search') || '';
      const offset = (page - 1) * limit;

      let whereClause = '';
      let queryParams = [];
      
      if (search) {
        whereClause = `
          WHERE o.order_number LIKE ?
          OR o.woo_order_id LIKE ?
          OR json_extract(o.billing, '$.first_name') LIKE ?
          OR json_extract(o.billing, '$.last_name') LIKE ?
          OR json_extract(o.billing, '$.email') LIKE ?
        `;
        const searchTerm = `%${search}%`;
        queryParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
      }

      // Get total count with search
      const totalResult = await dbService.queryOne(`
        SELECT COUNT(DISTINCT o.woo_order_id) as total 
        FROM woocommerce_orders o
        ${whereClause}
      `, queryParams);
      
      const total = totalResult?.total || 0;

      // Query with search
      const orders = await dbService.query(`
        WITH parsed_meta AS (
          SELECT 
            o.*,
            json_extract(value, '$.value') as meta_value,
            json_extract(value, '$.key') as meta_key
          FROM woocommerce_orders o
          CROSS JOIN json_each(o.meta_data)
        ),
        filtered_orders AS (
          SELECT *
          FROM woocommerce_orders o
          ${whereClause}
        ),
        latest_orders AS (
          SELECT fo.*
          FROM filtered_orders fo
          INNER JOIN (
            SELECT woo_order_id, MAX(id) as max_id
            FROM filtered_orders
            GROUP BY woo_order_id
          ) latest ON fo.id = latest.max_id
        )
        SELECT DISTINCT
          o.*,
          (SELECT meta_value FROM parsed_meta WHERE meta_key = '_wcst_order_trackno' AND woo_order_id = o.woo_order_id) as tracking_number,
          (SELECT meta_value FROM parsed_meta WHERE meta_key = '_wcst_order_track_http_url' AND woo_order_id = o.woo_order_id) as tracking_url,
          (SELECT meta_value FROM parsed_meta WHERE meta_key = '_wcst_order_trackname' AND woo_order_id = o.woo_order_id) as courier_name,
          (SELECT meta_value FROM parsed_meta WHERE meta_key = '_wcst_order_dispatch_date' AND woo_order_id = o.woo_order_id) as dispatch_date
        FROM latest_orders o
        ORDER BY o.date_created DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, limit, offset]);

      return NextResponse.json({
        orders,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + orders.length < total
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch orders',
      details: error.message
    }, { status: 500 });
  }
} 