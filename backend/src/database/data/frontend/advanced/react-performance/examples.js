// ============================================================================
// React Performance — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  "memo-profiling": [
    {
      title: "React.memo with useMemo & useCallback — Preventing Cascading Re-Renders",
      description:
        "A complete parent-child optimization example showing how React.memo, useMemo, and useCallback work together to prevent unnecessary re-renders in a filterable, sortable product list — including a custom comparator for fine-grained control and a Profiler wrapper to measure the impact.",
      language: "javascript",
      code: `import React, { useState, useMemo, useCallback, useRef, Profiler } from 'react';

// ── Profiler callback — logs slow renders ──────────────────────────────────
function onRenderCallback(id, phase, actualDuration, baseDuration) {
  if (actualDuration > 4) {
    console.warn(
      \`[Profiler] \${id} (\${phase}): \${actualDuration.toFixed(1)}ms actual, \` +
      \`\${baseDuration.toFixed(1)}ms base — memoization saved \` +
      \`\${((1 - actualDuration / baseDuration) * 100).toFixed(0)}%\`
    );
  }
}

// ── Memoized child — skips re-render when props are referentially equal ────
const ProductCard = React.memo(function ProductCard({ product, onAddToCart, onToggleFavorite }) {
  console.log(\`  → ProductCard rendered: \${product.name}\`);

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>\${product.price.toFixed(2)}</p>
      <p>{product.category}</p>
      <div className="actions">
        <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
        <button onClick={() => onToggleFavorite(product.id)}>
          {product.isFavorite ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
});

// ── Memoized child with custom comparator ──────────────────────────────────
const ExpensiveChart = React.memo(
  function ExpensiveChart({ data, theme, onHover }) {
    console.log('  → ExpensiveChart rendered (expensive D3 operation)');
    // Simulate expensive D3 rendering
    const processedData = data.map(d => ({
      ...d,
      normalized: d.value / Math.max(...data.map(x => x.value)),
    }));

    return (
      <div className={\`chart chart--\${theme}\`}>
        {processedData.map((d, i) => (
          <div
            key={i}
            className="chart-bar"
            style={{ height: \`\${d.normalized * 200}px\` }}
            onMouseEnter={() => onHover?.(d)}
          />
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparator: only re-render if data or theme changed
    // Ignore onHover callback changes — saves re-renders when parent
    // creates a new onHover function (common mistake)
    return (
      prevProps.data === nextProps.data &&
      prevProps.theme === nextProps.theme
    );
    // Return true = SKIP re-render (opposite of shouldComponentUpdate!)
  }
);

// ── Parent component — demonstrates all memoization techniques ─────────────
function ProductDashboard({ products }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [cartCount, setCartCount] = useState(0);
  const renderCount = useRef(0);
  renderCount.current++;

  console.log(\`ProductDashboard render #\${renderCount.current}\`);

  // ── useMemo: cache expensive filtering + sorting ─────────────────────────
  // Only recalculates when products, searchQuery, or sortBy change.
  // If cartCount changes, this is NOT recalculated.
  const filteredProducts = useMemo(() => {
    console.log('  ↻ Filtering and sorting products...');
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, searchQuery, sortBy]);

  // ── useCallback: stable function references for memoized children ────────
  // Without useCallback, every render creates a new function → breaks React.memo
  const handleAddToCart = useCallback((productId) => {
    setCartCount(prev => prev + 1); // functional update = no dependency on cartCount
    console.log(\`  🛒 Added product \${productId} to cart\`);
  }, []); // [] = stable forever (no external dependencies)

  const handleToggleFavorite = useCallback((productId) => {
    // In real app: dispatch to state management
    console.log(\`  ♥ Toggled favorite for product \${productId}\`);
  }, []);

  // ── useMemo: stable object reference for chart data ──────────────────────
  const chartData = useMemo(
    () => filteredProducts.map(p => ({ label: p.name, value: p.price })),
    [filteredProducts]
  );

  return (
    <Profiler id="ProductDashboard" onRender={onRenderCallback}>
      <div className="dashboard">
        <header>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
          </select>
          <span>Cart: {cartCount} items</span>
        </header>

        {/* Chart only re-renders when chartData or theme changes,
            NOT when cartCount changes (custom comparator ignores onHover) */}
        <ExpensiveChart data={chartData} theme="dark" onHover={console.log} />

        {/* Each ProductCard only re-renders when its specific props change */}
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </div>
    </Profiler>
  );
}

export default ProductDashboard;

// ── What happens when user clicks "Add to Cart" ───────────────────────────
// 1. setCartCount triggers re-render of ProductDashboard
// 2. useMemo(filteredProducts) → deps unchanged → returns cached value
// 3. useMemo(chartData) → filteredProducts unchanged → returns cached value
// 4. useCallback(handleAddToCart) → deps unchanged → returns cached function
// 5. ExpensiveChart → custom comparator: data same, theme same → SKIP
// 6. Each ProductCard → React.memo: all props same refs → SKIP
// 7. Only the cart count <span> updates in the DOM
// Result: O(1) instead of O(n) — only one DOM node changes`,
      explanation:
        "This example demonstrates the complete memoization stack: React.memo prevents child re-renders when props are referentially equal, useMemo caches expensive computations (filtering/sorting) and stabilizes object references (chartData), useCallback stabilizes function references passed to memoized children, and a custom comparator on ExpensiveChart ignores irrelevant prop changes (onHover). The Profiler wrapper measures actual vs base duration to quantify the memoization benefit. The key insight is in the comment at the bottom — when cartCount changes, NO child re-renders because all memoized values and callbacks have stable references.",
      order_index: 1,
    },
    {
      title: "React DevTools Profiler Workflow & Performance Anti-Patterns",
      description:
        "A deliberately 'bad' component with every common performance anti-pattern (inline objects, anonymous functions, unstable context, missing useMemo), followed by the corrected version — designed as a side-by-side before/after to teach profiling methodology and demonstrate measurable improvement.",
      language: "javascript",
      code: `import React, { useState, useMemo, useCallback, useContext, createContext, memo } from 'react';

// ============================================================================
// ❌ BAD VERSION — Every common anti-pattern in one component
// ============================================================================

const ThemeContext = createContext();

function BadThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // ❌ Anti-pattern 1: New object on every render → ALL consumers re-render
  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: theme === 'light' ? LIGHT : DARK }}>
      {children}
    </ThemeContext.Provider>
  );
}

function BadUserList({ users, onDelete }) {
  const [filterText, setFilterText] = useState('');

  // ❌ Anti-pattern 2: Expensive computation without useMemo
  //    Runs on EVERY render, even when filterText hasn't changed
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div>
      <input value={filterText} onChange={e => setFilterText(e.target.value)} />
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          // ❌ Anti-pattern 3: Inline object → new ref every render
          style={{ padding: 16, marginBottom: 8 }}
          // ❌ Anti-pattern 4: Anonymous function → new ref every render
          onDelete={() => onDelete(user.id)}
          // ❌ Anti-pattern 5: Inline computed object → new ref every render
          metadata={{ lastLogin: user.lastLogin, role: user.role }}
        />
      ))}
    </div>
  );
}

// Even with React.memo, UserCard ALWAYS re-renders because
// style, onDelete, and metadata are NEW objects/functions every time
const UserCard = memo(function UserCard({ user, style, onDelete, metadata }) {
  console.log(\`UserCard rendered: \${user.name}\`); // fires on every parent render!
  return (
    <div style={style}>
      <h3>{user.name}</h3>
      <p>Role: {metadata.role}</p>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
});


// ============================================================================
// ✅ GOOD VERSION — Every anti-pattern fixed
// ============================================================================

function GoodThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // ✅ Fix 1: Memoize context value → consumers only re-render when theme changes
  const value = useMemo(
    () => ({ theme, setTheme, colors: theme === 'light' ? LIGHT : DARK }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ Fix 3: Static styles moved to module scope — one reference forever
const cardStyle = { padding: 16, marginBottom: 8 };

function GoodUserList({ users, onDelete }) {
  const [filterText, setFilterText] = useState('');

  // ✅ Fix 2: useMemo — only recomputes when users or filterText changes
  const filteredUsers = useMemo(
    () => users.filter(u => u.name.toLowerCase().includes(filterText.toLowerCase())),
    [users, filterText]
  );

  // ✅ Fix 4: useCallback — stable function reference
  const handleDelete = useCallback(
    (userId) => onDelete(userId),
    [onDelete]
  );

  return (
    <div>
      <input value={filterText} onChange={e => setFilterText(e.target.value)} />
      {filteredUsers.map(user => (
        <GoodUserCard
          key={user.id}
          user={user}
          style={cardStyle}           // ✅ Stable reference (module scope)
          onDelete={handleDelete}      // ✅ Stable reference (useCallback)
          lastLogin={user.lastLogin}   // ✅ Primitives (or stable refs) instead of inline object
          role={user.role}
        />
      ))}
    </div>
  );
}

const GoodUserCard = memo(function GoodUserCard({ user, style, onDelete, lastLogin, role }) {
  console.log(\`GoodUserCard rendered: \${user.name}\`); // only fires when props actually change!
  return (
    <div style={style}>
      <h3>{user.name}</h3>
      <p>Role: {role}</p>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  );
});

// ── Profiling methodology ──────────────────────────────────────────────────
// 1. Open React DevTools → Profiler → Settings → ✅ "Record why each component rendered"
// 2. Record → type in the search box → Stop
//
// BAD version profiler output:
//   UserCard (x50) — "Props changed" — every card re-renders on every keystroke
//   Reason: style, onDelete, metadata are new references each render
//
// GOOD version profiler output:
//   GoodUserCard — "Did not render" (gray bars) — no card re-renders during typing
//   Only the input and the filteredUsers list update
//
// Time comparison (50 users, typing "john"):
//   BAD:  ~12ms per keystroke (50 UserCards re-render)
//   GOOD: ~1.5ms per keystroke (0 UserCards re-render)

const LIGHT = { bg: '#ffffff', text: '#000000', primary: '#3b82f6' };
const DARK = { bg: '#1a1a2e', text: '#e0e0e0', primary: '#60a5fa' };`,
      explanation:
        "This example is designed as a teaching tool: the BAD version contains every common anti-pattern (inline objects, anonymous functions in JSX, unoptimized context value, missing useMemo for expensive computations), and the GOOD version fixes each one. The profiling methodology section shows exactly what to look for in the Profiler — 'Props changed' on gray components means your memoization is broken by unstable references. The fix for the metadata anti-pattern (passing primitives instead of an inline object) demonstrates that sometimes the best optimization is restructuring props, not adding useMemo.",
      order_index: 2,
    },
    {
      title: "useCallback Dependency Trap & Ref-Based Escape Hatch",
      description:
        "Demonstrates the useCallback dependency trap — where adding dependencies to useCallback defeats memoization — and three solutions: functional setState, refs for latest values, and event handler composition. Shows how incorrect dependencies cause infinite re-render loops or stale closures.",
      language: "javascript",
      code: `import React, { useState, useCallback, useRef, useEffect, memo } from 'react';

// ============================================================================
// The Problem: useCallback dependency trap
// ============================================================================

function BadSearchComponent({ items, onResultsChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // ❌ TRAP: useCallback depends on 'items' — new function every time items changes
  // This breaks React.memo on any child receiving handleSearch
  const handleSearch = useCallback((searchQuery) => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResults(filtered);
    onResultsChange(filtered.length);
  }, [items, onResultsChange]); // ← items changes? New function. Memo breaks.

  return (
    <div>
      <MemoizedSearchBar onSearch={handleSearch} />
      <MemoizedResultsList results={results} />
    </div>
  );
}


// ============================================================================
// Solution 1: useRef for latest values (no dependency needed)
// ============================================================================

function GoodSearchComponent({ items, onResultsChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Store latest values in refs — reading a ref doesn't create a dependency
  const itemsRef = useRef(items);
  const onResultsChangeRef = useRef(onResultsChange);

  // Keep refs up-to-date (runs after every render, no cleanup needed)
  useEffect(() => {
    itemsRef.current = items;
    onResultsChangeRef.current = onResultsChange;
  });

  // ✅ STABLE: no dependencies → same function reference forever
  const handleSearch = useCallback((searchQuery) => {
    const filtered = itemsRef.current.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResults(filtered);
    onResultsChangeRef.current(filtered.length);
  }, []); // ← Empty deps! Reads latest values from refs.

  return (
    <div>
      <MemoizedSearchBar onSearch={handleSearch} />
      <MemoizedResultsList results={results} />
    </div>
  );
}


// ============================================================================
// Solution 2: Functional setState to avoid state dependencies
// ============================================================================

function CounterWithHistory() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState([]);

  // ❌ BAD: depends on count and history → new function when either changes
  const badIncrement = useCallback(() => {
    setCount(count + 1);
    setHistory([...history, count + 1]);
  }, [count, history]);

  // ✅ GOOD: functional updates → no dependency on current values
  const goodIncrement = useCallback(() => {
    setCount(prev => prev + 1);
    setHistory(prev => {
      const newCount = prev.length > 0 ? prev[prev.length - 1] + 1 : 1;
      return [...prev, newCount];
    });
  }, []); // ← Empty deps! Functional updates always read latest state.

  return (
    <div>
      <p>Count: {count}</p>
      <MemoizedButton onClick={goodIncrement} label="Increment" />
      <p>History: {history.join(', ')}</p>
    </div>
  );
}


// ============================================================================
// Solution 3: Event handler composition (useEffectEvent pattern)
// ============================================================================

// Custom hook that wraps a callback in a ref — React RFC "useEffectEvent"
function useStableCallback(callback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  // Return a stable function that always calls the latest callback
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
}

function SearchWithStableCallback({ items, onResultsChange }) {
  const [results, setResults] = useState([]);

  // ✅ useStableCallback: always calls the latest version, but reference is stable
  const handleSearch = useStableCallback((searchQuery) => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResults(filtered);
    onResultsChange(filtered.length);
  });
  // handleSearch reference NEVER changes, but always reads latest items & onResultsChange

  return (
    <div>
      <MemoizedSearchBar onSearch={handleSearch} />
      <MemoizedResultsList results={results} />
    </div>
  );
}


// ── Memoized children that benefit from stable callbacks ───────────────────

const MemoizedSearchBar = memo(function SearchBar({ onSearch }) {
  console.log('SearchBar rendered');
  const [localQuery, setLocalQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    onSearch(value);
  };

  return <input value={localQuery} onChange={handleChange} placeholder="Search..." />;
});

const MemoizedResultsList = memo(function ResultsList({ results }) {
  console.log(\`ResultsList rendered: \${results.length} items\`);
  return (
    <ul>
      {results.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
});

const MemoizedButton = memo(function Button({ onClick, label }) {
  console.log(\`Button rendered: \${label}\`);
  return <button onClick={onClick}>{label}</button>;
});

export { GoodSearchComponent, CounterWithHistory, SearchWithStableCallback };

// ── Summary ────────────────────────────────────────────────────────────────
// Problem: Adding dependencies to useCallback defeats memoization.
// Solution 1: useRef — store latest value in ref, read in callback, empty deps.
// Solution 2: Functional setState — setCount(prev => prev + 1), empty deps.
// Solution 3: useStableCallback — custom hook wrapping callback in ref (useEffectEvent pattern).
// All three produce a STABLE function reference that always uses the latest values.`,
      explanation:
        "The useCallback dependency trap is one of the most common performance pitfalls in React: you add useCallback to stabilize a function, but then you add dependencies that change frequently, which creates a new function on every change — defeating the purpose. This example shows three progressively cleaner solutions: (1) manually using refs to read the latest values without dependencies, (2) using functional setState to avoid depending on current state values, and (3) a custom useStableCallback hook that implements the proposed useEffectEvent pattern — wrapping the callback in a ref so the returned function is stable but always calls the latest version. Solution 3 is the cleanest and most reusable.",
      order_index: 3,
    },
  ],

  "code-splitting-lazy": [
    {
      title: "Route-Based Code Splitting with Preloading & Nested Suspense",
      description:
        "A complete router setup with React.lazy for every route, preloading on link hover/focus, prefetching after idle, nested Suspense boundaries for independent loading states, and named export lazy loading — demonstrating the full code-splitting strategy for a production app.",
      language: "javascript",
      code: `import React, { lazy, Suspense, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// ── Lazy-loaded routes (each becomes a separate chunk) ─────────────────────
const Home = lazy(() => import(/* webpackChunkName: "home" */ './pages/Home'));
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const UserProfile = lazy(() => import(/* webpackChunkName: "profile" */ './pages/UserProfile'));
const Settings = lazy(() => import(/* webpackChunkName: "settings" */ './pages/Settings'));

// ── Named export with lazy (React.lazy requires default export) ────────────
const BarChart = lazy(() =>
  import(/* webpackChunkName: "charts" */ './components/Charts').then(module => ({
    default: module.BarChart, // Rename named export to default
  }))
);

// ── Store import functions for preloading ──────────────────────────────────
const routeImports = {
  '/':          () => import('./pages/Home'),
  '/dashboard': () => import('./pages/Dashboard'),
  '/profile':   () => import('./pages/UserProfile'),
  '/settings':  () => import('./pages/Settings'),
};

// ── Preloading link component ──────────────────────────────────────────────
function PreloadLink({ to, importFn, children, ...props }) {
  const handlePreload = useCallback(() => {
    // Start loading the chunk on hover/focus — browser caches the module
    // so when React.lazy renders, it resolves instantly
    importFn?.();
  }, [importFn]);

  return (
    <Link
      to={to}
      onMouseEnter={handlePreload}
      onFocus={handlePreload}
      {...props}
    >
      {children}
    </Link>
  );
}

// ── Skeleton components for Suspense fallbacks ─────────────────────────────
function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading page">
      <div className="skeleton-header" />
      <div className="skeleton-content">
        <div className="skeleton-line" style={{ width: '80%' }} />
        <div className="skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton-line" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="chart-skeleton" role="status" aria-label="Loading chart">
      <div className="skeleton-bars">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-bar" style={{ height: \`\${30 + Math.random() * 70}%\` }} />
        ))}
      </div>
    </div>
  );
}

// ── Dashboard page with nested Suspense boundaries ─────────────────────────
function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Each section loads independently — slow chart doesn't block the table */}
      <section className="dashboard-section">
        <h2>Revenue</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <BarChart dataKey="revenue" />
        </Suspense>
      </section>

      <section className="dashboard-section">
        <h2>User Growth</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <BarChart dataKey="users" />
        </Suspense>
      </section>
    </div>
  );
}

// ── Prefetch after idle ────────────────────────────────────────────────────
function usePrefetchRoutes(importFns) {
  useEffect(() => {
    const prefetch = () => {
      Object.values(importFns).forEach(fn => fn());
    };

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetch, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for Safari
      const id = setTimeout(prefetch, 3000);
      return () => clearTimeout(id);
    }
  }, []); // Run once after mount
}

// ── App with full code splitting setup ─────────────────────────────────────
function App() {
  usePrefetchRoutes(routeImports);

  return (
    <BrowserRouter>
      <nav className="main-nav">
        <PreloadLink to="/" importFn={routeImports['/']}>Home</PreloadLink>
        <PreloadLink to="/dashboard" importFn={routeImports['/dashboard']}>Dashboard</PreloadLink>
        <PreloadLink to="/profile" importFn={routeImports['/profile']}>Profile</PreloadLink>
        <PreloadLink to="/settings" importFn={routeImports['/settings']}>Settings</PreloadLink>
      </nav>

      {/* Route-level Suspense — catches any lazy component that hasn't loaded */}
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

// ── Bundle output (Vite/Webpack) ──────────────────────────────────────────
// dist/assets/
//   index-abc123.js    (120 KB)  ← shell + router + nav
//   home-def456.js     (15 KB)   ← lazy loaded on /
//   dashboard-ghi789.js (45 KB)  ← lazy loaded on /dashboard
//   charts-jkl012.js   (80 KB)   ← lazy loaded by dashboard (nested Suspense)
//   profile-mno345.js  (25 KB)   ← lazy loaded on /profile/:id
//   settings-pqr678.js (18 KB)   ← lazy loaded on /settings`,
      explanation:
        "This example shows the complete code-splitting strategy: (1) React.lazy with webpackChunkName magic comments for readable chunk names; (2) the named-export workaround using .then(m => ({ default: m.BarChart })); (3) a PreloadLink component that starts loading chunks on hover/focus so navigation feels instant; (4) a usePrefetchRoutes hook that loads all routes during idle time with requestIdleCallback; (5) nested Suspense boundaries in DashboardPage so each section loads independently. The bundle output comment shows how the single bundle transforms into multiple on-demand chunks.",
      order_index: 1,
    },
    {
      title: "Virtualized List with react-window & Dynamic Row Heights",
      description:
        "A production-quality virtualized list handling 100,000 items with FixedSizeList, VariableSizeList for dynamic content, auto-scroll-to-bottom for chat UIs, search filtering with virtualization, and accessibility — showing why virtualization is essential for large datasets.",
      language: "javascript",
      code: `import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// ── Generate test data ─────────────────────────────────────────────────────
const generateUsers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    name: \`User \${(i + 1).toLocaleString()}\`,
    email: \`user\${i + 1}@example.com\`,
    bio: i % 3 === 0
      ? 'Short bio.'
      : i % 3 === 1
        ? 'A medium-length biography that takes up about two lines of text in the UI when displayed at normal width.'
        : 'A very long biography that goes into great detail about this user\\'s background, education, career history, hobbies, and interests. This will definitely require multiple lines and the row height needs to be taller to accommodate all this text without clipping.',
  }));

const USERS = generateUsers(100_000);

// ── 1. FixedSizeList — simplest, best for uniform rows ─────────────────────
const UserRow = memo(function UserRow({ index, style }) {
  const user = USERS[index];
  return (
    <div
      style={style}
      className={\`user-row \${index % 2 ? 'odd' : 'even'}\`}
      role="row"
      aria-rowindex={index + 1}
    >
      <span className="user-name">{user.name}</span>
      <span className="user-email">{user.email}</span>
    </div>
  );
});

function FixedUserList() {
  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={USERS.length}
            itemSize={50}          // Fixed 50px per row
            overscanCount={10}     // Render 10 extra rows above/below
            role="table"
            aria-label={\`User list with \${USERS.length.toLocaleString()} users\`}
          >
            {UserRow}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
  // Renders ~30 DOM nodes instead of 100,000
  // Scrolls at 60fps — try this with 100K <div>s and watch the browser crash
}


// ── 2. VariableSizeList — for rows with different heights ──────────────────
function VariableUserList() {
  const listRef = useRef(null);

  // Calculate row height based on bio length
  const getItemSize = useCallback((index) => {
    const bioLength = USERS[index].bio.length;
    if (bioLength < 20) return 60;
    if (bioLength < 100) return 80;
    return 120;
  }, []);

  // Reset cached sizes when data changes (important for VariableSizeList!)
  const resetAfterIndex = useCallback((index) => {
    listRef.current?.resetAfterIndex(index, true);
  }, []);

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <VariableSizeList
            ref={listRef}
            height={height}
            width={width}
            itemCount={USERS.length}
            itemSize={getItemSize}
            overscanCount={5}
            estimatedItemSize={80} // Helps scrollbar accuracy
          >
            {({ index, style }) => {
              const user = USERS[index];
              return (
                <div style={style} className={\`user-row \${index % 2 ? 'odd' : 'even'}\`}>
                  <h4>{user.name}</h4>
                  <p className="user-email">{user.email}</p>
                  <p className="user-bio">{user.bio}</p>
                </div>
              );
            }}
          </VariableSizeList>
        )}
      </AutoSizer>
    </div>
  );
}


// ── 3. Filtered virtualized list — search + virtualization ─────────────────
function SearchableVirtualList() {
  const [query, setQuery] = useState('');

  // Filter the data — useMemo so it doesn't recompute on every render
  const filteredUsers = useMemo(() => {
    if (!query) return USERS;
    const lower = query.toLowerCase();
    return USERS.filter(u =>
      u.name.toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower)
    );
  }, [query]);

  return (
    <div>
      <div className="search-header">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search 100,000 users..."
        />
        <span>{filteredUsers.length.toLocaleString()} results</span>
      </div>

      <div style={{ height: '70vh', width: '100%' }}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={filteredUsers.length}
              itemSize={50}
              // Pass filtered data via itemData to avoid closure over large array
              itemData={filteredUsers}
            >
              {({ index, style, data }) => {
                const user = data[index];
                return (
                  <div style={style} className="user-row">
                    <span>{user.name}</span>
                    <span>{user.email}</span>
                  </div>
                );
              }}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}


// ── 4. Chat UI with auto-scroll-to-bottom ──────────────────────────────────
function VirtualizedChat({ messages }) {
  const listRef = useRef(null);
  const prevCountRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  return (
    <FixedSizeList
      ref={listRef}
      height={500}
      itemCount={messages.length}
      itemSize={60}
      width="100%"
      initialScrollOffset={messages.length * 60} // Start at bottom
    >
      {({ index, style }) => (
        <div style={style} className="chat-message">
          <strong>{messages[index].sender}</strong>
          <span>{messages[index].text}</span>
          <time>{messages[index].time}</time>
        </div>
      )}
    </FixedSizeList>
  );
}

export { FixedUserList, VariableUserList, SearchableVirtualList, VirtualizedChat };`,
      explanation:
        "This example covers four virtualization scenarios: (1) FixedSizeList for uniform rows — the simplest and most performant option, rendering ~30 DOM nodes instead of 100K; (2) VariableSizeList for rows with different heights — requires a getItemSize function and resetAfterIndex when data changes; (3) a searchable virtualized list combining useMemo filtering with FixedSizeList using itemData for clean data passing; (4) a chat UI with auto-scroll-to-bottom using scrollToItem. AutoSizer handles responsive container sizing. The key interview point: virtualization doesn't reduce data — it reduces DOM nodes, which is what makes scrolling, memory, and initial render fast.",
      order_index: 2,
    },
    {
      title: "React 18 useTransition & useDeferredValue — Concurrent Rendering",
      description:
        "Side-by-side comparison of useTransition and useDeferredValue for handling heavy renders without blocking user input — a filterable list of 25,000 items where the input stays responsive even though the list render takes 100ms+, with isPending loading indicators and opacity feedback.",
      language: "javascript",
      code: `import React, {
  useState, useMemo, useTransition, useDeferredValue,
  useCallback, startTransition, memo
} from 'react';

// ── Simulate expensive data ────────────────────────────────────────────────
const ALL_ITEMS = Array.from({ length: 25_000 }, (_, i) => ({
  id: i,
  name: \`Item \${i + 1} — \${'category-' + (i % 50)}\`,
  value: Math.random() * 1000,
}));

// Deliberately expensive component — simulates heavy render work
const ExpensiveItem = memo(function ExpensiveItem({ item }) {
  // Simulate expensive computation (in real apps: complex formatting, SVG, etc.)
  const formatted = item.name + ' | $' + item.value.toFixed(2);
  return <div className="item-row">{formatted}</div>;
});


// ============================================================================
// Approach 1: useTransition — separate urgent vs non-urgent state updates
// ============================================================================

function FilterWithTransition() {
  // Two separate state variables: one urgent, one deferred
  const [inputValue, setInputValue] = useState('');       // Urgent: controls the input
  const [filterQuery, setFilterQuery] = useState('');      // Non-urgent: controls the list
  const [isPending, startTransition] = useTransition();

  const handleChange = useCallback((e) => {
    const value = e.target.value;

    // Urgent update: input reflects keystrokes immediately
    setInputValue(value);

    // Non-urgent update: list filtering happens in the background
    // React keeps showing the old list while the new one renders
    // If user types again before the render finishes, React ABANDONS
    // the in-progress render and starts over with the new value
    startTransition(() => {
      setFilterQuery(value);
    });
  }, []);

  // Heavy filtering — runs with the deferred filterQuery
  const filteredItems = useMemo(() => {
    if (!filterQuery) return ALL_ITEMS;
    const lower = filterQuery.toLowerCase();
    return ALL_ITEMS.filter(item => item.name.toLowerCase().includes(lower));
  }, [filterQuery]);

  return (
    <div className="filter-demo">
      <h2>useTransition Approach</h2>
      <div className="search-box">
        <input
          value={inputValue}
          onChange={handleChange}
          placeholder="Filter 25,000 items..."
        />
        {isPending && <span className="spinner" aria-label="Filtering..." />}
      </div>

      <p className="result-count">
        {isPending ? 'Filtering...' : \`\${filteredItems.length.toLocaleString()} results\`}
      </p>

      {/* Dim the list while the new results are pending */}
      <div
        className="results-list"
        style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}
      >
        {filteredItems.slice(0, 500).map(item => (
          <ExpensiveItem key={item.id} item={item} />
        ))}
        {filteredItems.length > 500 && (
          <p className="truncated">...and {(filteredItems.length - 500).toLocaleString()} more</p>
        )}
      </div>
    </div>
  );
}


// ============================================================================
// Approach 2: useDeferredValue — single state, deferred rendering
// ============================================================================

function FilterWithDeferredValue() {
  const [query, setQuery] = useState('');

  // useDeferredValue gives you a "stale" version of the value
  // During rapid typing, deferredQuery lags behind query
  // React updates it after the urgent renders (keystrokes) are done
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  // Heavy filtering uses the deferred (lagging) value
  // useMemo ensures we don't recompute when deferredQuery hasn't changed
  const filteredItems = useMemo(() => {
    if (!deferredQuery) return ALL_ITEMS;
    const lower = deferredQuery.toLowerCase();
    return ALL_ITEMS.filter(item => item.name.toLowerCase().includes(lower));
  }, [deferredQuery]);

  return (
    <div className="filter-demo">
      <h2>useDeferredValue Approach</h2>
      <div className="search-box">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter 25,000 items..."
        />
        {isStale && <span className="spinner" aria-label="Updating..." />}
      </div>

      <p className="result-count">
        {isStale ? 'Updating...' : \`\${filteredItems.length.toLocaleString()} results\`}
      </p>

      <div
        className="results-list"
        style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.2s' }}
      >
        {filteredItems.slice(0, 500).map(item => (
          <ExpensiveItem key={item.id} item={item} />
        ))}
        {filteredItems.length > 500 && (
          <p className="truncated">...and {(filteredItems.length - 500).toLocaleString()} more</p>
        )}
      </div>
    </div>
  );
}


// ============================================================================
// Approach 3: startTransition (imperative) — for non-component code
// ============================================================================

function TabSwitcher({ tabs }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [tabContent, setTabContent] = useState(tabs[0].content);
  const [isPending, startTabTransition] = useTransition();

  const handleTabChange = useCallback((tabId) => {
    // Urgent: update the tab indicator immediately
    setActiveTab(tabId);

    // Non-urgent: render the heavy tab content in background
    startTabTransition(() => {
      const tab = tabs.find(t => t.id === tabId);
      setTabContent(tab.content);
    });
  }, [tabs]);

  return (
    <div className="tab-switcher">
      <div className="tab-bar" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            className={tab.id === activeTab ? 'active' : ''}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="tab-panel"
        role="tabpanel"
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        {isPending ? <div className="loading-overlay" /> : null}
        {tabContent}
      </div>
    </div>
  );
}

export { FilterWithTransition, FilterWithDeferredValue, TabSwitcher };

// ── When to use which ──────────────────────────────────────────────────────
//
// useTransition:
//   - You control the state update (setState wrapped in startTransition)
//   - Gives you isPending for loading UI
//   - Best for: tab switches, navigation, filter toggling
//
// useDeferredValue:
//   - You receive a value (prop or state) and want to defer its effect
//   - Simpler API — no need to split state into urgent/deferred
//   - Best for: search input filtering, live previews, derived renderings
//
// startTransition (imperative):
//   - Same as useTransition but without isPending
//   - Can be used outside components (event handlers, libraries)
//   - Best for: fire-and-forget non-urgent updates
//
// Key insight: These DON'T skip renders — they PRIORITIZE renders.
// Urgent renders (keystrokes) happen first. Non-urgent renders (list filtering)
// happen after, and are interruptible by new urgent renders.`,
      explanation:
        "This example shows three approaches to React 18 concurrent rendering: (1) useTransition splits updates into urgent (input value) and non-urgent (filter query), giving isPending for loading UI and the ability to abandon in-progress renders; (2) useDeferredValue creates a lagging copy of a value, simpler API but less control; (3) startTransition (imperative) for use outside components. The key insight in the comment is critical for interviews: these features DON'T skip renders — they prioritize them. Urgent renders happen first, non-urgent renders happen after and are interruptible. The opacity dimming during isPending/isStale shows the recommended UX pattern.",
      order_index: 3,
    },
  ],
};

export default examples;
