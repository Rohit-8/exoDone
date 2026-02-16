// ============================================================================
// React Performance — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  "memo-profiling": [
    {
      question_text:
        "What are the three conditions that cause a React component to re-render, and which of them does React.memo specifically prevent?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A component re-renders when (1) its state changes, (2) its parent re-renders, (3) a context it consumes changes — React.memo prevents all three by caching the component's output and skipping the reconciliation phase entirely",
        "A component re-renders when (1) its state changes, (2) its parent re-renders, (3) a context it consumes changes — React.memo only prevents re-renders caused by the parent re-rendering (when props are shallowly equal); it does NOT prevent re-renders from the component's own state changes or context changes",
        "A component re-renders when (1) its props change, (2) window events fire, (3) sibling components update — React.memo prevents all prop-triggered re-renders by deep-comparing all props including nested objects and arrays",
        "A component re-renders when (1) the virtual DOM diff detects changes, (2) the browser triggers a repaint, (3) a useEffect fires — React.memo skips the virtual DOM diff phase, which is the most expensive of the three",
      ]),
      correct_answer:
        "A component re-renders when (1) its state changes, (2) its parent re-renders, (3) a context it consumes changes — React.memo only prevents re-renders caused by the parent re-rendering (when props are shallowly equal); it does NOT prevent re-renders from the component's own state changes or context changes",
      explanation:
        "React.memo wraps a component and adds a shallow prop comparison before re-rendering. When the parent re-renders and passes the same props (by reference), React.memo skips calling the component function entirely. However, React.memo cannot prevent re-renders from the component's own useState/useReducer changes (those are internal to the component) or from context changes (context bypasses props entirely). This is why React.memo alone is often insufficient — you also need useMemo/useCallback to stabilize the prop references, and context splitting to limit context-triggered re-renders.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text:
        "Why does passing an inline object or function as a prop to a React.memo-wrapped child defeat memoization, and what are two solutions?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Inline objects and functions create new references on every render — Object.is({}, {}) is false even if the contents are identical, so React.memo's shallow comparison sees them as 'changed' and re-renders the child. Solutions: (1) move static objects to module scope, or wrap dynamic objects in useMemo; (2) wrap functions in useCallback to preserve the reference between renders",
        "Inline objects and functions are slower to parse than variables — the JavaScript engine must re-compile them on every render, causing a performance penalty that React.memo cannot offset. Solutions: (1) use Object.freeze() on all objects; (2) use Function.prototype.bind() instead of arrow functions",
        "Inline objects and functions cause React.memo to throw a warning in strict mode — React intentionally skips memoization for dynamically created values to prevent stale closure bugs. Solutions: (1) set the 'immutable' flag on objects; (2) use class methods instead of arrow functions",
        "Inline objects and functions are stored in a separate memory pool that React.memo cannot access — the garbage collector moves them before the comparison runs. Solutions: (1) use WeakRef for objects; (2) use generators for functions",
      ]),
      correct_answer:
        "Inline objects and functions create new references on every render — Object.is({}, {}) is false even if the contents are identical, so React.memo's shallow comparison sees them as 'changed' and re-renders the child. Solutions: (1) move static objects to module scope, or wrap dynamic objects in useMemo; (2) wrap functions in useCallback to preserve the reference between renders",
      explanation:
        "React.memo compares props using Object.is (shallow equality). For primitives, Object.is(5, 5) is true. For objects and functions, Object.is compares by reference — Object.is({a: 1}, {a: 1}) is false because they're different objects in memory, even though they have the same content. Every time a parent renders, JSX like <Child style={{ color: 'red' }} /> creates a brand-new object, and <Child onClick={() => doThing()} /> creates a brand-new function. React.memo sees the new reference and re-renders the child. Fix: static objects go at module scope (const style = { color: 'red' }), dynamic objects use useMemo, and functions use useCallback. A custom comparator can also ignore specific props.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "What is the difference between the 'actual duration' and 'base duration' reported by the React Profiler, and how do you use them to evaluate memoization effectiveness?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Actual duration is the time to render the committed update; base duration is the estimated time to render the entire subtree without any memoization (React.memo, useMemo, useCallback) — if actual is much less than base, memoization is effectively skipping renders; if they are close, memoization is not helping and may add unnecessary overhead",
        "Actual duration is the JavaScript execution time; base duration is the total time including browser layout and paint — if actual is less than base, the bottleneck is in the browser's rendering pipeline rather than React's reconciliation",
        "Actual duration is measured in the development build; base duration is the estimated production time after minification and dead-code elimination — actual is always higher than base because development mode adds extra warnings and checks",
        "Actual duration is the time for the first render (mount); base duration is the average time for subsequent renders (updates) — if base is increasing over time, there is a memory leak causing progressively slower renders",
      ]),
      correct_answer:
        "Actual duration is the time to render the committed update; base duration is the estimated time to render the entire subtree without any memoization (React.memo, useMemo, useCallback) — if actual is much less than base, memoization is effectively skipping renders; if they are close, memoization is not helping and may add unnecessary overhead",
      explanation:
        "The React.Profiler onRender callback provides both values: actualDuration is how long React spent rendering the components that actually committed in this update. baseDuration is how long it would take to render the entire subtree from scratch without any memoization bailouts. Example: if a subtree has 500 components but only 10 actually re-rendered (because 490 were memoized), actualDuration might be 2ms while baseDuration is 50ms — that means memoization saved ~96% of the work. If actualDuration ≈ baseDuration, your memoization isn't catching anything (perhaps because inline objects/functions are breaking React.memo). This ratio is the most reliable metric for measuring memoization ROI.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "What is the 'useCallback dependency trap,' and what are three techniques to create a stable callback that always reads the latest values?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The dependency trap is when useCallback depends on rapidly-changing values (like a search query or array), causing a new function reference on every change and defeating React.memo. Three solutions: (1) use a ref to store the latest value and read it inside the callback (empty deps); (2) use functional setState (setCount(prev => prev + 1)) to avoid depending on state values; (3) create a custom useStableCallback hook that wraps the callback in a ref (the useEffectEvent pattern)",
        "The dependency trap is when useCallback creates a circular dependency with useEffect, causing an infinite re-render loop. Three solutions: (1) remove useCallback entirely; (2) add an eslint-disable comment; (3) use useMemo instead of useCallback",
        "The dependency trap is when useCallback captures stale closure variables because dependencies are missing. Three solutions: (1) add all variables to the dependency array; (2) use the useLatest hook from the React standard library; (3) convert to a class component with this.handleClick",
        "The dependency trap is when useCallback prevents garbage collection of old component instances, causing memory leaks. Three solutions: (1) call useCallback with a WeakRef; (2) return a cleanup function from useCallback; (3) use useLayoutEffect instead of useCallback",
      ]),
      correct_answer:
        "The dependency trap is when useCallback depends on rapidly-changing values (like a search query or array), causing a new function reference on every change and defeating React.memo. Three solutions: (1) use a ref to store the latest value and read it inside the callback (empty deps); (2) use functional setState (setCount(prev => prev + 1)) to avoid depending on state values; (3) create a custom useStableCallback hook that wraps the callback in a ref (the useEffectEvent pattern)",
      explanation:
        "The dependency trap: you add useCallback to stabilize a function reference, but the function uses values that change frequently (items array, search query, etc.). Adding those as dependencies means useCallback returns a new function every time they change — which is exactly what you were trying to avoid. Solution 1: store the latest value in a useRef, update it in useEffect, and read ref.current inside the callback (refs don't trigger re-renders). Solution 2: for state-dependent callbacks, use functional updates like setCount(prev => prev + 1) — these don't need the current value as a dependency. Solution 3: the useStableCallback / useEffectEvent pattern — a custom hook that stores the callback in a ref and returns a stable wrapper function. All three achieve a stable function identity while always reading the latest values.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "When should you NOT use React.memo, useMemo, or useCallback, and what is the cost of unnecessary memoization?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Never skip memoization — it's always beneficial because JavaScript engines optimize memoized functions with JIT compilation, and React internally pools memoized values in a shared cache that reduces garbage collection pressure",
        "Skip memoization when the component renders quickly (simple UI with few children), when props change on nearly every render anyway (memoization comparison runs but always re-renders), or when the component is a leaf node with no children — the cost is memory (cached values are retained), CPU (comparison runs on every render), and code complexity (harder to read and maintain)",
        "Skip memoization only in development mode — all memoization should be enabled in production because React's production build automatically removes the comparison overhead, making it zero-cost",
        "Skip memoization for function components but always use it for class components — function components already have built-in memoization via the fiber reconciler, while class components do not benefit from shouldComponentUpdate without explicit PureComponent or React.memo",
      ]),
      correct_answer:
        "Skip memoization when the component renders quickly (simple UI with few children), when props change on nearly every render anyway (memoization comparison runs but always re-renders), or when the component is a leaf node with no children — the cost is memory (cached values are retained), CPU (comparison runs on every render), and code complexity (harder to read and maintain)",
      explanation:
        "Memoization is NOT free: React.memo adds a shallow comparison of all props on every parent render — if props change frequently, you're paying for the comparison AND the re-render. useMemo and useCallback store the previous value in memory and compare dependencies on every render — if the value is cheap to compute, the memoization overhead exceeds the savings. Additionally, memoized code is harder to read and maintain. Best practice: profile first with React DevTools, identify actual bottlenecks (components rendering > 16ms or rendering hundreds of times), then apply memoization surgically. Don't wrap every component in React.memo — only the ones where the Profiler shows wasted renders.",
      difficulty: "medium",
      order_index: 5,
    },
  ],

  "code-splitting-lazy": [
    {
      question_text:
        "Why does React.lazy only support default exports, and what is the recommended pattern for lazy-loading a named export?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "React.lazy expects the dynamic import() to resolve to a module with a 'default' property containing a React component — this simplifies the internal Suspense integration. For named exports, chain .then() on the import: lazy(() => import('./Charts').then(m => ({ default: m.BarChart }))) — this wraps the named export in a module-like object with a 'default' key",
        "React.lazy only supports default exports because named exports are not tree-shakeable — the bundler cannot determine which named export to include in the chunk. For named exports, you must create a separate file that re-exports the component as default, and there is no inline workaround",
        "React.lazy only supports default exports because JavaScript dynamic import() cannot resolve named exports at runtime — the module namespace object is frozen and cannot be destructured. For named exports, use require() instead of import() since CommonJS supports named resolution",
        "React.lazy only supports default exports because React's reconciler uses the 'default' key to determine the component type during fiber creation — without it, React cannot create the correct fiber node. For named exports, wrap the component in React.forwardRef which adds a default key",
      ]),
      correct_answer:
        "React.lazy expects the dynamic import() to resolve to a module with a 'default' property containing a React component — this simplifies the internal Suspense integration. For named exports, chain .then() on the import: lazy(() => import('./Charts').then(m => ({ default: m.BarChart }))) — this wraps the named export in a module-like object with a 'default' key",
      explanation:
        "React.lazy's contract is simple: the function you pass must return a Promise that resolves to an object with a 'default' property. Dynamic import() already produces this for default exports (import('./Foo') resolves to { default: FooComponent }). For named exports, import('./Charts') resolves to { BarChart, PieChart, ... } — no 'default' key. The .then(m => ({ default: m.BarChart })) pattern creates the expected shape. An alternative is creating a re-export file (export { BarChart as default } from './Charts'). Dynamic import() CAN resolve named exports — the module namespace object is not frozen and can be destructured. Tree-shaking works with named exports.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "What is the purpose of nesting Suspense boundaries, and what happens if a lazy component is rendered without any Suspense boundary above it in the tree?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Nested Suspense boundaries allow different sections to load independently — a slow chart doesn't block a fast table if they're in separate Suspense wrappers; each boundary shows its own fallback while its children load. Without any Suspense boundary, React throws an error: 'A component suspended while rendering, but no fallback UI was specified'",
        "Nested Suspense boundaries create a loading priority queue — inner boundaries load before outer ones, and React batches their resolution to minimize layout thrash. Without a boundary, React silently renders null until the component loads",
        "Nested Suspense boundaries enable parallel chunk downloads — each boundary issues its own HTTP request and React merges the responses. Without a boundary, chunks are loaded sequentially which is slower but functional",
        "Nested Suspense boundaries allow different loading animation styles at each level — route-level shows a page skeleton, component-level shows a spinner. Without a boundary, React uses a built-in default spinner that cannot be customized",
      ]),
      correct_answer:
        "Nested Suspense boundaries allow different sections to load independently — a slow chart doesn't block a fast table if they're in separate Suspense wrappers; each boundary shows its own fallback while its children load. Without any Suspense boundary, React throws an error: 'A component suspended while rendering, but no fallback UI was specified'",
      explanation:
        "When a component suspends (React.lazy, data fetching with Suspense), React walks up the tree to find the nearest Suspense boundary and displays its fallback. If there's only one boundary at the route level, the entire page shows a skeleton even if only one small widget is loading. By nesting boundaries, each section manages its own loading state — the header appears instantly, the chart shows a chart-skeleton, and the table shows a table-skeleton, all independent. If no Suspense boundary exists anywhere above the suspended component, React throws an uncaught error in both development and production — it does NOT silently render null or use a default spinner.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text:
        "How does route-based preloading with dynamic import() eliminate perceived loading latency, and what are two strategies for triggering the preload?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Preloading calls the same dynamic import() function ahead of time — the browser downloads and caches the module, so when React.lazy renders the component, the import resolves instantly from cache (no network request). Two strategies: (1) on mouseenter/focus of navigation links (user is likely about to click); (2) requestIdleCallback after initial load (prefetch all routes when the browser is idle)",
        "Preloading uses the HTML <link rel='preload'> tag which is faster than JavaScript import() because the browser's preload scanner fetches it during HTML parsing. Two strategies: (1) add preload links in the HTML head for all routes; (2) use the Preload API in the service worker to cache all chunks on install",
        "Preloading compiles the module in a Web Worker thread so the main thread doesn't block — when React.lazy renders, the compiled module is transferred via postMessage. Two strategies: (1) create a dedicated worker pool for each route; (2) use SharedArrayBuffer to share compiled code between workers",
        "Preloading uses HTTP/2 server push to send chunks before the client requests them — the server predicts which route the user will visit based on analytics. Two strategies: (1) configure the CDN with push rules; (2) use the 103 Early Hints HTTP status code",
      ]),
      correct_answer:
        "Preloading calls the same dynamic import() function ahead of time — the browser downloads and caches the module, so when React.lazy renders the component, the import resolves instantly from cache (no network request). Two strategies: (1) on mouseenter/focus of navigation links (user is likely about to click); (2) requestIdleCallback after initial load (prefetch all routes when the browser is idle)",
      explanation:
        "The key insight is that dynamic import() returns a Promise — calling it starts the download. The module system caches the result, so a second call to import('./Dashboard') returns the cached module immediately (no duplicate download). React.lazy stores the import function and calls it on first render. If you call the import function BEFORE React.lazy renders (e.g., on link hover), the module is already cached. When React.lazy finally renders, it resolves instantly — the user sees no loading spinner. The mouseenter strategy gives ~200-400ms head start (average hover-to-click time). The requestIdleCallback strategy prefetches everything when the browser is idle, at the cost of bandwidth. Both strategies work because import() idempotently caches the module.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "What is the difference between useTransition and useDeferredValue in React 18, and in what scenarios would you choose one over the other?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "useTransition wraps a setState call to mark it as non-urgent and provides isPending for loading UI — use it when you control the state update (tab switching, filters). useDeferredValue creates a deferred copy of a value that lags behind during rapid updates — use it when you receive a value as a prop and want to defer the expensive rendering it causes (search input filtering, live previews)",
        "useTransition debounces state updates by a fixed delay (default 100ms), while useDeferredValue throttles them (maximum once per frame). useTransition is for user input; useDeferredValue is for API responses",
        "useTransition moves rendering to a Web Worker thread, while useDeferredValue keeps rendering on the main thread but uses requestIdleCallback. useTransition is for CPU-heavy work; useDeferredValue is for DOM-heavy work",
        "useTransition is for class components (wraps setState), while useDeferredValue is for function components (wraps useState). They provide the same functionality but for different component types",
      ]),
      correct_answer:
        "useTransition wraps a setState call to mark it as non-urgent and provides isPending for loading UI — use it when you control the state update (tab switching, filters). useDeferredValue creates a deferred copy of a value that lags behind during rapid updates — use it when you receive a value as a prop and want to defer the expensive rendering it causes (search input filtering, live previews)",
      explanation:
        "useTransition and useDeferredValue both leverage React 18's concurrent rendering to prioritize urgent updates over non-urgent ones. useTransition: you wrap a setState call in startTransition(() => setState(newValue)). React keeps the old UI visible while rendering the new state in the background. It gives you isPending to show loading indicators. Use it when you control the state update. useDeferredValue: you pass a value (prop or state) and get back a deferred copy. During rapid changes, the deferred value lags behind — React processes it at lower priority. Use it when you receive a changing value and want to defer expensive derived rendering. Neither uses Web Workers, fixed delays, or requestIdleCallback — they use React's scheduler to interleave urgent and non-urgent renders on the main thread.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "How does virtualization (windowing) with react-window improve performance for large lists, and what is the key trade-off compared to rendering all items?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Virtualization renders only the items visible in the viewport plus a small overscan buffer — instead of creating 10,000+ DOM nodes, it creates ~20-30 and repositions them as the user scrolls. The trade-off: browser find-in-page (Ctrl+F) cannot search off-screen items, scroll position must be managed programmatically, and accessibility (screen readers) requires ARIA attributes since not all items are in the DOM",
        "Virtualization compresses the list data using gzip so the browser downloads and parses fewer bytes — instead of transferring all 10,000 items, it sends only the visible ones via WebSocket. The trade-off: requires a WebSocket server and real-time data synchronization, which adds backend complexity",
        "Virtualization uses CSS content-visibility:auto to hide off-screen items — the browser skips layout and paint for hidden items. The trade-off: content-visibility is not supported in Safari, so a polyfill is required that adds 50KB to the bundle",
        "Virtualization uses SVG instead of DOM elements for list items — SVG renders faster because it bypasses the CSS layout engine. The trade-off: SVG does not support text selection, form inputs, or interactive elements, so it's only suitable for read-only lists",
      ]),
      correct_answer:
        "Virtualization renders only the items visible in the viewport plus a small overscan buffer — instead of creating 10,000+ DOM nodes, it creates ~20-30 and repositions them as the user scrolls. The trade-off: browser find-in-page (Ctrl+F) cannot search off-screen items, scroll position must be managed programmatically, and accessibility (screen readers) requires ARIA attributes since not all items are in the DOM",
      explanation:
        "Virtualization (react-window, react-virtuoso) works by rendering a container with the total scroll height (e.g., 10,000 × 50px = 500,000px) but only mounting DOM nodes for visible items. As the user scrolls, items entering the viewport are mounted and items leaving are unmounted. The overscanCount adds extra items above/below the visible area to prevent flicker during fast scrolling. This reduces DOM nodes from thousands to ~20-30, dramatically improving initial render time, memory usage, and scroll performance. The trade-offs are real: Ctrl+F search only finds rendered text, SEO crawlers may not see all content, and screen readers need proper ARIA roles (role='row', aria-rowindex) to announce the list size. These trade-offs are acceptable for large datasets (1000+ items) where rendering all items would cause visible jank.",
      difficulty: "medium",
      order_index: 5,
    },
  ],
};

export default quiz;
