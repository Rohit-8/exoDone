// ============================================================================
// State Management — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  "context-redux-toolkit": [
    {
      title: "Context API Theme System with Splitting Optimization",
      description:
        "A complete theme context implementation demonstrating createContext, Provider, useContext with a custom hook, and the performance optimization of splitting state from dispatch into separate contexts.",
      language: "javascript",
      code: `import { createContext, useContext, useState, useCallback, memo } from 'react';

// ── 1. Create separate contexts for state and dispatch ──
// This prevents components that only dispatch (e.g., toggle button)
// from re-rendering when the theme value changes.
const ThemeStateContext = createContext(undefined);
const ThemeDispatchContext = createContext(undefined);

// ── 2. Provider component ──
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // Stable function reference — never causes consumer re-renders
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeStateContext.Provider value={theme}>
      <ThemeDispatchContext.Provider value={toggleTheme}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeStateContext.Provider>
  );
}

// ── 3. Custom hooks with safety checks ──
function useTheme() {
  const context = useContext(ThemeStateContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function useToggleTheme() {
  const context = useContext(ThemeDispatchContext);
  if (context === undefined) {
    throw new Error('useToggleTheme must be used within a ThemeProvider');
  }
  return context;
}

// ── 4. Consumer components ──

// This component only subscribes to dispatch — it does NOT re-render
// when the theme value changes.
const ThemeToggleButton = memo(function ThemeToggleButton() {
  const toggleTheme = useToggleTheme();
  console.log('ThemeToggleButton rendered'); // verify no unnecessary renders
  return <button onClick={toggleTheme}>Toggle Theme</button>;
});

// This component reads the theme value and re-renders when it changes.
function ThemedCard({ title, children }) {
  const theme = useTheme();
  const styles = {
    light: { background: '#ffffff', color: '#1a1a2e', border: '1px solid #e0e0e0' },
    dark:  { background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #333' },
  };

  return (
    <div style={{ ...styles[theme], padding: '1.5rem', borderRadius: '8px' }}>
      <h3>{title}</h3>
      {children}
      <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Current theme: {theme}</p>
    </div>
  );
}

// ── 5. App composition ──
function App() {
  return (
    <ThemeProvider>
      <ThemedCard title="Dashboard">
        <p>This card responds to theme changes.</p>
        <ThemeToggleButton />
      </ThemedCard>
    </ThemeProvider>
  );
}`,
      explanation:
        "This example demonstrates the key Context API best practices: (1) splitting state and dispatch into separate contexts so dispatch-only consumers avoid unnecessary re-renders, (2) wrapping useContext in custom hooks with error boundaries for better DX, (3) using useCallback to stabilize the dispatch function reference, and (4) using memo on components that only need the dispatch context. This pattern resolves the biggest Context performance pitfall — all consumers re-rendering on any value change.",
      order_index: 1,
    },
    {
      title: "Redux Toolkit Todo App with createSlice, createAsyncThunk & Selectors",
      description:
        "A production-quality Redux Toolkit setup showing configureStore, createSlice with Immer mutations, createAsyncThunk with full pending/fulfilled/rejected handling, memoized selectors with createSelector, and component integration with useSelector/useDispatch.",
      language: "javascript",
      code: `// ── todosSlice.js ──
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// Async thunk with error handling via rejectWithValue
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error(\\\`Server error: \\\${response.status}\\\`);
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addTodoAsync = createAsyncThunk(
  'todos/addTodo',
  async (text, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, completed: false }),
      });
      if (!response.ok) throw new Error('Failed to add todo');
      return await response.json(); // server returns { id, text, completed }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    status: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    filter: 'all',    // 'all' | 'active' | 'completed'
  },
  reducers: {
    // Immer allows "mutating" syntax — produces immutable updates
    toggleTodo: (state, action) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearCompleted: (state) => {
      state.items = state.items.filter(t => !t.completed);
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchTodos lifecycle ──
      .addCase(fetchTodos.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // from rejectWithValue
      })
      // ── addTodoAsync lifecycle ──
      .addCase(addTodoAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export const { toggleTodo, removeTodo, setFilter, clearCompleted } = todosSlice.actions;

// ── Memoized selectors (Reselect via createSelector) ──
const selectTodosState = (state) => state.todos;
export const selectAllTodos = (state) => state.todos.items;
export const selectFilter = (state) => state.todos.filter;
export const selectStatus = (state) => state.todos.status;
export const selectError = (state) => state.todos.error;

// Only recomputes when items or filter change
export const selectFilteredTodos = createSelector(
  [selectAllTodos, selectFilter],
  (items, filter) => {
    switch (filter) {
      case 'active':    return items.filter(t => !t.completed);
      case 'completed': return items.filter(t =>  t.completed);
      default:          return items;
    }
  }
);

export const selectTodoStats = createSelector(
  [selectAllTodos],
  (items) => ({
    total: items.length,
    completed: items.filter(t => t.completed).length,
    active: items.filter(t => !t.completed).length,
  })
);

export default todosSlice.reducer;

// ── store.js ──
import { configureStore } from '@reduxjs/toolkit';
import todosReducer from './todosSlice';

export const store = configureStore({
  reducer: {
    todos: todosReducer,
  },
  // Redux DevTools + thunk middleware are enabled by default
});

// ── TodoApp.jsx — Component Integration ──
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTodos, addTodoAsync, toggleTodo, removeTodo,
  setFilter, clearCompleted,
  selectFilteredTodos, selectTodoStats, selectStatus, selectError
} from './todosSlice';

function TodoApp() {
  const dispatch = useDispatch();
  const todos = useSelector(selectFilteredTodos);
  const stats = useSelector(selectTodoStats);
  const status = useSelector(selectStatus);
  const error = useSelector(selectError);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTodos());
    }
  }, [status, dispatch]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    await dispatch(addTodoAsync(newText.trim()));
    setNewText('');
  };

  if (status === 'loading') return <p>Loading todos...</p>;
  if (status === 'failed') return <p>Error: {error}</p>;

  return (
    <div>
      <form onSubmit={handleAdd}>
        <input value={newText} onChange={e => setNewText(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <div>
        {['all', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => dispatch(setFilter(f))}>{f}</button>
        ))}
        <button onClick={() => dispatch(clearCompleted())}>Clear Done</button>
      </div>

      <p>{stats.active} remaining / {stats.completed} completed</p>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <span
              onClick={() => dispatch(toggleTodo(todo.id))}
              style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
            >
              {todo.text}
            </span>
            <button onClick={() => dispatch(removeTodo(todo.id))}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      explanation:
        "This example covers the full Redux Toolkit workflow: (1) createAsyncThunk with rejectWithValue for proper error handling across pending/fulfilled/rejected states, (2) createSlice with Immer-powered 'mutating' reducers for synchronous actions, (3) extraReducers builder pattern to handle async thunk lifecycle, (4) createSelector for memoized derived state that only recomputes when its inputs change, (5) configureStore with automatic DevTools and thunk middleware, and (6) component integration using useSelector with selectors and useDispatch.",
      order_index: 2,
    },
    {
      title: "Zustand Store with Middleware, Selectors & Comparison to Redux",
      description:
        "A Zustand store demonstrating create(), devtools/persist middleware, subscription-based selective re-renders, and side-by-side comparison showing why Zustand needs less boilerplate than Redux Toolkit for the same functionality.",
      language: "javascript",
      code: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// ── Zustand Store with devtools + persist middleware ──
const useTodoStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ── State ──
        todos: [],
        filter: 'all',

        // ── Actions (no action types, no dispatch, no reducers) ──
        addTodo: (text) =>
          set(
            (state) => ({
              todos: [
                ...state.todos,
                { id: crypto.randomUUID(), text, completed: false },
              ],
            }),
            false,
            'addTodo' // action label in Redux DevTools
          ),

        toggleTodo: (id) =>
          set(
            (state) => ({
              todos: state.todos.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
              ),
            }),
            false,
            'toggleTodo'
          ),

        removeTodo: (id) =>
          set(
            (state) => ({
              todos: state.todos.filter((t) => t.id !== id),
            }),
            false,
            'removeTodo'
          ),

        setFilter: (filter) => set({ filter }, false, 'setFilter'),

        clearCompleted: () =>
          set(
            (state) => ({
              todos: state.todos.filter((t) => !t.completed),
            }),
            false,
            'clearCompleted'
          ),

        // ── Async action (no createAsyncThunk needed) ──
        fetchTodos: async () => {
          try {
            const res = await fetch('/api/todos');
            const data = await res.json();
            set({ todos: data }, false, 'fetchTodos');
          } catch (err) {
            console.error('Failed to fetch todos:', err);
          }
        },

        // ── Derived data via get() ──
        getFilteredTodos: () => {
          const { todos, filter } = get();
          if (filter === 'active') return todos.filter((t) => !t.completed);
          if (filter === 'completed') return todos.filter((t) => t.completed);
          return todos;
        },

        getStats: () => {
          const { todos } = get();
          return {
            total: todos.length,
            active: todos.filter((t) => !t.completed).length,
            completed: todos.filter((t) => t.completed).length,
          };
        },
      }),
      {
        name: 'todo-storage',  // localStorage key
        partialize: (state) => ({ todos: state.todos }), // only persist todos
      }
    ),
    { name: 'TodoStore' } // DevTools instance name
  )
);

// ── Component Usage — Selective Subscriptions ──

// This component ONLY re-renders when todos.length changes
function TodoCount() {
  const count = useTodoStore((state) => state.todos.length);
  return <span>{count} todos</span>;
}

// This component ONLY re-renders when filter changes
function FilterBar() {
  const filter = useTodoStore((state) => state.filter);
  const setFilter = useTodoStore((state) => state.setFilter);

  return (
    <div>
      {['all', 'active', 'completed'].map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

// Select multiple values with shallow comparison to avoid re-renders
function TodoStats() {
  const { total, active, completed } = useTodoStore(
    (state) => state.getStats(),
    shallow // compares object properties, not reference
  );

  return <p>{active} active / {completed} completed / {total} total</p>;
}

// Full list component
function TodoList() {
  const getFilteredTodos = useTodoStore((s) => s.getFilteredTodos);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const removeTodo = useTodoStore((s) => s.removeTodo);
  const todos = getFilteredTodos();

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <span
            onClick={() => toggleTodo(todo.id)}
            style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
          >
            {todo.text}
          </span>
          <button onClick={() => removeTodo(todo.id)}>×</button>
        </li>
      ))}
    </ul>
  );
}

// ── No Provider wrapper needed — just use the hook directly ──
function App() {
  const fetchTodos = useTodoStore((s) => s.fetchTodos);
  React.useEffect(() => { fetchTodos(); }, [fetchTodos]);

  return (
    <div>
      <h1>Zustand Todos</h1>
      <TodoCount />
      <TodoStats />
      <FilterBar />
      <TodoList />
    </div>
  );
}`,
      explanation:
        "This example highlights Zustand's advantages: (1) No Provider component — the store is a hook created outside React, (2) subscription-based selectors that only trigger re-renders for the specific state slice consumed, (3) built-in async support without extra utilities like createAsyncThunk, (4) devtools middleware that integrates with Redux DevTools for time-travel debugging, (5) persist middleware for automatic localStorage hydration with partialize to control what gets persisted, and (6) shallow comparison helper for selecting multiple values without unnecessary re-renders. Compared to the Redux Toolkit example, Zustand achieves the same functionality with roughly 40% less code and no boilerplate.",
      order_index: 3,
    },
  ],
};

export default examples;
