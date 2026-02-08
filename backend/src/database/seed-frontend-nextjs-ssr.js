import pool from '../config/database.js';

async function seedNextJsSSR() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Next.js SSR lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'nextjs-ssr'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Next.js SSR, SSG & App Router Guide', 'nextjs-ssr-guide', $2, 'Master Next.js server-side rendering, static site generation, App Router, data fetching patterns, and deployment', 'advanced', 55, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Next.js SSR, SSG & App Router Guide

## What is Next.js?

**Next.js** is a React framework that enables server-side rendering (SSR), static site generation (SSG), and much more out of the box.

### Benefits of Next.js

✅ **Server-Side Rendering**: Better SEO and initial page load
✅ **Static Site Generation**: Lightning-fast static pages
✅ **Automatic Code Splitting**: Better performance
✅ **Built-in Routing**: File-based routing system
✅ **API Routes**: Backend API in the same project
✅ **Image Optimization**: Automatic image optimization
✅ **TypeScript Support**: Built-in TypeScript support

## Getting Started

### Creating a New Next.js Project

\\\`\\\`\\\`bash
# Create new Next.js app
npx create-next-app@latest my-app

# With TypeScript
npx create-next-app@latest my-app --typescript

# Navigate to project
cd my-app

# Start development server
npm run dev
\\\`\\\`\\\`

### Project Structure

\\\`\\\`\\\`
my-app/
├── app/                  # App Router (Next.js 13+)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   ├── about/
│   │   └── page.tsx     # /about route
│   └── api/
│       └── route.ts     # API route
├── public/              # Static files
├── components/          # React components
├── lib/                 # Utility functions
├── next.config.js       # Next.js configuration
└── package.json
\\\`\\\`\\\`

## App Router (Next.js 13+)

The App Router is the recommended approach for new Next.js applications.

### Creating Pages

\\\`\\\`\\\`typescript
// app/page.tsx - Home page (/)
export default function HomePage() {
  return (
    <main>
      <h1>Welcome to Next.js</h1>
      <p>This is the home page</p>
    </main>
  );
}

// app/about/page.tsx - About page (/about)
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Learn more about our company</p>
    </div>
  );
}

// app/blog/[slug]/page.tsx - Dynamic route (/blog/:slug)
export default function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <article>
      <h1>Blog Post: {params.slug}</h1>
    </article>
  );
}
\\\`\\\`\\\`

### Layouts

\\\`\\\`\\\`typescript
// app/layout.tsx - Root layout
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My Next.js App',
  description: 'A Next.js application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>© 2026 My App</footer>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx - Nested layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <aside>
        <nav>Dashboard Navigation</nav>
      </aside>
      <div className="content">{children}</div>
    </div>
  );
}
\\\`\\\`\\\`

## Server-Side Rendering (SSR)

SSR renders pages on each request, providing fresh data and good SEO.

### Server Components (Default)

\\\`\\\`\\\`typescript
// app/posts/page.tsx
// This is a Server Component by default
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store', // Always fetch fresh data
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  
  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={\\\`/posts/\\\${post.id}\\\`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
\\\`\\\`\\\`

### Client Components

\\\`\\\`\\\`typescript
'use client'; // This directive makes it a Client Component

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\\\`\\\`\\\`

### Combining Server and Client Components

\\\`\\\`\\\`typescript
// app/dashboard/page.tsx (Server Component)
async function getData() {
  const res = await fetch('https://api.example.com/data');
  return res.json();
}

import ClientCounter from '@/components/ClientCounter';

export default async function DashboardPage() {
  const data = await getData(); // Server-side fetch
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Server data: {data.message}</p>
      {/* Client component for interactivity */}
      <ClientCounter initialCount={data.count} />
    </div>
  );
}

// components/ClientCounter.tsx (Client Component)
'use client';

import { useState } from 'react';

export default function ClientCounter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
\\\`\\\`\\\`

## Static Site Generation (SSG)

SSG generates HTML at build time for better performance.

### Static Pages

\\\`\\\`\\\`typescript
// app/about/page.tsx
// Static by default if no dynamic data
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>This page is generated at build time</p>
    </div>
  );
}
\\\`\\\`\\\`

### Static with Revalidation

\\\`\\\`\\\`typescript
// app/blog/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  
  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
\\\`\\\`\\\`

### Dynamic Routes with generateStaticParams

\\\`\\\`\\\`typescript
// app/blog/[slug]/page.tsx
interface Post {
  slug: string;
  title: string;
  content: string;
}

// Generate static paths at build time
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then((res) =>
    res.json()
  );
  
  return posts.map((post: Post) => ({
    slug: post.slug,
  }));
}

async function getPost(slug: string) {
  const res = await fetch(\\\`https://api.example.com/posts/\\\${slug}\\\`);
  return res.json();
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
  };
}
\\\`\\\`\\\`

## Data Fetching Patterns

### Parallel Data Fetching

\\\`\\\`\\\`typescript
// app/dashboard/page.tsx
async function getUser() {
  const res = await fetch('https://api.example.com/user');
  return res.json();
}

async function getPosts() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function DashboardPage() {
  // Fetch data in parallel
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts(),
  ]);
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <h2>Your Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
\\\`\\\`\\\`

### Sequential Data Fetching

\\\`\\\`\\\`typescript
// app/profile/[id]/page.tsx
async function getUser(id: string) {
  const res = await fetch(\\\`https://api.example.com/users/\\\${id}\\\`);
  return res.json();
}

async function getUserPosts(userId: string) {
  const res = await fetch(\\\`https://api.example.com/users/\\\${userId}/posts\\\`);
  return res.json();
}

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch user first
  const user = await getUser(params.id);
  
  // Then fetch user's posts (depends on user.id)
  const posts = await getUserPosts(user.id);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <h2>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
\\\`\\\`\\\`

### Loading and Error States

\\\`\\\`\\\`typescript
// app/posts/loading.tsx
export default function Loading() {
  return (
    <div>
      <h1>Loading posts...</h1>
      <div className="spinner"></div>
    </div>
  );
}

// app/posts/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
\\\`\\\`\\\`

## API Routes

\\\`\\\`\\\`typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello from Next.js!' });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    message: 'Data received',
    data: body,
  });
}

// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Fetch user from database
  const user = await db.user.findUnique({ where: { id } });
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  await db.user.delete({ where: { id } });
  
  return NextResponse.json({ success: true });
}
\\\`\\\`\\\`

## Middleware

\\\`\\\`\\\`typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Authentication check
  const token = request.cookies.get('token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Add custom header
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'my-value');
  
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
\\\`\\\`\\\`

## Deployment

### Building for Production

\\\`\\\`\\\`bash
# Build the application
npm run build

# Start production server
npm start

# Analyze bundle size
npm run build -- --analyze
\\\`\\\`\\\`

### Vercel Deployment

\\\`\\\`\\\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
\\\`\\\`\\\`

### Environment Variables

\\\`\\\`\\\`bash
# .env.local
DATABASE_URL=postgresql://user:pass@localhost:5432/db
NEXT_PUBLIC_API_URL=https://api.example.com
SECRET_KEY=my-secret-key
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// Usage in Server Components
const dbUrl = process.env.DATABASE_URL;

// Usage in Client Components (must be prefixed with NEXT_PUBLIC_)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
\\\`\\\`\\\`

## Best Practices

### ✅ Do This

\\\`\\\`\\\`typescript
// Use Server Components for data fetching
async function getData() {
  const res = await fetch('...');
  return res.json();
}

// Use Client Components only when needed
'use client';
import { useState } from 'react';

// Implement proper error handling
try {
  const data = await fetchData();
} catch (error) {
  console.error('Error:', error);
}

// Use proper caching strategies
fetch('...', { next: { revalidate: 3600 } });
\\\`\\\`\\\`

### ❌ Avoid This

\\\`\\\`\\\`typescript
// Do not make all components Client Components
'use client'; // Only use when necessary

// Do not fetch data in useEffect when you can use Server Components
useEffect(() => {
  fetch('...'); // Use Server Component instead
}, []);

// Do not hardcode URLs
const url = 'http://localhost:3000'; // Use env variables
\\\`\\\`\\\`

## Summary

Next.js provides:
- Server-Side Rendering for dynamic content
- Static Site Generation for performance
- Hybrid approach with revalidation
- File-based routing system
- API routes for backend logic
- Built-in optimizations

Master Next.js to build fast, SEO-friendly React applications!`,
      ['Next.js setup and App Router', 'Server Components vs Client Components', 'SSR and SSG patterns', 'Data fetching strategies (parallel and sequential)', 'API routes and deployment']
    ]);

    const lessonId = lesson.rows[0].id;

    // Add code examples
    const examples = [
      {
        title: 'Complete App Router with SSR and SSG',
        code: `// app/layout.tsx - Root Layout
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Next.js Blog',
  description: 'A modern blog built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="navbar">
          <a href="/">Home</a>
          <a href="/blog">Blog</a>
          <a href="/about">About</a>
        </nav>
        {children}
        <footer>© 2026 Next.js Blog</footer>
      </body>
    </html>
  );
}

// app/page.tsx - Home Page (SSG)
export default function HomePage() {
  return (
    <main>
      <h1>Welcome to Our Blog</h1>
      <p>Explore our latest posts and insights.</p>
    </main>
  );
}

// app/blog/page.tsx - Blog List (SSR with Revalidation)
interface Post {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
}

async function getPosts(): Promise<Post[]> {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  
  return (
    <div>
      <h1>Blog Posts</h1>
      <div className="posts-grid">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
            <a href={\\\`/blog/\\\${post.id}\\\`}>Read more →</a>
          </article>
        ))}
      </div>
    </div>
  );
}

// app/blog/[id]/page.tsx - Blog Post (SSG)
interface PostDetails extends Post {
  content: string;
  author: string;
}

// Generate static paths at build time
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then((res) =>
    res.json()
  );
  
  return posts.map((post: Post) => ({
    id: post.id,
  }));
}

async function getPost(id: string): Promise<PostDetails> {
  const res = await fetch(\\\`https://api.example.com/posts/\\\${id}\\\`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    throw new Error('Post not found');
  }
  
  return res.json();
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPost(params.id);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPost(params.id);
  
  return (
    <article className="blog-post">
      <header>
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span>By {post.author}</span>
          <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
        </div>
      </header>
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

// app/blog/loading.tsx - Loading State
export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading posts...</p>
    </div>
  );
}

// app/blog/error.tsx - Error State
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}`,
        language: 'typescript',
        explanation: 'Complete Next.js App Router example showing root layout, SSG home page, SSR blog list with revalidation, static blog post pages with generateStaticParams, and proper loading/error states.'
      },
      {
        title: 'Server and Client Components Integration',
        code: `// app/dashboard/page.tsx - Server Component
import { Suspense } from 'react';
import InteractiveChart from '@/components/InteractiveChart';
import UserActions from '@/components/UserActions';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    views: number;
    posts: number;
    followers: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

async function getDashboardData(): Promise<DashboardData> {
  // This runs on the server
  const res = await fetch('https://api.example.com/dashboard', {
    headers: {
      Authorization: \\\`Bearer \\\${process.env.API_TOKEN}\\\`,
    },
    cache: 'no-store', // Always fetch fresh data
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return res.json();
}

export default async function DashboardPage() {
  // Server-side data fetching
  const data = await getDashboardData();
  
  return (
    <div className="dashboard">
      <header>
        <h1>Welcome back, {data.user.name}</h1>
        <p>{data.user.email}</p>
      </header>
      
      {/* Server-rendered static content */}
      <section className="stats">
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-value">{data.stats.views.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Posts</h3>
          <p className="stat-value">{data.stats.posts}</p>
        </div>
        <div className="stat-card">
          <h3>Followers</h3>
          <p className="stat-value">{data.stats.followers.toLocaleString()}</p>
        </div>
      </section>
      
      {/* Client Component for interactivity */}
      <section className="chart-section">
        <h2>Activity Chart</h2>
        <Suspense fallback={<div>Loading chart...</div>}>
          <InteractiveChart initialData={data.stats} />
        </Suspense>
      </section>
      
      {/* Another Client Component */}
      <section className="actions">
        <h2>Quick Actions</h2>
        <UserActions userId={data.user.id} />
      </section>
      
      {/* Server-rendered list */}
      <section className="recent-activity">
        <h2>Recent Activity</h2>
        <ul>
          {data.recentActivity.map((activity) => (
            <li key={activity.id}>
              <span className="activity-type">{activity.type}</span>
              <span className="activity-message">{activity.message}</span>
              <time>{new Date(activity.timestamp).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// components/InteractiveChart.tsx - Client Component
'use client';

import { useState, useEffect } from 'react';

interface ChartProps {
  initialData: {
    views: number;
    posts: number;
    followers: number;
  };
}

export default function InteractiveChart({ initialData }: ChartProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [chartData, setChartData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Fetch data based on time range
    async function fetchChartData() {
      setLoading(true);
      try {
        const res = await fetch(\\\`/api/stats?range=\\\${timeRange}\\\`);
        const data = await res.json();
        setChartData(data);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchChartData();
  }, [timeRange]);
  
  return (
    <div className="chart-container">
      <div className="chart-controls">
        <button
          onClick={() => setTimeRange('week')}
          className={timeRange === 'week' ? 'active' : ''}
        >
          Week
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={timeRange === 'month' ? 'active' : ''}
        >
          Month
        </button>
        <button
          onClick={() => setTimeRange('year')}
          className={timeRange === 'year' ? 'active' : ''}
        >
          Year
        </button>
      </div>
      
      {loading ? (
        <div>Loading chart data...</div>
      ) : (
        <div className="chart">
          {/* Render chart with chartData */}
          <div>Views: {chartData.views}</div>
          <div>Posts: {chartData.posts}</div>
          <div>Followers: {chartData.followers}</div>
        </div>
      )}
    </div>
  );
}

// components/UserActions.tsx - Client Component
'use client';

import { useState } from 'react';

interface UserActionsProps {
  userId: string;
}

export default function UserActions({ userId }: UserActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleCreatePost = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (res.ok) {
        setMessage('Post created successfully!');
      } else {
        setMessage('Failed to create post');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInviteUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (res.ok) {
        setMessage('Invitation sent!');
      } else {
        setMessage('Failed to send invitation');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="user-actions">
      <button onClick={handleCreatePost} disabled={loading}>
        Create New Post
      </button>
      <button onClick={handleInviteUser} disabled={loading}>
        Invite User
      </button>
      {message && <p className="action-message">{message}</p>}
    </div>
  );
}`,
        language: 'typescript',
        explanation: 'Demonstrates the power of combining Server and Client Components: server-side data fetching for initial data, client components for interactive features, and proper separation of concerns.'
      },
      {
        title: 'API Routes with Authentication',
        code: `// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user in database (pseudo-code)
    const user = await db.user.findUnique({ where: { email } });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(SECRET_KEY);
    
    // Set cookie
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('token');
  
  return NextResponse.json({ success: true });
}

// app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');

async function verifyAuth() {
  const token = cookies().get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  // Public endpoint - no auth required
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  const posts = await db.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
  
  const total = await db.post.count();
  
  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: Request) {
  // Protected endpoint - auth required
  const user = await verifyAuth();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const { title, content, tags } = await request.json();
    
    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Create post
    const post = await db.post.create({
      data: {
        title,
        content,
        tags: tags || [],
        authorId: user.userId as string,
      },
    });
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// app/api/posts/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await db.post.findUnique({
    where: { id: params.id },
    include: { author: { select: { name: true, email: true } } },
  });
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(post);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const post = await db.post.findUnique({ where: { id: params.id } });
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    );
  }
  
  if (post.authorId !== user.userId) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  const { title, content, tags } = await request.json();
  
  const updatedPost = await db.post.update({
    where: { id: params.id },
    data: { title, content, tags },
  });
  
  return NextResponse.json(updatedPost);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const post = await db.post.findUnique({ where: { id: params.id } });
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    );
  }
  
  if (post.authorId !== user.userId) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  await db.post.delete({ where: { id: params.id } });
  
  return NextResponse.json({ success: true });
}`,
        language: 'typescript',
        explanation: 'Complete API routes implementation with JWT authentication, login/logout endpoints, protected and public routes, proper error handling, and RESTful CRUD operations.'
      }
    ];

    for (const example of examples) {
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, code, language, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [lessonId, example.title, example.code, example.language, example.explanation, examples.indexOf(example)]);
    }

    // Add quiz questions
    const quizQuestions = [
      {
        question: 'What is the main difference between Server Components and Client Components in Next.js App Router?',
        options: JSON.stringify([
          'Server Components are faster than Client Components',
          'Server Components render on the server and cannot use React hooks, Client Components render on the client with full React features',
          'Client Components are deprecated in Next.js 13+',
          'Server Components only work with TypeScript'
        ]),
        correct_answer: 1,
        explanation: 'Server Components render on the server and cannot use browser-only features like hooks, while Client Components (marked with \'use client\') run on the client and have access to all React features including hooks and browser APIs.'
      },
      {
        question: 'How do you enable static site generation with periodic revalidation in Next.js?',
        options: JSON.stringify([
          'Use getStaticProps with revalidate option',
          'Use fetch with next: { revalidate: seconds } option',
          'Use cache: \'force-cache\' in fetch',
          'Use getServerSideProps with revalidate'
        ]),
        correct_answer: 1,
        explanation: 'In the App Router, you use fetch with the next option: fetch(url, { next: { revalidate: 3600 } }) to enable Incremental Static Regeneration (ISR), which regenerates the page after the specified seconds.'
      },
      {
        question: 'What is the purpose of generateStaticParams in Next.js App Router?',
        options: JSON.stringify([
          'To generate query parameters for API routes',
          'To create static paths for dynamic routes at build time',
          'To validate route parameters at runtime',
          'To generate metadata for SEO'
        ]),
        correct_answer: 1,
        explanation: 'generateStaticParams is used to pre-render dynamic routes at build time by returning an array of params. This is the App Router equivalent of getStaticPaths from the Pages Router.'
      },
      {
        question: 'When should you use cache: \'no-store\' in a fetch request?',
        options: JSON.stringify([
          'For static content that never changes',
          'For data that should be fresh on every request (SSR)',
          'To improve performance with caching',
          'Only in Client Components'
        ]),
        correct_answer: 1,
        explanation: 'Use cache: \'no-store\' when you want to fetch fresh data on every request, implementing true server-side rendering (SSR). This ensures the data is always up-to-date but sacrifices caching benefits.'
      },
      {
        question: 'How do you create a protected API route in Next.js?',
        options: JSON.stringify([
          'Use middleware to check authentication before the route handler',
          'Add authentication logic directly in the route handler',
          'Both middleware and route handler checks are valid approaches',
          'Protected routes are not possible in Next.js'
        ]),
        correct_answer: 2,
        explanation: 'Both approaches are valid: you can use middleware to protect multiple routes at once, or add authentication checks directly in individual route handlers. The best choice depends on your needs - middleware for broad protection, route handlers for fine-grained control.'
      }
    ];

    for (const q of quizQuestions) {
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [lessonId, q.question, q.options, q.correct_answer, q.explanation, quizQuestions.indexOf(q)]);
    }

    await client.query('COMMIT');
    console.log('✅ Next.js SSR lesson added successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding Next.js SSR lesson:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

seedNextJsSSR().catch(console.error);
