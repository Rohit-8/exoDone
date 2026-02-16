// ============================================================================
// React Fundamentals — Code Examples (Enhanced)
// ============================================================================

const examples = {
  'intro-jsx': [
    {
      title: 'JSX vs React.createElement Comparison',
      description:
        'Understanding how JSX compiles down to React.createElement calls, and why JSX is the preferred syntax for building React UIs.',
      language: 'javascript',
      code: `// --- JSX Syntax (what you write) ---
function WelcomeBanner({ user, notifications }) {
  return (
    <div className="banner">
      <h1>Welcome back, {user.name}!</h1>
      <p className="subtitle">
        You have {notifications.length} unread
        {notifications.length === 1 ? ' message' : ' messages'}.
      </p>
      <ul className="notification-list">
        {notifications.map((note) => (
          <li key={note.id} className={\`note \${note.urgent ? 'urgent' : ''}\`}>
            {note.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Equivalent React.createElement calls (what the compiler produces) ---
function WelcomeBannerClassic({ user, notifications }) {
  return React.createElement(
    'div',
    { className: 'banner' },
    React.createElement('h1', null, 'Welcome back, ', user.name, '!'),
    React.createElement(
      'p',
      { className: 'subtitle' },
      'You have ', notifications.length, ' unread',
      notifications.length === 1 ? ' message' : ' messages', '.'
    ),
    React.createElement(
      'ul',
      { className: 'notification-list' },
      notifications.map((note) =>
        React.createElement(
          'li',
          { key: note.id, className: \`note \${note.urgent ? 'urgent' : ''}\` },
          note.text
        )
      )
    )
  );
}

// Usage
const sampleUser = { name: 'Alice' };
const sampleNotes = [
  { id: 1, text: 'Deployment succeeded', urgent: false },
  { id: 2, text: 'Server CPU spike detected', urgent: true },
];

// Both render identical output:
// <WelcomeBanner user={sampleUser} notifications={sampleNotes} />
// <WelcomeBannerClassic user={sampleUser} notifications={sampleNotes} />`,
      explanation:
        'JSX is syntactic sugar over React.createElement(). The compiler (Babel / SWC) transforms every JSX tag into a createElement call. JSX allows you to embed JavaScript expressions inside curly braces, use className instead of class, and write HTML-like syntax that is far easier to read and maintain than nested createElement calls. Understanding this compilation step helps debug unexpected rendering and clarifies that JSX is "just JavaScript".',
      order_index: 1,
    },
    {
      title: 'Fragments and Rendering Multiple Elements',
      description:
        'Using React Fragments to return multiple sibling elements without adding extra DOM nodes, including the shorthand syntax and keyed fragments.',
      language: 'javascript',
      code: `import React, { Fragment } from 'react';

// Problem: Returning siblings without a wrapper adds an unnecessary <div>
function BadTable() {
  return (
    <table>
      <tbody>
        {/* This would break table semantics if we wrapped rows in a <div> */}
        <TableRows />
      </tbody>
    </table>
  );
}

// Solution 1: Explicit <Fragment> — required when you need a key
function TableRows() {
  const data = [
    { id: 'r1', name: 'React', category: 'Library' },
    { id: 'r2', name: 'Next.js', category: 'Framework' },
    { id: 'r3', name: 'Vite', category: 'Build Tool' },
  ];

  return data.map((item) => (
    <Fragment key={item.id}>
      <tr>
        <td>{item.name}</td>
        <td>{item.category}</td>
      </tr>
    </Fragment>
  ));
}

// Solution 2: Shorthand <> ... </> — when keys are not needed
function UserGreeting({ firstName, lastName }) {
  return (
    <>
      <h2>
        Hello, {firstName} {lastName}
      </h2>
      <p>Check out your personalised dashboard below.</p>
      <hr />
    </>
  );
}

// Solution 3: Nested fragments for complex layouts
function PageHeader({ title, breadcrumbs }) {
  return (
    <>
      <nav aria-label="breadcrumb">
        <ol>
          {breadcrumbs.map((crumb, idx) => (
            <Fragment key={crumb.path}>
              <li>
                <a href={crumb.path}>{crumb.label}</a>
              </li>
              {idx < breadcrumbs.length - 1 && <li aria-hidden="true"> / </li>}
            </Fragment>
          ))}
        </ol>
      </nav>
      <h1>{title}</h1>
    </>
  );
}`,
      explanation:
        'React components must return a single root element. Wrapping siblings in a <div> works but can break CSS layouts and HTML semantics (e.g., inside <table> or <dl>). Fragments (<Fragment> or the shorthand <></>) let you group children without emitting extra DOM nodes. Use the explicit <Fragment key={...}> form when mapping over lists so React can track each fragment. The shorthand <></> is ideal for simple groupings where no key or attributes are needed.',
      order_index: 2,
    },
    {
      title: 'Conditional Rendering Patterns in JSX',
      description:
        'Exploring the most common conditional rendering techniques — ternary expressions, logical AND, early returns, and IIFE patterns — with practical examples.',
      language: 'javascript',
      code: `import React from 'react';

function NotificationCenter({ user, notifications, isLoading, error }) {
  // Pattern 1: Early return — bail out before rendering anything complex
  if (error) {
    return (
      <div className="error-banner" role="alert">
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  // Pattern 2: Ternary — choose between two complete subtrees
  if (isLoading) {
    return <p className="spinner">Loading notifications…</p>;
  }

  return (
    <section className="notifications">
      <h2>Notifications</h2>

      {/* Pattern 3: Logical AND (&&) — render or render nothing */}
      {user.isAdmin && (
        <div className="admin-bar">
          <button>Clear All Notifications</button>
        </div>
      )}

      {/* Pattern 4: Ternary inside JSX — inline two-branch choice */}
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((n) => (
            <li key={n.id} className={n.read ? 'read' : 'unread'}>
              <span className="icon">
                {/* Pattern 5: Nested ternary (use sparingly) */}
                {n.type === 'success'
                  ? '✅'
                  : n.type === 'warning'
                  ? '⚠️'
                  : 'ℹ️'}
              </span>
              <span>{n.message}</span>
              <time dateTime={n.timestamp}>
                {new Date(n.timestamp).toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">You're all caught up — no new notifications.</p>
      )}

      {/* Pattern 6: Variable assignment before return */}
      {(() => {
        const urgent = notifications.filter((n) => n.urgent);
        if (urgent.length === 0) return null;
        return (
          <aside className="urgent-summary">
            <strong>{urgent.length}</strong> urgent item{urgent.length > 1 ? 's' : ''} need
            your attention.
          </aside>
        );
      })()}
    </section>
  );
}

export default NotificationCenter;`,
      explanation:
        'React does not have a built-in "if" directive like Angular or Vue; instead you use plain JavaScript. Early returns keep the happy path unindented. Ternaries (condition ? A : B) are perfect when you have exactly two branches. Logical AND (condition && <JSX />) is ideal for "show or hide" — but beware of falsy values like 0 that still render. For complex branching, extract logic into variables or helper functions above the return statement, or use an IIFE inside JSX. Each pattern has trade-offs in readability; prefer the simplest one that fits your case.',
      order_index: 3,
    },
  ],

  'components-props': [
    {
      title: 'Composable Card System with Props',
      description:
        'Building a flexible, reusable card component system that demonstrates prop passing, default props, and the children pattern for maximum composability.',
      language: 'javascript',
      code: `import React from 'react';

// --- Base Card shell ---
function Card({ children, variant = 'default', className = '' }) {
  const variantStyles = {
    default: 'card',
    outlined: 'card card--outlined',
    elevated: 'card card--elevated',
  };

  return (
    <div className={\`\${variantStyles[variant] || variantStyles.default} \${className}\`.trim()}>
      {children}
    </div>
  );
}

// --- Composable sub-components ---
function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card__header">
      <div>
        <h3 className="card__title">{title}</h3>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card__action">{action}</div>}
    </div>
  );
}

function CardBody({ children, padding = true }) {
  return (
    <div className={\`card__body\${padding ? '' : ' card__body--flush'}\`}>
      {children}
    </div>
  );
}

function CardFooter({ children, align = 'right' }) {
  return (
    <div className={\`card__footer card__footer--\${align}\`}>
      {children}
    </div>
  );
}

// --- Real-world usage: a product card ---
function ProductCard({ product, onAddToCart }) {
  const { name, price, description, imageUrl, inStock } = product;

  return (
    <Card variant={inStock ? 'elevated' : 'outlined'}>
      <CardHeader
        title={name}
        subtitle={\`$\${price.toFixed(2)}\`}
        action={
          inStock
            ? <span className="badge badge--success">In Stock</span>
            : <span className="badge badge--danger">Sold Out</span>
        }
      />
      <CardBody>
        <img src={imageUrl} alt={name} className="product-img" />
        <p>{description}</p>
      </CardBody>
      <CardFooter>
        <button
          disabled={!inStock}
          onClick={() => onAddToCart(product)}
          className="btn btn--primary"
        >
          {inStock ? 'Add to Cart' : 'Notify Me'}
        </button>
      </CardFooter>
    </Card>
  );
}

export { Card, CardHeader, CardBody, CardFooter, ProductCard };`,
      explanation:
        'This example demonstrates the "compound component" pattern: a base Card component accepts children, while CardHeader, CardBody, and CardFooter are composable pieces the consumer assembles in any order. Props like variant and align use default values so the component works out of the box. The ProductCard shows a real-world composition, passing dynamic data as props and using the children pattern for flexible layout. This approach avoids a monolithic config-object API and makes each piece independently testable and stylable.',
      order_index: 1,
    },
    {
      title: 'Prop Drilling vs Composition — Solving with Children',
      description:
        'Illustrating the prop drilling problem and how the React composition model (passing components as children or props) eliminates unnecessary intermediate prop forwarding.',
      language: 'javascript',
      code: `import React from 'react';

// ========== PROBLEM: Prop Drilling ==========
// "theme" is passed through 3 levels just to reach InnerButton.

function AppDrilled({ theme }) {
  return <LayoutDrilled theme={theme} />;
}

function LayoutDrilled({ theme }) {
  // Layout doesn't use theme — it just forwards it
  return (
    <main>
      <SidebarDrilled theme={theme} />
    </main>
  );
}

function SidebarDrilled({ theme }) {
  // Sidebar also just forwards
  return (
    <aside>
      <InnerButton theme={theme} />
    </aside>
  );
}

function InnerButton({ theme }) {
  return (
    <button className={\`btn btn--\${theme}\`}>
      Click me ({theme})
    </button>
  );
}

// ========== SOLUTION: Composition via children ==========
// Only the top level knows about "theme"; intermediaries are agnostic.

function AppComposed({ theme }) {
  // Build the themed element at the top and pass it DOWN as children
  const themedButton = (
    <button className={\`btn btn--\${theme}\`}>
      Click me ({theme})
    </button>
  );

  return (
    <LayoutComposed>
      <SidebarComposed>
        {themedButton}
      </SidebarComposed>
    </LayoutComposed>
  );
}

function LayoutComposed({ children }) {
  return <main>{children}</main>;
}

function SidebarComposed({ children }) {
  return <aside>{children}</aside>;
}

// ========== SOLUTION 2: Render-prop slot pattern ==========
function PageLayout({ header, sidebar, content }) {
  return (
    <div className="page">
      <header className="page__header">{header}</header>
      <div className="page__body">
        <nav className="page__sidebar">{sidebar}</nav>
        <main className="page__content">{content}</main>
      </div>
    </div>
  );
}

// Usage
function Dashboard({ user }) {
  return (
    <PageLayout
      header={<h1>Welcome, {user.name}</h1>}
      sidebar={<NavMenu role={user.role} />}
      content={<DashboardStats userId={user.id} />}
    />
  );
}`,
      explanation:
        'Prop drilling occurs when intermediate components receive and forward props they never use, making refactoring painful and code noisy. React\'s composition model offers two elegant fixes: (1) Build elements at the top level where data is available and pass them as children — intermediaries render {children} without knowing what they contain. (2) Use named "slot" props (header, sidebar, content) to inject full JSX trees into a layout component. Both approaches keep intermediate components decoupled, make data flow explicit, and reduce the need for Context or state management libraries for pure UI composition.',
      order_index: 2,
    },
    {
      title: 'Reusable List Component with Render Props',
      description:
        'Creating a generic, reusable list component that accepts a renderItem function prop, showing how components can delegate rendering decisions to their consumers.',
      language: 'javascript',
      code: `import React from 'react';

// --- Generic DataList component ---
function DataList({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items to display.',
  ordered = false,
}) {
  if (!items || items.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
  }

  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag className="data-list">
      {items.map((item, index) => (
        <li key={keyExtractor(item, index)} className="data-list__item">
          {renderItem(item, index)}
        </li>
      ))}
    </ListTag>
  );
}

// --- Usage 1: User list ---
function UserDirectory({ users }) {
  return (
    <DataList
      items={users}
      keyExtractor={(user) => user.id}
      emptyMessage="No users found."
      renderItem={(user) => (
        <div className="user-row">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="avatar avatar--sm"
          />
          <div>
            <strong>{user.name}</strong>
            <span className="text-muted"> — {user.email}</span>
          </div>
          <span className={\`status status--\${user.isOnline ? 'online' : 'offline'}\`}>
            {user.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      )}
    />
  );
}

// --- Usage 2: Task checklist (ordered) ---
function TaskChecklist({ tasks, onToggle }) {
  return (
    <DataList
      items={tasks}
      ordered
      keyExtractor={(task) => task.id}
      emptyMessage="All tasks completed 🎉"
      renderItem={(task, index) => (
        <label className={\`task \${task.done ? 'task--done' : ''}\`}>
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => onToggle(task.id)}
          />
          <span className="task__text">
            {index + 1}. {task.title}
          </span>
          {task.dueDate && (
            <time className="task__due" dateTime={task.dueDate}>
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </time>
          )}
        </label>
      )}
    />
  );
}

export { DataList, UserDirectory, TaskChecklist };`,
      explanation:
        'The render-prop pattern (here via renderItem) lets a component handle iteration logic, empty states, and list semantics while delegating the visual rendering of each item to the consumer. keyExtractor keeps key assignment flexible. This is the same pattern used by React Native\'s FlatList and many popular UI libraries. It maximises reusability: one DataList powers both a user directory and a task checklist with completely different markup, without any conditional branching inside DataList itself.',
      order_index: 3,
    },
  ],

  'events-conditionals': [
    {
      title: 'Form with Real-Time Validation and Event Handling',
      description:
        'Building a signup form with controlled inputs, real-time field validation, and proper event handling including preventing default submission behaviour.',
      language: 'javascript',
      code: `import React, { useState } from 'react';

const validators = {
  username: (v) => {
    if (!v) return 'Username is required.';
    if (v.length < 3) return 'Must be at least 3 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Only letters, numbers, and underscores.';
    return '';
  },
  email: (v) => {
    if (!v) return 'Email is required.';
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  },
  password: (v) => {
    if (!v) return 'Password is required.';
    if (v.length < 8) return 'Must be at least 8 characters.';
    if (!/[A-Z]/.test(v)) return 'Must contain an uppercase letter.';
    if (!/[0-9]/.test(v)) return 'Must contain a number.';
    return '';
  },
};

function SignupForm({ onSubmit }) {
  const [values, setValues] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single handler for all fields (event delegation via name attribute)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Validate on change only if the field has been touched
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
    }
  };

  // Mark field as touched on blur and validate
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent full page reload

    // Validate all fields
    const newErrors = {};
    Object.keys(validators).forEach((field) => {
      newErrors[field] = validators[field](values[field]);
    });
    setErrors(newErrors);
    setTouched({ username: true, email: true, password: true });

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldMeta = (name) => ({
    hasError: touched[name] && !!errors[name],
    message: touched[name] ? errors[name] : '',
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="signup-form">
      {['username', 'email', 'password'].map((field) => {
        const meta = fieldMeta(field);
        return (
          <div key={field} className={\`form-group \${meta.hasError ? 'form-group--error' : ''}\`}>
            <label htmlFor={field}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              id={field}
              name={field}
              type={field === 'password' ? 'password' : 'text'}
              value={values[field]}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={meta.hasError}
              aria-describedby={meta.hasError ? \`\${field}-error\` : undefined}
            />
            {meta.hasError && (
              <span id={\`\${field}-error\`} className="error-text" role="alert">
                {meta.message}
              </span>
            )}
          </div>
        );
      })}
      <button type="submit" disabled={isSubmitting} className="btn btn--primary">
        {isSubmitting ? 'Creating account…' : 'Sign Up'}
      </button>
    </form>
  );
}

export default SignupForm;`,
      explanation:
        'This form showcases several key React event-handling concepts: (1) controlled inputs — every field\'s value is driven by state. (2) A single handleChange uses e.target.name for event delegation, avoiding separate handlers per field. (3) onBlur marks fields as "touched" so validation errors only appear after the user interacts with a field. (4) e.preventDefault() in handleSubmit stops the browser\'s default form submission. (5) Async submission with a loading state disables the button to prevent double-submits. (6) Accessibility attributes (aria-invalid, role="alert") ensure screen readers announce errors.',
      order_index: 1,
    },
    {
      title: 'Interactive Toggle Panel with Keyboard and Mouse Events',
      description:
        'Building an accessible accordion / toggle panel that responds to clicks, keyboard events, and demonstrates event propagation control with stopPropagation.',
      language: 'javascript',
      code: `import React, { useState, useCallback } from 'react';

function Accordion({ items }) {
  const [openIds, setOpenIds] = useState(new Set());

  const toggle = useCallback((id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="accordion" role="tablist">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          item={item}
          isOpen={openIds.has(item.id)}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}

function AccordionItem({ item, isOpen, onToggle }) {
  const headerId = \`accordion-header-\${item.id}\`;
  const panelId = \`accordion-panel-\${item.id}\`;

  // Handle keyboard: Enter and Space toggle, just like native buttons
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll on Space
      onToggle(item.id);
    }
  };

  // Demonstrate stopPropagation: clicking a nested action should NOT toggle the panel
  const handleActionClick = (e, action) => {
    e.stopPropagation(); // Prevent the click from bubbling to the header
    alert(\`Action: \${action}\`);
  };

  return (
    <div className={\`accordion__item \${isOpen ? 'accordion__item--open' : ''}\`}>
      <div
        id={headerId}
        role="tab"
        aria-selected={isOpen}
        aria-controls={panelId}
        tabIndex={0}
        className="accordion__header"
        onClick={() => onToggle(item.id)}
        onKeyDown={handleKeyDown}
      >
        <span className="accordion__icon" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
        <span className="accordion__title">{item.title}</span>

        {/* Nested action that should NOT trigger the toggle */}
        {item.canDelete && (
          <button
            className="btn btn--sm btn--danger"
            onClick={(e) => handleActionClick(e, 'delete')}
          >
            Delete
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={headerId}
          className="accordion__body"
        >
          <p>{item.content}</p>
        </div>
      )}
    </div>
  );
}

// --- Example data ---
const faqItems = [
  { id: 1, title: 'What is React?', content: 'A JavaScript library for building UIs.', canDelete: false },
  { id: 2, title: 'What are hooks?', content: 'Functions that let you use state in function components.', canDelete: true },
  { id: 3, title: 'What is JSX?', content: 'A syntax extension that looks like HTML in JavaScript.', canDelete: true },
];

export default function FAQPage() {
  return (
    <section>
      <h1>Frequently Asked Questions</h1>
      <Accordion items={faqItems} />
    </section>
  );
}`,
      explanation:
        'This example covers multiple event concepts: (1) onClick on the header toggles the panel open/closed. (2) onKeyDown handles keyboard accessibility — Enter and Space mirror click behaviour, with e.preventDefault() stopping the spacebar from scrolling the page. (3) e.stopPropagation() on the nested Delete button prevents the click from bubbling up to the header\'s onClick, which would inadvertently toggle the panel. (4) State is managed as a Set of open IDs, allowing multiple panels to be open simultaneously. (5) ARIA roles (tablist, tab, tabpanel) and attributes make the accordion screen-reader friendly.',
      order_index: 2,
    },
    {
      title: 'Event Delegation with a Dynamic Task Board',
      description:
        'Demonstrating synthetic event delegation in React by handling clicks at a parent level and identifying which child was clicked using data attributes, mimicking a Kanban-style task board.',
      language: 'javascript',
      code: `import React, { useState } from 'react';

const COLUMNS = ['todo', 'in-progress', 'done'];

const initialTasks = [
  { id: 1, title: 'Design homepage', status: 'todo' },
  { id: 2, title: 'Set up database', status: 'in-progress' },
  { id: 3, title: 'Write unit tests', status: 'todo' },
  { id: 4, title: 'Deploy to staging', status: 'done' },
  { id: 5, title: 'Code review', status: 'in-progress' },
];

function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedId, setDraggedId] = useState(null);

  // Delegated click handler — single handler on the board container
  const handleBoardClick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return; // Click was not on an action button

    const action = btn.dataset.action;
    const taskId = Number(btn.dataset.taskId);

    switch (action) {
      case 'move-right':
        moveTask(taskId, 1);
        break;
      case 'move-left':
        moveTask(taskId, -1);
        break;
      case 'delete':
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        break;
      default:
        break;
    }
  };

  const moveTask = (taskId, direction) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const currentIdx = COLUMNS.indexOf(task.status);
        const nextIdx = Math.max(0, Math.min(COLUMNS.length - 1, currentIdx + direction));
        return { ...task, status: COLUMNS[nextIdx] };
      })
    );
  };

  // Drag-and-drop handlers
  const handleDragStart = (e) => {
    const card = e.target.closest('[data-task-id]');
    if (card) setDraggedId(Number(card.dataset.taskId));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const column = e.target.closest('[data-column]');
    if (!column || draggedId === null) return;

    const targetStatus = column.dataset.column;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedId ? { ...t, status: targetStatus } : t))
    );
    setDraggedId(null);
  };

  const handleDragOver = (e) => e.preventDefault(); // Allow drop

  return (
    <div
      className="board"
      onClick={handleBoardClick}
      onDragStart={handleDragStart}
    >
      {COLUMNS.map((col) => (
        <div
          key={col}
          className="board__column"
          data-column={col}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <h3 className="board__column-title">{col.replace('-', ' ').toUpperCase()}</h3>
          {tasks
            .filter((t) => t.status === col)
            .map((task) => (
              <div
                key={task.id}
                className="board__card"
                draggable
                data-task-id={task.id}
              >
                <span>{task.title}</span>
                <div className="board__card-actions">
                  {col !== COLUMNS[0] && (
                    <button data-action="move-left" data-task-id={task.id}>◀</button>
                  )}
                  {col !== COLUMNS[COLUMNS.length - 1] && (
                    <button data-action="move-right" data-task-id={task.id}>▶</button>
                  )}
                  <button data-action="delete" data-task-id={task.id}>✕</button>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

export default TaskBoard;`,
      explanation:
        'Event delegation means attaching a single event listener on a parent element instead of one per child. Here, handleBoardClick on the board container catches every button click, then uses e.target.closest("[data-action]") and data-* attributes to identify which button was clicked and which task it belongs to. This is efficient for dynamic lists where items are added and removed frequently. The example also shows drag-and-drop events (onDragStart, onDragOver, onDrop) using the same delegation pattern with data-task-id and data-column attributes.',
      order_index: 3,
    },
  ],
};

export default examples;
