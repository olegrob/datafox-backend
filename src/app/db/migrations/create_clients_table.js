import { getDb } from '@/lib/db';

export async function createClientsTable() {
  const db = await getDb();
  
  const tableExists = await db.sql(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='clients'
  `);

  if (tableExists.length === 0) {
    await db.sql(`
      CREATE TABLE clients (
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
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_order_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.sql('CREATE INDEX idx_client_email ON clients(email)');
    await db.sql('CREATE INDEX idx_client_woo_id ON clients(woo_customer_id)');
  }
} 