import pool from '../config/database.js';

async function seedTypeScriptReact() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding TypeScript with React lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'typescript-react'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'TypeScript with React: Complete Guide', 'typescript-react-guide', $2, 'Master TypeScript in React applications with component typing, props, hooks, generics, and advanced patterns', 'intermediate', 55, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# TypeScript with React: Complete Guide

## Why TypeScript with React?

**TypeScript** adds static typing to JavaScript, making React applications more robust and maintainable.

### Benefits of TypeScript in React

✅ **Type Safety**: Catch errors at compile-time
✅ **Better IntelliSense**: Enhanced autocomplete in IDEs
✅ **Self-Documentation**: Types serve as documentation
✅ **Refactoring Confidence**: Safe code changes
✅ **Team Collaboration**: Clear contracts between components
✅ **Early Bug Detection**: Find issues before runtime

## Setting Up TypeScript with React

### Creating a New Project

\\\`\\\`\\\`bash
# Using Vite (Recommended)
npm create vite@latest my-app -- --template react-ts

# Using Create React App
npx create-react-app my-app --template typescript
\\\`\\\`\\\`

### Adding TypeScript to Existing Project

\\\`\\\`\\\`bash
npm install --save-dev typescript @types/react @types/react-dom
npm install --save-dev @types/node
\\\`\\\`\\\`

### tsconfig.json Configuration

\\\`\\\`\\\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
\\\`\\\`\\\`

## Component Props Typing

### Basic Function Component with Props

\\\`\\\`\\\`typescript
// Method 1: Inline type
function Greeting({ name, age }: { name: string; age: number }) {
  return <h1>Hello {name}, you are {age} years old</h1>;
}

// Method 2: Interface (Recommended)
interface GreetingProps {
  name: string;
  age: number;
  isStudent?: boolean; // Optional prop
}

function Greeting({ name, age, isStudent = false }: GreetingProps) {
  return (
    <div>
      <h1>Hello {name}</h1>
      <p>Age: {age}</p>
      {isStudent && <span>Student</span>}
    </div>
  );
}

// Method 3: Type alias
type GreetingProps = {
  name: string;
  age: number;
  isStudent?: boolean;
};
\\\`\\\`\\\`

### Props with Children

\\\`\\\`\\\`typescript
import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode; // Any valid React child
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage
<Card title="My Card">
  <p>This is the content</p>
  <button>Click me</button>
</Card>
\\\`\\\`\\\`

### Props with Event Handlers

\\\`\\\`\\\`typescript
interface ButtonProps {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// Usage
<Button 
  label="Submit" 
  onClick={(e) => {
    console.log('Button clicked', e.currentTarget);
  }} 
/>
\\\`\\\`\\\`

## React Hooks with TypeScript

### useState Hook

\\\`\\\`\\\`typescript
import { useState } from 'react';

// TypeScript infers the type
function Counter() {
  const [count, setCount] = useState(0); // number
  const [name, setName] = useState(''); // string
  
  return <div>{count}</div>;
}

// Explicit type annotation
function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  
  return <div>{user?.name}</div>;
}

// Union types
function Toggle() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  return <div>{status}</div>;
}

// Complex state object
interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginForm() {
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return <form>{/* form fields */}</form>;
}
\\\`\\\`\\\`

### useEffect Hook

\\\`\\\`\\\`typescript
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        const data: User[] = await response.json();
        
        if (isMounted) {
          setUsers(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }
    
    fetchUsers();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
\\\`\\\`\\\`

### useRef Hook

\\\`\\\`\\\`typescript
import { useRef, useEffect } from 'react';

function TextInput() {
  // DOM element ref
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);
  
  const handleClick = () => {
    // Access input value
    console.log(inputRef.current?.value);
  };
  
  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={handleClick}>Get Value</button>
    </>
  );
}

// Storing mutable values
function Timer() {
  const intervalRef = useRef<number | null>(null);
  const [count, setCount] = useState(0);
  
  const startTimer = () => {
    intervalRef.current = window.setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };
  
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  );
}
\\\`\\\`\\\`

### useContext Hook

\\\`\\\`\\\`typescript
import { createContext, useContext, ReactNode } from 'react';

// Define theme context type
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Create context with default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const value: ThemeContextType = { theme, toggleTheme };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for consuming context
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  
  return context;
}

// Component using the context
function ThemedButton() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme}
      className={\\\`btn btn-\\\${theme}\\\`}
    >
      Current theme: {theme}
    </button>
  );
}
\\\`\\\`\\\`

## Generic Components

### Generic List Component

\\\`\\\`\\\`typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// Usage with different types
interface User {
  id: number;
  name: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
}

function App() {
  const users: User[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  
  const products: Product[] = [
    { id: 'p1', title: 'Laptop', price: 999 },
    { id: 'p2', title: 'Mouse', price: 29 },
  ];
  
  return (
    <>
      <List
        items={users}
        renderItem={(user) => <span>{user.name}</span>}
        keyExtractor={(user) => user.id}
      />
      
      <List
        items={products}
        renderItem={(product) => (
          <span>{product.title} - \\\${product.price}</span>
        )}
        keyExtractor={(product) => product.id}
      />
    </>
  );
}
\\\`\\\`\\\`

### Generic Form Hook

\\\`\\\`\\\`typescript
import { useState, ChangeEvent } from 'react';

function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const setFieldError = (field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };
  
  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };
  
  return {
    values,
    errors,
    handleChange,
    setFieldValue,
    setFieldError,
    reset,
  };
}

// Usage
interface LoginFormData {
  email: string;
  password: string;
}

function LoginForm() {
  const { values, errors, handleChange, setFieldError, reset } = 
    useForm<LoginFormData>({
      email: '',
      password: '',
    });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!values.email.includes('@')) {
      setFieldError('email', 'Invalid email');
      return;
    }
    
    console.log('Submitting:', values);
    reset();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
      />
      {errors.email && <span>{errors.email}</span>}
      
      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
      />
      
      <button type="submit">Login</button>
    </form>
  );
}
\\\`\\\`\\\`

## Advanced Patterns

### Discriminated Unions for Props

\\\`\\\`\\\`typescript
// Button that can be either a button or a link
type ButtonBaseProps = {
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = ButtonBaseProps & {
  as: 'button';
  onClick: () => void;
  disabled?: boolean;
};

type ButtonAsLink = ButtonBaseProps & {
  as: 'link';
  href: string;
  target?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

function Button(props: ButtonProps) {
  if (props.as === 'button') {
    return (
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        className={props.className}
      >
        {props.children}
      </button>
    );
  }
  
  return (
    <a
      href={props.href}
      target={props.target}
      className={props.className}
    >
      {props.children}
    </a>
  );
}

// Usage - TypeScript ensures correct props
<Button as="button" onClick={() => alert('Clicked')}>
  Click me
</Button>

<Button as="link" href="/about" target="_blank">
  Go to About
</Button>
\\\`\\\`\\\`

### Render Props Pattern

\\\`\\\`\\\`typescript
interface MousePositionProps {
  render: (position: { x: number; y: number }) => ReactNode;
}

function MousePosition({ render }: MousePositionProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return <>{render(position)}</>;
}

// Usage
function App() {
  return (
    <MousePosition
      render={({ x, y }) => (
        <div>
          Mouse position: ({x}, {y})
        </div>
      )}
    />
  );
}
\\\`\\\`\\\`

### Higher-Order Component (HOC)

\\\`\\\`\\\`typescript
import { ComponentType } from 'react';

// HOC that adds loading state
interface WithLoadingProps {
  isLoading: boolean;
}

function withLoading<P extends object>(
  Component: ComponentType<P>
): ComponentType<P & WithLoadingProps> {
  return function WithLoadingComponent({ isLoading, ...props }: WithLoadingProps & P) {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    return <Component {...(props as P)} />;
  };
}

// Usage
interface UserListProps {
  users: User[];
}

function UserList({ users }: UserListProps) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

const UserListWithLoading = withLoading(UserList);

// Use the enhanced component
function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  return (
    <UserListWithLoading
      users={users}
      isLoading={loading}
    />
  );
}
\\\`\\\`\\\`

## Common TypeScript Patterns in React

### Utility Types

\\\`\\\`\\\`typescript
// Pick specific props
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type UserProfile = Pick<User, 'id' | 'name' | 'email'>;

// Omit specific props
type UserWithoutPassword = Omit<User, 'password'>;

// Make all properties optional
type PartialUser = Partial<User>;

// Make all properties required
type RequiredUser = Required<Partial<User>>;

// Extract component props type
function Button(props: { label: string; onClick: () => void }) {
  return <button onClick={props.onClick}>{props.label}</button>;
}

type ButtonProps = React.ComponentProps<typeof Button>;
\\\`\\\`\\\`

### Type Guards

\\\`\\\`\\\`typescript
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is { success: true; data: T } {
  return response.success === true;
}

function UserProfile() {
  const [response, setResponse] = useState<ApiResponse<User> | null>(null);
  
  useEffect(() => {
    fetchUser().then(setResponse);
  }, []);
  
  if (!response) return <div>Loading...</div>;
  
  if (isSuccessResponse(response)) {
    // TypeScript knows response.data exists
    return <div>{response.data.name}</div>;
  }
  
  // TypeScript knows response.error exists
  return <div>Error: {response.error}</div>;
}
\\\`\\\`\\\`

## Best Practices

### ✅ Do This

\\\`\\\`\\\`typescript
// Use interface for props
interface Props {
  name: string;
}

// Use descriptive prop names
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}

// Export prop types for reuse
export interface UserCardProps {
  user: User;
  onEdit: (id: number) => void;
}
\\\`\\\`\\\`

### ❌ Avoid This

\\\`\\\`\\\`typescript
// Do not use any
function Component(props: any) { }

// Do not use loose types
function Button({ onClick }: { onClick: Function }) { }

// Do not skip types
function Component({ data }) { } // Missing types
\\\`\\\`\\\`

## Summary

TypeScript with React provides:
- Type safety for props and state
- Better development experience
- Self-documenting code
- Easier refactoring
- Fewer runtime errors

Master these patterns to build robust React applications with TypeScript!`,
      ['TypeScript setup in React', 'Component props typing with interfaces', 'React Hooks with TypeScript (useState, useEffect, useRef)', 'Generic components and custom hooks', 'Advanced patterns: discriminated unions, HOCs, render props']
    ]);

    const lessonId = lesson.rows[0].id;

    // Add code examples
    const examples = [
      {
        title: 'Typed Function Component with Props',
        code: `interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const handleEdit = () => {
    onEdit(user.id);
  };
  
  const handleDelete = () => {
    if (window.confirm(\\\`Delete \\\${user.name}?\\\`)) {
      onDelete(user.id);
    }
  };
  
  return (
    <div className="user-card">
      {user.avatar && <img src={user.avatar} alt={user.name} />}
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div className="actions">
        <button onClick={handleEdit}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
}

// Usage with type safety
function App() {
  const user = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  };
  
  return (
    <UserCard
      user={user}
      onEdit={(id) => console.log('Edit user', id)}
      onDelete={(id) => console.log('Delete user', id)}
    />
  );
}`,
        language: 'typescript',
        explanation: 'Demonstrates comprehensive props typing with interfaces, optional properties, nested objects, and event handler types in a real-world component.'
      },
      {
        title: 'Custom Hook with TypeScript Generics',
        code: `import { useState, useEffect } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(\\\`HTTP error! status: \\\${response.status}\\\`);
        }
        
        const result: T = await response.json();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [url, refetchIndex]);
  
  const refetch = () => {
    setRefetchIndex(prev => prev + 1);
  };
  
  return { data, loading, error, refetch };
}

// Usage with different data types
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

function UserProfile({ userId }: { userId: number }) {
  const { data: user, loading, error, refetch } = 
    useFetch<User>(\\\`/api/users/\\\${userId}\\\`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user found</div>;
  
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

function PostList() {
  const { data: posts, loading, error } = 
    useFetch<Post[]>('/api/posts');
  
  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!posts) return <div>No posts found</div>;
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
        </li>
      ))}
    </ul>
  );
}`,
        language: 'typescript',
        explanation: 'Shows how to create a reusable custom hook with generics that works with any data type, providing type-safe data fetching with loading and error states.'
      },
      {
        title: 'Form Handling with TypeScript',
        code: `import { useState, ChangeEvent, FormEvent } from 'react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  country: string;
  subscribe: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: string;
}

function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    age: 0,
    country: 'US',
    subscribe: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };
  
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (formData.age < 18) {
      newErrors.age = 'Must be at least 18 years old';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        alert('Registration successful!');
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          age: 0,
          country: 'US',
          subscribe: false,
        });
      } else {
        alert('Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="form-group">
        <label htmlFor="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          className={errors.firstName ? 'error' : ''}
        />
        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          className={errors.lastName ? 'error' : ''}
        />
        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={handleInputChange}
          className={errors.age ? 'error' : ''}
        />
        {errors.age && <span className="error-message">{errors.age}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="country">Country</label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={handleInputChange}
        >
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="CA">Canada</option>
          <option value="AU">Australia</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="subscribe"
            checked={formData.subscribe}
            onChange={handleCheckboxChange}
          />
          Subscribe to newsletter
        </label>
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

export default RegistrationForm;`,
        language: 'typescript',
        explanation: 'Comprehensive form handling example with TypeScript, including typed form data, error handling, validation, different input types, and async submission.'
      },
      {
        title: 'Context API with TypeScript',
        code: `import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define user type
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

// Define context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Create context with undefined default (will be provided by provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const userData: User = await response.json();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);
  
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);
  
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);
  
  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
    updateUser,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook with error handling
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Components using the context
function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}

function UserProfile() {
  const { user, logout, updateUser } = useAuth();
  
  if (!user) {
    return <div>Please log in</div>;
  }
  
  const handleNameChange = () => {
    const newName = prompt('Enter new name:', user.name);
    if (newName) {
      updateUser({ name: newName });
    }
  };
  
  return (
    <div className="profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={handleNameChange}>Change Name</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Access denied. Please log in.</div>;
  }
  
  return <>{children}</>;
}

// App usage
function App() {
  return (
    <AuthProvider>
      <div className="app">
        <LoginForm />
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}`,
        language: 'typescript',
        explanation: 'Complete authentication context implementation with TypeScript, showing proper typing for context, provider, custom hooks, and consumer components with error handling.'
      }
    ];

    for (const example of examples) {
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, code, language, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [lessonId, example.title, example.code, example.language, example.explanation, examples.indexOf(example)]);
    }

    // Add quiz questions
    const quizQuestions = [
      {
        question: 'What is the correct way to type a React function component with props?',
        options: JSON.stringify([
          'function MyComponent(props: any) { }',
          'function MyComponent({ name, age }: { name: string, age: number }) { }',
          'function MyComponent(name: string, age: number) { }',
          'const MyComponent = (props) => { }'
        ]),
        correct_answer: 1,
        explanation: 'Props should be typed using an object with named properties and their types. Using \\\`any\\\` defeats the purpose of TypeScript, and individual parameters are not how React components receive props.'
      },
      {
        question: 'When using useState with TypeScript, when should you explicitly specify the type?',
        options: JSON.stringify([
          'Always, for every useState call',
          'Never, TypeScript always infers correctly',
          'When the initial value is null or the type cannot be inferred',
          'Only for strings and numbers'
        ]),
        correct_answer: 2,
        explanation: 'TypeScript can often infer the type from the initial value, but you should explicitly specify the type when using null as initial value, union types, or when the type cannot be inferred from initialization (e.g., \\\`useState<User | null>(null)\\\`).'
      },
      {
        question: 'What is the correct way to type a useRef hook for a DOM element?',
        options: JSON.stringify([
          'const ref = useRef<HTMLInputElement>();',
          'const ref = useRef<HTMLInputElement>(null);',
          'const ref = useRef<HTMLElement>();',
          'const ref = useRef(null);'
        ]),
        correct_answer: 1,
        explanation: 'For DOM element refs, you should use \\\`useRef<HTMLElementType>(null)\\\` where HTMLElementType is the specific element type (like HTMLInputElement, HTMLDivElement, etc.). The initial value must be null.'
      },
      {
        question: 'What TypeScript feature allows a component to work with multiple data types while maintaining type safety?',
        options: JSON.stringify([
          'Type aliases',
          'Generics',
          'Union types',
          'Any type'
        ]),
        correct_answer: 1,
        explanation: 'Generics allow you to create reusable components that work with multiple types while maintaining full type safety. For example, a List<T> component can work with arrays of any type while knowing the specific type at compile time.'
      },
      {
        question: 'How do you properly type event handlers in React with TypeScript?',
        options: JSON.stringify([
          'onClick: Function',
          'onClick: (event: Event) => void',
          'onClick: (event: React.MouseEvent<HTMLButtonElement>) => void',
          'onClick: any'
        ]),
        correct_answer: 2,
        explanation: 'React event handlers should be typed using React-specific event types like React.MouseEvent, React.ChangeEvent, etc., with the specific element type as a generic parameter. This provides full type safety for the event object and its properties.'
      }
    ];

    for (const q of quizQuestions) {
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [lessonId, q.question, q.options, q.correct_answer, q.explanation, quizQuestions.indexOf(q)]);
    }

    await client.query('COMMIT');
    console.log('✅ TypeScript with React lesson added successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding TypeScript with React lesson:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

seedTypeScriptReact().catch(console.error);
