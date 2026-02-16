// ============================================================================
// Testing React Apps — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  "rtl-jest-fundamentals": [
    {
      title: "Login Form Test Suite — Full Behavioral Testing with userEvent, Validation, and jest.fn()",
      description:
        "A comprehensive test suite for a login form covering: rendering accessible form fields, validating required fields on submit, showing/hiding password toggle, submitting valid credentials, disabling the button during submission, and handling server errors — all using getByRole, userEvent.setup(), and jest.fn() for callback verification.",
      language: "javascript",
      code: `import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

// ── Component Under Test (for reference) ───────────────────────────────────
// <form onSubmit={handleSubmit}>
//   <label htmlFor="email">Email address</label>
//   <input id="email" type="email" required aria-required="true" />
//
//   <label htmlFor="password">Password</label>
//   <input id="password" type="password" required aria-required="true" />
//
//   <button type="button" aria-label="Toggle password visibility">
//     {showPassword ? 'Hide' : 'Show'}
//   </button>
//
//   <button type="submit" disabled={isSubmitting}>
//     {isSubmitting ? 'Signing in...' : 'Sign in'}
//   </button>
//
//   {error && <div role="alert">{error}</div>}
// </form>

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: onSubmit resolves successfully
    mockOnSubmit.mockResolvedValue({ token: 'mock-jwt' });
  });

  // ── Rendering Tests ──────────────────────────────────────────────────────

  it('renders email and password fields with accessible labels', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // getByRole 'textbox' only matches <input type="text|email|search|url">
    // NOT type="password" — password inputs have no implicit ARIA role
    expect(
      screen.getByRole('textbox', { name: /email address/i })
    ).toBeInTheDocument();

    // Password fields must use getByLabelText (no ARIA role for password)
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Submit button — found by role + accessible name
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeEnabled();
  });

  it('does not show error message on initial render', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // queryBy returns null instead of throwing — use for "should NOT exist"
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ── Validation Tests ──────────────────────────────────────────────────────

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Act: click submit without filling anything
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert: validation messages appear
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();

    // Assert: onSubmit was NOT called (validation blocked it)
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(
      screen.getByRole('textbox', { name: /email address/i }),
      'not-an-email'
    );
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('clears validation error when user starts typing', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Trigger validation error
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    // Start typing — error should disappear
    await user.type(
      screen.getByRole('textbox', { name: /email address/i }),
      'a'
    );
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  // ── Password Visibility Toggle ────────────────────────────────────────────

  it('toggles password visibility on button click', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', {
      name: /toggle password visibility/i,
    });

    // Initially hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle — becomes visible
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again — hidden again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ── Successful Submission ─────────────────────────────────────────────────

  it('calls onSubmit with email and password when form is valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Arrange: fill in the form
    await user.type(
      screen.getByRole('textbox', { name: /email address/i }),
      'user@example.com'
    );
    await user.type(
      screen.getByLabelText(/password/i),
      'SecureP@ss1'
    );

    // Act: submit
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert: onSubmit called with correct payload
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'SecureP@ss1',
    });
  });

  // ── Loading State ─────────────────────────────────────────────────────────

  it('disables submit button and shows loading text during submission', async () => {
    // Make onSubmit hang (never resolves during this test)
    mockOnSubmit.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(
      screen.getByRole('textbox', { name: /email address/i }),
      'user@example.com'
    );
    await user.type(screen.getByLabelText(/password/i), 'SecureP@ss1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Button should show loading state and be disabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /signing in/i })
      ).toBeDisabled();
    });
  });

  // ── Error Handling ────────────────────────────────────────────────────────

  it('displays server error message when submission fails', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(
      screen.getByRole('textbox', { name: /email address/i }),
      'user@example.com'
    );
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Error shown in an alert role element
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/invalid credentials/i);

    // Button should be re-enabled after error
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeEnabled();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('has accessible form structure', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Required fields have aria-required
    expect(
      screen.getByRole('textbox', { name: /email address/i })
    ).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();

    // Form has accessible submit button
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toHaveAccessibleName('Sign in');
  });

  // ── Keyboard Navigation ───────────────────────────────────────────────────

  it('supports form submission via Enter key', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(
      screen.getByRole('textbox', { name: /email address/i }),
      'user@example.com'
    );
    await user.type(screen.getByLabelText(/password/i), 'SecureP@ss1');

    // Press Enter to submit (form default behavior)
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
});

// ── What this example demonstrates ──────────────────────────────────────────
//
// 1. QUERY PRIORITY: Uses getByRole('textbox', { name }) for email,
//    getByLabelText for password (no ARIA role), getByRole('button', { name })
//    for buttons — matches how assistive technology finds elements.
//
// 2. QUERY VARIANTS: getBy for elements that must exist, queryBy for elements
//    that should NOT exist, findBy for async (error after submit).
//
// 3. userEvent.setup(): All interactions use the setup() pattern, which
//    simulates realistic browser event sequences (focus → keydown → input →
//    keyup → change) unlike fireEvent's single synthetic dispatch.
//
// 4. jest.fn() PATTERNS: mockResolvedValue for success, mockRejectedValue for
//    errors, mockReturnValue(new Promise(() => {})) for "hanging" requests.
//
// 5. BEHAVIORAL TESTING: Tests what users see (error text, button states,
//    input types) — never checks internal state or component instances.
//
// 6. ARRANGE-ACT-ASSERT: Each test follows the AAA pattern with clear
//    separation of setup, user action, and verification.
`,
    },
    {
      title: "API-Integrated Component Test with MSW — ProductList with Loading, Error, and Filter States",
      description:
        "Tests a ProductList component that fetches data from an API using MSW (Mock Service Worker) for realistic network mocking — covers loading states, successful data rendering, server error handling, empty states, category filtering, and per-test handler overrides without modifying component code.",
      language: "javascript",
      code: `import { render, screen, within, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ProductList from './ProductList';

// ── Component Under Test (for reference) ───────────────────────────────────
// function ProductList() {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [category, setCategory] = useState('all');
//
//   useEffect(() => {
//     setLoading(true);
//     const url = category === 'all'
//       ? '/api/products'
//       : \`/api/products?category=\${category}\`;
//     fetch(url)
//       .then(res => { if (!res.ok) throw new Error('Failed'); return res.json(); })
//       .then(data => { setProducts(data); setLoading(false); })
//       .catch(err => { setError(err.message); setLoading(false); });
//   }, [category]);
//
//   if (loading) return <div role="progressbar" aria-label="Loading products">Loading...</div>;
//   if (error) return <div role="alert">Error: {error}</div>;
//   if (products.length === 0) return <p>No products found.</p>;
//
//   return (
//     <div>
//       <label htmlFor="category-filter">Category</label>
//       <select id="category-filter" value={category}
//               onChange={e => setCategory(e.target.value)}>
//         <option value="all">All</option>
//         <option value="electronics">Electronics</option>
//         <option value="clothing">Clothing</option>
//       </select>
//       <ul aria-label="Product list">
//         {products.map(p => (
//           <li key={p.id}>
//             <h3>{p.name}</h3>
//             <p>\${p.price.toFixed(2)}</p>
//             <span className="badge">{p.category}</span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// ── MSW Setup — default handlers ────────────────────────────────────────────

const mockProducts = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, category: 'electronics' },
  { id: 2, name: 'Cotton T-Shirt', price: 24.99, category: 'clothing' },
  { id: 3, name: 'USB-C Charger', price: 19.99, category: 'electronics' },
  { id: 4, name: 'Running Shoes', price: 89.99, category: 'clothing' },
];

const server = setupServer(
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    const filtered = category
      ? mockProducts.filter(p => p.category === category)
      : mockProducts;

    return HttpResponse.json(filtered);
  })
);

// ── Server lifecycle — matches setupTests.js pattern ────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductList — API Integration', () => {
  // ── Loading State ────────────────────────────────────────────────────────

  it('shows a loading indicator while fetching products', () => {
    render(<ProductList />);

    // The progressbar should be present immediately (before fetch resolves)
    expect(
      screen.getByRole('progressbar', { name: /loading products/i })
    ).toBeInTheDocument();

    // Product list should NOT be visible yet
    expect(screen.queryByRole('list', { name: /product list/i }))
      .not.toBeInTheDocument();
  });

  // ── Successful Data Fetch ────────────────────────────────────────────────

  it('renders all products after successful fetch', async () => {
    render(<ProductList />);

    // Wait for loading to disappear
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('progressbar')
    );

    // Verify all products are rendered
    const list = screen.getByRole('list', { name: /product list/i });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);

    // Verify specific product content
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Cotton T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();
  });

  // ── Error Handling ───────────────────────────────────────────────────────

  it('shows error message when API returns 500', async () => {
    // Override the default handler for this single test
    server.use(
      http.get('/api/products', () => {
        return HttpResponse.json(
          { message: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    render(<ProductList />);

    // Wait for error to appear (findBy waits asynchronously)
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/error/i);

    // Product list should NOT be rendered
    expect(screen.queryByRole('list', { name: /product list/i }))
      .not.toBeInTheDocument();
  });

  it('shows error message on network failure', async () => {
    server.use(
      http.get('/api/products', () => {
        return HttpResponse.error(); // Simulates network failure
      })
    );

    render(<ProductList />);

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toBeInTheDocument();
  });

  // ── Empty State ──────────────────────────────────────────────────────────

  it('shows empty state when API returns no products', async () => {
    server.use(
      http.get('/api/products', () => {
        return HttpResponse.json([]); // Empty array
      })
    );

    render(<ProductList />);

    // Wait for loading to finish, then check for empty message
    expect(
      await screen.findByText(/no products found/i)
    ).toBeInTheDocument();

    // No list should be rendered
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  // ── Category Filtering ───────────────────────────────────────────────────

  it('filters products when category is changed', async () => {
    const user = userEvent.setup();
    render(<ProductList />);

    // Wait for initial load
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('progressbar')
    );

    // Initially shows all 4 products
    expect(screen.getAllByRole('listitem')).toHaveLength(4);

    // Select "Electronics" category
    await user.selectOptions(
      screen.getByRole('combobox', { name: /category/i }),
      'electronics'
    );

    // Wait for filtered results — loading appears again, then disappears
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('progressbar')
    );

    // Now only electronics products should be shown
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('USB-C Charger')).toBeInTheDocument();
    expect(screen.queryByText('Cotton T-Shirt')).not.toBeInTheDocument();
  });

  // ── Delayed Response ─────────────────────────────────────────────────────

  it('handles slow API responses gracefully', async () => {
    server.use(
      http.get('/api/products', async () => {
        // Simulate 200ms network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return HttpResponse.json(mockProducts);
      })
    );

    render(<ProductList />);

    // Loading should be visible during the delay
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Products should eventually appear
    await waitForElementToBeRemoved(
      () => screen.queryByRole('progressbar'),
      { timeout: 3000 }
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});

// ── What this example demonstrates ──────────────────────────────────────────
//
// 1. MSW SETUP: setupServer() with http.get() handlers, server lifecycle
//    (listen/resetHandlers/close) in beforeAll/afterEach/afterAll.
//
// 2. PER-TEST OVERRIDES: server.use() replaces the default handler for one
//    test only — resetHandlers() in afterEach restores defaults automatically.
//
// 3. LOADING STATE: Test the synchronous render (progressbar visible
//    immediately) and async transition (waitForElementToBeRemoved).
//
// 4. within() SCOPING: within(list).getAllByRole('listitem') ensures we're
//    querying inside the correct container, not the whole document.
//
// 5. ASYNC PATTERNS: findByRole for waiting, waitForElementToBeRemoved for
//    spinner disappearance, queryBy for asserting absence.
//
// 6. HttpResponse.error(): Simulates a network failure (fetch rejects)
//    vs HttpResponse.json({}, { status: 500 }) which simulates server error.
//
// 7. NO COMPONENT CHANGES: MSW intercepts real fetch() calls — the component
//    code is untouched, making tests realistic integration tests.
`,
    },
    {
      title: "Custom Hook Test with renderHook — useAsync Hook with Loading, Success, Error, and Retry",
      description:
        "Tests a custom useAsync hook using renderHook and act from @testing-library/react — covers initial state, successful async execution, error handling, retry logic, race condition prevention (stale closure), and hook re-rendering with new arguments — no wrapper component needed.",
      language: "javascript",
      code: `import { renderHook, act, waitFor } from '@testing-library/react';
import useAsync from './useAsync';

// ── Hook Under Test (for reference) ─────────────────────────────────────────
// function useAsync(asyncFn, immediate = true) {
//   const [state, setState] = useState({
//     data: null,
//     error: null,
//     status: 'idle', // 'idle' | 'pending' | 'success' | 'error'
//   });
//
//   const currentPromise = useRef(null);
//
//   const execute = useCallback((...args) => {
//     const promise = asyncFn(...args);
//     currentPromise.current = promise;
//     setState({ data: null, error: null, status: 'pending' });
//
//     promise
//       .then(data => {
//         // Only update if this is still the latest promise (prevents race conditions)
//         if (currentPromise.current === promise) {
//           setState({ data, error: null, status: 'success' });
//         }
//       })
//       .catch(error => {
//         if (currentPromise.current === promise) {
//           setState({ data: null, error, status: 'error' });
//         }
//       });
//
//     return promise;
//   }, [asyncFn]);
//
//   useEffect(() => {
//     if (immediate) execute();
//   }, [execute, immediate]);
//
//   return { ...state, execute };
// }

describe('useAsync', () => {
  // ── Helper: create a controllable promise ─────────────────────────────────
  function createControllablePromise() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  // ── Initial State ─────────────────────────────────────────────────────────

  it('starts in idle state when immediate=false', () => {
    const asyncFn = jest.fn().mockResolvedValue('data');

    const { result } = renderHook(() => useAsync(asyncFn, false));

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(asyncFn).not.toHaveBeenCalled();
  });

  it('executes immediately when immediate=true (default)', async () => {
    const asyncFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

    const { result } = renderHook(() => useAsync(asyncFn));

    // Initially pending (async function was called but hasn't resolved)
    expect(result.current.status).toBe('pending');
    expect(asyncFn).toHaveBeenCalledTimes(1);

    // Wait for resolution
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(result.current.error).toBeNull();
  });

  // ── Successful Execution ──────────────────────────────────────────────────

  it('transitions through pending → success with correct data', async () => {
    const { promise, resolve } = createControllablePromise();
    const asyncFn = jest.fn().mockReturnValue(promise);

    const { result } = renderHook(() => useAsync(asyncFn, false));

    // Execute manually
    let executePromise;
    act(() => {
      executePromise = result.current.execute();
    });

    // Should be pending
    expect(result.current.status).toBe('pending');
    expect(result.current.data).toBeNull();

    // Resolve the promise
    await act(async () => {
      resolve({ users: [{ id: 1, name: 'Jane' }] });
      await executePromise;
    });

    // Should be success
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual({
      users: [{ id: 1, name: 'Jane' }],
    });
    expect(result.current.error).toBeNull();
  });

  // ── Error Handling ────────────────────────────────────────────────────────

  it('transitions through pending → error on rejection', async () => {
    const { promise, reject } = createControllablePromise();
    const asyncFn = jest.fn().mockReturnValue(promise);

    const { result } = renderHook(() => useAsync(asyncFn, false));

    act(() => {
      result.current.execute();
    });

    expect(result.current.status).toBe('pending');

    // Reject the promise
    await act(async () => {
      reject(new Error('Network timeout'));
      // Catch the rejection to prevent unhandled promise warning
      await promise.catch(() => {});
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toEqual(new Error('Network timeout'));
    expect(result.current.data).toBeNull();
  });

  // ── Retry After Error ─────────────────────────────────────────────────────

  it('can retry after an error by calling execute again', async () => {
    const asyncFn = jest.fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce({ recovered: true });

    const { result } = renderHook(() => useAsync(asyncFn, false));

    // First attempt — fails
    await act(async () => {
      try { await result.current.execute(); } catch {}
    });
    expect(result.current.status).toBe('error');

    // Retry — succeeds
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual({ recovered: true });
    expect(result.current.error).toBeNull();
    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  // ── Race Condition Prevention ─────────────────────────────────────────────

  it('ignores stale responses when a newer request is made', async () => {
    // Simulate: request A takes 500ms, request B takes 100ms
    // Request A starts first, then B starts — B should win
    const { promise: promiseA, resolve: resolveA } = createControllablePromise();
    const { promise: promiseB, resolve: resolveB } = createControllablePromise();

    const asyncFn = jest.fn()
      .mockReturnValueOnce(promiseA)
      .mockReturnValueOnce(promiseB);

    const { result } = renderHook(() => useAsync(asyncFn, false));

    // Start request A
    act(() => {
      result.current.execute();
    });

    // Start request B (before A resolves)
    act(() => {
      result.current.execute();
    });

    // Resolve B first (it's faster)
    await act(async () => {
      resolveB({ source: 'B' });
      await promiseB;
    });

    expect(result.current.data).toEqual({ source: 'B' });

    // Now resolve A (stale) — should be IGNORED
    await act(async () => {
      resolveA({ source: 'A' });
      await promiseA;
    });

    // Data should still be from B, not A
    expect(result.current.data).toEqual({ source: 'B' });
    expect(result.current.status).toBe('success');
  });

  // ── Arguments Passing ─────────────────────────────────────────────────────

  it('passes arguments through execute to the async function', async () => {
    const fetchUser = jest.fn().mockResolvedValue({ id: '42', name: 'Alice' });

    const { result } = renderHook(() => useAsync(fetchUser, false));

    await act(async () => {
      await result.current.execute('42', { includeProfile: true });
    });

    expect(fetchUser).toHaveBeenCalledWith('42', { includeProfile: true });
    expect(result.current.data).toEqual({ id: '42', name: 'Alice' });
  });

  // ── execute() Reference Stability ─────────────────────────────────────────

  it('returns a stable execute reference across renders', () => {
    const asyncFn = jest.fn().mockResolvedValue('data');

    const { result, rerender } = renderHook(() => useAsync(asyncFn, false));

    const firstExecute = result.current.execute;

    // Re-render the hook (simulates parent re-rendering)
    rerender();

    const secondExecute = result.current.execute;

    // execute should be the same reference (memoized with useCallback)
    // This is important when passing execute to React.memo-wrapped children
    expect(firstExecute).toBe(secondExecute);
  });

  // ── Hook with Provider Wrapper ────────────────────────────────────────────

  it('works with a context provider wrapper', async () => {
    // If your hook needs context, pass a wrapper to renderHook
    const AuthContext = React.createContext(null);
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={{ token: 'mock-token' }}>
        {children}
      </AuthContext.Provider>
    );

    const fetchWithAuth = jest.fn().mockResolvedValue({ secure: true });

    const { result } = renderHook(
      () => useAsync(fetchWithAuth),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });
});

// ── What this example demonstrates ──────────────────────────────────────────
//
// 1. renderHook() BASICS: Renders a hook without a component — returns
//    { result, rerender, unmount }. result.current holds the latest return
//    value of the hook.
//
// 2. act() WRAPPING: All state-changing operations (execute, resolve/reject
//    promises) must be wrapped in act() to flush React's state updates —
//    without it, assertions may see stale state.
//
// 3. CONTROLLABLE PROMISES: createControllablePromise() gives fine-grained
//    control over when async operations resolve/reject — essential for testing
//    loading states, race conditions, and state transitions.
//
// 4. RACE CONDITION TESTING: Verifies that the hook ignores stale responses
//    by starting two requests and resolving them out of order — the hook uses
//    a ref to track the "current" promise and ignores outdated ones.
//
// 5. MOCK CHAINING: mockRejectedValueOnce().mockResolvedValueOnce() sets up
//    sequential return values — first call fails, second succeeds (retry).
//
// 6. REFERENCE STABILITY: Verifies that execute is memoized (same reference
//    across re-renders) — critical for React.memo and useEffect deps.
//
// 7. WRAPPER OPTION: renderHook accepts { wrapper } for providing context
//    providers, routers, or other HOCs that the hook depends on.
`,
    },
  ],
};

export default examples;
