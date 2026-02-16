// ============================================================================
// Testing & TDD — Content
// ============================================================================

export const topic = {
  "name": "Testing & TDD",
  "slug": "testing-tdd",
  "description": "Write reliable backend tests with Jest and supertest — unit tests, integration tests, and test-driven development.",
  "estimated_time": 200,
  "order_index": 6
};

export const lessons = [
  {
    title: "Unit Testing with Jest",
    slug: "unit-testing-jest",
    summary: "Write and organize unit tests using Jest, with assertions, mocking, and test-driven development.",
    difficulty_level: "intermediate",
    estimated_time: 50,
    order_index: 1,
    key_points: [
      "Unit tests verify individual functions/modules in isolation",
      "Use describe/it blocks to organize tests logically",
      "Jest provides dozens of matchers: toBe, toEqual, toThrow, toContain, toMatch, and more",
      "Mocking isolates the unit under test from its dependencies via jest.fn(), jest.mock(), jest.spyOn()",
      "Async testing uses async/await, resolves/rejects matchers",
      "TDD cycle: Red → Green → Refactor drives design through tests",
      "Code coverage measures how much of your code is exercised by tests",
      "Test best practices: AAA pattern, descriptive naming, test one thing per test"
    ],
    content: `# Unit Testing with Jest

## What Is Unit Testing and Why It Matters

A **unit test** verifies that a single, isolated piece of code — usually a function, method, or class — works correctly. Unit tests are the foundation of software quality because they:

- **Catch bugs early**: find defects before they reach staging or production.
- **Enable refactoring**: change internals confidently when tests pass.
- **Serve as documentation**: tests describe what code is supposed to do.
- **Speed up development**: a fast feedback loop means less time debugging.
- **Reduce regression risk**: every bug fix backed by a test won't reappear.

In a real-world Node.js backend, unit tests cover business logic, utility functions, service layers, validators, and transformers — everything *except* actual I/O (databases, HTTP, file system), which is mocked.

---

## Jest Setup and Configuration

### Installing Jest for a Node.js ESM Project

\`\`\`bash
# Install Jest and ESM support
npm install --save-dev jest @jest/globals

# For TypeScript projects, also install:
npm install --save-dev ts-jest @types/jest
\`\`\`

### package.json Configuration

\`\`\`json
{
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest",
    "test:watch": "node --experimental-vm-modules node_modules/.bin/jest --watch",
    "test:coverage": "node --experimental-vm-modules node_modules/.bin/jest --coverage"
  }
}
\`\`\`

### jest.config.js

\`\`\`javascript
export default {
  // Use ESM-compatible transform
  transform: {},
  extensionsToTreatAsEsm: [],

  // Where to find tests
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/database/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test environment
  testEnvironment: 'node',

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
\`\`\`

---

## Test Structure: describe, it/test, expect

Every Jest test file follows a consistent structure:

\`\`\`javascript
import { describe, it, expect } from '@jest/globals';
import { calculateDiscount, validateEmail, formatCurrency } from './utils.js';

// Top-level describe groups related tests
describe('calculateDiscount', () => {

  // Nested describe for sub-scenarios
  describe('with valid inputs', () => {
    it('applies percentage discount correctly', () => {
      expect(calculateDiscount(100, 20)).toBe(80);
    });

    it('returns original price for 0% discount', () => {
      expect(calculateDiscount(100, 0)).toBe(100);
    });

    it('returns 0 for 100% discount', () => {
      expect(calculateDiscount(100, 100)).toBe(0);
    });

    it('handles decimal prices', () => {
      expect(calculateDiscount(49.99, 10)).toBeCloseTo(44.991);
    });
  });

  describe('with invalid inputs', () => {
    it('throws for negative discount', () => {
      expect(() => calculateDiscount(100, -10)).toThrow('Invalid discount');
    });

    it('throws for discount over 100%', () => {
      expect(() => calculateDiscount(100, 110)).toThrow('Invalid discount');
    });

    it('throws for negative price', () => {
      expect(() => calculateDiscount(-50, 10)).toThrow('Invalid price');
    });
  });
});
\`\`\`

**Key conventions:**
- \`describe\` = group of related tests (can be nested)
- \`it\` or \`test\` = a single test case (they are aliases)
- \`expect\` = creates an assertion (what you're checking)
- Use descriptive names: \`it('returns 404 when user not found')\`

---

## Jest Matchers — The Complete Guide

Matchers are methods that let you validate values in different ways. Jest ships with a rich set of built-in matchers.

### Equality Matchers

\`\`\`javascript
// Strict equality (===), use for primitives
expect(2 + 2).toBe(4);
expect('hello').toBe('hello');
expect(true).toBe(true);

// Deep equality, use for objects and arrays
expect({ name: 'Alice', age: 30 }).toEqual({ name: 'Alice', age: 30 });
expect([1, 2, 3]).toEqual([1, 2, 3]);

// Partial matching — object contains at least these fields
expect(user).toEqual(expect.objectContaining({
  name: 'Alice',
  role: 'admin'
}));

// Strict equality check — also checks undefined properties
expect({ a: 1 }).toStrictEqual({ a: 1 });
// This FAILS with toStrictEqual:
expect({ a: 1, b: undefined }).not.toStrictEqual({ a: 1 });
\`\`\`

### Truthiness Matchers

\`\`\`javascript
expect(null).toBeNull();           // === null
expect(undefined).toBeUndefined(); // === undefined
expect('hello').toBeDefined();     // !== undefined
expect(1).toBeTruthy();            // truthy value
expect(0).toBeFalsy();             // falsy value
expect('').toBeFalsy();
expect(null).toBeFalsy();
\`\`\`

### Number Matchers

\`\`\`javascript
expect(10).toBeGreaterThan(9);
expect(10).toBeGreaterThanOrEqual(10);
expect(10).toBeLessThan(11);
expect(10).toBeLessThanOrEqual(10);

// For floating point — avoids rounding errors
expect(0.1 + 0.2).toBeCloseTo(0.3);        // default: 5 decimal places
expect(0.1 + 0.2).toBeCloseTo(0.3, 10);    // 10 decimal places
\`\`\`

### String Matchers

\`\`\`javascript
expect('Hello, World!').toMatch(/world/i);         // regex match
expect('team@company.com').toMatch(/^[^@]+@[^@]+$/); // email-ish pattern
expect('Hello, World!').toContain('World');         // substring check
expect('error: file not found').toMatch('file not found'); // string pattern
\`\`\`

### Array and Iterable Matchers

\`\`\`javascript
const fruits = ['apple', 'banana', 'cherry'];

expect(fruits).toContain('banana');          // array includes item
expect(fruits).toHaveLength(3);              // array length

// Array containing specific items (order doesn't matter)
expect(fruits).toEqual(expect.arrayContaining(['cherry', 'apple']));

// Array of objects
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];
expect(users).toContainEqual({ id: 1, name: 'Alice' });
\`\`\`

### Exception Matchers

\`\`\`javascript
// Must wrap in a function to catch the throw
expect(() => {
  throw new Error('Invalid input');
}).toThrow();

expect(() => {
  throw new Error('Invalid input');
}).toThrow('Invalid input');          // match by message string

expect(() => {
  throw new Error('Invalid input');
}).toThrow(/invalid/i);               // match by regex

expect(() => {
  throw new TypeError('Expected string');
}).toThrow(TypeError);                // match by error class
\`\`\`

### Mock / Function Matchers

\`\`\`javascript
const mockFn = jest.fn();
mockFn('hello', 42);
mockFn('world');

expect(mockFn).toHaveBeenCalled();                    // called at all
expect(mockFn).toHaveBeenCalledTimes(2);               // called exactly N times
expect(mockFn).toHaveBeenCalledWith('hello', 42);      // called with specific args
expect(mockFn).toHaveBeenLastCalledWith('world');       // last call args
expect(mockFn).toHaveBeenNthCalledWith(1, 'hello', 42); // Nth call args
expect(mockFn).toHaveReturnedWith(undefined);          // returned specific value
\`\`\`

### The \`.not\` Modifier

Every matcher can be negated with \`.not\`:

\`\`\`javascript
expect(5).not.toBe(3);
expect([1, 2, 3]).not.toContain(4);
expect(() => safeFn()).not.toThrow();
expect(result).not.toBeNull();
\`\`\`

---

## Setup and Teardown

Jest provides lifecycle hooks that run at specific times around your tests:

\`\`\`javascript
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

describe('UserService', () => {

  // Runs ONCE before all tests in this describe block
  beforeAll(async () => {
    await database.connect();
    console.log('Database connected');
  });

  // Runs ONCE after all tests in this describe block
  afterAll(async () => {
    await database.disconnect();
    console.log('Database disconnected');
  });

  // Runs before EACH test
  beforeEach(async () => {
    await database.beginTransaction();
    // Fresh state for every test
  });

  // Runs after EACH test
  afterEach(async () => {
    await database.rollbackTransaction();
    jest.restoreAllMocks();  // Clean up spies/mocks
  });

  it('creates a user', async () => {
    const user = await userService.create({ name: 'Alice' });
    expect(user.id).toBeDefined();
  });

  it('lists all users', async () => {
    await userService.create({ name: 'Bob' });
    const users = await userService.listAll();
    expect(users).toHaveLength(1);
  });
});
\`\`\`

**Scoping rules:**
- Hooks in a \`describe\` block apply only to tests inside that block
- Nested \`describe\` blocks inherit parent hooks AND can add their own
- Execution order: outer beforeAll → outer beforeEach → inner beforeEach → test → inner afterEach → outer afterEach → outer afterAll

---

## Mocking — The Complete Guide

Mocking replaces real dependencies with controlled substitutes so you can test code in **isolation**. Jest provides three main mocking tools:

### jest.fn() — Create a Mock Function

\`\`\`javascript
import { jest, describe, it, expect } from '@jest/globals';

// Create a standalone mock function
const mockCallback = jest.fn();

// You can configure return values
mockCallback.mockReturnValue(42);
expect(mockCallback()).toBe(42);

// Return different values on successive calls
mockCallback
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

expect(mockCallback()).toBe('first');
expect(mockCallback()).toBe('second');
expect(mockCallback()).toBe('default');

// Mock async functions
const mockFetch = jest.fn().mockResolvedValue({ data: [1, 2, 3] });
const result = await mockFetch();
expect(result.data).toHaveLength(3);

// Mock rejected promises
const mockFailure = jest.fn().mockRejectedValue(new Error('Network error'));
await expect(mockFailure()).rejects.toThrow('Network error');

// Custom implementation
const mockAdd = jest.fn((a, b) => a + b);
expect(mockAdd(2, 3)).toBe(5);
\`\`\`

### jest.mock() — Mock Entire Modules

\`\`\`javascript
import { jest } from '@jest/globals';

// Mock a module — all exports become jest.fn()
jest.mock('./emailService.js');
import { sendEmail, sendBulkEmail } from './emailService.js';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();  // Reset call counts between tests
  });

  it('sends welcome email on signup', async () => {
    sendEmail.mockResolvedValue({ messageId: 'abc123' });

    await notificationService.onUserSignup(newUser);

    expect(sendEmail).toHaveBeenCalledWith({
      to: newUser.email,
      subject: 'Welcome!',
      template: 'welcome',
      data: { name: newUser.name }
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
\`\`\`

### jest.spyOn() — Spy on Existing Methods

\`\`\`javascript
import { jest, describe, it, expect } from '@jest/globals';

const calculator = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
};

describe('spyOn example', () => {
  it('spies on add without changing behavior', () => {
    const spy = jest.spyOn(calculator, 'add');

    const result = calculator.add(2, 3);

    expect(result).toBe(5);                          // original behavior preserved
    expect(spy).toHaveBeenCalledWith(2, 3);           // but we tracked the call
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();  // Restore original implementation
  });

  it('replaces implementation with spy', () => {
    const spy = jest.spyOn(calculator, 'multiply')
      .mockReturnValue(999);

    expect(calculator.multiply(2, 3)).toBe(999);     // overridden!
    expect(spy).toHaveBeenCalledWith(2, 3);

    spy.mockRestore();
    expect(calculator.multiply(2, 3)).toBe(6);       // restored
  });
});
\`\`\`

### Mocking Timers

\`\`\`javascript
describe('Timer functions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls callback after 1 second', () => {
    const callback = jest.fn();
    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles intervals', () => {
    const callback = jest.fn();
    setInterval(callback, 500);

    jest.advanceTimersByTime(1500);

    expect(callback).toHaveBeenCalledTimes(3);
  });
});
\`\`\`

### Mocking External Dependencies (e.g., fetch, axios)

\`\`\`javascript
// weatherService.js — the code we're testing
export async function getWeather(city) {
  const response = await fetch(\\\`https://api.weather.com/v1/\\\${city}\\\`);
  if (!response.ok) throw new Error('City not found');
  const data = await response.json();
  return { temp: data.temperature, description: data.description };
}

// weatherService.test.js
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getWeather } from './weatherService.js';

describe('getWeather', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('returns formatted weather data', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ temperature: 72, description: 'Sunny' }),
    });

    const weather = await getWeather('seattle');

    expect(weather).toEqual({ temp: 72, description: 'Sunny' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.weather.com/v1/seattle'
    );
  });

  it('throws when city not found', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(getWeather('nonexistent'))
      .rejects.toThrow('City not found');
  });
});
\`\`\`

---

## Testing Async Code

Modern backends are async-heavy. Jest supports async testing natively:

\`\`\`javascript
describe('Async testing patterns', () => {

  // Pattern 1: async/await (recommended)
  it('fetches user data', async () => {
    const user = await userService.findById(1);
    expect(user.name).toBe('Alice');
  });

  // Pattern 2: resolves/rejects matchers
  it('resolves with user data', async () => {
    await expect(userService.findById(1))
      .resolves.toEqual(expect.objectContaining({ name: 'Alice' }));
  });

  it('rejects for missing user', async () => {
    await expect(userService.findById(999))
      .rejects.toThrow('User not found');
  });

  // Pattern 3: returning a promise (older style)
  it('works with returned promises', () => {
    return userService.findById(1).then(user => {
      expect(user.name).toBe('Alice');
    });
  });

  // IMPORTANT: always await or return promises!
  // This test ALWAYS PASSES (BUG!) — the assertion runs after test completes
  it('BROKEN — never do this', () => {
    userService.findById(1).then(user => {
      expect(user.name).toBe('wrong name'); // never checked!
    });
    // Fix: add "return" or use async/await
  });
});
\`\`\`

---

## TDD Cycle — Red, Green, Refactor

**Test-Driven Development (TDD)** means writing the test *before* the implementation. The cycle:

1. **RED**: Write a test that fails (because the feature doesn't exist yet)
2. **GREEN**: Write the *minimum* code to make the test pass
3. **REFACTOR**: Clean up the code while keeping all tests green

### Step-by-Step TDD Example: Building a Password Validator

\`\`\`javascript
// ── STEP 1: RED — First failing test ────────────────────────
describe('validatePassword', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const result = validatePassword('short');
    expect(result).toEqual({
      valid: false,
      errors: ['Must be at least 8 characters']
    });
  });
});
// ReferenceError: validatePassword is not defined

// ── STEP 2: GREEN — Minimal implementation ──────────────────
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) {
    errors.push('Must be at least 8 characters');
  }
  return { valid: errors.length === 0, errors };
}
// Test passes!

// ── STEP 3: RED — Add next test ─────────────────────────────
it('rejects passwords without uppercase letters', () => {
  const result = validatePassword('lowercase1');
  expect(result).toEqual({
    valid: false,
    errors: ['Must contain at least one uppercase letter']
  });
});
// Fails — no uppercase check yet

// ── STEP 4: GREEN — Add uppercase check ─────────────────────
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) {
    errors.push('Must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }
  return { valid: errors.length === 0, errors };
}
// Both tests pass!

// ── STEP 5: RED — Add number requirement ────────────────────
it('rejects passwords without numbers', () => {
  const result = validatePassword('NoNumbers');
  expect(result).toEqual({
    valid: false,
    errors: ['Must contain at least one number']
  });
});
// Fails

// ── STEP 6: GREEN — Add number check ───────────────────────
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('Must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain at least one uppercase letter');
  if (!/\\d/.test(password)) errors.push('Must contain at least one number');
  return { valid: errors.length === 0, errors };
}
// All tests pass!

// ── STEP 7: REFACTOR — Extract rules into config ───────────
const PASSWORD_RULES = [
  { test: pw => pw.length >= 8,    message: 'Must be at least 8 characters' },
  { test: pw => /[A-Z]/.test(pw),  message: 'Must contain at least one uppercase letter' },
  { test: pw => /\\d/.test(pw),     message: 'Must contain at least one number' },
  { test: pw => /[!@#$%]/.test(pw), message: 'Must contain a special character (!@#$%)' },
];

function validatePassword(password) {
  const errors = PASSWORD_RULES
    .filter(rule => !rule.test(password))
    .map(rule => rule.message);
  return { valid: errors.length === 0, errors };
}
// All tests still pass — refactoring successful!
\`\`\`

---

## Code Coverage

Code coverage measures how much of your source code is exercised by tests.

\`\`\`bash
# Generate coverage report
npx jest --coverage

# Output example:
# --------------|---------|----------|---------|---------|
# File          | % Stmts | % Branch | % Funcs | % Lines |
# --------------|---------|----------|---------|---------|
# utils.js      |   95.2  |    88.9  |   100   |   94.7  |
# userService.js|   82.1  |    75.0  |   90.0  |   81.3  |
# --------------|---------|----------|---------|---------|
\`\`\`

**Coverage types:**
- **Statement**: was each statement executed?
- **Branch**: was each if/else path taken?
- **Function**: was each function called?
- **Line**: was each line reached?

**Setting thresholds in jest.config.js:**

\`\`\`javascript
export default {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Per-file thresholds
    './src/services/': {
      branches: 90,
      lines: 90,
    },
  },
};
\`\`\`

> **Warning:** 100% coverage does NOT mean bug-free code. Coverage tells you what code *ran*, not whether the assertions are correct. A test that calls a function but never asserts on the result achieves coverage but catches zero bugs.

---

## Testing Best Practices

### The AAA Pattern (Arrange-Act-Assert)

\`\`\`javascript
it('calculates total with tax', () => {
  // ARRANGE — set up test data and dependencies
  const cart = new ShoppingCart();
  cart.addItem({ name: 'Widget', price: 10.00, qty: 3 });
  const taxRate = 0.08;

  // ACT — execute the code under test
  const total = cart.calculateTotal(taxRate);

  // ASSERT — verify the result
  expect(total).toBeCloseTo(32.40);
});
\`\`\`

### Test Naming Conventions

\`\`\`javascript
// Good — describes behavior
it('returns 404 when user does not exist')
it('throws ValidationError for invalid email format')
it('hashes password before saving to database')
it('sends welcome email after successful registration')

// Bad — vague, implementation-focused
it('test user')
it('works correctly')
it('handles the case')
it('calls the function')
\`\`\`

### What to Test and What NOT to Test

**DO TEST:**
- Business logic and calculations
- Input validation and edge cases
- Error handling paths
- State transitions
- Public API contracts
- Boundary conditions (empty arrays, null, 0, max values)

**DON'T TEST:**
- Third-party library internals (trust their tests)
- Simple getters/setters with no logic
- Framework configuration
- Private implementation details (test behavior, not structure)
- Console.log statements

### Common Testing Anti-Patterns

\`\`\`javascript
// Anti-pattern 1: Testing implementation details
it('calls internal _processData method', () => {
  const spy = jest.spyOn(service, '_processData');
  service.handle(input);
  expect(spy).toHaveBeenCalled(); // Brittle — breaks if you rename the method
});
// Fix: Test the observable output instead
it('returns processed result', () => {
  const result = service.handle(input);
  expect(result).toEqual(expectedOutput);
});

// Anti-pattern 2: Multiple assertions testing unrelated things
it('does everything', async () => {
  expect(await service.create(data)).toBeDefined();
  expect(await service.list()).toHaveLength(1);
  expect(await service.delete(1)).toBe(true);
  expect(await service.list()).toHaveLength(0);
});
// Fix: One logical concept per test

// Anti-pattern 3: Tests that depend on execution order
let userId;
it('creates user', async () => { userId = await create(); });
it('deletes user', async () => { await deleteUser(userId); }); // Fails if run alone!
// Fix: Each test arranges its own data in beforeEach

// Anti-pattern 4: Ignoring the error path
it('creates a user', async () => {
  const user = await createUser(validData);
  expect(user.id).toBeDefined();
});
// Fix: Also test what happens with invalid data, missing fields, duplicates

// Anti-pattern 5: Snapshot overuse
it('matches snapshot', () => {
  expect(complexObject).toMatchSnapshot(); // Easy to auto-update, easy to miss regressions
});
// Fix: Use targeted assertions for important fields
\`\`\`

### Parameterized Tests with \`it.each\`

\`\`\`javascript
describe('validateEmail', () => {
  it.each([
    ['user@example.com',     true,  'standard email'],
    ['user+tag@domain.org',  true,  'email with plus tag'],
    ['invalid-email',        false, 'missing @ symbol'],
    ['user@.com',            false, 'missing domain name'],
    ['@domain.com',          false, 'missing local part'],
    ['a@b.co',               true,  'minimal valid email'],
    ['',                     false, 'empty string'],
  ])('validates "%s" as %s (%s)', (email, expected, _description) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
\`\`\`
`,
  },
  {
    title: "Integration Testing & Test Strategy",
    slug: "integration-testing-strategy",
    summary: "Test how components work together — Express routes with supertest, database testing, middleware testing, and building a comprehensive test strategy.",
    difficulty_level: "intermediate",
    estimated_time: 50,
    order_index: 2,
    key_points: [
      "Integration tests verify that multiple units work correctly together",
      "The testing pyramid: many unit tests, fewer integration tests, fewest E2E tests",
      "Supertest sends HTTP requests to Express apps without starting a real server",
      "Database testing uses test databases, transactions, and cleanup strategies",
      "Middleware can and should be tested in isolation and in route context",
      "CI/CD pipelines should run tests automatically on every push",
      "Snapshot testing captures expected output and detects regressions",
      "Test organization follows a consistent folder/naming convention"
    ],
    content: `# Integration Testing & Test Strategy

## Integration vs Unit vs E2E Tests

| Aspect | Unit Tests | Integration Tests | E2E Tests |
|--------|-----------|------------------|-----------|
| **Scope** | One function/class | Multiple modules together | Entire application flow |
| **Dependencies** | All mocked | Some real, some mocked | All real |
| **Speed** | Very fast (ms) | Medium (100ms-2s) | Slow (seconds-minutes) |
| **Reliability** | Very stable | Mostly stable | Flaky if not careful |
| **Debugging** | Easy (small scope) | Moderate | Hard (large surface) |
| **Examples** | Test a validator function | Test route + middleware + DB | User signs up, logs in, creates post |

\`\`\`
Unit Test Example:
  Input -> calculateTax(100, 0.08) -> Output: 8.00
  Dependencies: NONE (mocked if any)

Integration Test Example:
  POST /api/users -> auth middleware -> validation -> database INSERT -> response
  Dependencies: real Express, real middleware, real/test database

E2E Test Example:
  Browser opens app -> fills registration form -> submits -> sees dashboard
  Dependencies: running server, real database, real browser
\`\`\`

---

## The Testing Pyramid

\`\`\`
        /  E2E  \\           <- Few: slow, expensive, but high confidence
       /----------\\
      / Integration \\       <- Some: test module boundaries
     /----------------\\
    /    Unit Tests     \\   <- Many: fast, cheap, test logic thoroughly
   /____________________\\
\`\`\`

**Recommended test distribution:**
- **70% Unit tests** — fast, reliable, test all business logic
- **20% Integration tests** — verify modules work together (routes, DB queries, services)
- **10% E2E tests** — critical user flows only (signup, checkout, etc.)

**Anti-pattern: The Testing Ice Cream Cone** (inverted pyramid)

Teams with an inverted pyramid spend most time debugging flaky E2E tests and relying on manual QA instead of catching bugs with fast unit tests. Always aim for a proper pyramid shape.

---

## Testing Express Routes with Supertest

Supertest lets you make HTTP requests to your Express app without starting a real server. It hooks directly into Express's request handling.

### Setup

\`\`\`bash
npm install --save-dev supertest
\`\`\`

**Important: Export your Express app separately from \`server.listen()\`:**

\`\`\`javascript
// app.js — creates and configures Express (export this for tests)
import express from 'express';
import userRoutes from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

export default app;

// server.js — starts the server (don't import this in tests)
import app from './app.js';
app.listen(3000, () => console.log('Server running'));
\`\`\`

### Writing Comprehensive Route Tests

\`\`\`javascript
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../app.js';
import pool from '../config/database.js';

describe('User API Routes', () => {
  let authToken;

  beforeAll(async () => {
    // Clean up test data before suite runs
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@test.com']);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@test.com']);
    await pool.end();
  });

  describe('POST /api/users/register', () => {
    it('registers a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'newuser@test.com',
          password: 'SecurePass123!'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toEqual(expect.objectContaining({
        user: expect.objectContaining({
          id: expect.any(Number),
          name: 'Test User',
          email: 'newuser@test.com'
        }),
        token: expect.any(String)
      }));
      // Password should NEVER appear in response
      expect(res.body.user.password).toBeUndefined();
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ email: 'incomplete@test.com' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'password' })
        ])
      );
    });

    it('returns 409 for duplicate email', async () => {
      await request(app)
        .post('/api/users/register')
        .send({ name: 'User A', email: 'dupe@test.com', password: 'Pass1234!' });

      const res = await request(app)
        .post('/api/users/register')
        .send({ name: 'User B', email: 'dupe@test.com', password: 'Pass5678!' })
        .expect(409);

      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/users/login', () => {
    it('returns token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'newuser@test.com', password: 'SecurePass123!' })
        .expect(200);

      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it('returns 401 for wrong password', async () => {
      await request(app)
        .post('/api/users/login')
        .send({ email: 'newuser@test.com', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('GET /api/users/profile (protected route)', () => {
    it('returns profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', \\\`Bearer \\\${authToken}\\\`)
        .expect(200);

      expect(res.body.name).toBe('Test User');
    });

    it('returns 401 without token', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
\`\`\`

---

## Database Testing Strategies

Testing code that interacts with databases requires special techniques to keep tests isolated, repeatable, and fast.

### Strategy 1: Separate Test Database

\`\`\`javascript
// config/database.js
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL    // Separate test DB
    : process.env.DATABASE_URL
});

export default pool;
\`\`\`

\`\`\`bash
# .env.test
TEST_DATABASE_URL=postgresql://localhost:5432/myapp_test
NODE_ENV=test
\`\`\`

### Strategy 2: Transaction Rollback (Recommended for Speed)

Wrap each test in a transaction and roll it back afterwards. Tests never actually persist data, so they're completely isolated from each other.

\`\`\`javascript
import pool from '../config/database.js';

describe('OrderRepository', () => {
  let client;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query('BEGIN');  // Start transaction
  });

  afterEach(async () => {
    await client.query('ROLLBACK');  // Undo all changes
    client.release();
  });

  it('creates an order', async () => {
    const result = await client.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
      [1, 99.99]
    );
    expect(result.rows[0].total).toBe('99.99');
    expect(result.rows[0].id).toBeDefined();
    // After test: ROLLBACK undoes this insert automatically
  });

  it('starts fresh — unaffected by previous test', async () => {
    const result = await client.query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = $1', [1]
    );
    // Previous test's insert was rolled back
    expect(parseInt(result.rows[0].count)).toBe(0);
  });
});
\`\`\`

### Strategy 3: Cleanup Helpers

\`\`\`javascript
// test/helpers/db.js
import pool from '../../src/config/database.js';

export async function cleanDatabase() {
  // Delete in reverse foreign-key order
  await pool.query('DELETE FROM order_items');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@test.com']);
}

export async function seedTestData() {
  const userResult = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
    ['Test User', 'test@test.com', '$2b$10$hashedpassword']
  );
  return { userId: userResult.rows[0].id };
}

// In test files
import { cleanDatabase, seedTestData } from '../helpers/db.js';

describe('Order API', () => {
  let testData;

  beforeAll(async () => {
    await cleanDatabase();
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanDatabase();
    await pool.end();
  });

  // Tests use testData.userId...
});
\`\`\`

---

## Testing Middleware

Middleware functions sit in the request pipeline and can be tested both in isolation and within a route context.

### Testing Middleware in Isolation

\`\`\`javascript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authMiddleware } from '../middleware/auth.js';

describe('authMiddleware', () => {
  const createMockReq = (headers = {}) => ({
    headers,
    user: null,
  });

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  let mockNext;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  it('calls next() with valid token', async () => {
    const validToken = generateTestToken({ id: 1, role: 'user' });
    const req = createMockReq({ authorization: \\\`Bearer \\\${validToken}\\\` });
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();  // No error
    expect(req.user).toEqual(expect.objectContaining({ id: 1 }));
  });

  it('returns 401 when no token provided', async () => {
    const req = createMockReq({});
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 for expired token', async () => {
    const expiredToken = generateTestToken({ id: 1 }, { expiresIn: '0s' });
    const req = createMockReq({ authorization: \\\`Bearer \\\${expiredToken}\\\` });
    const res = createMockRes();

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
\`\`\`

### Testing Rate Limiting Middleware

\`\`\`javascript
import request from 'supertest';
import express from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';

describe('rateLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(rateLimiter({ windowMs: 1000, maxRequests: 3 }));
    app.get('/test', (req, res) => res.json({ ok: true }));
  });

  it('allows requests within the limit', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).get('/test').expect(200);
    }
  });

  it('blocks requests that exceed the limit', async () => {
    // Use up the limit
    for (let i = 0; i < 3; i++) {
      await request(app).get('/test');
    }

    // Next request should be rate-limited
    const res = await request(app).get('/test').expect(429);
    expect(res.body.message).toMatch(/too many requests/i);
  });
});
\`\`\`

---

## Test Organization and File Structure

A well-organized test structure makes tests easy to find and maintain:

\`\`\`
project/
  src/
    services/
      userService.js
      userService.test.js          <- Co-located unit tests
      orderService.js
      orderService.test.js
    routes/
      users.js
      orders.js
    middleware/
      auth.js
      auth.test.js                 <- Middleware unit tests
      validation.js
    utils/
      helpers.js
      helpers.test.js
  __tests__/                       <- Integration / route tests
    routes/
      users.test.js
      orders.test.js
    helpers/
      db.js                        <- Test database utilities
      auth.js                      <- Token generation helpers
      fixtures.js                  <- Shared test data
  jest.config.js
  package.json
\`\`\`

**Naming conventions:**
- \`*.test.js\` — test files (Jest finds these automatically)
- \`*.spec.js\` — alternative convention (identical behavior)
- \`__tests__/\` — directory convention for grouping tests
- \`__mocks__/\` — manual mock directory (Jest convention)

**Recommended test file internal structure:**

\`\`\`javascript
// 1. Imports
import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserService } from './userService.js';

// 2. Describe block per class/module
describe('UserService', () => {

  // 3. Describe block per method
  describe('create', () => {
    describe('with valid data', () => { /* happy path tests */ });
    describe('with invalid data', () => { /* error case tests */ });
    describe('edge cases', () => { /* boundary/edge tests */ });
  });

  describe('findById', () => {
    it('returns user when found', () => { /* ... */ });
    it('throws NotFoundError when user does not exist', () => { /* ... */ });
  });
});
\`\`\`

---

## CI/CD Test Integration

Tests should run automatically on every push and pull request to catch regressions before they reach production.

### GitHub Actions Example

\`\`\`yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: myapp_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://testuser:testpass@localhost:5432/myapp_test
      JWT_SECRET: test-secret-key
      NODE_ENV: test

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run db:migrate
      - run: npm test -- --coverage --ci --forceExit

      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        if: always()
\`\`\`

### npm Scripts for Testing Workflows

\`\`\`json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest",
    "test:watch": "npm test -- --watch",
    "test:coverage": "npm test -- --coverage",
    "test:ci": "npm test -- --ci --coverage --forceExit",
    "test:unit": "npm test -- --testPathPattern='src/.*\\\\\\\\.test\\\\\\\\.js$'",
    "test:integration": "npm test -- --testPathPattern='__tests__/.*\\\\\\\\.test\\\\\\\\.js$'",
    "pretest": "npm run lint"
  }
}
\`\`\`

---

## Snapshot Testing

Snapshot testing captures the output of a function and saves it to a file. Future runs compare against this saved "snapshot" to detect unintended changes.

\`\`\`javascript
describe('API Response Snapshots', () => {
  it('matches the user response shape', async () => {
    const user = await userService.getProfile(1);

    // First run: creates __snapshots__/user.test.js.snap
    // Future runs: compares against saved snapshot
    expect(user).toMatchSnapshot({
      id: expect.any(Number),            // Allow any number
      createdAt: expect.any(String),     // Allow any date string
    });
  });

  // Inline snapshots — stored right in the test file
  it('formats error response correctly', () => {
    const error = formatApiError(new ValidationError('Invalid email'));

    expect(error).toMatchInlineSnapshot(\\\`
      {
        "code": "VALIDATION_ERROR",
        "message": "Invalid email",
        "status": 400,
      }
    \\\`);
  });
});
\`\`\`

**When to use snapshots:**
- API response shapes (detect accidental breaking changes)
- Serialized configuration objects
- Error message formatting

**When NOT to use snapshots:**
- Large, complex objects (hard to review diffs)
- Frequently changing data (constant snapshot updates)
- As a lazy substitute for targeted assertions

**Updating snapshots after intentional changes:**

\`\`\`bash
npx jest --updateSnapshot   # or: npx jest -u
\`\`\`

---

## Property-Based Testing Concepts

Traditional tests check specific examples you thought of. Property-based testing generates *hundreds of random inputs* and verifies that certain properties always hold true — finding edge cases you'd never write manually.

\`\`\`javascript
// Using the fast-check library
import fc from 'fast-check';

describe('Property-based testing', () => {

  // Property: sorting is idempotent (sorting twice = sorting once)
  it('sort is idempotent', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const sortedTwice = [...sorted].sort((a, b) => a - b);
        expect(sorted).toEqual(sortedTwice);
      })
    );
  });

  // Property: roundtrip — encode then decode gives back original
  it('JSON roundtrip preserves data', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          age: fc.integer({ min: 0, max: 150 }),
          active: fc.boolean()
        }),
        (obj) => {
          expect(JSON.parse(JSON.stringify(obj))).toEqual(obj);
        }
      )
    );
  });

  // Property: reverse(reverse(x)) === x
  it('double reverse returns original array', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const doubleReversed = [...arr].reverse().reverse();
        expect(doubleReversed).toEqual(arr);
      })
    );
  });
});
\`\`\`

Property-based testing excels at finding edge cases you wouldn't think to write manually — empty strings, very large numbers, special characters, zero-length arrays, and boundary conditions.
`,
  },
];
