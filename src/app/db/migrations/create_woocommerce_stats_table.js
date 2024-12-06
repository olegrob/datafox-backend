import { getDb } from '@/lib/db';

export async function createWooCommerceStatsTable() {
  try {
    const db = await getDb();
    
    await db.sql(`
      CREATE TABLE IF NOT EXISTS woocommerce_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period INTEGER NOT NULL,
        orders INTEGER NOT NULL,
        revenue DECIMAL(10,2) NOT NULL,
        average_order_value DECIMAL(10,2) NOT NULL,
        products_sold INTEGER NOT NULL,
        orders_change DECIMAL(5,2),
        revenue_change DECIMAL(5,2),
        average_order_value_change DECIMAL(5,2),
        products_sold_change DECIMAL(5,2),
        recent_orders JSON,
        recent_transactions JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('WooCommerce stats table verified');
  } catch (error) {
    console.error('Error creating WooCommerce stats table:', error);
    throw error;
  }
} 