// ============================================================================
// Testing React Apps — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "Testing React Apps",
  slug: "testing-react",
  description:
    "Write reliable tests with React Testing Library and Jest — unit, integration, and component testing.",
  estimated_time: 180,
  order_index: 9,
};

export const lessons = [
  {
    title: "React Testing Library & Jest Fundamentals",
    slug: "rtl-jest-fundamentals",
    summary:
      "Master React Testing Library's query hierarchy, Jest matchers, userEvent, async patterns, mocking strategies, MSW for API testing, custom hook testing with renderHook, accessibility assertions, and common anti-patterns — everything needed for confident React testing in interviews and production.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 1,
    key_points: [
      "Testing philosophy: test behavior (what the user sees and does), not implementation details (state, refs, component internals) — the testing trophy prioritizes integration tests over unit tests because they give the highest confidence-to-cost ratio",
      "Jest fundamentals: describe/it/test blocks structure tests, expect() with matchers (toBe, toEqual, toContain, toThrow, toHaveBeenCalledWith, toMatchObject) form assertions — beforeEach/afterEach handle setup/teardown, and jest.setTimeout() adjusts async test timeouts",
      "React Testing Library query priority: getByRole > getByLabelText > getByPlaceholderText > getByText > getByDisplayValue > getByAltText > getByTitle > getByTestId — prefer queries that reflect how assistive technology and users perceive the page, resort to test-id only as a last resort",
      "Query variants: getBy* throws if not found (assert presence), queryBy* returns null if not found (assert absence), findBy* returns a Promise that resolves when element appears (async rendering) — each has an *AllBy* variant for multiple matches; mixing them up is the #1 RTL mistake in interviews",
      "userEvent over fireEvent: userEvent.setup() returns an instance that simulates full interaction sequences (focus → keyDown → keyPress → input → keyUp → change) while fireEvent dispatches a single synthetic event — userEvent catches bugs that fireEvent misses, like disabled buttons still being clickable",
      "Mocking strategies: jest.fn() creates a spy, jest.mock() replaces a module, jest.spyOn() wraps a method — use mockResolvedValue/mockRejectedValue for async, mockImplementation for complex logic, and always verify calls with expect(mock).toHaveBeenCalledWith(expectedArgs)",
      "MSW (Mock Service Worker) intercepts network requests at the service-worker level — handlers define request/response pairs (http.get, http.post), setupServer starts the mock server in Node tests, and server.use() overrides handlers per-test for error scenarios without changing component code",
      "Testing patterns: wrap components needing context/router in custom render helpers, test custom hooks with renderHook from @testing-library/react, test error boundaries by mocking children to throw, verify accessibility with toBeVisible/toHaveAccessibleName/toHaveAttribute('aria-*') — snapshot tests are brittle and should only be used for stable UI like icons or design tokens",
    ],
    content: `
# React Testing Library & Jest Fundamentals

## Testing Philosophy: Behavior Over Implementation

The fundamental principle of modern React testing: **test what the user experiences, not how the code works internally**. Users don't know about state variables, refs, or effect cleanup. They see rendered text, click buttons, fill forms, and read results.

\\\`\\\`\\\`
// ❌ IMPLEMENTATION TESTING — brittle, breaks on refactor
expect(component.state.isOpen).toBe(true);
expect(component.instance().handleClick).toHaveBeenCalled();

// ✅ BEHAVIOR TESTING — resilient, tests what users see
expect(screen.getByRole('dialog')).toBeVisible();
expect(screen.getByText('Item added to cart')).toBeInTheDocument();
\\\`\\\`\\\`

### The Testing Trophy

Unlike the traditional testing pyramid (many unit tests, fewer integration, fewest E2E), Kent C. Dodds' **testing trophy** recommends:

\\\`\\\`\\\`
        ╭──────────╮
        │   E2E    │   Few — critical user journeys (Cypress / Playwright)
        ├──────────┤
        │          │
        │Integration│  MOST — components with context, routing, API calls
        │          │   (React Testing Library + MSW)
        ├──────────┤
        │  Unit    │   Some — pure utilities, reducers, formatters
        ├──────────┤
        │  Static  │   Always — TypeScript, ESLint (catch typos & type errors)
        ╰──────────╯
\\\`\\\`\\\`

**Integration tests give the best ROI**: they test realistic user flows (render a form → fill fields → submit → see success message) without the cost and flakiness of full E2E tests.

---

## Jest Setup & Configuration

### Test Structure

\\\`\\\`\\\`jsx
describe('LoginForm', () => {
  // Group related tests — maps to a component or feature
  
  beforeEach(() => {
    // Runs before each test — reset mocks, clean up DOM
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup — RTL does this automatically via @testing-library/jest-dom
  });

  it('should render email and password fields', () => {
    // Single assertion or closely related assertions
    render(<LoginForm />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should display validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
\\\`\\\`\\\`

### Essential Matchers

\\\`\\\`\\\`jsx
// ── Equality ──────────────────────────────────────────────────────────────
expect(2 + 2).toBe(4);                       // strict equality (===)
expect({ a: 1 }).toEqual({ a: 1 });          // deep equality (objects/arrays)
expect(obj).toMatchObject({ a: 1 });         // partial match (obj can have extra keys)

// ── Truthiness ────────────────────────────────────────────────────────────
expect(value).toBeTruthy();                   // truthy (not false, 0, '', null, undefined, NaN)
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// ── Numbers ───────────────────────────────────────────────────────────────
expect(value).toBeGreaterThan(3);
expect(value).toBeCloseTo(0.3, 5);           // floating point (0.1 + 0.2)

// ── Strings ───────────────────────────────────────────────────────────────
expect(str).toMatch(/pattern/i);              // regex match
expect(str).toContain('substring');

// ── Arrays ────────────────────────────────────────────────────────────────
expect(array).toContain('item');              // reference equality for objects
expect(array).toContainEqual({ id: 1 });     // deep equality
expect(array).toHaveLength(3);

// ── Exceptions ────────────────────────────────────────────────────────────
expect(() => dangerousCall()).toThrow();
expect(() => dangerousCall()).toThrow('specific message');
expect(() => dangerousCall()).toThrow(TypeError);

// ── Functions (spies/mocks) ───────────────────────────────────────────────
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', expect.any(Number));
expect(mockFn).toHaveBeenLastCalledWith('final');

// ── jest-dom matchers (RTL) ───────────────────────────────────────────────
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toHaveTextContent(/welcome/i);
expect(element).toHaveAttribute('href', '/dashboard');
expect(element).toHaveClass('active');
expect(element).toHaveValue('user@example.com');
expect(element).toHaveAccessibleName('Submit form');
expect(element).toBeRequired();
expect(element).toBeChecked();
\\\`\\\`\\\`

---

## React Testing Library: Queries

### Query Priority (Most to Least Preferred)

The order reflects how accessible the query is — prefer queries that match how real users and assistive technology find elements:

\\\`\\\`\\\`
1. getByRole        — BEST: matches ARIA roles ("button", "textbox", "heading")
                      with options: { name: /submit/i, level: 2 }
2. getByLabelText   — form fields associated with a <label>
3. getByPlaceholderText — fallback for inputs without labels
4. getByText        — non-interactive text content
5. getByDisplayValue — current value of input/select/textarea
6. getByAltText     — images with alt text
7. getByTitle       — title attribute (not accessible to all screen readers)
8. getByTestId      — LAST RESORT: data-testid attribute (not visible to users)
\\\`\\\`\\\`

\\\`\\\`\\\`jsx
// ✅ BEST — matches how screen readers announce the button
screen.getByRole('button', { name: /submit order/i });

// ✅ GOOD — matches the label users read
screen.getByLabelText(/email address/i);

// ✅ OK — for headings with specific level
screen.getByRole('heading', { name: /welcome/i, level: 1 });

// ⚠️ ACCEPTABLE — when no better semantic query exists
screen.getByText(/loading\\.\\.\\.$/i);

// ❌ LAST RESORT — data-testid is invisible to users
screen.getByTestId('submit-btn');
\\\`\\\`\\\`

### Query Variants: getBy vs queryBy vs findBy

\\\`\\\`\\\`jsx
// ── getBy — throws if NOT found (use for elements that MUST exist) ────────
const button = screen.getByRole('button', { name: /save/i });
// Throws: "Unable to find an accessible element with the role 'button'..."

// ── queryBy — returns null if NOT found (use to assert ABSENCE) ───────────
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
// Returns null instead of throwing — perfect for "should NOT show"

// ── findBy — returns Promise, waits up to 1000ms (use for ASYNC) ──────────
const message = await screen.findByText(/success/i);
// Waits for element to appear in DOM — for async renders, API responses

// ── *AllBy — multiple elements ────────────────────────────────────────────
const items = screen.getAllByRole('listitem');
expect(items).toHaveLength(5);

const noErrors = screen.queryAllByRole('alert');
expect(noErrors).toHaveLength(0);

const cards = await screen.findAllByTestId(/product-card/);
expect(cards).toHaveLength(3);
\\\`\\\`\\\`

**Interview golden rule:** "getBy to assert presence, queryBy to assert absence, findBy for async elements."

---

## userEvent vs fireEvent

### Why userEvent Is Preferred

\\\`fireEvent\\\` dispatches a single DOM event. \\\`userEvent\\\` simulates the full browser interaction sequence — what actually happens when a real user types, clicks, or tabs.

\\\`\\\`\\\`jsx
import userEvent from '@testing-library/user-event';

// ── Setup (required in v14+) ──────────────────────────────────────────────
const user = userEvent.setup();

// ── Click ─────────────────────────────────────────────────────────────────
// userEvent: pointerover → pointerenter → mouseover → mouseenter → 
//            pointermove → mousemove → pointerdown → mousedown → focus → 
//            pointerup → mouseup → click
await user.click(screen.getByRole('button', { name: /submit/i }));

// fireEvent: only dispatches a click event (misses hover, focus, mousedown)
fireEvent.click(button); // ⚠️ Won't catch bugs related to :hover or :focus

// ── Typing ────────────────────────────────────────────────────────────────
// userEvent: focus → keyDown('H') → keyPress('H') → input → keyUp('H') → 
//            keyDown('i') → keyPress('i') → input → keyUp('i')
await user.type(screen.getByLabelText(/username/i), 'Hello');

// Also supports special keys:
await user.type(input, '{Enter}');            // press Enter
await user.type(input, '{Shift>}AB{/Shift}'); // shift+A, shift+B → "AB"

// ── Clear and type ────────────────────────────────────────────────────────
await user.clear(input);                       // select all + delete
await user.type(input, 'new value');

// ── Tab navigation ────────────────────────────────────────────────────────
await user.tab();                              // moves focus to next focusable element
expect(screen.getByLabelText(/email/i)).toHaveFocus();

// ── Select option ─────────────────────────────────────────────────────────
await user.selectOptions(
  screen.getByRole('combobox', { name: /country/i }),
  'US'
);

// ── Keyboard shortcuts ───────────────────────────────────────────────────
await user.keyboard('{Control>}a{/Control}');  // Ctrl+A (select all)

// ── Pointer (advanced) ───────────────────────────────────────────────────
await user.pointer({ target: element, keys: '[MouseRight]' }); // right-click
\\\`\\\`\\\`

**Interview tip:** "userEvent catches bugs that fireEvent misses — for example, a button with \\\`pointer-events: none\\\` will block userEvent's click (as it would for a real user) but fireEvent.click will still dispatch the event."

---

## Async Testing Patterns

### findBy — Wait for Element to Appear

\\\`\\\`\\\`jsx
it('shows user data after API call', async () => {
  render(<UserProfile userId="123" />);

  // Component fetches data on mount — element doesn't exist yet
  // findByText polls the DOM until the element appears (default: 1000ms)
  const name = await screen.findByText(/jane doe/i);
  expect(name).toBeInTheDocument();
});
\\\`\\\`\\\`

### waitFor — Wait for Assertion to Pass

\\\`\\\`\\\`jsx
it('disables submit button during API call', async () => {
  const user = userEvent.setup();
  render(<ContactForm />);

  await user.type(screen.getByLabelText(/message/i), 'Hello');
  await user.click(screen.getByRole('button', { name: /send/i }));

  // waitFor retries the assertion until it passes or times out
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });
});
\\\`\\\`\\\`

### waitForElementToBeRemoved — Wait for Disappearance

\\\`\\\`\\\`jsx
it('removes loading spinner after data loads', async () => {
  render(<Dashboard />);

  // Spinner is visible initially
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  // Wait for spinner to disappear
  await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));

  // Now verify the content loaded
  expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
});
\\\`\\\`\\\`

### Common Async Pitfalls

\\\`\\\`\\\`jsx
// ❌ BAD — no await, test passes even if assertion would fail
it('loads data', () => {
  render(<UserProfile />);
  screen.findByText('Jane Doe'); // Returns a Promise — but nobody awaits it!
});

// ✅ GOOD — await the findBy
it('loads data', async () => {
  render(<UserProfile />);
  expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
});

// ❌ BAD — using getBy for async content (throws immediately)
it('shows data', () => {
  render(<UserProfile />);
  expect(screen.getByText('Jane Doe')).toBeInTheDocument(); // Throws! Not in DOM yet
});

// ❌ BAD — wrapping non-async assertion in waitFor (unnecessary)
await waitFor(() => {
  expect(screen.getByText('static content')).toBeInTheDocument();
});
// ✅ Just use getBy for synchronous content
expect(screen.getByText('static content')).toBeInTheDocument();
\\\`\\\`\\\`

---

## Mocking Strategies

### jest.fn() — Standalone Mock Function

\\\`\\\`\\\`jsx
const handleSubmit = jest.fn();

render(<LoginForm onSubmit={handleSubmit} />);
await user.type(screen.getByLabelText(/email/i), 'test@test.com');
await user.type(screen.getByLabelText(/password/i), 'secret123');
await user.click(screen.getByRole('button', { name: /log in/i }));

expect(handleSubmit).toHaveBeenCalledTimes(1);
expect(handleSubmit).toHaveBeenCalledWith({
  email: 'test@test.com',
  password: 'secret123',
});
\\\`\\\`\\\`

### jest.mock() — Mock Entire Module

\\\`\\\`\\\`jsx
// Mock the entire api module
jest.mock('../services/api', () => ({
  fetchUser: jest.fn(),
  updateUser: jest.fn(),
}));

import { fetchUser } from '../services/api';

beforeEach(() => {
  fetchUser.mockResolvedValue({
    id: '1',
    name: 'Jane Doe',
    email: 'jane@example.com',
  });
});

it('displays user name from API', async () => {
  render(<UserProfile userId="1" />);
  expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  expect(fetchUser).toHaveBeenCalledWith('1');
});
\\\`\\\`\\\`

### jest.spyOn() — Spy on Existing Method

\\\`\\\`\\\`jsx
// Spy on window.fetch without replacing the whole module
const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'mocked' }),
});

afterEach(() => {
  fetchSpy.mockRestore(); // Restore original implementation
});
\\\`\\\`\\\`

### Mock Return Values

\\\`\\\`\\\`jsx
const mockFn = jest.fn();

// Return value
mockFn.mockReturnValue(42);
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValue(99);

// Async return value
mockFn.mockResolvedValue({ data: 'success' });
mockFn.mockRejectedValue(new Error('Network error'));
mockFn.mockResolvedValueOnce({ data: 'first call' });

// Custom implementation
mockFn.mockImplementation((x) => x * 2);
mockFn.mockImplementationOnce(() => { throw new Error('fail'); });
\\\`\\\`\\\`

---

## MSW (Mock Service Worker) for API Testing

MSW intercepts HTTP requests at the network level — your component code uses real \\\`fetch\\\` / \\\`axios\\\` calls, and MSW responds with mock data. This is more realistic than mocking \\\`fetch\\\` directly.

### Setup

\\\`\\\`\\\`jsx
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
  }),

  http.post('/api/login', async ({ request }) => {
    const { email, password } = await request.json();
    
    if (email === 'test@test.com' && password === 'correct') {
      return HttpResponse.json({ token: 'mock-jwt-token' });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    const products = [
      { id: 1, name: 'Widget', category: 'tools' },
      { id: 2, name: 'Gadget', category: 'electronics' },
    ];
    
    const filtered = category
      ? products.filter(p => p.category === category)
      : products;

    return HttpResponse.json(filtered);
  }),
];

// src/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
\\\`\\\`\\\`

### Test Setup (jest.setup.js or setupTests.js)

\\\`\\\`\\\`jsx
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());  // Reset to default handlers
afterAll(() => server.close());
\\\`\\\`\\\`

### Per-Test Handler Overrides

\\\`\\\`\\\`jsx
it('shows error message when API fails', async () => {
  // Override the default handler for this one test
  server.use(
    http.get('/api/users/:id', () => {
      return HttpResponse.json(
        { message: 'Server error' },
        { status: 500 }
      );
    })
  );

  render(<UserProfile userId="1" />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /something went wrong/i
  );
});
\\\`\\\`\\\`

**Interview tip:** "MSW is better than mocking fetch because it tests the full request/response cycle — headers, status codes, request body parsing, and error handling — exactly as they happen in production."

---

## Testing Patterns

### Custom Render with Providers

\\\`\\\`\\\`jsx
// test-utils.jsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

function AllProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export function renderWithProviders(ui, options) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from RTL so tests import from one place
export * from '@testing-library/react';
export { renderWithProviders as render };
\\\`\\\`\\\`

### Testing Custom Hooks with renderHook

\\\`\\\`\\\`jsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('increments the counter', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(11);
  });

  it('accepts a custom initial value', () => {
    const { result } = renderHook(() => useCounter(42));
    expect(result.current.count).toBe(42);
  });

  it('handles rerender with new props', () => {
    const { result, rerender } = renderHook(
      ({ initial }) => useCounter(initial),
      { initialProps: { initial: 5 } }
    );

    expect(result.current.count).toBe(5);

    // Re-render the hook with new props
    rerender({ initial: 20 });
    // Note: count won't reset unless the hook is designed to react to prop changes
  });
});
\\\`\\\`\\\`

### Testing Error Boundaries

\\\`\\\`\\\`jsx
// Suppress console.error noise from React's error logging
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

function ProblemChild() {
  throw new Error('Boom!');
}

it('displays fallback UI when child throws', () => {
  render(
    <ErrorBoundary fallback={<div role="alert">Something went wrong</div>}>
      <ProblemChild />
    </ErrorBoundary>
  );

  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  expect(screen.queryByText('normal content')).not.toBeInTheDocument();
});

consoleSpy.mockRestore();
\\\`\\\`\\\`

### Testing Navigation / Routing

\\\`\\\`\\\`jsx
import { MemoryRouter } from 'react-router-dom';

it('navigates to dashboard after login', async () => {
  const user = userEvent.setup();
  
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );

  await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
  await user.type(screen.getByLabelText(/password/i), 'password');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByRole('heading', { name: /dashboard/i }))
    .toBeInTheDocument();
});
\\\`\\\`\\\`

---

## Testing Accessibility

### jest-dom Accessibility Matchers

\\\`\\\`\\\`jsx
// ── Visibility ────────────────────────────────────────────────────────────
expect(screen.getByRole('dialog')).toBeVisible();
expect(screen.getByTestId('hidden-section')).not.toBeVisible();

// ── Accessible names ─────────────────────────────────────────────────────
expect(screen.getByRole('button')).toHaveAccessibleName('Submit form');
expect(screen.getByRole('img')).toHaveAccessibleName('Company logo');

// ── ARIA attributes ───────────────────────────────────────────────────────
expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
expect(screen.getByRole('tab', { selected: true })).toHaveAttribute(
  'aria-selected', 'true'
);

// ── Form states ───────────────────────────────────────────────────────────
expect(screen.getByRole('textbox', { name: /email/i })).toBeRequired();
expect(screen.getByRole('checkbox')).not.toBeChecked();
expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();

// ── Roles verify accessibility tree ───────────────────────────────────────
expect(screen.getByRole('navigation')).toBeInTheDocument();  // <nav>
expect(screen.getByRole('main')).toBeInTheDocument();         // <main>
expect(screen.getByRole('list')).toBeInTheDocument();          // <ul>/<ol>
expect(screen.getAllByRole('listitem')).toHaveLength(5);       // <li>
\\\`\\\`\\\`

**Interview tip:** "If you can't find an element with getByRole, it often means the HTML isn't accessible. Fixing the query fixes the app's accessibility."

---

## Snapshot Testing

Snapshot testing captures the rendered output and compares it against a stored snapshot file. Future runs compare the output — if it differs, the test fails.

\\\`\\\`\\\`jsx
// ── When to use ───────────────────────────────────────────────────────────
// ✅ Small, stable UI: icons, design tokens, simple presentational components
it('renders the icon correctly', () => {
  const { container } = render(<CheckIcon size={24} />);
  expect(container.firstChild).toMatchSnapshot();
});

// ── When NOT to use ───────────────────────────────────────────────────────
// ❌ Large components — snapshot diffs become unreadable noise
// ❌ Components with dynamic data — snapshot changes on every new data value
// ❌ As a substitute for behavioral tests — "snapshot passed" ≠ "it works"

// ── Inline snapshots (small, readable) ────────────────────────────────────
it('formats currency correctly', () => {
  expect(formatCurrency(1234.5)).toMatchInlineSnapshot(\\\`"$1,234.50"\\\`);
});
\\\`\\\`\\\`

**Interview tip:** "Snapshots are a complement to behavioral tests, not a replacement. They're best for catching accidental visual regressions in stable UI. Large snapshot files become 'approve-all' rubber stamps that catch nothing."

---

## Code Coverage

### What Coverage Measures

\\\`\\\`\\\`bash
npx jest --coverage

# Output:
# ----------|---------|----------|---------|---------|---
# File      | % Stmts | % Branch | % Funcs | % Lines |
# ----------|---------|----------|---------|---------|---
# LoginForm |   92.5  |    85.7  |   100   |   92.5  |
# ----------|---------|----------|---------|---------|---
\\\`\\\`\\\`

- **Statements** — % of code statements executed
- **Branches** — % of if/else/switch/ternary branches taken
- **Functions** — % of functions called
- **Lines** — % of executable lines run

### Coverage Limitations

\\\`\\\`\\\`jsx
// 100% coverage does NOT mean the code is correct
function divide(a, b) {
  return a / b; // No check for b === 0
}

test('divides numbers', () => {
  expect(divide(10, 2)).toBe(5); // 100% coverage! But divide(10, 0) = Infinity
});

// Coverage measures code EXECUTION, not CORRECTNESS
// A test that runs all lines but never asserts anything still shows 100% coverage
\\\`\\\`\\\`

**Interview tip:** "Coverage is a useful metric for finding untested code, but high coverage doesn't guarantee quality. A 90% covered codebase with meaningful assertions is better than 100% coverage with weak assertions."

---

## Common Anti-Patterns & Best Practices

### Anti-Patterns to Avoid

\\\`\\\`\\\`jsx
// ❌ Testing implementation details
expect(setState).toHaveBeenCalledWith({ loading: true });
expect(component.state.items).toHaveLength(3);
expect(wrapper.instance().handleClick).toBeDefined();

// ❌ Using container.querySelector (bypasses accessibility)
const button = container.querySelector('.submit-btn');

// ❌ Testing internal component names or structure
expect(wrapper.find('InternalComponent')).toHaveLength(1);

// ❌ Multiple unrelated assertions in one test
it('renders the entire page correctly', () => {
  // Tests header, sidebar, main content, footer, modals...
  // When it fails, which part broke?
});

// ❌ Not awaiting async operations
user.click(button);  // Missing await!
expect(screen.getByText('saved')).toBeInTheDocument(); // Might pass or fail randomly

// ❌ Using waitFor for things that aren't async
await waitFor(() => {
  expect(screen.getByText('static text')).toBeInTheDocument();
}); // Unnecessary — getBy is synchronous
\\\`\\\`\\\`

### Best Practices

\\\`\\\`\\\`jsx
// ✅ One behavior per test
it('shows validation error when email is empty', async () => { /* ... */ });
it('calls onSubmit with form data when valid', async () => { /* ... */ });

// ✅ Use userEvent.setup() at the top
const user = userEvent.setup();

// ✅ Use screen for all queries (no destructuring render)
render(<MyComponent />);
screen.getByRole('button'); // ✅ Clear, consistent

// ✅ Use *ByRole with name option for specificity
screen.getByRole('button', { name: /delete item/i });

// ✅ Assert on user-visible output, not internal state
expect(screen.getByText('3 items in cart')).toBeInTheDocument();

// ✅ Test error states and edge cases
it('shows error message when API fails', async () => { /* ... */ });
it('handles empty list gracefully', () => { /* ... */ });

// ✅ Use within() for scoping queries
import { within } from '@testing-library/react';
const nav = screen.getByRole('navigation');
within(nav).getByRole('link', { name: /home/i });

// ✅ Arrange-Act-Assert pattern
it('submits form data', async () => {
  // Arrange
  const onSubmit = jest.fn();
  render(<Form onSubmit={onSubmit} />);
  
  // Act
  await user.type(screen.getByLabelText(/name/i), 'Jane');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  // Assert
  expect(onSubmit).toHaveBeenCalledWith({ name: 'Jane' });
});
\\\`\\\`\\\`

---

## Quick Reference Card

| Task | Method |
|------|--------|
| Find element that must exist | \\\`getByRole\\\`, \\\`getByLabelText\\\`, \\\`getByText\\\` |
| Assert element does NOT exist | \\\`queryByRole\\\` + \\\`.not.toBeInTheDocument()\\\` |
| Wait for async element | \\\`findByRole\\\`, \\\`findByText\\\` |
| Simulate user click | \\\`await user.click(element)\\\` |
| Simulate typing | \\\`await user.type(input, 'text')\\\` |
| Clear input | \\\`await user.clear(input)\\\` |
| Wait for assertion | \\\`await waitFor(() => expect(...))\\\` |
| Wait for element removal | \\\`await waitForElementToBeRemoved(callback)\\\` |
| Mock function | \\\`jest.fn()\\\` |
| Mock module | \\\`jest.mock('./module')\\\` |
| Mock API | MSW: \\\`http.get/post\\\` + \\\`setupServer\\\` |
| Test custom hook | \\\`renderHook(() => useMyHook())\\\` |
| Scope queries | \\\`within(container).getByRole(...)\\\` |
`,
  },
];
