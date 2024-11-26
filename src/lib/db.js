import { Database } from '@sqlitecloud/drivers';

let productsDb = null;
let syncDb = null;

export async function getDb(database = 'products') {
  try {
    if (database === 'products' && productsDb) return productsDb;
    if (database === 'sync' && syncDb) return syncDb;

    const db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
    
    // Use the specified database
    await db.sql(`USE DATABASE ${database};`);
    console.log(`Connected to ${database} database`);
    
    if (database === 'products') {
      productsDb = db;
      
      // Create users table if it doesn't exist
      await db.sql(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          role TEXT CHECK(role IN ('Admin', 'Regular')) DEFAULT 'Regular',
          azure_id TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Users table created/verified');

      // Create sync_categories table
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
      console.log('Sync categories table created/verified');

      // Create products table if it doesn't exist
      await db.sql(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          manufacturer TEXT NOT NULL,
          short_description TEXT,
          product_category TEXT,
          warehouse TEXT,
          price DECIMAL(10,2) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Products table created/verified');

      // Add sample data if the products table is empty
      const count = await db.sql('SELECT COUNT(*) as count FROM products');
      if (count[0].count === 0) {
        await db.sql(`
          INSERT INTO products (name, manufacturer, product_category, warehouse, price, quantity) VALUES
          ('Laptop X1', 'TechCorp', 'Electronics', 'Warehouse A', 999.99, 50),
          ('Smartphone Y2', 'TechCorp', 'Electronics', 'Warehouse A', 599.99, 100),
          ('Coffee Maker', 'HomeGoods', 'Appliances', 'Warehouse B', 79.99, 30),
          ('Desk Chair', 'FurnitureCo', 'Furniture', 'Warehouse B', 199.99, 20),
          ('Gaming Mouse', 'TechCorp', 'Electronics', 'Warehouse A', 49.99, 0),
          ('Wireless Keyboard', 'TechCorp', 'Electronics', 'Warehouse A', 79.99, 45),
          ('Blender Pro', 'HomeGoods', 'Appliances', 'Warehouse B', 129.99, 0),
          ('Office Desk', 'FurnitureCo', 'Furniture', 'Warehouse B', 299.99, 15)
        `);
        console.log('Sample products data inserted');
      }
    } else if (database === 'sync') {
      syncDb = db;
    }

    return db;
  } catch (error) {
    console.error(`Error connecting to ${database} database:`, error);
    throw error;
  }
}

export async function createOrUpdateUser({ email, name, azureId }) {
  try {
    const database = await getDb();
    console.log('Creating/updating user:', { email, name, azureId });
    
    // Check if user exists
    const existingUser = await database.sql(
      'SELECT * FROM users WHERE azure_id = ?',
      [azureId]
    );
    
    if (existingUser.length > 0) {
      // Update existing user
      await database.sql(
        `UPDATE users 
         SET name = ?, updated_at = CURRENT_TIMESTAMP
         WHERE azure_id = ?`,
        [name, azureId]
      );
      return existingUser[0];
    } else {
      // Create new user
      await database.sql(
        `INSERT INTO users (email, name, azure_id) 
         VALUES (?, ?, ?)`,
        [email, name, azureId]
      );
      const [newUser] = await database.sql(
        'SELECT * FROM users WHERE azure_id = ?',
        [azureId]
      );
      return newUser;
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

export async function getUserByAzureId(azureId) {
  try {
    const database = await getDb();
    const users = await database.sql(
      'SELECT * FROM users WHERE azure_id = ?',
      [azureId]
    );
    return users[0] || null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

export async function getUserRole(azureId) {
  try {
    const user = await getUserByAzureId(azureId);
    return user ? user.role : null;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
}
