// ============================================================================
// React Performance — Content
// ============================================================================

export const topic = {
  "name": "React Performance",
  "slug": "react-performance",
  "description": "Optimize rendering with React.memo, profiling tools, code splitting, lazy loading, and virtualization.",
  "estimated_time": 180,
  "order_index": 8
};

export const lessons = [
  {
    title: "React.memo, Memoization & Profiling",
    slug: "memo-profiling",
    summary: "Prevent unnecessary re-renders with React.memo, identify bottlenecks with React DevTools Profiler.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "React re-renders a component when its parent re-renders — even if props haven't changed",
  "React.memo wraps a component to skip re-renders when props are shallowly equal",
  "Pair React.memo with useCallback for handler props and useMemo for object/array props",
  "Use the React DevTools Profiler to identify which components re-render and why",
  "Don't optimize prematurely — measure first"
],
    content: `# React.memo, Memoization & Profiling

## The Re-Render Problem

By default, when a parent re-renders, **all** its children re-render too — even if their props haven't changed.

\`\`\`jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveChild />  {/* Re-renders on EVERY count change! */}
    </div>
  );
}
\`\`\`

## React.memo

\`\`\`jsx
const ExpensiveChild = React.memo(function ExpensiveChild({ data }) {
  console.log('ExpensiveChild rendered');
  return <div>{/* expensive rendering */}</div>;
});
// Now only re-renders when 'data' prop actually changes (shallow compare)
\`\`\`

### Custom Comparison

\`\`\`jsx
const UserCard = React.memo(
  function UserCard({ user }) { return <div>{user.name}</div>; },
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id
);
\`\`\`

## Complete Memoization Strategy

\`\`\`jsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');

  // Memoize the filtered/sorted results
  const results = useMemo(() => {
    return data.filter(item => item.name.includes(query)).sort(comparators[sort]);
  }, [data, query, sort]);

  // Memoize the callback passed to child
  const handleSelect = useCallback((item) => {
    setSelected(item);
  }, []);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <MemoizedResultList results={results} onSelect={handleSelect} />
    </div>
  );
}

const MemoizedResultList = React.memo(function ResultList({ results, onSelect }) {
  return results.map(item => (
    <div key={item.id} onClick={() => onSelect(item)}>{item.name}</div>
  ));
});
\`\`\`

## Profiling with React DevTools

1. Open React DevTools → **Profiler** tab
2. Click **Record**, interact with your app, then **Stop**
3. Review the flame graph — yellow/red components took the most time
4. Check **"Why did this render?"** section
5. Focus optimization on the hot spots

> **Golden Rule**: Profile → Identify → Optimize → Verify
`,
  },
  {
    title: "Code Splitting & Lazy Loading",
    slug: "code-splitting-lazy",
    summary: "Reduce initial bundle size with dynamic imports, React.lazy, Suspense, and route-based code splitting.",
    difficulty_level: "advanced",
    estimated_time: 30,
    order_index: 2,
    key_points: [
  "React.lazy() enables component-level code splitting",
  "Suspense provides a fallback UI while lazy components load",
  "Route-based splitting is the most impactful optimization",
  "Named exports need a wrapper — lazy() only supports default exports",
  "Use webpack bundle analyzer or vite-plugin-visualizer to find large chunks"
],
    content: `# Code Splitting & Lazy Loading

## Why Code Split?

A large single-page app might have a 2MB JavaScript bundle. The user only needs the code for the current page — the rest can load on demand.

## React.lazy + Suspense

\`\`\`jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

## Prefetching on Hover

\`\`\`jsx
const DashboardImport = () => import('./pages/Dashboard');
const Dashboard = lazy(DashboardImport);

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      onMouseEnter={() => {
        if (to === '/dashboard') DashboardImport();
      }}
    >
      {children}
    </Link>
  );
}
\`\`\`

## Analyzing Bundle Size

\`\`\`bash
# Vite
npm install -D rollup-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer({ open: true })]
\`\`\`
`,
  },
];
