import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = await getDb();
    const { id } = req.query;

    const orders = await db.sql(
      'SELECT * FROM woocommerce_orders WHERE woo_order_id = ?',
      [id]
    );

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({ order: orders[0] });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
}
