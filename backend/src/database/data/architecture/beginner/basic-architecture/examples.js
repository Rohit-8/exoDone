// ============================================================================
// Software Architecture Fundamentals — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 1: What is Software Architecture?
  // ─────────────────────────────────────────────────────────────────────────
  "what-is-software-architecture": [
    // ── Example 1: Layered Architecture Implementation ──────────────────
    {
      title: "Layered Architecture — Full Implementation with Dependency Injection",
      description:
        "Build a complete Express.js application structured in strict layers: Data Access → Business Logic → Presentation. Each layer only depends on the layer directly below it. Uses constructor injection for testability and a composition root for wiring.",
      language: "javascript",
      code: `// ============================================================================
// LAYERED ARCHITECTURE — Complete Express.js Example
// ============================================================================
// Layer hierarchy:
//   Presentation (Controllers/Routes)
//     → Business Logic (Services)
//       → Data Access (Repositories)
//         → Database (PostgreSQL)
//
// Rule: each layer ONLY calls the layer directly below it.
// Controllers never touch the database. Repositories never format HTTP responses.

// ─── Layer 1: Data Access (Repository) ─────────────────────────────────
// Responsible for: raw database queries, data mapping, connection management
// Knows about: SQL, table names, column names
// Does NOT know about: HTTP, business rules, validation

class UserRepository {
  constructor(pool) {
    this.pool = pool; // pg Pool instance injected
  }

  async findById(id) {
    const { rows } = await this.pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null; // Returns raw data, no business logic
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  async create({ name, email, passwordHash, role = 'user' }) {
    const { rows } = await this.pool.query(
      \`INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at\`,
      [name, email, passwordHash, role]
    );
    return rows[0];
  }

  async updateRole(id, role) {
    const { rows } = await this.pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, id]
    );
    return rows[0] || null;
  }

  async findAll({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const { rows } = await this.pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const { rows: countRows } = await this.pool.query('SELECT COUNT(*) FROM users');
    return { users: rows, total: parseInt(countRows[0].count, 10) };
  }
}

// ─── Layer 2: Business Logic (Service) ─────────────────────────────────
// Responsible for: validation, business rules, orchestration, error handling
// Knows about: domain concepts (user roles, permissions), the repository interface
// Does NOT know about: HTTP status codes, request/response objects, SQL

class UserService {
  constructor(userRepo, passwordHasher, emailService, logger) {
    this.userRepo = userRepo;
    this.passwordHasher = passwordHasher;
    this.emailService = emailService;
    this.logger = logger;
  }

  async registerUser({ name, email, password }) {
    // ── Business validation ──
    if (!name || name.length < 2) {
      throw new ValidationError('Name must be at least 2 characters');
    }
    if (!email || !email.includes('@')) {
      throw new ValidationError('Valid email is required');
    }
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // ── Business rule: no duplicate emails ──
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // ── Create user ──
    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.userRepo.create({ name, email, passwordHash });

    // ── Side effect: send welcome email (fire & forget) ──
    this.emailService.sendWelcome(user.email, user.name).catch((err) => {
      this.logger.error('Failed to send welcome email', { userId: user.id, error: err.message });
    });

    this.logger.info('User registered', { userId: user.id });

    // Return sanitized user (never expose password hash)
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async getUserProfile(id) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user; // Already sanitized by repository query (no password_hash in SELECT)
  }

  async promoteToAdmin(requesterId, targetId) {
    // ── Business rule: only admins can promote ──
    const requester = await this.userRepo.findById(requesterId);
    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenError('Only admins can promote users');
    }

    const updated = await this.userRepo.updateRole(targetId, 'admin');
    if (!updated) throw new NotFoundError('Target user not found');

    this.logger.info('User promoted to admin', {
      promotedBy: requesterId,
      targetUser: targetId,
    });
    return updated;
  }
}

// ── Custom Error Classes (shared across layers) ──
class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'ValidationError'; }
}
class NotFoundError extends Error {
  constructor(message) { super(message); this.name = 'NotFoundError'; }
}
class ConflictError extends Error {
  constructor(message) { super(message); this.name = 'ConflictError'; }
}
class ForbiddenError extends Error {
  constructor(message) { super(message); this.name = 'ForbiddenError'; }
}

// ─── Layer 3: Presentation (Controller) ────────────────────────────────
// Responsible for: HTTP concerns — parsing requests, formatting responses, status codes
// Knows about: req/res objects, HTTP status codes, the service interface
// Does NOT know about: database queries, business rules, password hashing

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  // POST /api/users/register
  register = async (req, res, next) => {
    try {
      const user = await this.userService.registerUser(req.body);
      res.status(201).json({ data: user, message: 'Registration successful' });
    } catch (err) {
      next(err); // Let error middleware handle status codes
    }
  };

  // GET /api/users/:id
  getProfile = async (req, res, next) => {
    try {
      const user = await this.userService.getUserProfile(req.params.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/users/:id/promote
  promote = async (req, res, next) => {
    try {
      const updated = await this.userService.promoteToAdmin(req.user.id, req.params.id);
      res.json({ data: updated, message: 'User promoted to admin' });
    } catch (err) {
      next(err);
    }
  };
}

// ─── Error Handling Middleware (maps domain errors → HTTP status codes) ──
function errorHandler(err, req, res, _next) {
  const statusMap = {
    ValidationError: 400,
    NotFoundError: 404,
    ConflictError: 409,
    ForbiddenError: 403,
  };
  const status = statusMap[err.name] || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) console.error('Unhandled error:', err);

  res.status(status).json({ error: message });
}

// ─── Composition Root (Wiring) ─────────────────────────────────────────
// This is where all layers are connected via dependency injection.
// Only THIS file knows about ALL layers. Each layer is isolated.

import express from 'express';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Instantiate each layer bottom-up
const userRepo = new UserRepository(pool);
const passwordHasher = { hash: (pw) => bcrypt.hash(pw, 12) };
const emailService  = { sendWelcome: (email, name) => Promise.resolve() }; // Stub
const logger = console;

const userService    = new UserService(userRepo, passwordHasher, emailService, logger);
const userController = new UserController(userService);

// Wire routes
const app = express();
app.use(express.json());

app.post('/api/users/register', userController.register);
app.get('/api/users/:id',      userController.getProfile);
app.patch('/api/users/:id/promote', userController.promote);

app.use(errorHandler);

app.listen(3000, () => console.log('Layered Architecture API on :3000'));`,
      explanation:
        "This example demonstrates strict layered architecture — each layer has a single responsibility and only talks to the layer below. The Repository handles SQL, the Service handles business rules, the Controller handles HTTP. Notice how the Controller never writes SQL, and the Repository never checks business rules. The Composition Root (bottom of the file) wires everything together using dependency injection, making each layer independently testable. The error handling middleware maps domain errors (ValidationError, NotFoundError) to HTTP status codes — this is a Presentation concern, NOT a Service concern. In interviews, explain: 'Each layer has its own vocabulary — the Service speaks domain language (registerUser), the Controller speaks HTTP (POST /register), the Repository speaks SQL (INSERT INTO users).'",
      order_index: 1,
    },

    // ── Example 2: Hexagonal Architecture Implementation ────────────────
    {
      title: "Hexagonal Architecture (Ports & Adapters) — Domain Core Isolated from Infrastructure",
      description:
        "Implement the Ports & Adapters pattern where business logic has ZERO dependencies on frameworks, databases, or external services. Ports define interfaces. Adapters implement them. The domain core is testable with in-memory fakes.",
      language: "javascript",
      code: `// ============================================================================
// HEXAGONAL ARCHITECTURE (Ports & Adapters) — Order Processing Example
// ============================================================================
//
//  ┌───────────────────────────────────────────────────────────────────┐
//  │                     Adapters (Outer Ring)                        │
//  │                                                                   │
//  │   ┌───────────────────────────────────────────────────────────┐   │
//  │   │                  Ports (Inner Ring)                        │   │
//  │   │                                                           │   │
//  │   │   ┌───────────────────────────────────────────────────┐   │   │
//  │   │   │              Domain Core                           │   │   │
//  │   │   │         (pure business logic)                      │   │   │
//  │   │   └───────────────────────────────────────────────────┘   │   │
//  │   │                                                           │   │
//  │   │  OrderRepository (port)    PaymentGateway (port)          │   │
//  │   │  NotificationService (port)                               │   │
//  │   └───────────────────────────────────────────────────────────┘   │
//  │                                                                   │
//  │  PostgresOrderRepo (adapter)   StripePayment (adapter)           │
//  │  ExpressAPI (adapter)          EmailNotification (adapter)        │
//  └───────────────────────────────────────────────────────────────────┘

// ─── PORTS (Interfaces) ────────────────────────────────────────────────
// Ports define WHAT the domain needs, not HOW it's implemented.
// In JavaScript, we document the interface; in TypeScript, we'd use interfaces.

/**
 * @typedef {Object} OrderRepositoryPort
 * @property {(order: Order) => Promise<Order>} save
 * @property {(id: string) => Promise<Order|null>} findById
 * @property {(userId: string) => Promise<Order[]>} findByUserId
 */

/**
 * @typedef {Object} PaymentGatewayPort
 * @property {(amount: number, currency: string, token: string) => Promise<{transactionId: string, status: string}>} charge
 * @property {(transactionId: string) => Promise<{status: string}>} refund
 */

/**
 * @typedef {Object} NotificationPort
 * @property {(to: string, subject: string, body: string) => Promise<void>} send
 */

// ─── DOMAIN CORE (Pure Business Logic) ─────────────────────────────────
// ZERO imports from external libraries. No Express, no pg, no Stripe.
// Only pure JavaScript. Testable without any infrastructure.

class Order {
  constructor({ id, userId, items, status = 'pending', total = 0, transactionId = null }) {
    this.id = id;
    this.userId = userId;
    this.items = items;         // [{ productId, name, price, quantity }]
    this.status = status;       // pending → paid → shipped → delivered / cancelled
    this.total = total;
    this.transactionId = transactionId;
    this.createdAt = new Date();
  }

  calculateTotal() {
    this.total = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );
    return this.total;
  }

  markPaid(transactionId) {
    if (this.status !== 'pending') {
      throw new Error(\`Cannot pay order in status: \${this.status}\`);
    }
    this.status = 'paid';
    this.transactionId = transactionId;
  }

  markShipped() {
    if (this.status !== 'paid') {
      throw new Error('Only paid orders can be shipped');
    }
    this.status = 'shipped';
  }

  cancel() {
    if (['shipped', 'delivered'].includes(this.status)) {
      throw new Error(\`Cannot cancel order in status: \${this.status}\`);
    }
    this.status = 'cancelled';
  }
}

// ─── APPLICATION SERVICE (Use Case Orchestrator) ───────────────────────
// Depends ONLY on ports (interfaces), not on adapters (implementations).
// The application service coordinates the domain objects and ports.

class OrderService {
  /**
   * @param {OrderRepositoryPort} orderRepo
   * @param {PaymentGatewayPort} paymentGateway
   * @param {NotificationPort} notificationService
   */
  constructor(orderRepo, paymentGateway, notificationService) {
    this.orderRepo = orderRepo;
    this.paymentGateway = paymentGateway;
    this.notificationService = notificationService;
  }

  async placeOrder({ userId, userEmail, items, paymentToken }) {
    // 1. Create domain object and apply business rules
    const order = new Order({
      id: crypto.randomUUID(),
      userId,
      items,
    });
    order.calculateTotal();

    if (order.total <= 0) {
      throw new Error('Order total must be greater than zero');
    }
    if (order.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // 2. Process payment via port (we don't know if it's Stripe, PayPal, etc.)
    const payment = await this.paymentGateway.charge(
      order.total, 'usd', paymentToken
    );
    order.markPaid(payment.transactionId);

    // 3. Persist via port (we don't know if it's PostgreSQL, MongoDB, etc.)
    const savedOrder = await this.orderRepo.save(order);

    // 4. Notify via port (we don't know if it's email, SMS, push, etc.)
    await this.notificationService.send(
      userEmail,
      'Order Confirmed',
      \`Your order #\${order.id} for $\${order.total.toFixed(2)} has been placed.\`
    );

    return savedOrder;
  }

  async getOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async cancelOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error('Order not found');

    order.cancel();

    // Refund if already paid
    if (order.transactionId) {
      await this.paymentGateway.refund(order.transactionId);
    }

    return this.orderRepo.save(order);
  }
}

// ─── ADAPTERS (Outer Ring — Implementations) ────────────────────────────

// Adapter 1: PostgreSQL Repository (implements OrderRepositoryPort)
class PostgresOrderRepository {
  constructor(pool) { this.pool = pool; }

  async save(order) {
    await this.pool.query(
      \`INSERT INTO orders (id, user_id, items, status, total, transaction_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET status = $4, transaction_id = $6\`,
      [order.id, order.userId, JSON.stringify(order.items),
       order.status, order.total, order.transactionId, order.createdAt]
    );
    return order;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!rows[0]) return null;
    return new Order({ ...rows[0], items: rows[0].items, userId: rows[0].user_id });
  }

  async findByUserId(userId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]
    );
    return rows.map(r => new Order({ ...r, items: r.items, userId: r.user_id }));
  }
}

// Adapter 2: Stripe Payment (implements PaymentGatewayPort)
class StripePaymentAdapter {
  constructor(stripeClient) { this.stripe = stripeClient; }

  async charge(amount, currency, token) {
    const charge = await this.stripe.charges.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      source: token,
    });
    return { transactionId: charge.id, status: charge.status };
  }

  async refund(transactionId) {
    const refund = await this.stripe.refunds.create({ charge: transactionId });
    return { status: refund.status };
  }
}

// Adapter 3: Email Notification (implements NotificationPort)
class EmailNotificationAdapter {
  constructor(emailClient) { this.emailClient = emailClient; }

  async send(to, subject, body) {
    await this.emailClient.sendMail({ from: 'orders@shop.com', to, subject, text: body });
  }
}

// Adapter 4: In-Memory Repository (for testing — NO database needed!)
class InMemoryOrderRepository {
  constructor() { this.orders = new Map(); }

  async save(order) { this.orders.set(order.id, order); return order; }
  async findById(id) { return this.orders.get(id) || null; }
  async findByUserId(userId) {
    return [...this.orders.values()].filter(o => o.userId === userId);
  }
}

// ─── COMPOSITION ROOT (Wiring) ─────────────────────────────────────────
// Only here do we choose WHICH adapters to use. Swap PostgreSQL for MongoDB?
// Change this file. The OrderService and Order domain logic remain untouched.

// Production wiring:
// const orderRepo     = new PostgresOrderRepository(pgPool);
// const paymentGw     = new StripePaymentAdapter(stripe);
// const notifications = new EmailNotificationAdapter(nodemailer);
// const orderService  = new OrderService(orderRepo, paymentGw, notifications);

// Test wiring (no external dependencies!):
// const orderRepo     = new InMemoryOrderRepository();
// const paymentGw     = { charge: async () => ({ transactionId: 'tx_123', status: 'succeeded' }),
//                         refund: async () => ({ status: 'refunded' }) };
// const notifications = { send: async () => {} };
// const orderService  = new OrderService(orderRepo, paymentGw, notifications);`,
      explanation:
        "Hexagonal Architecture isolates your business logic from ALL external systems. The Order class and OrderService have ZERO imports — no Express, no pg, no Stripe, no nodemailer. They depend only on 'ports' (interfaces that define WHAT is needed, not HOW). Adapters live in the outer ring and implement those ports for specific technologies (PostgreSQL, Stripe, Email). The key benefit: you can test the entire business flow with in-memory fakes (InMemoryOrderRepository) — no Docker, no test database, no API mocks. To swap databases, you write a new adapter; the core never changes. In interviews, emphasize: 'The domain is the center of gravity — everything else is a replaceable plugin.' This pattern is also called Clean Architecture (Uncle Bob) when combined with use-case-driven layers.",
      order_index: 2,
    },

    // ── Example 3: C4 Model Documentation ──────────────────────────────
    {
      title: "C4 Model — Documenting Architecture at Four Zoom Levels",
      description:
        "Demonstrate how to document a system's architecture using the C4 model (Context, Containers, Components, Code) with structured JavaScript objects that could generate diagrams via Structurizr or Mermaid.",
      language: "javascript",
      code: `// ============================================================================
// C4 MODEL — Architecture Documentation as Code
// ============================================================================
// The C4 model provides four zoom levels for documenting architecture.
// This example defines an e-commerce system's architecture in a structured
// format that tools like Structurizr, Mermaid, or PlantUML can render.

// ─── Level 1: SYSTEM CONTEXT ───────────────────────────────────────────
// Shows the system as a black box: who uses it, what it integrates with.
// Audience: everyone — executives, product managers, new developers.

const systemContext = {
  system: {
    name: 'ShopWave E-Commerce Platform',
    description: 'Online marketplace for buying and selling products',
    technology: 'Node.js, React, PostgreSQL',
  },

  // People who interact with the system
  people: [
    { name: 'Customer',      description: 'Browses products, places orders, tracks delivery' },
    { name: 'Seller',        description: 'Lists products, manages inventory, views analytics' },
    { name: 'Admin',         description: 'Manages users, reviews flagged content, configures platform' },
    { name: 'Support Agent', description: 'Handles customer complaints and disputes' },
  ],

  // External systems we integrate with
  externalSystems: [
    { name: 'Stripe',           description: 'Payment processing and payouts',     protocol: 'REST API' },
    { name: 'SendGrid',         description: 'Transactional email delivery',        protocol: 'REST API' },
    { name: 'AWS S3',           description: 'Product image and document storage',  protocol: 'AWS SDK' },
    { name: 'Google Analytics', description: 'User behavior tracking',              protocol: 'JS SDK'  },
    { name: 'ShipStation',      description: 'Shipping label generation & tracking',protocol: 'REST API' },
  ],

  // Key interactions
  interactions: [
    { from: 'Customer',      to: 'ShopWave', action: 'Browses, searches, purchases products via web/mobile' },
    { from: 'Seller',        to: 'ShopWave', action: 'Lists products, fulfills orders via seller dashboard' },
    { from: 'ShopWave',      to: 'Stripe',   action: 'Processes payments and seller payouts' },
    { from: 'ShopWave',      to: 'SendGrid', action: 'Sends order confirmations, shipping updates' },
    { from: 'ShopWave',      to: 'AWS S3',   action: 'Stores and retrieves product images' },
  ],
};

// ─── Level 2: CONTAINER DIAGRAM ────────────────────────────────────────
// Zooms into the system to show deployable units: apps, databases, queues.
// Audience: developers and DevOps engineers.

const containerDiagram = {
  containers: [
    {
      name: 'Web SPA',
      technology: 'React, Vite, Tailwind CSS',
      description: 'Customer-facing storefront and seller dashboard',
      type: 'Single-Page Application',
      deployment: 'Vercel / CloudFront CDN',
    },
    {
      name: 'API Server',
      technology: 'Node.js, Express.js',
      description: 'REST API handling auth, products, orders, payments',
      type: 'Web Application',
      deployment: 'AWS ECS (Docker containers)',
    },
    {
      name: 'Background Worker',
      technology: 'Node.js, BullMQ',
      description: 'Processes async jobs: email sending, image resizing, report generation',
      type: 'Worker Process',
      deployment: 'AWS ECS (separate task definition)',
    },
    {
      name: 'Primary Database',
      technology: 'PostgreSQL 16',
      description: 'Stores users, products, orders, reviews',
      type: 'Relational Database',
      deployment: 'AWS RDS (Multi-AZ)',
    },
    {
      name: 'Cache',
      technology: 'Redis 7',
      description: 'Session storage, product cache, rate limiting, job queues',
      type: 'In-Memory Store',
      deployment: 'AWS ElastiCache',
    },
    {
      name: 'Search Index',
      technology: 'Elasticsearch 8',
      description: 'Full-text product search with filters and facets',
      type: 'Search Engine',
      deployment: 'AWS OpenSearch',
    },
  ],

  interactions: [
    { from: 'Web SPA',           to: 'API Server',        protocol: 'HTTPS / REST + WebSocket' },
    { from: 'API Server',        to: 'Primary Database',   protocol: 'TCP / pg driver' },
    { from: 'API Server',        to: 'Cache',              protocol: 'TCP / ioredis' },
    { from: 'API Server',        to: 'Search Index',       protocol: 'HTTPS / ES client' },
    { from: 'API Server',        to: 'Background Worker',  protocol: 'Redis (BullMQ queue)' },
    { from: 'Background Worker', to: 'Primary Database',   protocol: 'TCP / pg driver' },
    { from: 'Background Worker', to: 'SendGrid',           protocol: 'HTTPS / REST' },
    { from: 'Background Worker', to: 'AWS S3',             protocol: 'HTTPS / AWS SDK' },
  ],
};

// ─── Level 3: COMPONENT DIAGRAM (API Server Internals) ─────────────────
// Zooms into ONE container to show its internal components.
// Audience: developers working on this container.

const apiServerComponents = {
  container: 'API Server',
  components: [
    // Controllers (Presentation Layer)
    { name: 'AuthController',    responsibility: 'Login, register, token refresh, logout',    layer: 'presentation' },
    { name: 'ProductController', responsibility: 'CRUD products, search, filter',             layer: 'presentation' },
    { name: 'OrderController',   responsibility: 'Place orders, track status, cancel',        layer: 'presentation' },
    { name: 'PaymentController', responsibility: 'Process payments, handle Stripe webhooks',  layer: 'presentation' },

    // Services (Business Logic Layer)
    { name: 'AuthService',       responsibility: 'Password hashing, JWT creation, session management',  layer: 'business' },
    { name: 'ProductService',    responsibility: 'Product validation, pricing rules, inventory checks', layer: 'business' },
    { name: 'OrderService',      responsibility: 'Order workflow, status transitions, business rules',  layer: 'business' },
    { name: 'PaymentService',    responsibility: 'Payment orchestration, refund logic, payout calc',    layer: 'business' },

    // Repositories (Data Access Layer)
    { name: 'UserRepository',    responsibility: 'User CRUD operations, email lookups',       layer: 'data-access' },
    { name: 'ProductRepository', responsibility: 'Product CRUD, search queries, category tree',layer: 'data-access' },
    { name: 'OrderRepository',   responsibility: 'Order persistence, status updates, history', layer: 'data-access' },

    // Cross-cutting
    { name: 'AuthMiddleware',    responsibility: 'JWT verification, role-based access control', layer: 'middleware' },
    { name: 'ErrorHandler',      responsibility: 'Maps domain errors to HTTP status codes',    layer: 'middleware' },
    { name: 'RateLimiter',       responsibility: 'Per-IP and per-user request rate limiting',   layer: 'middleware' },
  ],

  dependencies: [
    { from: 'AuthController',    to: 'AuthService',       type: 'calls' },
    { from: 'ProductController', to: 'ProductService',    type: 'calls' },
    { from: 'OrderController',   to: 'OrderService',      type: 'calls' },
    { from: 'PaymentController', to: 'PaymentService',    type: 'calls' },
    { from: 'AuthService',       to: 'UserRepository',    type: 'calls' },
    { from: 'ProductService',    to: 'ProductRepository', type: 'calls' },
    { from: 'OrderService',      to: 'OrderRepository',   type: 'calls' },
    { from: 'OrderService',      to: 'PaymentService',    type: 'calls' },
  ],
};

// ─── Generate Mermaid Diagram from C4 Data ─────────────────────────────
// This function converts our structured data into Mermaid syntax
// that can be rendered in GitHub READMEs, documentation sites, etc.

function generateMermaidContainerDiagram(data) {
  let mermaid = 'graph TB\\n';

  // Add containers
  data.containers.forEach((c) => {
    const label = \`\${c.name}<br/><i>\${c.technology}</i>\`;
    mermaid += \`  \${c.name.replace(/\\s/g, '')}["\${label}"]\\n\`;
  });

  // Add interactions
  data.interactions.forEach((i) => {
    const from = i.from.replace(/\\s/g, '');
    const to = i.to.replace(/\\s/g, '');
    mermaid += \`  \${from} -->|"\${i.protocol}"| \${to}\\n\`;
  });

  return mermaid;
}

// Usage:
console.log(generateMermaidContainerDiagram(containerDiagram));
// Output:
// graph TB
//   WebSPA["Web SPA<br/><i>React, Vite, Tailwind CSS</i>"]
//   APIServer["API Server<br/><i>Node.js, Express.js</i>"]
//   ...
//   WebSPA -->|"HTTPS / REST + WebSocket"| APIServer
//   APIServer -->|"TCP / pg driver"| PrimaryDatabase
//   ...`,
      explanation:
        "The C4 model (created by Simon Brown) is the most popular way to document software architecture. It provides four zoom levels: Context (bird's-eye view for stakeholders), Containers (deployable units for DevOps), Components (internal structure for developers), Code (class-level for implementers). This example defines architecture as structured data that can generate diagrams automatically — treating architecture docs as code. In interviews, when asked 'How do you document architecture?', describe the C4 model and emphasize choosing the right zoom level for your audience: executives see Level 1, developers see Level 2–3. The Mermaid generation function shows that architecture docs can be programmatically kept in sync with the actual system.",
      order_index: 3,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 2: Architecture Decision Records
  // ─────────────────────────────────────────────────────────────────────────
  "architecture-decision-records": [
    // ── Example 1: ADR Template with Helpers ────────────────────────────
    {
      title: "ADR Template Generator — Create Properly Structured Decision Records",
      description:
        "A reusable ADR generator that enforces the Nygard template format, auto-numbers files, validates required fields, and outputs well-structured Markdown. Includes a CLI interface for day-to-day use.",
      language: "javascript",
      code: `// ============================================================================
// ADR TEMPLATE GENERATOR — Architecture Decision Records as Code
// ============================================================================
// Usage: node adr-tool.js new "Use PostgreSQL for primary data store"
// Creates: docs/adr/0004-use-postgresql-for-primary-data-store.md

import fs from 'fs';
import path from 'path';

// ── ADR Configuration ──────────────────────────────────────────────────

const ADR_DIR = path.join(process.cwd(), 'docs', 'adr');
const VALID_STATUSES = ['proposed', 'accepted', 'deprecated', 'superseded'];

// ── ADR Template ───────────────────────────────────────────────────────

function generateADR({ number, title, status = 'proposed', context, decision, consequences, alternatives }) {
  // Validate required fields
  if (!title) throw new Error('ADR title is required');
  if (!context) throw new Error('ADR context is required — explain WHY this decision is needed');
  if (!decision) throw new Error('ADR decision is required — state WHAT was decided');

  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const paddedNum = String(number).padStart(4, '0');

  let markdown = \`# ADR-\${paddedNum}: \${title}

**Date:** \${dateStr}

## Status

\${capitalize(status)}

## Context

\${context}

\`;

  // Optional: Considered Alternatives (MADR-style enhancement)
  if (alternatives && alternatives.length > 0) {
    markdown += \`## Considered Alternatives

\`;
    alternatives.forEach((alt, i) => {
      markdown += \`### \${i + 1}. \${alt.name}

\${alt.description}

\`;
      if (alt.pros) {
        markdown += \`**Pros:** \${alt.pros.join(', ')}

\`;
      }
      if (alt.cons) {
        markdown += \`**Cons:** \${alt.cons.join(', ')}

\`;
      }
    });
  }

  markdown += \`## Decision

\${decision}

## Consequences

\`;

  // Structured consequences
  if (typeof consequences === 'object' && !Array.isArray(consequences)) {
    if (consequences.positive?.length) {
      markdown += \`### Positive

\${consequences.positive.map(c => \`- \${c}\`).join('\\n')}

\`;
    }
    if (consequences.negative?.length) {
      markdown += \`### Negative

\${consequences.negative.map(c => \`- \${c}\`).join('\\n')}

\`;
    }
    if (consequences.neutral?.length) {
      markdown += \`### Neutral

\${consequences.neutral.map(c => \`- \${c}\`).join('\\n')}

\`;
    }
  } else {
    // Plain text consequences
    markdown += consequences || 'To be determined.\\n';
  }

  return markdown;
}

// ── Helper Functions ───────────────────────────────────────────────────

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getNextNumber() {
  if (!fs.existsSync(ADR_DIR)) {
    fs.mkdirSync(ADR_DIR, { recursive: true });
    return 1;
  }
  const files = fs.readdirSync(ADR_DIR).filter(f => f.match(/^\\d{4}-/));
  if (files.length === 0) return 1;
  const lastNum = Math.max(...files.map(f => parseInt(f.split('-')[0], 10)));
  return lastNum + 1;
}

function saveADR(number, title, content) {
  const paddedNum = String(number).padStart(4, '0');
  const fileName = \`\${paddedNum}-\${slugify(title)}.md\`;
  const filePath = path.join(ADR_DIR, fileName);

  if (!fs.existsSync(ADR_DIR)) {
    fs.mkdirSync(ADR_DIR, { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ── Supersede an Existing ADR ──────────────────────────────────────────

function supersedeADR(oldNumber, newNumber) {
  const oldPadded = String(oldNumber).padStart(4, '0');
  const files = fs.readdirSync(ADR_DIR).filter(f => f.startsWith(oldPadded));

  if (files.length === 0) {
    throw new Error(\`ADR-\${oldPadded} not found\`);
  }

  const filePath = path.join(ADR_DIR, files[0]);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Update status
  content = content.replace(
    /## Status\\n\\n\\w+/,
    \`## Status\\n\\nSuperseded by ADR-\${String(newNumber).padStart(4, '0')}\`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ── Generate ADR Index (Table of Contents) ─────────────────────────────

function generateIndex() {
  const files = fs.readdirSync(ADR_DIR)
    .filter(f => f.match(/^\\d{4}-.*\\.md$/))
    .sort();

  let index = '# Architecture Decision Records\\n\\n';
  index += '| ADR | Title | Status | Date |\\n';
  index += '|-----|-------|--------|------|\\n';

  files.forEach(file => {
    const content = fs.readFileSync(path.join(ADR_DIR, file), 'utf-8');
    const titleMatch = content.match(/^# ADR-\\d+: (.+)$/m);
    const statusMatch = content.match(/## Status\\n\\n(.+)/);
    const dateMatch = content.match(/\\*\\*Date:\\*\\* (\\d{4}-\\d{2}-\\d{2})/);

    const num = file.split('-')[0];
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    const status = statusMatch ? statusMatch[1] : 'Unknown';
    const date = dateMatch ? dateMatch[1] : 'Unknown';

    index += \`| \${num} | [\${title}](\${file}) | \${status} | \${date} |\\n\`;
  });

  return index;
}

// ── CLI Interface ──────────────────────────────────────────────────────

const command = process.argv[2];

if (command === 'new') {
  const title = process.argv[3];
  if (!title) {
    console.error('Usage: node adr-tool.js new "Title of Decision"');
    process.exit(1);
  }

  const number = getNextNumber();
  const content = generateADR({
    number,
    title,
    context: '<!-- Describe the context and problem statement -->',
    decision: '<!-- State the decision -->',
    consequences: {
      positive: ['<!-- List positive consequences -->'],
      negative: ['<!-- List negative consequences -->'],
    },
  });

  const filePath = saveADR(number, title, content);
  console.log(\`Created: \${filePath}\`);
}

if (command === 'index') {
  console.log(generateIndex());
}

if (command === 'supersede') {
  const oldNum = parseInt(process.argv[3], 10);
  const newTitle = process.argv[4];
  const newNum = getNextNumber();

  supersedeADR(oldNum, newNum);
  console.log(\`ADR-\${String(oldNum).padStart(4, '0')} marked as superseded\`);

  const content = generateADR({
    number: newNum,
    title: newTitle,
    context: \`This supersedes ADR-\${String(oldNum).padStart(4, '0')}. <!-- Explain why -->\`,
    decision: '<!-- State the new decision -->',
    consequences: { positive: ['<!-- ... -->'], negative: ['<!-- ... -->'] },
  });

  const filePath = saveADR(newNum, newTitle, content);
  console.log(\`Created: \${filePath}\`);
}`,
      explanation:
        "This example treats ADRs as code — a CLI tool that generates, numbers, and manages decision records. Key features: (1) Auto-numbering ensures unique, sequential IDs. (2) The slugify function creates filesystem-friendly filenames. (3) The supersede function properly links old and new ADRs. (4) The index generator creates a scannable table of all decisions. In interviews, mentioning that you automate ADR management shows practical experience. The tool enforces the Nygard template but enhances it with MADR-style alternatives and structured consequences (positive/negative/neutral). Real teams use similar tools: 'adr-tools' (Bash, by Nat Pryce) and 'Log4brains' (generates a searchable static site from ADRs).",
      order_index: 1,
    },

    // ── Example 2: Real-World ADR for Choosing PostgreSQL ───────────────
    {
      title: "Real-World ADR — Choosing PostgreSQL Over MongoDB and DynamoDB",
      description:
        "A complete, production-quality ADR that demonstrates how to document a database selection decision with proper context, alternatives analysis, and honest trade-off assessment.",
      language: "markdown",
      code: `# ADR-0003: Use PostgreSQL as Primary Data Store

**Date:** 2025-03-15
**Author:** Sarah Chen (Tech Lead)
**Reviewers:** James Park (Backend), Lisa Wu (DevOps), Mark Johnson (CTO)

## Status

Accepted

## Context

We are building an e-commerce platform (ShopWave) that needs a primary
data store for users, products, orders, reviews, and inventory. Our
requirements are:

### Functional Requirements
- ACID transactions for order processing (an order creates a payment
  record, updates inventory, and sends a confirmation — all or nothing)
- Complex queries for admin reporting (joins across 5+ tables,
  aggregations, window functions)
- Full-text search for product catalog (with ranking and fuzzy matching)
- Flexible schema for product attributes (electronics have different
  fields than clothing)

### Non-Functional Requirements
- Expected load: 10,000 DAU initially, scaling to 100,000 in 2 years
- 99.9% uptime for order processing
- Sub-100ms query latency for product listings
- Team of 5 backend developers (3 with PostgreSQL experience, 1 with
  MongoDB, 1 with DynamoDB)

### Constraints
- Budget: ~$500/month for database hosting initially
- Timeline: MVP in 3 months
- Must run on AWS (company standard)

## Considered Alternatives

### 1. MongoDB (v7)
**Pros:**
- Flexible schema (great for varied product attributes)
- Native JSON document model
- Horizontal scaling via sharding
- Good developer experience for rapid prototyping

**Cons:**
- Multi-document ACID transactions added in v4.0 but with performance
  overhead and complexity (writes lock at document level, multi-doc
  transactions hold locks longer)
- Reporting queries across collections require $lookup (less efficient
  than SQL JOINs for complex reports)
- Team has limited MongoDB experience (1 of 5 developers)
- Atlas pricing at our expected scale: ~$800/month for M30 cluster

### 2. DynamoDB
**Pros:**
- Virtually unlimited horizontal scaling
- Predictable single-digit millisecond latency
- Fully managed (zero operational overhead)
- Pay-per-request pricing model

**Cons:**
- No ACID transactions across partitions (only within 25-item
  TransactWriteItems limit)
- Severe query limitations (can only query by partition key + sort key;
  everything else requires GSIs or full scans)
- Complex reporting requires exporting to another service (Athena/Redshift)
- Vendor lock-in to AWS DynamoDB API
- Single-table design is a steep learning curve
- Team has minimal DynamoDB experience (1 of 5 developers)

### 3. PostgreSQL 16 ← CHOSEN
**Pros:**
- Full ACID compliance with mature transaction support
- Rich query capabilities (CTEs, window functions, subqueries, JOINs)
- Native JSONB for flexible product attributes (with GIN indexes)
- Built-in full-text search (tsvector/tsquery — may defer Elasticsearch)
- Team expertise (3 of 5 developers have production PostgreSQL experience)
- Excellent tooling (pgAdmin, psql, pgBouncer, pg_stat_statements)
- Cost-effective: RDS db.t3.medium ~$130/month (Multi-AZ ~$260/month)
- Large community, extensive documentation, strong ecosystem

**Cons:**
- Horizontal scaling is harder (read replicas are easy; write scaling
  requires partitioning or Citus extension)
- Schema migrations require careful planning and tooling
- Connection pooling needed at scale (pgBouncer or PgPool-II)

## Decision

We will use **PostgreSQL 16** as our primary data store, hosted on
**AWS RDS** with the following configuration:

- **Instance:** db.t3.medium (2 vCPU, 4 GB RAM) initially
- **Storage:** 100 GB gp3 SSD with auto-scaling
- **High Availability:** Multi-AZ deployment for production
- **Read Replicas:** 1 replica for reporting queries (added when needed)
- **Connection Pooling:** pgBouncer for connection management
- **Migrations:** node-pg-migrate for schema versioning
- **Flexible attributes:** JSONB columns for product-specific fields

### Why Not MongoDB?
The decisive factors were: (1) our need for reliable multi-table ACID
transactions for order processing, (2) complex reporting requirements
that PostgreSQL handles natively, and (3) team expertise — 3 of 5
developers already know PostgreSQL, reducing ramp-up time.

### Why Not DynamoDB?
The decisive factors were: (1) query flexibility — our reporting needs
require arbitrary joins and aggregations that DynamoDB cannot handle
without exporting data, and (2) the learning curve for single-table
design would slow down our 3-month MVP timeline.

## Consequences

### Positive
- ACID transactions ensure data integrity for financial operations
- Team can be productive immediately (existing PostgreSQL expertise)
- JSONB provides schema flexibility for product attributes without
  sacrificing relational capabilities
- Cost-effective hosting (~$260/month for production Multi-AZ)
- Rich ecosystem of monitoring and management tools

### Negative
- Horizontal write scaling will require additional work if we exceed
  single-node capacity (estimated at ~50,000 concurrent users based
  on pgbench testing — well beyond our 2-year projection)
- Schema migrations require coordination (mitigated by node-pg-migrate
  and a documented migration process)
- Full-text search may need to be replaced by Elasticsearch at scale
  (acceptable trade-off for MVP — can revisit in ADR-XXXX)

### Neutral
- We need to establish connection pooling best practices for the team
- Backup and point-in-time recovery are handled by RDS automatically
- Team will need to learn JSONB querying patterns for product attributes

## Follow-up Actions
- [ ] Set up RDS instance with Multi-AZ (DevOps: Lisa)
- [ ] Configure pgBouncer connection pooling (Backend: James)
- [ ] Create database migration tooling and workflow (Backend: Sarah)
- [ ] Write product attribute JSONB schema guidelines (Backend: team)
- [ ] Set up pg_stat_statements for query performance monitoring (DevOps: Lisa)`,
      explanation:
        "This is what a production-quality ADR looks like. Notice key elements: (1) Named authors and reviewers — accountability. (2) Separate functional and non-functional requirements — structured context. (3) Three alternatives with detailed pros/cons — shows the decision wasn't arbitrary. (4) Explicit 'Why Not' sections — addresses the obvious follow-up questions. (5) Consequences split into positive/negative/neutral — honest trade-off assessment. (6) Follow-up actions — the ADR isn't just documentation, it drives work. In interviews, when asked about ADRs, walk through this structure: 'I write the context first — the forces at play. Then I list alternatives with pros and cons. The decision section explains WHY we chose this option, and consequences capture what we gain and what we accept as trade-offs.'",
      order_index: 2,
    },

    // ── Example 3: ADR Validation & Linter ──────────────────────────────
    {
      title: "ADR Linter — Validate Decision Records for Completeness and Quality",
      description:
        "A validation tool that checks ADRs against quality rules: required sections present, alternatives listed, consequences documented, proper status values, and cross-references intact. Integrates into CI/CD pipelines.",
      language: "javascript",
      code: `// ============================================================================
// ADR LINTER — Validate Architecture Decision Records
// ============================================================================
// Run: node adr-lint.js docs/adr/
// Integrates into CI: exits with code 1 if any ADR fails validation.
// Ensures every merged ADR meets the team's quality standards.

import fs from 'fs';
import path from 'path';

// ── Validation Rules ───────────────────────────────────────────────────

const RULES = [
  {
    id: 'has-title',
    description: 'ADR must have a title starting with "# ADR-NNNN:"',
    severity: 'error',
    check: (content) => /^# ADR-\\d{4}: .{10,}$/m.test(content),
    fix: 'Add a title line like: # ADR-0001: Use PostgreSQL for Primary Data Store',
  },
  {
    id: 'has-status',
    description: 'ADR must have a Status section with a valid status',
    severity: 'error',
    check: (content) => {
      const statusMatch = content.match(/## Status\\s+([\\s\\S]*?)(?=##|$)/);
      if (!statusMatch) return false;
      const statusText = statusMatch[1].trim().toLowerCase();
      const validStatuses = ['proposed', 'accepted', 'deprecated', 'superseded'];
      return validStatuses.some(s => statusText.startsWith(s));
    },
    fix: 'Add a Status section with one of: Proposed, Accepted, Deprecated, Superseded',
  },
  {
    id: 'has-context',
    description: 'ADR must have a Context section with meaningful content (>50 chars)',
    severity: 'error',
    check: (content) => {
      const contextMatch = content.match(/## Context\\s+([\\s\\S]*?)(?=##|$)/);
      if (!contextMatch) return false;
      const text = contextMatch[1].replace(/<!--.*?-->/g, '').trim();
      return text.length > 50;
    },
    fix: 'Add a Context section explaining WHY this decision is needed (at least 50 characters)',
  },
  {
    id: 'has-decision',
    description: 'ADR must have a Decision section with meaningful content (>30 chars)',
    severity: 'error',
    check: (content) => {
      const decisionMatch = content.match(/## Decision\\s+([\\s\\S]*?)(?=##|$)/);
      if (!decisionMatch) return false;
      const text = decisionMatch[1].replace(/<!--.*?-->/g, '').trim();
      return text.length > 30;
    },
    fix: 'Add a Decision section stating WHAT was decided (at least 30 characters)',
  },
  {
    id: 'has-consequences',
    description: 'ADR must have a Consequences section',
    severity: 'error',
    check: (content) => /## Consequences/i.test(content),
    fix: 'Add a Consequences section listing positive and negative impacts',
  },
  {
    id: 'has-alternatives',
    description: 'ADR should list considered alternatives (MADR best practice)',
    severity: 'warning',
    check: (content) => {
      // Check for alternatives section OR inline mentions of "considered" options
      return /alternative|considered|option|compared/i.test(content);
    },
    fix: 'Add a "Considered Alternatives" section or mention alternatives in Context',
  },
  {
    id: 'has-date',
    description: 'ADR should have a date',
    severity: 'warning',
    check: (content) => /\\*\\*Date:\\*\\*|Date:|\\d{4}-\\d{2}-\\d{2}/.test(content),
    fix: 'Add a date (e.g., **Date:** 2025-03-15)',
  },
  {
    id: 'not-too-long',
    description: 'ADR should be concise (under 300 lines)',
    severity: 'warning',
    check: (content) => content.split('\\n').length <= 300,
    fix: 'ADR is too long — keep it to 1-2 pages. Move detailed analysis to separate docs.',
  },
  {
    id: 'no-template-placeholders',
    description: 'ADR should not contain unfilled template placeholders',
    severity: 'error',
    check: (content) => {
      const placeholders = ['<!-- Describe', '<!-- State', '<!-- List', '<!-- Explain', '<!-- ...'];
      return !placeholders.some(p => content.includes(p));
    },
    fix: 'Replace all <!-- template placeholders --> with actual content',
  },
  {
    id: 'superseded-has-link',
    description: 'Superseded ADRs must reference the new ADR number',
    severity: 'error',
    check: (content) => {
      const isSuperseded = /superseded/i.test(content.match(/## Status\\s+(.+)/)?.[1] || '');
      if (!isSuperseded) return true; // Rule doesn't apply
      return /ADR-\\d{4}/.test(content.match(/## Status\\s+(.+)/)?.[1] || '');
    },
    fix: 'Superseded status must include the new ADR number: "Superseded by ADR-0042"',
  },
];

// ── Linter Engine ──────────────────────────────────────────────────────

function lintADR(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const results = [];

  for (const rule of RULES) {
    const passed = rule.check(content);
    results.push({
      file: fileName,
      ruleId: rule.id,
      description: rule.description,
      severity: rule.severity,
      passed,
      fix: passed ? null : rule.fix,
    });
  }

  return results;
}

function lintDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(\`ADR directory not found: \${dirPath}\`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath)
    .filter(f => f.match(/^\\d{4}-.*\\.md$/))
    .sort();

  if (files.length === 0) {
    console.log('No ADR files found.');
    return { passed: true, results: [] };
  }

  let hasErrors = false;
  const allResults = [];

  for (const file of files) {
    const results = lintADR(path.join(dirPath, file));
    allResults.push(...results);

    const failures = results.filter(r => !r.passed);
    const errors = failures.filter(r => r.severity === 'error');
    const warnings = failures.filter(r => r.severity === 'warning');

    if (failures.length > 0) {
      console.log(\`\\n📄 \${file}\`);
      errors.forEach(r => console.log(\`  ❌ [ERROR]   \${r.description}\\n              Fix: \${r.fix}\`));
      warnings.forEach(r => console.log(\`  ⚠️  [WARNING] \${r.description}\\n              Fix: \${r.fix}\`));
    } else {
      console.log(\`✅ \${file} — all checks passed\`);
    }

    if (errors.length > 0) hasErrors = true;
  }

  // Summary
  const totalChecks = allResults.length;
  const totalPassed = allResults.filter(r => r.passed).length;
  const totalErrors = allResults.filter(r => !r.passed && r.severity === 'error').length;
  const totalWarnings = allResults.filter(r => !r.passed && r.severity === 'warning').length;

  console.log(\`\\n─── Summary ───\`);
  console.log(\`Files: \${files.length} | Checks: \${totalChecks} | Passed: \${totalPassed} | Errors: \${totalErrors} | Warnings: \${totalWarnings}\`);

  return { passed: !hasErrors, results: allResults };
}

// ── CLI Entry Point ────────────────────────────────────────────────────

const adrDir = process.argv[2] || 'docs/adr';
const { passed } = lintDirectory(adrDir);
process.exit(passed ? 0 : 1);

// ── Integration with CI/CD ─────────────────────────────────────────────
// In package.json:
// "scripts": {
//   "lint:adr": "node adr-lint.js docs/adr"
// }
//
// In GitHub Actions:
// - name: Lint ADRs
//   run: npm run lint:adr`,
      explanation:
        "This ADR linter enforces quality standards automatically — it can run in CI/CD to prevent merging ADRs that are incomplete or have unfilled template placeholders. Key rules check for: (1) Required sections (title, status, context, decision, consequences). (2) Minimum content length (prevents empty placeholders). (3) Valid status values. (4) Superseded ADRs must link to the new ADR. (5) No unfilled template comments. The tool exits with code 1 on errors (blocking CI) but only warns on best-practice violations (alternatives, dates). In interviews, mentioning CI-enforced ADR quality shows that you treat documentation as seriously as code — 'We lint our ADRs the same way we lint our code.'",
      order_index: 3,
    },
  ],
};

export default examples;
