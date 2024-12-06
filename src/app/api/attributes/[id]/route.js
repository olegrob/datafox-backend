export const dynamic = 'force-dynamic';

// This tells Next.js that this route should be generated at build time
export async function generateStaticParams() {
  return [];
}

// ... existing code ... 