// ============================================================================
// React Fundamentals — Code Examples
// ============================================================================

const examples = {
  'intro-jsx': [
    {
      title: "Basic JSX Component",
      description: "A functional component using JSX with expressions, conditionals, and list rendering.",
      language: "javascript",
      code: `import React from 'react';

function UserCard({ user }) {
  const statusColor = user.isActive ? 'green' : 'gray';

  return (
    <div className="card">
      <img
        src={user.avatar}
        alt={\`\${user.name}'s avatar\`}
        style={{ borderColor: statusColor }}
      />
      <h2>{user.name}</h2>
      <p>{user.email}</p>

      {user.isActive ? (
        <span className="badge active">Online</span>
      ) : (
        <span className="badge offline">Offline</span>
      )}

      <h3>Skills</h3>
      <ul>
        {user.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserCard;`,
      explanation: "This component demonstrates: props destructuring, template literals in JSX, inline styles, ternary conditional rendering, and mapping over arrays with keys.",
      order_index: 1,
    },
    {
      title: "JSX vs createElement",
      description: "Side-by-side comparison showing how JSX compiles.",
      language: "javascript",
      code: `// JSX version — readable and concise
function App() {
  return (
    <div className="app">
      <h1>My App</h1>
      <p>Welcome!</p>
    </div>
  );
}

// Equivalent React.createElement version
function App() {
  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement('h1', null, 'My App'),
    React.createElement('p', null, 'Welcome!')
  );
}`,
      explanation: "JSX is syntactic sugar. Build tools (Babel/SWC) transform it into createElement calls. Understanding this helps debug edge cases.",
      order_index: 2,
    },
  ],
  'components-props': [
    {
      title: "Composable Card System",
      description: "A set of composable card components demonstrating the children pattern.",
      language: "javascript",
      code: `function Card({ children, className = '' }) {
  return <div className={\`rounded-xl border p-6 \${className}\`}>{children}</div>;
}

function CardHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function CardBody({ children }) {
  return <div className="space-y-3">{children}</div>;
}

function CardFooter({ children }) {
  return <div className="mt-4 pt-4 border-t flex justify-end gap-2">{children}</div>;
}

// Composed together:
function ProductCard({ product }) {
  return (
    <Card>
      <CardHeader title={product.name} subtitle={product.category} />
      <CardBody>
        <p>{product.description}</p>
        <p className="text-xl font-bold">\${product.price}</p>
      </CardBody>
      <CardFooter>
        <button className="btn-secondary">Details</button>
        <button className="btn-primary">Add to Cart</button>
      </CardFooter>
    </Card>
  );
}`,
      explanation: "Each Card sub-component is small and focused. They compose together flexibly — you can use CardHeader without CardFooter, or nest any content inside CardBody.",
      order_index: 1,
    },
  ],
  'events-conditionals': [
    {
      title: "Interactive Toggle Component",
      description: "Demonstrates events and conditional rendering together.",
      language: "javascript",
      code: `import { useState } from 'react';

function TogglePanel({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="panel">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
      >
        {title} {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="panel-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default TogglePanel;`,
      explanation: "Combines onClick event handling with conditional rendering (&&). The aria-expanded attribute improves accessibility.",
      order_index: 1,
    },
  ],
};

export default examples;
