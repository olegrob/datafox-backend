import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse');

    const db = await getDb();
    console.log('Fetching products for warehouse:', warehouse);
    
    const products = await db.sql(`
      SELECT 
        id,
        product_id,
        name,
        regular_price as price,
        CAST(height AS DECIMAL(10,2)) as height,
        CAST(width AS DECIMAL(10,2)) as width,
        CAST(length AS DECIMAL(10,2)) as depth,
        CAST(weight AS DECIMAL(10,2)) as weight
      FROM products 
      WHERE warehouse = ? 
        AND height IS NOT NULL 
        AND width IS NOT NULL 
        AND length IS NOT NULL 
        AND weight IS NOT NULL
        AND CAST(height AS DECIMAL) > 0 
        AND CAST(width AS DECIMAL) > 0 
        AND CAST(length AS DECIMAL) > 0 
        AND CAST(weight AS DECIMAL) > 0
      LIMIT 5
    `, [warehouse]);

    console.log('Found products:', products);

    if (!products.length) {
      return NextResponse.json(
        { error: 'No products found with dimensions in this warehouse' },
        { status: 404 }
      );
    }

    // Map and validate the results
    const mappedProducts = products.map(product => {
      const mapped = {
        id: product.id,
        product_id: product.product_id,
        name: product.name,
        price: parseFloat(product.price),
        height: parseFloat(product.height),
        width: parseFloat(product.width),
        depth: parseFloat(product.depth),
        weight: parseFloat(product.weight)
      };
      console.log('Mapped product:', mapped);
      return mapped;
    });

    return NextResponse.json({ products: mappedProducts });
  } catch (error) {
    console.error('Error fetching warehouse products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch warehouse products', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
} 