// ============================================================================
// Next.js & SSR — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  "nextjs-app-router": [
    {
      title: "Complete App Router Route — layout, page, loading, error, not-found, and template with Streaming",
      description:
        "A comprehensive Next.js App Router implementation showing every special file convention in action: root layout with HTML/body tags, a dashboard layout with sidebar, a Server Component page that fetches data, loading.tsx for automatic Suspense streaming, error.tsx with reset capability, not-found.tsx for missing resources, and template.tsx for per-navigation animations — demonstrating how they compose together in a real dashboard feature.",
      language: "typescript",
      code: `// ═══════════════════════════════════════════════════════════════════════════
// FILE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════
//
// app/
// ├── layout.tsx           ← Root layout (HTML shell)
// ├── dashboard/
// │   ├── layout.tsx       ← Dashboard layout (sidebar, auth)
// │   ├── template.tsx     ← Re-mounts on every navigation (animations)
// │   ├── loading.tsx      ← Suspense fallback while page streams
// │   ├── error.tsx        ← Error boundary for dashboard segment
// │   ├── not-found.tsx    ← 404 for dashboard resources
// │   ├── page.tsx         ← /dashboard (overview)
// │   └── [teamId]/
// │       └── page.tsx     ← /dashboard/:teamId (team detail)

// ═══════════════════════════════════════════════════════════════════════════
// 1. ROOT LAYOUT — replaces _app.tsx and _document.tsx
// ═══════════════════════════════════════════════════════════════════════════
// app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Acme Dashboard', template: '%s | Acme' },
  description: 'Production-grade dashboard built with Next.js App Router',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Providers (theme, auth) wrap children here */}
        <main>{children}</main>
      </body>
    </html>
  );
}
// KEY POINTS:
// - Only ONE root layout per app — it MUST have <html> and <body>
// - Persists across ALL navigations (never unmounts)
// - Metadata title.template adds suffix to all child page titles
// - Font optimization: next/font prevents FOUT (flash of unstyled text)

// ═══════════════════════════════════════════════════════════════════════════
// 2. DASHBOARD LAYOUT — nested layout with sidebar
// ═══════════════════════════════════════════════════════════════════════════
// app/dashboard/layout.tsx

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth guard — Server Component can check auth directly
  const session = await getServerSession();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen">
      {/* Sidebar is a Client Component for toggle state.
          But it receives Server-rendered NavLinks as children (donut pattern). */}
      <Sidebar user={session.user}>
        <NavLinks />   {/* Server Component — zero client JS */}
      </Sidebar>
      <section className="flex-1 overflow-y-auto p-6">
        {children}     {/* page.tsx or nested layout renders here */}
      </section>
    </div>
  );
}
// KEY POINTS:
// - Layouts persist — navigating /dashboard → /dashboard/settings
//   does NOT remount the sidebar (preserves scroll, state)
// - Auth redirect happens on the server before any HTML is sent
// - The Sidebar uses the donut pattern: Client wrapper + Server children

// ═══════════════════════════════════════════════════════════════════════════
// 3. TEMPLATE — re-mounts on every navigation (unlike layout)
// ═══════════════════════════════════════════════════════════════════════════
// app/dashboard/template.tsx

'use client';
import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
// KEY DIFFERENCE from layout.tsx:
// - template.tsx creates a NEW instance on every navigation
// - Fresh state: useState resets, useEffect runs again
// - Use for: page transition animations, per-page analytics logging,
//   resetting scroll position, resetting uncontrolled form state

// ═══════════════════════════════════════════════════════════════════════════
// 4. LOADING — automatic Suspense boundary
// ═══════════════════════════════════════════════════════════════════════════
// app/dashboard/loading.tsx

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-lg" />
    </div>
  );
}
// WHAT NEXT.JS DOES WITH THIS FILE:
// Automatically wraps page.tsx in <Suspense fallback={<DashboardLoading />}>
// The loading skeleton shows while the async Server Component (page.tsx) resolves.
// This enables streaming — the layout + skeleton are sent immediately.

// ═══════════════════════════════════════════════════════════════════════════
// 5. ERROR BOUNDARY — catches errors in segment + children
// ═══════════════════════════════════════════════════════════════════════════
// app/dashboard/error.tsx

'use client'; // MUST be a Client Component (needs onClick for reset)

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service (Sentry, LogRocket, etc.)
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div role="alert" className="p-6 bg-red-50 rounded-lg">
      <h2 className="text-xl font-bold text-red-800">Dashboard Error</h2>
      <p className="text-red-600 mt-2">{error.message}</p>
      {error.digest && (
        <p className="text-sm text-gray-500 mt-1">Error ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Try Again
      </button>
    </div>
  );
}
// KEY POINTS:
// - Catches errors in page.tsx and all child segments
// - Does NOT catch errors in layout.tsx (use global-error.tsx for that)
// - error.digest is a hash for server errors (hides sensitive details in prod)
// - reset() re-renders the segment — if the error was transient, it recovers

// ═══════════════════════════════════════════════════════════════════════════
// 6. NOT-FOUND — triggered by notFound()
// ═══════════════════════════════════════════════════════════════════════════
// app/dashboard/not-found.tsx

import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">Team Not Found</h2>
      <p className="text-gray-600 mt-2">
        The team you're looking for doesn't exist or you don't have access.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. PAGE — the actual route content (Server Component)
// ═══════════════════════════════════════════════════════════════════════════
// app/dashboard/[teamId]/page.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/database';
import type { Metadata } from 'next';
import { TeamMembers } from './TeamMembers';

interface Props {
  params: { teamId: string };
}

// Dynamic metadata — fetches data, deduped with the page component
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await db.team.findUnique({ where: { id: params.teamId } });
  if (!team) return { title: 'Team Not Found' };
  return { title: team.name };  // Rendered as "Team Alpha | Acme" (template)
}

export default async function TeamPage({ params }: Props) {
  const team = await db.team.findUnique({
    where: { id: params.teamId },
    include: { projects: { take: 5, orderBy: { updatedAt: 'desc' } } },
  });

  if (!team) notFound();   // Triggers dashboard/not-found.tsx

  return (
    <div>
      <h1 className="text-3xl font-bold">{team.name}</h1>
      <p className="text-gray-600">{team.description}</p>

      {/* Projects render immediately (data already fetched) */}
      <section className="mt-6">
        <h2>Recent Projects</h2>
        {team.projects.map((p) => (
          <div key={p.id}>{p.name} — {p.status}</div>
        ))}
      </section>

      {/* Members stream in separately (independent Suspense boundary) */}
      <Suspense fallback={<div className="animate-pulse h-40 bg-gray-100" />}>
        <TeamMembers teamId={team.id} />
      </Suspense>
    </div>
  );
}

// RENDERING FLOW:
// 1. Request: /dashboard/abc123
// 2. DashboardLayout checks auth → shows sidebar immediately
// 3. Template mounts → fade-in animation starts
// 4. loading.tsx skeleton shows while page.tsx awaits db.team.findUnique
// 5. Page resolves → replaces skeleton with team data
// 6. <TeamMembers> starts streaming → replaces its Suspense fallback
// 7. If db.team returns null → notFound() → dashboard/not-found.tsx
// 8. If db throws → error.tsx catches it with reset button
`,
      explanation: `This example demonstrates the complete App Router file convention hierarchy and how each special file contributes to the rendering pipeline. Key architecture decisions illustrated: (1) Root layout sets up the HTML shell and fonts — it never remounts. (2) Dashboard layout handles auth and sidebar — persists across page changes within /dashboard. (3) Template re-mounts on navigation for page transition animations. (4) loading.tsx provides instant feedback via streaming while the async page resolves. (5) error.tsx catches runtime errors with a retry mechanism. (6) not-found.tsx handles notFound() calls gracefully. (7) The page uses generateMetadata for dynamic SEO, Suspense for progressive streaming, and the donut pattern (Server Components inside Client Component sidebar). The rendering flow comment at the bottom traces the exact sequence Next.js follows from request to fully rendered page.`,
      order_index: 1,
    },
    {
      title: "Server vs Client Components — Serialization Boundary, Donut Pattern, and Composition Rules",
      description:
        "A detailed example showing when and how to split Server and Client Components — the serialization boundary (what can/cannot cross), the donut pattern for minimizing client bundle size, common mistakes (importing Server Components into Client Components), and the correct patterns for passing data between the two worlds.",
      language: "typescript",
      code: `// ═══════════════════════════════════════════════════════════════════════════
// SERVER COMPONENT — default in App Router (no directive needed)
// ═══════════════════════════════════════════════════════════════════════════
// app/products/page.tsx

import { db } from '@/lib/database';
import { ProductFilters } from '@/components/ProductFilters'; // Client
import { ProductCard } from '@/components/ProductCard';       // Server

export default async function ProductsPage() {
  // ✅ Direct database access — this code never ships to the client
  const products = await db.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // ✅ Access environment variables safely
  const apiKey = process.env.STRIPE_SECRET_KEY; // Never exposed to client

  return (
    <div>
      <h1>Products</h1>

      {/* ✅ DONUT PATTERN: Client Component wraps Server content */}
      <ProductFilters>
        {/* These Server Components are passed as children — they are NOT
            pulled into the client bundle. The Client Component receives
            them as pre-rendered React nodes (the RSC payload). */}
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductFilters>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENT — opted in with "use client"
// ═══════════════════════════════════════════════════════════════════════════
// components/ProductFilters.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProductFiltersProps {
  children: React.ReactNode;  // ← Server Components passed as children
}

export function ProductFilters({ children }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [category, setCategory] = useState(
    searchParams.get('category') || 'all'
  );

  function handleFilter(newCategory: string) {
    setCategory(newCategory);
    startTransition(() => {
      // Update URL → triggers Server Component re-render
      const params = new URLSearchParams(searchParams);
      params.set('category', newCategory);
      router.push('?' + params.toString());
    });
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['all', 'electronics', 'clothing', 'books'].map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            className={category === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'}
          >
            {cat}
          </button>
        ))}
        {isPending && <span className="animate-spin">⟳</span>}
      </div>

      {/* Server-rendered product cards appear here */}
      <div className="grid grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER COMPONENT — zero client JS
// ═══════════════════════════════════════════════════════════════════════════
// components/ProductCard.tsx  (NO "use client" — remains Server Component)

import { db } from '@/lib/database';

export async function ProductCard({ product }) {
  // ✅ Can await async calls — this is a Server Component
  const reviewCount = await db.review.count({
    where: { productId: product.id },
  });

  return (
    <div className="border rounded-lg p-4">
      <h3>{product.name}</h3>
      <p>\${product.price}</p>
      <span>{reviewCount} reviews</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SERIALIZATION BOUNDARY — what CAN and CANNOT cross Server → Client
// ═══════════════════════════════════════════════════════════════════════════

// ✅ SERIALIZABLE PROPS (can pass from Server → Client Component)
// - Primitives: string, number, boolean, null, undefined, bigint
// - Plain objects: { key: 'value' }
// - Arrays: [1, 2, 3]
// - Date objects
// - Map and Set
// - TypedArrays (Uint8Array, etc.)
// - FormData
// - Promises (for use with React.use())
// - React elements: <ServerComponent /> (as JSX / children)

// ❌ NOT SERIALIZABLE (build error if passed as props)
// - Functions: () => {}, function() {}, class methods
// - Class instances: new MyClass(), Prisma client, DB connection
// - Symbols: Symbol('key')
// - DOM nodes
// - Closures over non-serializable values

// ═══════════════════════════════════════════════════════════════════════════
// COMMON MISTAKES
// ═══════════════════════════════════════════════════════════════════════════

// ❌ MISTAKE 1: Importing Server Component INTO Client Component
// components/ClientWrapper.tsx
// 'use client';
// import { ProductCard } from './ProductCard'; // ← This makes ProductCard
//                                               // a Client Component too!
// The "use client" boundary is infectious downward — everything imported
// by a Client Component becomes a Client Component.

// ✅ FIX: Pass as children (donut pattern) or render slot props
// <ClientWrapper>
//   <ProductCard />    ← Stays a Server Component
// </ClientWrapper>

// ❌ MISTAKE 2: Passing functions as props
// <ClientButton onClick={() => deleteProduct(id)} />
// Error: Functions cannot be passed from Server to Client Components

// ✅ FIX: Use Server Actions
// <form action={deleteProduct}>
//   <input type="hidden" name="id" value={id} />
//   <DeleteButton />   ← Client Component with useFormStatus
// </form>

// ❌ MISTAKE 3: Using hooks in Server Components
// export default async function Page() {
//   const [count, setCount] = useState(0);  // ← Runtime error!
// }

// ✅ FIX: Extract interactive parts into a Client Component
// <Page>  (Server: fetches data)
//   <Counter initialCount={data.count} />  (Client: manages state)
// </Page>
`,
      explanation: `This example illustrates the critical architectural decision in App Router apps: deciding where to draw the Server/Client boundary. The donut pattern (ProductFilters wrapping ProductCards as children) is the most important pattern — it keeps the interactive filter buttons in a Client Component while keeping the data-heavy product cards as Server Components with zero client JS. The serialization boundary section serves as a quick reference for what can cross from Server to Client. The common mistakes section addresses the three most frequent interview questions: (1) the "use client" directive is infectious — importing into a Client Component converts Server Components, (2) functions can't cross the boundary — use Server Actions instead, (3) hooks can't be used in Server Components — extract into Client Component children.`,
      order_index: 2,
    },
    {
      title: "Parallel Routes, Intercepting Routes, and Route Groups — Advanced Routing Patterns",
      description:
        "A production-ready example demonstrating three advanced App Router routing features: parallel routes with @slots for dashboard sections with independent loading/error states, intercepting routes for Instagram-style photo modals, and route groups for separate marketing vs dashboard layouts — all within a single cohesive file structure.",
      language: "typescript",
      code: `// ═══════════════════════════════════════════════════════════════════════════
// PARALLEL ROUTES — @folder convention for named slots
// ═══════════════════════════════════════════════════════════════════════════
//
// FILE STRUCTURE:
// app/
// ├── layout.tsx           ← Receives @metrics and @activity as props
// ├── page.tsx             ← Main dashboard content
// ├── @metrics/
// │   ├── page.tsx         ← Metrics widget (slot)
// │   ├── loading.tsx      ← Independent skeleton for metrics
// │   ├── error.tsx        ← Independent error boundary
// │   └── default.tsx      ← Fallback when route doesn't match
// ├── @activity/
// │   ├── page.tsx         ← Activity feed (slot)
// │   ├── loading.tsx      ← Independent skeleton for activity
// │   └── default.tsx
// └── default.tsx          ← Fallback for children slot

// app/layout.tsx — receives parallel route slots as named props
import type { ReactNode } from 'react';

export default function DashboardLayout({
  children,    // Default slot (page.tsx)
  metrics,     // @metrics slot
  activity,    // @activity slot
}: {
  children: ReactNode;
  metrics: ReactNode;
  activity: ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Main content — takes 8 columns */}
      <main className="col-span-8">{children}</main>

      {/* Right sidebar — stacked widgets */}
      <aside className="col-span-4 space-y-6">
        {metrics}      {/* Has its own loading.tsx → shows skeleton independently */}
        {activity}     {/* Has its own loading.tsx → shows skeleton independently */}
      </aside>
    </div>
  );
}
// KEY INSIGHT: Each @slot loads independently.
// If @metrics takes 3s and @activity takes 1s:
// - @activity shows content after 1s
// - @metrics shows its loading.tsx skeleton for 3s, then content
// - children (main page) has its own loading state

// app/@metrics/page.tsx — Server Component (async, heavy data)
export default async function MetricsWidget() {
  const metrics = await fetch('https://api.example.com/metrics', {
    next: { revalidate: 300 },  // ISR: refresh every 5 minutes
  }).then((r) => r.json());

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold">Key Metrics</h3>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <span className="text-sm text-gray-500">Revenue</span>
          <p className="text-2xl font-bold">\${metrics.revenue.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Users</span>
          <p className="text-2xl font-bold">{metrics.users.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// app/@metrics/loading.tsx — independent loading state
export default function MetricsLoading() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="h-5 w-24 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// app/@metrics/error.tsx — independent error boundary
'use client';
export default function MetricsError({ error, reset }) {
  return (
    <div className="bg-red-50 rounded-lg p-4">
      <p className="text-red-600">Failed to load metrics</p>
      <button onClick={reset} className="text-sm text-blue-600 underline">
        Retry
      </button>
    </div>
  );
}
// If @metrics fails, @activity and children still render normally!

// app/@metrics/default.tsx — fallback for unmatched sub-routes
export default function MetricsDefault() {
  return null;   // Don't render anything if the route doesn't match this slot
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERCEPTING ROUTES — Instagram-style modal pattern
// ═══════════════════════════════════════════════════════════════════════════
//
// FILE STRUCTURE:
// app/
// ├── feed/
// │   ├── page.tsx                    ← Photo feed with thumbnails
// │   └── (..)photo/[id]/            ← Intercepts /photo/:id from /feed
// │       └── page.tsx               ← Shows modal overlay
// ├── photo/[id]/
// │   └── page.tsx                    ← Full photo page (direct navigation)
// └── @modal/
//     └── default.tsx                 ← Empty default (no modal initially)

// app/feed/page.tsx — Feed page with thumbnails
import Link from 'next/link';

export default async function FeedPage() {
  const photos = await fetch('https://api.example.com/photos', {
    next: { revalidate: 60 },
  }).then((r) => r.json());

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <Link key={photo.id} href={\\\`/photo/\\\${photo.id}\\\`}>
          {/* Clicking this Link from /feed triggers the intercepting route */}
          <img
            src={photo.thumbnailUrl}
            alt={photo.alt}
            className="aspect-square object-cover rounded hover:opacity-80"
          />
        </Link>
      ))}
    </div>
  );
}

// app/feed/(..)photo/[id]/page.tsx — INTERCEPTED route (modal)
// (..) means "intercept one level up" → intercepts /photo/[id]
import { Modal } from '@/components/Modal';

export default async function InterceptedPhoto({
  params,
}: {
  params: { id: string };
}) {
  const photo = await fetch(
    \\\`https://api.example.com/photos/\\\${params.id}\\\`
  ).then((r) => r.json());

  return (
    <Modal>
      <img src={photo.url} alt={photo.alt} className="max-h-[80vh]" />
      <div className="p-4">
        <h2 className="text-xl font-bold">{photo.title}</h2>
        <p className="text-gray-600">{photo.caption}</p>
        <span className="text-sm text-gray-400">{photo.likes} likes</span>
      </div>
    </Modal>
  );
}
// BEHAVIOR:
// - User on /feed clicks a photo → URL changes to /photo/42
//   but this INTERCEPTED page shows (modal overlay on top of feed)
// - User refreshes /photo/42 → the REAL /photo/42 full page loads
// - User shares /photo/42 link → recipient sees the full page

// app/photo/[id]/page.tsx — REAL photo page (direct nav / hard refresh)
export default async function PhotoPage({
  params,
}: {
  params: { id: string };
}) {
  const photo = await fetch(
    \\\`https://api.example.com/photos/\\\${params.id}\\\`
  ).then((r) => r.json());

  return (
    <article className="max-w-4xl mx-auto py-8">
      <img src={photo.url} alt={photo.alt} className="w-full rounded-lg" />
      <h1 className="text-3xl font-bold mt-4">{photo.title}</h1>
      <p className="text-lg text-gray-600 mt-2">{photo.caption}</p>
      <div className="flex items-center gap-4 mt-4">
        <span>{photo.likes} likes</span>
        <span>{photo.comments.length} comments</span>
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE GROUPS — organize without affecting URLs
// ═══════════════════════════════════════════════════════════════════════════
//
// FILE STRUCTURE:
// app/
// ├── (marketing)/              ← Group: stripped from URL
// │   ├── layout.tsx            ← Centered layout, public navbar, footer
// │   ├── page.tsx              ← / (homepage)
// │   ├── about/page.tsx        ← /about
// │   └── pricing/page.tsx      ← /pricing
// │
// ├── (app)/                    ← Group: different layout entirely
// │   ├── layout.tsx            ← Sidebar layout, auth required
// │   ├── dashboard/page.tsx    ← /dashboard
// │   └── settings/page.tsx     ← /settings

// app/(marketing)/layout.tsx — public-facing layout
export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <nav className="max-w-6xl mx-auto flex justify-between">
          <span className="font-bold text-xl">Acme</span>
          <div className="flex gap-4">
            <a href="/about">About</a>
            <a href="/pricing">Pricing</a>
            <a href="/dashboard" className="bg-blue-600 text-white px-4 py-1 rounded">
              Dashboard →
            </a>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-12">{children}</main>
      <footer className="border-t px-6 py-8 text-center text-gray-500">
        © 2025 Acme Inc.
      </footer>
    </div>
  );
}

// app/(app)/layout.tsx — authenticated app layout
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function AppLayout({ children }) {
  const session = await getServerSession();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r p-4">
        <nav className="space-y-2">
          <a href="/dashboard">Dashboard</a>
          <a href="/settings">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

// RESULT:
// - /          → MarketingLayout + (marketing)/page.tsx
// - /about     → MarketingLayout + (marketing)/about/page.tsx
// - /pricing   → MarketingLayout + (marketing)/pricing/page.tsx
// - /dashboard → AppLayout + (app)/dashboard/page.tsx
// - /settings  → AppLayout + (app)/settings/page.tsx
//
// The (marketing) and (app) folder names are NOT in the URL.
// Each group has completely separate layouts, loading, and error files.
`,
      explanation: `This example covers three advanced routing patterns that frequently appear in senior-level interviews: (1) Parallel routes with @slots enable dashboard-style layouts where widgets load independently — if the metrics API is slow, the activity feed and main content still render immediately, each with their own error boundary so one failing widget doesn't break the page. (2) Intercepting routes with (..) syntax power the Instagram photo pattern — clicking a photo from the feed shows a modal (intercepted route) while the URL updates to /photo/42; refreshing or sharing that URL loads the full page instead of the modal. (3) Route groups with (folderName) let you have completely different layouts for public marketing pages vs authenticated app pages without affecting URLs — the (marketing) and (app) folders are stripped from the URL path.`,
      order_index: 3,
    },
  ],
  "nextjs-data-fetching": [
    {
      title: "Complete Data Fetching Patterns — SSG, SSR, ISR, Parallel Fetching, and Request Deduplication",
      description:
        "A comprehensive example showing all four rendering strategies in Next.js App Router (SSG, SSR, ISR, CSR), parallel vs sequential data fetching with Promise.all, request deduplication with React cache(), Suspense streaming for dependent data, and the fetch() options (cache, revalidate, tags) that control each strategy.",
      language: "typescript",
      code: `// ═══════════════════════════════════════════════════════════════════════════
// 1. STATIC (SSG) — built at build time, cached forever
// ═══════════════════════════════════════════════════════════════════════════
// app/docs/page.tsx

export default async function DocsPage() {
  // Default fetch behavior = force-cache (static)
  // This page is pre-rendered at build time and served as static HTML
  const docs = await fetch('https://api.example.com/docs').then(r => r.json());

  return (
    <nav>
      {docs.map((doc) => (
        <a key={doc.slug} href={\\\`/docs/\\\${doc.slug}\\\`}>{doc.title}</a>
      ))}
    </nav>
  );
}

// Pre-render dynamic routes at build time (replaces getStaticPaths)
// app/docs/[slug]/page.tsx
export async function generateStaticParams() {
  const docs = await fetch('https://api.example.com/docs').then(r => r.json());
  return docs.map((doc) => ({ slug: doc.slug }));
  // Returns: [{ slug: 'intro' }, { slug: 'api-ref' }, ...]
}

export default async function DocPage({ params }: { params: { slug: string } }) {
  const doc = await fetch(\\\`https://api.example.com/docs/\\\${params.slug}\\\`).then(r => r.json());
  return <article dangerouslySetInnerHTML={{ __html: doc.htmlContent }} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SSR — rendered on every request (dynamic)
// ═══════════════════════════════════════════════════════════════════════════
// app/dashboard/page.tsx

import { cookies } from 'next/headers';

export default async function DashboardPage() {
  // Using cookies() makes the route dynamic — rendered per-request
  const session = cookies().get('session')?.value;

  // cache: 'no-store' ensures fresh data on every request
  const [user, notifications] = await Promise.all([
    fetch('https://api.example.com/me', {
      cache: 'no-store',
      headers: { Authorization: \\\`Bearer \\\${session}\\\` },
    }).then(r => r.json()),

    fetch('https://api.example.com/notifications', {
      cache: 'no-store',
      headers: { Authorization: \\\`Bearer \\\${session}\\\` },
    }).then(r => r.json()),
  ]);
  // ✅ Promise.all — both fetches run in parallel (300ms instead of 600ms)

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <span>{notifications.unread} unread notifications</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ISR — static with time-based revalidation
// ═══════════════════════════════════════════════════════════════════════════
// app/blog/page.tsx

export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 },   // Revalidate every 1 hour
  }).then(r => r.json());

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <a href={\\\`/blog/\\\${post.slug}\\\`}>{post.title}</a>
          <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
        </li>
      ))}
    </ul>
  );
}
// HOW ISR WORKS (stale-while-revalidate):
// 1. First request → generates static HTML + caches it
// 2. Requests within 3600s → served from cache (instant)
// 3. First request AFTER 3600s → serves stale cache to user,
//    triggers background regeneration
// 4. Next request → gets freshly generated page

// ═══════════════════════════════════════════════════════════════════════════
// 4. REQUEST DEDUPLICATION with React cache()
// ═══════════════════════════════════════════════════════════════════════════
// lib/data.ts

import { cache } from 'react';
import { db } from '@/lib/database';

// Wrap database calls in cache() for automatic deduplication
// within a single render pass (NOT across requests)
export const getUser = cache(async (id: string) => {
  console.log('DB query for user:', id);  // Logs ONCE per render
  return db.user.findUnique({
    where: { id },
    include: { profile: true },
  });
});

export const getTeam = cache(async (teamId: string) => {
  return db.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
});

// app/layout.tsx — calls getUser
export default async function Layout({ children }) {
  const user = await getUser('user-123');  // DB query runs HERE
  return (
    <div>
      <nav>Hello, {user.name}</nav>
      {children}
    </div>
  );
}

// app/page.tsx — also calls getUser (DEDUPED — no second DB query)
export default async function Page() {
  const user = await getUser('user-123');  // Returns cached result from layout
  return <h1>Dashboard for {user.name}</h1>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. SUSPENSE STREAMING for dependent data
// ═══════════════════════════════════════════════════════════════════════════
// app/profile/page.tsx

import { Suspense } from 'react';
import { getUser } from '@/lib/data';

export default async function ProfilePage() {
  // This must resolve first (other data depends on user.id)
  const user = await getUser('user-123');

  return (
    <div>
      {/* Sent immediately — user data already resolved */}
      <h1>{user.name}'s Profile</h1>
      <p>{user.email}</p>

      {/* Independent Suspense boundaries — stream as they resolve */}
      <div className="grid grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100" />}>
          <UserPosts userId={user.id} />
        </Suspense>

        <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100" />}>
          <UserActivity userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

// Each component fetches its own data — they stream independently
async function UserPosts({ userId }: { userId: string }) {
  const posts = await db.post.findMany({
    where: { authorId: userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <section>
      <h2>Recent Posts</h2>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </section>
  );
}

async function UserActivity({ userId }: { userId: string }) {
  // Simulating a slow endpoint — doesn't block UserPosts
  const activity = await fetch(
    \\\`https://api.example.com/activity/\\\${userId}\\\`,
    { cache: 'no-store' }
  ).then(r => r.json());

  return (
    <section>
      <h2>Recent Activity</h2>
      {activity.map((event) => (
        <div key={event.id}>{event.action} — {event.timestamp}</div>
      ))}
    </section>
  );
}

// STREAMING TIMELINE:
// T=0ms   → HTML shell + <h1> + skeletons sent to browser
// T=150ms → UserPosts resolves → streamed in, replaces first skeleton
// T=800ms → UserActivity resolves → streamed in, replaces second skeleton
// User sees meaningful content at 0ms (header) and progressively more
`,
      explanation: `This example covers all data fetching patterns in a single reference: (1) SSG with default force-cache and generateStaticParams for pre-rendering dynamic routes. (2) SSR with cache: 'no-store' and cookies() for per-request personalized data, using Promise.all for parallel fetching. (3) ISR with next: { revalidate } and the stale-while-revalidate flow explained step by step. (4) React cache() for deduplicating database queries across Server Components in the same render pass — critical for layouts that share data with pages. (5) Suspense streaming for dependent data — the user profile resolves first, then posts and activity stream in independently. The streaming timeline at the bottom illustrates exactly when each piece of content appears in the browser.`,
      order_index: 1,
    },
    {
      title: "Route Handlers and Server Actions — Full CRUD with Validation, Auth, Revalidation, useFormStatus, and useOptimistic",
      description:
        "A production-grade example implementing complete CRUD operations using Route Handlers (app/api/*/route.ts for external consumers) and Server Actions (for form mutations with progressive enhancement), including input validation with Zod, authentication checks, on-demand revalidation with revalidatePath/revalidateTag, useFormStatus for pending states, and useOptimistic for instant UI updates.",
      language: "typescript",
      code: `// ═══════════════════════════════════════════════════════════════════════════
// 1. ROUTE HANDLERS — REST API for external consumers
// ═══════════════════════════════════════════════════════════════════════════
// app/api/todos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/database';
import { z } from 'zod';

const TodoSchema = z.object({
  text: z.string().min(1, 'Text is required').max(200),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// GET /api/todos — cached by default (static) if no dynamic input
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') ?? '1');

  const where = {
    userId: session.user.id,
    ...(status !== 'all' && { completed: status === 'completed' }),
  };

  const [todos, total] = await Promise.all([
    db.todo.findMany({
      where,
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
    db.todo.count({ where }),
  ]);

  return NextResponse.json({
    todos,
    pagination: { page, totalPages: Math.ceil(total / 20), total },
  });
}

// POST /api/todos — always dynamic (mutations)
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = TodoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const todo = await db.todo.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      completed: false,
    },
  });

  return NextResponse.json(todo, { status: 201 });
}

// app/api/todos/[id]/route.ts — dynamic route handler
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const existing = await db.todo.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updated = await db.todo.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await db.todo.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.todo.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SERVER ACTIONS — for form mutations with progressive enhancement
// ═══════════════════════════════════════════════════════════════════════════
// app/actions/todo.ts

'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/database';
import { z } from 'zod';

const AddTodoSchema = z.object({
  text: z.string().min(1).max(200),
  priority: z.enum(['low', 'medium', 'high']),
});

export async function addTodo(formData: FormData) {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');

  const parsed = AddTodoSchema.safeParse({
    text: formData.get('text'),
    priority: formData.get('priority'),
  });

  if (!parsed.success) {
    // Return error object instead of throwing (better UX)
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  await db.todo.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      completed: false,
    },
  });

  // Invalidate cached data so the todo list re-fetches
  revalidatePath('/todos');           // Purge Full Route + Data Cache for /todos
  revalidateTag('user-todos');        // Purge all fetch(..., { next: { tags: ['user-todos'] } })

  return { success: true };
}

export async function toggleTodo(id: string) {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');

  const todo = await db.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) throw new Error('Not found');

  await db.todo.update({
    where: { id },
    data: { completed: !todo.completed },
  });

  revalidatePath('/todos');
}

export async function deleteTodo(id: string) {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');

  await db.todo.delete({ where: { id } });
  revalidatePath('/todos');
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. TODO LIST UI — useFormStatus + useOptimistic
// ═══════════════════════════════════════════════════════════════════════════
// app/todos/page.tsx (Server Component — fetches data)

import { db } from '@/lib/database';
import { getServerSession } from '@/lib/auth';
import { TodoList } from './TodoList';

export default async function TodosPage() {
  const session = await getServerSession();
  const todos = await db.todo.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold">My Todos</h1>
      {/* Pass server data to Client Component for interactivity */}
      <TodoList initialTodos={todos} />
    </div>
  );
}

// components/TodoList.tsx (Client Component — interactive)
'use client';

import { useOptimistic, useRef } from 'react';
import { addTodo, toggleTodo, deleteTodo } from '@/app/actions/todo';
import { SubmitButton } from './SubmitButton';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: string;
  pending?: boolean;
}

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  // useOptimistic: show new todo immediately, revert on error
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    initialTodos,
    (state: Todo[], newTodo: Todo) => [newTodo, ...state]
  );

  async function handleAddTodo(formData: FormData) {
    const text = formData.get('text') as string;
    const priority = formData.get('priority') as string;

    // Optimistic update — show immediately with pending style
    addOptimisticTodo({
      id: crypto.randomUUID(),  // Temporary ID
      text,
      priority,
      completed: false,
      pending: true,            // Flag for styling
    });

    formRef.current?.reset();   // Clear form immediately

    // Server action — if this fails, optimistic update reverts
    const result = await addTodo(formData);
    if (!result.success) {
      // Handle validation errors
      console.error('Validation errors:', result.error);
    }
  }

  return (
    <div>
      {/* Form with Server Action — works even without JavaScript! */}
      <form ref={formRef} action={handleAddTodo} className="flex gap-2 my-4">
        <input
          name="text"
          placeholder="What needs to be done?"
          required
          className="flex-1 border rounded px-3 py-2"
        />
        <select name="priority" defaultValue="medium" className="border rounded px-2">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <SubmitButton />
      </form>

      {/* Todo items with optimistic state */}
      <ul className="space-y-2">
        {optimisticTodos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 p-3 border rounded"
            style={{ opacity: todo.pending ? 0.5 : 1 }}
          >
            <button
              onClick={() => toggleTodo(todo.id)}
              className={todo.completed ? 'line-through text-gray-400' : ''}
            >
              {todo.completed ? '☑' : '☐'} {todo.text}
            </button>
            <span className="text-xs text-gray-500">{todo.priority}</span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-auto text-red-500 text-sm"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// components/SubmitButton.tsx — useFormStatus for pending state
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  // useFormStatus MUST be in a child component of <form>, not the form itself
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {pending ? 'Adding...' : 'Add'}
    </button>
  );
}
// KEY ARCHITECTURAL DECISIONS:
//
// 1. Route Handlers vs Server Actions:
//    - Use Route Handlers for external API consumers (mobile apps, webhooks)
//    - Use Server Actions for internal form mutations (progressive enhancement)
//
// 2. revalidatePath vs revalidateTag:
//    - revalidatePath('/todos') — purges ONE specific path
//    - revalidateTag('user-todos') — purges ALL fetches with that tag
//    - Use tags when one mutation affects multiple pages
//
// 3. useOptimistic timing:
//    - addOptimisticTodo runs SYNCHRONOUSLY (instant UI update)
//    - addTodo (server action) runs ASYNCHRONOUSLY
//    - If server action fails, React automatically reverts the optimistic state
//
// 4. useFormStatus placement:
//    - MUST be in a CHILD component of <form> — not in the component
//      that renders the <form> itself
//    - Returns { pending, data, method, action }
`,
      explanation: `This example demonstrates the complete mutation story in Next.js App Router. Route Handlers (route.ts) provide a REST API for external consumers — they handle GET/POST/PATCH/DELETE with Zod validation, auth checks, and proper HTTP status codes. Server Actions ('use server') handle form mutations with progressive enhancement — forms work even before JavaScript loads. The key architectural insight: use Route Handlers when you need a REST API (mobile apps, external integrations), use Server Actions when you need form submissions (internal app mutations). The UI demonstrates useOptimistic for instant feedback (the new todo appears immediately at 50% opacity) and useFormStatus for the submit button's pending state. The revalidation section shows both revalidatePath (single page) and revalidateTag (multiple pages affected by one mutation).`,
      order_index: 2,
    },
    {
      title: "Caching Deep Dive — Data Cache, Full Route Cache, Router Cache, and Opt-Out Strategies",
      description:
        "A detailed example exploring all three Next.js caching layers with real code: Data Cache (server-side fetch caching with tags and revalidation), Full Route Cache (static HTML + RSC payload generation), and Router Cache (client-side in-memory cache). Shows how to opt out of each layer, debug caching issues, and the exact invalidation flow when revalidatePath/revalidateTag are called.",
      language: "typescript",
      code: `// ═══════════════════════════════════════════════════════════════════════════
// NEXT.JS CACHING LAYERS — Complete Reference
// ═══════════════════════════════════════════════════════════════════════════
//
// REQUEST FLOW:
//
// Browser → Router Cache (client) → Full Route Cache (server) → Render
//                                                                 ↓
//                                         Data Cache (server) ← fetch()
//
// ─────────────────────────────────────────────────────────────────────────
// LAYER 1: DATA CACHE — caches individual fetch() responses
// ─────────────────────────────────────────────────────────────────────────

// app/products/page.tsx

// STATIC (cached indefinitely) — default behavior
export default async function ProductsPage() {
  // This fetch result is stored in the Data Cache on the server
  // Key: URL + headers + body → Value: Response
  const products = await fetch('https://api.example.com/products');
  // Equivalent to: fetch(url, { cache: 'force-cache' })

  return <ProductGrid products={await products.json()} />;
}
// Data Cache behavior:
// - Persists across deployments (not cleared on redeploy by default)
// - Only purged by: revalidateTag(), revalidatePath(), or time expiry

// ISR — cached with time-based revalidation
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: {
      revalidate: 3600,              // Revalidate after 1 hour
      tags: ['posts', 'blog-page'],  // Tag for on-demand revalidation
    },
  });

  return <PostList posts={await posts.json()} />;
}
// ISR flow (stale-while-revalidate):
// T=0      → Cache MISS → fetch from origin → cache response → render
// T=0-3600 → Cache HIT → serve cached response (instant)
// T=3601   → Cache STALE → serve stale response to user,
//            trigger background revalidation
// T=3602   → Background fetch completes → update cache
// T=3603   → Next request gets fresh data

// DYNAMIC — no caching (SSR per request)
export default async function DashboardPage() {
  const data = await fetch('https://api.example.com/me', {
    cache: 'no-store',               // Skip Data Cache entirely
  });

  return <Dashboard data={await data.json()} />;
}
// Every request goes to the origin API — no caching at all

// ─────────────────────────────────────────────────────────────────────────
// LAYER 2: FULL ROUTE CACHE — caches complete rendered pages
// ─────────────────────────────────────────────────────────────────────────

// Static routes are rendered at BUILD TIME → cached as HTML + RSC Payload
// The Full Route Cache stores TWO things:
// 1. HTML — for the initial page load (fast first paint)
// 2. RSC Payload — for client-side navigations (no full page reload)

// STATIC ROUTE — rendered at build time, cached on server
// app/about/page.tsx
export const metadata = { title: 'About Us' };

export default function AboutPage() {
  return <div>This page is built at deploy time and cached forever.</div>;
}
// Full Route Cache: HTML + RSC Payload cached until next deploy
// or until revalidatePath('/about') is called

// DYNAMIC ROUTE — NOT cached in Full Route Cache
// app/profile/page.tsx
import { cookies } from 'next/headers';

export default async function ProfilePage() {
  const session = cookies().get('session');  // Dynamic function → no route cache
  // ...
}
// Using cookies(), headers(), or searchParams opts the route out of
// the Full Route Cache entirely. Rendered fresh on every request.

// Force a route to be static or dynamic regardless of data fetching:
export const dynamic = 'force-static';   // Always static (error if using cookies())
export const dynamic = 'force-dynamic';  // Always SSR (even if all data is cached)

// ─────────────────────────────────────────────────────────────────────────
// LAYER 3: ROUTER CACHE — client-side in-memory cache
// ─────────────────────────────────────────────────────────────────────────

// The Router Cache stores RSC Payloads on the CLIENT for visited routes
// Enables instant back/forward navigation without a server request

// Default durations:
// - Dynamic routes: 30 seconds
// - Static routes: 5 minutes
// After expiration, the next navigation triggers a new server request

// ═══════════════════════════════════════════════════════════════════════════
// OPT-OUT STRATEGIES — how to bypass each cache layer
// ═══════════════════════════════════════════════════════════════════════════

// OPT OUT of Data Cache (specific fetch)
await fetch(url, { cache: 'no-store' });

// OPT OUT of Data Cache (entire route)
export const fetchCache = 'force-no-store';  // All fetches in this route skip cache

// OPT OUT of Full Route Cache (entire route)
export const dynamic = 'force-dynamic';

// OPT OUT of Router Cache (client-side)
'use client';
import { useRouter } from 'next/navigation';
function RefreshButton() {
  const router = useRouter();
  return <button onClick={() => router.refresh()}>Refresh</button>;
  // router.refresh() clears the Router Cache for the current route
  // and triggers a new server render without a full page reload
}

// ═══════════════════════════════════════════════════════════════════════════
// ON-DEMAND REVALIDATION — the invalidation flow
// ═══════════════════════════════════════════════════════════════════════════

// app/actions.ts
'use server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function publishPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') } });

  // OPTION A: Revalidate by path
  revalidatePath('/blog');
  // What this does:
  // 1. Purges Data Cache entries for fetches made during /blog render
  // 2. Purges Full Route Cache for /blog (HTML + RSC payload)
  // 3. Next request to /blog triggers a fresh render
  // 4. Does NOT clear Router Cache on other users' browsers

  // OPTION B: Revalidate by tag (more granular)
  revalidateTag('posts');
  // What this does:
  // 1. Purges ALL Data Cache entries tagged with 'posts'
  //    (could affect /blog, /dashboard, /feed — any page that fetched with
  //     { next: { tags: ['posts'] } })
  // 2. Purges Full Route Cache for routes that used those fetches
  // 3. More surgical — only affects fetches with that specific tag

  // OPTION C: Revalidate layout (cascade to all child routes)
  revalidatePath('/blog', 'layout');
  // Purges /blog AND all nested routes (/blog/[slug], /blog/category/[cat])
}

// ═══════════════════════════════════════════════════════════════════════════
// TAG-BASED CACHING STRATEGY — real-world pattern
// ═══════════════════════════════════════════════════════════════════════════

// Assign tags to fetches based on the data they return
// app/blog/page.tsx
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },         // Tag: all posts
});

// app/blog/[slug]/page.tsx
const post = await fetch(\\\`https://api.example.com/posts/\\\${slug}\\\`, {
  next: { tags: ['posts', \\\`post-\\\${slug}\\\`] },  // Tags: all posts + specific post
});

// app/dashboard/page.tsx
const stats = await fetch('https://api.example.com/stats', {
  next: { tags: ['posts', 'stats'] },  // Stats depend on post data too
});

// When a post is updated:
// revalidateTag('posts')       → purges /blog, /blog/[slug], /dashboard
// revalidateTag('post-intro')  → purges only /blog/intro (surgical)

// ═══════════════════════════════════════════════════════════════════════════
// DEBUGGING CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════
//
// Page shows stale data? Check:
// 1. Is fetch using cache: 'force-cache' (default)? → Add revalidate or no-store
// 2. Is the route static? → Check if cookies()/headers() are used
// 3. Did revalidatePath match the correct path? → Check trailing slashes
// 4. Did revalidateTag match the correct tag? → Tags are case-sensitive
// 5. Is Router Cache serving stale data? → router.refresh() to clear
// 6. Is the route using generateStaticParams? → New params may need
//    dynamicParams: true (default) to be rendered on-demand
//
// Page is too dynamic (slow)? Check:
// 1. Are you using cache: 'no-store' unnecessarily? → Use revalidate instead
// 2. Are you calling cookies()/headers() in a shared layout? → Move to page
// 3. Are all fetches sequential? → Use Promise.all for parallel fetching
// 4. Can some data be pre-rendered? → Use generateStaticParams
`,
      explanation: `This example provides a comprehensive mental model of Next.js caching — the single most confusing and most-asked topic in Next.js interviews. It covers all three layers: (1) Data Cache — server-side per-fetch caching with force-cache (default), no-store, and revalidate options, showing exactly how ISR's stale-while-revalidate flow works with a timeline. (2) Full Route Cache — how static routes are pre-rendered as HTML + RSC payload at build time, and how dynamic functions (cookies, headers) opt routes out. (3) Router Cache — client-side in-memory cache with 30s/5min expiration for instant back/forward navigation. The opt-out strategies section shows how to bypass each layer. The on-demand revalidation section explains exactly what revalidatePath and revalidateTag do (purge Data Cache entries + Full Route Cache), and the tag-based strategy section shows a real-world pattern for surgical cache invalidation across multiple pages. The debugging checklist at the end addresses the most common caching issues developers face in production.`,
      order_index: 3,
    },
  ],
};

export default examples;
