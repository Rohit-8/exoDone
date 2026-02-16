// ============================================================================
// Advanced React Patterns — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  "hoc-render-props": [
    {
      question_text:
        "What are the three critical pitfalls of Higher-Order Components, and how does each manifest as a bug or debugging problem?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "HOCs cause runtime performance degradation due to extra reconciliation, memory leaks from uncleaned event listeners, and bundle size bloat from wrapper components — these are the three issues React.memo was designed to solve",
        "HOCs lose static methods (e.g., fetchData for SSR), break ref forwarding (ref attaches to the wrapper instead of the inner component), and cause prop name collisions (two HOCs injecting the same prop name silently overwrite each other) — these require hoist-non-react-statics, React.forwardRef, and careful naming respectively",
        "HOCs cannot access React context, cannot use hooks internally, and cannot render conditionally — these limitations were introduced in React 18 as a deprecation path toward hooks",
        "HOCs create circular dependencies between modules, prevent tree-shaking by bundlers, and cause hydration mismatches in server-side rendering — these are why Next.js banned HOCs in version 13",
      ]),
      correct_answer:
        "HOCs lose static methods (e.g., fetchData for SSR), break ref forwarding (ref attaches to the wrapper instead of the inner component), and cause prop name collisions (two HOCs injecting the same prop name silently overwrite each other) — these require hoist-non-react-statics, React.forwardRef, and careful naming respectively",
      explanation:
        "The three HOC pitfalls are: (1) Static methods are lost — when withAuth wraps MyComponent, the wrapper has no access to MyComponent.fetchData (used in SSR). Fix: use hoist-non-react-statics to copy static methods to the wrapper. (2) Ref forwarding breaks — refs attach to the HOC wrapper, not the inner component. Fix: use React.forwardRef inside the HOC. (3) Prop name collisions — if withUserData injects { data } and withAnalyticsData also injects { data }, the outer HOC's value silently overwrites the inner one. This is particularly insidious because there's no error — the component just receives the wrong data. HOCs can use hooks internally (they're just function components), can access context, and don't inherently hurt performance beyond the extra wrapper layer in DevTools.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text:
        "Why must React.forwardRef be used inside a HOC to correctly pass refs, and what happens if you skip it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Without forwardRef, the ref is silently dropped and becomes null — React ignores ref props on function components because refs are not part of the props object",
        "Without forwardRef, the ref attaches to the HOC's wrapper component instead of the inner wrapped component — because React treats 'ref' as a special prop that is not included in the props object passed to the component, so {...props} inside the HOC does not forward it",
        "Without forwardRef, React throws a warning in development but the ref still works correctly in production — forwardRef only affects the development experience and DevTools display",
        "Without forwardRef, the ref creates a memory leak because it holds a reference to the wrapper component even after unmount — forwardRef includes automatic cleanup logic that prevents this",
      ]),
      correct_answer:
        "Without forwardRef, the ref attaches to the HOC's wrapper component instead of the inner wrapped component — because React treats 'ref' as a special prop that is not included in the props object passed to the component, so {...props} inside the HOC does not forward it",
      explanation:
        "React treats 'ref' (and 'key') as special props — they are NOT included in the props object. When you write <EnhancedComponent ref={myRef} />, the ref is consumed by React and attached to the EnhancedComponent instance (the HOC wrapper), not passed through to the inner component. So when the HOC does <WrappedComponent {...props} />, the ref is not in props. React.forwardRef solves this by giving the HOC access to the ref as a second argument: forwardRef((props, ref) => <WrappedComponent {...props} ref={ref} />). The ref then passes through the wrapper to the inner component. Without forwardRef on function components, React will log a warning that function components cannot receive refs — the ref becomes null, not a memory leak.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "What is the fundamental difference between the render props pattern and the function-as-children (FaCC) pattern, and why did the React community prefer render props?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Render props use a named prop (e.g., 'render') while FaCC uses 'children' as the function — the community preferred render props because named props are self-documenting, allow multiple render callbacks on one component, and work better with TypeScript typing",
        "Render props are synchronous while FaCC supports asynchronous rendering — the community preferred render props because async children cause hydration issues in server-side rendering",
        "Render props use React.cloneElement internally while FaCC calls children directly as a function — the community preferred render props because cloneElement preserves component identity for the reconciler",
        "Render props return JSX from the function while FaCC returns plain objects — the community preferred render props because JSX return values are type-checked by the compiler",
      ]),
      correct_answer:
        "Render props use a named prop (e.g., 'render') while FaCC uses 'children' as the function — the community preferred render props because named props are self-documenting, allow multiple render callbacks on one component, and work better with TypeScript typing",
      explanation:
        "Both patterns are functionally identical — a component calls a function to delegate rendering. The only difference is the prop name: render props use a named prop like 'render' or 'renderItem', while FaCC passes the function as children. The community shifted toward named render props for several reasons: (1) Named props are self-documenting — 'renderHeader' and 'renderFooter' are clearer than nesting two children functions; (2) A component can accept multiple render callbacks via different named props, while children is a single slot; (3) TypeScript can type named props more naturally — 'render: (data: T) => ReactNode' vs trying to type children as a function. Both patterns cause callback nesting when composed, which is why hooks ultimately replaced both.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "How do custom hooks solve the 'wrapper hell' and 'callback nesting' problems of HOCs and render props respectively?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Hooks solve wrapper hell by using React portals to render outside the component tree, and solve callback nesting by using Suspense boundaries to flatten async data fetching — both are features unique to the hooks API",
        "Hooks solve both problems by running logic inside the component body instead of wrapping it — there are no wrapper components in the DevTools tree (solving HOC wrapper hell), and no nested render callbacks in JSX (solving render-prop callback nesting) — the component tree stays flat while composing unlimited hooks",
        "Hooks solve wrapper hell by memoizing the HOC wrappers so only one instance exists, and solve callback nesting by using generators instead of callbacks — this flattens the call stack for better stack traces",
        "Hooks solve wrapper hell by replacing component composition with module-level singletons, and solve callback nesting by using event emitters instead of function props — both approaches avoid the React component tree entirely",
      ]),
      correct_answer:
        "Hooks solve both problems by running logic inside the component body instead of wrapping it — there are no wrapper components in the DevTools tree (solving HOC wrapper hell), and no nested render callbacks in JSX (solving render-prop callback nesting) — the component tree stays flat while composing unlimited hooks",
      explanation:
        "The key insight is that hooks move shared logic from the component tree level (wrappers around your component or nested function calls in your JSX) to the component body level (function calls at the top of your component). With HOCs: withAuth(withTheme(withLoading(Component))) creates three wrapper layers visible in DevTools. With render props: <Auth>{user => <Theme>{theme => <Loading>{...}</Loading>}</Theme>}</Auth> creates nested callbacks. With hooks: const user = useAuth(); const theme = useTheme(); const isLoading = useLoading(); — three flat function calls in the component body. No wrappers, no nesting, explicit data flow, and each hook is independently testable. Hooks don't use portals, Suspense, generators, or singletons — they're simply function calls.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "In what scenarios are HOCs and render props still preferred over custom hooks in modern React applications?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "HOCs are preferred for any component that needs memoization (React.memo is a HOC), render props are preferred for lists and virtualization — hooks cannot handle these cases because they cannot wrap components or iterate over children",
        "HOCs are still needed for error boundaries (which must be class components), wrapping class components that cannot use hooks, and library APIs like Redux connect; render props are still useful for components that need to vary their entire rendered output based on shared state — hooks cannot replace class component lifecycle methods",
        "HOCs are preferred for server components in React 19 because hooks cannot run on the server, and render props are preferred for Suspense boundaries because they provide explicit fallback rendering — hooks are client-only",
        "HOCs and render props are never preferred in modern React — they are fully deprecated as of React 18 and will cause warnings in strict mode; all code should be migrated to hooks",
      ]),
      correct_answer:
        "HOCs are still needed for error boundaries (which must be class components), wrapping class components that cannot use hooks, and library APIs like Redux connect; render props are still useful for components that need to vary their entire rendered output based on shared state — hooks cannot replace class component lifecycle methods",
      explanation:
        "HOCs and render props are NOT deprecated — they are valid patterns. HOCs remain necessary for: (1) Error boundaries — React still requires class components for componentDidCatch, so error boundary HOCs (withErrorBoundary) are common; (2) Class components — legacy class components cannot use hooks, so HOCs are the only way to inject shared logic; (3) Library APIs — Redux's connect(), React Router v5's withRouter(), and Relay's createFragmentContainer() are all HOCs still in active use. Render props are still useful when a component needs to completely change its rendered output based on shared state — the Formik <Field> component and React Spring's <Spring> component use render props effectively. React.memo is technically a HOC but it's used for performance, not logic sharing. Hooks can run in server components (useState, useEffect cannot, but custom hooks with server-compatible logic can).",
      difficulty: "medium",
      order_index: 5,
    },
  ],
  "compound-headless": [
    {
      question_text:
        "Why is the context-based compound component approach preferred over React.Children.map with cloneElement, and what specific scenarios cause cloneElement to break?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Context is preferred because it's faster — cloneElement creates a new element object for each child on every render, causing O(n) reconciliation overhead; context uses reference equality checks and only re-renders when the context value changes",
        "Context is preferred because cloneElement is fragile — it only works with direct children, so wrapping children in a Fragment, a div, a conditional, or a custom wrapper component breaks the prop injection; context works at any nesting depth regardless of DOM structure",
        "Context is preferred because cloneElement was deprecated in React 18 and removed in React 19 — using it triggers a console error and causes components to unmount unexpectedly during concurrent rendering",
        "Context is preferred because cloneElement cannot pass functions as props — it only supports serializable values like strings and numbers; context supports any JavaScript value including functions and objects",
      ]),
      correct_answer:
        "Context is preferred because cloneElement is fragile — it only works with direct children, so wrapping children in a Fragment, a div, a conditional, or a custom wrapper component breaks the prop injection; context works at any nesting depth regardless of DOM structure",
      explanation:
        "React.Children.map only iterates over direct children. If a consumer wraps the children in a Fragment (<>...</>), a div, a conditional ({showTabs && <Tab />}), or a custom layout component, cloneElement injects props into the wrong element — the Fragment or div receives activeTab/setActiveTab instead of the Tab component. This is extremely fragile because the component author cannot anticipate every way consumers will structure their JSX. Context-based compound components use React.createContext and useContext — sub-components call useContext to get the shared state, regardless of how deeply they're nested in the DOM tree. cloneElement is NOT deprecated — it still works in all React versions, and it does support functions as props. The performance difference is negligible — the real issue is robustness.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text:
        "What is the 'headless UI' concept, and how does the prop getters pattern (getTriggerProps, getItemProps) enable it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Headless UI means components without a virtual DOM — they manipulate the real DOM directly for maximum performance; prop getters return vanilla DOM attributes that bypass React's reconciliation",
        "Headless UI means components that render on the server without JavaScript — they use prop getters to generate static HTML attributes that work without client-side hydration, enabling zero-JS interactive components",
        "Headless UI means components that provide behavior (state, keyboard nav, ARIA, focus management) without prescribing markup or styles — prop getters return objects containing the correct event handlers, ARIA attributes, and refs that consumers spread onto their own elements to get accessibility and behavior for free",
        "Headless UI means components rendered in a Web Worker without access to the DOM — prop getters serialize behavior as JSON messages that are posted to the main thread and applied to DOM elements",
      ]),
      correct_answer:
        "Headless UI means components that provide behavior (state, keyboard nav, ARIA, focus management) without prescribing markup or styles — prop getters return objects containing the correct event handlers, ARIA attributes, and refs that consumers spread onto their own elements to get accessibility and behavior for free",
      explanation:
        "Headless components separate behavior from presentation. A headless dropdown hook manages open/close state, keyboard navigation (ArrowUp/Down, Enter, Escape, Home, End), focus management, outside-click dismissal, and ARIA attributes (role='listbox', aria-expanded, aria-activedescendant, aria-selected) — but it renders nothing. The prop getters pattern (popularized by Downshift) packages this behavior into spreadable objects: getTriggerProps() returns { onClick, onKeyDown, 'aria-expanded': true, role: 'combobox', ref }, getItemProps(item, index) returns { onClick, 'aria-selected': true, role: 'option', id }. The consumer spreads these onto their own elements: <button {...getTriggerProps()} className='my-styles'>. This gives full design freedom while ensuring correct accessibility. Libraries like Radix UI, Headless UI, React Aria, and Downshift all use this pattern.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "How do you build a compound component that supports both controlled and uncontrolled modes, and why is supporting both important?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Use two separate component exports — ControlledTabs and UncontrolledTabs — each optimized for its mode; supporting both is important because controlled components are faster but uncontrolled components are easier to use",
        "Check if a 'value' prop is provided: if yes, use it as the source of truth (controlled); if no, use internal useState (uncontrolled); always call onChange — supporting both modes lets simple consumers use the component without state management while advanced consumers retain full control over the value",
        "Use useRef to store the value in uncontrolled mode and useState in controlled mode, switching between them based on a 'mode' prop — supporting both is important because refs don't cause re-renders, making uncontrolled mode more performant",
        "Use useSyncExternalStore to synchronize between internal and external state automatically — the component detects which mode to use based on whether the parent component has a useState call in its body",
      ]),
      correct_answer:
        "Check if a 'value' prop is provided: if yes, use it as the source of truth (controlled); if no, use internal useState (uncontrolled); always call onChange — supporting both modes lets simple consumers use the component without state management while advanced consumers retain full control over the value",
      explanation:
        "The pattern is: const isControlled = controlledValue !== undefined; const activeValue = isControlled ? controlledValue : internalValue; When the user interacts, update internal state only if uncontrolled, and always fire onChange: const setValue = (newVal) => { if (!isControlled) setInternalValue(newVal); onChange?.(newVal); }. This mirrors how HTML inputs work — <input value={x} onChange={fn} /> is controlled, <input defaultValue={x} /> is uncontrolled. Supporting both is important because: (1) Simple use cases (90% of consumers) just want <Tabs defaultValue='a'> without managing state; (2) Advanced use cases need <Tabs value={tab} onChange={setTab}> to synchronize with URL params, analytics, or other state. You do NOT need two separate exports, a 'mode' prop, or useSyncExternalStore — the undefined check is the standard approach used by Radix, Headless UI, and MUI.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "What is the state reducer pattern, and how does it differ from simply exposing an onStateChange callback?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The state reducer pattern replaces the component's internal useReducer with the consumer's reducer, allowing complete control over state transitions including the ability to block, modify, or add side effects to any action — onStateChange only notifies after the state has already changed and cannot prevent or modify the transition",
        "The state reducer pattern and onStateChange are identical in capability — both let consumers react to state changes; the only difference is syntax: reducers use switch statements while callbacks use if/else",
        "The state reducer pattern uses Redux middleware internally, allowing consumers to apply any Redux middleware (thunk, saga, etc.) to the component's state — onStateChange cannot integrate with Redux",
        "The state reducer pattern exposes the component's state as an observable stream, allowing consumers to use RxJS operators to transform state transitions — onStateChange is a simpler callback-based alternative for projects not using RxJS",
      ]),
      correct_answer:
        "The state reducer pattern replaces the component's internal useReducer with the consumer's reducer, allowing complete control over state transitions including the ability to block, modify, or add side effects to any action — onStateChange only notifies after the state has already changed and cannot prevent or modify the transition",
      explanation:
        "The key difference is timing and control. onStateChange fires AFTER the state has already changed — the consumer can react to it but cannot prevent or modify the transition. The state reducer pattern gives the consumer's function control OVER the transition itself — it receives (currentState, action) and returns the new state. The consumer can: (1) Block an action by returning the current state unchanged — e.g., preventing close when a form is dirty; (2) Modify the resulting state — e.g., capping a counter at a maximum value; (3) Change the action type — e.g., converting a TOGGLE to an OPEN when in a specific state; (4) Add computed properties to the state. This is an inversion of control technique — instead of the component author adding props for every edge case (preventClose, maxCount, requireConfirmation), they expose a single reducer prop. The pattern doesn't use Redux, observables, or middleware — it's a plain function passed as a prop.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "How do compound components like Radix UI's Dialog.Root / Dialog.Trigger / Dialog.Content maintain correct ARIA relationships (aria-controls, aria-labelledby) between sub-components that may be rendered in different DOM locations via portals?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "They use DOM traversal (querySelector, closest) at runtime to find sibling elements with matching data attributes, then dynamically set ARIA attributes via direct DOM manipulation outside of React's control",
        "They generate shared IDs (via useId or a counter) stored in the compound component's context — each sub-component reads the shared ID from context to set its own ARIA attributes (e.g., Trigger sets aria-controls={contentId}, Content sets id={contentId} and aria-labelledby={titleId}) regardless of where they render in the DOM",
        "They use React's experimental useEvent hook to create stable references between components, which React automatically converts to ARIA relationship attributes during the commit phase",
        "They rely on the browser's native accessibility tree to infer relationships based on the visual layout — if a button visually opens a dialog, screen readers automatically associate them without explicit ARIA attributes",
      ]),
      correct_answer:
        "They generate shared IDs (via useId or a counter) stored in the compound component's context — each sub-component reads the shared ID from context to set its own ARIA attributes (e.g., Trigger sets aria-controls={contentId}, Content sets id={contentId} and aria-labelledby={titleId}) regardless of where they render in the DOM",
      explanation:
        "Compound components use React Context to share generated IDs between sub-components. The Root component generates unique IDs (using React's useId hook or a UUID/counter) and stores them in context: { triggerId, contentId, titleId, descriptionId }. Dialog.Trigger reads triggerId and contentId from context and renders: <button id={triggerId} aria-controls={contentId} aria-expanded={isOpen}>. Dialog.Content (which may render in a portal at the end of <body>) reads the same IDs: <div id={contentId} role='dialog' aria-labelledby={titleId} aria-modal='true'>. Because ARIA attributes reference IDs (not DOM positions), the relationships are correct even when the content is portaled to a different DOM location. This is why the context-based approach is essential — cloneElement would fail with portals because the content is not a direct child of the root.",
      difficulty: "hard",
      order_index: 5,
    },
  ],
};

export default quiz;
