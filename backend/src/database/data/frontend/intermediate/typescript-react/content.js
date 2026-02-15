// ============================================================================
// TypeScript with React — Content
// ============================================================================

export const topic = {
  "name": "TypeScript with React",
  "slug": "typescript-react",
  "description": "Add type safety to React applications — typed props, hooks, events, and generic components.",
  "estimated_time": 160,
  "order_index": 6
};

export const lessons = [
  {
    title: "Typing Components, Props & Hooks",
    slug: "typing-components-hooks",
    summary: "Add type safety to React components — typed props, children, events, and hooks.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "Use interface or type for component props",
  "React.FC is optional — explicit return types are fine",
  "Type event handlers: React.ChangeEvent<HTMLInputElement>, React.FormEvent<HTMLFormElement>",
  "useState<Type>() provides type inference for state",
  "Generics make reusable components type-safe"
],
    content: `# TypeScript with React

## Typing Props

\`\`\`tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: React.ReactNode;
}

function Button({ label, onClick, variant = 'primary', disabled = false, icon }: ButtonProps) {
  return (
    <button className={\`btn btn-\${variant}\`} onClick={onClick} disabled={disabled}>
      {icon && <span className="icon">{icon}</span>}
      {label}
    </button>
  );
}
\`\`\`

## Typing Children

\`\`\`tsx
interface CardProps {
  title: string;
  children: React.ReactNode;  // Accepts any renderable content
}

// For components that MUST have children:
interface StrictCardProps {
  children: React.ReactElement;  // Only React elements, no strings
}
\`\`\`

## Typing Hooks

\`\`\`tsx
// useState with explicit type
const [user, setUser] = useState<User | null>(null);

// useRef with DOM element
const inputRef = useRef<HTMLInputElement>(null);

// useReducer
type Action = { type: 'INCREMENT' } | { type: 'SET'; payload: number };
const [count, dispatch] = useReducer(reducer, 0);
\`\`\`

## Typing Events

\`\`\`tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setQuery(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter') submit();
};
\`\`\`

## Generic Components

\`\`\`tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// Usage — TypeScript infers T as User
<List
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>
\`\`\`
`,
  },
];
