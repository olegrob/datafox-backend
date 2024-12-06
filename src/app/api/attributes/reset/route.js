import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Delete all attributes
    await db.sql('DELETE FROM product_attributes');

    return NextResponse.json({ 
      success: true, 
      message: 'All attributes have been deleted successfully' 
    });
  } catch (error) {
    console.error('Error resetting attributes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
