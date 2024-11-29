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
    const fees = await db.sql(`
      SELECT * FROM shipping_fees 
      ORDER BY warehouse, min_weight
    `);

    return NextResponse.json({ fees });
  } catch (error) {
    console.error('Error fetching shipping fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping fees' },
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
    const { warehouse, base_fee } = await request.json();

    if (!warehouse || !base_fee) {
      return NextResponse.json(
        { error: 'Warehouse and shipping fee are required' },
        { status: 400 }
      );
    }

    // Replace existing fee if one exists for this warehouse
    await db.sql(`
      INSERT OR REPLACE INTO shipping_fees (warehouse, base_fee)
      VALUES (?, ?)
    `, [warehouse, base_fee]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating shipping fee:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping fee' },
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
    const feeId = searchParams.get('id');

    if (!feeId) {
      return NextResponse.json(
        { error: 'Fee ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    await db.sql('DELETE FROM shipping_fees WHERE id = ?', [feeId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipping fee:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping fee' },
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
    const { id, warehouse, base_fee } = await request.json();

    if (!id || !warehouse || !base_fee) {
      return NextResponse.json(
        { error: 'ID, warehouse and base fee are required' },
        { status: 400 }
      );
    }

    await db.sql(`
      UPDATE shipping_fees 
      SET warehouse = ?, base_fee = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [warehouse, base_fee, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating shipping fee:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping fee' },
      { status: 500 }
    );
  }
} 