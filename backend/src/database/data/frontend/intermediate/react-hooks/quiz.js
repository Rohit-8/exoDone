const quiz = {
  "usestate-useeffect": [
    {
      question_text:
        "What is the output of calling setCount(count + 1) three times in a row inside a single event handler, when count is currently 0?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "count becomes 3 because React processes each call sequentially",
        "count becomes 1 because all three calls capture the same stale closure value of 0",
        "count becomes 2 because React batches the first two and processes the third",
        "It throws an error because you cannot call setState multiple times in one handler",
      ]),
      correct_answer:
        "count becomes 1 because all three calls capture the same stale closure value of 0",
      explanation:
        "When you pass a direct value to setState (like count + 1), the value of 'count' is captured from the closure at render time. All three calls see count as 0 and set it to 0 + 1 = 1. To fix this, use the functional updater form: setCount(prev => prev + 1), where each updater receives the pending state from the previous update in the queue.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "What is the primary purpose of returning a cleanup function from useEffect?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "To run code before the component mounts for the first time",
        "To cancel or clean up the previous effect before the next one runs and when the component unmounts",
        "To optimize performance by caching the effect's return value",
        "To signal to React that the effect has completed successfully",
      ]),
      correct_answer:
        "To cancel or clean up the previous effect before the next one runs and when the component unmounts",
      explanation:
        "The cleanup function runs in two scenarios: (1) before the effect re-executes due to a dependency change, and (2) when the component unmounts. This is essential for preventing memory leaks by unsubscribing from event listeners, clearing timers, closing WebSocket connections, and aborting in-flight fetch requests via AbortController.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text:
        "Why does React 18 Strict Mode run useEffect twice on mount in development?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It's a bug in React 18 that was later fixed in a patch release",
        "To deliberately expose missing cleanup functions and impure effects by simulating an unmount-remount cycle",
        "To pre-cache the effect result for faster subsequent renders",
        "To ensure the effect works correctly in both server-side and client-side rendering",
      ]),
      correct_answer:
        "To deliberately expose missing cleanup functions and impure effects by simulating an unmount-remount cycle",
      explanation:
        "Strict Mode intentionally mounts, unmounts, and remounts components to surface bugs. If your effect creates a subscription without a cleanup, the double-fire makes the bug visible (e.g., duplicate listeners). The fix is always to add proper cleanup — never to remove Strict Mode. This behavior only happens in development and does not affect production builds.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "Which of the following is an example of an unnecessary useEffect (the 'You Might Not Need an Effect' anti-pattern)?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Using useEffect to set up a WebSocket connection when a component mounts",
        "Using useEffect with a cleanup function to subscribe to a browser resize event",
        "Using useEffect to compute fullName from firstName and lastName state and store it in another state variable",
        "Using useEffect with AbortController to fetch data when a userId prop changes",
      ]),
      correct_answer:
        "Using useEffect to compute fullName from firstName and lastName state and store it in another state variable",
      explanation:
        "Computing derived values like fullName = firstName + ' ' + lastName should be done directly during render, not in an effect. Using useEffect to sync derived state causes an unnecessary extra render cycle: render then effect fires then setState then re-render. Simply declare 'const fullName = firstName + \" \" + lastName' at the top of the component. useEffect should only be used for synchronization with external systems (DOM APIs, network, subscriptions).",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "What is the correct way to pass an expensive computation as the initial value to useState?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "useState(expensiveFunction()) — call it directly so the value is ready immediately",
        "useState(() => expensiveFunction()) — pass a function so it only runs on the first render",
        "useState(useMemo(() => expensiveFunction(), [])) — wrap it in useMemo for caching",
        "useState(useRef(expensiveFunction()).current) — store in a ref to avoid re-computation",
      ]),
      correct_answer:
        "useState(() => expensiveFunction()) — pass a function so it only runs on the first render",
      explanation:
        "When you pass a function to useState (lazy initialization), React only calls it during the initial render and ignores it on subsequent renders. If you pass expensiveFunction() directly, the function executes on every render even though useState discards the returned value after the first render. This is a subtle but important performance optimization for initial values derived from localStorage, URL parsing, or complex computations.",
      difficulty: "medium",
      order_index: 5,
    },
  ],

  "useref-usememo-usecallback": [
    {
      question_text:
        "What happens when you mutate the .current property of a useRef object?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The component re-renders with the new value, similar to setState",
        "The value is updated but the component does NOT re-render",
        "React throws a warning because refs should be treated as immutable",
        "The change is batched and applied on the next render cycle",
      ]),
      correct_answer:
        "The value is updated but the component does NOT re-render",
      explanation:
        "Unlike state, mutating ref.current does not trigger a re-render. This is by design — useRef is meant for mutable values that persist across renders without causing updates. Common uses include storing timer IDs, previous values, DOM nodes, and WebSocket instances. If you need the UI to reflect a changed value, use useState instead.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "In the usePrevious custom hook pattern, why does it work correctly — returning the previous render's value during the current render?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "useRef stores values in a separate memory space that is one render cycle behind",
        "useEffect runs AFTER render, so during the current render ref.current still holds the old value, and the effect updates it post-render",
        "React's reconciler automatically delays ref updates by one render cycle",
        "The hook uses a closure that captures the previous render's scope variables",
      ]),
      correct_answer:
        "useEffect runs AFTER render, so during the current render ref.current still holds the old value, and the effect updates it post-render",
      explanation:
        "The pattern works because of useEffect's timing. During render, ref.current still holds whatever was assigned in the previous render's effect. After the current render is committed to the DOM, the effect runs and updates ref.current to the new value. This means the returned ref.current is always 'one step behind' — exactly the previous render's value.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "When is useCallback actually beneficial for performance?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Always — every function passed as a prop should be wrapped in useCallback",
        "Only when the function is passed as a prop to a child component wrapped in React.memo",
        "Only for event handlers that modify state, to prevent double-firing",
        "Only inside useEffect dependency arrays to prevent infinite loops",
      ]),
      correct_answer:
        "Only when the function is passed as a prop to a child component wrapped in React.memo",
      explanation:
        "useCallback stabilizes a function reference across renders. This is only useful when combined with React.memo on the receiving component. Without React.memo, the child re-renders whenever its parent re-renders regardless of prop changes, making useCallback pointless. useCallback has its own overhead (storing the function and comparing deps), so using it everywhere is premature optimization that adds complexity without benefit.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "What is the relationship between useMemo and useCallback?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "useMemo caches primitive values while useCallback caches object values",
        "useCallback(fn, deps) is equivalent to useMemo(() => fn, deps) — useCallback memoizes the function itself",
        "useMemo runs during render while useCallback runs after render like useEffect",
        "They are unrelated hooks that solve completely different problems",
      ]),
      correct_answer:
        "useCallback(fn, deps) is equivalent to useMemo(() => fn, deps) — useCallback memoizes the function itself",
      explanation:
        "useCallback is syntactic sugar for a specific use case of useMemo. useMemo(() => fn, deps) returns fn (the function itself, not its return value), which is exactly what useCallback(fn, deps) does. The difference is semantic clarity: useMemo is for caching computed values, useCallback is for caching function references. Both run during render and use the same dependency comparison logic.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "Which statement about useMemo is TRUE according to the React documentation?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "React guarantees the memoized value will never be recalculated unless dependencies change",
        "React may discard memoized values at its discretion, so code must work correctly without useMemo",
        "useMemo values are shared across all instances of the same component",
        "useMemo prevents the component from re-rendering when its dependencies change",
      ]),
      correct_answer:
        "React may discard memoized values at its discretion, so code must work correctly without useMemo",
      explanation:
        "The React docs explicitly state that useMemo is a performance optimization, not a semantic guarantee. React may choose to forget previously memoized values (e.g., to free memory for offscreen components). Your application must function correctly even if useMemo recalculates on every render — it should only affect performance, never correctness. This is why useMemo should not be used for side effects or as a substitute for proper memoization patterns.",
      difficulty: "hard",
      order_index: 5,
    },
  ],

  "usereducer-usecontext": [
    {
      question_text:
        "When should you prefer useReducer over useState?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Whenever you have more than one state variable in a component",
        "When state is an object with multiple sub-values and transitions involve complex logic or depend on previous state",
        "Only when you need global state management across multiple components",
        "When you want to avoid re-renders caused by state updates",
      ]),
      correct_answer:
        "When state is an object with multiple sub-values and transitions involve complex logic or depend on previous state",
      explanation:
        "useReducer shines when you have complex state objects with multiple fields that are updated by different actions, especially when the next state depends on the previous state in non-trivial ways. It centralizes all state transition logic in a pure reducer function that is easy to test and reason about. useState is perfectly fine for simple primitives or when you have a few independent state variables.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "What is the biggest performance concern when using useContext?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Creating a context is expensive and should be done outside the module scope",
        "Every component that calls useContext for a given context re-renders whenever that context's value changes, even if the component only uses a subset of the value",
        "useContext bypasses React's virtual DOM diffing, causing direct DOM mutations",
        "Context values are deeply compared on every render, which is O(n) for large objects",
      ]),
      correct_answer:
        "Every component that calls useContext for a given context re-renders whenever that context's value changes, even if the component only uses a subset of the value",
      explanation:
        "React does not have built-in selector support for context. When a context value changes, ALL components consuming that context re-render — even if they only use one property of the value object. This is why context splitting (separate contexts for separate concerns) and memoizing context values with useMemo are important optimization techniques. Libraries like Zustand use subscriptions instead of context to enable granular updates.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "Why is splitting context into separate StateContext and DispatchContext a recommended pattern?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Because React does not allow passing both state and functions in the same context value",
        "Because dispatch is referentially stable (never changes), so components that only dispatch won't re-render when state changes",
        "Because it enables concurrent rendering mode which is disabled with a single context",
        "Because it allows the reducer to access both contexts simultaneously for complex state transitions",
      ]),
      correct_answer:
        "Because dispatch is referentially stable (never changes), so components that only dispatch won't re-render when state changes",
      explanation:
        "React guarantees that the dispatch function returned by useReducer has a stable identity — it never changes across renders. By putting dispatch in a separate context, components that only need to trigger actions (like buttons and forms) can consume DispatchContext without subscribing to state changes. This prevents unnecessary re-renders in those components when state updates. Only components that read state (via StateContext) will re-render.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "What is the purpose of the custom hook pattern 'throw new Error if context is undefined' when building a context provider?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "To prevent the application from crashing silently when context is null",
        "To provide a clear developer error message when useContext is called outside its corresponding Provider",
        "To enforce that the provider renders before any consumer during server-side rendering",
        "To enable TypeScript to infer the correct non-null type for the context value",
      ]),
      correct_answer:
        "To provide a clear developer error message when useContext is called outside its corresponding Provider",
      explanation:
        "Without this check, using a context hook outside its provider returns undefined (or the default value), leading to confusing 'Cannot read property of undefined' errors far from the actual mistake. By checking for undefined and throwing a descriptive error like 'useAuth must be used within an AuthProvider', you give developers an immediately actionable error message. This is considered a best practice in every production context implementation.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "When should you consider replacing useReducer + useContext with an external state management library like Redux or Zustand?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "As soon as you have more than two contexts in your application",
        "When you need middleware, DevTools with time-travel debugging, or granular subscription-based updates at scale",
        "When your application has more than 10 components consuming the same context",
        "When you need to persist state to localStorage or handle async operations",
      ]),
      correct_answer:
        "When you need middleware, DevTools with time-travel debugging, or granular subscription-based updates at scale",
      explanation:
        "useReducer + useContext works well for moderate complexity, but has limitations: no built-in middleware pipeline (logging, async thunks, undo/redo), no DevTools with time-travel debugging, and the context re-render-all-consumers problem limits scalability. Libraries like Zustand use subscriptions for granular updates (only components using changed values re-render), and Redux offers a mature middleware ecosystem. The pragmatic approach is to start with built-in hooks and reach for a library only when you hit concrete limitations.",
      difficulty: "medium",
      order_index: 5,
    },
  ],
};

export default quiz;
