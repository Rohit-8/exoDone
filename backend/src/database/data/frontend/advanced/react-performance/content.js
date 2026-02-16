// ============================================================================
// React Performance — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "React Performance",
  slug: "react-performance",
  description:
    "Optimize rendering with React.memo, profiling tools, code splitting, lazy loading, and virtualization.",
  estimated_time: 180,
  order_index: 8,
};

export const lessons = [
  {
    title: "React.memo, Memoization & Profiling",
    slug: "memo-profiling",
    summary:
      "Master React's rendering pipeline, prevent unnecessary re-renders with React.memo / useMemo / useCallback, profile with React DevTools, and avoid common performance anti-patterns.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 1,
    key_points: [
      "React's rendering pipeline: trigger → render (virtual DOM reconciliation via fiber tree diffing) → commit (actual DOM mutations) — understanding each phase is key to knowing what to optimize",
      "React re-renders a component whenever its parent re-renders, its state changes, or its context value changes — even if the component's props are identical, React still calls the render function unless memoized",
      "React.memo wraps a function component to skip re-renders when props are shallowly equal — it compares each prop with Object.is, meaning new object/array/function references break memoization even if values are the same",
      "Custom comparator in React.memo: React.memo(Component, (prevProps, nextProps) => boolean) — return true to skip re-render, false to allow; useful for deep comparison of specific props while ignoring others (e.g., ignoring callback props)",
      "useMemo caches the result of an expensive computation between renders — it recalculates only when its dependency array values change; also used for referential equality to prevent child re-renders when passing objects/arrays as props",
      "useCallback caches a function reference between renders — equivalent to useMemo(() => fn, deps); essential when passing callbacks to React.memo-wrapped children, otherwise a new function reference breaks the child's memoization",
      "React DevTools Profiler: flame chart shows the component tree with render times, ranked chart sorts components by render duration, 'Why did this render?' shows the trigger (props changed, hooks changed, parent rendered) — use it to find actual bottlenecks before optimizing",
      "Common anti-patterns: inline object literals in JSX (<Child style={{ color: 'red' }} />), anonymous arrow functions in JSX (<Child onClick={() => doThing()} />), spreading entire state objects as props, and computing derived data inside render without useMemo — each creates new references every render",
    ],
    content: `
# React.memo, Memoization & Profiling

## React's Rendering Pipeline

Understanding **when** and **why** React renders is the foundation of all performance optimization. React's rendering has three phases:

1. **Trigger** — A render is scheduled (setState, context change, parent re-render)
2. **Render** — React calls your component function to produce a new virtual DOM tree, then diffs it against the previous tree using the **reconciliation algorithm** (fiber-based)
3. **Commit** — React applies the minimal set of actual DOM mutations needed

\\\`\\\`\\\`
setState() → Trigger → Render (VDOM diff) → Commit (DOM mutations)
                         ↑                      ↑
                    This is "rendering"     This is the expensive part
                    (calling your function)  (but React minimizes it)
\\\`\\\`\\\`

**Key insight:** "Rendering" in React means calling your component function — it does NOT mean touching the DOM. A component can "render" (run its function) but produce the same output, causing zero DOM mutations. The render phase is usually fast; the commit phase (DOM changes, layout, paint) is slow. However, if thousands of components render unnecessarily, the render phase itself becomes the bottleneck.

---

## When Does React Re-Render?

A component re-renders when:

1. **Its own state changes** (\\\`setState\\\`, \\\`useReducer\\\` dispatch)
2. **Its parent re-renders** — even if the child's props are identical
3. **A context it consumes changes** — any consumer of a context re-renders when the provider's value changes
4. **A custom hook's state changes** — hooks are just function calls, so state changes inside hooks trigger re-renders in the host component

\\\`\\\`\\\`jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* ExpensiveChild re-renders on EVERY count change
          even though it receives no props that changed */}
      <ExpensiveChild />
      <AnotherChild data={{ items: [] }} />  {/* Also re-renders — new object ref */}
    </div>
  );
}
\\\`\\\`\\\`

**This is the #1 performance issue in React apps**: unnecessary re-renders cascading through the tree.

---

## React.memo — Shallow Comparison

\\\`React.memo\\\` is a higher-order component that wraps a function component. Before re-rendering, it compares each new prop against the previous prop using \\\`Object.is\\\` (shallow equality). If all props are the same reference, the component **skips the render phase entirely**.

\\\`\\\`\\\`jsx
const ExpensiveChild = React.memo(function ExpensiveChild({ data, onSelect }) {
  console.log('ExpensiveChild rendered');
  // expensive rendering logic...
  return (
    <ul>
      {data.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});
\\\`\\\`\\\`

### When React.memo Works

\\\`\\\`\\\`jsx
// ✅ Primitives — same value means same reference
<ExpensiveChild count={5} label="hello" />

// ✅ Stable references — object/function created outside render or memoized
const data = useMemo(() => items.filter(i => i.active), [items]);
const onSelect = useCallback((id) => setSelected(id), []);
<ExpensiveChild data={data} onSelect={onSelect} />
\\\`\\\`\\\`

### When React.memo Breaks

\\\`\\\`\\\`jsx
// ❌ Inline object — NEW reference every render, memo always fails
<ExpensiveChild style={{ color: 'red' }} />

// ❌ Inline function — NEW reference every render
<ExpensiveChild onSelect={(id) => setSelected(id)} />

// ❌ Spread operator with changing parent state
<ExpensiveChild {...parentState} />
\\\`\\\`\\\`

### Custom Comparator

For fine-grained control, pass a comparison function as the second argument:

\\\`\\\`\\\`jsx
const HeavyChart = React.memo(
  function HeavyChart({ data, theme, onHover }) {
    // ... heavy D3 rendering
  },
  (prevProps, nextProps) => {
    // Only re-render if data or theme changed — ignore onHover
    return (
      prevProps.data === nextProps.data &&
      prevProps.theme === nextProps.theme
    );
    // Return true = skip re-render, false = re-render
    // NOTE: opposite of shouldComponentUpdate!
  }
);
\\\`\\\`\\\`

**Interview tip:** "The comparison function in React.memo returns true to skip the re-render — this is the **opposite** of \\\`shouldComponentUpdate\\\`, which returns true to allow a re-render."

---

## useMemo — Caching Expensive Computations

\\\`useMemo\\\` caches a computed value between renders. It only recalculates when one of its dependencies changes.

\\\`\\\`\\\`jsx
function ProductList({ products, searchQuery, sortBy }) {
  // ✅ Only recomputes when products, searchQuery, or sortBy change
  const filteredAndSorted = useMemo(() => {
    console.log('Filtering and sorting...');
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, searchQuery, sortBy]);

  return (
    <ul>
      {filteredAndSorted.map(p => <ProductCard key={p.id} product={p} />)}
    </ul>
  );
}
\\\`\\\`\\\`

### useMemo for Referential Equality

\\\`useMemo\\\` is also critical for maintaining stable references to objects and arrays passed as props to memoized children:

\\\`\\\`\\\`jsx
function Dashboard({ userId }) {
  const [refreshCount, setRefreshCount] = useState(0);

  // ✅ Stable reference — only changes when userId changes
  const queryConfig = useMemo(() => ({
    endpoint: \\\`/api/users/\\\${userId}\\\`,
    retry: 3,
    timeout: 5000,
  }), [userId]);

  // Without useMemo, every setRefreshCount would create a new queryConfig
  // object, causing MemoizedDataFetcher to re-render unnecessarily
  return <MemoizedDataFetcher config={queryConfig} />;
}
\\\`\\\`\\\`

---

## useCallback — Stabilizing Function References

\\\`useCallback\\\` caches a function reference between renders. It is equivalent to \\\`useMemo(() => fn, deps)\\\`.

\\\`\\\`\\\`jsx
function ParentList({ items }) {
  const [selected, setSelected] = useState(null);

  // ✅ Stable reference — same function identity between renders
  const handleSelect = useCallback((id) => {
    setSelected(id);
  }, []); // No dependencies — setSelected identity is stable (React guarantee)

  // ✅ Stable reference for a callback that depends on external value
  const handleDelete = useCallback((id) => {
    if (window.confirm('Delete?')) {
      deleteItem(id).then(() => setSelected(null));
    }
  }, []); // deleteItem is a module-level import, stable reference

  return (
    <ul>
      {items.map(item => (
        <MemoizedItem
          key={item.id}
          item={item}
          isSelected={item.id === selected}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}

const MemoizedItem = React.memo(function Item({ item, isSelected, onSelect, onDelete }) {
  console.log(\\\`Item \\\${item.id} rendered\\\`);
  return (
    <li className={isSelected ? 'selected' : ''}>
      <span onClick={() => onSelect(item.id)}>{item.name}</span>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </li>
  );
});
\\\`\\\`\\\`

### The Dependency Trap

\\\`\\\`\\\`jsx
// ❌ BAD — new function every time 'items' changes, breaking memoization
const handleExport = useCallback(() => {
  exportToCSV(items); // items is in the dependency array
}, [items]);

// ✅ BETTER — use a ref to read the latest value without adding a dependency
const itemsRef = useRef(items);
itemsRef.current = items;

const handleExport = useCallback(() => {
  exportToCSV(itemsRef.current); // no dependency on items
}, []);

// ✅ ALSO GOOD — use functional setState to avoid depending on state
const handleIncrement = useCallback(() => {
  setCount(prev => prev + 1); // no dependency on count
}, []);
\\\`\\\`\\\`

---

## React DevTools Profiler

The Profiler is your primary tool for measuring actual render performance.

### How to Use It

1. Open React DevTools → **Profiler** tab
2. Click **Record** → interact with the app → click **Stop**
3. Analyze the results:

### Flame Chart
Shows the component tree. Each bar represents a component:
- **Width** = render duration (wider = slower)
- **Color** = relative render time (yellow/red = slow, blue/green = fast)
- **Gray** = did not render (memoized or bailed out)
- Click a component to see its props and state at that commit

### Ranked Chart
Same data sorted by render duration — the slowest components appear at the top. Use this to find the biggest bottlenecks quickly.

### "Why Did This Render?"
Enable in Profiler settings → \\\`Record why each component rendered\\\`. Shows one of:
- **Props changed** — a new prop reference was passed
- **Hooks changed** — a hook's state or a consumed context value changed
- **Parent rendered** — the parent re-rendered and this component is not memoized

---

## React.Profiler Component API

For programmatic profiling in production:

\\\`\\\`\\\`jsx
function onRenderCallback(
  id,           // "navigation" — the Profiler tree id
  phase,        // "mount" | "update" | "nested-update"
  actualDuration, // ms spent rendering the committed tree
  baseDuration,   // ms estimated for a full re-render without memoization
  startTime,      // when React began rendering this update
  commitTime      // when React committed this update
) {
  // Send to analytics
  if (actualDuration > 16) { // Longer than one frame (60fps)
    analytics.track('slow-render', { id, phase, actualDuration, baseDuration });
  }
}

function App() {
  return (
    <React.Profiler id="navigation" onRender={onRenderCallback}>
      <Navigation />
    </React.Profiler>
  );
}
\\\`\\\`\\\`

**Interview tip:** \\\`baseDuration\\\` is the estimated render time **without** memoization. If \\\`actualDuration\\\` is much less than \\\`baseDuration\\\`, your memoization is working. If they're close, memoization isn't helping.

---

## Common Performance Anti-Patterns

### 1. Inline Objects in JSX

\\\`\\\`\\\`jsx
// ❌ New object every render — breaks React.memo on Child
<Child style={{ marginTop: 10 }} config={{ theme: 'dark', animate: true }} />

// ✅ Move to module scope (if static) or useMemo (if dynamic)
const childStyle = { marginTop: 10 }; // module scope = one reference forever
function Parent() {
  const config = useMemo(() => ({ theme, animate: true }), [theme]);
  return <Child style={childStyle} config={config} />;
}
\\\`\\\`\\\`

### 2. Anonymous Functions in JSX

\\\`\\\`\\\`jsx
// ❌ New function every render
<Child onClick={() => handleClick(item.id)} />

// ✅ Use useCallback, or pass id as prop and let Child call the handler
const handleClick = useCallback((id) => { /* ... */ }, []);
<Child onClick={handleClick} itemId={item.id} />
\\\`\\\`\\\`

### 3. Unstable Context Values

\\\`\\\`\\\`jsx
// ❌ New object every render — ALL consumers re-render
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ Memoize the value
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
\\\`\\\`\\\`

### 4. Deriving State in Render Without Memoization

\\\`\\\`\\\`jsx
// ❌ Filters 10,000 items on every keystroke AND every unrelated re-render
function SearchResults({ items, query }) {
  const results = items.filter(i => i.name.includes(query)); // runs every render
  return <List data={results} />;
}

// ✅ Memoize the derived value
function SearchResults({ items, query }) {
  const results = useMemo(
    () => items.filter(i => i.name.includes(query)),
    [items, query]
  );
  return <List data={results} />;
}
\\\`\\\`\\\`

---

## Rules of Thumb

1. **Measure before you optimize** — Use Profiler, not intuition
2. **Lift state down** — Move state closer to where it's used to limit re-render scope
3. **Split contexts** — Separate frequently-changing state (e.g., mouse position) from rarely-changing state (e.g., theme)
4. **Memoize expensive children** — React.memo + useCallback/useMemo for the props
5. **Don't memoize everything** — Memoization has overhead (memory + comparison cost). Only memoize when the render is actually expensive or causes visible jank
6. **Avoid premature optimization** — If the app feels fast, it IS fast. Optimize when users report lag, not when code "looks" inefficient
`,
  },
  {
    title: "Code Splitting & Lazy Loading",
    slug: "code-splitting-lazy",
    summary:
      "Reduce initial bundle size with React.lazy, Suspense, dynamic import(), virtualization, and React 18 concurrent features like useTransition and useDeferredValue.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 2,
    key_points: [
      "Code splitting breaks your JavaScript bundle into smaller chunks loaded on demand — React.lazy + dynamic import() creates a separate chunk for each lazy-loaded component, loaded only when first rendered",
      "React.lazy only works with default exports — for named exports, create an intermediate module that re-exports as default, or use the import().then(m => ({ default: m.NamedExport })) pattern",
      "Suspense boundaries wrap lazy components and display a fallback UI while the chunk loads — they can be nested (route-level Suspense shows a page skeleton, component-level Suspense shows a local spinner) and should be placed at meaningful loading boundaries",
      "Route-based splitting is the highest-impact strategy: each route becomes a separate chunk, so users only download the code for the page they visit — combine with prefetching on link hover to eliminate perceived latency",
      "Preloading and prefetching: call the dynamic import() ahead of time (e.g., on mouseenter or after idle) to start loading the chunk before the user navigates — the browser caches the module, so React.lazy resolves instantly when rendered",
      "Virtualization (react-window, react-virtuoso) renders only the visible items in a long list or table — instead of mounting 10,000 DOM nodes, it mounts ~20 and recycles them as the user scrolls, dramatically reducing memory and render time",
      "Debouncing and throttling user input prevents triggering expensive operations (API calls, filtering, re-renders) on every keystroke — useDeferredValue is the React 18 equivalent that integrates with concurrent rendering",
      "React 18 concurrent features: useTransition marks state updates as non-urgent (React keeps showing the current UI while rendering the new one in the background), useDeferredValue defers re-rendering with a stale value (like a built-in debounce for rendering), startTransition wraps imperative updates — all prevent UI jank during heavy renders",
    ],
    content: `
# Code Splitting & Lazy Loading

## Why Code Splitting Matters

A typical React SPA bundles **all** JavaScript into a single file. As the app grows, this bundle can reach megabytes — even though the user may only visit one page. Code splitting solves this by breaking the bundle into smaller **chunks** loaded on demand.

\\\`\\\`\\\`
Without splitting:
  bundle.js (2.5 MB) → user waits for ALL code to download and parse

With splitting:
  main.js (200 KB) → loads immediately (shell + current route)
  dashboard.chunk.js (150 KB) → loads when user visits /dashboard
  settings.chunk.js (80 KB) → loads when user visits /settings
  admin.chunk.js (300 KB) → never loads for non-admin users
\\\`\\\`\\\`

---

## React.lazy + Dynamic import()

\\\`React.lazy\\\` takes a function that returns a \\\`dynamic import()\\\`. The imported module must have a **default export** containing a React component.

\\\`\\\`\\\`jsx
import { lazy, Suspense } from 'react';

// Each lazy() call creates a separate chunk at build time
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
\\\`\\\`\\\`

### Named Exports with lazy

\\\`React.lazy\\\` only supports default exports. For named exports, use the rename pattern:

\\\`\\\`\\\`jsx
// ❌ Won't work — lazy expects a default export
const Chart = lazy(() => import('./components/Charts'));

// ✅ Rename named export to default in the import
const Chart = lazy(() =>
  import('./components/Charts').then(module => ({
    default: module.BarChart,
  }))
);

// ✅ Alternative: create re-export file (Charts.lazy.js)
// export { BarChart as default } from './Charts';
const Chart = lazy(() => import('./components/Charts.lazy'));
\\\`\\\`\\\`

---

## Suspense Boundaries

\\\`Suspense\\\` wraps lazy components and shows a fallback while the chunk is loading. **Always wrap lazy components in a Suspense boundary** — forgetting it causes a runtime error.

\\\`\\\`\\\`jsx
function App() {
  return (
    <BrowserRouter>
      {/* Route-level Suspense — shows skeleton for the whole page */}
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
\\\`\\\`\\\`

### Nested Suspense Boundaries

Suspense boundaries can be nested. The closest boundary to the suspended component catches it:

\\\`\\\`\\\`jsx
function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Each panel loads independently — one slow panel doesn't block others */}
      <Suspense fallback={<ChartSkeleton />}>
        <LazyRevenueChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <LazyUserTable />
      </Suspense>

      <Suspense fallback={<MapSkeleton />}>
        <LazyHeatMap />
      </Suspense>
    </div>
  );
}
\\\`\\\`\\\`

**Design principle:** Place Suspense boundaries at **meaningful loading boundaries** — where a skeleton or spinner makes sense to the user. Don't wrap every component; wrap logical sections.

---

## Route-Based Code Splitting

The highest-impact splitting strategy: each route is a separate chunk.

\\\`\\\`\\\`jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function AppRouter() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/admin/*" element={<AdminPanel />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
\\\`\\\`\\\`

---

## Preloading & Prefetching

Load chunks before the user actually navigates to eliminate perceived latency:

\\\`\\\`\\\`jsx
// Store the import function for preloading
const importDashboard = () => import('./pages/Dashboard');
const Dashboard = lazy(importDashboard);

function NavLink({ to, importFn, children }) {
  return (
    <Link
      to={to}
      onMouseEnter={() => importFn()}  // Start loading on hover
      onFocus={() => importFn()}       // Also on keyboard focus
    >
      {children}
    </Link>
  );
}

// Usage
<NavLink to="/dashboard" importFn={importDashboard}>Dashboard</NavLink>
\\\`\\\`\\\`

### Prefetch After Idle

\\\`\\\`\\\`jsx
// Prefetch non-critical routes after the page is idle
useEffect(() => {
  const prefetch = () => {
    import('./pages/Settings');
    import('./pages/UserProfile');
  };

  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(prefetch);
    return () => cancelIdleCallback(id);
  } else {
    const id = setTimeout(prefetch, 2000);
    return () => clearTimeout(id);
  }
}, []);
\\\`\\\`\\\`

---

## Virtualization — Large Lists & Tables

Rendering thousands of DOM nodes is slow. **Virtualization** (also called **windowing**) renders only the items currently visible in the viewport, plus a small overscan buffer.

### react-window

\\\`\\\`\\\`jsx
import { FixedSizeList } from 'react-window';

const ITEMS = Array.from({ length: 50000 }, (_, i) => ({
  id: i,
  name: \\\`User \\\${i + 1}\\\`,
  email: \\\`user\\\${i + 1}@example.com\\\`,
}));

function Row({ index, style }) {
  const item = ITEMS[index];
  return (
    <div style={style} className={index % 2 ? 'row-odd' : 'row-even'}>
      <span>{item.name}</span>
      <span>{item.email}</span>
    </div>
  );
}

function UserList() {
  return (
    <FixedSizeList
      height={600}           // viewport height
      itemCount={ITEMS.length} // total items
      itemSize={50}            // row height in pixels
      width="100%"
      overscanCount={5}        // extra rows rendered above/below viewport
    >
      {Row}
    </FixedSizeList>
  );
}
// Renders ~17 DOM nodes instead of 50,000
\\\`\\\`\\\`

### Variable-Size Lists

\\\`\\\`\\\`jsx
import { VariableSizeList } from 'react-window';

function ChatMessages({ messages }) {
  const getItemSize = (index) => {
    // Estimate height based on message length
    const msg = messages[index];
    return msg.text.length > 100 ? 120 : 60;
  };

  return (
    <VariableSizeList
      height={500}
      itemCount={messages.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <strong>{messages[index].sender}:</strong>
          <p>{messages[index].text}</p>
        </div>
      )}
    </VariableSizeList>
  );
}
\\\`\\\`\\\`

### react-virtuoso (Higher-Level API)

\\\`\\\`\\\`jsx
import { Virtuoso } from 'react-virtuoso';

function UserList({ users }) {
  return (
    <Virtuoso
      data={users}
      itemContent={(index, user) => (
        <div className="user-card">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      )}
      style={{ height: 600 }}
      // Automatic height measurement — no itemSize needed
    />
  );
}
\\\`\\\`\\\`

---

## Image Lazy Loading

\\\`\\\`\\\`jsx
// Native browser lazy loading
<img src="photo.jpg" loading="lazy" alt="Description" />

// Intersection Observer for more control
function LazyImage({ src, alt, placeholder }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          imgRef.current.src = src;
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={placeholder}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      className={isLoaded ? 'loaded' : 'loading'}
    />
  );
}
\\\`\\\`\\\`

---

## Debouncing & Throttling User Input

Prevent expensive work on every keystroke:

\\\`\\\`\\\`jsx
// Custom debounce hook
function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  // API call only fires when user stops typing for 300ms
  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
\\\`\\\`\\\`

---

## Web Workers for Heavy Computation

Offload CPU-intensive work to a separate thread:

\\\`\\\`\\\`jsx
// worker.js
self.onmessage = (e) => {
  const { data, sortKey, filterQuery } = e.data;
  const filtered = data.filter(item =>
    item.name.toLowerCase().includes(filterQuery.toLowerCase())
  );
  const sorted = filtered.sort((a, b) => a[sortKey] - b[sortKey]);
  self.postMessage(sorted);
};

// Component
function HeavyDataTable({ rawData }) {
  const [processedData, setProcessedData] = useState([]);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url));
    workerRef.current.onmessage = (e) => setProcessedData(e.data);
    return () => workerRef.current.terminate();
  }, []);

  const processData = useCallback((sortKey, filterQuery) => {
    workerRef.current.postMessage({ data: rawData, sortKey, filterQuery });
  }, [rawData]);

  return <DataTable data={processedData} onSort={processData} />;
}
\\\`\\\`\\\`

---

## React 18 Concurrent Features

### useTransition — Non-Urgent Updates

Marks a state update as **non-urgent**. React keeps showing the current UI while rendering the new one in the background. If a new update arrives, React abandons the in-progress render.

\\\`\\\`\\\`jsx
function FilterableList({ items }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;

    // ✅ Input updates immediately (urgent)
    setQuery(value);

    // ✅ List filtering happens in the background (non-urgent)
    startTransition(() => {
      setFilteredItems(
        items.filter(i => i.name.toLowerCase().includes(value.toLowerCase()))
      );
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ItemList items={filteredItems} />
    </div>
  );
}
\\\`\\\`\\\`

### useDeferredValue — Built-in Rendering Debounce

\\\`useDeferredValue\\\` gives you a "stale" version of a value. React updates the deferred value **after** more urgent updates are processed.

\\\`\\\`\\\`jsx
function SearchResults({ query }) {
  // deferredQuery lags behind query during rapid typing
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  // Heavy filtering uses the deferred (lagging) value
  const results = useMemo(
    () => heavyFilter(items, deferredQuery),
    [deferredQuery]
  );

  return (
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      <ResultsList results={results} />
    </div>
  );
}
\\\`\\\`\\\`

### startTransition (Imperative)

\\\`\\\`\\\`jsx
import { startTransition } from 'react';

// Outside component — e.g., in an event handler or library code
function handleTabChange(tabId) {
  // Urgent: update the active tab indicator immediately
  setActiveTab(tabId);

  // Non-urgent: render the tab content in background
  startTransition(() => {
    setTabContent(loadTabContent(tabId));
  });
}
\\\`\\\`\\\`

**Key difference:** \\\`useTransition\\\` gives you \\\`isPending\\\` for showing loading UI. \\\`startTransition\\\` is the imperative version without pending state — use it when you don't need a loading indicator.

---

## Bundle Analysis

Use tools to visualize your bundle and find optimization opportunities:

\\\`\\\`\\\`bash
# Webpack
npx webpack-bundle-analyzer stats.json

# Vite
npx vite-bundle-visualizer

# Next.js
ANALYZE=true next build  # with @next/bundle-analyzer
\\\`\\\`\\\`

### What to Look For

1. **Large dependencies** — Can you use a lighter alternative? (moment → date-fns, lodash → lodash-es with tree-shaking)
2. **Duplicate dependencies** — Different versions of the same library bundled separately
3. **Unused exports** — Libraries that don't tree-shake well (lodash vs lodash-es)
4. **Code that should be split** — Heavy components only used on specific routes

**Interview tip:** "The first thing I do for performance is run a bundle analyzer. Most apps have low-hanging fruit — unnecessary dependencies, missing code splitting, or duplicate libraries — that can cut bundle size by 30-50% before any code changes."
`,
  },
];
