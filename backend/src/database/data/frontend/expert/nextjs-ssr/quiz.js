// ============================================================================
// Next.js & SSR — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  "nextjs-app-router": [
    {
      question_text:
        "What is the difference between layout.tsx and template.tsx in Next.js App Router, and when would you use template.tsx instead of layout.tsx?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "layout.tsx persists across navigations (never unmounts) — it preserves state, scroll position, and does not re-run effects when navigating between child routes; template.tsx re-mounts on every navigation (creates a new instance) — useState resets, useEffect re-runs, DOM is recreated; use template.tsx for page transition animations (framer-motion AnimatePresence), per-page analytics logging, resetting uncontrolled form state, or any scenario where you need fresh state on each navigation",
        "layout.tsx is for Server Components only while template.tsx is for Client Components only — they serve different rendering environments; use template.tsx whenever you need useState or useEffect in a wrapper component, and layout.tsx for static server-rendered wrappers",
        "layout.tsx renders synchronously and blocks navigation until complete, while template.tsx renders asynchronously with streaming — use template.tsx for layouts that fetch data, and layout.tsx for static wrappers that don't need data",
        "layout.tsx applies to a single page route while template.tsx applies to all child routes recursively — use template.tsx when you want a wrapper that affects the entire route subtree, and layout.tsx for single-page wrappers only",
      ]),
      correct_answer:
        "layout.tsx persists across navigations (never unmounts) — it preserves state, scroll position, and does not re-run effects when navigating between child routes; template.tsx re-mounts on every navigation (creates a new instance) — useState resets, useEffect re-runs, DOM is recreated; use template.tsx for page transition animations (framer-motion AnimatePresence), per-page analytics logging, resetting uncontrolled form state, or any scenario where you need fresh state on each navigation",
      explanation:
        "This is a subtle but important distinction in App Router architecture. When you navigate from /dashboard/settings to /dashboard/analytics, the dashboard layout.tsx stays mounted — its state, refs, and DOM are preserved. This is usually desirable (sidebar state, scroll position). But sometimes you want a fresh start — for example, a page transition animation needs the component to mount/unmount on each navigation. That's what template.tsx does: it wraps children like layout.tsx, but React unmounts and remounts it on every navigation. If both layout.tsx and template.tsx exist in the same folder, the hierarchy is: layout.tsx → template.tsx → page.tsx. The template sits inside the layout and outside the page. Common interview follow-up: 'Can you have both?' — Yes, layout.tsx persists the sidebar while template.tsx animates the content area.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text:
        "What is the serialization boundary in Next.js App Router, and what happens when you try to pass a function as a prop from a Server Component to a Client Component?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The serialization boundary is the divide between Server and Client Components — props passed from Server to Client must be serializable (strings, numbers, booleans, plain objects, arrays, Date, Map, Set, FormData, Promises, React elements) because they are sent as JSON-like RSC payload over the network; passing a function, class instance, Symbol, or DOM node causes a build-time error because these cannot be serialized into the RSC payload format; the fix for functions is to use Server Actions ('use server') which create a reference ID that the client can invoke remotely",
        "The serialization boundary is a performance optimization — Next.js serializes commonly used props into a shared cache to avoid re-rendering; passing functions is allowed but triggers a console warning because functions cannot be cached efficiently; class instances work fine because JavaScript classes are serialized using JSON.stringify with a custom replacer",
        "The serialization boundary only applies during Static Site Generation (SSG) — during SSR, all prop types including functions are supported because the server and client share the same JavaScript runtime; the build error only occurs when using generateStaticParams with non-serializable props",
        "The serialization boundary is between the server's Node.js runtime and the Edge Runtime — it controls which APIs are available in middleware vs page components; functions can be passed freely between Server and Client Components because they share the same V8 engine process",
      ]),
      correct_answer:
        "The serialization boundary is the divide between Server and Client Components — props passed from Server to Client must be serializable (strings, numbers, booleans, plain objects, arrays, Date, Map, Set, FormData, Promises, React elements) because they are sent as JSON-like RSC payload over the network; passing a function, class instance, Symbol, or DOM node causes a build-time error because these cannot be serialized into the RSC payload format; the fix for functions is to use Server Actions ('use server') which create a reference ID that the client can invoke remotely",
      explanation:
        "Server Components run on the server and their output (the RSC payload) is streamed to the client as a serialized format — similar to JSON but supporting more types (Date, Map, Set, FormData, typed arrays, and even Promises via React.use()). When a Server Component renders <ClientComponent onClick={handleClick} />, the function handleClick cannot be included in the RSC payload — it's a closure over server-side scope (database connections, environment variables, etc.) that makes no sense on the client. Next.js catches this at build time and throws an error. The solution is Server Actions: marking a function with 'use server' creates a serializable reference (essentially an endpoint URL) that the client can POST to — the function body stays on the server but the client holds a 'remote procedure call' reference. React elements (<ServerComponent />) CAN cross the boundary because they are serialized as RSC payload chunks, not JavaScript.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "How do parallel routes work in Next.js App Router, and what is the role of default.tsx in a parallel route?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Parallel routes use the @folder convention to create named slots that are rendered simultaneously in the parent layout — the layout receives each slot as a prop (e.g., { children, analytics, team } for @analytics and @team); each slot has independent loading.tsx and error.tsx, so one failing slot doesn't break the others; default.tsx serves as a fallback UI when a parallel slot has no matching route for the current URL — without it, navigating to a sub-route that only exists in one slot would cause a 404 for the unmatched slots",
        "Parallel routes use the @folder convention to run multiple Server Component data fetches in parallel using Promise.all — they are a performance optimization that batches concurrent requests; default.tsx is the main content that renders while the parallel fetches are in progress, similar to loading.tsx but specifically for parallel data loading",
        "Parallel routes split the page into independently scrollable frames like HTML iframes — each @folder creates a separate browsing context with its own URL; default.tsx sets the default dimensions and scroll behavior of each frame; they are used for multi-panel editors like VS Code's split view",
        "Parallel routes render the same component with different props simultaneously for A/B testing — the @folder name becomes the test variant; default.tsx is the control variant that renders when the user is not enrolled in any test; Next.js automatically tracks conversion rates for each variant",
      ]),
      correct_answer:
        "Parallel routes use the @folder convention to create named slots that are rendered simultaneously in the parent layout — the layout receives each slot as a prop (e.g., { children, analytics, team } for @analytics and @team); each slot has independent loading.tsx and error.tsx, so one failing slot doesn't break the others; default.tsx serves as a fallback UI when a parallel slot has no matching route for the current URL — without it, navigating to a sub-route that only exists in one slot would cause a 404 for the unmatched slots",
      explanation:
        "Parallel routes solve a common dashboard problem: you want to show metrics, activity feed, and main content on the same page, but they have different data sources with different load times. With traditional rendering, the slowest data source blocks the entire page. With parallel routes, each @slot loads independently — @metrics can show a loading skeleton while @activity already has data. The layout receives slots as named props and places them in the grid. The default.tsx file is crucial for navigation: imagine you have @analytics and @team slots at /dashboard, but /dashboard/settings only has content for children (page.tsx). Without default.tsx in @analytics and @team, Next.js doesn't know what to render in those slots at /dashboard/settings, causing either a 404 or rendering nothing. default.tsx typically returns null (hide the slot) or a simplified version of the slot's content.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "How does Next.js middleware work, and what are its limitations compared to regular Server Component code?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Middleware runs before every matched request at the Edge Runtime — it can redirect, rewrite URLs, set/read cookies, modify response headers, and implement auth guards; it is defined in middleware.ts at the project root (not inside app/) with a config.matcher to restrict which routes trigger it; its key limitation is that it runs in the Edge Runtime, not Node.js — so it cannot use Node.js APIs like fs, path, Buffer, or node:crypto; it can only use Web Standard APIs (fetch, Response, crypto.subtle, TextEncoder, URL, Headers)",
        "Middleware runs after the page renders but before the response is sent — it can modify the rendered HTML, inject scripts, and transform the RSC payload; it runs in the Node.js runtime with full API access; its limitation is that it adds latency because it must wait for the page to render first before it can modify the output",
        "Middleware is a client-side concept that runs in the browser's service worker — it intercepts fetch requests from Client Components and can cache responses, modify headers, and implement offline support; it cannot access server-side resources; defined in public/middleware.js following the Service Worker API",
        "Middleware runs only during the build phase (next build) — it preprocesses routes, validates static params, and generates redirect maps; it cannot run at request time; its limitation is that it only affects statically generated routes, not dynamic SSR routes; it uses the full Node.js runtime during build",
      ]),
      correct_answer:
        "Middleware runs before every matched request at the Edge Runtime — it can redirect, rewrite URLs, set/read cookies, modify response headers, and implement auth guards; it is defined in middleware.ts at the project root (not inside app/) with a config.matcher to restrict which routes trigger it; its key limitation is that it runs in the Edge Runtime, not Node.js — so it cannot use Node.js APIs like fs, path, Buffer, or node:crypto; it can only use Web Standard APIs (fetch, Response, crypto.subtle, TextEncoder, URL, Headers)",
      explanation:
        "Middleware is one of the most powerful features in Next.js but has important constraints. It runs at the edge (Vercel Edge Functions, Cloudflare Workers, etc.) before the request reaches your Server Components or Route Handlers. This makes it ideal for: (1) Auth guards — check session cookies and redirect to /login before any page code runs. (2) URL rewrites — A/B testing by rewriting /pricing to /pricing/variant-a based on a cookie. (3) Geolocation-based routing — redirect to country-specific pages. (4) Bot detection — block or redirect scrapers. The Edge Runtime constraint is critical: you cannot import heavy Node.js libraries (Prisma, bcrypt, jsonwebtoken with Node crypto). For JWT verification, use the jose library which works with Web Crypto API. The config.matcher should exclude static assets ('/((?!_next/static|_next/image|favicon.ico).*)'). Only ONE middleware.ts file is allowed per project.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "What is the 'donut pattern' in Next.js App Router, and why is it the recommended approach for mixing Server and Client Components?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The donut pattern means wrapping Server Components as children of Client Components — the Client Component is the 'donut' (interactive shell) and the Server Components are the 'hole' (content passed as children/props); this works because the 'use client' boundary is only infectious downward through imports, not through children props; Server Components passed as children are pre-rendered on the server as RSC payload and NOT added to the client JavaScript bundle, keeping the bundle small while maintaining interactivity at the edges",
        "The donut pattern means rendering a loading spinner in a circular (donut-shaped) progress indicator around the page content while Server Components are streaming — it's a UX pattern where the donut fills up as more content arrives; it uses a circular SVG animation with a percentage based on how many Suspense boundaries have resolved",
        "The donut pattern means structuring your component tree with Client Components at the center (core logic) surrounded by Server Components at the outer layer (data fetching) — like concentric rings of a donut; the inner Client Components handle all state and events while outer Server Components fetch and pass data inward",
        "The donut pattern means using route groups to create a circular navigation structure where the last page links back to the first — like navigating around a donut; it's implemented with route groups (step1)/(step2)/(step3) where step3's next button redirects to step1",
      ]),
      correct_answer:
        "The donut pattern means wrapping Server Components as children of Client Components — the Client Component is the 'donut' (interactive shell) and the Server Components are the 'hole' (content passed as children/props); this works because the 'use client' boundary is only infectious downward through imports, not through children props; Server Components passed as children are pre-rendered on the server as RSC payload and NOT added to the client JavaScript bundle, keeping the bundle small while maintaining interactivity at the edges",
      explanation:
        "The donut pattern is the most important composition technique in App Router architecture. The key insight is how 'use client' propagates: it's infectious through IMPORTS — if a Client Component imports another component, that component becomes a Client Component too. But it's NOT infectious through CHILDREN PROPS — if a Client Component receives <ServerComponent /> as props.children, the Server Component remains a Server Component. Example: <Sidebar> (Client — handles open/close state) receives <NavLinks /> and <UserProfile /> (Server — fetch user data, zero JS) as children. The NavLinks and UserProfile are rendered on the server as RSC payload, passed to the Sidebar as pre-rendered React nodes, and never added to the client bundle. Without this pattern, you'd have to make NavLinks and UserProfile Client Components just because their parent (Sidebar) needs interactivity — unnecessarily increasing the JavaScript bundle. The name comes from the visual: Client Component (outer ring) → Server Component (hole in the middle).",
      difficulty: "medium",
      order_index: 5,
    },
  ],
  "nextjs-data-fetching": [
    {
      question_text:
        "What are the four rendering strategies in Next.js App Router (SSG, SSR, ISR, CSR), and how does Next.js decide whether a route is static or dynamic?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "SSG (build time, fastest, default), SSR (per request, with cache: 'no-store' or dynamic functions like cookies()/headers()), ISR (static + time-based revalidation via next: { revalidate: N }, stale-while-revalidate), CSR (client-side fetch in 'use client' components with useEffect/SWR); a route is static by default and becomes dynamic when it uses cache: 'no-store', calls cookies()/headers()/searchParams, sets export const dynamic = 'force-dynamic', or has an uncached POST Route Handler — any ONE of these triggers dynamic rendering for the entire route",
        "SSG (server-side generation, renders on the server per-request), SSR (static-site rendering, pre-built at compile time), ISR (instant server rendering, renders in under 100ms), CSR (cached server rendering, caches on CDN); Next.js uses an AI model to analyze data patterns and automatically choose the optimal strategy based on response size and update frequency",
        "SSG (only for pages without props), SSR (only for pages with getServerSideProps), ISR (only for pages with getStaticProps + revalidate), CSR (only for pages with useEffect); the strategy is determined by which data fetching function you export — App Router removed this decision and always uses SSR",
        "SSG (generates JSON, not HTML), SSR (generates HTML using server-side DOM), ISR (generates incremental diffs using React reconciliation), CSR (generates shadow DOM on the client); Next.js requires explicitly setting export const rendering = 'ssg' | 'ssr' | 'isr' | 'csr' in every page file — there is no automatic detection",
      ]),
      correct_answer:
        "SSG (build time, fastest, default), SSR (per request, with cache: 'no-store' or dynamic functions like cookies()/headers()), ISR (static + time-based revalidation via next: { revalidate: N }, stale-while-revalidate), CSR (client-side fetch in 'use client' components with useEffect/SWR); a route is static by default and becomes dynamic when it uses cache: 'no-store', calls cookies()/headers()/searchParams, sets export const dynamic = 'force-dynamic', or has an uncached POST Route Handler — any ONE of these triggers dynamic rendering for the entire route",
      explanation:
        "This is the most fundamental Next.js interview question. The key insight: routes are static by default in App Router. Next.js analyzes your code and if ANYTHING dynamic is detected, the entire route becomes dynamic. This is different from the Pages Router where you explicitly chose between getStaticProps and getServerSideProps. In App Router: (1) No fetch options or only cache: 'force-cache' → SSG. (2) next: { revalidate: 60 } → ISR (static with background refresh). (3) cache: 'no-store' or cookies()/headers() → SSR. (4) useEffect + fetch in a 'use client' component → CSR (portion of page). A common gotcha: if your layout.tsx calls cookies() for auth, ALL pages under that layout become dynamic — even pages that don't need per-request data. Solution: move cookies() to individual pages or use middleware for auth instead.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "Explain the three caching layers in Next.js App Router (Data Cache, Full Route Cache, Router Cache) — where does each live, how long does it persist, and how do you invalidate each?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Data Cache: server-side, caches individual fetch() responses keyed by URL + options, persists across deployments until revalidateTag/revalidatePath or time-based expiry; Full Route Cache: server-side, caches complete HTML + RSC payload for static routes built at build time, purged when Data Cache entries it depends on are revalidated; Router Cache: client-side in-memory, caches RSC payloads for visited routes enabling instant back/forward navigation, auto-expires at 30s for dynamic routes and 5min for static routes, manually cleared with router.refresh()",
        "Data Cache: client-side localStorage, caches API responses permanently until the user clears browser data; Full Route Cache: CDN-level, caches at Vercel's edge network only and is unavailable for self-hosted deployments; Router Cache: server-side Redis, shared across all users for fast routing, persists until server restarts — cleared automatically every 24 hours",
        "Data Cache: browser HTTP cache (Cache-Control headers), managed by the browser's cache eviction policy; Full Route Cache: .next/cache directory on the file system, deleted on every next build; Router Cache: React's virtual DOM diff cache, stores previous component trees for reconciliation — not configurable and has no expiration",
        "All three caches are the same system with different names — 'Data Cache' refers to GET requests, 'Full Route Cache' refers to POST requests, and 'Router Cache' refers to prefetched links; they all live on the server and are cleared together with revalidatePath; there is no client-side caching in Next.js",
      ]),
      correct_answer:
        "Data Cache: server-side, caches individual fetch() responses keyed by URL + options, persists across deployments until revalidateTag/revalidatePath or time-based expiry; Full Route Cache: server-side, caches complete HTML + RSC payload for static routes built at build time, purged when Data Cache entries it depends on are revalidated; Router Cache: client-side in-memory, caches RSC payloads for visited routes enabling instant back/forward navigation, auto-expires at 30s for dynamic routes and 5min for static routes, manually cleared with router.refresh()",
      explanation:
        "Understanding these three layers is critical for debugging 'why is my page showing stale data?' in production. Data Cache operates at the fetch level — each fetch() call's response is cached independently on the server. This cache persists across deployments (important!), meaning a redeploy does NOT clear it — only revalidatePath, revalidateTag, or time-based expiry do. Full Route Cache is the complete rendered output — both HTML (for initial loads) and RSC payload (for client navigations). It's generated at build time for static routes and lives on the server. When the Data Cache entries a route depends on are revalidated, the Full Route Cache is also purged. Router Cache is purely client-side — React stores RSC payloads in memory for routes the user has visited. This enables instant back/forward navigation. But it can serve stale data — dynamic routes expire after 30 seconds, static after 5 minutes. Call router.refresh() to bypass it. Common gotcha: revalidatePath on the server does NOT clear Router Cache on clients that already have the old data cached.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "What is the difference between revalidatePath and revalidateTag, and when should you prefer one over the other?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "revalidatePath('/blog') purges the Data Cache and Full Route Cache for a specific URL path — it invalidates all fetch() results that were used during that route's render; revalidateTag('posts') purges all Data Cache entries tagged with { next: { tags: ['posts'] } } regardless of which route they belong to — it's more granular and can affect multiple routes; prefer revalidateTag when one mutation affects data used across many pages (e.g., updating a post should refresh /blog, /blog/[slug], /dashboard, and /feed), and prefer revalidatePath for single-page invalidation",
        "revalidatePath works on static routes (SSG) while revalidateTag works on dynamic routes (SSR) — they target different rendering strategies; you cannot use revalidatePath on SSR routes or revalidateTag on SSG routes; prefer revalidatePath for marketing pages and revalidateTag for dashboard pages",
        "revalidatePath clears the server-side cache while revalidateTag clears the client-side Router Cache — they operate on different cache layers; revalidatePath requires a server restart to take effect while revalidateTag is instant; prefer revalidatePath for deployments and revalidateTag for runtime updates",
        "revalidatePath accepts a URL string and revalidateTag accepts a function that determines which routes to invalidate — revalidateTag is more flexible because it can use conditional logic; they both clear the same cache layer; the choice is purely a code style preference with no functional difference",
      ]),
      correct_answer:
        "revalidatePath('/blog') purges the Data Cache and Full Route Cache for a specific URL path — it invalidates all fetch() results that were used during that route's render; revalidateTag('posts') purges all Data Cache entries tagged with { next: { tags: ['posts'] } } regardless of which route they belong to — it's more granular and can affect multiple routes; prefer revalidateTag when one mutation affects data used across many pages (e.g., updating a post should refresh /blog, /blog/[slug], /dashboard, and /feed), and prefer revalidatePath for single-page invalidation",
      explanation:
        "This question tests understanding of cache invalidation strategy. Consider a blog app: the post list appears on /blog, individual posts on /blog/[slug], and post counts on /dashboard. When you create a new post, you need to invalidate all three pages. With revalidatePath, you'd need three calls: revalidatePath('/blog'), revalidatePath('/blog/new-post'), revalidatePath('/dashboard'). With revalidateTag, you tag all post-related fetches with { next: { tags: ['posts'] } } and call revalidateTag('posts') once — it purges all of them. Tags are also more composable: a fetch can have multiple tags (e.g., ['posts', 'featured', 'homepage-section']), and different mutations can invalidate different tags. revalidatePath has a second argument for scope: revalidatePath('/blog', 'layout') purges /blog AND all nested routes. Best practice: use tags for data-centric invalidation (invalidate all 'user' data) and paths for page-centric invalidation (invalidate this specific page).",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "How do useFormStatus and useOptimistic work with Server Actions, and what are the key rules for using useFormStatus correctly?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "useFormStatus returns { pending, data, method, action } and MUST be called inside a child component of <form>, not in the component that renders the <form> itself — it reads the pending state of the parent form's Server Action submission; useOptimistic takes the current server state and a reducer function, returning [optimisticState, addOptimistic] — calling addOptimistic immediately updates the UI before the Server Action completes, and React automatically reverts to server state if the action fails; both enable responsive UIs during server mutations without manual loading state management",
        "useFormStatus is a server-side hook that runs inside Server Actions to report progress back to the client via WebSocket streaming — it sends percentage-based progress updates; useOptimistic is a compiler optimization that pre-renders the expected result at build time — it has no runtime cost; both require React 19 Canary and do not work in stable React versions",
        "useFormStatus replaces the native form.submit() method with an async version that returns a Promise — calling await form.submit() gives you the Server Action's return value; useOptimistic overrides React.memo to skip re-rendering during server mutations — it's a performance optimization, not a UI update mechanism; useFormStatus works anywhere in the component tree, not just inside forms",
        "useFormStatus wraps the entire form in a try/catch to handle Server Action errors — it provides error state and retry functions similar to error.tsx; useOptimistic pre-fetches data that the user is likely to request next based on navigation patterns — it's similar to <Link prefetch>; both are Next.js-specific APIs not available in plain React",
      ]),
      correct_answer:
        "useFormStatus returns { pending, data, method, action } and MUST be called inside a child component of <form>, not in the component that renders the <form> itself — it reads the pending state of the parent form's Server Action submission; useOptimistic takes the current server state and a reducer function, returning [optimisticState, addOptimistic] — calling addOptimistic immediately updates the UI before the Server Action completes, and React automatically reverts to server state if the action fails; both enable responsive UIs during server mutations without manual loading state management",
      explanation:
        "The biggest gotcha with useFormStatus is placement: it reads status from the nearest parent <form> element. If you call it in the same component that renders <form>, there IS no parent form — useFormStatus returns { pending: false } permanently. You must extract the submit button into a separate child component: function SubmitButton() { const { pending } = useFormStatus(); return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>; }. useOptimistic is complementary: it lets you show the expected result immediately. When the user adds a todo, addOptimistic adds it to the list at 50% opacity. The Server Action then runs asynchronously. If it succeeds, the page revalidates and the real data replaces the optimistic version. If it fails, React automatically reverts — the optimistic todo disappears. The key: addOptimistic is synchronous (instant UI), the server action is async (may take seconds). Both are React APIs (not Next.js-specific) from react-dom and react respectively, but they're designed to work with Server Actions.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "How does generateStaticParams work in Next.js App Router, and what happens when a user visits a dynamic route that was NOT pre-rendered by generateStaticParams?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "generateStaticParams returns an array of param objects for a dynamic route segment — Next.js pre-renders these routes at build time as static HTML; when a user visits a route NOT in the generated list, the behavior depends on dynamicParams: if true (default), the route is rendered on-demand on the server, then cached for subsequent requests (incremental adoption); if false, non-generated routes return a 404; generateStaticParams can also be used with generateMetadata for pre-rendered SEO metadata, and supports catch-all [...slug] and optional catch-all [[...slug]] segments",
        "generateStaticParams is an alias for getStaticPaths from Pages Router — it works identically in every way; ungenerated routes always return a 404 regardless of any configuration; dynamicParams is not a real export and has no effect; it only supports single-segment dynamic routes like [id], not catch-all segments",
        "generateStaticParams runs on every request (not at build time) to determine which routes are allowed — it acts as a route guard; ungenerated routes trigger a redirect to the nearest generated route; it cannot be used with generateMetadata because metadata is generated separately in a post-build step",
        "generateStaticParams pre-downloads API data for all possible routes and stores it in .next/cache — it's a data prefetching mechanism, not a route generation mechanism; ungenerated routes fetch data at runtime without caching; it requires an explicit return type of Promise<StaticParam[]> and fails silently if the return type is wrong",
      ]),
      correct_answer:
        "generateStaticParams returns an array of param objects for a dynamic route segment — Next.js pre-renders these routes at build time as static HTML; when a user visits a route NOT in the generated list, the behavior depends on dynamicParams: if true (default), the route is rendered on-demand on the server, then cached for subsequent requests (incremental adoption); if false, non-generated routes return a 404; generateStaticParams can also be used with generateMetadata for pre-rendered SEO metadata, and supports catch-all [...slug] and optional catch-all [[...slug]] segments",
      explanation:
        "generateStaticParams is the App Router replacement for getStaticPaths. At build time, it returns an array like [{ slug: 'intro' }, { slug: 'api-ref' }] — Next.js generates static HTML for each. The critical interview insight is the dynamicParams behavior: by default (dynamicParams: true), routes NOT in the generated list are rendered on-demand when first visited, then cached for subsequent visitors. This enables incremental adoption — you pre-render your 1000 most popular blog posts at build time, and the other 50,000 are generated on first visit. Set export const dynamicParams = false to return 404 for ungenerated routes (useful for whitelists). For catch-all segments: app/docs/[...slug]/page.tsx receives params.slug as an array (['api', 'auth', 'oauth']), and generateStaticParams returns { slug: ['api', 'auth', 'oauth'] }. Optional catch-all [[...slug]] also matches the root route (/docs where slug is undefined). generateMetadata in the same file shares the same fetch deduplication — calling getPost(slug) in both only makes one request.",
      difficulty: "medium",
      order_index: 5,
    },
  ],
};

export default quiz;
