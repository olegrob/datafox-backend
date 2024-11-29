import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const templates = await db.sql('SELECT * FROM shipping_templates');

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching shipping templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { warehouse, templateId } = await request.json();

    const template = await db.sql(
      'SELECT * FROM shipping_templates WHERE id = ?',
      [templateId]
    );

    if (!template.length) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Apply template logic here...

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error applying shipping template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 