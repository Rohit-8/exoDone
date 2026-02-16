const examples = {
  "usestate-useeffect": [
    {
      title: "Data Fetching with Cleanup (AbortController)",
      description:
        "Demonstrates proper data fetching inside useEffect with race condition prevention using AbortController, loading/error states, and cleanup on unmount or dependency change.",
      language: "javascript",
      code: `import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create an AbortController to cancel the request if userId changes
    // or the component unmounts before the fetch completes
    const controller = new AbortController();
    const { signal } = controller;

    async function fetchUser() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(\\\`/api/users/\\\${userId}\\\`, { signal });

        if (!response.ok) {
          throw new Error(\\\`HTTP \\\${response.status}: \\\${response.statusText}\\\`);
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        // AbortError is expected when we cancel — don't treat it as an error
        if (err.name !== 'AbortError') {
          setError(err.message);
          setUser(null);
        }
      } finally {
        // Only update loading if the request wasn't aborted
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    // Cleanup: abort any in-flight request when userId changes or unmount
    return () => controller.abort();
  }, [userId]); // Re-run when userId changes

  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!user) return null;

  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <span className="role">{user.role}</span>
    </div>
  );
}

// Parent component — rapidly switching userId demonstrates
// why AbortController is critical for preventing race conditions
function App() {
  const [selectedId, setSelectedId] = useState(1);

  return (
    <div>
      <nav>
        {[1, 2, 3, 4, 5].map(id => (
          <button
            key={id}
            onClick={() => setSelectedId(id)}
            className={selectedId === id ? 'active' : ''}
          >
            User {id}
          </button>
        ))}
      </nav>
      <UserProfile userId={selectedId} />
    </div>
  );
}`,
      explanation:
        "This example shows the gold-standard pattern for data fetching in useEffect. The AbortController ensures that when userId changes rapidly, stale responses from previous requests are discarded. Without this, clicking User 1 then User 5 quickly could display User 1's data if that response arrives last. The cleanup function runs before each re-execution AND on unmount, canceling any pending fetch. Note the check for AbortError in the catch block — aborting a fetch throws an error, which is expected behavior we should handle gracefully. The loading state is also guarded against updates after abort.",
      order_index: 1,
    },
    {
      title: "Debounced Search with useState & useEffect",
      description:
        "Implements a search input that debounces API calls using useEffect cleanup, demonstrating the cleanup-as-cancellation pattern and functional state updates.",
      language: "javascript",
      code: `import { useState, useEffect } from 'react';

function DebouncedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Don't search for empty or very short queries
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Set up a debounce timer — the search only fires
    // after the user stops typing for 300ms
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(
          \\\`/api/search?q=\\\${encodeURIComponent(query.trim())}\\\`
        );
        const data = await response.json();
        setResults(data.results);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    // Cleanup: clear the timer if query changes before 300ms
    // This is the "debounce" mechanism — typing resets the timer
    return () => {
      clearTimeout(debounceTimer);
      setIsSearching(false);
    };
  }, [query]); // Re-run whenever query changes

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="search-input"
      />

      {isSearching && <p className="searching">Searching...</p>}

      <ul className="results-list">
        {results.map((result) => (
          <li key={result.id} className="result-item">
            <h3>{result.title}</h3>
            <p>{result.snippet}</p>
          </li>
        ))}
      </ul>

      {!isSearching && query.length >= 2 && results.length === 0 && (
        <p className="no-results">No results found for "{query}"</p>
      )}
    </div>
  );
}`,
      explanation:
        "This is a practical example of useEffect cleanup being used for debouncing. Each keystroke triggers the effect, which sets a 300ms timer. When the user types another character, the cleanup from the previous effect run clears the old timer before the new one starts. Only when the user pauses for 300ms does the API call actually fire. This pattern avoids the need for external debounce libraries. The key insight is that useEffect cleanup runs BEFORE the next effect execution, making it a natural fit for cancellation patterns like debouncing, throttling, and abort-on-remount.",
      order_index: 2,
    },
    {
      title: "Batched State Updates & Functional Updaters",
      description:
        "Demonstrates React 18 automatic batching, the importance of functional updaters for sequential state changes, and common stale closure pitfalls.",
      language: "javascript",
      code: `import { useState } from 'react';

function BatchingDemo() {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);

  // WRONG: Direct value — stale closure issue
  // Both calls capture the same 'count' from this render's closure.
  // Result: count only increments by 1, not 3.
  const incrementWrong = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    setLog(prev => [...prev, 'Wrong: tried to add 3, only added 1']);
  };

  // CORRECT: Functional updater — each update sees latest pending state
  // React queues these and passes each updater the result of the previous one.
  // Result: count increments by 3.
  const incrementCorrect = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setLog(prev => [...prev, 'Correct: added 3 using functional updater']);
  };

  // React 18 batching — all these updates result in ONE re-render
  const batchedAsync = () => {
    setTimeout(() => {
      setCount(prev => prev + 1);
      setLog(prev => [...prev, 'Batched in setTimeout — single re-render']);
      // In React 17, this would cause TWO re-renders.
      // In React 18, it's batched into one.
    }, 0);
  };

  // Promise-based batching (also batched in React 18)
  const batchedPromise = () => {
    fetch('/api/data')
      .then(() => {
        setCount(prev => prev + 10);
        setLog(prev => [...prev, 'Batched in promise — single re-render']);
      })
      .catch(() => {
        setCount(prev => prev + 10);
        setLog(prev => [...prev, 'Batched in promise catch']);
      });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Count: {count}</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={incrementWrong}>
          +3 (Wrong Way)
        </button>
        <button onClick={incrementCorrect}>
          +3 (Correct Way)
        </button>
        <button onClick={batchedAsync}>
          +1 (setTimeout)
        </button>
        <button onClick={() => setCount(0)}>
          Reset
        </button>
      </div>

      <div>
        <h3>Event Log:</h3>
        <ul>
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}`,
      explanation:
        "This interactive example makes React 18 batching and the stale closure problem tangible. The 'Wrong Way' button calls setCount(count + 1) three times, but since all three calls capture the same 'count' value from the render closure, they all set count to the same value (count + 1). The 'Correct Way' uses functional updaters (prev => prev + 1), where each updater receives the result of the previous one. The setTimeout button demonstrates React 18's automatic batching — even in async callbacks, multiple setState calls produce only one re-render. This is a major improvement over React 17, where updates outside event handlers were NOT batched.",
      order_index: 3,
    },
  ],

  "useref-usememo-usecallback": [
    {
      title: "Previous Value Tracker with useRef",
      description:
        "Builds a reusable usePrevious custom hook and demonstrates it in a stock price component that shows directional arrows based on price movement.",
      language: "javascript",
      code: `import { useState, useEffect, useRef } from 'react';

// Custom hook: captures the previous value of any variable
function usePrevious(value) {
  const ref = useRef();

  // useEffect runs AFTER render, so during the current render,
  // ref.current still holds the value from the previous render.
  // After this render commits, the effect updates ref.current.
  useEffect(() => {
    ref.current = value;
  }); // No deps = runs after every render

  return ref.current;
}

// Custom hook: tracks render count (useful for debugging)
function useRenderCount() {
  const count = useRef(0);
  count.current += 1; // Increments every render, doesn't trigger re-render
  return count.current;
}

function StockPrice({ symbol }) {
  const [price, setPrice] = useState(null);
  const [history, setHistory] = useState([]);
  const prevPrice = usePrevious(price);
  const renderCount = useRenderCount();
  const wsRef = useRef(null);

  useEffect(() => {
    // Store WebSocket in ref so we can close it in cleanup
    wsRef.current = new WebSocket(\\\`wss://stocks.example.com/\\\${symbol}\\\`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(data.price);
      setHistory(prev => [...prev.slice(-9), data.price]); // Keep last 10
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      // Cleanup: close the WebSocket when symbol changes or unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

  const getDirection = () => {
    if (prevPrice === undefined || prevPrice === null || price === prevPrice) {
      return { arrow: '—', color: 'gray', label: 'unchanged' };
    }
    return price > prevPrice
      ? { arrow: '', color: '#22c55e', label: 'up' }
      : { arrow: '', color: '#ef4444', label: 'down' };
  };

  const direction = getDirection();
  const changePercent = prevPrice
    ? (((price - prevPrice) / prevPrice) * 100).toFixed(2)
    : '0.00';

  return (
    <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <small style={{ color: '#888' }}>Renders: {renderCount}</small>
      <h2>{symbol}</h2>
      {price !== null ? (
        <>
          <div style={{ fontSize: 32, color: direction.color }}>
            \\\${price.toFixed(2)} {direction.arrow}
          </div>
          <p>
            Change: {changePercent}% ({direction.label})
          </p>
          <div style={{ fontSize: 12, color: '#666' }}>
            History: {history.map(p => \\\`$\\\${p.toFixed(2)}\\\`).join(' -> ')}
          </div>
        </>
      ) : (
        <p>Connecting...</p>
      )}
    </div>
  );
}`,
      explanation:
        "This example showcases three useRef use cases: (1) usePrevious — stores the previous render's value by exploiting the fact that useEffect runs after render, so ref.current still holds the old value during render but gets updated post-render. (2) useRenderCount — a debugging tool that increments a ref on every render without causing additional renders. (3) wsRef — stores a WebSocket instance so the cleanup function can close it. The key insight is that useRef is the tool for any value that needs to persist across renders but whose changes shouldn't trigger re-renders.",
      order_index: 1,
    },
    {
      title: "Expensive List Filter with useMemo & React.memo",
      description:
        "Demonstrates useMemo for caching an expensive filtering/sorting operation and useCallback to prevent unnecessary re-renders of a memoized child component.",
      language: "javascript",
      code: `import { useState, useMemo, useCallback, memo } from 'react';

// Simulated expensive computation — imagine this processes 10,000+ items
function expensiveFilter(items, searchTerm, sortBy) {
  console.log('Running expensive filter...'); // Watch the console!

  return items
    .filter(item => {
      const term = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });
}

// Memoized child — only re-renders when its props actually change
const ProductCard = memo(({ product, onAddToCart }) => {
  console.log('ProductCard render:', product.name);

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.category}</p>
      <span className="price">\\\${product.price.toFixed(2)}</span>
      <span className="rating">star {product.rating}</span>
      <button onClick={() => onAddToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  );
});

function ProductList({ products }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [cartCount, setCartCount] = useState(0);

  // useMemo: Only re-runs the expensive filter when inputs change.
  // Changing cartCount will NOT re-trigger the filter.
  const filteredProducts = useMemo(
    () => expensiveFilter(products, searchTerm, sortBy),
    [products, searchTerm, sortBy]
  );

  // useCallback: Stabilize the function reference so ProductCard (memo)
  // doesn't re-render when cartCount changes.
  const handleAddToCart = useCallback((productId) => {
    setCartCount(prev => prev + 1);
    console.log('Added product:', productId);
  }, []); // No deps — uses functional updater for setCartCount

  // Memoize stats to avoid recalculating on every render
  const stats = useMemo(() => ({
    total: filteredProducts.length,
    avgPrice: filteredProducts.length > 0
      ? (filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length).toFixed(2)
      : '0.00',
    avgRating: filteredProducts.length > 0
      ? (filteredProducts.reduce((sum, p) => sum + p.rating, 0) / filteredProducts.length).toFixed(1)
      : '0.0',
  }), [filteredProducts]);

  return (
    <div>
      <div className="controls">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search products..."
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Name</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        <span>Cart: {cartCount} items</span>
      </div>

      <div className="stats">
        Showing {stats.total} products | Avg price: \\\${stats.avgPrice} | Avg rating: star {stats.avgRating}
      </div>

      <div className="product-grid">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}`,
      explanation:
        "This example demonstrates the interplay between useMemo, useCallback, and React.memo. The expensive filter runs only when products, searchTerm, or sortBy change — incrementing cartCount does NOT re-run it. The handleAddToCart function is wrapped in useCallback with an empty dependency array (it uses a functional updater for setCartCount, so it doesn't need any deps). This stabilized reference, combined with React.memo on ProductCard, means ProductCards don't re-render when cartCount changes. Without useCallback, clicking 'Add to Cart' would re-render every ProductCard because a new function reference would be created.",
      order_index: 2,
    },
    {
      title: "Ref Callback for Dynamic DOM Measurement",
      description:
        "Uses a callback ref pattern to measure a dynamically-sized element and a ResizeObserver to track size changes, showing when useRef alone isn't sufficient.",
      language: "javascript",
      code: `import { useState, useCallback, useEffect, useRef } from 'react';

// Custom hook: measures an element using a callback ref + ResizeObserver
function useMeasure() {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  });
  const observerRef = useRef(null);
  const nodeRef = useRef(null);

  // Callback ref — called when the element mounts/unmounts
  const measureRef = useCallback((node) => {
    // Cleanup previous observer if any
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node !== null) {
      nodeRef.current = node;

      // Initial measurement
      const rect = node.getBoundingClientRect();
      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      });

      // Observe for resize changes
      observerRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          const rect = entry.target.getBoundingClientRect();
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
            top: Math.round(rect.top),
            left: Math.round(rect.left),
          });
        }
      });

      observerRef.current.observe(node);
    }
  }, []);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { measureRef, dimensions };
}

function ResizablePanel() {
  const [content, setContent] = useState('Short content');
  const { measureRef, dimensions } = useMeasure();

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setContent('Short content')}>
          Short
        </button>
        <button onClick={() => setContent(
          'This is much longer content that will cause the panel to grow. '.repeat(5)
        )}>
          Long
        </button>
        <button onClick={() => setContent(
          'Medium length content for testing the resize observer behavior.'
        )}>
          Medium
        </button>
      </div>

      <div
        ref={measureRef}
        style={{
          padding: 16,
          border: '2px solid #3b82f6',
          borderRadius: 8,
          maxWidth: 400,
          transition: 'all 0.3s ease',
        }}
      >
        {content}
      </div>

      <div style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 14 }}>
        <p>Width: {dimensions.width}px</p>
        <p>Height: {dimensions.height}px</p>
        <p>Top: {dimensions.top}px</p>
        <p>Left: {dimensions.left}px</p>
      </div>
    </div>
  );
}`,
      explanation:
        "This example demonstrates the callback ref pattern with a practical useMeasure hook. A regular useRef with useEffect would miss cases where an element conditionally renders or its node changes. The callback ref fires precisely when the DOM node is attached/detached. Combined with ResizeObserver, this hook reactively tracks an element's dimensions as it resizes. Note the careful cleanup: the previous observer is disconnected when the ref callback fires with a new node, and the useEffect cleanup handles unmount. This pattern is commonly used in tooltip positioning, virtualized lists, and responsive layouts.",
      order_index: 3,
    },
  ],

  "usereducer-usecontext": [
    {
      title: "Shopping Cart with useReducer",
      description:
        "Implements a full shopping cart with add, remove, update quantity, and clear operations using the useReducer pattern, demonstrating complex interdependent state management.",
      language: "javascript",
      code: `import { useReducer } from 'react';

// Action type constants prevent typos and enable autocomplete
const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  APPLY_COUPON: 'APPLY_COUPON',
  CLEAR_CART: 'CLEAR_CART',
};

const initialState = {
  items: [],
  coupon: null,
  discount: 0,
};

// Helper: recalculate derived values
function calculateTotals(items, discount) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );
  const discountAmount = subtotal * discount;
  return {
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const existing = state.items.find(i => i.id === action.payload.id);
      const newItems = existing
        ? state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        : [...state.items, { ...action.payload, quantity: 1 }];
      return { ...state, items: newItems };
    }

    case ACTIONS.REMOVE_ITEM: {
      const newItems = state.items.filter(i => i.id !== action.payload);
      return { ...state, items: newItems };
    }

    case ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== id) };
      }
      const newItems = state.items.map(i =>
        i.id === id ? { ...i, quantity } : i
      );
      return { ...state, items: newItems };
    }

    case ACTIONS.APPLY_COUPON: {
      const coupons = { SAVE10: 0.1, SAVE20: 0.2, HALF: 0.5 };
      const discount = coupons[action.payload.toUpperCase()] || 0;
      return {
        ...state,
        coupon: discount > 0 ? action.payload.toUpperCase() : null,
        discount,
      };
    }

    case ACTIONS.CLEAR_CART:
      return initialState;

    default:
      throw new Error(\\\`Unknown action: \\\${action.type}\\\`);
  }
}

function ShoppingCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const totals = calculateTotals(state.items, state.discount);

  // Simulated products
  const products = [
    { id: 1, name: 'React Handbook', price: 29.99 },
    { id: 2, name: 'Node.js Guide', price: 34.99 },
    { id: 3, name: 'TypeScript Course', price: 49.99 },
  ];

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <div>
        <h2>Products</h2>
        {products.map(product => (
          <div key={product.id} style={{ marginBottom: 12 }}>
            <span>{product.name} — \\\${product.price}</span>
            <button
              onClick={() =>
                dispatch({ type: ACTIONS.ADD_ITEM, payload: product })
              }
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2>Cart ({totals.itemCount} items)</h2>
        {state.items.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            {state.items.map(item => (
              <div key={item.id} style={{ marginBottom: 8 }}>
                <strong>{item.name}</strong> — \\\${item.price} x
                <input
                  type="number"
                  value={item.quantity}
                  min="0"
                  style={{ width: 50, margin: '0 8px' }}
                  onChange={e =>
                    dispatch({
                      type: ACTIONS.UPDATE_QUANTITY,
                      payload: { id: item.id, quantity: parseInt(e.target.value) || 0 },
                    })
                  }
                />
                = \\\${(item.price * item.quantity).toFixed(2)}
                <button
                  onClick={() =>
                    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: item.id })
                  }
                >
                  Remove
                </button>
              </div>
            ))}

            <hr />
            <p>Subtotal: \\\${totals.subtotal.toFixed(2)}</p>
            {state.coupon && (
              <p style={{ color: 'green' }}>
                Coupon ({state.coupon}): -\\\${totals.discountAmount.toFixed(2)}
              </p>
            )}
            <p><strong>Total: \\\${totals.total.toFixed(2)}</strong></p>

            <input
              type="text"
              placeholder="Coupon code"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  dispatch({ type: ACTIONS.APPLY_COUPON, payload: e.target.value });
                }
              }}
            />
            <button onClick={() => dispatch({ type: ACTIONS.CLEAR_CART })}>
              Clear Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}`,
      explanation:
        "This demonstrates why useReducer excels for complex, interdependent state. The cart has multiple operations (add, remove, update quantity, apply coupon) that all modify the same state shape in different ways. The reducer centralizes all transition logic — making it easy to understand, modify, and test. Notice how REMOVE logic is reused inside UPDATE_QUANTITY (when quantity reaches 0), and how calculateTotals derives values from the items array rather than storing them in state. Action type constants prevent typos and are easy to export for testing. This pattern maps directly to what interviewers expect when you discuss state management architecture.",
      order_index: 1,
    },
    {
      title: "Theme System with useContext",
      description:
        "Builds a complete theme context system with light/dark modes, custom theme support, system preference detection, and localStorage persistence — demonstrating context provider patterns and the custom hook pattern.",
      language: "javascript",
      code: `import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Theme definitions
const themes = {
  light: {
    name: 'light',
    colors: {
      background: '#ffffff',
      surface: '#f3f4f6',
      text: '#111827',
      textSecondary: '#6b7280',
      primary: '#3b82f6',
      border: '#e5e7eb',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      primary: '#60a5fa',
      border: '#374151',
    },
  },
};

// Create context with undefined default — forces provider usage
const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  // Initialize from localStorage or system preference
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem('theme-preference');
    if (saved && themes[saved]) return saved;

    // Fall back to system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      const saved = localStorage.getItem('theme-preference');
      // Only auto-switch if user hasn't set a manual preference
      if (!saved) {
        setThemeName(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('theme-preference', themeName);
    // Also set a CSS class on the root element for Tailwind/CSS usage
    document.documentElement.setAttribute('data-theme', themeName);
  }, [themeName]);

  const toggleTheme = useCallback(() => {
    setThemeName(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((name) => {
    if (themes[name]) setThemeName(name);
  }, []);

  // Memoize context value to prevent unnecessary consumer re-renders
  const value = useMemo(() => ({
    theme: themes[themeName],
    themeName,
    toggleTheme,
    setTheme,
    isDark: themeName === 'dark',
  }), [themeName, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook with safety check
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// --- Consumer components ---

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} aria-label="Toggle theme">
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

function ThemedCard({ title, children }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        color: colors.text,
        border: \\\`1px solid \\\${colors.border}\\\`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <h3 style={{ color: colors.primary }}>{title}</h3>
      <p style={{ color: colors.textSecondary }}>{children}</p>
    </div>
  );
}

// App usage
function App() {
  return (
    <ThemeProvider>
      <div>
        <ThemeToggle />
        <ThemedCard title="Welcome">
          This card adapts to the current theme automatically.
        </ThemedCard>
      </div>
    </ThemeProvider>
  );
}`,
      explanation:
        "This is a production-quality theme context implementation. Key patterns: (1) Lazy initialization from localStorage with system preference fallback. (2) The custom useTheme hook throws a helpful error if used outside a provider — a critical pattern for debugging. (3) The context value is memoized with useMemo to prevent unnecessary consumer re-renders when the ThemeProvider's parent re-renders. (4) toggleTheme and setTheme are stabilized with useCallback. (5) System preference changes are detected via matchMedia listener. This example shows how context providers should be structured in real applications and is a common interview discussion topic.",
      order_index: 2,
    },
    {
      title: "useReducer + useContext: Global Notification System",
      description:
        "Combines useReducer and useContext with context splitting to build a scalable notification/toast system, demonstrating the full pattern with separate state and dispatch contexts.",
      language: "javascript",
      code: `import {
  createContext, useContext, useReducer,
  useCallback, useEffect, useRef, memo
} from 'react';

// --- Action Types ---
const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  DISMISS_NOTIFICATION: 'DISMISS_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL',
};

// --- Reducer ---
let nextId = 1;

function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: nextId++,
            type: action.payload.type || 'info', // 'success' | 'error' | 'warning' | 'info'
            message: action.payload.message,
            duration: action.payload.duration ?? 5000,
            createdAt: Date.now(),
          },
        ],
      };
    case ACTIONS.DISMISS_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case ACTIONS.CLEAR_ALL:
      return { ...state, notifications: [] };
    default:
      throw new Error(\\\`Unknown action: \\\${action.type}\\\`);
  }
}

// --- Split Contexts (performance optimization) ---
// Components that only dispatch (e.g., forms, buttons) won't re-render
// when notifications change — only the notification list re-renders.
const NotificationStateContext = createContext(null);
const NotificationDispatchContext = createContext(null);

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
  });

  return (
    <NotificationStateContext.Provider value={state}>
      <NotificationDispatchContext.Provider value={dispatch}>
        {children}
        <NotificationContainer />
      </NotificationDispatchContext.Provider>
    </NotificationStateContext.Provider>
  );
}

// --- Custom hooks ---
function useNotificationState() {
  const ctx = useContext(NotificationStateContext);
  if (!ctx) throw new Error('Must be within NotificationProvider');
  return ctx;
}

function useNotificationDispatch() {
  const ctx = useContext(NotificationDispatchContext);
  if (!ctx) throw new Error('Must be within NotificationProvider');
  return ctx;
}

// Public API hook — wraps dispatch in convenient functions
export function useNotifications() {
  const dispatch = useNotificationDispatch();

  const notify = useCallback((message, options = {}) => {
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: { message, ...options },
    });
  }, [dispatch]);

  const success = useCallback(
    (message) => notify(message, { type: 'success' }),
    [notify]
  );
  const error = useCallback(
    (message) => notify(message, { type: 'error', duration: 8000 }),
    [notify]
  );
  const warning = useCallback(
    (message) => notify(message, { type: 'warning' }),
    [notify]
  );

  const dismiss = useCallback((id) => {
    dispatch({ type: ACTIONS.DISMISS_NOTIFICATION, payload: id });
  }, [dispatch]);

  const clearAll = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, [dispatch]);

  return { notify, success, error, warning, dismiss, clearAll };
}

// --- UI Components ---
const typeStyles = {
  success: { bg: '#dcfce7', border: '#22c55e', icon: 'check' },
  error:   { bg: '#fee2e2', border: '#ef4444', icon: 'x' },
  warning: { bg: '#fef9c3', border: '#eab308', icon: 'warning' },
  info:    { bg: '#dbeafe', border: '#3b82f6', icon: 'info' },
};

const NotificationItem = memo(({ notification, onDismiss }) => {
  const timerRef = useRef();
  const style = typeStyles[notification.type] || typeStyles.info;

  // Auto-dismiss after duration
  useEffect(() => {
    if (notification.duration > 0) {
      timerRef.current = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [notification.id, notification.duration, onDismiss]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: style.bg,
        borderLeft: \\\`4px solid \\\${style.border}\\\`,
        borderRadius: 6,
        marginBottom: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <span style={{ fontSize: 18 }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{notification.message}</span>
      <button
        onClick={() => onDismiss(notification.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
      >
        close
      </button>
    </div>
  );
});

function NotificationContainer() {
  const { notifications } = useNotificationState();
  const { dismiss } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16,
      width: 360, zIndex: 9999,
    }}>
      {notifications.map(n => (
        <NotificationItem
          key={n.id}
          notification={n}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

// --- Usage Example ---
function OrderForm() {
  const { success, error } = useNotifications();
  // This component does NOT re-render when notifications change
  // because it only uses the dispatch context!

  const handleSubmit = async () => {
    try {
      await submitOrder();
      success('Order placed successfully!');
    } catch (err) {
      error('Failed to place order: ' + err.message);
    }
  };

  return <button onClick={handleSubmit}>Place Order</button>;
}`,
      explanation:
        "This example demonstrates the complete useReducer + useContext architecture pattern at production quality. Key design decisions: (1) Context splitting — NotificationStateContext and NotificationDispatchContext are separate, so components that only call dispatch (like OrderForm) don't re-render when notifications change. This is possible because React guarantees dispatch identity is stable. (2) The useNotifications hook provides a clean public API (success, error, warning) that hides the dispatch/action internals. (3) NotificationItem is memoized and handles its own auto-dismiss timer via useEffect + useRef. (4) The reducer handles all state transitions centrally, making the system predictable and testable. This pattern scales to any global state need — auth, modals, shopping carts — and is a strong interview talking point for 'how would you manage global state without Redux?'",
      order_index: 3,
    },
  ],
};

export default examples;
