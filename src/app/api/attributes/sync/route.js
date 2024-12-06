import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function POST(request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (step, processed, total, error = null) => {
    const update = {
      type: 'progress',
      step,
      processed,
      total,
      error
    };
    try {
      await writer.write(encoder.encode(JSON.stringify(update) + '\n'));
    } catch (e) {
      console.error('Error sending progress:', e);
    }
  };

  const response = new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream' }
  });

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      await sendProgress('Error: Unauthorized', 0, 100, 'Unauthorized');
      await writer.close();
      return response;
    }

    const db = await getDb();

    // Get products count first
    await sendProgress('Counting products...', 0, 100);
    const [{ count }] = await db.sql(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE product_attributes IS NOT NULL 
      AND product_attributes != ''
      AND product_attributes != '[]'
      AND product_attributes != '{}'
    `);

    if (count === 0) {
      await sendProgress('No products found with attributes', 0, 100, 'No products found');
      await writer.close();
      return response;
    }

    await sendProgress('Backing up translations...', 10, 100);
    const existingTranslations = await db.sql(`
      SELECT name, ee_translation, en_translation, ru_translation 
      FROM product_attributes 
      WHERE ee_translation != '' OR en_translation != '' OR ru_translation != ''
    `);

    await sendProgress('Dropping existing table...', 20, 100);
    await db.sql('DROP TABLE IF EXISTS product_attributes;');

    await sendProgress('Creating new table...', 30, 100);
    await db.sql(`
      CREATE TABLE product_attributes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        ee_translation TEXT DEFAULT '',
        en_translation TEXT DEFAULT '',
        ru_translation TEXT DEFAULT '',
        warehouse TEXT DEFAULT '',
        attribute_type TEXT DEFAULT 'text',
        is_active INTEGER DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await sendProgress('Fetching products...', 40, 100);
    const products = await db.sql(`
      SELECT id, product_attributes, warehouse 
      FROM products 
      WHERE product_attributes IS NOT NULL 
      AND product_attributes != ''
      AND product_attributes != '[]'
      AND product_attributes != '{}'
      LIMIT 1000
    `);

    await sendProgress(`Processing ${products.length} products...`, 50, 100);

    const attributeUsage = new Map();
    const warehouseMap = new Map();
    let processedCount = 0;

    for (const product of products) {
      try {
        if (product.product_attributes) {
          const attrs = JSON.parse(product.product_attributes);
          Object.keys(attrs).forEach(attrName => {
            const trimmedName = attrName.trim();
            if (trimmedName) {
              attributeUsage.set(trimmedName, (attributeUsage.get(trimmedName) || 0) + 1);
              if (product.warehouse) {
                warehouseMap.set(trimmedName, product.warehouse);
              }
            }
          });
          processedCount++;
        }
      } catch (e) {
        console.error(`Error processing product ${product.id}:`, e);
      }

      if (processedCount % 100 === 0) {
        await sendProgress(
          `Processed ${processedCount} of ${products.length} products...`,
          50 + Math.floor((processedCount / products.length) * 20),
          100
        );
      }
    }

    const attributes = Array.from(attributeUsage.entries())
      .map(([name, count]) => ({
        name,
        count,
        warehouse: warehouseMap.get(name) || ''
      }))
      .filter((attr, index, self) => 
        index === self.findIndex(a => a.name.toLowerCase() === attr.name.toLowerCase())
      );

    await sendProgress(`Inserting ${attributes.length} attributes...`, 70, 100);

    for (const attr of attributes) {
      try {
        await db.sql(`
          INSERT INTO product_attributes (name, usage_count, warehouse)
          VALUES (?, ?, ?);
        `, [attr.name, attr.count, attr.warehouse]);
      } catch (error) {
        if (!error.message.includes('UNIQUE constraint')) {
          console.error(`Error inserting attribute ${attr.name}:`, error);
        }
      }
    }

    if (existingTranslations.length > 0) {
      await sendProgress('Restoring translations...', 90, 100);
      for (const translation of existingTranslations) {
        try {
          await db.sql(`
            UPDATE product_attributes 
            SET ee_translation = ?, en_translation = ?, ru_translation = ?
            WHERE name = ?;
          `, [
            translation.ee_translation || '',
            translation.en_translation || '',
            translation.ru_translation || '',
            translation.name
          ]);
        } catch (error) {
          console.error(`Error restoring translations for ${translation.name}:`, error);
        }
      }
    }

    await sendProgress('Sync completed successfully', 100, 100);
  } catch (error) {
    console.error('Sync error:', error);
    await sendProgress('Error during sync', 0, 100, error.message);
  } finally {
    try {
      await writer.close();
    } catch (e) {
      console.error('Error closing writer:', e);
    }
  }

  return response;
}