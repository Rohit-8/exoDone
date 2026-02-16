export const topic = {
  name: "React Hooks Deep Dive",
  slug: "react-hooks",
  description:
    "Master useState, useEffect, useRef, useMemo, useCallback, useReducer, and useContext with real-world patterns.",
  estimated_time: 200,
  order_index: 3,
};

export const lessons = [
  {
    title: "useState & useEffect Mastery",
    slug: "usestate-useeffect",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
      "useState functional updates and lazy initialization",
      "React 18 automatic batching behavior",
      "Managing object and array state immutably",
      "Avoiding stale closures in state updates",
      "useEffect dependency array rules and cleanup functions",
      "Handling race conditions in async effects",
      "Strict Mode double-fire behavior and why it exists",
      "When NOT to use useEffect — the over-use anti-pattern",
    ],
    content: `
# useState & useEffect Mastery

These two hooks form the backbone of every React application. Understanding their nuances separates a junior developer from a senior one. In interviews, you'll be asked not just *how* they work, but *why* they work the way they do and what pitfalls to avoid.

---

## useState — Beyond the Basics

### Basic Usage Recap

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

\`useState\` returns a tuple: the current state value and a setter function. On each render, React returns the *latest* state value for that component instance.

### Functional Updates

When the next state depends on the previous state, **always use the functional form**:

\`\`\`javascript
//  Dangerous — uses stale closure value
setCount(count + 1);
setCount(count + 1); // Still uses the same "count" — only increments by 1

//  Correct — uses latest state
setCount(prev => prev + 1);
setCount(prev => prev + 1); // Increments by 2 as expected
\`\`\`

**Why?** React batches state updates. When you reference \`count\` directly, the value is captured from the closure at render time. In a batched update, both calls see the same value. The functional form receives the *pending* state, so updates chain correctly.

**Interview tip:** This is one of the most commonly asked React questions. Explain that React enqueues state updates and processes them in order, passing each updater the result of the previous one.

### Lazy Initialization

If computing the initial state is expensive, pass a **function** instead of a value:

\`\`\`javascript
//  Runs on EVERY render (the function call), even though useState ignores it after mount
const [data, setData] = useState(expensiveComputation());

//  Only runs on the FIRST render
const [data, setData] = useState(() => expensiveComputation());
\`\`\`

Common real-world use cases: reading from \`localStorage\`, parsing a large JSON string, computing derived initial values from props.

\`\`\`javascript
const [preferences, setPreferences] = useState(() => {
  const saved = localStorage.getItem('user-prefs');
  return saved ? JSON.parse(saved) : { theme: 'light', fontSize: 14 };
});
\`\`\`

### React 18 Automatic Batching

Before React 18, batching only happened inside React event handlers. In React 18, **all updates are batched by default**, even inside promises, timeouts, and native event handlers:

\`\`\`javascript
// React 18 — these are batched into ONE re-render
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // Only one re-render happens here
}, 1000);
\`\`\`

If you ever need to force a synchronous re-render (rare), use \`flushSync\`:

\`\`\`javascript
import { flushSync } from 'react-dom';

flushSync(() => {
  setCount(c => c + 1);
});
// DOM is updated here
\`\`\`

### Object and Array State

React uses **Object.is** for state comparison. Setting state to the same reference won't trigger a re-render. You must create new references:

\`\`\`javascript
//  Mutating state directly — no re-render
const handleUpdate = () => {
  user.name = 'Alice';
  setUser(user); // Same reference — React skips re-render
};

//  Spread to create new object
const handleUpdate = () => {
  setUser(prev => ({ ...prev, name: 'Alice' }));
};
\`\`\`

For arrays, use immutable methods:

\`\`\`javascript
// Adding
setItems(prev => [...prev, newItem]);

// Removing
setItems(prev => prev.filter(item => item.id !== targetId));

// Updating
setItems(prev => prev.map(item =>
  item.id === targetId ? { ...item, completed: true } : item
));
\`\`\`

### Common Pitfall: Stale Closures

\`\`\`javascript
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      //  count is captured from the first render — always 0
      console.log(count);
      setCount(count + 1); // Always sets to 1
    }, 1000);
    return () => clearInterval(id);
  }, []); // Empty deps — effect never re-runs

  return <span>{count}</span>;
}
\`\`\`

**Fix options:**
1. Use a functional update: \`setCount(prev => prev + 1)\`
2. Add \`count\` to the dependency array (but then the interval resets each second)
3. Use \`useRef\` to hold the latest value

---

## useEffect — The Synchronization Tool

### Mental Model

\`useEffect\` is not a lifecycle method. It's a **synchronization mechanism**. It synchronizes a side effect with some reactive values (state or props).

Think of it as: "After rendering, if any of these values changed, run this effect."

### Dependency Array

\`\`\`javascript
useEffect(() => {
  // Runs after EVERY render
});

useEffect(() => {
  // Runs only on mount
}, []);

useEffect(() => {
  // Runs on mount AND when 'query' or 'page' change
}, [query, page]);
\`\`\`

**The exhaustive-deps ESLint rule is NOT optional.** Every reactive value used inside the effect must be in the dependency array. Ignoring this causes bugs that are extremely hard to debug.

### Cleanup Functions

The cleanup runs **before the effect re-runs** and **when the component unmounts**:

\`\`\`javascript
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (event) => setMessages(prev => [...prev, event.data]);

  return () => {
    ws.close(); // Cleanup: close connection
  };
}, [url]);
\`\`\`

Cleanup is essential for: event listeners, subscriptions, timers, WebSocket connections, and aborting fetch requests.

### Data Fetching and Race Conditions

A naive fetch in useEffect has a **race condition** — if the component re-renders before the fetch completes, you might set state from a stale response:

\`\`\`javascript
//  Race condition
useEffect(() => {
  fetch(\\\`/api/users/\\\${userId}\\\`)
    .then(res => res.json())
    .then(data => setUser(data)); // Might set data for a previous userId!
}, [userId]);

//  Using AbortController
useEffect(() => {
  const controller = new AbortController();

  fetch(\\\`/api/users/\\\${userId}\\\`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();
}, [userId]);

//  Using a boolean flag
useEffect(() => {
  let cancelled = false;

  async function fetchUser() {
    const res = await fetch(\\\`/api/users/\\\${userId}\\\`);
    const data = await res.json();
    if (!cancelled) setUser(data);
  }

  fetchUser();
  return () => { cancelled = true; };
}, [userId]);
\`\`\`

### Strict Mode Double-Fire

In development, React 18 Strict Mode intentionally **mounts, unmounts, and re-mounts** every component. This means your effect and cleanup run twice on the initial mount.

**Purpose:** Expose missing cleanup functions and impure effects. If your effect breaks when run twice, you have a bug. The fix is proper cleanup, not removing Strict Mode.

\`\`\`javascript
//  Breaks in Strict Mode — duplicate listener
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
}, []);

//  Works correctly — cleanup removes listener
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
\`\`\`

### When NOT to Use useEffect

The React docs call this "You Might Not Need an Effect." Common anti-patterns:

**1. Deriving state from props or other state:**
\`\`\`javascript
//  Unnecessary effect
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

//  Just compute it during render
const fullName = firstName + ' ' + lastName;
\`\`\`

**2. Resetting state when a prop changes:**
\`\`\`javascript
//  Effect for resetting
useEffect(() => {
  setComment('');
}, [postId]);

//  Use a key to remount
<CommentForm key={postId} />
\`\`\`

**3. Handling user events:**
\`\`\`javascript
//  Effect tracking a "submitted" state
useEffect(() => {
  if (submitted) sendAnalytics();
}, [submitted]);

//  Handle it in the event handler
function handleSubmit() {
  sendAnalytics();
  setSubmitted(true);
}
\`\`\`

**Summary:** Use useEffect only for **synchronization with external systems** (network, DOM APIs, third-party libraries, timers). If the logic responds to a user event, put it in the event handler.
    `,
  },
  {
    title: "useRef, useMemo & useCallback",
    slug: "useref-usememo-usecallback",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 2,
    key_points: [
      "useRef for DOM access and mutable instance variables",
      "The previous value pattern with useRef",
      "Ref callbacks for dynamic DOM measurement",
      "useMemo for expensive computations and referential equality",
      "When useMemo is NOT worth it",
      "useCallback for stabilizing function references",
      "How useCallback works with React.memo",
      "Dependency array best practices across all hooks",
    ],
    content: `
# useRef, useMemo & useCallback

These three hooks solve different problems but share a common theme: **controlling when things change** across renders. Understanding them deeply is critical for writing performant React code and answering optimization interview questions.

---

## useRef — The Escape Hatch

### What useRef Actually Is

\`useRef\` returns a mutable object with a \`.current\` property that persists across renders. Importantly, **mutating \`.current\` does NOT trigger a re-render**.

\`\`\`javascript
const ref = useRef(initialValue);
// ref.current === initialValue on first render
// ref.current persists across renders
// Changing ref.current does NOT cause re-render
\`\`\`

### DOM Refs

The most common use case — accessing DOM elements directly:

\`\`\`javascript
function AutoFocusInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus(); // Imperatively focus the input
  }, []);

  return <input ref={inputRef} placeholder="I auto-focus!" />;
}
\`\`\`

You can also use refs to measure elements, scroll to specific positions, or integrate with third-party DOM libraries (e.g., D3, canvas).

### Mutable Instance Variables

useRef is perfect for storing values that need to persist across renders but shouldn't trigger re-renders when they change:

\`\`\`javascript
function StopWatch() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stop = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, []);

  return (
    <div>
      <span>{elapsed}s</span>
      <button onClick={isRunning ? stop : start}>
        {isRunning ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
\`\`\`

### The Previous Value Pattern

A classic interview question — tracking the previous value of a prop or state:

\`\`\`javascript
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current; // Returns the value from the PREVIOUS render
}

// Usage
function PriceDisplay({ price }) {
  const prevPrice = usePrevious(price);

  return (
    <div>
      <span>Current: \${price}</span>
      {prevPrice !== undefined && (
        <span style={{ color: price > prevPrice ? 'green' : 'red' }}>
          {price > prevPrice ? '' : ''}
        </span>
      )}
    </div>
  );
}
\`\`\`

**Why this works:** useEffect runs *after* render. So during the current render, \`ref.current\` still holds the old value. After the render commits, the effect updates it to the new value — ready for the next render.

### Ref Callbacks

When you need to respond to a ref being attached or detached, use a **callback ref** instead of a ref object:

\`\`\`javascript
function MeasuredBox() {
  const [height, setHeight] = useState(0);

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);

  return (
    <div>
      <div ref={measuredRef}>Content with dynamic height</div>
      <p>Height: {height}px</p>
    </div>
  );
}
\`\`\`

This is useful when you need to measure a DOM node that may conditionally render.

---

## useMemo — Memoizing Expensive Computations

### Basic Usage

\`useMemo\` caches a computed value and only recalculates it when dependencies change:

\`\`\`javascript
const filteredItems = useMemo(() => {
  return items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [items, searchTerm]);
\`\`\`

### When to Use useMemo

**1. Genuinely expensive computations:**
\`\`\`javascript
const sortedData = useMemo(() => {
  // Sorting 10,000+ items on every render is wasteful
  return [...largeDataset].sort((a, b) => a.score - b.score);
}, [largeDataset]);
\`\`\`

**2. Maintaining referential equality for downstream memoization:**
\`\`\`javascript
const chartConfig = useMemo(() => ({
  labels: data.map(d => d.label),
  values: data.map(d => d.value),
  color: theme === 'dark' ? '#fff' : '#000',
}), [data, theme]);

// chartConfig is stable — won't break React.memo on ChartComponent
return <MemoizedChart config={chartConfig} />;
\`\`\`

### When NOT to Use useMemo

useMemo itself has a cost — it stores extra values in memory and runs comparison logic on every render. **Do not use it for trivial computations:**

\`\`\`javascript
//  Premature optimization — string concatenation is cheap
const displayName = useMemo(() => first + ' ' + last, [first, last]);

//  Just compute it
const displayName = first + ' ' + last;
\`\`\`

**Rule of thumb:** Profile first. If filtering/sorting/computing takes less than 1ms, useMemo likely adds more overhead than it saves.

### Important Caveat

React does **not guarantee** that memoized values will be preserved. The docs say React may choose to discard cached values (e.g., for offscreen components). Your code must work correctly even without useMemo — it's a performance optimization, not a semantic guarantee.

---

## useCallback — Stabilizing Function References

### The Problem useCallback Solves

In JavaScript, \`() => {}\` creates a new function object every render. This means child components receiving that function as a prop will re-render even if nothing actually changed:

\`\`\`javascript
function Parent() {
  //  New function reference every render
  const handleClick = () => { /* ... */ };

  return <ExpensiveChild onClick={handleClick} />;
}
\`\`\`

### Basic Usage

\`\`\`javascript
const handleClick = useCallback(() => {
  setCount(prev => prev + 1);
}, []); // No dependencies — function never changes
\`\`\`

\`useCallback(fn, deps)\` is equivalent to \`useMemo(() => fn, deps)\`. It memoizes the *function itself*, not its return value.

### useCallback + React.memo

useCallback is only useful when paired with a memoized child component:

\`\`\`javascript
const ExpensiveChild = React.memo(({ onClick, data }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState('Click me');

  const handleClick = useCallback(() => {
    console.log('Clicked!');
  }, []);

  const data = useMemo(() => ({ label }), [label]);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {/* ExpensiveChild does NOT re-render when count changes */}
      <ExpensiveChild onClick={handleClick} data={data} />
    </div>
  );
}
\`\`\`

**Without React.memo on the child**, useCallback is pointless. The child re-renders because its parent re-rendered, regardless of prop stability.

### Dependency Array Patterns

\`\`\`javascript
// No dependencies — the callback never changes
const reset = useCallback(() => setCount(0), []);

// Depends on external value — recreated when userId changes
const fetchUser = useCallback(() => {
  return fetch(\\\`/api/users/\\\${userId}\\\`);
}, [userId]);

// Common mistake: missing dependency
const handleSubmit = useCallback(() => {
  submitForm(formData); //  If formData isn't in deps, you get stale data
}, []); // ESLint will warn about this
\`\`\`

### useCallback in Custom Hooks

When you return functions from custom hooks, **always stabilize them with useCallback**. Consumers of your hook may pass those functions as props to memoized components:

\`\`\`javascript
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}
\`\`\`

---

## Key Interview Takeaways

| Hook | Purpose | Triggers re-render? |
|------|---------|---------------------|
| useRef | Persist mutable values across renders | No |
| useMemo | Cache expensive computed values | No (returns cached value) |
| useCallback | Cache function references | No (returns cached function) |

- **useRef** is for values that change but shouldn't cause re-renders
- **useMemo** is for values that are expensive to compute
- **useCallback** is for functions passed to memoized children
- All three are **optimizations** — your app should work correctly without them
- Profile before optimizing — premature memoization adds complexity without benefit
    `,
  },
  {
    title: "useReducer & useContext",
    slug: "usereducer-usecontext",
    difficulty_level: "intermediate",
    estimated_time: 30,
    order_index: 3,
    key_points: [
      "useReducer vs useState — when to choose each",
      "The action/reducer pattern from Redux adapted for React",
      "Managing complex, interdependent state with useReducer",
      "Creating and consuming context with useContext",
      "Provider component patterns and nesting",
      "Context performance pitfalls and re-render traps",
      "Context splitting to minimize unnecessary re-renders",
      "Combining useReducer + useContext for app-level state management",
    ],
    content: `
# useReducer & useContext

These two hooks are React's built-in state management story. Together, they can replace Redux for many applications. Understanding them deeply is essential for system design interviews and real-world architecture decisions.

---

## useReducer — Structured State Updates

### Basic Signature

\`\`\`javascript
const [state, dispatch] = useReducer(reducer, initialState);
\`\`\`

The reducer function takes the current state and an action, and returns the new state:

\`\`\`javascript
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'RESET':
      return { ...state, count: 0 };
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

// Usage
const [state, dispatch] = useReducer(reducer, { count: 0 });

dispatch({ type: 'INCREMENT' });
dispatch({ type: 'RESET' });
\`\`\`

### useReducer vs useState — Decision Framework

Choose **useState** when:
- State is a single primitive (boolean, number, string)
- State transitions are simple (toggle, increment, set to X)
- There are 1-3 related state variables

Choose **useReducer** when:
- State is an object with multiple sub-values
- The next state depends on the previous state in complex ways
- Multiple actions can affect the same state
- You want to centralize state transition logic for testability
- State updates have validation or business rules

\`\`\`javascript
// useState is fine here
const [isOpen, setIsOpen] = useState(false);

// useReducer shines here
const initialState = {
  status: 'idle',    // 'idle' | 'loading' | 'success' | 'error'
  data: null,
  error: null,
};

function fetchReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS':
      return { ...state, status: 'success', data: action.payload };
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.payload };
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}
\`\`\`

### Complex State Logic Example

\`\`\`javascript
const initialFormState = {
  values: { email: '', password: '', name: '' },
  errors: {},
  touched: {},
  isSubmitting: false,
};

function formReducer(state, action) {
  switch (action.type) {
    case 'FIELD_CHANGE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      };
    case 'FIELD_BLUR':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_SUCCESS':
      return { ...initialFormState };
    case 'SUBMIT_FAILURE':
      return { ...state, isSubmitting: false, errors: action.errors };
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}
\`\`\`

### Lazy Initialization

Like useState, useReducer supports an optional third argument for lazy initialization:

\`\`\`javascript
function init(initialCount) {
  return { count: initialCount };
}

const [state, dispatch] = useReducer(reducer, initialCount, init);
\`\`\`

This is useful when the initial state requires computation. The \`init\` function also enables easy reset: \`dispatch({ type: 'RESET', payload: initialCount })\`.

### Testing Reducers

A key advantage of reducers — they're pure functions that are trivially testable:

\`\`\`javascript
// reducer.test.js
test('FETCH_SUCCESS sets data and status', () => {
  const state = { status: 'loading', data: null, error: null };
  const action = { type: 'FETCH_SUCCESS', payload: { users: [] } };
  const result = fetchReducer(state, action);
  expect(result).toEqual({
    status: 'success',
    data: { users: [] },
    error: null,
  });
});
\`\`\`

---

## useContext — Sharing State Without Prop Drilling

### The Prop Drilling Problem

Without context, you'd pass data through every intermediate component:

\`\`\`
App  Layout  Sidebar  UserMenu  Avatar
                                      
                            needs user data from App
\`\`\`

### Creating and Consuming Context

\`\`\`javascript
// 1. Create context with a default value
const ThemeContext = createContext('light');

// 2. Provide a value at a higher level
function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <Main />
    </ThemeContext.Provider>
  );
}

// 3. Consume with useContext — at ANY depth
function ThemedButton() {
  const theme = useContext(ThemeContext);
  return (
    <button className={theme === 'dark' ? 'btn-dark' : 'btn-light'}>
      Current theme: {theme}
    </button>
  );
}
\`\`\`

### Provider Component Pattern

Encapsulate context logic in a dedicated provider component:

\`\`\`javascript
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus().then(user => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const login = async (credentials) => {
    const user = await loginAPI(credentials);
    setUser(user);
  };

  const logout = async () => {
    await logoutAPI();
    setUser(null);
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
\`\`\`

### Performance Pitfall: Re-rendering All Consumers

**Every component that calls \`useContext(SomeContext)\` re-renders whenever the context value changes.** This is the biggest gotcha with context.

\`\`\`javascript
//  Problematic — new object every render triggers ALL consumers
function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  return (
    <AppContext.Provider value={{ user, theme, setUser, setTheme }}>
      <Main />
    </AppContext.Provider>
  );
}
// When user changes, components that only use theme ALSO re-render!
\`\`\`

### Context Splitting

Split unrelated state into separate contexts to minimize re-renders:

\`\`\`javascript
//  Split contexts — theme changes don't affect user consumers
const UserContext = createContext(null);
const ThemeContext = createContext('light');

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Main />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
\`\`\`

Another technique — split **state** and **dispatch** into separate contexts:

\`\`\`javascript
const TodoStateContext = createContext(null);
const TodoDispatchContext = createContext(null);

function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  return (
    <TodoStateContext.Provider value={state}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
}
\`\`\`

This way, components that only dispatch actions (and don't read state) won't re-render when state changes. \`dispatch\` is stable — React guarantees its identity doesn't change.

### Memoizing Context Values

If the provider's parent re-renders frequently, memoize the context value:

\`\`\`javascript
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  //  Memoize to prevent unnecessary consumer re-renders
  const value = useMemo(() => ({ user, setUser }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
\`\`\`

---

## Combining useReducer + useContext

This pattern creates a lightweight, scalable state management solution:

\`\`\`javascript
// store/CartContext.js
import { createContext, useContext, useReducer, useMemo } from 'react';

const CartStateContext = createContext();
const CartDispatchContext = createContext();

const initialState = { items: [], totalPrice: 0 };

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      let newItems;
      if (existing) {
        newItems = state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      return {
        items: newItems,
        totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(i => i.id !== action.payload);
      return {
        items: newItems,
        totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    }
    case 'CLEAR_CART':
      return initialState;
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartStateContext.Provider value={state}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCartState() {
  const context = useContext(CartStateContext);
  if (!context) throw new Error('useCartState must be within CartProvider');
  return context;
}

export function useCartDispatch() {
  const context = useContext(CartDispatchContext);
  if (!context) throw new Error('useCartDispatch must be within CartProvider');
  return context;
}
\`\`\`

### When to Reach for External State Management

useReducer + useContext has limits. Consider Redux, Zustand, or Jotai when you need:

- **Middleware** (logging, async thunks, undo/redo)
- **DevTools** with time-travel debugging
- **Performance** at scale — context re-renders all consumers; libraries like Zustand use subscriptions for granular updates
- **Persistence** or serialization of state
- **Complex async flows** (sagas, observables)

**Interview insight:** Saying "I'd start with useReducer + useContext and only add a library when I hit their limits" shows strong judgment and pragmatism.
    `,
  },
];
