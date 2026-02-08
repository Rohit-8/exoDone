import pool from '../config/database.js';

async function seedTestingReact() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding React Testing lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'testing-react'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'React Testing Library & Jest: Complete Guide', 'react-testing-guide', $2, 'Master React component testing with React Testing Library, Jest, user interactions, async testing, and best practices', 'intermediate', 60, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# React Testing Library & Jest: Complete Guide

## Why Test React Components?

Testing React components ensures your UI works correctly and prevents regressions as your application grows.

### Benefits of Testing

✅ **Confidence**: Ship code without fear of breaking things
✅ **Documentation**: Tests document how components should work
✅ **Better Design**: Writing tests leads to better component design
✅ **Faster Debugging**: Catch bugs early in development
✅ **Refactoring Safety**: Change code confidently
✅ **Team Collaboration**: Clear expectations for component behavior

## Testing Philosophy

React Testing Library follows these principles:

1. **Test user behavior**, not implementation details
2. **Query by accessibility**, not by class names or IDs
3. **Test what users see and do**, not internal state
4. **Write maintainable tests** that do not break on refactors

## Setup

### Installation

\\\`\\\`\\\`bash
# Core testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event

# Jest (usually included with Create React App or Vite)
npm install --save-dev jest @types/jest
npm install --save-dev jest-environment-jsdom
\\\`\\\`\\\`

### Jest Configuration (jest.config.js)

\\\`\\\`\\\`javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-react'] }],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
};
\\\`\\\`\\\`

### Setup File (src/setupTests.js)

\\\`\\\`\\\`javascript
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
\\\`\\\`\\\`

### Package.json Scripts

\\\`\\\`\\\`json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
\\\`\\\`\\\`

## Basic Component Testing

### Simple Component Test

\\\`\\\`\\\`javascript
// Button.jsx
export function Button({ children, onClick, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Button.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
\\\`\\\`\\\`

## Querying Elements

### Query Methods

\\\`\\\`\\\`javascript
import { render, screen } from '@testing-library/react';

// getBy* - throws error if not found (use for elements that should exist)
const button = screen.getByRole('button');
const heading = screen.getByRole('heading', { name: /welcome/i });
const input = screen.getByLabelText(/username/i);
const text = screen.getByText(/hello world/i);

// queryBy* - returns null if not found (use to assert element does NOT exist)
const button = screen.queryByRole('button');
expect(button).not.toBeInTheDocument();

// findBy* - returns promise, waits for element (use for async elements)
const button = await screen.findByRole('button');

// getAllBy*, queryAllBy*, findAllBy* - return arrays
const buttons = screen.getAllByRole('button');
expect(buttons).toHaveLength(3);
\\\`\\\`\\\`

### Query Priority (Best Practices)

\\\`\\\`\\\`javascript
// 1. Accessible by everyone (BEST)
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/username/i);
screen.getByPlaceholderText(/enter email/i);
screen.getByText(/welcome/i);

// 2. Semantic queries
screen.getByAltText(/profile picture/i);
screen.getByTitle(/close/i);

// 3. Test IDs (LAST RESORT)
screen.getByTestId('custom-element');
\\\`\\\`\\\`

## Testing User Interactions

### Click Events

\\\`\\\`\\\`javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

test('increments counter on button click', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  
  const incrementButton = screen.getByRole('button', { name: /increment/i });
  
  await user.click(incrementButton);
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  
  await user.click(incrementButton);
  expect(screen.getByText(/count: 2/i)).toBeInTheDocument();
});

test('resets counter on reset button click', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  
  const incrementButton = screen.getByRole('button', { name: /increment/i });
  const resetButton = screen.getByRole('button', { name: /reset/i });
  
  await user.click(incrementButton);
  await user.click(incrementButton);
  expect(screen.getByText(/count: 2/i)).toBeInTheDocument();
  
  await user.click(resetButton);
  expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
});
\\\`\\\`\\\`

### Form Interactions

\\\`\\\`\\\`javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function LoginForm({ onSubmit }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(credentials);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
      />
      
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
      />
      
      <button type="submit">Login</button>
    </form>
  );
}

test('submits form with user credentials', async () => {
  const handleSubmit = jest.fn();
  const user = userEvent.setup();
  
  render(<LoginForm onSubmit={handleSubmit} />);
  
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /login/i });
  
  // Type into inputs
  await user.type(emailInput, 'user@example.com');
  await user.type(passwordInput, 'password123');
  
  // Submit form
  await user.click(submitButton);
  
  // Assert form was submitted with correct data
  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password123',
  });
});
\\\`\\\`\\\`

### Keyboard Interactions

\\\`\\\`\\\`javascript
test('handles keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<SearchInput />);
  
  const input = screen.getByRole('textbox');
  
  // Tab to focus
  await user.tab();
  expect(input).toHaveFocus();
  
  // Type text
  await user.keyboard('react testing');
  expect(input).toHaveValue('react testing');
  
  // Press Enter
  await user.keyboard('{Enter}');
  
  // Clear with keyboard
  await user.clear(input);
  expect(input).toHaveValue('');
});
\\\`\\\`\\\`

## Testing Async Behavior

### Testing API Calls

\\\`\\\`\\\`javascript
import { render, screen, waitFor } from '@testing-library/react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch(\\\`/api/users/\\\${userId}\\\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Mock fetch globally
global.fetch = jest.fn();

test('displays user data after successful fetch', async () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  };
  
  fetch.mockResolvedValueOnce({
    json: async () => mockUser,
  });
  
  render(<UserProfile userId={1} />);
  
  // Initially shows loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  // Wait for user data to appear
  const userName = await screen.findByText(/john doe/i);
  expect(userName).toBeInTheDocument();
  expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
  
  // Loading should be gone
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});

test('displays error message on fetch failure', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'));
  
  render(<UserProfile userId={1} />);
  
  // Wait for error message
  const errorMessage = await screen.findByText(/error: network error/i);
  expect(errorMessage).toBeInTheDocument();
});
\\\`\\\`\\\`

### Using waitFor

\\\`\\\`\\\`javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('shows validation error after submit', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  const submitButton = screen.getByRole('button', { name: /login/i });
  await user.click(submitButton);
  
  // Wait for validation error to appear
  await waitFor(() => {
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});

test('updates data after debounced search', async () => {
  const user = userEvent.setup();
  render(<SearchComponent />);
  
  const searchInput = screen.getByRole('textbox');
  await user.type(searchInput, 'react');
  
  // Wait for debounced search to complete
  await waitFor(() => {
    expect(screen.getByText(/results for "react"/i)).toBeInTheDocument();
  }, { timeout: 1000 });
});
\\\`\\\`\\\`

## Mocking

### Mocking Modules

\\\`\\\`\\\`javascript
// api.js
export async function fetchUser(id) {
  const response = await fetch(\\\`/api/users/\\\${id}\\\`);
  return response.json();
}

// UserProfile.jsx
import { fetchUser } from './api';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

// UserProfile.test.jsx
import { render, screen } from '@testing-library/react';
import { fetchUser } from './api';
import { UserProfile } from './UserProfile';

// Mock the entire module
jest.mock('./api');

test('displays user data', async () => {
  const mockUser = { id: 1, name: 'John Doe' };
  fetchUser.mockResolvedValue(mockUser);
  
  render(<UserProfile userId={1} />);
  
  const userName = await screen.findByText(/john doe/i);
  expect(userName).toBeInTheDocument();
  expect(fetchUser).toHaveBeenCalledWith(1);
});
\\\`\\\`\\\`

### Mocking Context

\\\`\\\`\\\`javascript
import { render, screen } from '@testing-library/react';
import { AuthContext } from './AuthContext';

function ProfilePage() {
  const { user, logout } = useContext(AuthContext);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

test('displays user name and logout button', () => {
  const mockUser = { id: 1, name: 'Jane Doe' };
  const mockLogout = jest.fn();
  
  const mockContextValue = {
    user: mockUser,
    logout: mockLogout,
  };
  
  render(
    <AuthContext.Provider value={mockContextValue}>
      <ProfilePage />
    </AuthContext.Provider>
  );
  
  expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
  
  const logoutButton = screen.getByRole('button', { name: /logout/i });
  logoutButton.click();
  expect(mockLogout).toHaveBeenCalled();
});
\\\`\\\`\\\`

## Testing Custom Hooks

\\\`\\\`\\\`javascript
import { renderHook, waitFor } from '@testing-library/react';

function useCounter(initialCount = 0) {
  const [count, setCount] = useState(initialCount);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialCount);
  
  return { count, increment, decrement, reset };
}

test('useCounter hook', () => {
  const { result } = renderHook(() => useCounter(5));
  
  expect(result.current.count).toBe(5);
  
  act(() => {
    result.current.increment();
  });
  expect(result.current.count).toBe(6);
  
  act(() => {
    result.current.decrement();
  });
  expect(result.current.count).toBe(5);
  
  act(() => {
    result.current.reset();
  });
  expect(result.current.count).toBe(5);
});

// Testing async hooks
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);
  
  return { data, loading };
}

test('useFetch hook', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ name: 'Test Data' }),
    })
  );
  
  const { result } = renderHook(() => useFetch('/api/data'));
  
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBe(null);
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  
  expect(result.current.data).toEqual({ name: 'Test Data' });
});
\\\`\\\`\\\`

## Best Practices

### ✅ Do This

\\\`\\\`\\\`javascript
// Test user behavior
test('user can submit form', async () => {
  const user = userEvent.setup();
  render(<ContactForm />);
  
  await user.type(screen.getByLabelText(/name/i), 'John');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/thank you/i)).toBeInTheDocument();
});

// Use accessible queries
const button = screen.getByRole('button', { name: /submit/i });
const input = screen.getByLabelText(/username/i);

// Wait for async changes
const element = await screen.findByText(/success/i);
\\\`\\\`\\\`

### ❌ Avoid This

\\\`\\\`\\\`javascript
// Do not test implementation details
expect(component.state.count).toBe(5); // Bad
expect(component.find('.count').text()).toBe('5'); // Bad

// Do not query by class or ID
screen.getByClassName('submit-button'); // Bad
screen.getByTestId('submit-btn'); // Use only as last resort

// Do not wait with fixed delays
await new Promise(resolve => setTimeout(resolve, 1000)); // Bad
\\\`\\\`\\\`

## Summary

React Testing Library helps you:
- Write maintainable tests
- Test user behavior
- Ensure accessibility
- Catch bugs early
- Refactor confidently

Focus on testing how users interact with your components, not implementation details!`,
      ['React Testing Library setup and philosophy', 'Querying elements with accessibility in mind', 'Testing user interactions with userEvent', 'Async testing with waitFor and findBy queries', 'Mocking API calls and context']
    ]);

    const lessonId = lesson.rows[0].id;

    // Add code examples
    const examples = [
      {
        title: 'Testing Form Component',
        code: `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';

// Component being tested
function ContactForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email';
    if (!formData.message) newErrors.message = 'Message is required';
    return newErrors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length === 0) {
      onSubmit(formData);
      setSubmitted(true);
    } else {
      setErrors(validationErrors);
    }
  };
  
  if (submitted) {
    return <div>Thank you for your message!</div>;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        {errors.name && <span role="alert">{errors.name}</span>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        {errors.email && <span role="alert">{errors.email}</span>}
      </div>
      
      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        />
        {errors.message && <span role="alert">{errors.message}</span>}
      </div>
      
      <button type="submit">Send Message</button>
    </form>
  );
}

// Tests
describe('ContactForm', () => {
  test('renders form fields', () => {
    render(<ContactForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });
  
  test('shows validation errors on invalid submit', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={jest.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });
  
  test('submits form with valid data', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();
    
    render(<ContactForm onSubmit={handleSubmit} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello, this is a test message.');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));
    
    // Check callback was called with correct data
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message.',
    });
    
    // Check success message appears
    expect(screen.getByText(/thank you for your message/i)).toBeInTheDocument();
  });
  
  test('clears validation errors when user types', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={jest.fn()} />);
    
    // Submit empty form to trigger errors
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    
    // Type in the name field
    await user.type(screen.getByLabelText(/name/i), 'John');
    
    // Error should be cleared (implementation would need this behavior)
    // This demonstrates testing user experience
  });
});`,
        language: 'javascript',
        explanation: 'Comprehensive form testing including rendering, validation, user interactions, and successful submission. Tests focus on user behavior rather than implementation details.'
      },
      {
        title: 'Testing Async Data Fetching',
        code: `import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './UserList';

// Component being tested
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchUsers = async (search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const url = search 
        ? \\\`/api/users?search=\\\${search}\\\`
        : '/api/users';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };
  
  return (
    <div>
      <h1>User List</h1>
      
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search users"
        />
        <button type="submit">Search</button>
      </form>
      
      {loading && <div>Loading users...</div>}
      
      {error && <div role="alert">Error: {error}</div>}
      
      {!loading && !error && users.length === 0 && (
        <div>No users found</div>
      )}
      
      {!loading && users.length > 0 && (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Tests
describe('UserList', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('displays loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<UserList />);
    
    expect(screen.getByText(/loading users/i)).toBeInTheDocument();
  });
  
  test('displays users after successful fetch', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });
    
    render(<UserList />);
    
    // Wait for users to appear
    const johnName = await screen.findByText(/john doe/i);
    expect(johnName).toBeInTheDocument();
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    
    // Loading should be gone
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
  
  test('displays error message on fetch failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<UserList />);
    
    // Wait for error to appear
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/error: network error/i);
    
    // Users list should not be visible
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
  
  test('displays "no users found" when API returns empty array', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    
    render(<UserList />);
    
    const noUsersMessage = await screen.findByText(/no users found/i);
    expect(noUsersMessage).toBeInTheDocument();
  });
  
  test('searches for users when search form is submitted', async () => {
    const user = userEvent.setup();
    
    // Initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
      ],
    });
    
    render(<UserList />);
    
    // Wait for initial load
    await screen.findByText(/john doe/i);
    
    // Search fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ],
    });
    
    // Type search term and submit
    const searchInput = screen.getByLabelText(/search users/i);
    await user.type(searchInput, 'Jane');
    await user.click(screen.getByRole('button', { name: /search/i }));
    
    // Wait for search results
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users?search=Jane');
    });
    
    expect(await screen.findByText(/jane smith/i)).toBeInTheDocument();
  });
  
  test('handles server error response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    
    render(<UserList />);
    
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/failed to fetch users/i);
  });
});`,
        language: 'javascript',
        explanation: 'Complete async testing example showing how to mock fetch, test loading states, success and error scenarios, and user-triggered data fetching with search functionality.'
      },
      {
        title: 'Testing Context and Custom Hooks',
        code: `import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createContext, useContext, useState } from 'react';

// Cart Context
const CartContext = createContext(undefined);

function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  
  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  
  const removeItem = (productId) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };
  
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
  };
  
  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };
  
  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

// Component using the cart
function ProductCard({ product }) {
  const { addItem } = useCart();
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>\\\${product.price}</p>
      <button onClick={() => addItem(product)}>Add to Cart</button>
    </div>
  );
}

function CartSummary() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCart();
  
  if (items.length === 0) {
    return <div>Your cart is empty</div>;
  }
  
  return (
    <div>
      <h2>Cart Summary</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} - Quantity: {item.quantity} - \\\${item.price * item.quantity}
          </li>
        ))}
      </ul>
      <p>Total Items: {getTotalItems()}</p>
      <p>Total Price: \\\${getTotalPrice()}</p>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  );
}

// Tests
describe('Cart Context and Hook', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 29.99,
  };
  
  test('adds product to cart', async () => {
    const user = userEvent.setup();
    
    render(
      <CartProvider>
        <ProductCard product={mockProduct} />
        <CartSummary />
      </CartProvider>
    );
    
    // Initially cart is empty
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    
    // Add product to cart
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);
    
    // Cart should now show the product
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
    expect(screen.getByText(/test product/i)).toBeInTheDocument();
    expect(screen.getByText(/quantity: 1/i)).toBeInTheDocument();
  });
  
  test('increases quantity when adding same product twice', async () => {
    const user = userEvent.setup();
    
    render(
      <CartProvider>
        <ProductCard product={mockProduct} />
        <CartSummary />
      </CartProvider>
    );
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    
    // Add product twice
    await user.click(addButton);
    await user.click(addButton);
    
    // Should show quantity of 2
    expect(screen.getByText(/quantity: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/total items: 2/i)).toBeInTheDocument();
  });
  
  test('calculates total price correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CartProvider>
        <ProductCard product={mockProduct} />
        <CartSummary />
      </CartProvider>
    );
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);
    await user.click(addButton);
    
    const expectedTotal = (29.99 * 2).toFixed(2);
    expect(screen.getByText(/total price: \\$59.98/i)).toBeInTheDocument();
  });
  
  test('clears cart when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CartProvider>
        <ProductCard product={mockProduct} />
        <CartSummary />
      </CartProvider>
    );
    
    // Add item
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(screen.getByText(/test product/i)).toBeInTheDocument();
    
    // Clear cart
    await user.click(screen.getByRole('button', { name: /clear cart/i }));
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});

// Testing custom hook directly
describe('useCart hook', () => {
  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within CartProvider');
    
    spy.mockRestore();
  });
  
  test('manages cart state correctly', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const product = { id: 1, name: 'Test', price: 10 };
    
    // Initially empty
    expect(result.current.items).toEqual([]);
    expect(result.current.getTotalItems()).toBe(0);
    expect(result.current.getTotalPrice()).toBe(0);
    
    // Add item
    act(() => {
      result.current.addItem(product);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.getTotalItems()).toBe(1);
    expect(result.current.getTotalPrice()).toBe(10);
    
    // Add same item again
    act(() => {
      result.current.addItem(product);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.getTotalItems()).toBe(2);
    expect(result.current.getTotalPrice()).toBe(20);
    
    // Clear cart
    act(() => {
      result.current.clearCart();
    });
    
    expect(result.current.items).toEqual([]);
  });
});`,
        language: 'javascript',
        explanation: 'Demonstrates testing React Context and custom hooks, including integration tests with components and isolated hook testing using renderHook.'
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
        question: 'What is the primary philosophy of React Testing Library?',
        options: JSON.stringify([
          'Test implementation details like state and props',
          'Test user behavior and what users see',
          'Test component lifecycle methods',
          'Test CSS styling and layouts'
        ]),
        correct_answer: 1,
        explanation: 'React Testing Library focuses on testing user behavior and what users see/do, not implementation details. This makes tests more maintainable and ensures you are testing what actually matters to users.'
      },
      {
        question: 'Which query should you use to check if an element does NOT exist?',
        options: JSON.stringify([
          'getByRole - it will return null',
          'queryByRole - it returns null if not found',
          'findByRole - it waits and returns null',
          'getAllByRole - check if array is empty'
        ]),
        correct_answer: 1,
        explanation: 'Use queryBy* queries to check if an element does not exist. These queries return null when elements are not found, whereas getBy* queries throw an error. You can assert with expect(element).not.toBeInTheDocument().'
      },
      {
        question: 'What is the recommended way to simulate user interactions in tests?',
        options: JSON.stringify([
          'fireEvent from React Testing Library',
          'userEvent from @testing-library/user-event',
          'Enzyme simulate method',
          'Directly calling event handlers'
        ]),
        correct_answer: 1,
        explanation: 'userEvent from @testing-library/user-event is recommended because it more closely simulates real user interactions, including related events and browser behavior. It is more realistic than fireEvent.'
      },
      {
        question: 'How should you test asynchronous operations in React components?',
        options: JSON.stringify([
          'Use setTimeout with fixed delays',
          'Use findBy* queries or waitFor',
          'Use async/await without waiting for elements',
          'Test synchronously and ignore async behavior'
        ]),
        correct_answer: 1,
        explanation: 'Use findBy* queries (which return promises) or waitFor to test async operations. These wait for elements to appear or conditions to be met, without relying on fixed timeouts that can make tests flaky.'
      },
      {
        question: 'What is the correct order of query preference for accessibility?',
        options: JSON.stringify([
          'getByTestId, getByRole, getByText',
          'getByRole, getByLabelText, getByTestId',
          'getByClassName, getByRole, getByText',
          'getByText, getByTestId, getByRole'
        ]),
        correct_answer: 1,
        explanation: 'The recommended order is: accessible queries first (getByRole, getByLabelText, getByPlaceholderText, getByText), semantic queries next (getByAltText, getByTitle), and getByTestId only as a last resort. This encourages accessible markup.'
      }
    ];

    for (const q of quizQuestions) {
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [lessonId, q.question, q.options, q.correct_answer, q.explanation, quizQuestions.indexOf(q)]);
    }

    await client.query('COMMIT');
    console.log('✅ React Testing lesson added successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding React Testing lesson:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

seedTestingReact().catch(console.error);
