import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const rules = await db.sql(`
      SELECT * FROM pricing_rules 
      ORDER BY priority DESC, created_at DESC
    `);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing rules' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const data = await request.json();
    
    const {
      name,
      warehouse,
      min_price,
      max_price,
      markup_percentage,
      priority
    } = data;

    if (!name || !markup_percentage) {
      return NextResponse.json(
        { error: 'Name and markup percentage are required' },
        { status: 400 }
      );
    }

    const result = await db.sql(`
      INSERT INTO pricing_rules (
        name,
        warehouse,
        min_price,
        max_price,
        markup_percentage,
        priority
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [name, warehouse, min_price, max_price, markup_percentage, priority || 0]);

    return NextResponse.json({
      success: true,
      ruleId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    await db.sql('DELETE FROM pricing_rules WHERE id = ?', [ruleId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { id, name, warehouse, min_price, max_price, markup_percentage, priority } = await request.json();

    if (!id || !name || !markup_percentage) {
      return NextResponse.json(
        { error: 'ID, name and markup percentage are required' },
        { status: 400 }
      );
    }

    await db.sql(`
      UPDATE pricing_rules 
      SET name = ?, 
          warehouse = ?,
          min_price = ?,
          max_price = ?,
          markup_percentage = ?,
          priority = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, warehouse, min_price, max_price, markup_percentage, priority || 0, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing rule' },
      { status: 500 }
    );
  }
} 