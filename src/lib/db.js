import { Database } from '@sqlitecloud/drivers';

let db = null;

export async function getDb() {
  if (db) return db;

  try {
    // Create a new Database instance with API key
    db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
    
    // Test the connection and use the users database
    await db.sql('USE DATABASE users;');
    console.log('Connected to users database');
    
    // Create users table if it doesn't exist
    await db.sql(`
      CREATE TABLE IF NOT EXISTS users_table (
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
      'SELECT * FROM users_table WHERE azure_id = ?',
      [azureId]
    );
    
    if (existingUser.length > 0) {
      // Update existing user
      await database.sql(
        `UPDATE users_table 
         SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE azure_id = ?`,
        [name, email, azureId]
      );
      console.log('Updated existing user:', email);
      return { ...existingUser[0], name, email };
    } else {
      // Create new user
      await database.sql(
        `INSERT INTO users_table (email, name, azure_id, role) 
         VALUES (?, ?, ?, 'Regular')`,
        [email, name, azureId]
      );
      
      const newUser = await database.sql(
        'SELECT * FROM users_table WHERE azure_id = ?',
        [azureId]
      );
      
      console.log('Created new user:', email);
      return newUser[0];
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw new Error('Failed to create/update user: ' + error.message);
  }
}

export async function getUserByAzureId(azureId) {
  try {
    const database = await getDb();
    const users = await database.sql(
      'SELECT * FROM users_table WHERE azure_id = ?',
      [azureId]
    );
    return users[0] || null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user: ' + error.message);
  }
}

export async function getUserRole(azureId) {
  try {
    const database = await getDb();
    const users = await database.sql(
      'SELECT role FROM users_table WHERE azure_id = ?',
      [azureId]
    );
    return users[0]?.role || 'Regular';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'Regular';
  }
}
