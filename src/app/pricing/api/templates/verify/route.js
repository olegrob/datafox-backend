import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Get all templates
    const templates = await db.sql('SELECT * FROM shipping_templates');
    
    const verificationResults = templates.map(template => {
      try {
        const rules = JSON.parse(template.rules);
        return {
          id: template.id,
          name: template.name,
          provider: template.provider,
          rulesValid: true,
          parsedRules: rules
        };
      } catch (error) {
        return {
          id: template.id,
          name: template.name,
          provider: template.provider,
          rulesValid: false,
          error: error.message,
          rawRules: template.rules
        };
      }
    });

    return NextResponse.json({ templates: verificationResults });
  } catch (error) {
    console.error('Error verifying templates:', error);
    return NextResponse.json(
      { error: 'Failed to verify templates', details: error.message },
      { status: 500 }
    );
  }
} 