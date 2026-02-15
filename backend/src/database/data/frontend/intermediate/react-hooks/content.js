// ============================================================================
// React Hooks Deep Dive — Content
// ============================================================================

export const topic = {
  "name": "React Hooks Deep Dive",
  "slug": "react-hooks",
  "description": "Master useState, useEffect, useRef, useMemo, useCallback, useReducer, and useContext with real-world patterns.",
  "estimated_time": 200,
  "order_index": 3
};

export const lessons = [
  {
    title: "useState & useEffect Mastery",
    slug: "usestate-useeffect",
    summary: "Master the two most essential hooks — state updates, batching, lazy initialization, effect cleanup, and dependency arrays.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "useState supports lazy initialization with a function for expensive computations",
  "State updates are batched — use functional updates (prev => ...) for sequential updates",
  "useEffect dependency array controls when the effect runs",
  "Always clean up subscriptions, timers, and listeners in the effect cleanup return",
  "An empty dependency array [] makes the effect run only on mount"
],
    content: `# useState & useEffect Mastery

## useState Advanced Patterns

### Functional Updates
\`\`\`jsx
const [count, setCount] = useState(0);

// ❌ May use stale state
setCount(count + 1);
setCount(count + 1); // Still only increments by 1!

// ✅ Functional update — always latest value
setCount(prev => prev + 1);
setCount(prev => prev + 1); // Correctly increments by 2
\`\`\`

### Lazy Initialization
\`\`\`jsx
// ❌ Runs JSON.parse on EVERY render
const [data, setData] = useState(JSON.parse(localStorage.getItem('data')));

// ✅ Function only called on first render
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('data');
  return saved ? JSON.parse(saved) : { items: [] };
});
\`\`\`

### Updating Objects & Arrays
\`\`\`jsx
const [user, setUser] = useState({ name: '', email: '', age: 0 });

// Always create new references — never mutate!
setUser(prev => ({ ...prev, name: 'Alice' }));

const [items, setItems] = useState([]);
setItems(prev => [...prev, newItem]);                    // Add
setItems(prev => prev.filter(i => i.id !== targetId));   // Remove
setItems(prev => prev.map(i => i.id === id ? { ...i, done: true } : i)); // Update
\`\`\`

## useEffect Patterns

### Basic Fetch
\`\`\`jsx
useEffect(() => {
  let cancelled = false;

  async function fetchUser() {
    const res = await fetch(\`/api/users/\${userId}\`);
    const data = await res.json();
    if (!cancelled) setUser(data);
  }

  fetchUser();

  return () => { cancelled = true; }; // Cleanup on unmount or re-run
}, [userId]);
\`\`\`

### Debounced Search
\`\`\`jsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchTerm) fetchResults(searchTerm);
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);
\`\`\`

### Window Event Listener
\`\`\`jsx
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
\`\`\`
`,
  },
  {
    title: "useRef, useMemo & useCallback",
    slug: "useref-usememo-usecallback",
    summary: "Understand ref persistence, memoization for expensive computations, and stable callback references.",
    difficulty_level: "intermediate",
    estimated_time: 30,
    order_index: 2,
    key_points: [
  "useRef persists values across renders without triggering re-renders",
  "useRef can reference DOM elements for imperative operations",
  "useMemo caches expensive computations based on dependencies",
  "useCallback returns a memoized function that only changes when dependencies change",
  "Overusing memo tools can hurt readability — profile before optimizing"
],
    content: `# useRef, useMemo & useCallback

## useRef — Persistent Mutable Container

\`\`\`jsx
// DOM access
function TextInput() {
  const inputRef = useRef(null);
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}

// Storing previous value
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current;
}
\`\`\`

## useMemo — Cache Expensive Computations

\`\`\`jsx
function FilteredList({ items, filter }) {
  const filtered = useMemo(() => {
    console.log('Filtering...');
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);  // Only recomputes when items or filter change

  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
\`\`\`

## useCallback — Stable Function References

\`\`\`jsx
function Parent() {
  const [count, setCount] = useState(0);

  // Without useCallback: handleClick is recreated every render
  // causing Child to re-render even with React.memo
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // Stable — no dependencies

  return <MemoizedChild onClick={handleClick} />;
}

const MemoizedChild = React.memo(function Child({ onClick }) {
  console.log('Child rendered');
  return <button onClick={onClick}>Click me</button>;
});
\`\`\`

## When NOT to Memoize
- Simple computations (basic math, string operations)
- If the component doesn't re-render often
- If the memoized value/function doesn't get passed to children

> **Rule of thumb:** Profile first, optimize second.
`,
  },
  {
    title: "useReducer & useContext",
    slug: "usereducer-usecontext",
    summary: "Manage complex state with useReducer and share data across the component tree with useContext.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 3,
    key_points: [
  "useReducer is ideal for state with multiple sub-values or complex transitions",
  "Reducers must be pure — no side effects, no mutations",
  "useContext reads the nearest Provider value up the tree",
  "Combining useReducer + useContext creates a lightweight state management solution",
  "Split contexts to prevent unnecessary re-renders"
],
    content: `# useReducer & useContext

## useReducer — Complex State Logic

When state transitions are complex, a reducer makes logic explicit and testable:

\`\`\`jsx
const initialState = { items: [], loading: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    default:
      throw new Error(\`Unknown action: \${action.type}\`);
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => dispatch({ type: 'FETCH_SUCCESS', payload: data }))
      .catch(err => dispatch({ type: 'FETCH_ERROR', payload: err.message }));
  }, []);

  return (
    <div>
      {state.loading && <p>Loading...</p>}
      {state.error && <p className="error">{state.error}</p>}
      {state.items.map(item => <TodoItem key={item.id} item={item} dispatch={dispatch} />)}
    </div>
  );
}
\`\`\`

## useContext — Cross-Component Data Sharing

\`\`\`jsx
const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Header />
      <Main />
    </ThemeContext.Provider>
  );
}

function Header() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme}</button>;
}
\`\`\`

## Pattern: useReducer + useContext

\`\`\`jsx
const TodoContext = createContext();

function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <TodoContext.Provider value={{ state, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
}

function useTodos() {
  const context = useContext(TodoContext);
  if (!context) throw new Error('useTodos must be used within TodoProvider');
  return context;
}
\`\`\`
`,
  },
];
