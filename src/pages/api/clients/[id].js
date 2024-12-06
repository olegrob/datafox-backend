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

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const db = await getDb();
      const { id } = req.query;
      
      // Get client details
      const clients = await db.sql('SELECT * FROM clients WHERE id = ?', [id]);
      if (!clients || clients.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Get client's orders
      const orders = await db.sql(`
        SELECT * FROM woocommerce_orders 
        WHERE customer_id = ? 
        ORDER BY date_created DESC
      `, [id]);

      return res.status(200).json({
        client: clients[0],
        orders
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      return res.status(500).json({ error: 'Failed to fetch client' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      const data = req.body;
      const db = await getDb();

      // Get current client data
      const clients = await db.sql('SELECT * FROM clients WHERE id = ?', [id]);
      if (!clients || clients.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
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
        id
      ]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating client:', error);
      return res.status(500).json({ error: 'Failed to update client' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
