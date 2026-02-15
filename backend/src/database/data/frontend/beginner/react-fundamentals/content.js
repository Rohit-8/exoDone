// ============================================================================
// React Fundamentals — Content
// ============================================================================

export const topic = {
  "name": "React Fundamentals",
  "slug": "react-basics",
  "description": "Build a solid foundation with JSX, components, props, and the React rendering model.",
  "estimated_time": 180,
  "order_index": 1
};

export const lessons = [
  {
    title: "Introduction to JSX & React Elements",
    slug: "intro-jsx",
    summary: "Understand what JSX is, how it compiles to React.createElement, and the rules of JSX expressions.",
    difficulty_level: "beginner",
    estimated_time: 25,
    order_index: 1,
    key_points: [
  "JSX is syntactic sugar for React.createElement()",
  "JSX expressions must have a single root element",
  "Use curly braces {} to embed JavaScript expressions in JSX",
  "JSX attributes use camelCase (className, onClick etc.)",
  "Always close self-closing tags like <img />, <input />"
],
    content: `# Introduction to JSX

JSX (JavaScript XML) is a syntax extension for JavaScript that lets you write HTML-like markup inside JavaScript files. It was introduced by React to make building user interfaces more intuitive.

## What is JSX?

JSX is **not** HTML. It gets compiled by tools like Babel into \`React.createElement()\` calls:

\`\`\`jsx
// What you write:
const element = <h1 className="title">Hello, World!</h1>;

// What the compiler produces:
const element = React.createElement('h1', { className: 'title' }, 'Hello, World!');
\`\`\`

## JSX Rules

### 1. Single Root Element
Every JSX expression must return a single root element. Use Fragments (\`<></>\`) when you don't want extra DOM nodes:

\`\`\`jsx
// ❌ Error — multiple root elements
return (
  <h1>Title</h1>
  <p>Paragraph</p>
);

// ✅ Wrap in a Fragment
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);
\`\`\`

### 2. Embedding Expressions
Use curly braces \`{}\` to embed any valid JavaScript expression:

\`\`\`jsx
const name = 'Alice';
const items = [1, 2, 3];

return (
  <div>
    <p>Hello, {name}!</p>
    <p>Sum: {items.reduce((a, b) => a + b, 0)}</p>
    <p>Date: {new Date().toLocaleDateString()}</p>
  </div>
);
\`\`\`

### 3. CamelCase Attributes
HTML attributes become camelCase in JSX:
- \`class\` → \`className\`
- \`for\` → \`htmlFor\`
- \`onclick\` → \`onClick\`
- \`tabindex\` → \`tabIndex\`

### 4. Conditional Rendering
Render content conditionally using ternary operators or logical AND:

\`\`\`jsx
function Greeting({ isLoggedIn, name }) {
  return (
    <div>
      {isLoggedIn ? (
        <p>Welcome back, {name}!</p>
      ) : (
        <p>Please sign in.</p>
      )}
      {isLoggedIn && <button>Logout</button>}
    </div>
  );
}
\`\`\`

### 5. Lists and Keys
When rendering lists, always provide a unique \`key\` prop:

\`\`\`jsx
const fruits = ['Apple', 'Banana', 'Cherry'];

return (
  <ul>
    {fruits.map((fruit, index) => (
      <li key={fruit}>{fruit}</li>
    ))}
  </ul>
);
\`\`\`

> **Why keys?** Keys help React identify which items changed, were added, or removed. Use stable, unique identifiers — avoid array indices when order may change.
`,
  },
  {
    title: "Components, Props & Composition",
    slug: "components-props",
    summary: "Learn how to create reusable components, pass data via props, and compose UIs from small building blocks.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 2,
    key_points: [
  "Components are reusable, self-contained UI building blocks",
  "Props flow one-way: parent → child (unidirectional data flow)",
  "Use the children prop for component composition",
  "PropTypes or TypeScript provide type checking for props",
  "Keep components small and focused on a single responsibility"
],
    content: `# Components, Props & Composition

React applications are built from **components** — reusable pieces of UI that accept inputs (props) and return React elements describing what should appear on screen.

## Function Components

The modern way to write React components:

\`\`\`jsx
function Welcome({ name, role = 'User' }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Role: {role}</p>
    </div>
  );
}

// Usage
<Welcome name="Alice" role="Admin" />
<Welcome name="Bob" />  {/* role defaults to "User" */}
\`\`\`

## Props — Component Inputs

Props are **read-only**. A component must never modify its own props — this is React's core principle of **unidirectional data flow**.

### Destructuring Props
\`\`\`jsx
// Object destructuring in parameters (preferred)
function Button({ label, onClick, variant = 'primary', disabled = false }) {
  return (
    <button
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
\`\`\`

### The children Prop
Every component receives a special \`children\` prop containing the content placed between its opening and closing tags:

\`\`\`jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage — anything inside the tags becomes children
<Card title="Profile">
  <img src="/avatar.png" alt="Avatar" />
  <p>Alice is a senior developer.</p>
</Card>
\`\`\`

## Component Composition

Small, focused components composed together create powerful UIs:

\`\`\`jsx
function App() {
  return (
    <Layout>
      <Header />
      <Sidebar>
        <NavMenu />
      </Sidebar>
      <MainContent>
        <ArticleList articles={articles} />
      </MainContent>
      <Footer />
    </Layout>
  );
}
\`\`\`

## Prop Validation

Use PropTypes (JavaScript) or TypeScript interfaces to validate props:

\`\`\`jsx
import PropTypes from 'prop-types';

function UserCard({ name, age, email }) { /* ... */ }

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  email: PropTypes.string.isRequired,
};

UserCard.defaultProps = {
  age: 0,
};
\`\`\`
`,
  },
  {
    title: "Event Handling & Conditional Rendering",
    slug: "events-conditionals",
    summary: "Handle user interactions with React events and render UI conditionally based on state or props.",
    difficulty_level: "beginner",
    estimated_time: 25,
    order_index: 3,
    key_points: [
  "React events are camelCase and receive SyntheticEvent objects",
  "Pass function references, not function calls, to event handlers",
  "Use ternary, && operator, or early return for conditional rendering",
  "null or false returned from a component renders nothing"
],
    content: `# Event Handling & Conditional Rendering

## Event Handling

React wraps native DOM events in **SyntheticEvent** objects for cross-browser consistency.

### Basic Pattern
\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => setCount(c => c + 1);
  const handleDecrement = () => setCount(c => c - 1);

  return (
    <div>
      <button onClick={handleDecrement}>-</button>
      <span>{count}</span>
      <button onClick={handleIncrement}>+</button>
    </div>
  );
}
\`\`\`

### Passing Arguments to Handlers
\`\`\`jsx
function TodoList({ todos, onDelete }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
          <button onClick={() => onDelete(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
\`\`\`

### Form Events
\`\`\`jsx
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();    // Prevent page reload
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
\`\`\`

## Conditional Rendering

### Ternary Operator
\`\`\`jsx
{isLoggedIn ? <Dashboard /> : <LoginForm />}
\`\`\`

### Logical AND (&&)
\`\`\`jsx
{hasNotifications && <NotificationBadge count={count} />}
\`\`\`

### Early Return
\`\`\`jsx
function ProtectedContent({ user }) {
  if (!user) return <p>Please log in.</p>;
  return <Dashboard user={user} />;
}
\`\`\`

### Rendering null
\`\`\`jsx
function Warning({ show, message }) {
  if (!show) return null;  // Renders nothing
  return <div className="alert">{message}</div>;
}
\`\`\`
`,
  },
];
