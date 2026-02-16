export const topic = {
  name: "React Fundamentals",
  slug: "react-basics",
  description:
    "Build a solid foundation with JSX, components, props, and the React rendering model.",
  estimated_time: 180,
  order_index: 1,
};

export const lessons = [
  // ──────────────────────────────────────────────
  // LESSON 1 — Introduction to JSX
  // ──────────────────────────────────────────────
  {
    title: "Introduction to JSX",
    slug: "intro-jsx",
    summary:
      "Understand JSX syntax, how it compiles to JavaScript, rendering expressions, fragments, conditional rendering patterns, list rendering with keys, and JSX security considerations.",
    difficulty_level: "beginner",
    estimated_time: 60,
    order_index: 1,
    key_points: [
      "JSX is syntactic sugar that compiles to React.createElement() calls via Babel or SWC",
      "Every JSX expression must return a single root element — use fragments (<></>) to avoid extra DOM nodes",
      "Only JavaScript expressions (not statements) can appear inside JSX curly braces {}",
      "Conditional rendering can be achieved with ternary operators, logical && short-circuit, or extracted if/else",
      "Lists must be rendered with a stable, unique 'key' prop so React can efficiently reconcile the virtual DOM",
      "JSX attributes use camelCase naming (className, htmlFor, onClick) instead of HTML attribute names",
      "React automatically escapes values embedded in JSX, providing built-in XSS protection",
      "JSX spread attributes ({...props}) let you forward an entire props object to a child element",
    ],
    content: `
# Introduction to JSX

## What Is JSX?

**JSX** stands for **JavaScript XML**. It is a syntax extension for JavaScript that lets you write HTML-like markup directly inside JavaScript files. JSX is **not valid JavaScript** on its own — it must be compiled (transpiled) into regular JavaScript before it can run in the browser.

> **Interview Tip:** JSX is _syntactic sugar_. Every piece of JSX is transformed into a \`React.createElement()\` call (or, with the modern JSX transform, into \`jsx()\` / \`jsxs()\` calls imported from \`react/jsx-runtime\`).

### JSX Compilation

\`\`\`jsx
// What you write (JSX):
const element = <h1 className="title">Hello, world!</h1>;

// What the compiler produces (classic transform):
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello, world!'
);

// Modern JSX transform (React 17+):
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx('h1', { className: 'title', children: 'Hello, world!' });
\`\`\`

The compilation step is handled by **Babel** (with \`@babel/preset-react\`) or **SWC** (used by Vite, Next.js, etc.). Both produce the same output; SWC is significantly faster because it is written in Rust.

| Compiler | Language | Speed     | Used By              |
|----------|----------|-----------|----------------------|
| Babel    | JS       | Moderate  | CRA, older toolchains |
| SWC      | Rust     | Very fast | Vite, Next.js 12+    |

---

## JSX Rules

### 1. Single Root Element

JSX expressions must return **exactly one** root element. If you need to return siblings, wrap them in a parent \`<div>\` or, better, a **Fragment**.

\`\`\`jsx
// ❌ Invalid — two root elements
return (
  <h1>Title</h1>
  <p>Description</p>
);

// ✅ Valid — single root
return (
  <div>
    <h1>Title</h1>
    <p>Description</p>
  </div>
);
\`\`\`

### 2. Fragments

Fragments let you group elements **without adding extra DOM nodes**.

\`\`\`jsx
// Short syntax
return (
  <>
    <h1>Title</h1>
    <p>Description</p>
  </>
);

// Explicit syntax — required when you need a key
import { Fragment } from 'react';

return items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
));
\`\`\`

### 3. Expressions vs. Statements

Inside \`{}\` you can use any JavaScript **expression** — something that evaluates to a value:

\`\`\`jsx
// ✅ Expressions
<p>{2 + 2}</p>
<p>{user.name}</p>
<p>{isLoggedIn ? 'Welcome' : 'Please log in'}</p>
<p>{formatDate(new Date())}</p>
\`\`\`

You **cannot** use statements (if/else, for, switch) directly:

\`\`\`jsx
// ❌ Statements are NOT allowed inside {}
<p>{if (loggedIn) { return 'Yes'; }}</p>
\`\`\`

### 4. camelCase Attributes

Because JSX is closer to JavaScript than HTML, attributes use **camelCase**:

| HTML Attribute | JSX Attribute |
|----------------|---------------|
| class          | className     |
| for            | htmlFor       |
| tabindex       | tabIndex      |
| onclick        | onClick       |
| readonly       | readOnly      |

### 5. Self-Closing Tags

Elements with no children **must** be self-closed:

\`\`\`jsx
<img src="photo.jpg" alt="A photo" />
<input type="text" />
<br />
\`\`\`

---

## Conditional Rendering Patterns

### Ternary Operator

Best for toggling between **two** pieces of UI:

\`\`\`jsx
function Greeting({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? <UserDashboard /> : <LoginForm />}
    </div>
  );
}
\`\`\`

### Logical AND (&&)

Best for "show or hide" — render something **or nothing**:

\`\`\`jsx
function Notifications({ count }) {
  return (
    <div>
      {count > 0 && <Badge count={count} />}
    </div>
  );
}
\`\`\`

> **Gotcha:** If \`count\` is \`0\`, React renders the number \`0\` on screen because \`0\` is falsy but still a valid React node. Fix: \`{count > 0 && ...}\` or \`{!!count && ...}\`.

### Extracted if/else

For complex logic, extract the decision **before** the return:

\`\`\`jsx
function StatusMessage({ status }) {
  let message;
  if (status === 'loading') {
    message = <Spinner />;
  } else if (status === 'error') {
    message = <ErrorBanner />;
  } else {
    message = <DataView />;
  }
  return <div>{message}</div>;
}
\`\`\`

### Rendering null

Returning \`null\` from a component (or within JSX) renders **nothing**:

\`\`\`jsx
function MaybeWarning({ show }) {
  if (!show) return null;
  return <p className="warning">Watch out!</p>;
}
\`\`\`

---

## List Rendering & Keys

Use \`Array.prototype.map()\` to render lists. Every item **must** have a unique \`key\` prop:

\`\`\`jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
\`\`\`

### Why Keys Matter

Keys help React identify **which items changed, were added, or removed** during reconciliation. Without stable keys React must re-render every item.

| Key Strategy        | Recommendation                       |
|---------------------|--------------------------------------|
| Database ID         | ✅ Best — globally unique & stable    |
| Unique field (slug) | ✅ Good if guaranteed unique          |
| Array index         | ⚠️ Last resort — causes bugs on reorder |
| Random value        | ❌ Never — changes every render       |

---

## JSX Spread Attributes

You can spread an entire object as props:

\`\`\`jsx
function Button(props) {
  return <button {...props} />;
}

// Usage
<Button className="primary" onClick={save} disabled={!valid}>
  Save
</Button>
\`\`\`

This is handy for **forwarding props** to underlying elements, but use it judiciously — it can pass unexpected attributes and make components harder to reason about.

---

## Security: XSS Prevention

React **escapes** all values embedded in JSX before rendering them to the DOM. This means user-generated content is safe by default:

\`\`\`jsx
const userInput = '<script>alert("hacked")</script>';
// React renders the raw text on screen, NOT as an actual script tag
return <p>{userInput}</p>;
\`\`\`

The escape hatch is \`dangerouslySetInnerHTML\` — use it with extreme caution and **only** with sanitized content:

\`\`\`jsx
function RichContent({ html }) {
  // ⚠️ Only use with trusted or sanitized HTML
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
\`\`\`

---

## Quick-Reference Cheat Sheet

| Concept                | Syntax / Rule                                        |
|------------------------|------------------------------------------------------|
| Compile target         | \`React.createElement()\` or \`jsx()\` from runtime  |
| Root element rule      | Exactly one root; use \`<>…</>\` to avoid extra nodes |
| Embedding expressions  | \`{expression}\` — only expressions, not statements  |
| Attribute naming       | camelCase (\`className\`, \`htmlFor\`)                |
| Self-closing tags      | Required for void elements (\`<img />\`)              |
| Conditional: two paths | Ternary \`cond ? A : B\`                              |
| Conditional: one path  | \`cond && <Element />\` (beware falsy 0)               |
| Lists                  | \`.map()\` with a stable \`key\`                      |
| XSS protection         | Auto-escaped; \`dangerouslySetInnerHTML\` bypasses it  |
`,
  },

  // ──────────────────────────────────────────────
  // LESSON 2 — Components & Props
  // ──────────────────────────────────────────────
  {
    title: "Components and Props",
    slug: "components-props",
    summary:
      "Master React's component model — function components, class components (legacy), the props system, children, composition patterns, prop drilling solutions, PropTypes, and lifting state up.",
    difficulty_level: "beginner",
    estimated_time: 60,
    order_index: 2,
    key_points: [
      "Function components are the standard way to define components in modern React — they are plain functions that accept props and return JSX",
      "Class components extend React.Component and use render(); they are legacy but still appear in interviews and older codebases",
      "Props are read-only — a component must never modify its own props (unidirectional data flow)",
      "The special 'children' prop allows component composition, enabling wrapper/layout patterns",
      "Prop drilling (passing props through many layers) can be solved with Context, composition, or state management libraries",
      "Default prop values can be set via destructuring defaults or the defaultProps static property",
      "PropTypes provide runtime type-checking in development; TypeScript provides compile-time safety",
      "Lifting state up means moving shared state to the nearest common ancestor so sibling components can communicate",
    ],
    content: `
# Components and Props

## The Component Mental Model

A React component is a **reusable, self-contained piece of UI**. Think of components as custom HTML elements that accept inputs (**props**) and return a tree of React elements (JSX) describing what should appear on screen.

> **Core Principle:** Components are like pure functions with respect to their props — same props in, same UI out.

---

## Function Components (Modern Standard)

A function component is a plain JavaScript function (or arrow function) that:

1. Accepts a single \`props\` object as its argument.
2. Returns JSX (or \`null\`).

\`\`\`jsx
// Named function
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Arrow function with destructured props
const Welcome = ({ name, role = 'student' }) => (
  <h2>Hello, {name} ({role})</h2>
);
\`\`\`

### Why Function Components Won

| Aspect            | Function Components       | Class Components          |
|-------------------|---------------------------|---------------------------|
| Syntax            | Concise                   | Verbose (constructor, this) |
| State             | \`useState\` hook          | \`this.state\`             |
| Side effects      | \`useEffect\` hook         | Lifecycle methods          |
| Code reuse        | Custom hooks               | HOCs, render props         |
| Performance       | Slightly lighter           | Slightly heavier           |
| Future of React   | ✅ Recommended             | ⚠️ Legacy, still supported |

---

## Class Components (Legacy)

Class components are ES6 classes that extend \`React.Component\`:

\`\`\`jsx
import React, { Component } from 'react';

class Welcome extends Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
\`\`\`

### Key Lifecycle Methods (Interview Favorites)

| Method                     | Phase     | Purpose                                  |
|----------------------------|-----------|------------------------------------------|
| \`constructor(props)\`      | Mounting  | Initialize state, bind methods           |
| \`componentDidMount()\`     | Mounting  | Fetch data, set up subscriptions         |
| \`shouldComponentUpdate()\` | Updating  | Optimize renders (return false to skip)  |
| \`componentDidUpdate()\`    | Updating  | React to prop/state changes              |
| \`componentWillUnmount()\`  | Unmounting| Clean up timers, subscriptions           |

> **Interview Tip:** You should understand lifecycle methods even if you write function components day-to-day, because legacy codebases and interview questions still reference them.

---

## The Props System — Deep Dive

### What Are Props?

Props (**properties**) are the mechanism for passing data **from parent to child**. They flow in one direction — **top-down** (unidirectional data flow).

\`\`\`jsx
// Parent passes props
<UserCard name="Alice" age={30} isAdmin={true} />

// Child receives props
function UserCard({ name, age, isAdmin }) {
  return (
    <div className={isAdmin ? 'admin-card' : 'user-card'}>
      <h3>{name}</h3>
      <p>Age: {age}</p>
    </div>
  );
}
\`\`\`

### Props Are Read-Only

A component **must never modify its own props**. This is a core React rule:

\`\`\`jsx
// ❌ NEVER do this
function Broken(props) {
  props.name = 'hacked'; // Violation!
  return <p>{props.name}</p>;
}
\`\`\`

### Destructuring Props

Destructuring improves readability and makes it clear which props a component uses:

\`\`\`jsx
// In the parameter list (most common)
function Profile({ name, avatar, bio = 'No bio provided' }) {
  return (
    <div>
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{bio}</p>
    </div>
  );
}

// With rest syntax to collect remaining props
function Button({ variant, children, ...rest }) {
  return (
    <button className={\`btn btn-\${variant}\`} {...rest}>
      {children}
    </button>
  );
}
\`\`\`

### Default Prop Values

\`\`\`jsx
// Option 1: Destructuring defaults (✅ preferred)
function Badge({ color = 'blue', size = 'md', children }) {
  return <span className={\`badge badge-\${color} badge-\${size}\`}>{children}</span>;
}

// Option 2: defaultProps (legacy, still works)
Badge.defaultProps = {
  color: 'blue',
  size: 'md',
};
\`\`\`

---

## The Children Prop

\`children\` is a **special prop** automatically populated with whatever JSX you place **between** a component's opening and closing tags:

\`\`\`jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage — anything between <Card> and </Card> is 'children'
<Card title="Settings">
  <p>Manage your preferences below.</p>
  <SettingsForm />
</Card>
\`\`\`

### Children Can Be Anything

| Type           | Example                               |
|----------------|---------------------------------------|
| String         | \`<Card>Hello</Card>\`                |
| JSX elements   | \`<Card><p>...</p></Card>\`           |
| Arrays         | \`<Card>{items.map(...)}</Card>\`     |
| Functions      | \`<Card>{(data) => <p>{data}</p>}</Card>\` (render props) |
| null/undefined | Renders nothing                       |

---

## Component Composition Patterns

### Containment (Slots Pattern)

Pass different pieces of UI as named props — similar to "slots" in Vue or Web Components:

\`\`\`jsx
function Layout({ header, sidebar, children }) {
  return (
    <div className="layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

<Layout
  header={<Navbar />}
  sidebar={<SideMenu />}
>
  <ArticleContent />
</Layout>
\`\`\`

### Specialization

A generic component renders a more specific version of itself:

\`\`\`jsx
function Dialog({ title, message, children }) {
  return (
    <div className="dialog">
      <h2>{title}</h2>
      <p>{message}</p>
      {children}
    </div>
  );
}

function ConfirmDeleteDialog({ itemName, onConfirm }) {
  return (
    <Dialog title="Confirm Delete" message={\`Delete "\${itemName}" permanently?\`}>
      <button onClick={onConfirm} className="btn-danger">Delete</button>
    </Dialog>
  );
}
\`\`\`

### Render Props (Introduction)

A render prop is a function prop that a component uses to know **what** to render:

\`\`\`jsx
function DataFetcher({ url, render }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData);
  }, [url]);
  return render(data);
}

// Usage
<DataFetcher
  url="/api/users"
  render={(users) =>
    users ? <UserList users={users} /> : <Loading />
  }
/>
\`\`\`

> Today, **custom hooks** have largely replaced render props for logic reuse, but the pattern still appears in libraries like React Router (\`<Route render={...} />\`) and in interview questions.

---

## Prop Drilling & Solutions

**Prop drilling** is the practice of passing props through multiple intermediate components that don't use the data themselves:

\`\`\`
App → Dashboard → Sidebar → UserMenu → Avatar
         ↑ theme prop threaded through every level
\`\`\`

### Solutions

| Solution            | When to Use                                  |
|---------------------|----------------------------------------------|
| Component composition | Move the consuming component up; pass as children |
| React Context       | Truly global data (theme, auth, locale)       |
| State management    | Complex shared state (Redux, Zustand, Jotai)  |

**Composition fix example:**

\`\`\`jsx
// Instead of drilling 'user' through Sidebar → UserMenu → Avatar,
// render Avatar at the top and pass it down as JSX:
function Dashboard({ user }) {
  const avatar = <Avatar src={user.avatar} />;
  return <Sidebar userSlot={avatar} />;
}
\`\`\`

---

## PropTypes (Runtime Validation)

PropTypes provide **runtime type-checking in development** builds:

\`\`\`jsx
import PropTypes from 'prop-types';

function UserCard({ name, age, role, onSelect }) {
  return (/* ... */);
}

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  role: PropTypes.oneOf(['admin', 'editor', 'viewer']),
  onSelect: PropTypes.func,
  tags: PropTypes.arrayOf(PropTypes.string),
  address: PropTypes.shape({
    street: PropTypes.string,
    city: PropTypes.string.isRequired,
  }),
};
\`\`\`

> **Modern Alternative:** TypeScript interfaces/types replace PropTypes with **compile-time** safety and better IDE support. Most new projects use TypeScript.

---

## Lifting State Up

When two sibling components need to share state, **lift it up** to their nearest common ancestor:

\`\`\`jsx
function TemperatureConverter() {
  const [celsius, setCelsius] = useState('');

  const fahrenheit = celsius ? (parseFloat(celsius) * 9/5 + 32).toFixed(1) : '';

  return (
    <div>
      <TemperatureInput
        label="Celsius"
        value={celsius}
        onChange={(val) => setCelsius(val)}
      />
      <TemperatureInput
        label="Fahrenheit"
        value={fahrenheit}
        onChange={(val) => setCelsius(((parseFloat(val) - 32) * 5/9).toFixed(1))}
      />
    </div>
  );
}

function TemperatureInput({ label, value, onChange }) {
  return (
    <label>
      {label}:
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
\`\`\`

### Rules of Lifting State

1. Identify the **nearest common ancestor** of the components that need the shared data.
2. Move the state to that ancestor.
3. Pass the state value **down** as props and pass a **setter callback** so children can request changes.
4. The ancestor is the **single source of truth**.

---

## Quick-Reference Cheat Sheet

| Concept            | Key Point                                                    |
|--------------------|--------------------------------------------------------------|
| Function component | Plain function → props in, JSX out                          |
| Class component    | Extends \`React.Component\`, uses \`render()\` (legacy)      |
| Props direction    | Top-down only (unidirectional)                               |
| Props mutability   | Read-only — never mutate                                     |
| children prop      | Content between opening/closing tags                         |
| Default values     | Destructuring defaults or \`defaultProps\`                    |
| Composition        | Containment (slots), specialization, render props            |
| Prop drilling fix  | Composition, Context, state libraries                        |
| PropTypes          | Runtime dev-only checks; prefer TypeScript                   |
| Lifting state      | Move shared state to nearest common ancestor                 |
`,
  },

  // ──────────────────────────────────────────────
  // LESSON 3 — Events & Conditional Rendering
  // ──────────────────────────────────────────────
  {
    title: "Events and Conditional Rendering",
    slug: "events-conditionals",
    summary:
      "Master React's SyntheticEvent system, all common event types, event delegation, passing arguments to handlers, and every conditional rendering pattern you'll encounter in interviews.",
    difficulty_level: "beginner",
    estimated_time: 60,
    order_index: 3,
    key_points: [
      "React wraps native browser events in SyntheticEvent objects that normalize cross-browser differences",
      "Event handlers are passed as camelCase props (onClick, onChange, onSubmit) and receive a SyntheticEvent",
      "React uses event delegation — all events are attached at the root, not on individual DOM nodes",
      "Use event.preventDefault() to stop default behavior and event.stopPropagation() to stop bubbling",
      "Pass arguments to handlers with arrow functions or .bind() — never call the function directly in JSX",
      "Conditional rendering patterns include ternary, &&, if/else extraction, switch/case, and early returns",
      "Returning null from a component or expression renders nothing without affecting lifecycle or hooks",
      "The && operator has a gotcha with falsy values like 0 — always ensure the left side is truly boolean",
    ],
    content: `
# Events and Conditional Rendering

## React's SyntheticEvent System

React does **not** attach event listeners directly to DOM nodes. Instead, it uses **event delegation**: a single listener is attached at the **root** of the React tree, and React dispatches events to the appropriate handlers internally.

Every event handler receives a **SyntheticEvent** — a cross-browser wrapper around the native browser event.

\`\`\`jsx
function handleClick(event) {
  // 'event' is a SyntheticEvent, not a native Event
  console.log(event.type);          // "click"
  console.log(event.nativeEvent);   // Access the underlying native event
  console.log(event.target);        // The DOM element that triggered the event
  console.log(event.currentTarget); // The DOM element the handler is attached to
}

<button onClick={handleClick}>Click me</button>
\`\`\`

### SyntheticEvent Key Properties

| Property / Method      | Description                                      |
|------------------------|--------------------------------------------------|
| \`type\`                | Event type string ("click", "change", etc.)      |
| \`target\`              | Element that initiated the event                 |
| \`currentTarget\`       | Element the handler is registered on             |
| \`nativeEvent\`         | Underlying browser-native event                  |
| \`preventDefault()\`    | Prevents default browser behavior                |
| \`stopPropagation()\`   | Stops event from bubbling up the React tree      |
| \`isPropagationStopped()\` | Returns true if stopPropagation was called    |
| \`persist()\`           | (Legacy) Keeps event properties after handler returns |

> **React 17+ Note:** SyntheticEvent objects are no longer pooled, so you no longer need to call \`event.persist()\` to access event properties asynchronously. In React 16 and earlier, the event object was reused (pooled) and nullified after the handler returned.

---

## Common Event Types

### Mouse Events

\`\`\`jsx
function MouseDemo() {
  return (
    <div
      onClick={(e) => console.log('Clicked at', e.clientX, e.clientY)}
      onDoubleClick={() => console.log('Double clicked')}
      onMouseEnter={() => console.log('Mouse entered')}
      onMouseLeave={() => console.log('Mouse left')}
      onContextMenu={(e) => {
        e.preventDefault(); // Prevent default right-click menu
        console.log('Right clicked');
      }}
    >
      Interact with me
    </div>
  );
}
\`\`\`

### Keyboard Events

\`\`\`jsx
function KeyboardDemo() {
  const handleKeyDown = (e) => {
    console.log('Key:', e.key);        // "Enter", "a", "ArrowUp"
    console.log('Code:', e.code);      // "Enter", "KeyA", "ArrowUp"
    console.log('Ctrl?', e.ctrlKey);   // Boolean modifier keys
    console.log('Shift?', e.shiftKey);

    if (e.key === 'Enter' && e.ctrlKey) {
      console.log('Ctrl+Enter pressed — submit form');
    }
  };

  return <input onKeyDown={handleKeyDown} onKeyUp={() => {}} />;
}
\`\`\`

### Form Events

\`\`\`jsx
function FormDemo() {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // ← Critical: prevent page reload
    console.log('Submitted:', value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => console.log('Input focused')}
        onBlur={() => console.log('Input blurred')}
      />
      <select onChange={(e) => console.log('Selected:', e.target.value)}>
        <option value="a">A</option>
        <option value="b">B</option>
      </select>
      <button type="submit">Submit</button>
    </form>
  );
}
\`\`\`

### All Major Event Categories

| Category    | Events                                                      |
|-------------|-------------------------------------------------------------|
| Mouse       | onClick, onDoubleClick, onMouseDown/Up, onMouseEnter/Leave, onMouseMove, onContextMenu |
| Keyboard    | onKeyDown, onKeyUp, onKeyPress (deprecated)                 |
| Form        | onChange, onInput, onSubmit, onReset, onInvalid              |
| Focus       | onFocus, onBlur                                             |
| Touch       | onTouchStart, onTouchMove, onTouchEnd, onTouchCancel        |
| Drag        | onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop |
| Clipboard   | onCopy, onCut, onPaste                                      |
| Scroll      | onScroll                                                    |
| Wheel       | onWheel                                                     |
| Animation   | onAnimationStart, onAnimationEnd, onAnimationIteration      |
| Transition  | onTransitionEnd                                             |

---

## Event Delegation in React

Traditional DOM event handling attaches listeners to individual elements. React takes a different approach:

\`\`\`
Traditional DOM:
  button1.addEventListener('click', handler1);
  button2.addEventListener('click', handler2);

React (under the hood):
  rootNode.addEventListener('click', dispatchReactEvent);
  // React determines which component handler to call
\`\`\`

**Benefits:**
- Better memory efficiency (fewer listeners)
- Consistent behavior regardless of when elements mount/unmount
- Events work even on dynamically added elements

> **React 17 Change:** Events are now attached to the **root DOM container** instead of \`document\`. This improves compatibility when multiple React roots coexist on the same page.

---

## Passing Arguments to Event Handlers

### Arrow Function in JSX (Most Common)

\`\`\`jsx
function TodoList({ todos, onDelete }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
          {/* Arrow function wraps the call, passing the id */}
          <button onClick={() => onDelete(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
\`\`\`

### Using .bind()

\`\`\`jsx
<button onClick={onDelete.bind(null, todo.id)}>Delete</button>
\`\`\`

### ❌ Common Mistake — Calling the Function

\`\`\`jsx
// ❌ This CALLS onDelete immediately during render!
<button onClick={onDelete(todo.id)}>Delete</button>

// ✅ This passes a function that will call onDelete when clicked
<button onClick={() => onDelete(todo.id)}>Delete</button>
\`\`\`

### Accessing Both Event and Custom Arguments

\`\`\`jsx
function handleClick(id, event) {
  event.preventDefault();
  console.log('Clicked item:', id);
}

<button onClick={(e) => handleClick(todo.id, e)}>Click</button>
\`\`\`

### Extracting Handlers for Performance

When rendering large lists, creating arrow functions inline can be a concern. Extract the handler:

\`\`\`jsx
function TodoItem({ todo, onDelete }) {
  const handleDelete = useCallback(() => {
    onDelete(todo.id);
  }, [todo.id, onDelete]);

  return (
    <li>
      {todo.text}
      <button onClick={handleDelete}>Delete</button>
    </li>
  );
}
\`\`\`

---

## preventDefault & stopPropagation

### preventDefault

Prevents the browser's **default behavior** for an event:

\`\`\`jsx
// Prevent form submission / page reload
<form onSubmit={(e) => {
  e.preventDefault();
  // Handle form data in JS instead
}}>

// Prevent link navigation
<a href="/about" onClick={(e) => {
  e.preventDefault();
  navigate('/about'); // Use React Router instead
}}>About</a>
\`\`\`

### stopPropagation

Stops the event from **bubbling up** to parent elements:

\`\`\`jsx
function Card({ onClick }) {
  return (
    <div onClick={onClick}>
      <h3>Card Title</h3>
      <button onClick={(e) => {
        e.stopPropagation(); // Prevents the Card's onClick from firing
        console.log('Button clicked, card click NOT triggered');
      }}>
        Action
      </button>
    </div>
  );
}
\`\`\`

---

## Conditional Rendering — Complete Guide

### Pattern 1: Ternary Operator

Best for choosing between **two** alternatives:

\`\`\`jsx
function AuthButton({ isLoggedIn, onLogin, onLogout }) {
  return (
    <button onClick={isLoggedIn ? onLogout : onLogin}>
      {isLoggedIn ? 'Log Out' : 'Log In'}
    </button>
  );
}
\`\`\`

Nested ternaries are possible but discouraged for readability:

\`\`\`jsx
// ⚠️ Hard to read — prefer extraction
{status === 'loading' ? <Spinner /> : status === 'error' ? <Error /> : <Data />}
\`\`\`

### Pattern 2: Logical AND (&&)

Best for showing something **or nothing**:

\`\`\`jsx
function Mailbox({ unreadCount }) {
  return (
    <div>
      <h1>Inbox</h1>
      {unreadCount > 0 && (
        <p>You have {unreadCount} unread messages.</p>
      )}
    </div>
  );
}
\`\`\`

**The Falsy Value Gotcha:**

\`\`\`jsx
// ❌ BUG: When count is 0, React renders "0" on screen
{count && <Badge count={count} />}

// ✅ FIX: Convert to boolean first
{count > 0 && <Badge count={count} />}
{!!count && <Badge count={count} />}
{Boolean(count) && <Badge count={count} />}
\`\`\`

### Pattern 3: if/else with Early Return

Best for **guard clauses** at the top of a component:

\`\`\`jsx
function ProtectedPage({ user, isLoading }) {
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  if (!user.hasAccess) return <AccessDenied />;

  // Happy path — all guards passed
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <SecretContent />
    </div>
  );
}
\`\`\`

### Pattern 4: Variable Assignment

Extract the decision before the return:

\`\`\`jsx
function Notification({ type, message }) {
  let icon;
  let className;

  if (type === 'success') {
    icon = '✅';
    className = 'notification-success';
  } else if (type === 'warning') {
    icon = '⚠️';
    className = 'notification-warning';
  } else if (type === 'error') {
    icon = '❌';
    className = 'notification-error';
  } else {
    icon = 'ℹ️';
    className = 'notification-info';
  }

  return (
    <div className={className}>
      <span>{icon}</span>
      <p>{message}</p>
    </div>
  );
}
\`\`\`

### Pattern 5: switch/case

Best when there are **many discrete values**:

\`\`\`jsx
function StatusIcon({ status }) {
  switch (status) {
    case 'idle':
      return <IdleIcon />;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <CheckIcon />;
    case 'error':
      return <ErrorIcon />;
    default:
      return null;
  }
}
\`\`\`

### Pattern 6: Object Lookup (Mapping)

A cleaner alternative to switch for mapping values to components:

\`\`\`jsx
const STATUS_COMPONENTS = {
  idle: IdleIcon,
  loading: Spinner,
  success: CheckIcon,
  error: ErrorIcon,
};

function StatusIcon({ status }) {
  const Component = STATUS_COMPONENTS[status];
  return Component ? <Component /> : null;
}
\`\`\`

### Pattern 7: Rendering null

Returning \`null\` renders **nothing** but the component still mounts (hooks still run, effects still fire):

\`\`\`jsx
function Tooltip({ text, isVisible }) {
  if (!isVisible) return null;
  return <div className="tooltip">{text}</div>;
}
\`\`\`

> **Interview Tip:** \`null\`, \`undefined\`, \`true\`, and \`false\` are all valid React children that render nothing. This is why \`{condition && <Element />}\` works — when \`condition\` is \`false\`, React skips it.

---

## Best Practices for Event Handling

1. **Name handlers consistently** — prefix with \`handle\` in the defining component, prefix with \`on\` in props:

\`\`\`jsx
// Defining component
function SearchBar() {
  const handleChange = (e) => { /* ... */ };
  return <input onChange={handleChange} />;
}

// Parent passing a callback prop
<SearchBar onSearch={handleSearch} />
\`\`\`

2. **Keep handlers focused** — each handler should do one thing. Extract complex logic into separate functions or custom hooks.

3. **Avoid anonymous functions in renders for hot paths** — use \`useCallback\` when passing handlers to memoized children:

\`\`\`jsx
const handleSelect = useCallback((id) => {
  setSelectedId(id);
}, []);

<MemoizedList onSelect={handleSelect} />
\`\`\`

4. **Always call \`e.preventDefault()\`** on form submissions to prevent page reloads.

5. **Use semantic HTML** — prefer \`<button>\` over \`<div onClick>\` for accessibility (keyboard support, screen readers).

---

## Quick-Reference Cheat Sheet

| Concept                  | Key Point                                                    |
|--------------------------|--------------------------------------------------------------|
| SyntheticEvent           | Cross-browser wrapper; access native via \`.nativeEvent\`     |
| Event delegation         | All listeners attached at root (React 17+: root container)   |
| Handler naming           | \`handleX\` inside component, \`onX\` as prop name            |
| Passing args             | \`onClick={() => fn(id)}\` — never \`onClick={fn(id)}\`      |
| preventDefault           | Stops default browser behavior (form submit, link nav)       |
| stopPropagation          | Stops bubbling to parent handlers                            |
| Ternary                  | \`cond ? <A /> : <B />\` — two alternatives                  |
| && operator              | \`cond && <A />\` — show or nothing (beware falsy 0)         |
| Early return             | Guard clauses at top of component                            |
| switch / object lookup   | Many discrete conditions → map to components                 |
| null rendering           | Component still mounts; hooks still run                      |
`,
  },
];
