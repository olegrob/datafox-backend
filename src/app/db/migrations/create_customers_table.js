import { getDb } from '@/lib/db';

export async function createCustomersTable() {
  const db = await getDb();
  
  const tableExists = await db.sql(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='customers'
  `);

  if (tableExists.length === 0) {
    await db.sql(`
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        woo_customer_id INTEGER,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        company TEXT,
        phone TEXT,
        billing_address JSON,
        shipping_address JSON,
        meta_data JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_order_date DATETIME,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0
      )
    `);

    // Create indexes
    await db.sql('CREATE INDEX idx_woo_customer_id ON customers(woo_customer_id)');
    await db.sql('CREATE INDEX idx_email ON customers(email)');
  }
} 