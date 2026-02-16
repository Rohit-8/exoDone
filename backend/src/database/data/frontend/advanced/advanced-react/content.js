// ============================================================================
// Advanced React Patterns — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "Advanced React Patterns",
  slug: "advanced-react",
  description:
    "Master higher-order components, render props, compound components, and headless UI architecture.",
  estimated_time: 200,
  order_index: 7,
};

export const lessons = [
  {
    title: "Higher-Order Components & Render Props",
    slug: "hoc-render-props",
    summary:
      "Master the HOC and render-props patterns — how they work, their pitfalls, and why custom hooks replaced them.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 1,
    key_points: [
      "HOC pattern: a function that takes a component and returns a new enhanced component — used for cross-cutting concerns like auth (withAuth), loading (withLoading), theming (withTheme), and analytics (withTracking)",
      "HOC pitfalls: wrapper hell (deeply nested React DevTools trees), lost static methods (must be copied via hoist-non-react-statics), prop name collisions (two HOCs injecting the same prop name), and opaque data flow (hard to trace where a prop originates)",
      "Ref forwarding with HOCs: React.forwardRef is required because refs are not passed through like regular props — without it, the ref attaches to the wrapper component instead of the inner component",
      "Render props pattern: a component receives a function prop that it calls with shared state/behavior, giving the consumer full control over what gets rendered — explicit data flow at the cost of nesting",
      "Function as children (FaCC): a variant of render props where the function is passed as children instead of a named prop — e.g., <Mouse>{({ x, y }) => <Cursor x={x} y={y} />}</Mouse>",
      "HOC composition pitfalls: compose(withAuth, withLoading, withTheme)(Component) creates multiple wrapper layers, each with its own state and lifecycle — making debugging, testing, and performance profiling harder",
      "Replacing HOC and render props with custom hooks: hooks provide the same logic reuse with flat component trees, composable calls, and explicit data flow — useAuth(), useLoading(), useTheme() are simpler and more testable",
      "Comparison table: HOCs wrap components (implicit injection), render props pass functions (explicit but nested), hooks call functions (explicit and flat) — hooks are preferred for new code, but HOCs/render-props appear in legacy codebases and libraries",
    ],
    content: `
# Higher-Order Components & Render Props

Higher-Order Components (HOCs) and render props were the primary patterns for logic reuse in React before hooks. While hooks have largely replaced them, these patterns remain prevalent in legacy codebases, popular libraries (React Router v5, Redux \\\`connect\\\`, Relay), and interview questions. Understanding their mechanics, trade-offs, and migration paths is essential.

---

## Higher-Order Components (HOC)

### The Pattern

A HOC is a **function** that takes a component and returns a **new component** with enhanced behavior. It follows the decorator pattern from object-oriented programming — adding functionality without modifying the original component.

\\\`\\\`\\\`jsx
// Generic HOC structure
function withEnhancement(WrappedComponent) {
  return function EnhancedComponent(props) {
    // 1. Add state, effects, or logic
    // 2. Pass extra props to WrappedComponent
    return <WrappedComponent {...props} extraProp={value} />;
  };
}

const Enhanced = withEnhancement(BaseComponent);
\\\`\\\`\\\`

The naming convention \\\`with*\\\` signals that the function is a HOC.

### Real-World HOC: withAuth

\\\`\\\`\\\`jsx
function withAuth(WrappedComponent, { requiredRole = null } = {}) {
  function AuthenticatedComponent(props) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <LoadingSpinner />;
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: props.location }} />;
    if (requiredRole && user.role !== requiredRole) {
      return <ForbiddenPage requiredRole={requiredRole} currentRole={user.role} />;
    }

    return <WrappedComponent {...props} user={user} />;
  }

  // Preserve the display name for React DevTools
  AuthenticatedComponent.displayName =
    \\\`withAuth(\\\${WrappedComponent.displayName || WrappedComponent.name || 'Component'})\\\`;

  return AuthenticatedComponent;
}

// Usage
const AdminDashboard = withAuth(AdminDashboardContent, { requiredRole: 'admin' });
const UserProfile = withAuth(UserProfileContent);
\\\`\\\`\\\`

### Real-World HOC: withLoading

\\\`\\\`\\\`jsx
function withLoading(WrappedComponent, { loadingProp = 'isLoading', errorProp = 'error' } = {}) {
  function LoadingComponent(props) {
    const isLoading = props[loadingProp];
    const error = props[errorProp];

    if (isLoading) {
      return (
        <div className="loading-container" role="status" aria-label="Loading">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container" role="alert">
          <p>Something went wrong: {error.message}</p>
          <button onClick={props.onRetry}>Retry</button>
        </div>
      );
    }

    // Strip loading/error props before passing to wrapped component
    const { [loadingProp]: _loading, [errorProp]: _error, ...rest } = props;
    return <WrappedComponent {...rest} />;
  }

  LoadingComponent.displayName =
    \\\`withLoading(\\\${WrappedComponent.displayName || WrappedComponent.name || 'Component'})\\\`;

  return LoadingComponent;
}

const UserListWithLoading = withLoading(UserList);
// <UserListWithLoading isLoading={loading} error={error} users={users} onRetry={refetch} />
\\\`\\\`\\\`

### Real-World HOC: withTheme

\\\`\\\`\\\`jsx
function withTheme(WrappedComponent) {
  function ThemedComponent(props) {
    const theme = useContext(ThemeContext);
    return <WrappedComponent {...props} theme={theme} />;
  }

  ThemedComponent.displayName =
    \\\`withTheme(\\\${WrappedComponent.displayName || WrappedComponent.name || 'Component'})\\\`;

  return ThemedComponent;
}

const ThemedButton = withTheme(Button);
// Inside Button: props.theme.colors.primary
\\\`\\\`\\\`

---

## HOC Pitfalls

### 1. Wrapper Hell

Composing multiple HOCs creates deeply nested component trees:

\\\`\\\`\\\`jsx
// Nightmare in React DevTools
const EnhancedComponent = withAuth(
  withLoading(
    withTheme(
      withTracking(
        withErrorBoundary(BaseComponent)
      )
    )
  )
);
// DevTools shows: AuthWrapper > LoadingWrapper > ThemeWrapper > TrackingWrapper > ErrorBoundary > BaseComponent
\\\`\\\`\\\`

This makes debugging difficult because you must navigate through multiple wrapper layers to find the actual component.

### 2. Ref Forwarding Problems

Refs do **not** pass through HOCs like regular props. Without \\\`React.forwardRef\\\`, the ref attaches to the outermost wrapper:

\\\`\\\`\\\`jsx
// BROKEN: ref points to the HOC wrapper, not the inner input
const EnhancedInput = withLoading(TextInput);
const inputRef = useRef(null);
<EnhancedInput ref={inputRef} /> // ref.current is the LoadingComponent, NOT the TextInput

// FIXED: Use React.forwardRef inside the HOC
function withLoading(WrappedComponent) {
  const LoadingComponent = React.forwardRef(function LoadingComponent(props, ref) {
    if (props.isLoading) return <LoadingSpinner />;
    return <WrappedComponent {...props} ref={ref} />;
  });

  LoadingComponent.displayName =
    \\\`withLoading(\\\${WrappedComponent.displayName || WrappedComponent.name || 'Component'})\\\`;

  return LoadingComponent;
}
\\\`\\\`\\\`

**Interview tip:** "Refs are not regular props — they're handled specially by React. HOCs must use React.forwardRef to thread the ref through to the wrapped component, or consumers cannot imperatively access the inner component's DOM node."

### 3. Static Methods Are Lost

When a HOC wraps a component, the wrapper does not automatically inherit static methods:

\\\`\\\`\\\`jsx
function MyComponent() { return <div />; }
MyComponent.fetchData = async () => { /* server-side data fetching */ };

const Enhanced = withAuth(MyComponent);
Enhanced.fetchData; // undefined! Static method is lost.

// Fix: use hoist-non-react-statics
import hoistNonReactStatics from 'hoist-non-react-statics';

function withAuth(WrappedComponent) {
  function AuthWrapper(props) { /* ... */ }
  hoistNonReactStatics(AuthWrapper, WrappedComponent);
  return AuthWrapper;
}
\\\`\\\`\\\`

### 4. Prop Name Collisions

Two HOCs might inject a prop with the same name, causing silent overwrites:

\\\`\\\`\\\`jsx
// Both inject a 'data' prop — the outer HOC's value wins
const Enhanced = withUserData(withAnalyticsData(Component));
// Component receives: { data: analyticsData } — userData is lost!
\\\`\\\`\\\`

---

## Render Props Pattern

### The Core Idea

Instead of wrapping a component, a render-prop component **delegates rendering** to a function it receives as a prop. This makes data flow explicit.

\\\`\\\`\\\`jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return render(position);
}

// Usage — consumer controls the rendering
<MouseTracker render={({ x, y }) => (
  <div>
    <h2>Mouse Position</h2>
    <p>X: {x}, Y: {y}</p>
    <div style={{ position: 'absolute', left: x, top: y, width: 20, height: 20,
                  borderRadius: '50%', background: 'red' }} />
  </div>
)} />
\\\`\\\`\\\`

### Function as Children (FaCC)

A variant where the render function is passed as \\\`children\\\`:

\\\`\\\`\\\`jsx
function DataFetcher({ url, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false); })
      .catch(err => { setError(err); setLoading(false); });
  }, [url]);

  return children({ data, loading, error });
}

// Usage
<DataFetcher url="/api/users">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    return <UserList users={data} />;
  }}
</DataFetcher>
\\\`\\\`\\\`

### Render Props vs HOCs

| Aspect | HOC | Render Props |
|--------|-----|-------------|
| Data flow | Implicit (injected as props) | Explicit (passed via function args) |
| Nesting | Wrapper layers in DevTools | Callback nesting in JSX |
| Composition | \\\`compose(withA, withB)(Comp)\\\` | Nested render functions |
| Type safety | Harder to type (prop merging) | Easier to type (function signature) |
| Static analysis | Props appear from nowhere | Clear data origin |

---

## Replacing HOCs and Render Props with Custom Hooks

Custom hooks offer the same logic reuse with **none** of the drawbacks:

\\\`\\\`\\\`jsx
// ── Before: HOC ──
const EnhancedProfile = withAuth(withTheme(withTracking(ProfilePage)));

// ── Before: Render Props ──
<Auth>{(user) =>
  <Theme>{(theme) =>
    <Tracking>{(track) =>
      <ProfilePage user={user} theme={theme} track={track} />
    }</Tracking>
  }</Theme>
}</Auth>

// ── After: Custom Hooks — flat, explicit, composable ──
function ProfilePage() {
  const { user } = useAuth();
  const theme = useTheme();
  const { track } = useTracking();

  return (
    <div style={{ color: theme.text }}>
      <h1>{user.name}</h1>
      <button onClick={() => track('click', 'edit-profile')}>Edit</button>
    </div>
  );
}
\\\`\\\`\\\`

### Why Hooks Win

1. **Flat component tree** — no wrapper components in DevTools
2. **Explicit data flow** — you see exactly what each hook returns
3. **Composable** — combine multiple hooks in a single component
4. **Testable** — test hooks independently with \\\`renderHook\\\` from Testing Library
5. **No prop collisions** — you name the return values yourself
6. **No ref forwarding issues** — hooks don't wrap components
7. **No static method problems** — hooks don't create wrapper components

### When HOCs and Render Props Are Still Useful

- **Legacy codebases** — migrating all at once is impractical
- **Class components** — can't use hooks, so HOCs/render-props are the only option
- **Library APIs** — some libraries still expose HOC/render-prop APIs (e.g., Formik's \\\`<Field>\\\`, React Router v5's \\\`withRouter\\\`)
- **Error boundaries** — must be class components, often wrapped with HOCs
- **Code splitting** — React.lazy returns components, not hooks

**Interview tip:** "Hooks replaced HOCs and render props for logic reuse in function components. They provide the same capabilities — shared state, effects, and behavior — but with flat component trees, explicit data flow, and better composability. I still recognize HOC and render-prop patterns in legacy code and know how to migrate them to hooks."
`,
  },
  {
    title: "Compound Components & Headless UI",
    slug: "compound-headless",
    summary:
      "Build flexible, composable UI APIs with the compound component pattern and headless component architecture.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 2,
    key_points: [
      "Compound components pattern: a set of components (e.g., Tab/TabList/TabPanel, Accordion/Item/Trigger/Content, Select/Option) that share implicit state via a parent — the consumer controls layout and rendering while the parent manages behavior",
      "React.Children and cloneElement approach: iterating over children to inject props via cloneElement — simple but fragile because it breaks if children are wrapped in fragments, divs, or intermediary components",
      "Context-based compound components (preferred): the parent provides state via React Context, and sub-components consume it — this approach is resilient to DOM structure changes and works with any nesting depth",
      "Headless UI concept: components / hooks that provide behavior (state management, keyboard navigation, ARIA attributes, focus management) without prescribing markup or styles — the consumer brings their own UI",
      "Building headless hooks: useToggle (open/close/toggle state), useDropdown (isOpen, selectedItem, keyboard navigation, focus management), useModal (open/close, focus trap, escape key, scroll lock, portal rendering)",
      "Radix UI and Headless UI library examples: pre-built headless components with full accessibility — Radix uses the compound component pattern with unstyled primitives; Headless UI by Tailwind Labs provides accessible components designed for Tailwind CSS",
      "Controlled vs uncontrolled compound components: uncontrolled components manage their own state internally (defaultValue, defaultOpen); controlled components accept value/onChange from the parent — supporting both gives consumers maximum flexibility",
      "Prop getters and state reducer patterns: prop getters (getToggleProps, getItemProps) return the correct props for a given element including event handlers and ARIA attributes; state reducers let consumers customize internal state transitions by intercepting the reducer",
    ],
    content: `
# Compound Components & Headless UI

Compound components and headless UI are the crown jewels of advanced React component API design. They separate **what** a component does from **how** it looks, giving consumers maximum flexibility while maintaining correctness. Libraries like Radix UI, Headless UI, Reach UI, and Downshift popularized these patterns — and interviewers love asking about them.

---

## Compound Components Pattern

### The Concept

Just like HTML's \\\`<select>\\\` and \\\`<option>\\\` work together implicitly (the select manages state, options register themselves), compound components are a **group of components** that share implicit state to form a cohesive API.

\\\`\\\`\\\`jsx
// Consumer API — clean, declarative, flexible
<Tabs defaultValue="code">
  <Tabs.List>
    <Tabs.Tab value="code">Code</Tabs.Tab>
    <Tabs.Tab value="preview">Preview</Tabs.Tab>
    <Tabs.Tab value="tests">Tests</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="code"><CodeEditor /></Tabs.Panel>
  <Tabs.Panel value="preview"><Preview /></Tabs.Panel>
  <Tabs.Panel value="tests"><TestRunner /></Tabs.Panel>
</Tabs>
\\\`\\\`\\\`

The consumer doesn't import state, pass callbacks, or wire anything manually — the implicit state sharing makes the API clean and hard to misuse.

---

## Approach 1: React.Children & cloneElement

The original approach uses \\\`React.Children.map\\\` and \\\`React.cloneElement\\\` to inject props into children:

\\\`\\\`\\\`jsx
function Tabs({ children, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className="tabs">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        // Inject state into each child via cloneElement
        return React.cloneElement(child, { activeTab, setActiveTab });
      })}
    </div>
  );
}

function TabList({ children, activeTab, setActiveTab }) {
  return (
    <div role="tablist">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

function Tab({ value, children, activeTab, setActiveTab }) {
  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}
\\\`\\\`\\\`

### Why cloneElement Is Fragile

\\\`\\\`\\\`jsx
// ❌ This BREAKS — Fragment prevents cloneElement from reaching Tab components
<Tabs defaultValue="a">
  <>
    <Tab value="a">A</Tab>
    <Tab value="b">B</Tab>
  </>
</Tabs>

// ❌ This BREAKS — wrapper div is not a Tab, so cloneElement injects wrong props
<Tabs defaultValue="a">
  <div className="wrapper">
    <Tab value="a">A</Tab>
  </div>
</Tabs>
\\\`\\\`\\\`

**Interview tip:** "cloneElement-based compound components are simple but fragile. They break when children are wrapped in fragments or divs. The context-based approach is preferred because it works regardless of DOM structure or nesting depth."

---

## Approach 2: Context-Based Compound Components (Preferred)

Using React Context makes the compound component resilient to any DOM structure:

\\\`\\\`\\\`jsx
const AccordionContext = createContext(null);
const ItemContext = createContext(null);

// ── Custom hook with safety check ──
function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion sub-components must be used within <Accordion>');
  return ctx;
}

function useItem() {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error('Item sub-components must be used within <Accordion.Item>');
  return ctx;
}

// ── Parent: manages state ──
function Accordion({ children, multiple = false, defaultOpen = [] }) {
  const [openItems, setOpenItems] = useState(() => new Set(defaultOpen));

  const toggle = useCallback((id) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  }, [multiple]);

  const isOpen = useCallback((id) => openItems.has(id), [openItems]);

  const value = useMemo(() => ({ toggle, isOpen }), [toggle, isOpen]);

  return (
    <AccordionContext.Provider value={value}>
      <div className="accordion" role="region">{children}</div>
    </AccordionContext.Provider>
  );
}

// ── Item: provides its ID to descendants ──
Accordion.Item = function AccordionItem({ children, id }) {
  const itemId = id || useId();
  return (
    <ItemContext.Provider value={itemId}>
      <div className="accordion-item">{children}</div>
    </ItemContext.Provider>
  );
};

// ── Trigger: toggles this item ──
Accordion.Trigger = function AccordionTrigger({ children }) {
  const { toggle, isOpen } = useAccordion();
  const itemId = useItem();

  return (
    <button
      className="accordion-trigger"
      onClick={() => toggle(itemId)}
      aria-expanded={isOpen(itemId)}
      aria-controls={\\\`panel-\\\${itemId}\\\`}
    >
      {children}
      <span aria-hidden>{isOpen(itemId) ? '−' : '+'}</span>
    </button>
  );
};

// ── Content: conditionally renders ──
Accordion.Content = function AccordionContent({ children }) {
  const { isOpen } = useAccordion();
  const itemId = useItem();

  if (!isOpen(itemId)) return null;

  return (
    <div className="accordion-content" id={\\\`panel-\\\${itemId}\\\`} role="region">
      {children}
    </div>
  );
};
\\\`\\\`\\\`

### Usage — Works with Any Nesting

\\\`\\\`\\\`jsx
<Accordion multiple defaultOpen={['faq-1']}>
  {/* Wrapped in a div — still works! */}
  <div className="faq-section">
    <h2>General</h2>
    <Accordion.Item id="faq-1">
      <Accordion.Trigger>What is React?</Accordion.Trigger>
      <Accordion.Content>
        <p>A JavaScript library for building user interfaces.</p>
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item id="faq-2">
      <Accordion.Trigger>What are hooks?</Accordion.Trigger>
      <Accordion.Content>
        <p>Functions that let you use state and effects in function components.</p>
      </Accordion.Content>
    </Accordion.Item>
  </div>
</Accordion>
\\\`\\\`\\\`

---

## Headless UI Concept

Headless components provide **behavior without styles** — logic, state management, keyboard navigation, ARIA attributes, and focus management — while the consumer provides the markup and styling.

### Why Headless?

| Traditional Component Library | Headless Approach |
|------|------|
| Ships with fixed markup + CSS | Ships only behavior + ARIA |
| Hard to customize visually | Full design freedom |
| CSS override battles | No CSS to override |
| Large bundle (includes styles) | Tiny bundle (logic only) |
| Looks the same in every app | Matches your design system |

### Building Headless Hooks

#### useToggle

\\\`\\\`\\\`jsx
function useToggle(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const handlers = useMemo(() => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    set: setIsOpen,
  }), []);

  return [isOpen, handlers];
}

// Usage
function DropdownMenu() {
  const [isOpen, { toggle, close }] = useToggle();

  return (
    <div>
      <button onClick={toggle}>Menu</button>
      {isOpen && (
        <ul onBlur={close}>
          <li>Profile</li>
          <li>Settings</li>
        </ul>
      )}
    </div>
  );
}
\\\`\\\`\\\`

#### useDropdown (Full Headless Hook)

\\\`\\\`\\\`jsx
function useDropdown({ items, onSelect, initialSelected = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(initialSelected);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) &&
          !listRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { setIsOpen(true); setHighlightedIndex(0); }
        else setHighlightedIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const item = items[highlightedIndex];
          setSelectedItem(item);
          onSelect?.(item);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }, [isOpen, highlightedIndex, items, onSelect]);

  // Prop getters
  const getTriggerProps = useCallback(() => ({
    ref: triggerRef,
    onClick: () => setIsOpen((o) => !o),
    onKeyDown: handleKeyDown,
    'aria-haspopup': 'listbox',
    'aria-expanded': isOpen,
    role: 'combobox',
  }), [isOpen, handleKeyDown]);

  const getListProps = useCallback(() => ({
    ref: listRef,
    role: 'listbox',
    'aria-activedescendant': highlightedIndex >= 0 ? \\\`option-\\\${highlightedIndex}\\\` : undefined,
  }), [highlightedIndex]);

  const getItemProps = useCallback((index) => ({
    id: \\\`option-\\\${index}\\\`,
    role: 'option',
    'aria-selected': items[index] === selectedItem,
    onClick: () => {
      setSelectedItem(items[index]);
      onSelect?.(items[index]);
      setIsOpen(false);
    },
    onMouseEnter: () => setHighlightedIndex(index),
    style: { backgroundColor: highlightedIndex === index ? '#f0f0f0' : undefined },
  }), [items, selectedItem, highlightedIndex, onSelect]);

  return {
    isOpen, selectedItem, highlightedIndex,
    getTriggerProps, getListProps, getItemProps,
  };
}
\\\`\\\`\\\`

#### useModal

\\\`\\\`\\\`jsx
function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const previousActiveElement = useRef(null);

  const open = useCallback(() => {
    previousActiveElement.current = document.activeElement;
    setIsOpen(true);
    document.body.style.overflow = 'hidden'; // Scroll lock
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
    previousActiveElement.current?.focus(); // Restore focus
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  const getBackdropProps = useCallback(() => ({
    onClick: close,
    'aria-hidden': true,
  }), [close]);

  const getDialogProps = useCallback(() => ({
    role: 'dialog',
    'aria-modal': true,
    onClick: (e) => e.stopPropagation(), // Prevent backdrop click from closing
  }), []);

  return { isOpen, open, close, getBackdropProps, getDialogProps };
}
\\\`\\\`\\\`

---

## Radix UI & Headless UI Examples

### Radix UI (Unstyled Primitives)

Radix provides compound components with full accessibility built in — you add your own styles:

\\\`\\\`\\\`jsx
import * as Dialog from '@radix-ui/react-dialog';

function MyModal({ trigger, title, children }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
          <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500">
            {children}
          </Dialog.Description>
          <Dialog.Close asChild>
            <button className="absolute top-2 right-2">✕</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
\\\`\\\`\\\`

### Headless UI by Tailwind Labs

Designed for Tailwind CSS — headless components with transition support:

\\\`\\\`\\\`jsx
import { Listbox, Transition } from '@headlessui/react';

function SelectMenu({ options, value, onChange }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <Listbox.Button className="border px-4 py-2 rounded">
        {value.name}
      </Listbox.Button>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Listbox.Options className="absolute mt-1 bg-white shadow-lg rounded">
          {options.map((opt) => (
            <Listbox.Option key={opt.id} value={opt} className={({ active }) =>
              \\\`px-4 py-2 \\\${active ? 'bg-blue-100' : ''}\\\`
            }>
              {opt.name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Transition>
    </Listbox>
  );
}
\\\`\\\`\\\`

---

## Controlled vs Uncontrolled Compound Components

### Uncontrolled (Internal State)

\\\`\\\`\\\`jsx
// Component manages its own state — consumer provides only defaults
<Tabs defaultValue="code">
  <Tabs.Tab value="code">Code</Tabs.Tab>
  <Tabs.Tab value="preview">Preview</Tabs.Tab>
</Tabs>
\\\`\\\`\\\`

### Controlled (External State)

\\\`\\\`\\\`jsx
// Consumer owns the state — full control over behavior
const [activeTab, setActiveTab] = useState('code');

<Tabs value={activeTab} onChange={setActiveTab}>
  <Tabs.Tab value="code">Code</Tabs.Tab>
  <Tabs.Tab value="preview">Preview</Tabs.Tab>
</Tabs>
\\\`\\\`\\\`

### Supporting Both

\\\`\\\`\\\`jsx
function Tabs({ children, value: controlledValue, onChange, defaultValue }) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Determine if the component is controlled or uncontrolled
  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : internalValue;

  const setActiveTab = useCallback((newValue) => {
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
  }, [isControlled, onChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}
\\\`\\\`\\\`

**Interview tip:** "I always support both controlled and uncontrolled modes. The pattern is simple: if a \\\`value\\\` prop is provided, the component is controlled and we use that value; otherwise, we use internal state. The \\\`onChange\\\` callback fires in both modes so the consumer can react to changes."

---

## Prop Getters Pattern

Prop getters encapsulate the correct props (event handlers, ARIA attributes, refs) for each element. Popularized by Downshift:

\\\`\\\`\\\`jsx
function useSelect({ items, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const getToggleProps = (overrides = {}) => ({
    onClick: callAll(overrides.onClick, () => setIsOpen((o) => !o)),
    'aria-haspopup': 'listbox',
    'aria-expanded': isOpen,
    ...overrides,
  });

  const getItemProps = (item, index, overrides = {}) => ({
    onClick: callAll(overrides.onClick, () => {
      setSelected(item);
      onChange?.(item);
      setIsOpen(false);
    }),
    role: 'option',
    'aria-selected': selected === item,
    ...overrides,
  });

  return { isOpen, selected, getToggleProps, getItemProps };
}

// Helper: compose multiple handlers
function callAll(...fns) {
  return (...args) => fns.forEach((fn) => fn?.(...args));
}

// Usage
function CityPicker({ cities }) {
  const { isOpen, selected, getToggleProps, getItemProps } = useSelect({
    items: cities,
    onChange: (city) => console.log('Selected:', city),
  });

  return (
    <div>
      <button {...getToggleProps()}>{selected || 'Pick a city'}</button>
      {isOpen && (
        <ul role="listbox">
          {cities.map((city, i) => (
            <li key={city} {...getItemProps(city, i)}>{city}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
\\\`\\\`\\\`

---

## State Reducer Pattern

The state reducer pattern lets consumers **customize internal state transitions** by providing their own reducer. Popularized by Kent C. Dodds and used in Downshift:

\\\`\\\`\\\`jsx
// Default reducer for the toggle
function defaultToggleReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE': return { isOpen: !state.isOpen };
    case 'OPEN':   return { isOpen: true };
    case 'CLOSE':  return { isOpen: false };
    default:       return state;
  }
}

function useToggle({ initialOpen = false, reducer = defaultToggleReducer } = {}) {
  const [state, dispatch] = useReducer(reducer, { isOpen: initialOpen });

  const toggle = () => dispatch({ type: 'TOGGLE' });
  const open   = () => dispatch({ type: 'OPEN' });
  const close  = () => dispatch({ type: 'CLOSE' });

  return { isOpen: state.isOpen, toggle, open, close };
}

// Custom reducer: prevent closing if a form is dirty
function preventCloseReducer(state, action) {
  if (action.type === 'CLOSE' && state.formIsDirty) {
    return state; // Block the close action
  }
  return defaultToggleReducer(state, action);
}

// Consumer uses custom behavior
function ModalWithDirtyCheck() {
  const { isOpen, toggle, open, close } = useToggle({
    reducer: preventCloseReducer,
  });

  return (
    <>
      <button onClick={open}>Open Editor</button>
      {isOpen && (
        <div className="modal">
          <form>...</form>
          <button onClick={close}>Close</button>
        </div>
      )}
    </>
  );
}
\\\`\\\`\\\`

**Why this matters:** The state reducer pattern gives consumers a way to modify component behavior without the component author needing to anticipate every use case via props. The consumer intercepts the state transition and decides what to do — maximum flexibility with minimal API surface.

**Interview tip:** "The state reducer pattern is an inversion of control technique. Instead of exposing dozens of boolean props for every edge case, you expose a single reducer prop. The consumer can intercept any state transition and modify it. This pattern is used in Downshift and Kent C. Dodds' libraries."
`,
  },
];
