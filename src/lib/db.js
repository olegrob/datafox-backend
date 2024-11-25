import { Database } from '@sqlitecloud/drivers';

let db = null;

export async function getDb() {
  if (db) return db;

  try {
    // Create a new Database instance with API key
    db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
    
    // Test the connection and use the products database
    await db.sql('USE DATABASE products;');
    console.log('Connected to products database');
    
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

    // Create products table if it doesn't exist
    await db.sql(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        short_description TEXT,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Products table created/verified');

    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database: ' + error.message);
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
    console.error('Error in createOrUpdateUser:', error);
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
    console.error('Error in getUserByAzureId:', error);
    throw error;
  }
}

export async function getUserRole(azureId) {
  try {
    const user = await getUserByAzureId(azureId);
    return user?.role || 'Regular';
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return 'Regular';
  }
}
