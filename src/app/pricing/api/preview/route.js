import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { product, templateId } = await request.json();

    console.log('Received request with:', { product, templateId });

    // First check if we have any templates
    const allTemplates = await db.sql('SELECT * FROM shipping_templates');
    console.log('All available templates:', allTemplates);

    // Get DPD template
    let template = (await db.sql(
      'SELECT * FROM shipping_templates WHERE provider = ?',
      ['DPD']
    ))[0];

    console.log('Found DPD template:', template);

    if (!template) {
      // If no template found, try to recreate it
      const dpdTemplate = {
        provider: 'DPD',
        sizes: [
          {
            code: 'XS',
            price: 2.65,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          },
          {
            code: 'S',
            price: 3.10,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          },
          {
            code: 'M',
            price: 4.15,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          },
          {
            code: 'L',
            price: 5.10,
            max_height: 61,
            max_width: 36.5,
            max_depth: 60,
            max_weight: 31.5
          }
        ]
      };

      await db.sql(`
        INSERT INTO shipping_templates (name, provider, rules)
        VALUES (?, ?, ?)
      `, ['DPD Parcel Machine', 'DPD', JSON.stringify(dpdTemplate)]);

      template = (await db.sql(
        'SELECT * FROM shipping_templates WHERE provider = ?',
        ['DPD']
      ))[0];

      if (!template) {
        return NextResponse.json(
          { error: 'Failed to create template' },
          { status: 500 }
        );
      }
    }

    let rules;
    try {
      rules = typeof template.rules === 'string' 
        ? JSON.parse(template.rules)
        : template.rules;
        
      console.log('Parsed rules:', rules);
    } catch (error) {
      console.error('Error parsing rules:', error);
      return NextResponse.json(
        { 
          error: 'Invalid template rules format',
          details: error.message,
          rawRules: template.rules
        },
        { status: 500 }
      );
    }

    if (!rules.sizes || !Array.isArray(rules.sizes)) {
      console.error('Invalid rules structure:', rules);
      return NextResponse.json(
        { error: 'Invalid template rules structure' },
        { status: 500 }
      );
    }

    // Sort sizes from smallest to largest by volume
    const sortedSizes = rules.sizes.sort((a, b) => {
      const volumeA = a.max_height * a.max_width * a.max_depth;
      const volumeB = b.max_height * b.max_width * b.max_depth;
      return volumeA - volumeB;
    });

    // Find appropriate size
    const appropriateSize = sortedSizes.find(size => {
      const productHeight = parseFloat(product.height) || 0;
      const productWidth = parseFloat(product.width) || 0;
      const productDepth = parseFloat(product.depth) || 0;
      const productWeight = parseFloat(product.weight) || 0;

      console.log('Checking size:', size);
      console.log('Against product dimensions:', {
        height: productHeight,
        width: productWidth,
        depth: productDepth,
        weight: productWeight
      });

      // Try all possible orientations
      const dimensions = [productHeight, productWidth, productDepth].sort((a, b) => a - b);
      const maxDims = [size.max_height, size.max_width, size.max_depth].sort((a, b) => a - b);

      const fits = dimensions[0] <= maxDims[0] &&
                   dimensions[1] <= maxDims[1] &&
                   dimensions[2] <= maxDims[2] &&
                   productWeight <= size.max_weight;

      console.log('Fits in this size?', fits);
      return fits;
    });

    if (!appropriateSize) {
      const error = `Product dimensions (${product.height}x${product.width}x${product.depth}cm, ${product.weight}kg) do not fit any package size. Available sizes: ${JSON.stringify(sortedSizes.map(s => ({
        code: s.code,
        max_dims: `${s.max_height}x${s.max_width}x${s.max_depth}cm`,
        max_weight: `${s.max_weight}kg`
      })))}`;
      console.log('No appropriate size found:', error);
      return NextResponse.json({ error });
    }

    console.log('Selected size:', appropriateSize);

    return NextResponse.json({
      size_code: appropriateSize.code,
      shipping_fee: appropriateSize.price
    });
  } catch (error) {
    console.error('Error calculating preview:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate preview',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 