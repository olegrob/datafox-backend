const { Database } = require('@sqlitecloud/drivers');

const createSyncTable = async () => {
  try {
    const db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
    
    // Use the products database
    console.log('Using products database...');
    await db.sql('USE DATABASE products;');
    
    // Create the sync_categories table
    console.log('Creating sync_categories table...');
    await db.sql(`
      CREATE TABLE IF NOT EXISTS sync_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_category TEXT NOT NULL,
        mapped_category TEXT,
        warehouse TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(original_category, warehouse)
      );
    `);
    
    console.log('Successfully created sync_categories table in products database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createSyncTable();
