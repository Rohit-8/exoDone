import pool from '../config/database.js';

async function seedReactPerformance() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding React Performance lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'react-performance'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'React Performance Optimization', 'react-performance-optimization', $2, 'Learn techniques to make React apps blazing fast', 'intermediate', 50, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# React Performance Optimization

## Why Performance Matters

Slow React apps lead to:
- Poor user experience
- High bounce rates
- Lower conversion rates
- Bad mobile experience

## Understanding React Rendering

### How React Renders

1. **Trigger**: State or props change
2. **Render**: React calls component function
3. **Commit**: React updates DOM
4. **Browser Paint**: Browser displays changes

### When Components Re-render

A component re-renders when:
- Its state changes
- Its props change
- Its parent re-renders (by default!)
- Context value changes

## React.memo

Prevent re-renders when props haven't changed.

### Without React.memo

\\\`\\\`\\\`javascript
// Child re-renders every time parent re-renders
function ExpensiveComponent({ data }) {
  console.log('ExpensiveComponent rendered');
  
  // Expensive calculation
  const result = data.map(item => item * 2);
  
  return <div>{result.join(', ')}</div>;
}

function Parent() {
  const [count, setCount] = useState(0);
  const data = [1, 2, 3, 4, 5];
  
  return (
    <>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <ExpensiveComponent data={data} />
    </>
  );
}
// ExpensiveComponent re-renders even though data hasn't changed!
\\\`\\\`\\\`

### With React.memo

\\\`\\\`\\\`javascript
// Only re-renders if props actually change
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  console.log('ExpensiveComponent rendered');
  
  const result = data.map(item => item * 2);
  
  return <div>{result.join(', ')}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const data = [1, 2, 3, 4, 5]; // ⚠️ Creates new array on each render!
  
  return (
    <>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ExpensiveComponent data={data} />
    </>
  );
}
// Still re-renders because data array is recreated each time
\\\`\\\`\\\`

### Custom Comparison Function

\\\`\\\`\\\`javascript
const UserProfile = React.memo(
  function UserProfile({ user }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip render)
    return prevProps.user.id === nextProps.user.id;
  }
);
\\\`\\\`\\\`

## useMemo Hook

Memoize expensive calculations.

### Without useMemo

\\\`\\\`\\\`javascript
function TodoList({ todos, filter }) {
  const [theme, setTheme] = useState('light');
  
  // Recalculates on every render (even when theme changes!)
  const filteredTodos = todos.filter(todo => {
    console.log('Filtering...');
    return todo.category === filter;
  });
  
  return (
    <>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      {filteredTodos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </>
  );
}
\\\`\\\`\\\`

### With useMemo

\\\`\\\`\\\`javascript
function TodoList({ todos, filter }) {
  const [theme, setTheme] = useState('light');
  
  // Only recalculates when todos or filter changes
  const filteredTodos = useMemo(() => {
    console.log('Filtering...');
    return todos.filter(todo => todo.category === filter);
  }, [todos, filter]);
  
  return (
    <>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      {filteredTodos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </>
  );
}
\\\`\\\`\\\`

### When to Use useMemo

✅ **Use it for:**
- Expensive calculations
- Creating objects/arrays passed to memoized children
- Preventing referential inequality

❌ **Don't use it for:**
- Simple calculations (overhead not worth it)
- Every calculation (premature optimization)

## useCallback Hook

Memoize function references.

### The Problem

\\\`\\\`\\\`javascript
const SearchBox = React.memo(({ onSearch }) => {
  console.log('SearchBox rendered');
  return <input onChange={(e) => onSearch(e.target.value)} />;
});

function App() {
  const [count, setCount] = useState(0);
  
  // New function created on every render!
  const handleSearch = (query) => {
    console.log('Searching:', query);
  };
  
  return (
    <>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <SearchBox onSearch={handleSearch} />
    </>
  );
}
// SearchBox re-renders because handleSearch is a new reference each time
\\\`\\\`\\\`

### The Solution

\\\`\\\`\\\`javascript
const SearchBox = React.memo(({ onSearch }) => {
  console.log('SearchBox rendered');
  return <input onChange={(e) => onSearch(e.target.value)} />;
});

function App() {
  const [count, setCount] = useState(0);
  
  // Same function reference across renders
  const handleSearch = useCallback((query) => {
    console.log('Searching:', query);
  }, []); // Empty deps = never changes
  
  return (
    <>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <SearchBox onSearch={handleSearch} />
    </>
  );
}
// SearchBox doesn't re-render when count changes!
\\\`\\\`\\\`

### useCallback with Dependencies

\\\`\\\`\\\`javascript
function ProductList({ category }) {
  const [discount, setDiscount] = useState(0);
  
  const applyDiscount = useCallback((price) => {
    return price * (1 - discount / 100);
  }, [discount]); // Recreated when discount changes
  
  return <Products onPriceCalculate={applyDiscount} />;
}
\\\`\\\`\\\`

## Code Splitting

Load code only when needed.

### React.lazy and Suspense

\\\`\\\`\\\`javascript
import { lazy, Suspense } from 'react';

// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Profile = lazy(() => import('./Profile'));

function App() {
  const [page, setPage] = useState('dashboard');
  
  return (
    <div>
      <nav>
        <button onClick={() => setPage('dashboard')}>Dashboard</button>
        <button onClick={() => setPage('settings')}>Settings</button>
        <button onClick={() => setPage('profile')}>Profile</button>
      </nav>
      
      <Suspense fallback={<div>Loading...</div>}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'settings' && <Settings />}
        {page === 'profile' && <Profile />}
      </Suspense>
    </div>
  );
}
\\\`\\\`\\\`

### Route-Based Code Splitting

\\\`\\\`\\\`javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
\\\`\\\`\\\`

## Virtualization

Render only visible items in long lists.

### React Window Example

\\\`\\\`\\\`javascript
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      Item {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// Renders 10,000 items efficiently!
<VirtualizedList items={arrayOf10000Items} />
\\\`\\\`\\\`

## Debouncing and Throttling

### Debounce: Wait for user to stop typing

\\\`\\\`\\\`javascript
function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    // Wait 500ms after user stops typing
    const timer = setTimeout(() => {
      if (query) {
        fetch(\\\`/api/search?q=\\\${query}\\\`)
          .then(res => res.json())
          .then(setResults);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  return (
    <>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <Results items={results} />
    </>
  );
}
\\\`\\\`\\\`

### Throttle: Limit execution frequency

\\\`\\\`\\\`javascript
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    let lastRun = 0;
    
    const handleScroll = () => {
      const now = Date.now();
      
      // Only update every 100ms
      if (now - lastRun >= 100) {
        setScrollY(window.scrollY);
        lastRun = now;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return <div>Scroll position: {scrollY}px</div>;
}
\\\`\\\`\\\`

## Key Optimization

Always use stable, unique keys.

### ❌ Bad: Using Index

\\\`\\\`\\\`javascript
{items.map((item, index) => (
  <TodoItem key={index} todo={item} />
))}
// Problem: Reordering causes unnecessary re-renders
\\\`\\\`\\\`

### ✅ Good: Using Unique ID

\\\`\\\`\\\`javascript
{items.map(item => (
  <TodoItem key={item.id} todo={item} />
))}
\\\`\\\`\\\`

## Production Build

Always use production build for deployment:

\\\`\\\`\\\`bash
npm run build
\\\`\\\`\\\`

Production builds:
- Minify code
- Remove PropTypes checks
- Remove development warnings
- Enable optimizations

## Performance Profiling

### React DevTools Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with your app
5. Stop recording
6. Analyze render times

### Chrome DevTools Performance

1. Open Chrome DevTools
2. Go to Performance tab
3. Click Record
4. Interact with your app
5. Stop recording
6. Analyze flamegraph

## Best Practices Summary

1. ✅ **Profile first**: Don't optimize prematurely
2. ✅ **React.memo**: For expensive components with stable props
3. ✅ **useMemo**: For expensive calculations
4. ✅ **useCallback**: For functions passed to memoized children
5. ✅ **Code splitting**: For large apps
6. ✅ **Virtualization**: For long lists (1000+ items)
7. ✅ **Debounce/Throttle**: For frequent events
8. ✅ **Production build**: Always for deployment
9. ❌ **Don't**: Memoize everything
10. ❌ **Don't**: Optimize before measuring

## Common Mistakes

1. **Over-memoization**: Adds overhead without benefit
2. **Missing dependencies**: Stale closures
3. **Creating new objects in render**: Breaks memoization
4. **Not using production build**: 2-3x slower
5. **Ignoring key prop**: Causes unnecessary re-renders

## Performance Checklist

- [ ] Use production build
- [ ] Code split routes
- [ ] Memoize expensive components
- [ ] Virtualize long lists
- [ ] Optimize images (lazy loading, WebP)
- [ ] Debounce search/autocomplete
- [ ] Use React DevTools Profiler
- [ ] Monitor bundle size
- [ ] Implement error boundaries
- [ ] Use CDN for static assets`,
      [
        'Use React.memo to prevent unnecessary re-renders',
        'useMemo for expensive calculations, useCallback for stable function references',
        'Code splitting with React.lazy reduces initial bundle size',
        'Always profile before optimizing - measure first'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Optimized List Component', 'Efficient list rendering with memoization', 'javascript', $2, 'Shows React.memo, useMemo, and useCallback working together', 1),
      ($1, 'Custom useDebounce Hook', 'Reusable debounce hook', 'javascript', $3, 'Prevents excessive API calls during user input', 2)
    `, [
      lesson.rows[0].id,
      `import { useState, useMemo, useCallback, memo } from 'react';

// Memoized list item component
const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete }) {
  console.log('Rendering:', todo.title);
  
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.title}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
});

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, title: 'Learn React', completed: false },
    { id: 2, title: 'Build project', completed: false },
    { id: 3, title: 'Deploy app', completed: false }
  ]);
  const [filter, setFilter] = useState('all');
  
  // Memoize filtered list
  const filteredTodos = useMemo(() => {
    console.log('Filtering todos...');
    
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);
  
  // Memoize callback functions
  const handleToggle = useCallback((id) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);
  
  const handleDelete = useCallback((id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  }, []);
  
  return (
    <div>
      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      
      <div className="todo-list">
        {filteredTodos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default TodoList;`,
      `import { useState, useEffect } from 'react';

function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up timer
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel timer if value changes before delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchBox() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true);
      
      fetch(\\\`/api/search?q=\\\${debouncedSearchTerm}\\\`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
          setLoading(false);
        });
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      
      {loading && <div>Searching...</div>}
      
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default SearchBox;`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What does React.memo do?', 'multiple_choice', $2, 'Prevents re-renders if props haven''t changed', 'React.memo is a higher-order component that memoizes a component, preventing re-renders when props are shallowly equal to previous props.', 'easy', 10, 1),
      ($1, 'When should you use useMemo?', 'multiple_choice', $3, 'For expensive calculations', 'useMemo should be used for expensive calculations or to maintain referential equality for objects/arrays passed to memoized children. Don''t use it for simple operations.', 'medium', 15, 2)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Prevents re-renders if props have not changed', 'Caches API responses', 'Stores component state', 'Manages side effects']),
      JSON.stringify(['For all calculations', 'For expensive calculations', 'For state updates', 'For API calls'])
    ]);

    await client.query('COMMIT');
    console.log('✅ React Performance lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedReactPerformance()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
