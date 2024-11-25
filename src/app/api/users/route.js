import { Database } from '@sqlitecloud/drivers';
import { NextResponse } from 'next/server';

const db = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');

async function initializeUsersTable() {
  try {
    await db.sql('USE DATABASE products;');
    
    // Check if users table exists
    const tableExists = await db.sql(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users';
    `);
    
    if (tableExists.length === 0) {
      // Create users table if it doesn't exist
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
    }
  } catch (error) {
    console.error('Error initializing users table:', error);
    throw error;
  }
}

// Initialize the table when the module loads
initializeUsersTable().catch(console.error);

export async function GET(request) {
  try {
    await db.sql('USE DATABASE products;');
    const users = await db.sql('SELECT id, email, name, role FROM users;');
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, name, role = 'Regular', azure_id } = await request.json();
    
    await db.sql('USE DATABASE products;');
    
    const result = await db.sql(`
      INSERT INTO users (email, name, role, azure_id)
      VALUES (?, ?, ?, ?)
    `, [email, name, role, azure_id]);
    
    return NextResponse.json({ 
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, email, name, role } = await request.json();
    
    await db.sql('USE DATABASE products;');
    
    await db.sql(`
      UPDATE users 
      SET email = ?, name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [email, name, role, id]);
    
    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
