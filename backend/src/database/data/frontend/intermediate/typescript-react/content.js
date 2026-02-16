// ============================================================================
// TypeScript with React — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "TypeScript with React",
  slug: "typescript-react",
  description:
    "Add type safety to React applications — typed props, hooks, events, and generic components.",
  estimated_time: 160,
  order_index: 6,
};

export const lessons = [
  {
    title: "Typing Components, Props & Hooks",
    slug: "typing-components-hooks",
    summary:
      "Add type safety to React components — typed props, children, events, and hooks.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 1,
    key_points: [
      "Setting up TypeScript with React — tsconfig.json key settings (jsx, strict, esModuleInterop, paths) and why 'react-jsx' transform eliminates manual React imports",
      "Typing function components: React.FC vs explicit return typing — trade-offs, when to prefer each, and why the community shifted away from React.FC",
      "Props typing with interfaces vs type aliases — optional props, defaultProps, union types, literal types, and discriminated unions for conditional rendering",
      "Children typing: ReactNode vs ReactElement vs PropsWithChildren — when to use each and how to restrict children types",
      "Event typing: React.ChangeEvent<HTMLInputElement>, React.FormEvent<HTMLFormElement>, React.MouseEvent, React.KeyboardEvent with specific element generics",
      "Hooks typing: useState<T>, useRef<T>(null) vs useRef<T>(initialValue), useReducer with discriminated union actions, useContext with generics and non-null assertion",
      "Generic components: building reusable Table<T>, Select<T>, and List<T> components that infer types from data props",
      "Utility types for props: Partial, Required, Pick, Omit, Record, ComponentPropsWithRef, HTMLAttributes extending, and as const assertions",
    ],
    content: `
# Typing Components, Props & Hooks

TypeScript transforms React development by catching bugs at compile time — wrong prop types, missing required props, mismatched event handlers, and incorrectly shaped state. In interviews, you'll need to demonstrate deep understanding of **how** to type React patterns and **why** certain approaches are preferred. This lesson covers every TypeScript+React pattern you'll encounter.

---

## Setting Up TypeScript with React

### tsconfig.json Key Settings

When you create a React+TypeScript project (via \\\`npx create-react-app --template typescript\\\` or Vite's \\\`react-ts\\\` template), the generated \\\`tsconfig.json\\\` includes critical settings:

\\\`\\\`\\\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    // ── React-specific ──
    "jsx": "react-jsx",          // uses automatic runtime (React 17+)
    // "jsx": "react"            // classic: requires 'import React' in every file

    "strict": true,              // enables all strict type-checking options
    "noUncheckedIndexedAccess": true,  // array/object indexing returns T | undefined
    "esModuleInterop": true,     // allows default imports from CommonJS modules
    "skipLibCheck": true,        // skip type checking of .d.ts files for speed
    "forceConsistentCasingInFileNames": true,

    // ── Path aliases (optional, but common) ──
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
\\\`\\\`\\\`

### The \\\`jsx\\\` Option Explained

| Value | Behavior | React Import Required? |
|-------|----------|----------------------|
| \\\`"react"\\\` | Transforms JSX to \\\`React.createElement()\\\` calls | Yes — every file |
| \\\`"react-jsx"\\\` | Uses automatic runtime (\\\`_jsx\\\` from \\\`react/jsx-runtime\\\`) | No — automatic |
| \\\`"react-jsxdev"\\\` | Like \\\`react-jsx\\\` but with extra debug info | No — development only |

**Interview tip:** "We use \\\`react-jsx\\\` because it leverages the new JSX transform from React 17+. This eliminates the need to import React in every component file and enables slight bundle optimizations since the runtime can avoid creating intermediate objects."

---

## Typing Function Components

### Approach 1: React.FC (Function Component)

\\\`\\\`\\\`tsx
import React from 'react';

interface GreetingProps {
  name: string;
  age?: number;
}

const Greeting: React.FC<GreetingProps> = ({ name, age }) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age !== undefined && <p>Age: {age}</p>}
    </div>
  );
};
\\\`\\\`\\\`

**What React.FC does:**
- Provides an implicit \\\`children\\\` prop (in React 17 and below — **removed in React 18 types**)
- Sets the return type to \\\`React.ReactElement | null\\\`
- Provides \\\`displayName\\\`, \\\`defaultProps\\\`, and \\\`propTypes\\\` static properties

### Approach 2: Explicit Return Typing (Preferred)

\\\`\\\`\\\`tsx
interface GreetingProps {
  name: string;
  age?: number;
}

// Explicit parameter and return type
function Greeting({ name, age }: GreetingProps): React.ReactElement {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age !== undefined && <p>Age: {age}</p>}
    </div>
  );
}

// Or with arrow function — inferred return type
const Greeting = ({ name, age }: GreetingProps) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age !== undefined && <p>Age: {age}</p>}
    </div>
  );
};
\\\`\\\`\\\`

### React.FC vs Explicit Typing — When to Use Each

| Aspect | React.FC | Explicit Typing |
|--------|----------|----------------|
| Children | Implicit (React ≤17), explicit (React 18+) | Must declare explicitly |
| Generics | Cannot use generics easily | Full generic support |
| Default props | Poor inference with defaultProps | Works naturally with destructuring defaults |
| Return type | Always ReactElement or null | Inferred or explicit — more flexible |
| Community consensus | Falling out of favor | Preferred by React core team and most style guides |

**Interview tip:** "I prefer explicit typing over React.FC because it gives better generic component support, doesn't implicitly inject children, and provides clearer function signatures. React.FC is fine for simple components but becomes limiting with advanced patterns."

---

## Props Typing

### Interface vs Type Alias

\\\`\\\`\\\`tsx
// INTERFACE — can be extended and merged
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
}

// TYPE ALIAS — can use unions, intersections, mapped types
type ButtonProps = {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
};
\\\`\\\`\\\`

**When to use which:**
- **Interface** for component props (can be extended by consumers: \\\`interface ExtProps extends ButtonProps\\\`)
- **Type alias** when you need unions (\\\`type Props = AdminProps | UserProps\\\`), mapped types, or conditional types
- Both work identically for simple prop objects — consistency within a codebase matters more

### Optional Props and Default Values

\\\`\\\`\\\`tsx
interface CardProps {
  title: string;
  subtitle?: string;       // string | undefined
  elevation?: 1 | 2 | 3;  // literal union, optional
  rounded?: boolean;       // defaults handled in destructuring
}

// Default values via destructuring (preferred over defaultProps)
function Card({
  title,
  subtitle,
  elevation = 1,
  rounded = true,
}: CardProps) {
  return (
    <div
      style={{
        boxShadow: \\\`0 \\\${elevation * 2}px \\\${elevation * 4}px rgba(0,0,0,0.1)\\\`,
        borderRadius: rounded ? '8px' : '0',
      }}
    >
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
\\\`\\\`\\\`

### Union Types and Literal Types

\\\`\\\`\\\`tsx
// Literal type props — restrict values to specific strings/numbers
interface BadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  count?: number;
}

// Union type for polymorphic components
type AlertProps =
  | { severity: 'error'; errorCode: number; message: string }
  | { severity: 'warning'; message: string }
  | { severity: 'info'; message: string };

function Alert(props: AlertProps) {
  // Type narrowing — TypeScript knows errorCode exists only when severity is 'error'
  if (props.severity === 'error') {
    return <div>Error {props.errorCode}: {props.message}</div>;
  }
  return <div>{props.severity}: {props.message}</div>;
}
\\\`\\\`\\\`

---

## Children Typing

### ReactNode — The Most Common Choice

\\\`\\\`\\\`tsx
interface LayoutProps {
  children: React.ReactNode;  // string | number | boolean | ReactElement | null | undefined | ReactFragment | ReactPortal
  sidebar?: React.ReactNode;
}

function Layout({ children, sidebar }: LayoutProps) {
  return (
    <div className="layout">
      {sidebar && <aside>{sidebar}</aside>}
      <main>{children}</main>
    </div>
  );
}

// Usage — accepts anything renderable
<Layout sidebar={<nav>Menu</nav>}>
  <h1>Page Title</h1>
  <p>Content here</p>
  {showBanner && <Banner />}
  {"Plain text"}
  {42}
</Layout>
\\\`\\\`\\\`

### ReactElement — Restrict to JSX Elements Only

\\\`\\\`\\\`tsx
interface TabPanelProps {
  children: React.ReactElement | React.ReactElement[];
  // Only accepts JSX elements — not strings, numbers, or booleans
}

function TabPanel({ children }: TabPanelProps) {
  return <div role="tabpanel">{children}</div>;
}

// ✅ Valid
<TabPanel><Tab label="Home" /></TabPanel>

// ❌ TypeScript error — strings not allowed
<TabPanel>Just text</TabPanel>
\\\`\\\`\\\`

### PropsWithChildren — Utility Type

\\\`\\\`\\\`tsx
import { PropsWithChildren } from 'react';

// PropsWithChildren<P> = P & { children?: ReactNode }
interface PanelProps {
  title: string;
  collapsible?: boolean;
}

function Panel({ title, collapsible, children }: PropsWithChildren<PanelProps>) {
  return (
    <section>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
\\\`\\\`\\\`

**Interview tip:** "I use \\\`ReactNode\\\` for \\\`children\\\` because it accepts everything React can render — strings, numbers, elements, arrays, fragments, and portals. \\\`ReactElement\\\` is more restrictive and only accepts JSX elements. \\\`PropsWithChildren\\\` is a convenience wrapper that adds an optional \\\`children: ReactNode\\\` prop."

---

## Event Typing

### Common Event Types

React provides generic event types tied to specific HTML elements:

\\\`\\\`\\\`tsx
// ── Change Events ──
function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
  console.log(e.target.value); // string — TypeScript knows this
}

function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
  console.log(e.target.value); // string — selected option value
}

function handleTextAreaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
  console.log(e.target.value);
}

// ── Form Events ──
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  // e.currentTarget is HTMLFormElement — TypeScript knows this
}

// ── Mouse Events ──
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  console.log(e.clientX, e.clientY);
  // e.currentTarget is HTMLButtonElement
}

function handleDivClick(e: React.MouseEvent<HTMLDivElement>) {
  // e.currentTarget is HTMLDivElement
}

// ── Keyboard Events ──
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') {
    e.preventDefault();
    // handle enter key
  }
}

// ── Focus Events ──
function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.select(); // select all text on focus
}

// ── Drag Events ──
function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
  e.dataTransfer.setData('text/plain', e.currentTarget.id);
}
\\\`\\\`\\\`

### Typing Event Handlers in Components

\\\`\\\`\\\`tsx
interface SearchBarProps {
  onSearch: (query: string) => void;
  onFocus?: () => void;
  placeholder?: string;
}

function SearchBar({ onSearch, onFocus, placeholder = 'Search...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
      />
    </form>
  );
}
\\\`\\\`\\\`

**Interview tip:** "React event types are generic — the type parameter specifies the HTML element. \\\`React.ChangeEvent<HTMLInputElement>\\\` means the event came from an \\\`<input>\\\` element, so \\\`e.target.value\\\` is typed as \\\`string\\\`. This is important because \\\`React.ChangeEvent<HTMLSelectElement>\\\` also has \\\`e.target.value\\\` as \\\`string\\\`, but semantically they're different elements."

---

## Hooks Typing

### useState

\\\`\\\`\\\`tsx
// Inferred type — TypeScript infers from initial value
const [count, setCount] = useState(0);           // number
const [name, setName] = useState('');             // string
const [isOpen, setIsOpen] = useState(false);      // boolean

// Explicit generic — needed when initial value doesn't represent all possible types
const [user, setUser] = useState<User | null>(null);
// Without <User | null>, TypeScript infers type as 'null' — setUser({...}) would error

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Union state
type Status = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<Status>('idle');

// Array state
const [items, setItems] = useState<string[]>([]);
const [users, setUsers] = useState<User[]>([]);
\\\`\\\`\\\`

### useRef

\\\`\\\`\\\`tsx
// ── DOM refs — pass null as initial value ──
const inputRef = useRef<HTMLInputElement>(null);
// Type: React.RefObject<HTMLInputElement>
// inputRef.current is HTMLInputElement | null — read-only .current

const divRef = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // Must null-check because the ref might not be attached yet
    inputRef.current?.focus();
    // OR with non-null assertion (when you're certain it's attached)
    inputRef.current!.focus();
  };

  return <input ref={inputRef} />;
}

// ── Mutable refs — pass a non-null initial value ──
const intervalRef = useRef<number>(0);
// Type: React.MutableRefObject<number>
// intervalRef.current is number — writable .current

const renderCount = useRef<number>(0);
renderCount.current += 1; // ✅ mutable

// ── The rule: ──
// useRef<T>(null)  → RefObject<T>       → .current is T | null (read-only)
// useRef<T>(value) → MutableRefObject<T> → .current is T (writable)
\\\`\\\`\\\`

### useReducer with Discriminated Unions

\\\`\\\`\\\`tsx
// ── State type ──
interface CounterState {
  count: number;
  step: number;
  history: number[];
}

// ── Action types — discriminated union on 'type' field ──
type CounterAction =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' }
  | { type: 'SET_COUNT'; payload: number };

// ── Reducer — TypeScript exhaustively checks all action types ──
function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + state.step,
        history: [...state.history, state.count + state.step],
      };
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - state.step,
        history: [...state.history, state.count - state.step],
      };
    case 'SET_STEP':
      return { ...state, step: action.payload };
      // TypeScript knows action.payload is number here
    case 'SET_COUNT':
      return {
        ...state,
        count: action.payload,
        history: [...state.history, action.payload],
      };
    case 'RESET':
      return { count: 0, step: 1, history: [] };
    default: {
      // Exhaustiveness check — if you add a new action type and forget
      // to handle it, TypeScript will error here
      const _exhaustive: never = action;
      return state;
    }
  }
}

// ── Usage ──
function Counter() {
  const [state, dispatch] = useReducer(counterReducer, {
    count: 0,
    step: 1,
    history: [],
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <button onClick={() => dispatch({ type: 'SET_STEP', payload: 5 })}>
        Step = 5
      </button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>

      {/* ❌ TypeScript error — payload missing */}
      {/* dispatch({ type: 'SET_STEP' }) */}

      {/* ❌ TypeScript error — unknown action type */}
      {/* dispatch({ type: 'MULTIPLY' }) */}
    </div>
  );
}
\\\`\\\`\\\`

### useContext with Generics

\\\`\\\`\\\`tsx
// ── 1. Define the context value type ──
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// ── 2. Create context with undefined default ──
const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// ── 3. Custom hook with non-null guard ──
function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context; // TypeScript now knows this is AuthContextValue, not undefined
}

// ── 4. Provider component ──
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const userData = await response.json();
    setUser(userData);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── 5. Usage in components ──
function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  // TypeScript knows user is User | null, logout is () => void, etc.

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
\\\`\\\`\\\`

**Interview tip:** "I create the context with \\\`undefined\\\` as the default and use a custom hook that throws if the context is undefined. This eliminates the need for null checks everywhere and guarantees type safety — if the hook doesn't throw, the value is always the full context type."

---

## Generic Components

### Generic Table Component

\\\`\\\`\\\`tsx
interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

function Table<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (data.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} style={{ width: col.width }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(row[col.key], row)
                  : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Usage — T is inferred as User
interface User { id: number; name: string; email: string; role: string; }

<Table
  data={users}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (val) => <Badge>{val}</Badge> },
  ]}
  keyExtractor={(user) => user.id}
  onRowClick={(user) => navigate(\\\`/users/\\\${user.id}\\\`)}
/>
// TypeScript ensures 'key' values are actual keys of User
// ❌ { key: 'address', header: 'Address' } — TypeScript error: 'address' not in keyof User
\\\`\\\`\\\`

### Generic Select Component

\\\`\\\`\\\`tsx
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (item: T) => string;
  getValue: (item: T) => string | number;
  placeholder?: string;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = 'Select...',
}: SelectProps<T>) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedItem = options.find(
      (opt) => String(getValue(opt)) === selectedValue
    );
    if (selectedItem) onChange(selectedItem);
  };

  return (
    <select
      value={value ? String(getValue(value)) : ''}
      onChange={handleChange}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt) => (
        <option key={String(getValue(opt))} value={String(getValue(opt))}>
          {getLabel(opt)}
        </option>
      ))}
    </select>
  );
}

// Usage — T inferred as Country
interface Country { code: string; name: string; continent: string; }

<Select
  options={countries}
  value={selectedCountry}
  onChange={setSelectedCountry}
  getLabel={(c) => c.name}
  getValue={(c) => c.code}
  placeholder="Choose a country"
/>
\\\`\\\`\\\`

### Generic List Component

\\\`\\\`\\\`tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyState?: React.ReactNode;
  className?: string;
}

function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyState = <p>No items</p>,
  className,
}: ListProps<T>) {
  if (items.length === 0) return <>{emptyState}</>;

  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// Usage — T inferred as Todo
interface Todo { id: string; text: string; done: boolean; }

<List
  items={todos}
  renderItem={(todo) => (
    <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
      {todo.text}
    </span>
  )}
  keyExtractor={(todo) => todo.id}
/>
\\\`\\\`\\\`

**Interview tip:** "Generic components let you build reusable UI components that maintain type safety with any data shape. The key is making the component generic over the data type T and using \\\`keyof T\\\` to constrain prop access. TypeScript infers T from the \\\`data\\\` or \\\`items\\\` prop, so consumers rarely need to specify the generic parameter explicitly."

---

## Discriminated Unions in Components

### Pattern: Conditional Rendering with Type Narrowing

\\\`\\\`\\\`tsx
// Discriminated union — 'status' is the discriminant
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

interface AsyncRendererProps<T> {
  state: AsyncState<T>;
  renderData: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
}

function AsyncRenderer<T>({
  state,
  renderData,
  loadingComponent = <p>Loading...</p>,
}: AsyncRendererProps<T>) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <>{loadingComponent}</>;
    case 'success':
      return <>{renderData(state.data)}</>; // TypeScript knows state.data exists here
    case 'error':
      return <div role="alert">Error: {state.error}</div>; // TypeScript knows state.error exists
  }
}
\\\`\\\`\\\`

### Discriminated Union Props

\\\`\\\`\\\`tsx
// A Button that behaves differently based on the 'as' prop
type ButtonProps =
  | {
      as: 'button';
      onClick: () => void;
      href?: never;       // prevents href when as='button'
    }
  | {
      as: 'link';
      href: string;
      onClick?: never;    // prevents onClick when as='link'
    };

type SharedButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

function Button(props: ButtonProps & SharedButtonProps) {
  if (props.as === 'link') {
    return <a href={props.href} className={props.variant}>{props.children}</a>;
  }
  return (
    <button onClick={props.onClick} disabled={props.disabled} className={props.variant}>
      {props.children}
    </button>
  );
}

// ✅ Valid
<Button as="button" onClick={handleClick}>Click me</Button>
<Button as="link" href="/about">About</Button>

// ❌ TypeScript error — href not allowed with as="button"
<Button as="button" href="/oops" onClick={handleClick}>Broken</Button>
\\\`\\\`\\\`

---

## Utility Types for Props

### Partial, Required, Pick, Omit

\\\`\\\`\\\`tsx
interface UserFormData {
  name: string;
  email: string;
  age: number;
  bio: string;
  avatarUrl: string;
}

// Partial — all fields optional (for edit forms where only some fields change)
type UpdateUserData = Partial<UserFormData>;
// { name?: string; email?: string; age?: number; bio?: string; avatarUrl?: string }

// Required — all fields required
type StrictUserData = Required<UserFormData>;

// Pick — select specific fields
type LoginFormData = Pick<UserFormData, 'email'>;
// { email: string }

// Omit — exclude specific fields
type UserDisplayData = Omit<UserFormData, 'email' | 'bio'>;
// { name: string; age: number; avatarUrl: string }

// Record — typed key-value map
type FormErrors = Record<keyof UserFormData, string | undefined>;
// { name: string | undefined; email: string | undefined; ... }

// Combining utility types
type EditableFields = Partial<Pick<UserFormData, 'bio' | 'avatarUrl'>>;
// { bio?: string; avatarUrl?: string }
\\\`\\\`\\\`

### ComponentPropsWithRef and HTMLAttributes

\\\`\\\`\\\`tsx
// ── Extending HTML element props ──
import { ComponentPropsWithRef, forwardRef } from 'react';

// Method 1: ComponentPropsWithRef — includes ref
type InputProps = ComponentPropsWithRef<'input'> & {
  label: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Omit<InputProps, 'ref'>>(
  ({ label, error, ...rest }, ref) => (
    <div>
      <label>{label}</label>
      <input ref={ref} aria-invalid={!!error} {...rest} />
      {error && <span role="alert">{error}</span>}
    </div>
  )
);

// Method 2: HTMLAttributes — without ref
interface CustomDivProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'card' | 'panel' | 'modal';
  elevation?: number;
}

function CustomDiv({ variant, elevation = 1, children, ...rest }: CustomDivProps) {
  return (
    <div data-variant={variant} data-elevation={elevation} {...rest}>
      {children}
    </div>
  );
}
// Now CustomDiv accepts all standard div props (className, style, onClick, etc.)
// PLUS the custom variant and elevation props
\\\`\\\`\\\`

### as const Assertions

\\\`\\\`\\\`tsx
// Without as const — TypeScript infers string[]
const ROLES = ['admin', 'editor', 'viewer'];
// type: string[]

// With as const — TypeScript infers readonly tuple of literal types
const ROLES = ['admin', 'editor', 'viewer'] as const;
// type: readonly ['admin', 'editor', 'viewer']

// Extract union type from as const array
type Role = (typeof ROLES)[number]; // 'admin' | 'editor' | 'viewer'

// Use in props
interface UserProps {
  role: Role; // 'admin' | 'editor' | 'viewer' — not just string
}

// as const for config objects
const THEME = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    danger: '#ef4444',
  },
  spacing: {
    sm: 4,
    md: 8,
    lg: 16,
  },
} as const;

type Color = keyof typeof THEME.colors; // 'primary' | 'secondary' | 'danger'
type Spacing = keyof typeof THEME.spacing; // 'sm' | 'md' | 'lg'
\\\`\\\`\\\`

---

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

\\\`\\\`\\\`tsx
// 1. Discriminated unions over optional props
// ❌ Anti-pattern — ambiguous state
interface BadModalProps {
  isOpen: boolean;
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'alert' | 'confirm';
}

// ✅ Discriminated union — each variant has exactly the props it needs
type ModalProps =
  | { type: 'alert'; title: string; onClose: () => void }
  | { type: 'confirm'; title: string; onConfirm: () => void; onCancel: () => void };

// 2. Use 'never' to prevent invalid combinations (shown in Button example above)

// 3. Prefer interfaces for component props — they have better error messages
// and support declaration merging for library extensibility

// 4. Type event handlers at the function level, not inline
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... };
// Not: onChange={(e: React.ChangeEvent<HTMLInputElement>) => { ... }}

// 5. Use satisfies for type-safe object literals (TypeScript 4.9+)
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} satisfies Record<string, string | number>;
// Preserves literal types while ensuring shape conformance
\\\`\\\`\\\`

### ❌ Anti-Patterns to Avoid

\\\`\\\`\\\`tsx
// 1. Don't use 'any' — use 'unknown' if the type is truly unknown
function processData(data: any) { ... }    // ❌ no type checking
function processData(data: unknown) { ... } // ✅ must narrow before use

// 2. Don't over-use type assertions (as)
const el = document.getElementById('root') as HTMLDivElement; // ❌ dangerous
const el = document.getElementById('root');
if (el instanceof HTMLDivElement) { ... } // ✅ runtime check

// 3. Don't ignore the undefined case from optional chaining
const name = user?.name; // type is string | undefined
// ❌ Using name directly where string is required without checking
// ✅ Provide a fallback: name ?? 'Anonymous'

// 4. Don't use React.FC just because — understand the trade-offs
// ❌ const App: React.FC = () => <div />; (hides children, blocks generics)
// ✅ function App(): React.ReactElement { return <div />; }

// 5. Don't create overly broad types
interface Props {
  data: object;  // ❌ too broad — use a specific interface or generic
  config: {};    // ❌ means non-null — confusing
}
\\\`\\\`\\\`

---

## Common Interview Questions

1. **"What's the difference between React.FC and explicit return typing?"** — React.FC is a generic type that wraps your component, providing children (in older versions), displayName, and constraining the return type. Explicit typing gives you more control, better generic support, and clearer function signatures. The React team and most style guides now prefer explicit typing.

2. **"How do you type useState when the initial value is null?"** — Use the generic parameter: \\\`useState<User | null>(null)\\\`. Without the generic, TypeScript infers the type as just \\\`null\\\`, and you can never set a User value.

3. **"What's the difference between useRef<T>(null) and useRef<T>(value)?"** — \\\`useRef<T>(null)\\\` returns a \\\`RefObject<T>\\\` with a read-only \\\`.current\\\` (used for DOM refs). \\\`useRef<T>(value)\\\` returns a \\\`MutableRefObject<T>\\\` with a writable \\\`.current\\\` (used for instance variables like timers).

4. **"How do you build a generic component?"** — Declare a type parameter on the function: \\\`function Table<T>(props: TableProps<T>)\\\`. TypeScript infers T from the props, so consumers don't need to specify it. Use \\\`keyof T\\\` to constrain property access.

5. **"How do you type events in React?"** — Use React's generic event types with the specific HTML element: \\\`React.ChangeEvent<HTMLInputElement>\\\`, \\\`React.FormEvent<HTMLFormElement>\\\`, \\\`React.MouseEvent<HTMLButtonElement>\\\`. The generic parameter types \\\`e.target\\\` and \\\`e.currentTarget\\\`.

6. **"What are discriminated unions and when do you use them in React?"** — Discriminated unions are union types where each variant has a common property (the discriminant) with a literal type. In React, they're used for conditional props (Button as link vs button), async state (idle/loading/success/error), and polymorphic components. TypeScript narrows the type based on the discriminant value.

7. **"How do you type context in React?"** — Create the context with \\\`createContext<T | undefined>(undefined)\\\` and wrap it in a custom hook that throws if the value is undefined. This eliminates null checks at every consumption point while maintaining type safety.

8. **"When do you use interface vs type for props?"** — Interface is preferred for props because it can be extended (\\\`extends\\\`), merged (declaration merging), and produces clearer error messages. Type aliases are needed for unions, intersections, mapped types, and conditional types. Consistency within a codebase matters most.
    `,
  },
];
