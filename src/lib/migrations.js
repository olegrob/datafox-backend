import { dbService } from './dbService';

export async function initializeTables() {
  try {
    await dbService.transaction(async (connection) => {
      // Create customers table
      await connection.sql(`
        CREATE TABLE IF NOT EXISTS customers (
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

      // Create customer indexes
      await connection.sql('CREATE INDEX IF NOT EXISTS idx_woo_customer_id ON customers(woo_customer_id)');
      await connection.sql('CREATE INDEX IF NOT EXISTS idx_email ON customers(email)');

      // Create orders table
      await connection.sql(`
        CREATE TABLE IF NOT EXISTS woocommerce_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          woo_order_id INTEGER NOT NULL UNIQUE,
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
          synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(customer_id) REFERENCES customers(id)
        )
      `);

      // Create order indexes
      await connection.sql('CREATE INDEX IF NOT EXISTS idx_woo_order_id ON woocommerce_orders(woo_order_id)');
      await connection.sql('CREATE INDEX IF NOT EXISTS idx_order_number ON woocommerce_orders(order_number)');
      await connection.sql('CREATE INDEX IF NOT EXISTS idx_status ON woocommerce_orders(status)');

      // Create product attributes table
      await connection.sql(`
        CREATE TABLE IF NOT EXISTS product_attributes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value TEXT,
          product_id INTEGER,
          warehouse TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for product attributes
      await connection.sql('CREATE INDEX IF NOT EXISTS idx_attr_name ON product_attributes(name)');
      await connection.sql('CREATE INDEX IF NOT EXISTS idx_attr_product ON product_attributes(product_id)');
    });

    console.log('All tables initialized successfully');
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  }
} 