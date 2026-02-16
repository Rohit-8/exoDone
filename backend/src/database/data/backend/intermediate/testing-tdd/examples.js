// ============================================================================
// Testing & TDD — Code Examples
// ============================================================================

const examples = {
  'unit-testing-jest': [
    {
      title: "Complete Unit Test Suite for a Service Layer",
      description: "Test a UserService class with mocked repository, covering happy path, error handling, and edge cases using the AAA pattern.",
      language: "javascript",
      code: `import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── The Service Under Test ──────────────────────────────────
class UserService {
  constructor(userRepo, emailService, logger) {
    this.userRepo = userRepo;
    this.emailService = emailService;
    this.logger = logger;
  }

  async createUser({ name, email, password }) {
    // Validate input
    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check for existing user
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error('Email already in use');
    }

    // Create user and send welcome email
    const user = await this.userRepo.create({ name, email, password });
    await this.emailService.sendWelcome(user.email, user.name);
    this.logger.info(\`User created: \${user.id}\`);

    return { id: user.id, name: user.name, email: user.email };
  }

  async getUserById(id) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }
}

// ── The Tests ───────────────────────────────────────────────
describe('UserService', () => {
  let userService;
  let mockRepo;
  let mockEmail;
  let mockLogger;

  beforeEach(() => {
    // ARRANGE — fresh mocks for every test
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    mockEmail = {
      sendWelcome: jest.fn().mockResolvedValue(true),
    };
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    userService = new UserService(mockRepo, mockEmail, mockLogger);
  });

  describe('createUser', () => {
    const validInput = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'SecurePass123',
    };

    it('creates user and sends welcome email', async () => {
      // ARRANGE
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 1, name: 'Alice', email: 'alice@example.com'
      });

      // ACT
      const result = await userService.createUser(validInput);

      // ASSERT
      expect(result).toEqual({
        id: 1, name: 'Alice', email: 'alice@example.com'
      });
      expect(mockRepo.findByEmail).toHaveBeenCalledWith('alice@example.com');
      expect(mockRepo.create).toHaveBeenCalledWith(validInput);
      expect(mockEmail.sendWelcome).toHaveBeenCalledWith(
        'alice@example.com', 'Alice'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('User created: 1');
    });

    it('throws when email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: 99, email: 'alice@example.com' });

      await expect(userService.createUser(validInput))
        .rejects.toThrow('Email already in use');

      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(mockEmail.sendWelcome).not.toHaveBeenCalled();
    });

    it('throws when required fields are missing', async () => {
      await expect(userService.createUser({ name: '', email: '', password: '' }))
        .rejects.toThrow('All fields are required');
    });

    it('throws when password is too short', async () => {
      await expect(userService.createUser({ ...validInput, password: 'short' }))
        .rejects.toThrow('Password must be at least 8 characters');
    });

    it('does not expose password in returned object', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 1, name: 'Alice', email: 'alice@example.com'
      });

      const result = await userService.createUser(validInput);

      expect(result.password).toBeUndefined();
      expect(result.passwordHash).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      const fakeUser = { id: 1, name: 'Alice', email: 'alice@example.com' };
      mockRepo.findById.mockResolvedValue(fakeUser);

      const user = await userService.getUserById(1);

      expect(user).toEqual(fakeUser);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
    });

    it('throws when user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(userService.getUserById(999))
        .rejects.toThrow('User not found');
    });
  });
});`,
      explanation: "This example demonstrates a complete unit test suite using dependency injection and mocking. The UserService receives its dependencies (repo, email, logger) through the constructor, making them easy to mock. Each test follows the AAA pattern (Arrange-Act-Assert), tests one behavior, and verifies both the return value and the side effects (function calls).",
      order_index: 1,
    },
    {
      title: "TDD Walkthrough: Building a Shopping Cart",
      description: "Step-by-step TDD example building a ShoppingCart class — Red, Green, Refactor cycle demonstrated through progressive test-implementation pairs.",
      language: "javascript",
      code: `import { describe, it, expect, beforeEach } from '@jest/globals';

// ── Final Implementation (built step-by-step via TDD) ──────
class ShoppingCart {
  constructor(taxRate = 0) {
    this.items = [];
    this.taxRate = taxRate;
  }

  addItem(product, quantity = 1) {
    if (quantity <= 0) throw new Error('Quantity must be positive');
    if (product.price < 0) throw new Error('Price cannot be negative');

    const existing = this.items.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }
  }

  removeItem(productId) {
    const index = this.items.findIndex(item => item.product.id === productId);
    if (index === -1) throw new Error('Item not found in cart');
    this.items.splice(index, 1);
  }

  getSubtotal() {
    return this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity, 0
    );
  }

  getTotal() {
    const subtotal = this.getSubtotal();
    return Math.round((subtotal * (1 + this.taxRate)) * 100) / 100;
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  clear() {
    this.items = [];
  }
}

// ── Tests (written FIRST in TDD, before the implementation) ─
describe('ShoppingCart', () => {
  let cart;

  beforeEach(() => {
    cart = new ShoppingCart(0.08); // 8% tax
  });

  describe('addItem', () => {
    it('adds an item to empty cart', () => {
      cart.addItem({ id: 1, name: 'Widget', price: 9.99 });

      expect(cart.getItemCount()).toBe(1);
      expect(cart.getSubtotal()).toBeCloseTo(9.99);
    });

    it('adds multiple different items', () => {
      cart.addItem({ id: 1, name: 'Widget', price: 9.99 });
      cart.addItem({ id: 2, name: 'Gadget', price: 24.99 });

      expect(cart.getItemCount()).toBe(2);
      expect(cart.getSubtotal()).toBeCloseTo(34.98);
    });

    it('increases quantity when adding same product', () => {
      const widget = { id: 1, name: 'Widget', price: 9.99 };
      cart.addItem(widget, 2);
      cart.addItem(widget, 3);

      expect(cart.getItemCount()).toBe(5);
      expect(cart.getSubtotal()).toBeCloseTo(49.95);
    });

    it('throws for zero or negative quantity', () => {
      expect(() => cart.addItem({ id: 1, name: 'X', price: 5 }, 0))
        .toThrow('Quantity must be positive');
      expect(() => cart.addItem({ id: 1, name: 'X', price: 5 }, -1))
        .toThrow('Quantity must be positive');
    });

    it('throws for negative price', () => {
      expect(() => cart.addItem({ id: 1, name: 'X', price: -5 }))
        .toThrow('Price cannot be negative');
    });
  });

  describe('removeItem', () => {
    it('removes an existing item', () => {
      cart.addItem({ id: 1, name: 'Widget', price: 9.99 });
      cart.addItem({ id: 2, name: 'Gadget', price: 24.99 });
      cart.removeItem(1);

      expect(cart.getItemCount()).toBe(1);
      expect(cart.getSubtotal()).toBeCloseTo(24.99);
    });

    it('throws when removing item not in cart', () => {
      expect(() => cart.removeItem(999)).toThrow('Item not found in cart');
    });
  });

  describe('getTotal (with tax)', () => {
    it('calculates total with 8% tax', () => {
      cart.addItem({ id: 1, name: 'Widget', price: 100 });

      expect(cart.getTotal()).toBeCloseTo(108.00);
    });

    it('returns 0 for empty cart', () => {
      expect(cart.getTotal()).toBe(0);
    });
  });

  describe('clear', () => {
    it('empties the cart', () => {
      cart.addItem({ id: 1, name: 'Widget', price: 9.99 });
      cart.addItem({ id: 2, name: 'Gadget', price: 24.99 });
      cart.clear();

      expect(cart.getItemCount()).toBe(0);
      expect(cart.getTotal()).toBe(0);
    });
  });
});`,
      explanation: "This example shows how TDD produces a well-designed ShoppingCart class. In real TDD, you'd write one test at a time, run it (Red), implement just enough code (Green), then refactor. The final test suite covers: adding items, duplicate handling, quantity updates, removal, tax calculation, edge cases (negative quantities, empty cart), and the clear operation.",
      order_index: 2,
    },
    {
      title: "Mocking Modules, Timers, and External APIs",
      description: "Advanced mocking patterns: mock entire modules with jest.mock(), fake timers for scheduled tasks, and mock global fetch for API calls.",
      language: "javascript",
      code: `import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// ═══════════════════════════════════════════════════════════
// Example 1: Mocking an entire module (email service)
// ═══════════════════════════════════════════════════════════

// Suppose emailService.js exports: sendEmail, sendBulkEmail
jest.mock('./emailService.js', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-123' }),
  sendBulkEmail: jest.fn().mockResolvedValue({ sent: 5, failed: 0 }),
}));

import { sendEmail, sendBulkEmail } from './emailService.js';

describe('Module mocking', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls sendEmail with correct arguments', async () => {
    await sendEmail({ to: 'user@test.com', subject: 'Hello' });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@test.com',
      subject: 'Hello',
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════
// Example 2: Mocking timers for scheduled tasks
// ═══════════════════════════════════════════════════════════

class HealthChecker {
  constructor(checkFn) {
    this.checkFn = checkFn;
    this.intervalId = null;
    this.results = [];
  }

  start(intervalMs) {
    this.intervalId = setInterval(async () => {
      const result = await this.checkFn();
      this.results.push({ timestamp: Date.now(), status: result });
    }, intervalMs);
  }

  stop() {
    clearInterval(this.intervalId);
  }
}

describe('HealthChecker with fake timers', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('runs health check at specified intervals', () => {
    const mockCheck = jest.fn().mockResolvedValue('healthy');
    const checker = new HealthChecker(mockCheck);

    checker.start(5000); // every 5 seconds

    expect(mockCheck).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);
    expect(mockCheck).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(15000);
    expect(mockCheck).toHaveBeenCalledTimes(4); // 4 intervals total

    checker.stop();
  });

  it('stops checking when stop() is called', () => {
    const mockCheck = jest.fn().mockResolvedValue('healthy');
    const checker = new HealthChecker(mockCheck);

    checker.start(1000);
    jest.advanceTimersByTime(3000);
    expect(mockCheck).toHaveBeenCalledTimes(3);

    checker.stop();
    jest.advanceTimersByTime(5000);
    expect(mockCheck).toHaveBeenCalledTimes(3); // No more calls
  });
});

// ═══════════════════════════════════════════════════════════
// Example 3: Mocking global fetch for API testing
// ═══════════════════════════════════════════════════════════

class GitHubClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
  }

  async getUser(username) {
    const response = await fetch(
      \`\${this.baseUrl}/users/\${username}\`,
      { headers: { Authorization: \`Bearer \${this.token}\` } }
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error('User not found');
      throw new Error(\`GitHub API error: \${response.status}\`);
    }
    return response.json();
  }

  async getRepos(username) {
    const response = await fetch(
      \`\${this.baseUrl}/users/\${username}/repos\`
    );
    if (!response.ok) throw new Error('Failed to fetch repos');
    return response.json();
  }
}

describe('GitHubClient', () => {
  let client;

  beforeEach(() => {
    client = new GitHubClient('fake-token');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches user data with auth header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ login: 'octocat', id: 1 }),
    });

    const user = await client.getUser('octocat');

    expect(user).toEqual({ login: 'octocat', id: 1 });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/users/octocat',
      { headers: { Authorization: 'Bearer fake-token' } }
    );
  });

  it('throws User not found for 404', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(client.getUser('nonexistent'))
      .rejects.toThrow('User not found');
  });

  it('throws generic error for other HTTP errors', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });

    await expect(client.getUser('octocat'))
      .rejects.toThrow('GitHub API error: 500');
  });

  it('fetches repos for a user', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { name: 'repo-a', stars: 100 },
        { name: 'repo-b', stars: 50 },
      ],
    });

    const repos = await client.getRepos('octocat');

    expect(repos).toHaveLength(2);
    expect(repos[0].name).toBe('repo-a');
  });
});`,
      explanation: "Three advanced mocking patterns in one example: (1) jest.mock() replaces an entire module's exports with mock functions, useful when you don't want real emails to send. (2) jest.useFakeTimers() lets you control time — advance by any amount to test interval/timeout logic without waiting. (3) Mocking global.fetch lets you test HTTP client code without making real network requests, and you can simulate different response statuses.",
      order_index: 3,
    },
    {
      title: "Parameterized Tests and Matcher Deep Dive",
      description: "Use it.each for data-driven tests and see all Jest matchers in action — equality, truthiness, numbers, arrays, strings, exceptions, and custom matchers.",
      language: "javascript",
      code: `import { describe, it, expect } from '@jest/globals';

// ═══════════════════════════════════════════════════════════
// Parameterized Tests with it.each
// ═══════════════════════════════════════════════════════════

function parseStatusCode(code) {
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'redirect';
  if (code >= 400 && code < 500) return 'client_error';
  if (code >= 500 && code < 600) return 'server_error';
  return 'unknown';
}

describe('parseStatusCode — parameterized', () => {
  it.each([
    [200, 'success'],
    [201, 'success'],
    [299, 'success'],
    [301, 'redirect'],
    [404, 'client_error'],
    [422, 'client_error'],
    [500, 'server_error'],
    [503, 'server_error'],
    [100, 'unknown'],
    [600, 'unknown'],
  ])('parseStatusCode(%i) returns "%s"', (code, expected) => {
    expect(parseStatusCode(code)).toBe(expected);
  });
});

// Table syntax with named parameters
describe('Tax calculator — table syntax', () => {
  function calculateTax(income, bracket) {
    const rates = { low: 0.10, mid: 0.20, high: 0.30 };
    return Math.round(income * (rates[bracket] || 0) * 100) / 100;
  }

  it.each\`
    income    | bracket  | expected
    \${50000}  | ${'low'} | \${5000}
    \${50000}  | ${'mid'} | \${10000}
    \${50000}  | ${'high'}| \${15000}
    \${0}      | ${'low'} | \${0}
    \${100}    | ${'xxx'} | \${0}
  \`('calculates $expected tax on $income in $bracket bracket',
    ({ income, bracket, expected }) => {
      expect(calculateTax(income, bracket)).toBe(expected);
    }
  );
});

// ═══════════════════════════════════════════════════════════
// Matcher Deep Dive
// ═══════════════════════════════════════════════════════════

describe('Matcher showcase', () => {
  // -- Object matchers --
  it('uses objectContaining for partial match', () => {
    const response = {
      status: 'ok',
      data: { id: 42, name: 'Widget', createdAt: '2025-01-15' },
      meta: { page: 1, total: 100 }
    };

    expect(response).toEqual(expect.objectContaining({
      status: 'ok',
      data: expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
      }),
    }));
  });

  // -- Array matchers --
  it('uses arrayContaining to check subset', () => {
    const permissions = ['read', 'write', 'delete', 'admin'];

    expect(permissions).toEqual(
      expect.arrayContaining(['read', 'write'])
    );
    expect(permissions).not.toEqual(
      expect.arrayContaining(['superadmin'])
    );
  });

  // -- String matchers --
  it('uses toMatch and stringContaining', () => {
    const logLine = '[2025-01-15 10:30:00] ERROR: Connection timeout on db-primary';

    expect(logLine).toMatch(/ERROR/);
    expect(logLine).toMatch(/\\d{4}-\\d{2}-\\d{2}/);
    expect(logLine).toEqual(
      expect.stringContaining('Connection timeout')
    );
  });

  // -- Combining matchers --
  it('combines matchers for complex assertions', () => {
    const apiResponse = {
      users: [
        { id: 1, name: 'Alice', roles: ['admin', 'user'] },
        { id: 2, name: 'Bob', roles: ['user'] },
      ],
      pagination: { page: 1, perPage: 20, total: 2 },
    };

    expect(apiResponse).toEqual({
      users: expect.arrayContaining([
        expect.objectContaining({
          name: 'Alice',
          roles: expect.arrayContaining(['admin']),
        }),
      ]),
      pagination: expect.objectContaining({
        total: expect.any(Number),
      }),
    });
  });

  // -- Negation --
  it('uses .not for negative assertions', () => {
    const result = { status: 'active', error: null };

    expect(result.status).not.toBe('inactive');
    expect(result.error).toBeNull();
    expect(result.status).not.toMatch(/error/i);
  });
});`,
      explanation: "Parameterized tests (it.each) let you run the same test logic against many different inputs, dramatically reducing code duplication. The matcher deep-dive shows how to combine expect.objectContaining, expect.arrayContaining, expect.any, and expect.stringContaining for precise assertions on complex nested data structures — essential for testing API responses.",
      order_index: 4,
    },
  ],
  'integration-testing-strategy': [
    {
      title: "Integration Testing Express Routes with Supertest",
      description: "Full integration test for a REST API — registration, login, CRUD operations, error handling, and auth-protected routes.",
      language: "javascript",
      code: `import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../app.js';
import pool from '../config/database.js';

describe('Products API — Integration Tests', () => {
  let authToken;
  let createdProductId;

  // ── Setup: clean slate + get auth token ───────────────────
  beforeAll(async () => {
    await pool.query("DELETE FROM products WHERE name LIKE $1", ['%TEST_%']);

    // Create a test user and get token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin',
        email: 'products-test@test.com',
        password: 'TestPass123!',
      });
    authToken = registerRes.body.token;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM products WHERE name LIKE $1", ['%TEST_%']);
    await pool.query("DELETE FROM users WHERE email = $1", ['products-test@test.com']);
    await pool.end();
  });

  // ── POST /api/products ────────────────────────────────────
  describe('POST /api/products', () => {
    it('creates a product with valid data and auth', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({
          name: 'TEST_Widget',
          price: 29.99,
          description: 'A test widget',
          category: 'electronics',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: 'TEST_Widget',
        price: 29.99,
      }));

      createdProductId = res.body.id;
    });

    it('rejects unauthenticated requests', async () => {
      await request(app)
        .post('/api/products')
        .send({ name: 'TEST_Unauthorized', price: 10 })
        .expect(401);
    });

    it('validates required fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({ description: 'Missing name and price' })
        .expect(400);

      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'price' }),
        ])
      );
    });

    it('rejects negative prices', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({ name: 'TEST_Negative', price: -5 })
        .expect(400);

      expect(res.body.errors[0].message).toMatch(/price/i);
    });
  });

  // ── GET /api/products ─────────────────────────────────────
  describe('GET /api/products', () => {
    it('returns paginated product list', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toEqual(expect.objectContaining({
        page: 1,
        limit: 10,
        total: expect.any(Number),
      }));
    });

    it('supports search filtering', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ search: 'TEST_Widget' })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach(product => {
        expect(product.name.toLowerCase()).toContain('test_widget');
      });
    });
  });

  // ── GET /api/products/:id ─────────────────────────────────
  describe('GET /api/products/:id', () => {
    it('returns product by ID', async () => {
      const res = await request(app)
        .get(\`/api/products/\${createdProductId}\`)
        .expect(200);

      expect(res.body.name).toBe('TEST_Widget');
    });

    it('returns 404 for non-existent product', async () => {
      await request(app)
        .get('/api/products/999999')
        .expect(404);
    });
  });

  // ── PUT /api/products/:id ─────────────────────────────────
  describe('PUT /api/products/:id', () => {
    it('updates product with valid data', async () => {
      const res = await request(app)
        .put(\`/api/products/\${createdProductId}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({ name: 'TEST_Updated Widget', price: 39.99 })
        .expect(200);

      expect(res.body.name).toBe('TEST_Updated Widget');
      expect(res.body.price).toBe(39.99);
    });
  });

  // ── DELETE /api/products/:id ──────────────────────────────
  describe('DELETE /api/products/:id', () => {
    it('deletes product with auth', async () => {
      await request(app)
        .delete(\`/api/products/\${createdProductId}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(204);

      // Verify it's gone
      await request(app)
        .get(\`/api/products/\${createdProductId}\`)
        .expect(404);
    });
  });
});`,
      explanation: "This integration test exercises the full request lifecycle — from HTTP request through middleware, validation, database operations, and response formatting. It tests: auth-protected CRUD operations, input validation errors, pagination, search filtering, and proper HTTP status codes. The beforeAll/afterAll hooks handle test data setup and cleanup.",
      order_index: 1,
    },
    {
      title: "Database Testing with Transaction Rollback",
      description: "Test database repository functions using transaction rollback — each test runs in isolation with zero leftover data.",
      language: "javascript",
      code: `import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import pg from 'pg';

// ── Repository Under Test ───────────────────────────────────
class OrderRepository {
  constructor(client) {
    this.client = client;
  }

  async create(userId, items) {
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const orderResult = await this.client.query(
      'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, total, 'pending']
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await this.client.query(
        'INSERT INTO order_items (order_id, product_name, price, quantity) VALUES ($1, $2, $3, $4)',
        [order.id, item.name, item.price, item.qty]
      );
    }

    return { ...order, items };
  }

  async findById(orderId) {
    const orderResult = await this.client.query(
      'SELECT * FROM orders WHERE id = $1', [orderId]
    );
    if (orderResult.rows.length === 0) return null;

    const itemsResult = await this.client.query(
      'SELECT * FROM order_items WHERE order_id = $1', [orderId]
    );

    return { ...orderResult.rows[0], items: itemsResult.rows };
  }

  async updateStatus(orderId, status) {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(\`Invalid status: \${status}\`);
    }

    const result = await this.client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, orderId]
    );
    if (result.rows.length === 0) throw new Error('Order not found');
    return result.rows[0];
  }

  async findByUser(userId) {
    const result = await this.client.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }
}

// ── Tests with Transaction Rollback ─────────────────────────
describe('OrderRepository', () => {
  let pool;
  let client;
  let repo;

  beforeAll(async () => {
    pool = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Get a dedicated connection and start a transaction
    client = await pool.connect();
    await client.query('BEGIN');
    repo = new OrderRepository(client);

    // Seed a test user for foreign key references
    await client.query(
      "INSERT INTO users (id, name, email, password_hash) VALUES (9999, 'Test', 'repo-test@test.com', 'hash') ON CONFLICT (id) DO NOTHING"
    );
  });

  afterEach(async () => {
    // ROLLBACK undoes EVERYTHING — inserts, updates, deletes
    await client.query('ROLLBACK');
    client.release();
  });

  it('creates an order with items', async () => {
    const order = await repo.create(9999, [
      { name: 'Laptop', price: 999.99, qty: 1 },
      { name: 'Mouse', price: 29.99, qty: 2 },
    ]);

    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');
    expect(parseFloat(order.total)).toBeCloseTo(1059.97);
    expect(order.items).toHaveLength(2);
  });

  it('retrieves order by ID with items', async () => {
    const created = await repo.create(9999, [
      { name: 'Keyboard', price: 79.99, qty: 1 },
    ]);

    const found = await repo.findById(created.id);

    expect(found).not.toBeNull();
    expect(found.items).toHaveLength(1);
    expect(found.items[0].product_name).toBe('Keyboard');
  });

  it('returns null for non-existent order', async () => {
    const result = await repo.findById(999999);
    expect(result).toBeNull();
  });

  it('updates order status through valid transitions', async () => {
    const order = await repo.create(9999, [
      { name: 'Phone', price: 699, qty: 1 },
    ]);

    const confirmed = await repo.updateStatus(order.id, 'confirmed');
    expect(confirmed.status).toBe('confirmed');

    const shipped = await repo.updateStatus(order.id, 'shipped');
    expect(shipped.status).toBe('shipped');
  });

  it('rejects invalid status values', async () => {
    const order = await repo.create(9999, [
      { name: 'Tablet', price: 499, qty: 1 },
    ]);

    await expect(repo.updateStatus(order.id, 'invalid_status'))
      .rejects.toThrow('Invalid status: invalid_status');
  });

  it('finds all orders for a user', async () => {
    await repo.create(9999, [{ name: 'Item A', price: 10, qty: 1 }]);
    await repo.create(9999, [{ name: 'Item B', price: 20, qty: 1 }]);

    const orders = await repo.findByUser(9999);

    expect(orders).toHaveLength(2);
    expect(orders[0].user_id).toBe(9999);
  });

  // Each test is fully isolated — ROLLBACK ensures no data leaks
  it('starts with clean state (no leaked data from previous tests)', async () => {
    const orders = await repo.findByUser(9999);
    expect(orders).toHaveLength(0); // Previous test's data was rolled back!
  });
});`,
      explanation: "Transaction rollback is the gold standard for database test isolation. Each test runs inside a BEGIN/ROLLBACK pair — any rows inserted, updated, or deleted during the test are automatically undone. This is faster than DELETE-based cleanup, guarantees isolation, and prevents test pollution. The pattern: connect → BEGIN → run test → ROLLBACK → release.",
      order_index: 2,
    },
    {
      title: "Testing Middleware in Isolation with Mock req/res",
      description: "Unit-test Express middleware by creating mock request/response objects — test auth, validation, rate limiting, and error handling middleware.",
      language: "javascript",
      code: `import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// ═══════════════════════════════════════════════════════════
// The Middleware Under Test
// ═══════════════════════════════════════════════════════════

const JWT_SECRET = 'test-secret';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: \`Access denied. Required role: \${roles.join(' or ')}\`
      });
    }
    next();
  };
}

function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message, errors: err.details });
  }
  if (err.name === 'NotFoundError') {
    return res.status(404).json({ message: err.message });
  }

  res.status(500).json({ message: 'Internal server error' });
}

// ═══════════════════════════════════════════════════════════
// Test Helpers — Mock req, res, next
// ═══════════════════════════════════════════════════════════

function createMockReq(overrides = {}) {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    user: null,
    ...overrides,
  };
}

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

// ═══════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════

describe('authMiddleware', () => {
  let res, next;

  beforeEach(() => {
    res = createMockRes();
    next = jest.fn();
  });

  it('attaches decoded user to req and calls next', () => {
    const token = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const req = createMockReq({
      headers: { authorization: \`Bearer \${token}\` },
    });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({
      id: 1,
      email: 'admin@test.com',
      role: 'admin',
    }));
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is missing', () => {
    const req = createMockReq();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for malformed authorization header', () => {
    const req = createMockReq({
      headers: { authorization: 'NotBearer some-token' },
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', () => {
    const req = createMockReq({
      headers: { authorization: 'Bearer invalid.jwt.token' },
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  it('returns 401 with expiration message for expired tokens', () => {
    const expiredToken = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '0s' });
    const req = createMockReq({
      headers: { authorization: \`Bearer \${expiredToken}\` },
    });

    // Small delay to ensure token is expired
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
  });
});

describe('requireRole', () => {
  let res, next;

  beforeEach(() => {
    res = createMockRes();
    next = jest.fn();
  });

  it('allows access for matching role', () => {
    const req = createMockReq({ user: { id: 1, role: 'admin' } });
    const middleware = requireRole('admin', 'superadmin');

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('denies access for non-matching role', () => {
    const req = createMockReq({ user: { id: 2, role: 'user' } });
    const middleware = requireRole('admin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if user is not authenticated', () => {
    const req = createMockReq({ user: null });
    const middleware = requireRole('admin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('handles ValidationError with 400', () => {
    const err = new Error('Invalid email');
    err.name = 'ValidationError';
    err.details = [{ field: 'email', message: 'invalid format' }];

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid email',
      errors: [{ field: 'email', message: 'invalid format' }],
    });
  });

  it('handles unknown errors with 500', () => {
    const err = new Error('Something broke');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});`,
      explanation: "Testing middleware in isolation means creating mock req/res/next objects instead of making real HTTP requests. This is faster than supertest and lets you test edge cases precisely. The mock res uses jest.fn().mockReturnValue(res) so that res.status(401).json({...}) chains correctly. This example covers: auth token parsing, role-based access control, and centralized error handling.",
      order_index: 3,
    },
  ],
};

export default examples;
