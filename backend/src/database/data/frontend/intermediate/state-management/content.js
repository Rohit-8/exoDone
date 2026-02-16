// ============================================================================
// State Management — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "State Management",
  slug: "state-management",
  description:
    "Compare Context API, Redux Toolkit, and Zustand for managing application state at scale.",
  estimated_time: 180,
  order_index: 4,
};

export const lessons = [
  {
    title: "Context API & Redux Toolkit",
    slug: "context-redux-toolkit",
    summary:
      "Compare Context API for light state sharing and Redux Toolkit for complex application state.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 1,
    key_points: [
      "Local vs global state decision tree and when you actually need a state management library",
      "Context API fundamentals: createContext, Provider pattern, and useContext consumption",
      "Context performance pitfalls: why all consumers re-render and how to split contexts",
      "Redux Toolkit core: configureStore, createSlice, and Immer-powered immutable updates",
      "Async Redux: createAsyncThunk lifecycle (pending/fulfilled/rejected) and RTK Query basics",
      "Zustand as a lightweight alternative: create stores, middleware, and devtools integration",
      "State management decision matrix: Context vs Redux vs Zustand vs Jotai vs Recoil trade-offs",
      "Best practices: normalized state shape, memoized selectors, and separating server state from client state",
    ],
    content: `
# Context API & Redux Toolkit

State management is one of the most debated topics in React interviews. Interviewers want to know that you can choose the **right tool** for the problem — not just reach for Redux by default. This lesson covers the full spectrum: from React's built-in Context API to Redux Toolkit to lightweight alternatives like Zustand.

---

## When Do You Actually Need State Management?

### The Local vs Global State Decision Tree

Before adding any library, ask these questions:

1. **Is the state used by only one component?** → \\\`useState\\\` is sufficient.
2. **Is it shared between a parent and a few children?** → Lift state up or pass via props.
3. **Is it needed by many components across the tree?** → Consider Context API.
4. **Is it complex with many actions, async logic, or deep nesting?** → Consider Redux Toolkit.
5. **Is it server-fetched data (caching, refetching, pagination)?** → Use TanStack Query / SWR — this is **not** client state.

\\\`\\\`\\\`
                       ┌─────────────────────────┐
                       │  Is the state local to   │
                       │  a single component?      │
                       └────────────┬──────────────┘
                              Yes ──┤── No
                               │         │
                          useState    ┌───▼──────────────────┐
                                      │  Shared between 2-3  │
                                      │  nearby components?   │
                                      └────────┬─────────────┘
                                         Yes ──┤── No
                                          │         │
                                     Lift state  ┌──▼──────────────────┐
                                        up       │  Is it server data  │
                                                 │  (fetching/caching)?│
                                                 └────────┬────────────┘
                                                    Yes ──┤── No
                                                     │         │
                                              TanStack Query  ┌▼─────────────────┐
                                                / SWR         │  Simple global    │
                                                              │  UI state?        │
                                                              └───────┬───────────┘
                                                               Yes ──┤── No
                                                                │         │
                                                          Context API   Redux Toolkit
                                                                        or Zustand
\\\`\\\`\\\`

**Interview tip:** Demonstrating this decision process shows architectural maturity. Never say "I always use Redux" — interviewers consider that a red flag.

---

## Context API — React's Built-In Solution

### Creating and Providing Context

\\\`\\\`\\\`javascript
import { createContext, useContext, useState } from 'react';

// 1. Create the context with a default value
const ThemeContext = createContext('light');

// 2. Create a provider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Consume with useContext
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
      }}
    >
      Current: {theme}
    </button>
  );
}
\\\`\\\`\\\`

### Custom Hook Pattern (Best Practice)

Always wrap \\\`useContext\\\` in a custom hook to provide a better developer experience and catch misuse:

\\\`\\\`\\\`javascript
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Now components use:
const { theme, toggleTheme } = useTheme();
\\\`\\\`\\\`

### The Performance Problem — Why Context Doesn't Scale

**This is a critical interview topic.** When a Context's value changes, **every component** that calls \\\`useContext\\\` for that context re-renders, even if it only uses a slice of the value.

\\\`\\\`\\\`javascript
// BAD — monolithic context
const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);

  // Changing theme re-renders EVERY consumer, even those
  // that only care about user or notifications
  return (
    <AppContext.Provider value={{
      user, setUser,
      theme, setTheme,
      notifications, setNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
}
\\\`\\\`\\\`

### Solution: Context Splitting

Split unrelated state into separate contexts:

\\\`\\\`\\\`javascript
const UserContext = createContext();
const ThemeContext = createContext();
const NotificationContext = createContext();

function AppProviders({ children }) {
  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
\\\`\\\`\\\`

Now changing the theme only re-renders components subscribed to \\\`ThemeContext\\\`.

### Additional Optimization: Separate State and Dispatch Contexts

\\\`\\\`\\\`javascript
const CountStateContext = createContext();
const CountDispatchContext = createContext();

function CountProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CountStateContext.Provider value={count}>
      <CountDispatchContext.Provider value={setCount}>
        {children}
      </CountDispatchContext.Provider>
    </CountStateContext.Provider>
  );
}

// Components that only dispatch never re-render on state change
function IncrementButton() {
  const setCount = useContext(CountDispatchContext);
  return <button onClick={() => setCount(c => c + 1)}>+</button>;
}
\\\`\\\`\\\`

---

## Redux Toolkit — The Modern Standard

Redux Toolkit (RTK) is the official, opinionated toolset for Redux. It eliminates boilerplate and enforces best practices.

### configureStore

\\\`\\\`\\\`javascript
import { configureStore } from '@reduxjs/toolkit';
import todosReducer from './features/todos/todosSlice';
import authReducer from './features/auth/authSlice';

const store = configureStore({
  reducer: {
    todos: todosReducer,
    auth: authReducer,
  },
  // DevTools enabled by default in development
  // Thunk middleware included by default
});

export default store;
\\\`\\\`\\\`

\\\`configureStore\\\` does three things automatically:
1. Combines your slice reducers with \\\`combineReducers\\\`
2. Adds \\\`redux-thunk\\\` middleware
3. Enables Redux DevTools Extension

### createSlice — The Heart of RTK

\\\`createSlice\\\` auto-generates action creators and action types from reducer functions:

\\\`\\\`\\\`javascript
import { createSlice } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    filter: 'all', // 'all' | 'active' | 'completed'
  },
  reducers: {
    // Immer lets you "mutate" state — it produces an immutable update
    addTodo: (state, action) => {
      state.items.push({
        id: Date.now(),
        text: action.payload,
        completed: false,
      });
    },
    toggleTodo: (state, action) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed; // direct mutation is safe with Immer
      }
    },
    removeTodo: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
});

// Auto-generated action creators
export const { addTodo, toggleTodo, removeTodo, setFilter } = todosSlice.actions;

// Selector functions
export const selectAllTodos = (state) => state.todos.items;
export const selectFilter = (state) => state.todos.filter;
export const selectFilteredTodos = (state) => {
  const { items, filter } = state.todos;
  switch (filter) {
    case 'active':
      return items.filter(t => !t.completed);
    case 'completed':
      return items.filter(t => t.completed);
    default:
      return items;
  }
};

export default todosSlice.reducer;
\\\`\\\`\\\`

### Immer Under the Hood

**Interview question: "How can you mutate state in Redux Toolkit reducers?"**

You're not actually mutating. RTK uses **Immer** internally. When you write \\\`state.items.push(newItem)\\\`, Immer:
1. Creates a draft Proxy of the state
2. Records your mutations on the draft
3. Produces a new immutable state object by structurally sharing unchanged parts

\\\`\\\`\\\`javascript
// These two are equivalent inside createSlice:

// "Mutating" style (Immer handles immutability)
addTodo: (state, action) => {
  state.items.push(action.payload);
},

// Traditional immutable return (also works)
addTodo: (state, action) => {
  return {
    ...state,
    items: [...state.items, action.payload],
  };
},
\\\`\\\`\\\`

**Key rule:** You can either mutate the draft OR return a new value, but **never both**.

### createAsyncThunk — Handling Async Logic

\\\`createAsyncThunk\\\` generates a thunk that dispatches \\\`pending\\\`, \\\`fulfilled\\\`, and \\\`rejected\\\` actions automatically:

\\\`\\\`\\\`javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// The thunk
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos', // action type prefix
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json(); // becomes action.payload in fulfilled
    } catch (err) {
      return rejectWithValue(err.message); // becomes action.payload in rejected
    }
  }
);

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // synchronous reducers here
  },
  extraReducers: (builder) => {
    builder
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
        state.error = action.payload;
      });
  },
});
\\\`\\\`\\\`

### extraReducers vs reducers

| Feature | \\\`reducers\\\` | \\\`extraReducers\\\` |
|---------|-----------|-----------------|
| Purpose | Define slice-owned actions | Respond to external actions |
| Action creators | Auto-generated | Not generated (already exist) |
| Use case | Synchronous logic | \\\`createAsyncThunk\\\`, other slices' actions |

### RTK Query — Data Fetching Built Into Redux

RTK Query eliminates hand-written data fetching logic:

\\\`\\\`\\\`javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Todo'],
  endpoints: (builder) => ({
    getTodos: builder.query({
      query: () => '/todos',
      providesTags: ['Todo'],
    }),
    addTodo: builder.mutation({
      query: (newTodo) => ({
        url: '/todos',
        method: 'POST',
        body: newTodo,
      }),
      invalidatesTags: ['Todo'], // auto-refetch getTodos
    }),
  }),
});

// Auto-generated hooks
export const { useGetTodosQuery, useAddTodoMutation } = apiSlice;
\\\`\\\`\\\`

Usage in a component:

\\\`\\\`\\\`javascript
function TodoList() {
  const { data: todos, isLoading, error } = useGetTodosQuery();
  const [addTodo] = useAddTodoMutation();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <ul>
      {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </ul>
  );
}
\\\`\\\`\\\`

---

## Zustand — The Lightweight Alternative

Zustand is a small (1KB), fast state management library with a simple API:

### Basic Store

\\\`\\\`\\\`javascript
import { create } from 'zustand';

const useTodoStore = create((set, get) => ({
  todos: [],
  filter: 'all',

  addTodo: (text) =>
    set((state) => ({
      todos: [...state.todos, { id: Date.now(), text, completed: false }],
    })),

  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),

  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),

  setFilter: (filter) => set({ filter }),

  // Derived value using get()
  filteredTodos: () => {
    const { todos, filter } = get();
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  },
}));
\\\`\\\`\\\`

### Why Zustand Avoids Context's Re-Render Problem

Zustand uses **subscription-based** updates. Components only re-render when the specific slice of state they select changes:

\\\`\\\`\\\`javascript
// Only re-renders when todos change — not when filter changes
function TodoCount() {
  const count = useTodoStore((state) => state.todos.length);
  return <span>{count} todos</span>;
}

// Only re-renders when filter changes
function FilterDisplay() {
  const filter = useTodoStore((state) => state.filter);
  return <span>Filter: {filter}</span>;
}
\\\`\\\`\\\`

### Middleware: Devtools + Persist

\\\`\\\`\\\`javascript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useTodoStore = create(
  devtools(
    persist(
      (set) => ({
        todos: [],
        addTodo: (text) =>
          set(
            (state) => ({
              todos: [...state.todos, { id: Date.now(), text, completed: false }],
            }),
            false,
            'addTodo' // action name in DevTools
          ),
      }),
      { name: 'todo-storage' } // localStorage key
    )
  )
);
\\\`\\\`\\\`

---

## State Management Decision Matrix

| Criteria | Context API | Redux Toolkit | Zustand | Jotai | Recoil |
|----------|------------|--------------|---------|-------|--------|
| **Bundle size** | 0 KB (built-in) | ~11 KB | ~1 KB | ~2 KB | ~14 KB |
| **Boilerplate** | Low | Medium | Very Low | Low | Medium |
| **DevTools** | React DevTools | Redux DevTools | Redux DevTools | Custom | Custom |
| **Async handling** | Manual | createAsyncThunk / RTK Query | Manual or middleware | Async atoms | Async selectors |
| **Re-render optimization** | Poor (all consumers) | Good (useSelector) | Excellent (subscriptions) | Excellent (atomic) | Excellent (atomic) |
| **Learning curve** | Easy | Moderate | Easy | Easy | Moderate |
| **TypeScript support** | Good | Excellent | Excellent | Excellent | Good |
| **Server state** | Not designed for it | RTK Query | Not designed for it | Not designed for it | Not designed for it |
| **Best for** | Theme, locale, auth | Complex enterprise apps | Simple to mid-size apps | Atomic state updates | Meta projects, complex deps |
| **Community / ecosystem** | Built-in React | Massive | Growing fast | Growing | Declining |

---

## Best Practices

### 1. Normalize State Shape

Store entities in a lookup table rather than nested arrays:

\\\`\\\`\\\`javascript
// BAD — nested, hard to update
{
  posts: [
    {
      id: 1,
      title: 'Hello',
      comments: [
        { id: 101, text: 'Great post', author: { id: 5, name: 'Alice' } },
      ],
    },
  ],
}

// GOOD — normalized
{
  posts: {
    byId: { 1: { id: 1, title: 'Hello', commentIds: [101] } },
    allIds: [1],
  },
  comments: {
    byId: { 101: { id: 101, text: 'Great post', authorId: 5 } },
    allIds: [101],
  },
  users: {
    byId: { 5: { id: 5, name: 'Alice' } },
    allIds: [5],
  },
}
\\\`\\\`\\\`

RTK provides \\\`createEntityAdapter\\\` to manage normalized state automatically.

### 2. Memoized Selectors with Reselect

\\\`\\\`\\\`javascript
import { createSelector } from '@reduxjs/toolkit';

const selectTodos = (state) => state.todos.items;
const selectFilter = (state) => state.todos.filter;

// Only recomputes when items or filter change
export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (items, filter) => {
    switch (filter) {
      case 'active':
        return items.filter(t => !t.completed);
      case 'completed':
        return items.filter(t => t.completed);
      default:
        return items;
    }
  }
);
\\\`\\\`\\\`

### 3. Separate Server State from Client State

Server state (remote data) and client state (UI state) have fundamentally different needs:

| Concern | Server State | Client State |
|---------|-------------|-------------|
| **Ownership** | Remote database | Browser memory |
| **Staleness** | Can go stale any time | Always current |
| **Caching** | Critical | Rarely needed |
| **Deduplication** | Important (same entity fetched in multiple places) | Not a concern |
| **Background updates** | Polling, WebSocket | No need |

Use **TanStack Query** (React Query) or **SWR** for server state, and Redux/Zustand/Context for client state:

\\\`\\\`\\\`javascript
// Server state — TanStack Query
const { data: todos } = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetch('/api/todos').then(r => r.json()),
  staleTime: 30_000, // consider fresh for 30 seconds
});

// Client state — Zustand (or Context, or Redux)
const useSidebarStore = create((set) => ({
  isOpen: true,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
\\\`\\\`\\\`

### 4. Keep State Minimal

Never derive in state what can be computed:

\\\`\\\`\\\`javascript
// BAD — redundant derived state
const [todos, setTodos] = useState([]);
const [completedCount, setCompletedCount] = useState(0); // derived!

// GOOD — compute on the fly (or memoize)
const [todos, setTodos] = useState([]);
const completedCount = useMemo(
  () => todos.filter(t => t.completed).length,
  [todos]
);
\\\`\\\`\\\`

---

## Common Interview Questions

1. **"When would you choose Context over Redux?"** — Context for simple, infrequently changing global values (theme, locale, auth status). Redux for complex state with many actions, middleware needs, or when you need time-travel debugging.

2. **"What's the downside of Context API?"** — All consumers re-render when the context value changes, regardless of which part of the value they use. There's no built-in selector mechanism.

3. **"Explain how Immer works in Redux Toolkit."** — Immer wraps the state in a Proxy (the draft). Mutations are recorded on the proxy and applied immutably to produce a new state object, sharing structure with unchanged parts.

4. **"What is createAsyncThunk?"** — A RTK utility that generates a thunk action creator with automatically dispatched pending/fulfilled/rejected lifecycle actions, simplifying async flow in Redux.

5. **"Why might you choose Zustand over Redux Toolkit?"** — Zustand has a smaller API surface, no Provider needed, less boilerplate, built-in subscription-based selective re-renders, and a much smaller bundle size. Trade-off: a smaller ecosystem and no built-in equivalent of RTK Query.

6. **"How do you handle server state?"** — With TanStack Query or SWR, not Redux. Server state has different concerns (caching, deduplication, background refetching) that these libraries handle out of the box. Redux should only manage client state (UI, form, local preferences).
    `,
  },
];
