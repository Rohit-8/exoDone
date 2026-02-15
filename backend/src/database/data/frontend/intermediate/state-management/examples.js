// ============================================================================
// State Management — Code Examples
// ============================================================================

const examples = {
  'context-redux-toolkit': [
    {
      title: "Zustand Store (Lightweight Alternative)",
      description: "Zustand as a simpler alternative to Redux.",
      language: "javascript",
      code: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        todos: [],
        addTodo: (text) =>
          set((state) => ({
            todos: [...state.todos, { id: Date.now(), text, done: false }],
          })),
        toggleTodo: (id) =>
          set((state) => ({
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, done: !t.done } : t
            ),
          })),
        removeTodo: (id) =>
          set((state) => ({
            todos: state.todos.filter((t) => t.id !== id),
          })),
        completedCount: () => get().todos.filter((t) => t.done).length,
      }),
      { name: 'todo-store' }
    )
  )
);

// Usage — no Provider needed!
function Todos() {
  const { todos, addTodo, toggleTodo } = useStore();
  return ( /* ... */ );
}`,
      explanation: "Zustand requires no Provider wrapper. The create() function returns a hook directly. Middleware like devtools and persist can be composed.",
      order_index: 1,
    },
  ],
};

export default examples;
