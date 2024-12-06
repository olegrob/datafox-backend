export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = await getDb();
    const client = await db.get('SELECT * FROM clients WHERE id = ?', [id]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const orders = await db.all(`
      SELECT * FROM woocommerce_orders 
      WHERE customer_id = ? 
      ORDER BY date_created DESC
    `, [id]);

    return NextResponse.json({
      client,
      orders
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const db = await getDb();

    // Get current client data
    const client = await db.get('SELECT * FROM clients WHERE id = ?', [params.id]);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Update WooCommerce customer if woo_customer_id exists
    if (client.woo_customer_id) {
      try {
        const response = await fetch(`${process.env.API_URL}/api/woocommerce/customers/${client.woo_customer_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            // Add other fields as needed
          }),
        });

        if (!response.ok) {
          console.error('Failed to update WooCommerce customer');
        }
      } catch (error) {
        console.error('Error updating WooCommerce customer:', error);
      }
    }

    // Update local database
    await db.run(
      `UPDATE clients 
       SET email = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [data.email, data.first_name, data.last_name, params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}