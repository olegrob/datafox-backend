import { dbService } from './dbService';
import { getDb } from './db';

// Export both the function and object versions for backward compatibility
export const woocommerceDb = {
  async get(query, params = []) {
    return dbService.queryOne(query, params);
  },
  
  async run(query, params = []) {
    return dbService.query(query, params);
  },
  
  async transaction(callback) {
    return dbService.transaction(callback);
  }
};

export const getWooCommerceDb = async () => {
  return woocommerceDb;
};

// Re-export getDb for backward compatibility
export { getDb };

// Helper function to initialize WooCommerce tables
export const initializeWooCommerceTables = async () => {
  await dbService.transaction(async (connection) => {
    // Create WooCommerce orders table
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
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create WooCommerce stats table
    await connection.sql(`
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

    // Create indexes
    await connection.sql('CREATE INDEX IF NOT EXISTS idx_woo_order_id ON woocommerce_orders(woo_order_id)');
    await connection.sql('CREATE INDEX IF NOT EXISTS idx_order_number ON woocommerce_orders(order_number)');
    await connection.sql('CREATE INDEX IF NOT EXISTS idx_status ON woocommerce_orders(status)');
  });
}; 