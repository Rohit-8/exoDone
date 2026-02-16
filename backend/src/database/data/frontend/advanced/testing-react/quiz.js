// ============================================================================
// Testing React Apps — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  "rtl-jest-fundamentals": [
    {
      question_text:
        "What is the recommended query priority in React Testing Library, and why does getByRole come first while getByTestId is the last resort?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The priority is getByRole > getByLabelText > getByPlaceholderText > getByText > getByDisplayValue > getByAltText > getByTitle > getByTestId — getByRole is first because it reflects how assistive technology (screen readers) and users perceive the page, ensuring your tests verify accessibility; getByTestId is last because data-testid is invisible to users and doesn't verify that the element is accessible or semantically correct",
        "The priority is getByTestId > getByText > getByRole > getByLabelText > getByPlaceholderText — getByTestId is actually recommended first because it provides the most stable selector that won't break when text content changes; getByRole is unreliable because ARIA roles can be overridden",
        "The priority is getByText > getByRole > getByLabelText > getByTestId — getByText comes first because it's the simplest query and matches exactly what users read on screen; getByRole is second because not all elements have ARIA roles",
        "There is no official priority — React Testing Library treats all queries equally and recommends using whichever query is most convenient for the developer; the documentation mentions getByRole first only for alphabetical reasons",
      ]),
      correct_answer:
        "The priority is getByRole > getByLabelText > getByPlaceholderText > getByText > getByDisplayValue > getByAltText > getByTitle > getByTestId — getByRole is first because it reflects how assistive technology (screen readers) and users perceive the page, ensuring your tests verify accessibility; getByTestId is last because data-testid is invisible to users and doesn't verify that the element is accessible or semantically correct",
      explanation:
        "React Testing Library's query priority is intentionally designed to push developers toward accessible HTML. getByRole matches ARIA roles (button, textbox, heading, navigation, etc.) — the same roles that screen readers use to help visually impaired users navigate the page. If you can't find an element with getByRole, it often means the HTML lacks proper semantic markup, which is an accessibility bug worth fixing. getByLabelText is next because labels are essential for form accessibility. getByTestId is the escape hatch for elements that have no accessible role, label, or text — but over-relying on it means your tests pass even when the component is inaccessible. The RTL philosophy: 'The more your tests resemble the way your software is used, the more confidence they can give you.'",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "What is the difference between getBy, queryBy, and findBy query variants in React Testing Library, and when should you use each one?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "getBy throws an error if the element is NOT found (use to assert presence), queryBy returns null if NOT found (use to assert absence with .not.toBeInTheDocument()), findBy returns a Promise that resolves when the element appears in the DOM within a timeout (use for async rendering like API responses) — each also has an *AllBy* variant for matching multiple elements",
        "getBy is synchronous, queryBy uses requestAnimationFrame for better performance, findBy uses requestIdleCallback — all three return the same result but with different frame scheduling; use getBy for immediate elements, queryBy for animations, findBy for idle-time rendering",
        "getBy searches the real DOM, queryBy searches the virtual DOM (faster), findBy searches both and returns whichever finds the element first — use queryBy for unit tests (faster) and getBy for integration tests (more realistic)",
        "getBy returns the first match, queryBy returns all matches as an array, findBy returns a generator that yields matches one at a time — use getBy for single elements, queryBy for lists, findBy for paginated results",
      ]),
      correct_answer:
        "getBy throws an error if the element is NOT found (use to assert presence), queryBy returns null if NOT found (use to assert absence with .not.toBeInTheDocument()), findBy returns a Promise that resolves when the element appears in the DOM within a timeout (use for async rendering like API responses) — each also has an *AllBy* variant for matching multiple elements",
      explanation:
        "This is one of the most common interview questions about RTL. The key decision tree: (1) Is the element expected to be in the DOM right now? → Use getBy (it throws a helpful error if missing). (2) Should the element NOT be in the DOM? → Use queryBy (returns null, allowing expect(queryByText('Error')).not.toBeInTheDocument()). (3) Will the element appear asynchronously? → Use findBy (returns a Promise, internally uses waitFor with a default timeout of 1000ms). Common mistake: using getBy for async elements (throws immediately because the element isn't in the DOM yet) or using findBy for synchronous elements (works but adds unnecessary async complexity). The *AllBy* variants (getAllByRole, queryAllByRole, findAllByRole) return arrays and are used when multiple elements match.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text:
        "Why is userEvent preferred over fireEvent for testing React components, and what bugs can userEvent catch that fireEvent misses?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "userEvent simulates the complete browser interaction sequence (e.g., a click fires pointerdown → mousedown → focus → pointerup → mouseup → click, and typing fires focus → keyDown → keyPress → input → keyUp per character) while fireEvent dispatches only a single synthetic event — userEvent catches bugs like disabled buttons still receiving clicks (pointer-events: none), missing focus management, keyboard navigation issues, and event handler ordering problems that fireEvent would miss entirely",
        "userEvent is faster than fireEvent because it batches all events into a single synchronous dispatch, while fireEvent makes individual DOM API calls for each event — userEvent catches performance bugs like unnecessary re-renders and event handler memory leaks",
        "userEvent uses actual browser APIs (document.execCommand, Selection API) while fireEvent uses React's synthetic event system — userEvent catches cross-browser compatibility bugs while fireEvent only tests React's event normalization layer",
        "userEvent runs tests in a headless browser instance (like Puppeteer) while fireEvent runs in jsdom — userEvent catches CSS-related bugs like elements hidden by overflow:hidden while fireEvent cannot interact with the visual rendering",
      ]),
      correct_answer:
        "userEvent simulates the complete browser interaction sequence (e.g., a click fires pointerdown → mousedown → focus → pointerup → mouseup → click, and typing fires focus → keyDown → keyPress → input → keyUp per character) while fireEvent dispatches only a single synthetic event — userEvent catches bugs like disabled buttons still receiving clicks (pointer-events: none), missing focus management, keyboard navigation issues, and event handler ordering problems that fireEvent would miss entirely",
      explanation:
        "fireEvent.click() dispatches a single 'click' event. But real browsers fire a sequence: pointerover → pointerenter → pointermove → pointerdown → focus → mousedown → pointerup → mouseup → click. userEvent.click() simulates this full sequence. This matters because: (1) A button with CSS pointer-events: none blocks the pointer events in userEvent (real behavior) but fireEvent.click() still fires. (2) Focus management — userEvent triggers focus/blur events, catching bugs where components depend on onFocus/onBlur. (3) Typing — userEvent.type('Hi') fires keyDown/keyPress/input/keyUp for each character, testing input validation that runs on keyDown or key-by-key processing. In userEvent v14+, you must call userEvent.setup() to create an instance, and all methods are async (require await).",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "How does MSW (Mock Service Worker) differ from mocking fetch or axios directly with jest.mock(), and why is MSW recommended for integration testing?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "MSW intercepts requests at the network level (service worker / request interception), so the component's actual fetch/axios code executes fully including headers, URL construction, request body serialization, and error handling — jest.mock() replaces the module entirely, skipping all that code; MSW also allows per-test handler overrides with server.use() and automatically resets with server.resetHandlers(), making it easy to test error scenarios without modifying component code",
        "MSW is a browser extension that records real API responses and replays them during tests — jest.mock() creates synthetic responses from scratch; MSW is better because the responses are guaranteed to match the real API since they were recorded from production",
        "MSW runs a real HTTP server on localhost that the component sends requests to — jest.mock() intercepts at the import level; MSW is better because it tests the real TCP/HTTP stack including DNS resolution, TLS, and cookies, while jest.mock() only tests the JavaScript layer",
        "MSW uses WebSockets to intercept requests, which is faster than jest.mock()'s synchronous module replacement — MSW is recommended because it supports streaming responses and server-sent events that jest.mock() cannot handle",
      ]),
      correct_answer:
        "MSW intercepts requests at the network level (service worker / request interception), so the component's actual fetch/axios code executes fully including headers, URL construction, request body serialization, and error handling — jest.mock() replaces the module entirely, skipping all that code; MSW also allows per-test handler overrides with server.use() and automatically resets with server.resetHandlers(), making it easy to test error scenarios without modifying component code",
      explanation:
        "When you jest.mock('../api') and mock fetchUser, the actual HTTP request code never runs — URL construction, headers, query parameters, request body serialization, response parsing, and error handling are all skipped. You're testing the component's behavior assuming the API layer works correctly. With MSW, the component calls fetch('/api/users/1') normally, MSW intercepts the request at the network layer and returns your mock response. This tests the entire request/response pipeline in the component. MSW setup: (1) Define handlers: http.get('/api/users/:id', handler); (2) Create server: setupServer(...handlers); (3) Lifecycle: beforeAll → server.listen(), afterEach → server.resetHandlers(), afterAll → server.close(); (4) Per-test overrides: server.use(http.get(...)) temporarily replaces a handler. MSW in Node uses request interception (not a service worker, which is browser-only).",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "How do you test a custom React hook using renderHook, and why can't you call a hook directly in a test function?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Hooks can only be called inside React components — calling useCounter() directly in a test violates the Rules of Hooks, causing a runtime error; renderHook(() => useCounter()) wraps the hook in a temporary component, returning { result, rerender, unmount } where result.current always holds the hook's latest return value; state updates must be wrapped in act() to flush React's update queue before making assertions",
        "Hooks can be called directly in tests, but renderHook provides performance optimizations by batching multiple hook calls into a single render cycle — result.current is a snapshot of the hook's last rendered value, and rerender() triggers a new React reconciliation pass; act() is optional but reduces console warnings",
        "renderHook is required because Jest runs in Node.js which doesn't have a DOM — renderHook creates a virtual DOM context for the hook; hooks work fine in browser-based test runners like Karma without renderHook; result.current is a deep clone of the hook's return value to prevent mutation",
        "Hooks can't be called in test functions because Jest mocks the React module by default — renderHook bypasses this mock and calls the real React; result.current is a proxy object that re-executes the hook on every access; act() is only needed for useEffect, not useState",
      ]),
      correct_answer:
        "Hooks can only be called inside React components — calling useCounter() directly in a test violates the Rules of Hooks, causing a runtime error; renderHook(() => useCounter()) wraps the hook in a temporary component, returning { result, rerender, unmount } where result.current always holds the hook's latest return value; state updates must be wrapped in act() to flush React's update queue before making assertions",
      explanation:
        "React hooks (useState, useEffect, useCallback, etc.) must be called inside a function component or another hook — this is enforced at runtime. renderHook from @testing-library/react solves this by creating an invisible wrapper component that calls your hook. The return value: result.current — a live reference to the hook's latest return value (not a snapshot, not a clone). After calling a hook method that updates state (e.g., result.current.increment()), you must wrap it in act(() => { ... }) to tell React to process all pending state updates, effects, and re-renders synchronously. Without act(), result.current might still reflect the old state. The rerender() function re-renders the wrapper with new props — useful for testing hooks that depend on arguments. The unmount() function triggers cleanup effects.",
      difficulty: "hard",
      order_index: 5,
    },
    {
      question_text:
        "What is the difference between jest.fn(), jest.mock(), and jest.spyOn(), and when would you use each in React testing?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "jest.fn() creates a standalone mock function for tracking calls and setting return values (use for callback props like onSubmit); jest.mock('./module') replaces an entire module's exports with mock implementations at the file level (use for mocking API modules, routers, or third-party libs); jest.spyOn(object, 'method') wraps an existing method to track calls while optionally preserving the original implementation (use for spying on window.fetch, console.error, or module methods you want to monitor but not fully replace) — spyOn can be restored with mockRestore()",
        "jest.fn() creates synchronous mocks only; jest.mock() creates async mocks with Promise support; jest.spyOn() creates streaming mocks for observables and event emitters — use fn() for pure functions, mock() for API calls, spyOn() for WebSocket connections",
        "jest.fn() mocks functions, jest.mock() mocks CSS/HTML imports, jest.spyOn() mocks environment variables — they target different types of dependencies; fn() for logic, mock() for assets, spyOn() for configuration",
        "jest.fn() creates a mock that can only be used once; jest.mock() creates a reusable mock shared across all tests in a file; jest.spyOn() creates a scoped mock limited to a single describe block — they differ only in scope/lifetime",
      ]),
      correct_answer:
        "jest.fn() creates a standalone mock function for tracking calls and setting return values (use for callback props like onSubmit); jest.mock('./module') replaces an entire module's exports with mock implementations at the file level (use for mocking API modules, routers, or third-party libs); jest.spyOn(object, 'method') wraps an existing method to track calls while optionally preserving the original implementation (use for spying on window.fetch, console.error, or module methods you want to monitor but not fully replace) — spyOn can be restored with mockRestore()",
      explanation:
        "jest.fn() is the simplest — it creates a new function that records all calls (arguments, return values, call count). Common patterns: jest.fn().mockReturnValue(42), jest.fn().mockResolvedValue(data), jest.fn().mockImplementation(x => x * 2). Use it for props: <Form onSubmit={jest.fn()} />. jest.mock('./api') hoists to the top of the file and replaces the module. All exports become jest.fn() unless you provide a factory: jest.mock('./api', () => ({ fetchUser: jest.fn() })). Use it for dependencies your component imports. jest.spyOn(object, 'method') wraps an existing method — the original implementation still runs unless you chain .mockImplementation() or .mockReturnValue(). Key advantage: mockRestore() undoes the spy completely, restoring the original method. Use it for global objects (window, console, Math.random) or when you want to preserve the real behavior while tracking calls.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text:
        "When should you use snapshot testing versus behavioral testing, and what are the main pitfalls of over-relying on snapshots?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Snapshots are best for small, stable UI elements (icons, design tokens, formatted strings) where accidental changes should be flagged — behavioral tests should cover all interactive logic (forms, clicks, async flows); the pitfalls of over-relying on snapshots are: (1) large snapshots produce unreadable diffs that developers blindly approve with --updateSnapshot, (2) they test structure not behavior so 'snapshot passed' does not mean 'the feature works', (3) they're brittle and break on any markup change including irrelevant whitespace or class name changes, creating noise",
        "Snapshots should be used for all components because they provide 100% coverage automatically — behavioral tests are only needed for components with API calls; there are no significant pitfalls because Jest's snapshot diffing algorithm is intelligent enough to ignore irrelevant changes like whitespace and attribute ordering",
        "Snapshots should replace all other tests in a mature codebase because they capture the complete rendered output — behavioral tests are only needed during initial development; the only pitfall is that snapshots increase the repository size, which can be solved by gitignoring the __snapshots__ directory",
        "Snapshots should only be used in end-to-end tests with visual regression tools like Percy or Chromatic — using toMatchSnapshot() in unit tests is an anti-pattern because jsdom doesn't render CSS, making the snapshots incomplete; behavioral tests should be the only tests in unit/integration suites",
      ]),
      correct_answer:
        "Snapshots are best for small, stable UI elements (icons, design tokens, formatted strings) where accidental changes should be flagged — behavioral tests should cover all interactive logic (forms, clicks, async flows); the pitfalls of over-relying on snapshots are: (1) large snapshots produce unreadable diffs that developers blindly approve with --updateSnapshot, (2) they test structure not behavior so 'snapshot passed' does not mean 'the feature works', (3) they're brittle and break on any markup change including irrelevant whitespace or class name changes, creating noise",
      explanation:
        "Snapshot tests capture the entire rendered output (HTML string) and store it in a __snapshots__ file. On subsequent runs, if the output differs, the test fails. This sounds useful but has practical problems at scale: (1) A large component snapshot might be 200+ lines of HTML — when it changes, the diff is unreadable, so developers press 'u' (update) without reviewing. This defeats the purpose. (2) A snapshot passing only means 'the output didn't change' — not 'the button works when clicked' or 'the form validates correctly.' You can rename a button from 'Submit' to 'Sbumit' and if you update the snapshot, the typo is locked in forever. (3) Any changes — adding a CSS class, reordering attributes, wrapping in a div — break snapshots even if behavior is unchanged. Best practice: use toMatchInlineSnapshot() for small values (formatCurrency(1234) → '$1,234.00') and toMatchSnapshot() only for stable, small UI. Use behavioral tests (render → interact → assert visible output) for everything else.",
      difficulty: "medium",
      order_index: 7,
    },
    {
      question_text:
        "What are the most common React testing anti-patterns, and what best practices should replace them?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Anti-patterns: (1) testing implementation details like internal state, instance methods, or component structure instead of user-visible behavior; (2) using container.querySelector('.class') instead of accessible queries; (3) not awaiting async operations (findBy without await, user.click without await); (4) wrapping synchronous assertions in waitFor unnecessarily; (5) testing multiple unrelated behaviors in a single test. Best practices: use getByRole with { name } for accessible queries, one behavior per test, always await userEvent and findBy, use Arrange-Act-Assert structure, and use within() to scope queries to specific containers",
        "Anti-patterns: (1) using getByRole instead of getByTestId since data-testid is more stable; (2) using userEvent instead of fireEvent since fireEvent is simpler; (3) writing too many small tests instead of one large test per component; (4) mocking API calls instead of using real backends. Best practices: always use getByTestId, prefer fireEvent for speed, consolidate into large integration tests, and connect to a real test database",
        "Anti-patterns: (1) writing tests at all for simple components — only complex components need tests; (2) using Jest instead of Mocha which has better async support; (3) testing error states since errors should be handled by error boundaries, not tested individually; (4) using React Testing Library instead of Enzyme which provides more control. Best practices: only test components with more than 100 lines, use Mocha + Chai, skip error testing, and use shallow rendering with Enzyme",
        "Anti-patterns: (1) running tests in watch mode which is slow; (2) using beforeEach which creates shared mutable state; (3) testing accessibility since that's a design concern, not a development concern; (4) using async/await syntax instead of .then() chains. Best practices: run tests once in CI only, inline all setup in each test, skip accessibility assertions, and use callback-based async testing",
      ]),
      correct_answer:
        "Anti-patterns: (1) testing implementation details like internal state, instance methods, or component structure instead of user-visible behavior; (2) using container.querySelector('.class') instead of accessible queries; (3) not awaiting async operations (findBy without await, user.click without await); (4) wrapping synchronous assertions in waitFor unnecessarily; (5) testing multiple unrelated behaviors in a single test. Best practices: use getByRole with { name } for accessible queries, one behavior per test, always await userEvent and findBy, use Arrange-Act-Assert structure, and use within() to scope queries to specific containers",
      explanation:
        "These anti-patterns come directly from the React Testing Library documentation and common interview scenarios. (1) Implementation detail testing: expect(component.state.loading) breaks when you refactor from useState to useReducer — instead, test what the user sees: expect(screen.getByRole('progressbar')).toBeInTheDocument(). (2) container.querySelector: bypasses accessibility — if you need a CSS selector, the HTML probably needs better semantic markup. (3) Missing await: user.click() and findByText() return Promises in userEvent v14+ — forgetting await causes tests to pass even when they should fail, because the assertion runs before the action completes. (4) Unnecessary waitFor: wrapping getByText (synchronous) in waitFor adds 50ms+ overhead per test and obscures intent — only use waitFor for genuinely async assertions. (5) Multiple behaviors: a test named 'renders correctly' that checks header, sidebar, form, and footer — when it fails, you don't know which part broke. One behavior = one it() block.",
      difficulty: "hard",
      order_index: 8,
    },
  ],
};

export default quiz;
