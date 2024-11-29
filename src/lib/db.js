import { Database } from '@sqlitecloud/drivers';

let productsDb = null;
let syncDb = null;

export async function getDb(database = 'products') {
  try {
    // Return existing connection if available
    if (globalThis.db?.[database]) {
      return globalThis.db[database];
    }

    // Create new connection
    const db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
    await db.sql('USE DATABASE products;');

    // Check and create tables if needed
    const tables = await db.sql(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='table'
    `);
    const tableNames = tables.map(t => t.name);

    // Create shipping_templates table if it doesn't exist
    if (!tableNames.includes('shipping_templates')) {
      console.log('Creating shipping_templates table...');
      await db.sql(`
        CREATE TABLE shipping_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          provider TEXT NOT NULL,
          rules TEXT,
          size_code TEXT,
          min_weight DECIMAL(10,2),
          max_weight DECIMAL(10,2),
          min_volume DECIMAL(10,2),
          max_volume DECIMAL(10,2),
          base_fee DECIMAL(10,2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default DPD template
      const dpdTemplate = {
        sizes: [
          {
            code: 'XS',
            price: 2.65,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          },
          {
            code: 'S',
            price: 3.10,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          },
          {
            code: 'M',
            price: 4.15,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          },
          {
            code: 'L',
            price: 5.10,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          }
        ]
      };

      await db.sql(`
        INSERT INTO shipping_templates (name, provider, rules)
        VALUES (?, ?, ?)
      `, ['DPD Parcel Machine', 'DPD', JSON.stringify(dpdTemplate)]);
      
      console.log('Shipping templates table created with default DPD template');
    }

    // Create or update shipping_fees table
    if (!tableNames.includes('shipping_fees')) {
      console.log('Creating shipping_fees table...');
      await db.sql(`
        CREATE TABLE shipping_fees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          warehouse TEXT NOT NULL,
          size_code TEXT,
          min_weight DECIMAL(10,2),
          max_weight DECIMAL(10,2),
          min_volume DECIMAL(10,2),
          max_volume DECIMAL(10,2),
          base_fee DECIMAL(10,2) NOT NULL,
          additional_fee_percentage DECIMAL(5,2) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Shipping fees table created');
    } else {
      // Check if table needs migration
      const shippingTable = tables.find(t => t.name === 'shipping_fees');
      if (!shippingTable.sql.includes('size_code')) {
        console.log('Migrating shipping_fees table...');
        // Backup existing data
        const existingData = await db.sql('SELECT * FROM shipping_fees');
        
        // Drop and recreate table
        await db.sql('DROP TABLE shipping_fees');
        await db.sql(`
          CREATE TABLE shipping_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            warehouse TEXT NOT NULL,
            size_code TEXT,
            min_weight DECIMAL(10,2),
            max_weight DECIMAL(10,2),
            min_volume DECIMAL(10,2),
            max_volume DECIMAL(10,2),
            base_fee DECIMAL(10,2) NOT NULL,
            additional_fee_percentage DECIMAL(5,2) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Restore data if any exists
        if (existingData.length > 0) {
          for (const row of existingData) {
            await db.sql(`
              INSERT INTO shipping_fees (
                warehouse, base_fee, additional_fee_percentage,
                min_weight, max_weight, min_volume, max_volume
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              row.warehouse,
              row.base_fee,
              row.additional_fee_percentage,
              row.min_weight,
              row.max_weight,
              row.min_volume,
              row.max_volume
            ]);
          }
        }
        console.log('Shipping fees table migrated successfully');
      }
    }

    // Create users table if it doesn't exist
    if (!tableNames.includes('users')) {
      await db.sql(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'User',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created');
    }

    // Create sync_categories table if it doesn't exist
    if (!tableNames.includes('sync_categories')) {
      await db.sql(`
        CREATE TABLE sync_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_category TEXT NOT NULL,
          mapped_category TEXT,
          warehouse TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(original_category, warehouse)
        )
      `);
      console.log('Sync categories table created');
    }

    // Create products table if it doesn't exist
    if (!tableNames.includes('products')) {
      await db.sql(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT NOT NULL,
          warehouse TEXT NOT NULL,
          manufacturer TEXT,
          name TEXT,
          short_description TEXT,
          long_description TEXT,
          regular_price DECIMAL(10,2),
          sale_price DECIMAL(10,2),
          stock INTEGER,
          product_category TEXT,
          external_image_urls TEXT,
          product_attributes TEXT,
          warranty_period TEXT,
          wpsso_product_gtin13 TEXT,
          wpsso_product_mfr_part_no TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(product_id, warehouse)
        )
      `);
      console.log('Products table created');
    }

    // Store the connection globally
    if (!globalThis.db) {
      globalThis.db = {};
    }
    globalThis.db[database] = db;

    return db;
  } catch (error) {
    console.error('Error connecting to', database, 'database:', error);
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
