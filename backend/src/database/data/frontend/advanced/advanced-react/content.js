// ============================================================================
// Advanced React Patterns — Content
// ============================================================================

export const topic = {
  "name": "Advanced React Patterns",
  "slug": "advanced-react",
  "description": "Master higher-order components, render props, compound components, and headless UI architecture.",
  "estimated_time": 200,
  "order_index": 7
};

export const lessons = [
  {
    title: "Higher-Order Components & Render Props",
    slug: "hoc-render-props",
    summary: "Understand legacy patterns that are still common in many codebases — HOCs and render props.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "HOCs are functions that take a component and return a new enhanced component",
  "Render props pass a function as a prop to share rendering logic",
  "Custom hooks are the modern replacement for both patterns",
  "HOCs can cause \"wrapper hell\" and naming collisions",
  "Render props can cause \"callback hell\" but offer explicit data flow"
],
    content: `# Higher-Order Components & Render Props

## Higher-Order Components (HOC)

A HOC is a function that takes a component and returns a new component with added functionality:

\`\`\`jsx
function withLoading(WrappedComponent) {
  return function LoadingWrapper({ isLoading, ...props }) {
    if (isLoading) return <div className="spinner" />;
    return <WrappedComponent {...props} />;
  };
}

// Usage
const UserListWithLoading = withLoading(UserList);
<UserListWithLoading isLoading={loading} users={users} />
\`\`\`

### Real-World HOC: withAuth
\`\`\`jsx
function withAuth(WrappedComponent, requiredRole) {
  return function AuthWrapper(props) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" />;
    if (requiredRole && user.role !== requiredRole) return <Unauthorized />;

    return <WrappedComponent {...props} user={user} />;
  };
}

const AdminPanel = withAuth(AdminPanelContent, 'admin');
\`\`\`

## Render Props

A component with a render prop takes a function that it calls to render UI:

\`\`\`jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return render(position);
}

// Usage
<MouseTracker render={({ x, y }) => (
  <p>Mouse at ({x}, {y})</p>
)} />
\`\`\`

## Modern Alternative: Custom Hooks

Both patterns above are better expressed as custom hooks:

\`\`\`jsx
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}

// Clean usage
function App() {
  const { x, y } = useMousePosition();
  return <p>Mouse at ({x}, {y})</p>;
}
\`\`\`
`,
  },
  {
    title: "Compound Components & Headless UI",
    slug: "compound-headless",
    summary: "Build flexible, composable UI APIs with the compound component pattern and headless component architecture.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 2,
    key_points: [
  "Compound components share implicit state via React Context",
  "The parent controls state; children access it to render flexibly",
  "Headless components provide behavior without dictating markup",
  "This pattern powers libraries like Headless UI, Radix, and React Aria",
  "Combine with TypeScript generics for strongly typed component APIs"
],
    content: `# Compound Components & Headless UI

## Compound Components

Like HTML \`<select>\` and \`<option>\` — components that work together sharing implicit state:

\`\`\`jsx
// Usage — clean declarative API
<Accordion>
  <Accordion.Item>
    <Accordion.Trigger>What is React?</Accordion.Trigger>
    <Accordion.Content>A JavaScript library for building UIs.</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item>
    <Accordion.Trigger>What are hooks?</Accordion.Trigger>
    <Accordion.Content>Functions that let you use state in function components.</Accordion.Content>
  </Accordion.Item>
</Accordion>
\`\`\`

### Implementation

\`\`\`jsx
const AccordionContext = createContext();
const ItemContext = createContext();

function Accordion({ children, multiple = false }) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggle = (id) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}

Accordion.Item = function Item({ children }) {
  const id = useId();
  return (
    <ItemContext.Provider value={id}>
      <div className="accordion-item">{children}</div>
    </ItemContext.Provider>
  );
};

Accordion.Trigger = function Trigger({ children }) {
  const { openItems, toggle } = useContext(AccordionContext);
  const id = useContext(ItemContext);
  const isOpen = openItems.has(id);

  return (
    <button onClick={() => toggle(id)} aria-expanded={isOpen}>
      {children} {isOpen ? '−' : '+'}
    </button>
  );
};

Accordion.Content = function Content({ children }) {
  const { openItems } = useContext(AccordionContext);
  const id = useContext(ItemContext);
  if (!openItems.has(id)) return null;

  return <div className="accordion-content">{children}</div>;
};
\`\`\`

## Headless Components

Separate **behavior** from **presentation**:

\`\`\`jsx
function useToggle(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return { isOpen, toggle, open, close };
}

// You bring the markup
function Dropdown() {
  const { isOpen, toggle, close } = useToggle();

  return (
    <div>
      <button onClick={toggle}>Menu</button>
      {isOpen && (
        <ul onMouseLeave={close}>
          <li>Profile</li>
          <li>Settings</li>
          <li>Logout</li>
        </ul>
      )}
    </div>
  );
}
\`\`\`
`,
  },
];
