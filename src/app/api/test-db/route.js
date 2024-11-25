import { Database } from '@sqlitecloud/drivers';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');

  try {
    console.log('Connecting to database...');
    await db.sql('USE DATABASE products;');
    console.log('Connected successfully');

    // Check if users table exists
    const tableExists = await db.sql(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users';
    `);
    console.log('Table check result:', tableExists);

    if (tableExists.length === 0) {
      console.log('Creating users table...');
      await db.sql(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          role TEXT CHECK(role IN ('Admin', 'Regular')) DEFAULT 'Regular',
          azure_id TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
      
      // List all users
      const users = await db.sql('SELECT * FROM users;');
      console.log('Current users:', users);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tableExists: tableExists.length > 0
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    db.close();
  }
}
