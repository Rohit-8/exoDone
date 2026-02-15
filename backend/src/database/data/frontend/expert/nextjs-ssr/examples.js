// ============================================================================
// Next.js & SSR — Code Examples
// ============================================================================

const examples = {
  'nextjs-app-router': [
    {
      title: "Full Next.js Route with Loading & Error States",
      description: "A complete route implementation with all Next.js conventions.",
      language: "typescript",
      code: `// app/products/[id]/page.tsx — Server Component
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { AddToCart } from './AddToCart';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  return { title: product?.name || 'Product Not Found' };
}

export default async function ProductPage({ params }: Props) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { reviews: { take: 5, orderBy: { createdAt: 'desc' } } },
  });

  if (!product) notFound();

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">\${product.price}</p>
      <AddToCart productId={product.id} />
      <section>
        <h2>Reviews</h2>
        {product.reviews.map((r) => (
          <div key={r.id}><p>{r.comment}</p><span>{r.rating}★</span></div>
        ))}
      </section>
    </article>
  );
}

// app/products/[id]/loading.tsx
export default function Loading() {
  return <div className="skeleton-loader"><div className="h-8 w-64 bg-gray-200 animate-pulse" /></div>;
}

// app/products/[id]/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  );
}`,
      explanation: "This shows the complete Next.js pattern: Server Component for data fetching, dynamic metadata for SEO, notFound() for 404s, loading.tsx for streaming, and error.tsx for error boundaries.",
      order_index: 1,
    },
  ],
  'nextjs-data-fetching': [
    {
      title: "Complete CRUD API Route",
      description: "A full RESTful API route handler with authentication.",
      language: "typescript",
      code: `// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

interface Params {
  params: { id: string };
}

// GET /api/posts/:id
export async function GET(request: NextRequest, { params }: Params) {
  const post = await db.post.findUnique({
    where: { id: params.id },
    include: { author: { select: { name: true } } },
  });

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PUT /api/posts/:id
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const post = await db.post.update({
    where: { id: params.id },
    data: { title: body.title, content: body.content, updatedAt: new Date() },
  });

  return NextResponse.json(post);
}

// DELETE /api/posts/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.post.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}`,
      explanation: "Each HTTP method is a named export. The params object provides route parameters. Authentication is checked before mutations.",
      order_index: 1,
    },
  ],
};

export default examples;
