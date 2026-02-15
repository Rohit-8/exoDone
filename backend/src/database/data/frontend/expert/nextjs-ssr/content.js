// ============================================================================
// Next.js & SSR — Content
// ============================================================================

export const topic = {
  "name": "Next.js & SSR",
  "slug": "nextjs-ssr",
  "description": "Build production-grade apps with Next.js App Router — Server Components, data fetching, caching, and API routes.",
  "estimated_time": 220,
  "order_index": 10
};

export const lessons = [
  {
    title: "Next.js App Router & Server Components",
    slug: "nextjs-app-router",
    summary: "Understand the Next.js App Router, Server vs Client Components, and the new data fetching model.",
    difficulty_level: "expert",
    estimated_time: 45,
    order_index: 1,
    key_points: [
  "App Router uses the file system for routing — folders = routes",
  "Components are Server Components by default — add \"use client\" for client interactivity",
  "Server Components can directly fetch data (no API needed) and reduce client bundle size",
  "layout.tsx wraps pages and persists across navigations (no remounting)",
  "loading.tsx and error.tsx provide built-in loading and error states"
],
    content: `# Next.js App Router & Server Components

## App Router File Conventions

\`\`\`
app/
├── layout.tsx          // Root layout (persists across pages)
├── page.tsx            // Home page (/)
├── loading.tsx         // Loading UI (React Suspense)
├── error.tsx           // Error boundary
├── not-found.tsx       // 404 page
├── products/
│   ├── page.tsx        // /products
│   ├── [id]/
│   │   ├── page.tsx    // /products/123
│   │   └── loading.tsx // Loading state for product detail
│   └── layout.tsx      // Products layout
└── api/
    └── users/
        └── route.ts    // API route: GET/POST /api/users
\`\`\`

## Server Components (Default)

\`\`\`tsx
// This is a Server Component — it runs ONLY on the server
// No useState, no useEffect, no event handlers

async function ProductPage({ params }: { params: { id: string } }) {
  // Direct database/API access — no fetch needed from client
  const product = await db.query('SELECT * FROM products WHERE id = $1', [params.id]);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Price: \${product.price}</p>
      <AddToCartButton productId={product.id} /> {/* Client Component */}
    </div>
  );
}
\`\`\`

## Client Components

\`\`\`tsx
'use client'; // This directive makes it a Client Component

import { useState } from 'react';

function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    setAdded(true);
  };

  return (
    <button onClick={handleAdd}>
      {added ? '✓ Added' : 'Add to Cart'}
    </button>
  );
}
\`\`\`

## When to Use Which

| Feature | Server Component | Client Component |
|---|---|---|
| Fetch data | ✅ Direct (async/await) | ❌ Need useEffect or SWR |
| Use hooks | ❌ | ✅ |
| Event handlers | ❌ | ✅ |
| Use browser APIs | ❌ | ✅ |
| Reduces bundle size | ✅ | ❌ |
| Access secrets | ✅ | ❌ Never |

## SSR vs SSG vs ISR

\`\`\`tsx
// Static (SSG) — generated at build time
export const dynamic = 'force-static';

// Dynamic (SSR) — generated on each request
export const dynamic = 'force-dynamic';

// ISR — revalidate every 60 seconds
export const revalidate = 60;
\`\`\`
`,
  },
  {
    title: "Data Fetching, Caching & API Routes",
    slug: "nextjs-data-fetching",
    summary: "Implement SSR, SSG, ISR, and build REST API routes with the Next.js App Router.",
    difficulty_level: "expert",
    estimated_time: 40,
    order_index: 2,
    key_points: [
  "Server Components can use async/await directly for data fetching",
  "fetch() in Server Components is automatically deduplicated within a request",
  "Use revalidate option for Incremental Static Regeneration (ISR)",
  "Route Handlers (route.ts) replace API pages for backend endpoints",
  "Server Actions enable form handling without API routes"
],
    content: `# Data Fetching, Caching & API Routes

## Fetching in Server Components

\`\`\`tsx
// No useEffect, no loading state needed — it's server-rendered
async function PostList() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 }, // ISR: revalidate every hour
  }).then(res => res.json());

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
\`\`\`

## Caching Strategies

| Strategy | How | When |
|---|---|---|
| Static (SSG) | \`{ cache: 'force-cache' }\` | Blog posts, docs |
| ISR | \`{ next: { revalidate: 60 } }\` | Product pages |
| Dynamic (SSR) | \`{ cache: 'no-store' }\` | Dashboards, user data |

## API Route Handlers

\`\`\`tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page')) || 1;

  const posts = await db.post.findMany({
    skip: (page - 1) * 10,
    take: 10,
  });

  return NextResponse.json({ posts, page });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await db.post.create({ data: body });
  return NextResponse.json(post, { status: 201 });
}
\`\`\`

## Server Actions (Next.js 14+)

Server Actions let you run server-side code directly from forms — no API route needed:

\`\`\`tsx
// app/posts/new/page.tsx
async function createPost(formData: FormData) {
  'use server';
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  await db.post.create({ data: { title, content } });
  redirect('/posts');
}

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit">Create Post</button>
    </form>
  );
}
\`\`\`
`,
  },
];
