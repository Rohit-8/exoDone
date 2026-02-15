// ============================================================================
// State Management — Content
// ============================================================================

export const topic = {
  "name": "State Management",
  "slug": "state-management",
  "description": "Compare Context API, Redux Toolkit, and Zustand for managing application state at scale.",
  "estimated_time": 180,
  "order_index": 4
};

export const lessons = [
  {
    title: "Context API & Redux Toolkit",
    slug: "context-redux-toolkit",
    summary: "Compare Context API for light state sharing and Redux Toolkit for complex application state.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "Context API is built-in and ideal for infrequently-changing global values (theme, locale, auth)",
  "Redux Toolkit (RTK) simplifies Redux with createSlice and configureStore",
  "RTK uses Immer internally — you can write \"mutating\" reducers that produce immutable updates",
  "createAsyncThunk handles async operations with pending/fulfilled/rejected lifecycle",
  "Choose based on complexity: Context for simple, RTK for complex apps"
],
    content: `# Context API vs Redux Toolkit

## When to Use What

| Scenario | Solution |
|---|---|
| Theme, locale, auth | Context API |
| Complex app state with many actions | Redux Toolkit |
| Server state (API data) | React Query / TanStack Query |
| Simple local state | useState / useReducer |

## Redux Toolkit Quick Start

\`\`\`bash
npm install @reduxjs/toolkit react-redux
\`\`\`

### Create a Slice
\`\`\`jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTodos = createAsyncThunk('todos/fetch', async () => {
  const res = await fetch('/api/todos');
  return res.json();
});

const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    addTodo: (state, action) => { state.items.push(action.payload); },
    toggleTodo: (state, action) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
    removeTodo: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { addTodo, toggleTodo, removeTodo } = todosSlice.actions;
export default todosSlice.reducer;
\`\`\`

### Configure Store
\`\`\`jsx
import { configureStore } from '@reduxjs/toolkit';
import todosReducer from './todosSlice';

export const store = configureStore({
  reducer: {
    todos: todosReducer,
  },
});
\`\`\`

### Use in Components
\`\`\`jsx
import { useSelector, useDispatch } from 'react-redux';
import { fetchTodos, toggleTodo } from './todosSlice';

function TodoList() {
  const { items, status } = useSelector(state => state.todos);
  const dispatch = useDispatch();

  useEffect(() => { dispatch(fetchTodos()); }, [dispatch]);

  if (status === 'loading') return <p>Loading...</p>;
  return (
    <ul>
      {items.map(todo => (
        <li key={todo.id} onClick={() => dispatch(toggleTodo(todo.id))}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
\`\`\`
`,
  },
];
