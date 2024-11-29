import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';

export async function POST(request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (step, processed, total) => {
    const update = {
      type: 'progress',
      step,
      processed,
      total
    };
    await writer.write(encoder.encode(JSON.stringify(update) + '\n'));
  };

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error('Unauthorized');
    }

    const db = await getDb();

    // Backup existing translations
    await sendProgress('Backing up existing translations...', 0, 100);
    const existingTranslations = await db.sql(`
      SELECT name, ee_translation, en_translation, ru_translation 
      FROM product_attributes 
      WHERE ee_translation != '' OR en_translation != '' OR ru_translation != ''
    `);

    // Drop existing table if it exists
    await sendProgress('Dropping existing table...', 10, 100);
    await db.sql('DROP TABLE IF EXISTS product_attributes;');

    // Create new table with all required columns
    await sendProgress('Creating new table with updated schema...', 20, 100);
    await db.sql(`
      CREATE TABLE product_attributes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        ee_translation TEXT DEFAULT '',
        en_translation TEXT DEFAULT '',
        ru_translation TEXT DEFAULT '',
        attribute_type TEXT DEFAULT 'text',
        is_active INTEGER DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get all products with their attributes
    await sendProgress('Fetching products...', 30, 100);
    const products = await db.sql(`
      SELECT id, product_attributes 
      FROM products 
      WHERE product_attributes IS NOT NULL 
      AND product_attributes != ''
      AND product_attributes != '[]'
      AND product_attributes != '{}'
    `);

    await sendProgress(`Processing ${products.length} products...`, 40, 100);

    // Process products in memory for better performance
    const attributeUsage = new Map();
    let processedCount = 0;
    
    // Process in larger batches for better performance
    const batchSize = 10000;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length));
      
      batch.forEach(product => {
        if (product.product_attributes) {
          try {
            const attrs = JSON.parse(product.product_attributes);
            Object.keys(attrs).forEach(attrName => {
              attributeUsage.set(attrName, (attributeUsage.get(attrName) || 0) + 1);
            });
            processedCount++;
          } catch (e) {
            console.error(`Error parsing attributes for product ${product.id}:`, e);
          }
        }
      });

      const progress = Math.min(40 + Math.floor((i / products.length) * 30), 70);
      await sendProgress(
        `Processed ${processedCount} of ${products.length} products...`,
        progress,
        100
      );
    }

    // Sort attributes by usage count
    const sortedAttributes = Array.from(attributeUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ 
        name: name.trim(), // Trim whitespace
        count 
      }))
      // Remove duplicates by name (case-insensitive)
      .filter((attr, index, self) => 
        index === self.findIndex(a => 
          a.name.toLowerCase() === attr.name.toLowerCase()
        )
      );

    await sendProgress(`Inserting ${sortedAttributes.length} attributes...`, 70, 100);

    // Insert attributes in batches to avoid SQLite parameter limit
    const insertBatchSize = 500;
    for (let i = 0; i < sortedAttributes.length; i += insertBatchSize) {
      const batch = sortedAttributes.slice(i, Math.min(i + insertBatchSize, sortedAttributes.length));
      
      // Insert each attribute individually to handle duplicates gracefully
      for (const attr of batch) {
        try {
          await db.sql(`
            INSERT INTO product_attributes (name, usage_count)
            VALUES (?, ?);
          `, [attr.name, attr.count]);
        } catch (error) {
          if (!error.message.includes('UNIQUE constraint failed')) {
            // Only log non-duplicate errors
            console.error(`Error inserting attribute: ${attr.name}:`, error);
          }
          // Try to update instead if insert failed
          try {
            await db.sql(`
              UPDATE product_attributes 
              SET usage_count = usage_count + ?
              WHERE name = ?;
            `, [attr.count, attr.name]);
          } catch (updateError) {
            console.error(`Error updating attribute: ${attr.name}:`, updateError);
          }
        }
      }

      const progress = Math.min(70 + Math.floor((i / sortedAttributes.length) * 20), 90);
      await sendProgress(
        `Inserted ${Math.min(i + insertBatchSize, sortedAttributes.length)} of ${sortedAttributes.length} attributes...`,
        progress,
        100
      );
    }

    // Restore translations
    if (existingTranslations.length > 0) {
      await sendProgress('Restoring translations...', 90, 100);
      const updateBatchSize = 100;
      for (let i = 0; i < existingTranslations.length; i += updateBatchSize) {
        const batch = existingTranslations.slice(i, Math.min(i + updateBatchSize, existingTranslations.length));
        
        for (const translation of batch) {
          await db.sql(`
            UPDATE product_attributes 
            SET ee_translation = ?, en_translation = ?, ru_translation = ?
            WHERE name = ?;
          `, [
            translation.ee_translation,
            translation.en_translation,
            translation.ru_translation,
            translation.name
          ]);
        }
      }
    }

    await sendProgress('Sync completed successfully', 100, 100);
  } catch (error) {
    console.error('Error in sync:', error);
    await sendProgress(`Error: ${error.message}`, 0, 100);
  } finally {
    await writer.close();
  }

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}