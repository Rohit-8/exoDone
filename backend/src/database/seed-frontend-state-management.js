import pool from '../config/database.js';

async function seedStateManagement() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding State Management lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'state-management'");
    
    if (topicsResult.rows.length === 0) {
      console.log('❌ Topic not found: state-management');
      await client.query('ROLLBACK');
      return;
    }
    
    const topicId = topicsResult.rows[0].id;

    const existingLesson = await client.query(
      "SELECT id FROM lessons WHERE topic_id = $1 AND slug = 'react-state-management'",
      [topicId]
    );

    if (existingLesson.rows.length > 0) {
      console.log('⚠️  Lesson already exists: react-state-management');
      await client.query('ROLLBACK');
      return;
    }

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'React State Management: Redux, Zustand & Context API', 'react-state-management', $2, 'Master state management in React with Redux Toolkit, Zustand, and Context API. Learn when to use each solution and implement scalable state patterns.', 'intermediate', 55, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# React State Management: Redux, Zustand & Context API

## Understanding State Management

**State management** is the practice of handling and organizing application state - the data that changes over time and affects what users see and do.

### Types of State

🔹 **Local State**: Component-specific (useState)
🔹 **Shared State**: Shared between components (props)
🔹 **Global State**: Available throughout the app (Redux, Context)
🔹 **Server State**: Data from APIs (React Query, SWR)
🔹 **URL State**: Data in the URL (React Router)

### When to Use Global State Management

✅ State shared across many components
✅ Complex state logic and updates
✅ Need for debugging tools and time-travel
✅ Consistent data flow patterns
✅ Large-scale applications

❌ Simple apps with minimal sharing
❌ Only passing props 2-3 levels down
❌ Mostly server-fetched data

## Context API

**Context API** provides a way to pass data through the component tree without prop drilling.

### Basic Context Setup

\\\`\\\`\\\`jsx
import { createContext, useContext, useState } from 'react';

// Create Context
const ThemeContext = createContext();

// Provider Component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
\\\`\\\`\\\`

### Using Context

\\\`\\\`\\\`jsx
import { ThemeProvider, useTheme } from './ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Header />
      <MainContent />
    </ThemeProvider>
  );
}

function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className={\\\`header \\\${theme}\\\`}>
      <h1>My App</h1>
      <button onClick={toggleTheme}>
        Toggle Theme ({theme})
      </button>
    </header>
  );
}
\\\`\\\`\\\`

### Context with Reducer

\\\`\\\`\\\`jsx
import { createContext, useContext, useReducer } from 'react';

// Initial State
const initialState = {
  user: null,
  loading: false,
  error: null,
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, loading: false, user: action.payload };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext();

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const user = await response.json();
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
\\\`\\\`\\\`

### Context Performance Optimization

\\\`\\\`\\\`jsx
import { createContext, useContext, useMemo, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({});

  // Split contexts to prevent unnecessary re-renders
  const userValue = useMemo(() => ({ user, setUser }), [user]);
  const preferencesValue = useMemo(
    () => ({ preferences, setPreferences }),
    [preferences]
  );

  return (
    <UserContext.Provider value={{ userValue, preferencesValue }}>
      {children}
    </UserContext.Provider>
  );
}

// Or split into multiple contexts
const UserDataContext = createContext();
const UserActionsContext = createContext();

export function OptimizedUserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Data rarely changes, actions never change
  const actions = useMemo(() => ({ setUser }), []);

  return (
    <UserActionsContext.Provider value={actions}>
      <UserDataContext.Provider value={user}>
        {children}
      </UserDataContext.Provider>
    </UserActionsContext.Provider>
  );
}
\\\`\\\`\\\`

## Redux Toolkit

**Redux Toolkit** is the official, opinionated toolset for efficient Redux development. It simplifies Redux code dramatically.

### Installation

\\\`\\\`\\\`bash
npm install @reduxjs/toolkit react-redux
\\\`\\\`\\\`

### Creating a Slice

\\\`\\\`\\\`javascript
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
    loading: false,
  },
  reducers: {
    increment: (state) => {
      // Immer allows "mutation" syntax
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    reset: (state) => {
      state.value = 0;
    },
  },
});

export const { increment, decrement, incrementByAmount, reset } = 
  counterSlice.actions;
export default counterSlice.reducer;
\\\`\\\`\\\`

### Store Configuration

\\\`\\\`\\\`javascript
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';
import userReducer from './features/user/userSlice';
import todosReducer from './features/todos/todosSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    todos: todosReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['user/setTimestamp'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
\\\`\\\`\\\`

### Using Redux in Components

\\\`\\\`\\\`jsx
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import { increment, decrement, incrementByAmount } from './counterSlice';

// App Setup
function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

// Component
function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
    </div>
  );
}
\\\`\\\`\\\`

### Async Actions with createAsyncThunk

\\\`\\\`\\\`javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(\\\`/api/users/\\\${userId}\\\`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUser: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;

// Usage in component
function UserProfile({ userId }) {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUser(userId));
  }, [userId, dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return <div>Welcome, {data.name}!</div>;
}
\\\`\\\`\\\`

## Zustand

**Zustand** is a small, fast, and scalable state management solution with a simple API.

### Installation

\\\`\\\`\\\`bash
npm install zustand
\\\`\\\`\\\`

### Creating a Store

\\\`\\\`\\\`javascript
import { create } from 'zustand';

// Basic store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Usage
function Counter() {
  const { count, increment, decrement, reset } = useStore();
  
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
\\\`\\\`\\\`

### Advanced Zustand Patterns

\\\`\\\`\\\`javascript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// With middleware
const useUserStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        
        login: async (credentials) => {
          set({ loading: true });
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              body: JSON.stringify(credentials),
            });
            const data = await response.json();
            set({ user: data.user, token: data.token, loading: false });
          } catch (error) {
            set({ error: error.message, loading: false });
          }
        },
        
        logout: () => {
          set({ user: null, token: null });
        },
        
        updateProfile: (updates) => {
          set((state) => ({
            user: { ...state.user, ...updates },
          }));
        },
      }),
      {
        name: 'user-storage', // localStorage key
        partialize: (state) => ({ user: state.user, token: state.token }),
      }
    )
  )
);

// Computed values
const useTodoStore = create((set, get) => ({
  todos: [],
  
  addTodo: (text) => {
    set((state) => ({
      todos: [...state.todos, { id: Date.now(), text, completed: false }],
    }));
  },
  
  toggleTodo: (id) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  },
  
  // Computed selector
  getCompletedCount: () => {
    return get().todos.filter((todo) => todo.completed).length;
  },
  
  getActiveCount: () => {
    return get().todos.filter((todo) => !todo.completed).length;
  },
}));
\\\`\\\`\\\`

### Zustand Selectors for Performance

\\\`\\\`\\\`javascript
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

const useStore = create((set) => ({
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  setFirstName: (name) => set({ firstName: name }),
  setLastName: (name) => set({ lastName: name }),
}));

// Only re-render when firstName or lastName change
function NameDisplay() {
  const { firstName, lastName } = useStore(
    (state) => ({ firstName: state.firstName, lastName: state.lastName }),
    shallow
  );
  
  return <div>{firstName} {lastName}</div>;
}

// Select only what you need
function AgeDisplay() {
  const age = useStore((state) => state.age);
  return <div>Age: {age}</div>;
}
\\\`\\\`\\\`

## Comparison: Context vs Redux vs Zustand

### Context API

**Pros:**
✅ Built into React (no dependencies)
✅ Simple for small apps
✅ Good for theme, locale, auth

**Cons:**
❌ Performance issues with frequent updates
❌ No built-in async handling
❌ Limited dev tools
❌ Can lead to prop drilling with multiple contexts

**Best For:** Small to medium apps, stable data, theming/locale

### Redux Toolkit

**Pros:**
✅ Predictable state updates
✅ Excellent dev tools
✅ Great for large apps
✅ Strong middleware ecosystem
✅ Time-travel debugging

**Cons:**
❌ More boilerplate than alternatives
❌ Steeper learning curve
❌ Can be overkill for simple apps

**Best For:** Large applications, complex state logic, team projects

### Zustand

**Pros:**
✅ Minimal boilerplate
✅ Excellent performance
✅ Small bundle size (1kb)
✅ Simple API
✅ Works outside React

**Cons:**
❌ Smaller ecosystem
❌ Less mature than Redux
❌ Fewer learning resources

**Best For:** Modern apps, performance-critical apps, quick prototypes

## Decision Tree

\\\`\\\`\\\`
Do you need global state?
├─ No → Use local state (useState)
└─ Yes
   ├─ Is it rarely updated? (theme, auth)
   │  └─ Use Context API
   ├─ Is it a large enterprise app?
   │  └─ Use Redux Toolkit
   ├─ Do you need minimal boilerplate?
   │  └─ Use Zustand
   └─ Is performance critical?
      └─ Use Zustand or Redux
\\\`\\\`\\\`

## Best Practices

### 1. Keep State as Local as Possible

\\\`\\\`\\\`jsx
// ❌ Bad: Unnecessary global state
const useStore = create((set) => ({
  modalOpen: false,
  setModalOpen: (open) => set({ modalOpen: open }),
}));

// ✅ Good: Local state
function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
\\\`\\\`\\\`

### 2. Normalize State Shape

\\\`\\\`\\\`javascript
// ❌ Bad: Nested arrays
{
  posts: [
    { id: 1, author: { id: 1, name: 'John' }, comments: [...] },
    { id: 2, author: { id: 1, name: 'John' }, comments: [...] }
  ]
}

// ✅ Good: Normalized
{
  posts: {
    byId: { 1: { id: 1, authorId: 1 }, 2: { id: 2, authorId: 1 } },
    allIds: [1, 2]
  },
  users: {
    byId: { 1: { id: 1, name: 'John' } },
    allIds: [1]
  },
  comments: {
    byId: {},
    allIds: []
  }
}
\\\`\\\`\\\`

### 3. Colocate State with Usage

Keep state close to where it is used. Only lift state up when necessary.

### 4. Use Selectors for Derived State

\\\`\\\`\\\`javascript
// Redux
const selectCompletedTodos = (state) =>
  state.todos.filter((todo) => todo.completed);

// Zustand
const completedTodos = useStore((state) =>
  state.todos.filter((todo) => todo.completed)
);
\\\`\\\`\\\`

### 5. Separate Server and Client State

Consider using React Query or SWR for server state instead of Redux/Zustand:

\\\`\\\`\\\`jsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(\\\`/api/users/\\\${userId}\\\`).then(r => r.json()),
  });

  // Much simpler than managing in Redux!
}
\\\`\\\`\\\`

## Summary

State management is crucial for building scalable React applications. Choose the right tool based on your needs:

- **Context API**: Simple apps, stable data
- **Redux Toolkit**: Large apps, complex logic
- **Zustand**: Modern apps, minimal code
- **React Query/SWR**: Server state

Remember: **Start simple, scale when needed!**`,
      [
        'Context API provides a way to avoid prop drilling',
        'Redux Toolkit simplifies Redux with createSlice and createAsyncThunk',
        'Zustand offers minimal boilerplate with excellent performance',
        'Choose state management based on app size and complexity',
        'Keep state as local as possible before reaching for global solutions',
        'Normalize state shape for better performance and maintainability',
        'Consider separating server state from client state'
      ]
    ]);

    const lessonId = lesson.rows[0].id;

    const codeExamples = [
      {
        title: 'Context API with useReducer',
        code: `import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        total: state.total + action.payload.price,
      };
    case 'REMOVE_ITEM':
      const item = state.items.find(i => i.id === action.payload);
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload),
        total: state.total - item.price,
      };
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
  });

  const value = { ...state, dispatch };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}`,
        language: 'jsx',
        explanation: 'Context API combined with useReducer provides a Redux-like pattern without external dependencies. Great for moderate complexity state.'
      },
      {
        title: 'Redux Toolkit Slice with Async Thunk',
        code: `import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ category, page }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        \\\`/api/products?category=\\\${category}&page=\\\${page}\\\`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    currentPage: 1,
    hasMore: true,
  },
  reducers: {
    clearProducts: (state) => {
      state.items = [];
      state.currentPage = 1;
    },
    addToFavorites: (state, action) => {
      const product = state.items.find(p => p.id === action.payload);
      if (product) {
        product.isFavorite = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [...state.items, ...action.payload.products];
        state.hasMore = action.payload.hasMore;
        state.currentPage += 1;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProducts, addToFavorites } = productsSlice.actions;
export default productsSlice.reducer;`,
        language: 'javascript',
        explanation: 'Redux Toolkit with createAsyncThunk handles async operations elegantly with built-in loading and error states.'
      },
      {
        title: 'Zustand Store with Middleware',
        code: `import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useAppStore = create(
  subscribeWithSelector(
    devtools(
      persist(
        immer((set, get) => ({
          // User state
          user: null,
          isAuthenticated: false,
          
          // Todos state
          todos: [],
          filter: 'all',
          
          // Actions
          login: (user) => {
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
            });
          },
          
          logout: () => {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
            });
          },
          
          addTodo: (text) => {
            set((state) => {
              state.todos.push({
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date().toISOString(),
              });
            });
          },
          
          toggleTodo: (id) => {
            set((state) => {
              const todo = state.todos.find((t) => t.id === id);
              if (todo) {
                todo.completed = !todo.completed;
              }
            });
          },
          
          setFilter: (filter) => set({ filter }),
          
          // Computed selectors
          getFilteredTodos: () => {
            const { todos, filter } = get();
            if (filter === 'active') {
              return todos.filter((t) => !t.completed);
            }
            if (filter === 'completed') {
              return todos.filter((t) => t.completed);
            }
            return todos;
          },
          
          getStats: () => {
            const todos = get().todos;
            return {
              total: todos.length,
              completed: todos.filter((t) => t.completed).length,
              active: todos.filter((t) => !t.completed).length,
            };
          },
        })),
        {
          name: 'app-storage',
          partialize: (state) => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
          }),
        }
      )
    )
  )
);

// Subscribe to specific state changes
useAppStore.subscribe(
  (state) => state.user,
  (user) => {
    console.log('User changed:', user);
  }
);

export default useAppStore;`,
        language: 'javascript',
        explanation: 'Zustand with middleware provides Redux-like features (devtools, persistence, selectors) with minimal code and excellent performance.'
      },
      {
        title: 'Performance Optimized Context',
        code: `import { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';

// Split contexts to prevent unnecessary re-renders
const TodoStateContext = createContext();
const TodoDispatchContext = createContext();

export function TodoProvider({ children }) {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  
  // Use refs for values that don't trigger re-renders
  const todosRef = useRef(todos);
  todosRef.current = todos;
  
  // Memoize dispatch actions (they never change)
  const dispatch = useMemo(() => ({
    addTodo: (text) => {
      const newTodo = {
        id: Date.now(),
        text,
        completed: false,
      };
      setTodos((prev) => [...prev, newTodo]);
    },
    
    toggleTodo: (id) => {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
    },
    
    deleteTodo: (id) => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    },
    
    setFilter: (newFilter) => {
      setFilter(newFilter);
    },
  }), []); // Empty deps - actions never change
  
  // Memoize state to prevent object recreation
  const state = useMemo(() => {
    const filteredTodos = todos.filter((todo) => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    });
    
    return {
      todos,
      filteredTodos,
      filter,
      stats: {
        total: todos.length,
        completed: todos.filter((t) => t.completed).length,
        active: todos.filter((t) => !t.completed).length,
      },
    };
  }, [todos, filter]);
  
  return (
    <TodoDispatchContext.Provider value={dispatch}>
      <TodoStateContext.Provider value={state}>
        {children}
      </TodoStateContext.Provider>
    </TodoDispatchContext.Provider>
  );
}

// Custom hooks
export function useTodoState() {
  const context = useContext(TodoStateContext);
  if (!context) {
    throw new Error('useTodoState must be used within TodoProvider');
  }
  return context;
}

export function useTodoDispatch() {
  const context = useContext(TodoDispatchContext);
  if (!context) {
    throw new Error('useTodoDispatch must be used within TodoProvider');
  }
  return context;
}

// Components only re-render when they use data that changes
function TodoList() {
  const { filteredTodos } = useTodoState();
  const { toggleTodo, deleteTodo } = useTodoDispatch();
  
  return (
    <ul>
      {filteredTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      ))}
    </ul>
  );
}

// This component only re-renders when stats change
function TodoStats() {
  const { stats } = useTodoState();
  
  return (
    <div>
      <p>Total: {stats.total}</p>
      <p>Active: {stats.active}</p>
      <p>Completed: {stats.completed}</p>
    </div>
  );
}`,
        language: 'jsx',
        explanation: 'Splitting state and dispatch into separate contexts and using useMemo prevents unnecessary re-renders in large applications.'
      }
    ];

    for (const example of codeExamples) {
      await client.query(
        `INSERT INTO code_examples (lesson_id, title, code, language, explanation, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [lessonId, example.title, example.code, example.language, example.explanation, codeExamples.indexOf(example)]
      );
    }

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'When should you use Context API over Redux or Zustand?', 'multiple_choice', $2, 'For rarely updated state like theme or authentication', 'Context API is best for rarely updated state like themes, locale, or authentication. For frequently updated state, Redux or Zustand perform better as Context can cause unnecessary re-renders.', 'medium', 15, 1),
      ($1, 'What is the main advantage of Redux Toolkit over traditional Redux?', 'multiple_choice', $3, 'It eliminates all boilerplate and uses mutation syntax with Immer', 'Redux Toolkit dramatically reduces boilerplate by providing utilities like createSlice and createAsyncThunk. It also uses Immer internally, allowing you to write "mutating" update logic that is actually immutable.', 'medium', 15, 2),
      ($1, 'How does Zustand differ from Redux in terms of bundle size and API?', 'multiple_choice', $4, 'Zustand is smaller (1kb) and has a simpler API with less boilerplate', 'Zustand is only about 1kb (Redux is larger) and has a much simpler API requiring minimal boilerplate. You can create a store and use it without providers, actions types, or reducers.', 'easy', 10, 3),
      ($1, 'What is the correct way to prevent unnecessary re-renders when using Context API?', 'multiple_choice', $5, 'Split state and dispatch into separate contexts and use useMemo for values', 'To optimize Context performance, split state and dispatch into separate contexts so components only subscribe to what they need. Use useMemo for context values to prevent object recreation on every render.', 'hard', 20, 4),
      ($1, 'In Redux Toolkit, what does createAsyncThunk automatically handle?', 'multiple_choice', $6, 'Pending, fulfilled, and rejected states with corresponding action types', 'createAsyncThunk automatically generates and dispatches pending, fulfilled, and rejected action types based on the promise lifecycle. This eliminates manual action creators and types for async operations.', 'medium', 15, 5)
    `, [
      lessonId,
      JSON.stringify(['For frequently updated state across many components', 'For large enterprise applications with complex state logic', 'For rarely updated state like theme or authentication', 'Context API should always be preferred over other solutions']),
      JSON.stringify(['It removes the need for a store configuration', 'It eliminates all boilerplate and uses mutation syntax with Immer', 'It works without React components', 'It automatically handles all async operations']),
      JSON.stringify(['Zustand is larger but has a simpler API', 'Zustand is smaller (1kb) and has a simpler API with less boilerplate', 'Zustand and Redux have the same bundle size', 'Zustand requires more boilerplate than Redux']),
      JSON.stringify(['Always use a single context for all application state', 'Split state and dispatch into separate contexts and use useMemo for values', 'Never use Context API because it always causes re-renders', 'Use useCallback for all state values']),
      JSON.stringify(['Only the success case of async operations', 'Pending, fulfilled, and rejected states with corresponding action types', 'Component rendering and updates', 'API request caching and deduplication'])
    ]);

    await client.query('COMMIT');
    console.log('✅ State Management lesson added successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding State Management lesson:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedStateManagement()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
