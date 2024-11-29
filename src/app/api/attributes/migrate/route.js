import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Drop existing table
    await db.sql(`DROP TABLE IF EXISTS product_attributes`);

    // Create new table with correct schema
    await db.sql(`
      CREATE TABLE product_attributes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_name TEXT NOT NULL,
        warehouse TEXT NOT NULL,
        ee_translation TEXT,
        en_translation TEXT,
        ru_translation TEXT,
        attribute_type TEXT DEFAULT 'text',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(original_name, warehouse)
      )
    `);

    return NextResponse.json({ 
      success: true,
      message: 'Migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 