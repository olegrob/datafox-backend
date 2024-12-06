import { getDb } from '@/lib/db';

export async function createOffersTable() {
  const db = await getDb();
  
  // Check if table exists
  const tableExists = await db.sql(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' AND name='offers'
  `);

  if (tableExists.length === 0) {
    await db.sql(`
      CREATE TABLE offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'draft',
        email_sent_to TEXT,
        email_sent_at DATETIME,
        products TEXT NOT NULL,
        total_price DECIMAL(10,2),
        markup_enabled BOOLEAN DEFAULT false,
        shipping_enabled BOOLEAN DEFAULT false
      )
    `);

    console.log('Offers table created successfully');
  }
} 