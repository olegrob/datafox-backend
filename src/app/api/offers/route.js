import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const offers = await db.sql('SELECT * FROM offers ORDER BY created_at DESC');
    
    // Ensure offers is always an array
    const offersArray = Array.isArray(offers) ? offers : [];
    
    return NextResponse.json({ offers: offersArray });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers', details: error.message },
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
    const {
      name,
      description,
      products,
      totalPrice,
      markupEnabled,
      shippingEnabled
    } = await request.json();

    const result = await db.sql(`
      INSERT INTO offers (
        name,
        description,
        created_by,
        products,
        total_price,
        markup_enabled,
        shipping_enabled,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      description,
      session.user.email,
      JSON.stringify(products),
      totalPrice,
      markupEnabled,
      shippingEnabled,
      'draft'
    ]);

    return NextResponse.json({
      success: true,
      offerId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
} 