import { getDb } from '@/lib/db';

export async function createWooCommerceOrdersTable() {
  const db = await getDb();
  
  const tableExists = await db.sql(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='woocommerce_orders'
  `);

  if (tableExists.length === 0) {
    await db.sql(`
      CREATE TABLE woocommerce_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        woo_order_id INTEGER NOT NULL,
        order_number TEXT,
        status TEXT,
        currency TEXT,
        date_created TEXT,
        date_modified TEXT,
        total TEXT,
        customer_id INTEGER,
        customer_note TEXT,
        billing JSON,
        shipping JSON,
        payment_method TEXT,
        payment_method_title TEXT,
        line_items JSON,
        shipping_lines JSON,
        tax_lines JSON,
        fee_lines JSON,
        coupon_lines JSON,
        refunds JSON,
        meta_data JSON,
        raw_data JSON,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await db.sql('CREATE INDEX idx_woo_order_id ON woocommerce_orders(woo_order_id)');
    await db.sql('CREATE INDEX idx_order_number ON woocommerce_orders(order_number)');
    await db.sql('CREATE INDEX idx_status ON woocommerce_orders(status)');
  }
} 