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

    const data = await request.json();
    const { attributes } = data;

    if (!Array.isArray(attributes)) {
      return NextResponse.json({ error: 'Invalid attributes format' }, { status: 400 });
    }

    const db = await getDb();
    const stats = {
      total: attributes.length,
      updated: 0,
      unchanged: 0,
      failed: 0,
      errors: []
    };

    for (const attr of attributes) {
      try {
        // First, get the current attribute state
        const [currentAttr] = await db.sql(`
          SELECT 
            ee_translation, 
            en_translation, 
            ru_translation, 
            attribute_type, 
            is_active
          FROM product_attributes 
          WHERE name = ? AND warehouse = ?
        `, [attr.original_name, attr.warehouse]);

        if (!currentAttr) {
          stats.failed++;
          stats.errors.push({
            attribute: attr.original_name,
            error: 'Attribute not found'
          });
          continue;
        }

        // Check if there are any actual changes
        const hasChanges = 
          (attr.ee_translation !== undefined && attr.ee_translation !== currentAttr.ee_translation) ||
          (attr.en_translation !== undefined && attr.en_translation !== currentAttr.en_translation) ||
          (attr.ru_translation !== undefined && attr.ru_translation !== currentAttr.ru_translation) ||
          (attr.attribute_type !== undefined && attr.attribute_type !== currentAttr.attribute_type) ||
          (attr.is_active !== undefined && attr.is_active !== currentAttr.is_active);

        if (!hasChanges) {
          stats.unchanged++;
          continue;
        }

        // Update only if there are changes
        await db.sql(`
          UPDATE product_attributes 
          SET 
            ee_translation = COALESCE(?, ee_translation),
            en_translation = COALESCE(?, en_translation),
            ru_translation = COALESCE(?, ru_translation),
            attribute_type = COALESCE(?, attribute_type),
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
          WHERE name = ? AND warehouse = ?
        `, [
          attr.ee_translation,
          attr.en_translation,
          attr.ru_translation,
          attr.attribute_type,
          attr.is_active,
          attr.original_name,
          attr.warehouse
        ]);

        stats.updated++;
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          attribute: attr.original_name,
          error: error.message
        });
      }
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in attributes import API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
