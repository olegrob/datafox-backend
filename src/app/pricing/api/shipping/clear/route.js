import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    await db.sql('DELETE FROM shipping_fees');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing shipping fees:', error);
    return NextResponse.json(
      { error: 'Failed to clear shipping fees' },
      { status: 500 }
    );
  }
} 