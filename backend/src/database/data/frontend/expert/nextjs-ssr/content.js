// ============================================================================
// Next.js & SSR — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "Next.js & SSR",
  slug: "nextjs-ssr",
  description:
    "Build production-grade apps with Next.js App Router — Server Components, data fetching, caching, and API routes.",
  estimated_time: 220,
  order_index: 10,
};

export const lessons = [
  {
    title: "Next.js App Router & Server Components",
    slug: "nextjs-app-router",
    summary:
      "Master Next.js 14+ App Router architecture — file-system routing conventions, Server vs Client Components, the 'use client' directive and serialization boundary, parallel and intercepting routes, route groups, streaming with Suspense, the Metadata API, middleware, and Server Actions for mutations.",
    difficulty_level: "expert",
    estimated_time: 45,
    order_index: 1,
    key_points: [
      "App Router file-system routing: every folder inside app/ maps to a URL segment — page.tsx renders the route, layout.tsx wraps children and persists across navigations (the root layout replaces _app and _document), loading.tsx creates an automatic Suspense boundary for streaming, error.tsx creates an ErrorBoundary that catches errors in the segment and its children, not-found.tsx handles notFound() calls, and template.tsx is like layout but re-mounts on navigation (useful for enter/exit animations and per-page state reset)",
      "Server Components are the default in App Router — they render on the server, have zero client-side JS bundle cost, can directly await database queries / fs reads / API calls, and cannot use useState, useEffect, event handlers, or browser APIs; they are ideal for data-heavy UI that doesn't need interactivity",
      "Client Components are opted-in with the 'use client' directive at the top of the file — they render on both server (SSR HTML) and client (hydration), can use all React hooks and browser APIs, but cannot import Server Components directly; instead, pass Server Components as children or props (the 'donut pattern') to keep the client bundle small",
      "The serialization boundary: props passed from a Server Component to a Client Component must be serializable (strings, numbers, booleans, plain objects, arrays, Date, Map, Set, typed arrays, FormData, Promises) — functions, class instances, Symbols, and DOM nodes cannot cross the boundary; violating this throws a build-time error",
      "Parallel routes use @folder convention (e.g., app/@modal/page.tsx, app/@sidebar/page.tsx) and are rendered simultaneously in the parent layout via named slots — they enable independent loading/error states for different sections of the same page, dashboard layouts, and conditional slot rendering with default.tsx as the unmatched fallback",
      "Intercepting routes use (..) syntax (e.g., app/feed/(..)photo/[id]/page.tsx) to intercept a navigation and show a different UI (like a modal) while preserving the URL — on hard refresh the original route renders; this powers the Instagram-style photo modal pattern; (.) intercepts same level, (..) one level up, (..)(..) two levels up, (...) from root",
      "Route groups use (folderName) syntax (e.g., app/(marketing)/about/page.tsx) to organize routes without affecting the URL structure — they allow different layouts for different sections (marketing vs dashboard), feature-based code organization, and multiple root layouts when each group has its own layout.tsx",
      "Middleware runs before every request at the edge — it can rewrite, redirect, set headers, read cookies, and implement auth guards; defined in middleware.ts at the project root; uses NextRequest/NextResponse APIs; the config.matcher array restricts which routes trigger the middleware; middleware cannot use Node.js APIs (runs in the Edge Runtime)",
    ],
    content: `
# Next.js App Router & Server Components

## The App Router Architecture

Next.js 14+ App Router replaces the Pages Router with a fundamentally different architecture built on **React Server Components (RSC)**. Every component is a Server Component by default — zero JavaScript shipped to the browser unless you explicitly opt in with \\\`"use client"\\\`.

### File-System Routing Conventions

Every folder inside \\\`app/\\\` maps to a URL segment. Special files inside each folder control what renders:

\\\`\\\`\\\`
app/
├── layout.tsx          ← Root layout (replaces _app.tsx + _document.tsx)
├── page.tsx            ← Home page (/)
├── loading.tsx         ← Root loading UI (Suspense boundary)
├── error.tsx           ← Root error UI (ErrorBoundary)
├── not-found.tsx       ← 404 page (notFound() calls)
├── global-error.tsx    ← Catches errors in root layout itself
│
├── dashboard/
│   ├── layout.tsx      ← Nested layout (wraps all dashboard pages)
│   ├── page.tsx        ← /dashboard
│   ├── loading.tsx     ← Loading state for dashboard
│   ├── error.tsx       ← Error boundary for dashboard
│   │
│   ├── settings/
│   │   └── page.tsx    ← /dashboard/settings
│   │
│   └── [teamId]/
│       └── page.tsx    ← /dashboard/:teamId (dynamic segment)
│
├── blog/
│   ├── page.tsx        ← /blog (list page)
│   └── [slug]/
│       ├── page.tsx    ← /blog/:slug (dynamic article)
│       └── not-found.tsx ← 404 for invalid slugs
│
└── api/
    └── webhook/
        └── route.ts    ← API Route Handler (POST /api/webhook)
\\\`\\\`\\\`

### Special Files Explained

\\\`\\\`\\\`tsx
// ── layout.tsx ─────────────────────────────────────────────────────────────
// Wraps children. Persists across navigations (no remount).
// Root layout MUST include <html> and <body> tags.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>...</nav>
        {children}         {/* page.tsx or nested layout renders here */}
        <footer>...</footer>
      </body>
    </html>
  );
}

// ── template.tsx ───────────────────────────────────────────────────────────
// Like layout but RE-MOUNTS on every navigation (new instance, fresh state).
// Use for: enter/exit animations, per-page analytics, resetting form state.

export default function Template({ children }: { children: React.ReactNode }) {
  return <AnimatePresence>{children}</AnimatePresence>;
}

// ── loading.tsx ────────────────────────────────────────────────────────────
// Automatically wrapped in <Suspense> — shows while page.tsx streams.

export default function Loading() {
  return <div className="skeleton">Loading dashboard...</div>;
}

// ── error.tsx ──────────────────────────────────────────────────────────────
// MUST be a Client Component (needs useState for retry).
// Catches errors in the segment and its children (not in layout.tsx above it).

"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// ── not-found.tsx ──────────────────────────────────────────────────────────
// Triggered by calling notFound() in a Server Component.

import { notFound } from 'next/navigation';

async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();   // renders the nearest not-found.tsx
  return <Article post={post} />;
}
\\\`\\\`\\\`

---

## Server Components vs Client Components

### Server Components (Default)

Every component in the App Router is a **Server Component** unless you add \\\`"use client"\\\`. They execute **only on the server**.

\\\`\\\`\\\`tsx
// app/dashboard/page.tsx — Server Component (default)
// ✅ Can: await async data, read from DB, access env vars, call fs
// ❌ Cannot: useState, useEffect, onClick, browser APIs

import { db } from '@/lib/database';

export default async function DashboardPage() {
  // Direct database access — no API layer needed
  const stats = await db.query('SELECT * FROM analytics WHERE date = $1', [today]);
  const user = await getServerSession();

  return (
    <section>
      <h1>Welcome, {user.name}</h1>
      <StatsGrid stats={stats} />        {/* Server Component — zero JS */}
      <RevenueChart data={stats.revenue} /> {/* Client Component — interactive */}
    </section>
  );
}
\\\`\\\`\\\`

### Client Components ("use client")

\\\`\\\`\\\`tsx
// components/RevenueChart.tsx — Client Component
"use client";

import { useState, useEffect } from 'react';
import { Line } from 'recharts';

export default function RevenueChart({ data }: { data: number[] }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [filtered, setFiltered] = useState(data);

  useEffect(() => {
    setFiltered(filterByRange(data, timeRange));
  }, [data, timeRange]);

  return (
    <div>
      <select onChange={(e) => setTimeRange(e.target.value)}>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
      <Line data={filtered} />
    </div>
  );
}
\\\`\\\`\\\`

### When to Use Each

\\\`\\\`\\\`
Use Server Components When:           Use Client Components When:
─────────────────────────────────────  ──────────────────────────────────────
✅ Fetching data (DB, API, filesystem)  ✅ Interactive UI (forms, buttons, dropdowns)
✅ Rendering static content             ✅ useState, useEffect, useRef needed
✅ Accessing backend resources           ✅ Event handlers (onClick, onChange)
✅ Keeping secrets on the server         ✅ Browser APIs (localStorage, geolocation)
✅ Reducing client bundle size           ✅ Third-party client libs (charts, maps)
✅ SEO-critical content                  ✅ Real-time updates (WebSocket, polling)
\\\`\\\`\\\`

### The Serialization Boundary

Props flowing from Server → Client must be serializable:

\\\`\\\`\\\`tsx
// ✅ SERIALIZABLE — can cross the boundary
<ClientComponent
  name="Alice"                    // string
  count={42}                      // number
  isActive={true}                 // boolean
  tags={['react', 'next']}       // array of primitives
  metadata={{ version: 1 }}       // plain object
  createdAt={new Date()}          // Date
/>

// ❌ NOT SERIALIZABLE — build error
<ClientComponent
  onClick={() => console.log('x')}   // function
  ref={myRef}                         // ref object
  db={prismaClient}                   // class instance
  symbol={Symbol('key')}              // Symbol
/>
\\\`\\\`\\\`

### The Donut Pattern

Keep Client Components at the **leaves** of your tree. Pass Server Components as \\\`children\\\` to avoid pulling them into the client bundle:

\\\`\\\`\\\`tsx
// ✅ DONUT PATTERN — Server content rendered inside Client wrapper
// app/dashboard/page.tsx (Server Component)
export default function Page() {
  return (
    <Sidebar>                      {/* Client Component — interactive */}
      <NavLinks />                 {/* Server Component — zero JS */}
      <UserProfile user={user} />  {/* Server Component — zero JS */}
    </Sidebar>
  );
}

// components/Sidebar.tsx (Client Component)
"use client";
export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <aside className={isOpen ? 'open' : 'closed'}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {children}   {/* Server Components render here — not in client bundle */}
    </aside>
  );
}
\\\`\\\`\\\`

---

## Parallel Routes

Parallel routes render **multiple pages simultaneously** in the same layout using **named slots** with the \\\`@folder\\\` convention:

\\\`\\\`\\\`
app/
├── layout.tsx          ← Receives @analytics and @team as props
├── page.tsx            ← Default content
├── @analytics/
│   ├── page.tsx        ← Rendered in the analytics slot
│   ├── loading.tsx     ← Independent loading state
│   └── error.tsx       ← Independent error boundary
├── @team/
│   ├── page.tsx        ← Rendered in the team slot
│   └── loading.tsx
└── default.tsx         ← Fallback when a slot has no matching route
\\\`\\\`\\\`

\\\`\\\`\\\`tsx
// app/layout.tsx — receives named slots as props
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3">
      <main>{children}</main>
      <aside>{analytics}</aside>    {/* Independent loading/error */}
      <aside>{team}</aside>         {/* Independent loading/error */}
    </div>
  );
}
\\\`\\\`\\\`

Each slot loads independently — if \\\`@analytics\\\` takes 3 seconds, \\\`@team\\\` and \\\`children\\\` are already visible. Each slot has its own loading.tsx and error.tsx.

---

## Intercepting Routes

Intercepting routes show a **different UI** (typically a modal) when navigating via \\\`<Link>\\\`, while preserving the original page on hard refresh:

\\\`\\\`\\\`
Convention     Intercepts
(.)            Same level
(..)           One level up
(..)(..)       Two levels up
(...)          From the app root
\\\`\\\`\\\`

\\\`\\\`\\\`
app/
├── feed/
│   ├── page.tsx                     ← Feed page with photo thumbnails
│   └── (.)photo/[id]/page.tsx      ← Intercepts /photo/:id → shows modal
├── photo/[id]/
│   └── page.tsx                     ← Full photo page (hard refresh)
\\\`\\\`\\\`

\\\`\\\`\\\`tsx
// app/feed/(.)photo/[id]/page.tsx — Modal overlay
import { Modal } from '@/components/Modal';

export default async function PhotoModal({ params }: { params: { id: string } }) {
  const photo = await getPhoto(params.id);
  return (
    <Modal>
      <img src={photo.url} alt={photo.alt} />
      <p>{photo.caption}</p>
    </Modal>
  );
}
// Clicking <Link href="/photo/42"> from /feed shows this modal.
// Navigating to /photo/42 directly shows the full page.
\\\`\\\`\\\`

---

## Route Groups

Organize routes without affecting URLs using \\\`(folderName)\\\`:

\\\`\\\`\\\`
app/
├── (marketing)/          ← Group — no URL impact
│   ├── layout.tsx        ← Marketing layout (centered, branding)
│   ├── page.tsx          ← / (home)
│   ├── about/
│   │   └── page.tsx      ← /about
│   └── pricing/
│       └── page.tsx      ← /pricing
│
├── (dashboard)/          ← Group — different layout
│   ├── layout.tsx        ← Dashboard layout (sidebar, auth guard)
│   ├── overview/
│   │   └── page.tsx      ← /overview
│   └── settings/
│       └── page.tsx      ← /settings
\\\`\\\`\\\`

The \\\`(marketing)\\\` and \\\`(dashboard)\\\` folder names are stripped from the URL. Each group can have its own layout, loading, and error files — enabling completely different visual structures for different sections of the site.

---

## Streaming with Suspense

Next.js App Router supports **streaming SSR** — the shell (layout + Suspense fallbacks) is sent immediately, and suspended content streams in as it resolves:

\\\`\\\`\\\`tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>                          {/* Sent immediately */}

      <Suspense fallback={<SkeletonStats />}>
        <Stats />                                  {/* Streams when ready */}
      </Suspense>

      <Suspense fallback={<SkeletonFeed />}>
        <ActivityFeed />                           {/* Streams independently */}
      </Suspense>
    </div>
  );
}

// Each <Suspense> boundary is independent — Stats can take 2s
// while ActivityFeed takes 5s. The user sees Stats as soon as it's ready.
// The HTML shell + fallbacks arrive in the first byte.
\\\`\\\`\\\`

---

## Metadata API

Define per-page metadata for SEO without \\\`<Head>\\\`:

\\\`\\\`\\\`tsx
// ── Static Metadata ────────────────────────────────────────────────────────
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Acme',
  description: 'Learn about our mission and team.',
  openGraph: {
    title: 'About Acme',
    images: ['/og-about.png'],
  },
};

// ── Dynamic Metadata ───────────────────────────────────────────────────────
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [post.coverImage] },
  };
}
\\\`\\\`\\\`

Metadata merges from root layout → nested layout → page. Deeper values override shallower ones. The \\\`generateMetadata\\\` function can fetch data — the request is automatically deduplicated with the same fetch in the page component.

---

## Middleware

Runs **before** every matched request at the Edge Runtime:

\\\`\\\`\\\`ts
// middleware.ts (project root — not inside app/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  // Redirect unauthenticated users to login
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rewrite for A/B testing
  if (request.nextUrl.pathname === '/pricing') {
    const variant = request.cookies.get('ab-variant')?.value || 'a';
    return NextResponse.rewrite(
      new URL('/pricing/' + variant, request.url)
    );
  }

  // Add custom headers
  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

// Only run middleware on specific routes (avoid running on static assets)
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/pricing'],
};
\\\`\\\`\\\`

**Important**: Middleware runs in the Edge Runtime — it cannot use Node.js APIs (\\\`fs\\\`, \\\`path\\\`, \\\`Buffer\\\`, Node \\\`crypto\\\`). It can use Web APIs (\\\`fetch\\\`, \\\`Response\\\`, \\\`crypto.subtle\\\`, \\\`TextEncoder\\\`).

---

## Server Actions

Server Actions are async functions marked with \\\`"use server"\\\` that run on the server, callable directly from forms and Client Components:

\\\`\\\`\\\`tsx
// app/actions.ts
"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/database';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const body = formData.get('body') as string;

  // Validate on the server
  if (!title || title.length < 3) {
    throw new Error('Title must be at least 3 characters');
  }

  await db.insert('posts', { title, body, createdAt: new Date() });

  revalidatePath('/blog');    // Purge cached data for /blog
  redirect('/blog');          // Navigate to the blog page
}

// Usage in a Server Component (progressive enhancement — works without JS)
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="body" required />
      <button type="submit">Publish</button>
    </form>
  );
}
\\\`\\\`\\\`

Server Actions are automatically CSRF-protected, support progressive enhancement (forms work before JS loads), and can be called from \\\`onClick\\\`, \\\`useTransition\\\`, or \\\`startTransition\\\` in Client Components.

---

## Interview Quick-Reference

| Concept | Key Fact |
|---|---|
| Default component type | Server Component (no "use client") |
| layout.tsx vs template.tsx | layout persists; template re-mounts on navigation |
| loading.tsx | Auto Suspense boundary; shows while page streams |
| error.tsx | Must be "use client"; catches segment + children errors |
| Parallel routes | @folder → named slots; independent loading/error |
| Intercepting routes | (..) syntax; modal on Link, full page on refresh |
| Route groups | (folder) → no URL impact; separate layouts |
| Serialization boundary | Functions/classes cannot pass Server → Client |
| Donut pattern | Pass Server Components as children to Client Components |
| Middleware | Edge Runtime; runs before request; no Node.js APIs |
| Server Actions | "use server"; progressive enhancement; auto CSRF protection |
| Streaming | Suspense boundaries flush HTML incrementally |
`,
  },
  {
    title: "Data Fetching, Caching & API Routes",
    slug: "nextjs-data-fetching",
    summary:
      "Master Next.js rendering strategies (SSG, SSR, ISR, CSR), async Server Component data fetching, fetch cache/revalidate options, revalidatePath/revalidateTag, Route Handlers, Server Actions with useFormStatus and useOptimistic, the three caching layers (Data Cache, Full Route Cache, Router Cache), generateStaticParams, parallel data fetching, and error handling patterns.",
    difficulty_level: "expert",
    estimated_time: 45,
    order_index: 2,
    key_points: [
      "Four rendering strategies in Next.js: SSG (Static Site Generation — built at build time, fastest, use for marketing pages), SSR (Server-Side Rendering — rendered per request with { cache: 'no-store' } or dynamic functions like cookies()/headers(), use for personalized dashboards), ISR (Incremental Static Regeneration — static with time-based revalidation via { next: { revalidate: 60 } }, use for blog posts), and CSR (Client-Side Rendering — fetch in useEffect or SWR/React Query in Client Components, use for real-time widgets)",
      "App Router data fetching: Server Components are async by default — just await fetch() or database calls directly in the component body; no getServerSideProps/getStaticProps needed; fetch() is extended with cache and next.revalidate options; duplicate fetch calls across components are automatically deduplicated in a single render pass",
      "Fetch caching options: fetch(url) defaults to cache: 'force-cache' (static), fetch(url, { cache: 'no-store' }) forces dynamic rendering per request, fetch(url, { next: { revalidate: 3600 } }) enables ISR with a 1-hour revalidation window — after the window expires, the first visitor gets the stale page while Next.js regenerates in the background (stale-while-revalidate pattern)",
      "On-demand revalidation: revalidatePath('/blog') purges the Data Cache and Full Route Cache for a specific path, revalidateTag('posts') purges all fetch calls tagged with { next: { tags: ['posts'] } } — use these in Server Actions or Route Handlers after mutations to keep cached pages up-to-date without waiting for time-based revalidation",
      "Route Handlers (app/api/*/route.ts) replace Pages Router API Routes — export named functions for HTTP methods (GET, POST, PUT, DELETE, PATCH); they receive a NextRequest and return a NextResponse; GET handlers with no dynamic input are cached by default (like static pages); use for webhooks, OAuth callbacks, and endpoints consumed by external services",
      "Server Actions for mutations: define with 'use server' directive; can be used as form action={serverAction} for progressive enhancement; useFormStatus() provides pending state inside the form; useOptimistic() enables instant UI updates before the server responds (revert on error); server actions are invoked via POST and are CSRF-protected automatically",
      "Three caching layers: (1) Data Cache — caches individual fetch() results on the server, persists across deployments until revalidated, keyed by URL + options; (2) Full Route Cache — caches the complete RSC payload + HTML for static routes at build time; (3) Router Cache — client-side in-memory cache of RSC payloads for visited routes, enables instant back/forward navigation, auto-expires (dynamic routes: 30s, static routes: 5min)",
      "generateStaticParams replaces getStaticPaths — returns an array of param objects for dynamic routes to pre-render at build time; works with generateMetadata for static SEO; supports catch-all segments [...slug] and optional catch-all [[...slug]]; incremental adoption: routes not returned by generateStaticParams are rendered on-demand and cached (dynamicParams: true by default)",
    ],
    content: `
# Data Fetching, Caching & API Routes

## Rendering Strategies Overview

Next.js App Router supports four rendering strategies. Understanding when to use each is the most common interview question:

\\\`\\\`\\\`
Strategy   When Generated    When to Use                         How to Enable
────────── ──────────────── ──────────────────────────────────── ──────────────────────────────
SSG        Build time        Marketing pages, docs, changelogs   Default (no dynamic functions)
SSR        Every request     Personalized dashboards, search     cache: 'no-store' or cookies()/headers()
ISR        Build + revalidate Blog posts, product pages           next: { revalidate: N }
CSR        Client-side       Real-time widgets, user-specific    useEffect + fetch in "use client"
\\\`\\\`\\\`

### How Next.js Decides: Static vs Dynamic

A route is **static** by default. It becomes **dynamic** if any of these are present:

- \\\`fetch(url, { cache: 'no-store' })\\\` — opts out of caching
- \\\`cookies()\\\`, \\\`headers()\\\`, \\\`searchParams\\\` — require per-request data
- \\\`export const dynamic = 'force-dynamic'\\\` — explicit opt-out
- An uncached POST Route Handler

\\\`\\\`\\\`tsx
// ── STATIC (SSG) — built at build time ─────────────────────────────────────
export default async function AboutPage() {
  const team = await fetch('https://api.example.com/team');  // cached forever
  return <TeamGrid members={await team.json()} />;
}

// ── DYNAMIC (SSR) — rendered every request ─────────────────────────────────
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const session = cookies().get('session');                   // per-request
  const data = await fetch('https://api.example.com/me', {
    cache: 'no-store',                                        // never cache
    headers: { Authorization: \\\`Bearer \\\${session?.value}\\\` },
  });
  return <Dashboard data={await data.json()} />;
}

// ── ISR — static with time-based revalidation ──────────────────────────────
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 },                               // revalidate every hour
  });
  return <PostList posts={await posts.json()} />;
}

// ── CSR — client-side rendering ────────────────────────────────────────────
"use client";
import useSWR from 'swr';

export default function LiveTicker() {
  const { data, error } = useSWR('/api/prices', fetcher, {
    refreshInterval: 1000,                                    // poll every second
  });
  if (error) return <div>Error loading prices</div>;
  if (!data) return <div>Loading...</div>;
  return <PriceTable prices={data} />;
}
\\\`\\\`\\\`

---

## Async Server Components

In App Router, **Server Components are async** — no \\\`getServerSideProps\\\` or \\\`getStaticProps\\\`. Just \\\`await\\\` directly:

\\\`\\\`\\\`tsx
// app/products/[id]/page.tsx — Server Component
import { db } from '@/lib/database';
import { notFound } from 'next/navigation';

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  });

  if (!product) notFound();

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>\${product.price}</span>
    </article>
  );
}
\\\`\\\`\\\`

### Automatic Request Deduplication

Next.js automatically deduplicates identical \\\`fetch()\\\` calls in a single render pass:

\\\`\\\`\\\`tsx
// Both components call the same URL — only ONE network request is made

// Layout.tsx
const user = await fetch('/api/user');  // Request #1

// Page.tsx (renders inside Layout)
const user = await fetch('/api/user');  // Deduped — uses result from #1
\\\`\\\`\\\`

This works only with \\\`fetch()\\\`. For ORM/database calls, use React's \\\`cache()\\\` function:

\\\`\\\`\\\`tsx
import { cache } from 'react';
import { db } from '@/lib/database';

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});

// Now getUser('123') is deduplicated across components in the same render
\\\`\\\`\\\`

---

## Parallel Data Fetching

**Sequential** fetches create waterfalls — each waits for the previous:

\\\`\\\`\\\`tsx
// ❌ WATERFALL — total time = fetch1 + fetch2 + fetch3
export default async function Page() {
  const user = await getUser();              // 200ms
  const posts = await getPosts(user.id);     // 300ms (waits for user)
  const comments = await getComments();       // 150ms (waits for posts)
  // Total: 650ms
}
\\\`\\\`\\\`

Use \\\`Promise.all\\\` for independent fetches:

\\\`\\\`\\\`tsx
// ✅ PARALLEL — total time = max(fetch1, fetch2, fetch3)
export default async function Page() {
  const [user, posts, comments] = await Promise.all([
    getUser(),        // 200ms ─┐
    getPosts(),       // 300ms ─┤ all start simultaneously
    getComments(),    // 150ms ─┘
  ]);
  // Total: 300ms (slowest one)
}
\\\`\\\`\\\`

For **dependent** fetches, use Suspense streaming to avoid blocking the entire page:

\\\`\\\`\\\`tsx
export default async function Page() {
  const user = await getUser();   // Must resolve first

  return (
    <div>
      <UserHeader user={user} />           {/* Sent immediately */}
      <Suspense fallback={<Skeleton />}>
        <UserPosts userId={user.id} />     {/* Streams when ready */}
      </Suspense>
    </div>
  );
}
\\\`\\\`\\\`

---

## Fetch Caching Options

\\\`\\\`\\\`tsx
// ── Default: force-cache (static) ──────────────────────────────────────────
const res = await fetch('https://api.example.com/data');
// Cached indefinitely until: revalidatePath, revalidateTag, or redeploy

// ── No caching (SSR) ──────────────────────────────────────────────────────
const res = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});
// Fresh data on every request — makes the entire route dynamic

// ── Time-based revalidation (ISR) ─────────────────────────────────────────
const res = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },         // Revalidate every 60 seconds
});
// Stale-while-revalidate: serves cached version, regenerates in background

// ── Tag-based revalidation ─────────────────────────────────────────────────
const res = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});
// Later: revalidateTag('posts') purges all fetches tagged 'posts'
\\\`\\\`\\\`

---

## On-Demand Revalidation

Trigger revalidation after mutations instead of waiting for time-based expiry:

\\\`\\\`\\\`tsx
// app/actions.ts
"use server";

import { revalidatePath, revalidateTag } from 'next/cache';

export async function publishPost(formData: FormData) {
  await db.post.create({
    data: { title: formData.get('title'), body: formData.get('body') },
  });

  // Option 1: Revalidate a specific path (purges Full Route Cache + Data Cache)
  revalidatePath('/blog');

  // Option 2: Revalidate all fetches with a specific tag
  revalidateTag('posts');   // Purges all fetch(..., { next: { tags: ['posts'] } })

  // Option 3: Revalidate a dynamic route
  revalidatePath('/blog/my-new-post');

  // Option 4: Revalidate an entire layout segment
  revalidatePath('/blog', 'layout');   // Purges /blog and all nested routes
}
\\\`\\\`\\\`

---

## Route Handlers

Replace Pages Router API Routes. Export named functions matching HTTP methods:

\\\`\\\`\\\`ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/posts — cached by default if no dynamic input
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');

  const posts = await db.post.findMany({
    skip: (page - 1) * 10,
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ posts, page });
}

// POST /api/posts — always dynamic (mutations are never cached)
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate input
  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  const post = await db.post.create({ data: body });
  return NextResponse.json(post, { status: 201 });
}
\\\`\\\`\\\`

\\\`\\\`\\\`ts
// app/api/posts/[id]/route.ts — dynamic route
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const updated = await db.post.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.post.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
\\\`\\\`\\\`

---

## Server Actions & Form Handling

### useFormStatus — Pending State Inside Forms

\\\`\\\`\\\`tsx
"use client";
import { useFormStatus } from 'react-dom';

// useFormStatus MUST be inside a child component, not the form itself
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

// Usage — SubmitButton reads pending state from the parent <form>
export default function ContactForm({ submitAction }) {
  return (
    <form action={submitAction}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <SubmitButton />     {/* Shows "Submitting..." while action runs */}
    </form>
  );
}
\\\`\\\`\\\`

### useOptimistic — Instant UI Updates

\\\`\\\`\\\`tsx
"use client";
import { useOptimistic } from 'react';
import { addTodo } from '@/app/actions';

export default function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (currentState, newTodoText: string) => [
      ...currentState,
      { id: crypto.randomUUID(), text: newTodoText, pending: true },
    ]
  );

  async function handleSubmit(formData: FormData) {
    const text = formData.get('text') as string;
    addOptimisticTodo(text);      // Instant UI update (optimistic)
    await addTodo(formData);       // Server mutation — reverts on error
  }

  return (
    <form action={handleSubmit}>
      <input name="text" required />
      <button type="submit">Add</button>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
    </form>
  );
}
\\\`\\\`\\\`

---

## Three Caching Layers

\\\`\\\`\\\`
Layer              What It Caches                Where    Duration / Invalidation
───────────────── ─────────────────────────────── ──────── ──────────────────────────────
Data Cache         Individual fetch() responses   Server   Persists across deploys until
                                                           revalidateTag/revalidatePath
                                                           or time-based expiry

Full Route Cache   Complete HTML + RSC payload    Server   Built at build time for static
                   for static routes                       routes; purged on revalidation

Router Cache       RSC payload for visited        Client   Dynamic: 30s, Static: 5min;
                   routes (back/forward nav)      (memory) cleared by router.refresh()
\\\`\\\`\\\`

### Opting Out of Each Layer

\\\`\\\`\\\`tsx
// Opt out of Data Cache for a specific fetch
fetch(url, { cache: 'no-store' });

// Opt out of Full Route Cache for an entire route
export const dynamic = 'force-dynamic';

// Opt out of Router Cache (client-side)
import { useRouter } from 'next/navigation';
const router = useRouter();
router.refresh();   // Clears Router Cache for current route, triggers re-render
\\\`\\\`\\\`

---

## generateStaticParams

Pre-render dynamic routes at build time (replaces \\\`getStaticPaths\\\`):

\\\`\\\`\\\`tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  return posts.map((post: Post) => ({
    slug: post.slug,           // { slug: 'my-first-post' }
  }));
}

// Generates at build time:
// /blog/my-first-post   (static HTML)
// /blog/nextjs-tips     (static HTML)
// /blog/unknown-slug    (rendered on-demand, then cached)

// To 404 on unknown slugs instead of rendering on-demand:
export const dynamicParams = false;
\\\`\\\`\\\`

### Catch-All and Optional Catch-All Segments

\\\`\\\`\\\`tsx
// app/docs/[...slug]/page.tsx — matches /docs/a, /docs/a/b, /docs/a/b/c
export async function generateStaticParams() {
  return [
    { slug: ['getting-started'] },             // /docs/getting-started
    { slug: ['api', 'authentication'] },       // /docs/api/authentication
    { slug: ['guides', 'deployment', 'aws'] }, // /docs/guides/deployment/aws
  ];
}

// app/docs/[[...slug]]/page.tsx — ALSO matches /docs (slug is undefined)
\\\`\\\`\\\`

---

## Error Handling Patterns

\\\`\\\`\\\`tsx
// ── Fetch error handling in Server Components ──────────────────────────────
export default async function Page() {
  const res = await fetch('https://api.example.com/data');

  if (!res.ok) {
    if (res.status === 404) notFound();            // Triggers not-found.tsx
    throw new Error(\\\`API error: \\\${res.status}\\\`);  // Triggers error.tsx
  }

  const data = await res.json();
  return <DataView data={data} />;
}

// ── Server Action error handling with return values ────────────────────────
"use server";
export async function updateProfile(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    if (!name || name.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' };
    }
    await db.user.update({ where: { id: userId }, data: { name } });
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update profile' };
  }
}

// ── Client-side: useTransition for pending + error state ──────────────────
"use client";
import { useTransition, useState } from 'react';
import { updateProfile } from '@/app/actions';

export default function ProfileForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit}>
      {error && <div role="alert" className="text-red-600">{error}</div>}
      <input name="name" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
\\\`\\\`\\\`

---

## Interview Quick-Reference

| Concept | Key Fact |
|---|---|
| Default fetch caching | \\\`force-cache\\\` (static) — opt out with \\\`cache: 'no-store'\\\` |
| ISR | \\\`next: { revalidate: N }\\\` — stale-while-revalidate pattern |
| On-demand revalidation | \\\`revalidatePath()\\\` / \\\`revalidateTag()\\\` in Server Actions |
| Route Handlers | app/api/*/route.ts — GET is cached, POST is dynamic |
| Server Actions | "use server" — progressive enhancement, CSRF-protected |
| useFormStatus | Must be inside a child of \\\`<form>\\\` — provides \\\`pending\\\` boolean |
| useOptimistic | Instant UI update before server responds, reverts on error |
| Data Cache | Server-side, persists across deploys, keyed by URL + options |
| Full Route Cache | HTML + RSC payload for static routes, purged on revalidation |
| Router Cache | Client-side, 30s (dynamic) / 5min (static), cleared by refresh() |
| generateStaticParams | Replaces getStaticPaths — pre-render dynamic routes at build |
| Request deduplication | Identical fetch() calls auto-deduped; use React cache() for DB |
| Parallel fetching | Use Promise.all for independent fetches; Suspense for dependent |
`,
  },
];
