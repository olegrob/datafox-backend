import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_STORE_URL,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  version: 'wc/v3'
});

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get client details
    const clients = await db.sql('SELECT * FROM clients WHERE id = ?', [params.id]);
    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get client's orders
    const orders = await db.sql(`
      SELECT * FROM woocommerce_orders 
      WHERE customer_id = ? 
      ORDER BY date_created DESC
    `, [params.id]);

    return NextResponse.json({
      client: clients[0],
      orders
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
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
    const clients = await db.sql('SELECT * FROM clients WHERE id = ?', [params.id]);
    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clients[0];

    // Update WooCommerce customer if woo_customer_id exists
    if (client.woo_customer_id) {
      try {
        await api.put(`customers/${client.woo_customer_id}`, {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone
        });
      } catch (wooError) {
        console.error('Failed to update WooCommerce customer:', wooError);
      }
    }

    // Update local database
    await db.sql(`
      UPDATE clients SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        company = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.company,
      params.id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
} 