import pool from '../config/database.js';

async function seedAdvancedReact() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Advanced React Patterns lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'advanced-react'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Advanced React Patterns', 'advanced-react-patterns', $2, 'Master Higher-Order Components, Render Props, and Compound Components', 'advanced', 60, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Advanced React Patterns

## Introduction

Advanced React patterns help you write more reusable, maintainable, and scalable components. These patterns solve common problems in large-scale React applications.

## 1. Higher-Order Components (HOC)

A **Higher-Order Component** is a function that takes a component and returns a new enhanced component.

### Basic HOC Example

\\\`\\\`\\\`javascript
// HOC that adds logging functionality
function withLogging(WrappedComponent) {
  return function EnhancedComponent(props) {
    useEffect(() => {
      console.log('Component mounted:', WrappedComponent.name);
      return () => console.log('Component unmounted:', WrappedComponent.name);
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// Usage
function UserProfile({ name }) {
  return <div>Hello, {name}</div>;
}

const UserProfileWithLogging = withLogging(UserProfile);
\\\`\\\`\\\`

### Authentication HOC

\\\`\\\`\\\`javascript
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();

    if (loading) {
      return <LoadingSpinner />;
    }

    if (!user) {
      return <Navigate to="/login" />;
    }

    return <WrappedComponent {...props} user={user} />;
  };
}

// Usage
function Dashboard({ user }) {
  return <div>Welcome, {user.name}</div>;
}

const ProtectedDashboard = withAuth(Dashboard);
\\\`\\\`\\\`

### Data Fetching HOC

\\\`\\\`\\\`javascript
function withData(url) {
  return function (WrappedComponent) {
    return function DataComponent(props) {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      useEffect(() => {
        fetch(url)
          .then(res => res.json())
          .then(data => {
            setData(data);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message);
            setLoading(false);
          });
      }, []);

      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error}</div>;

      return <WrappedComponent {...props} data={data} />;
    };
  };
}

// Usage
function UserList({ data }) {
  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

const UserListWithData = withData('/api/users')(UserList);
\\\`\\\`\\\`

## 2. Render Props Pattern

Pass a function as a prop that returns React elements.

### Basic Render Props

\\\`\\\`\\\`javascript
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    setPosition({
      x: event.clientX,
      y: event.clientY
    });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return render(position);
}

// Usage
function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <div>
          Mouse position: {x}, {y}
        </div>
      )}
    />
  );
}
\\\`\\\`\\\`

### Data Provider with Render Props

\\\`\\\`\\\`javascript
function DataProvider({ url, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return children({ data, loading, error });
}

// Usage
function App() {
  return (
    <DataProvider url="/api/users">
      {({ data, loading, error }) => {
        if (loading) return <div>Loading...</div>;
        if (error) return <div>Error: {error}</div>;
        return (
          <ul>
            {data.map(user => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
        );
      }}
    </DataProvider>
  );
}
\\\`\\\`\\\`

## 3. Compound Components Pattern

Components that work together to form a complete UI.

### Classic Example: Tabs

\\\`\\\`\\\`javascript
// Context for sharing state between compound components
const TabsContext = createContext();

function Tabs({ children, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      className={\\\`tab \\\${isActive ? 'active' : ''}\\\`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabPanels({ children }) {
  return <div className="tab-panels">{children}</div>;
}

function TabPanel({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;

  return <div className="tab-panel">{children}</div>;
}

// Attach compound components
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

// Usage - Clean and intuitive!
function App() {
  return (
    <Tabs defaultValue="profile">
      <Tabs.List>
        <Tabs.Tab value="profile">Profile</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panels>
        <Tabs.Panel value="profile">
          <h2>Profile Content</h2>
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <h2>Settings Content</h2>
        </Tabs.Panel>
        <Tabs.Panel value="notifications">
          <h2>Notifications Content</h2>
        </Tabs.Panel>
      </Tabs.Panels>
    </Tabs>
  );
}
\\\`\\\`\\\`

## 4. Custom Hooks Pattern

Extract component logic into reusable hooks.

### useToggle Hook

\\\`\\\`\\\`javascript
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, { toggle, setTrue, setFalse }];
}

// Usage
function Modal() {
  const [isOpen, { toggle, setTrue, setFalse }] = useToggle(false);

  return (
    <>
      <button onClick={setTrue}>Open Modal</button>
      {isOpen && (
        <div className="modal">
          <h2>Modal Content</h2>
          <button onClick={setFalse}>Close</button>
        </div>
      )}
    </>
  );
}
\\\`\\\`\\\`

### useFetch Hook

\\\`\\\`\\\`javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserList() {
  const { data, loading, error } = useFetch('/api/users');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
\\\`\\\`\\\`

## 5. Control Props Pattern

Give users control over component state.

\\\`\\\`\\\`javascript
function Counter({ value, onChange, defaultValue = 0 }) {
  // Controlled if value is provided, uncontrolled otherwise
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleIncrement = () => {
    const newValue = currentValue + 1;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = currentValue - 1;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  };

  return (
    <div>
      <button onClick={handleDecrement}>-</button>
      <span>{currentValue}</span>
      <button onClick={handleIncrement}>+</button>
    </div>
  );
}

// Uncontrolled usage
function App1() {
  return <Counter defaultValue={5} />;
}

// Controlled usage
function App2() {
  const [count, setCount] = useState(0);
  
  return (
    <>
      <Counter value={count} onChange={setCount} />
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  );
}
\\\`\\\`\\\`

## 6. State Reducer Pattern

Give users control over state updates.

\\\`\\\`\\\`javascript
function useCounter({ initial = 0, reducer }) {
  const [count, setCount] = useState(initial);

  const defaultReducer = (state, action) => {
    switch (action.type) {
      case 'increment':
        return state + 1;
      case 'decrement':
        return state - 1;
      case 'reset':
        return initial;
      default:
        return state;
    }
  };

  const actualReducer = reducer || defaultReducer;

  const dispatch = (action) => {
    setCount(currentCount => actualReducer(currentCount, action));
  };

  return [count, dispatch];
}

// Usage with custom reducer
function App() {
  const customReducer = (state, action) => {
    switch (action.type) {
      case 'increment':
        // Only increment if less than 10
        return state < 10 ? state + 1 : state;
      case 'decrement':
        // Only decrement if greater than 0
        return state > 0 ? state - 1 : state;
      default:
        return state;
    }
  };

  const [count, dispatch] = useCounter({ 
    initial: 0, 
    reducer: customReducer 
  });

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}
\\\`\\\`\\\`

## Pattern Comparison

| Pattern | Use Case | Pros | Cons |
|---------|----------|------|------|
| HOC | Cross-cutting concerns | Reusable, composition | Props collision, wrapper hell |
| Render Props | Dynamic rendering | Flexible, explicit | Nesting, verbose |
| Compound Components | Related components | Clean API, flexible | Shared context needed |
| Custom Hooks | Logic reuse | Simple, composable | React-specific |
| Control Props | User control | Flexible usage | More complex |

## Best Practices

1. **Choose the right pattern**: Not every problem needs an advanced pattern
2. **Composition over HOCs**: Prefer hooks and composition in modern React
3. **Keep it simple**: Don't over-engineer
4. **Document patterns**: Make usage clear for team members
5. **TypeScript**: Add types for better developer experience

## When to Use What

- **Custom Hooks**: Default choice for logic reuse
- **Compound Components**: Building design systems, UI libraries
- **Render Props**: When hooks don't fit (rare in modern React)
- **HOC**: Legacy code, authentication/authorization wrappers
- **Control Props**: Building library components

## Modern React Approach

With hooks, many patterns are simplified:

\\\`\\\`\\\`javascript
// Old: HOC for data fetching
const UserListWithData = withData('/api/users')(UserList);

// New: Custom hook
function UserList() {
  const { data, loading } = useFetch('/api/users');
  // ...
}
\\\`\\\`\\\`

Custom hooks are now the preferred way to share logic between components!`,
      [
        'HOCs enhance components with additional functionality',
        'Compound components work together using shared context',
        'Custom hooks are the modern way to share logic',
        'Choose patterns based on specific use cases'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Custom Hook - useLocalStorage', 'Sync state with localStorage', 'javascript', $2, 'Reusable hook that persists state to localStorage', 1),
      ($1, 'Compound Component - Dropdown', 'Flexible dropdown component', 'javascript', $3, 'Shows compound component pattern for building UI libraries', 2)
    `, [
      lesson.rows[0].id,
      `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // Get from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Usage
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={\\\`app \\\${theme}\\\`}>
      <button onClick={toggleTheme}>
        Current theme: {theme}
      </button>
    </div>
  );
}

export default ThemeToggle;`,
      `import { createContext, useContext, useState } from 'react';

const DropdownContext = createContext();

function Dropdown({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close }}>
      <div className="dropdown">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function DropdownTrigger({ children }) {
  const { toggle } = useContext(DropdownContext);
  
  return (
    <button onClick={toggle} className="dropdown-trigger">
      {children}
    </button>
  );
}

function DropdownMenu({ children }) {
  const { isOpen, close } = useContext(DropdownContext);
  
  if (!isOpen) return null;

  return (
    <div className="dropdown-menu" onClick={close}>
      {children}
    </div>
  );
}

function DropdownItem({ children, onClick }) {
  return (
    <div className="dropdown-item" onClick={onClick}>
      {children}
    </div>
  );
}

// Attach compound components
Dropdown.Trigger = DropdownTrigger;
Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;

// Usage
function App() {
  return (
    <Dropdown>
      <Dropdown.Trigger>
        Open Menu
      </Dropdown.Trigger>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => console.log('Edit')}>
          Edit
        </Dropdown.Item>
        <Dropdown.Item onClick={() => console.log('Delete')}>
          Delete
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default Dropdown;`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is a Higher-Order Component (HOC)?', 'multiple_choice', $2, 'A function that takes a component and returns a new enhanced component', 'A Higher-Order Component is a function that takes a component as an argument and returns a new component with additional functionality or props.', 'medium', 15, 1),
      ($1, 'Which pattern is now preferred over HOCs in modern React?', 'multiple_choice', $3, 'Custom Hooks', 'Custom Hooks are the modern approach to sharing logic between components. They are simpler, more composable, and avoid issues like props collision and wrapper hell.', 'easy', 10, 2)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['A component that returns a function', 'A function that takes a component and returns a new enhanced component', 'A component with multiple children', 'A function that returns JSX']),
      JSON.stringify(['HOCs', 'Render Props', 'Custom Hooks', 'Context API'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Advanced React Patterns lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedAdvancedReact()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
