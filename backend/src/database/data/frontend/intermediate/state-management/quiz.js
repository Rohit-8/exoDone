// ============================================================================
// State Management — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  "context-redux-toolkit": [
    {
      question_text:
        "What is the primary performance problem with React's Context API when used for state management?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Context values are not memoized, so the Provider re-creates the value object on every render",
        "Every component that calls useContext for a context re-renders when the context value changes, even if it only uses a portion of the value",
        "Context API does not support nested providers, so all state must be in a single context",
        "useContext triggers a synchronous re-render that blocks the main thread unlike useState",
      ]),
      correct_answer:
        "Every component that calls useContext for a context re-renders when the context value changes, even if it only uses a portion of the value",
      explanation:
        "Context API has no built-in selector mechanism. When the Provider's value changes, React re-renders ALL components that subscribe to that context via useContext, regardless of which part of the value they actually use. The fix is to split monolithic contexts into separate ones (e.g., UserContext, ThemeContext) or separate state from dispatch contexts. This is why Context works well for infrequently-changing values (theme, locale) but poorly for frequently-updating application state.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "What does Redux Toolkit use internally to allow 'mutating' syntax in createSlice reducers while actually producing immutable state updates?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Lodash's cloneDeep — it deep-clones state before applying mutations",
        "Immer — it wraps state in a Proxy draft, records mutations, and produces a new immutable object",
        "Object.freeze — it freezes the state and catches mutations at runtime",
        "Immutable.js — it uses persistent data structures for structural sharing",
      ]),
      correct_answer:
        "Immer — it wraps state in a Proxy draft, records mutations, and produces a new immutable object",
      explanation:
        "Redux Toolkit integrates Immer by default. When you write state.items.push(newItem) inside a createSlice reducer, Immer creates a Proxy 'draft' of the state. All mutations are recorded on the draft, and Immer then produces a new immutable state object that structurally shares unchanged parts with the previous state. Important rule: inside a createSlice reducer, you can either mutate the draft OR return a new value, but never both.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text:
        "In Redux Toolkit's createAsyncThunk, what are the three action types automatically dispatched during the async lifecycle?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "request/success/failure — matching common REST API conventions",
        "start/resolve/error — matching JavaScript Promise terminology",
        "pending/fulfilled/rejected — matching Promise lifecycle states",
        "loading/loaded/errored — matching React Suspense conventions",
      ]),
      correct_answer:
        "pending/fulfilled/rejected — matching Promise lifecycle states",
      explanation:
        "createAsyncThunk automatically dispatches three action types: 'pending' when the async function starts, 'fulfilled' when the Promise resolves with the return value as action.payload, and 'rejected' when it throws or rejectWithValue is called. These are handled in the extraReducers builder pattern using .addCase(thunk.pending, ...), .addCase(thunk.fulfilled, ...), and .addCase(thunk.rejected, ...). The naming mirrors JavaScript Promise states.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "What is the key architectural difference between Zustand and Context API that gives Zustand better re-render performance?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Zustand uses Web Workers to offload state updates from the main thread",
        "Zustand compiles state updates at build time using a Babel plugin",
        "Zustand uses subscription-based updates — components only re-render when their selected slice of state changes, not when any part of the store changes",
        "Zustand batches all state updates into a single microtask, while Context processes each update synchronously",
      ]),
      correct_answer:
        "Zustand uses subscription-based updates — components only re-render when their selected slice of state changes, not when any part of the store changes",
      explanation:
        "Zustand's store lives outside the React tree and uses a pub/sub mechanism. When you write useTodoStore(state => state.filter), Zustand subscribes that component only to changes in the filter value. If todos changes but filter doesn't, the component won't re-render. Context API, by contrast, has no selector mechanism — any change to the Provider value triggers re-renders in all useContext consumers. This makes Zustand better suited for frequently-updating state.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "Why should server state (API-fetched data) be managed with TanStack Query or SWR instead of Redux or Context?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Redux and Context cannot handle asynchronous operations at all",
        "Server state has unique concerns — caching, background refetching, stale-while-revalidate, deduplication — that dedicated libraries handle automatically while Redux requires manual implementation",
        "TanStack Query is faster than Redux because it uses WebSocket connections by default",
        "Server state libraries are required by React 18's concurrent features and cannot work with Redux",
      ]),
      correct_answer:
        "Server state has unique concerns — caching, background refetching, stale-while-revalidate, deduplication — that dedicated libraries handle automatically while Redux requires manual implementation",
      explanation:
        "Server state is fundamentally different from client state: it's owned by a remote source, can go stale, needs caching and deduplication, and benefits from background refetching. TanStack Query and SWR handle all of these out of the box with features like staleTime, gcTime, automatic refetch on window focus, and request deduplication. While Redux CAN manage server state (via createAsyncThunk or RTK Query), mixing server and client state in the same store often leads to complexity. The modern best practice is to separate concerns: TanStack Query for server state, Redux/Zustand/Context for client state (UI preferences, form state, etc.).",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text:
        "What is the difference between the 'reducers' and 'extraReducers' fields in Redux Toolkit's createSlice?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "reducers handles synchronous actions and auto-generates action creators; extraReducers responds to actions defined outside the slice (like createAsyncThunk) and does NOT generate action creators",
        "reducers is for the initial render and extraReducers runs after hydration on the client",
        "reducers handles primitive state updates while extraReducers handles object and array mutations",
        "There is no functional difference — extraReducers is just an alias for additional reducers that don't fit in the main object",
      ]),
      correct_answer:
        "reducers handles synchronous actions and auto-generates action creators; extraReducers responds to actions defined outside the slice (like createAsyncThunk) and does NOT generate action creators",
      explanation:
        "The 'reducers' field defines actions owned by this slice — createSlice automatically generates corresponding action creators and action type strings (e.g., todosSlice.actions.addTodo). The 'extraReducers' field (using the builder pattern) lets the slice respond to actions defined elsewhere, such as createAsyncThunk lifecycle actions or actions from other slices. extraReducers does NOT generate action creators since those already exist. This separation keeps action ownership clear in large applications.",
      difficulty: "hard",
      order_index: 6,
    },
    {
      question_text:
        "What is the recommended approach to optimize Context API performance when you have values that change at different frequencies?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Wrap the entire context value in useMemo to prevent reference changes",
        "Use React.lazy to code-split components that consume context",
        "Split into multiple contexts (e.g., separate state context and dispatch context) so consumers only subscribe to what they need",
        "Use useRef instead of useState for context values to avoid triggering re-renders",
      ]),
      correct_answer:
        "Split into multiple contexts (e.g., separate state context and dispatch context) so consumers only subscribe to what they need",
      explanation:
        "The most effective Context optimization is splitting: create separate contexts for values that change at different rates. A common pattern is separating state from dispatch — components that only need to dispatch actions (e.g., a toggle button) subscribe to the DispatchContext and never re-render when state changes. While useMemo on the value helps prevent unnecessary re-renders from the Provider re-rendering, it doesn't help when the actual state changes. Context splitting directly reduces the number of consumers affected by each update.",
      difficulty: "hard",
      order_index: 7,
    },
    {
      question_text:
        "In a state management decision for a mid-size React application, which combination represents the current best practice?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Redux for everything — server data, UI state, form state, and routing state",
        "Context API for everything — it's built into React so no external dependencies are needed",
        "TanStack Query (or SWR) for server state + Zustand or Redux Toolkit for client state + useState for component-local state",
        "Recoil for all global state because atoms provide the best performance for every use case",
      ]),
      correct_answer:
        "TanStack Query (or SWR) for server state + Zustand or Redux Toolkit for client state + useState for component-local state",
      explanation:
        "Modern React architecture separates state by ownership and update frequency: (1) useState/useReducer for component-local state, (2) TanStack Query or SWR for server-owned data with automatic caching, deduplication, and background refetching, (3) Zustand or Redux Toolkit for truly global client state like UI preferences, auth tokens, or complex multi-step workflows. This layered approach avoids the 'everything in Redux' anti-pattern that leads to bloated stores and unnecessary complexity.",
      difficulty: "medium",
      order_index: 8,
    },
  ],
};

export default quiz;
