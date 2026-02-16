// ============================================================================
// Testing & TDD — Quiz Questions
// ============================================================================

const quiz = {
  'unit-testing-jest': [
    {
      question_text: "What is the TDD cycle?",
      question_type: "multiple_choice",
      options: [
        "Code → Deploy → Test",
        "Red → Green → Refactor",
        "Plan → Build → Ship",
        "Debug → Fix → Commit"
      ],
      correct_answer: "Red → Green → Refactor",
      explanation: "TDD follows three steps: write a failing test (Red), write minimal code to pass it (Green), then improve the code while keeping tests green (Refactor).",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is the purpose of mocking in unit tests?",
      question_type: "multiple_choice",
      options: [
        "To speed up test execution by caching results",
        "To isolate the unit under test from its external dependencies",
        "To generate random test data automatically",
        "To test the user interface directly in the browser"
      ],
      correct_answer: "To isolate the unit under test from its external dependencies",
      explanation: "Mocks replace real dependencies (databases, APIs, email services) with controlled substitutes. This lets you test the unit's logic in isolation, without side effects or network calls.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "Which Jest matcher should you use to compare objects or arrays for deep equality?",
      question_type: "multiple_choice",
      options: [
        "toBe()",
        "toEqual()",
        "toMatch()",
        "toContain()"
      ],
      correct_answer: "toEqual()",
      explanation: "toBe() uses strict reference equality (===), which fails for objects even if they have identical contents. toEqual() performs a deep recursive comparison of all properties, making it the correct choice for objects and arrays.",
      difficulty: "easy",
      order_index: 3,
    },
    {
      question_text: "What does the following test assert?\n\n```javascript\nexpect(() => processInput(null)).toThrow('Input required');\n```",
      question_type: "multiple_choice",
      options: [
        "processInput(null) returns the string 'Input required'",
        "Calling processInput(null) throws an error with message 'Input required'",
        "processInput(null) resolves a promise with 'Input required'",
        "processInput(null) logs 'Input required' to the console"
      ],
      correct_answer: "Calling processInput(null) throws an error with message 'Input required'",
      explanation: "The toThrow() matcher verifies that a function throws an error. The function must be wrapped in () => ... so Jest can catch the error. The string argument matches against the error message.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "What is the difference between jest.fn(), jest.mock(), and jest.spyOn()?",
      question_type: "multiple_choice",
      options: [
        "They are all identical — just aliases for the same function",
        "jest.fn() creates a standalone mock, jest.mock() replaces an entire module, jest.spyOn() wraps an existing method while preserving access to the original",
        "jest.fn() mocks modules, jest.mock() creates functions, jest.spyOn() watches console output",
        "jest.fn() is for sync code, jest.mock() is for async code, jest.spyOn() is for timers"
      ],
      correct_answer: "jest.fn() creates a standalone mock, jest.mock() replaces an entire module, jest.spyOn() wraps an existing method while preserving access to the original",
      explanation: "jest.fn() creates a new mock function from scratch. jest.mock('./module') replaces all exports of a module with mock functions. jest.spyOn(obj, 'method') wraps an existing method — you can track calls while keeping the original behavior, or override it with mockReturnValue().",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text: "What is wrong with this async test?\n\n```javascript\nit('fetches user', () => {\n  userService.getUser(1).then(user => {\n    expect(user.name).toBe('Alice');\n  });\n});\n```",
      question_type: "multiple_choice",
      options: [
        "getUser() should be called with a string, not a number",
        "The test will always pass because the promise resolves after the test completes — it needs async/await or a return statement",
        "toBe() cannot be used to compare strings",
        "The .then() syntax is not supported by Jest"
      ],
      correct_answer: "The test will always pass because the promise resolves after the test completes — it needs async/await or a return statement",
      explanation: "Without 'return' or 'async/await', Jest considers the test complete immediately (before the promise resolves). The assertion inside .then() never runs, so the test always passes — even if user.name is 'Bob'. Fix: add 'return' before the promise, or use 'async/await'.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text: "What does the AAA pattern stand for in testing?",
      question_type: "multiple_choice",
      options: [
        "Assert → Act → Arrange",
        "Arrange → Act → Assert",
        "Analyze → Apply → Approve",
        "Abstract → Adapt → Assign"
      ],
      correct_answer: "Arrange → Act → Assert",
      explanation: "AAA structures each test into three clear phases: Arrange (set up test data and dependencies), Act (execute the code under test), Assert (verify the results). This pattern makes tests readable, consistent, and easy to maintain.",
      difficulty: "easy",
      order_index: 7,
    },
    {
      question_text: "Which lifecycle hook runs before EACH individual test in a describe block?",
      question_type: "multiple_choice",
      options: [
        "beforeAll",
        "beforeEach",
        "afterAll",
        "beforeTest"
      ],
      correct_answer: "beforeEach",
      explanation: "beforeEach runs before every single test in its describe block (and nested blocks). beforeAll runs once before all tests. There is no 'beforeTest' in Jest. Use beforeEach for fresh mocks/state; use beforeAll for expensive one-time setup like database connections.",
      difficulty: "easy",
      order_index: 8,
    },
    {
      question_text: "What do code coverage metrics measure?",
      question_type: "multiple_choice",
      options: [
        "How many bugs exist in the code",
        "How much of the source code is executed during testing",
        "How fast the tests run",
        "How many users have tested the application"
      ],
      correct_answer: "How much of the source code is executed during testing",
      explanation: "Code coverage measures the percentage of statements, branches, functions, and lines that are executed when tests run. However, high coverage does NOT guarantee correctness — a test that calls a function but never asserts the result achieves coverage without catching bugs.",
      difficulty: "easy",
      order_index: 9,
    },
    {
      question_text: "Which testing anti-pattern does this test demonstrate?\n\n```javascript\nit('calls the internal _validateInput method', () => {\n  const spy = jest.spyOn(service, '_validateInput');\n  service.processOrder(orderData);\n  expect(spy).toHaveBeenCalled();\n});\n```",
      question_type: "multiple_choice",
      options: [
        "Testing too many things at once",
        "Testing implementation details instead of observable behavior",
        "Not cleaning up mocks after tests",
        "Using synchronous tests for async code"
      ],
      correct_answer: "Testing implementation details instead of observable behavior",
      explanation: "This test asserts that a private method (_validateInput) was called — which is an implementation detail. If the method is renamed or the validation logic is restructured, this test breaks even though the behavior is unchanged. Instead, test the observable output: does processOrder() return the right result or throw the right error?",
      difficulty: "hard",
      order_index: 10,
    },
  ],
  'integration-testing-strategy': [
    {
      question_text: "What is the key difference between unit tests and integration tests?",
      question_type: "multiple_choice",
      options: [
        "Unit tests are written in JavaScript, integration tests are written in Python",
        "Unit tests use mocks for all dependencies; integration tests verify real interactions between multiple components",
        "Integration tests are faster than unit tests",
        "Unit tests can only test functions, integration tests can only test classes"
      ],
      correct_answer: "Unit tests use mocks for all dependencies; integration tests verify real interactions between multiple components",
      explanation: "Unit tests isolate a single function/class by mocking everything else. Integration tests let multiple real components work together (e.g., Express + middleware + database) to verify they integrate correctly. Integration tests are typically slower but catch issues that unit tests miss.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is the recommended test distribution in the testing pyramid?",
      question_type: "multiple_choice",
      options: [
        "90% E2E, 5% integration, 5% unit",
        "33% unit, 33% integration, 33% E2E",
        "70% unit, 20% integration, 10% E2E",
        "50% unit, 50% E2E, 0% integration"
      ],
      correct_answer: "70% unit, 20% integration, 10% E2E",
      explanation: "The testing pyramid recommends many fast unit tests at the base, fewer integration tests in the middle, and only a few slow E2E tests at the top. This gives you fast feedback, high confidence, and minimal flaky tests. The anti-pattern 'ice cream cone' (too many E2E, too few unit) is slow and fragile.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "Why should you separate your Express app creation from server.listen() when testing?",
      question_type: "multiple_choice",
      options: [
        "Because Node.js doesn't allow calling listen() twice",
        "So supertest can send requests directly to the app without starting a real HTTP server",
        "Because Express apps can only be tested when not listening",
        "To make the app run in production mode"
      ],
      correct_answer: "So supertest can send requests directly to the app without starting a real HTTP server",
      explanation: "Supertest works by importing your Express app object and making requests against it internally — no real HTTP server needed. If server.listen() is in the same file as app creation, importing for tests would start a real server. Separating them (app.js vs server.js) lets supertest test the app cleanly.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "What is the transaction rollback strategy for database testing?",
      question_type: "multiple_choice",
      options: [
        "Delete all test data after each test with DELETE FROM statements",
        "Use a separate database and never clean up",
        "Wrap each test in BEGIN/ROLLBACK so changes are automatically undone",
        "Mock all database calls so no real queries ever run"
      ],
      correct_answer: "Wrap each test in BEGIN/ROLLBACK so changes are automatically undone",
      explanation: "Transaction rollback wraps each test in BEGIN → (run test) → ROLLBACK. Any INSERTs, UPDATEs, or DELETEs during the test are automatically undone by the ROLLBACK. This is faster than DELETE-based cleanup, guarantees complete isolation, and prevents leftover data from affecting other tests.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "How do you test Express middleware in isolation?",
      question_type: "multiple_choice",
      options: [
        "You can only test middleware as part of a full route with supertest",
        "Create mock req, res, and next objects with jest.fn(), then call the middleware function directly",
        "Middleware cannot be tested — it's framework code",
        "Use a real browser to send requests through the middleware"
      ],
      correct_answer: "Create mock req, res, and next objects with jest.fn(), then call the middleware function directly",
      explanation: "Middleware functions are just functions that take (req, res, next). By creating mock objects — req with the headers/body you need, res with jest.fn() for status/json, and next as jest.fn() — you can call the middleware directly and assert on what it did. This is faster and more precise than supertest.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text: "When should you use snapshot testing?",
      question_type: "multiple_choice",
      options: [
        "For all tests — snapshots should replace targeted assertions entirely",
        "For complex business logic calculations",
        "For detecting unintended changes in API response shapes, error formats, or configuration objects",
        "Only for frontend component rendering"
      ],
      correct_answer: "For detecting unintended changes in API response shapes, error formats, or configuration objects",
      explanation: "Snapshot testing captures output and detects when it changes unexpectedly. It's good for API response shapes and serialized configs. But don't overuse it — snapshots are easy to update blindly (npx jest -u), which defeats the purpose. Use targeted assertions for important values and snapshots for shape/structure.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text: "What is property-based testing?",
      question_type: "multiple_choice",
      options: [
        "Testing that CSS properties render correctly in the browser",
        "Testing JavaScript object properties with hasOwnProperty()",
        "Generating hundreds of random inputs to verify that certain properties (invariants) always hold true",
        "Testing that class properties are properly initialized in the constructor"
      ],
      correct_answer: "Generating hundreds of random inputs to verify that certain properties (invariants) always hold true",
      explanation: "Property-based testing (using libraries like fast-check) generates random inputs and checks that invariant properties hold. For example: 'sorting an array twice gives the same result as sorting once' or 'encoding then decoding returns the original'. It excels at finding edge cases you wouldn't write manually.",
      difficulty: "hard",
      order_index: 7,
    },
    {
      question_text: "Which of the following is a correct supertest assertion?\n\n```javascript\n// Option A\nconst res = await request(app)\n  .get('/api/users')\n  .expect(200)\n  .expect('Content-Type', /json/);\n\n// Option B\nconst res = request(app)\n  .get('/api/users')\n  .expect(200);\n```",
      question_type: "multiple_choice",
      options: [
        "Only Option A — supertest requires await and can chain .expect() calls",
        "Only Option B — supertest doesn't need await",
        "Both are valid — supertest returns a thenable that can be awaited or not",
        "Neither — supertest uses .then() syntax only"
      ],
      correct_answer: "Only Option A — supertest requires await and can chain .expect() calls",
      explanation: "Supertest returns a promise-like object that must be awaited (or returned). Without await, the test completes before the request finishes and assertions never execute — similar to the unawaited promise anti-pattern. You can chain multiple .expect() calls for status codes, headers, and content type.",
      difficulty: "medium",
      order_index: 8,
    },
  ],
};

export default quiz;
