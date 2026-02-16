// ============================================================================
// Clean Architecture — Code Examples
// ============================================================================

export default {
  'clean-architecture-principles': [
    {
      title: "Domain Entity with Business Rules",
      description: "A pure domain entity that enforces enterprise business rules without any framework dependencies. The Order entity validates its own invariants — it cannot be submitted when empty, it tracks status transitions, and it calculates totals internally.",
      language: "javascript",
      code: `// domain/entities/Order.js — Pure Entity (innermost layer)
// ZERO imports from Express, Sequelize, Mongoose, etc.

class Order {
  #items = [];
  #status = 'draft';

  constructor({ id, customerId, createdAt }) {
    if (!id) throw new Error('Order ID is required');
    if (!customerId) throw new Error('Customer ID is required');
    this.id = id;
    this.customerId = customerId;
    this.createdAt = createdAt || new Date();
  }

  addItem(product, quantity) {
    if (this.#status !== 'draft') {
      throw new Error('Cannot modify a non-draft order');
    }
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const existing = this.#items.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.#items.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity,
      });
    }
  }

  get total() {
    return this.#items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity, 0
    );
  }

  submit() {
    if (this.#items.length === 0) {
      throw new Error('Cannot submit an empty order');
    }
    if (this.#status !== 'draft') {
      throw new Error('Order has already been submitted');
    }
    this.#status = 'submitted';
    return this;
  }

  cancel() {
    const nonCancellable = ['shipped', 'delivered', 'cancelled'];
    if (nonCancellable.includes(this.#status)) {
      throw new Error(\`Cannot cancel order with status: \${this.#status}\`);
    }
    this.#status = 'cancelled';
    return this;
  }

  get status() { return this.#status; }
  get items()  { return [...this.#items]; }
}

export default Order;

// ─── Usage ───
// const order = new Order({ id: 'ord-123', customerId: 'cust-1' });
// order.addItem({ id: 'p1', name: 'Widget', price: 29.99 }, 3);
// order.submit();
// console.log(order.total);  // 89.97
// console.log(order.status); // 'submitted'`,
      explanation: "This entity demonstrates the core principle: business rules live in the domain layer with NO external dependencies. The Order class uses private fields (#items, #status), validates invariants in every method (can't modify after submission, can't submit empty orders), and exposes getters that return copies of internal state. Notice there are zero imports from any framework — this class works identically whether your app uses Express, Fastify, PostgreSQL, or MongoDB.",
      order_index: 1,
    },
    {
      title: "Value Objects — Immutable Domain Primitives",
      description: "Value Objects are immutable objects identified by their attributes rather than an ID. They encapsulate validation and domain-specific operations, ensuring invalid values never enter the system.",
      language: "javascript",
      code: `// domain/value-objects/Email.js
class Email {
  #value;

  constructor(address) {
    if (!address || typeof address !== 'string') {
      throw new Error('Email address is required');
    }
    const normalized = address.trim().toLowerCase();
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error(\`Invalid email format: \${address}\`);
    }
    this.#value = normalized;
    Object.freeze(this);
  }

  get value() { return this.#value; }
  toString()  { return this.#value; }

  equals(other) {
    return other instanceof Email && this.#value === other.value;
  }

  get domain() {
    return this.#value.split('@')[1];
  }
}

// domain/value-objects/Money.js
class Money {
  constructor(amount, currency = 'USD') {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    this.amount = Math.round(amount * 100) / 100; // round to cents
    this.currency = currency.toUpperCase();
    Object.freeze(this);
  }

  add(other) {
    this.#assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other) {
    this.#assertSameCurrency(other);
    if (this.amount < other.amount) {
      throw new Error('Result would be negative');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor) {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other) {
    return other instanceof Money
      && this.amount === other.amount
      && this.currency === other.currency;
  }

  toString() {
    return \`\${this.currency} \${this.amount.toFixed(2)}\`;
  }

  #assertSameCurrency(other) {
    if (this.currency !== other.currency) {
      throw new Error(
        \`Currency mismatch: \${this.currency} vs \${other.currency}\`
      );
    }
  }
}

// ─── Usage ───
// const email = new Email('Alice@Example.COM');
// console.log(email.value);   // 'alice@example.com'
// console.log(email.domain);  // 'example.com'
//
// const price = new Money(29.99, 'USD');
// const tax = price.multiply(0.08);  // Money { amount: 2.40, currency: 'USD' }
// const total = price.add(tax);      // Money { amount: 32.39, currency: 'USD' }`,
      explanation: "Value Objects enforce domain rules at the type level. An Email always contains a valid, normalized email address. A Money always has a non-negative amount with correct currency. Both are immutable (Object.freeze) — you can't accidentally mutate them. They return NEW instances from operations (add, multiply), preventing side effects. In interviews, explain that Value Objects eliminate 'primitive obsession' — instead of passing raw strings and numbers around, you pass self-validating domain types.",
      order_index: 2,
    },
    {
      title: "Use Case — Application Business Rules",
      description: "A Use Case orchestrates the application flow, coordinating domain entities and infrastructure ports. It contains application-specific logic (what the system DOES) but delegates business rules to entities (what the business IS).",
      language: "javascript",
      code: `// application/use-cases/CreateOrder.js
// Only imports from domain layer (entities) — never from infrastructure

import Order from '../../domain/entities/Order.js';

class CreateOrderUseCase {
  // Dependencies injected via constructor (Dependency Inversion)
  constructor({ orderRepository, productRepository, paymentGateway, eventBus }) {
    this.orderRepo = orderRepository;
    this.productRepo = productRepository;
    this.payment = paymentGateway;
    this.eventBus = eventBus;
  }

  async execute({ customerId, items, paymentMethodId }) {
    // Step 1: Load products from repository (port)
    const products = await Promise.all(
      items.map(i => this.productRepo.findById(i.productId))
    );

    const missing = products.findIndex(p => p === null);
    if (missing !== -1) {
      throw new Error(\`Product not found: \${items[missing].productId}\`);
    }

    // Step 2: Create and populate domain entity
    // Business rules (validation, totals) are in the entity
    const order = new Order({
      id: crypto.randomUUID(),
      customerId,
    });

    for (let i = 0; i < products.length; i++) {
      order.addItem(products[i], items[i].quantity);
    }

    // Step 3: Submit order (entity validates itself)
    order.submit();

    // Step 4: Charge payment (via port — not directly calling Stripe)
    const paymentResult = await this.payment.charge({
      customerId,
      amount: order.total,
      currency: 'USD',
      paymentMethodId,
    });

    if (!paymentResult.success) {
      throw new Error(\`Payment failed: \${paymentResult.error}\`);
    }

    // Step 5: Persist order (via repository port)
    await this.orderRepo.save(order);

    // Step 6: Publish domain event (via event bus port)
    await this.eventBus.publish('order.created', {
      orderId: order.id,
      customerId,
      total: order.total,
    });

    // Step 7: Return output DTO — NOT the entity itself
    return {
      orderId: order.id,
      status: order.status,
      total: order.total,
      itemCount: order.items.length,
      paymentId: paymentResult.paymentId,
    };
  }
}

export default CreateOrderUseCase;`,
      explanation: "This Use Case demonstrates several key Clean Architecture principles: (1) Constructor injection — dependencies are ports, not concrete classes. (2) The use case orchestrates but doesn't contain business rules — Order.addItem() and Order.submit() handle validation. (3) It uses abstractions — orderRepository, paymentGateway, eventBus are all ports. (4) It returns a plain DTO, not the domain entity — outer layers never get direct access to entities. (5) No HTTP concepts — no req, res, status codes. The controller handles that translation.",
      order_index: 3,
    },
    {
      title: "Port & Adapter — Repository Pattern",
      description: "Ports define abstract interfaces in the application layer. Adapters provide concrete implementations in the infrastructure layer. This example shows a UserRepository port and its PostgreSQL adapter.",
      language: "javascript",
      code: `// ═══ PORT (Application Layer) ═══
// application/ports/UserRepository.js
// Defines WHAT the application needs, not HOW it's done

class UserRepository {
  async findById(id) {
    throw new Error('UserRepository.findById() not implemented');
  }
  async findByEmail(email) {
    throw new Error('UserRepository.findByEmail() not implemented');
  }
  async save(user) {
    throw new Error('UserRepository.save() not implemented');
  }
  async delete(id) {
    throw new Error('UserRepository.delete() not implemented');
  }
  async findAll({ page, limit, sortBy }) {
    throw new Error('UserRepository.findAll() not implemented');
  }
}
export default UserRepository;


// ═══ ADAPTER (Infrastructure Layer) ═══
// infrastructure/database/PostgresUserRepository.js

import UserRepository from '../../application/ports/UserRepository.js';
import User from '../../domain/entities/User.js';

class PostgresUserRepository extends UserRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE id = $1', [id]
    );
    return rows[0] ? this.#toDomain(rows[0]) : null;
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase()]
    );
    return rows[0] ? this.#toDomain(rows[0]) : null;
  }

  async save(user) {
    await this.pool.query(
      \`INSERT INTO users (id, email, name, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role\`,
      [user.id, user.email, user.name, user.passwordHash, user.role, user.createdAt]
    );
    return user;
  }

  async delete(id) {
    const { rowCount } = await this.pool.query(
      'DELETE FROM users WHERE id = $1', [id]
    );
    return rowCount > 0;
  }

  async findAll({ page = 1, limit = 20, sortBy = 'created_at' }) {
    const offset = (page - 1) * limit;
    const { rows } = await this.pool.query(
      \`SELECT * FROM users ORDER BY \${sortBy} LIMIT $1 OFFSET $2\`,
      [limit, offset]
    );
    return rows.map(row => this.#toDomain(row));
  }

  // Private: maps database row to domain entity
  #toDomain(row) {
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
    });
  }
}

export default PostgresUserRepository;`,
      explanation: "The Port (UserRepository base class) lives in the application layer and defines WHAT operations are available. The Adapter (PostgresUserRepository) lives in the infrastructure layer and defines HOW those operations work with PostgreSQL. Key benefits: (1) Use cases depend on the port, not PostgreSQL — they're testable without a database. (2) Swapping to MongoDB means creating a MongoUserRepository that extends the same port — zero changes to use cases. (3) The #toDomain mapper ensures database-specific column names (snake_case) are translated to domain entity properties (camelCase).",
      order_index: 4,
    },
  ],

  'implementing-clean-architecture-nodejs': [
    {
      title: "Composition Root — Dependency Injection Wiring",
      description: "The Composition Root is the ONLY place in the application that knows about all concrete implementations. It instantiates infrastructure, wires use cases with their dependencies, and creates controllers. Everything else depends on abstractions.",
      language: "javascript",
      code: `// infrastructure/di-container.js — THE COMPOSITION ROOT
// This is the ONLY file that imports concrete implementations

import pg from 'pg';
import Redis from 'ioredis';

// ─── Infrastructure (Adapters) ───
import { PostgresUserRepository } from './database/PostgresUserRepository.js';
import { PostgresOrderRepository } from './database/PostgresOrderRepository.js';
import { PostgresProductRepository } from './database/PostgresProductRepository.js';
import { StripePaymentGateway } from './external-services/StripePaymentGateway.js';
import { SendGridEmailService } from './external-services/SendGridEmailService.js';
import { RedisCacheAdapter } from './cache/RedisCacheAdapter.js';
import { BcryptPasswordHasher } from './security/BcryptPasswordHasher.js';
import { NodeEventBus } from './events/NodeEventBus.js';

// ─── Use Cases ───
import { CreateUserUseCase } from '../application/use-cases/user/CreateUser.js';
import { GetUserByIdUseCase } from '../application/use-cases/user/GetUserById.js';
import { CreateOrderUseCase } from '../application/use-cases/order/CreateOrder.js';
import { CancelOrderUseCase } from '../application/use-cases/order/CancelOrder.js';
import { GetOrderHistoryUseCase } from '../application/use-cases/order/GetOrderHistory.js';

// ─── Controllers ───
import { UserController } from '../adapters/controllers/UserController.js';
import { OrderController } from '../adapters/controllers/OrderController.js';

// ═══ STEP 1: Create infrastructure instances ═══
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL);

const userRepo    = new PostgresUserRepository(pool);
const orderRepo   = new PostgresOrderRepository(pool);
const productRepo = new PostgresProductRepository(pool);
const payment     = new StripePaymentGateway(process.env.STRIPE_SECRET_KEY);
const email       = new SendGridEmailService(process.env.SENDGRID_API_KEY);
const cache       = new RedisCacheAdapter(redis);
const hasher      = new BcryptPasswordHasher(12); // salt rounds
const eventBus    = new NodeEventBus();

// ═══ STEP 2: Create use cases with injected dependencies ═══
const createUser = new CreateUserUseCase({
  userRepository: userRepo,
  passwordHasher: hasher,
  emailService: email,
});

const getUserById = new GetUserByIdUseCase({
  userRepository: userRepo,
  cache,
});

const createOrder = new CreateOrderUseCase({
  orderRepository: orderRepo,
  productRepository: productRepo,
  paymentGateway: payment,
  eventBus,
});

const cancelOrder = new CancelOrderUseCase({
  orderRepository: orderRepo,
  paymentGateway: payment,
  eventBus,
});

const getOrderHistory = new GetOrderHistoryUseCase({
  orderRepository: orderRepo,
});

// ═══ STEP 3: Create controllers with injected use cases ═══
export const userController = new UserController({
  createUser,
  getUserById,
});

export const orderController = new OrderController({
  createOrder,
  cancelOrder,
  getOrderHistory,
});

// ═══ STEP 4: Graceful shutdown ═══
export async function shutdown() {
  await pool.end();
  await redis.quit();
  console.log('All connections closed');
}`,
      explanation: "The Composition Root follows a strict pattern: (1) Import all concrete implementations. (2) Instantiate infrastructure (database pools, Redis clients). (3) Wire use cases by injecting ports through constructors. (4) Wire controllers by injecting use cases. Notice that use cases receive ABSTRACT names (userRepository, paymentGateway) but receive CONCRETE instances (PostgresUserRepository, StripePaymentGateway). To switch from PostgreSQL to MongoDB, you change ONLY this file — create MongoUserRepository and pass it instead. For testing, create a test composition root that injects fakes.",
      order_index: 1,
    },
    {
      title: "Controller, Presenter, and Express Route Wiring",
      description: "Controllers receive HTTP requests and translate them to use case calls. Presenters format the output. Express routes are thin wrappers that delegate to controllers. This shows the complete flow from HTTP request to response.",
      language: "javascript",
      code: `// ═══ Controller (Adapter Layer) ═══
// adapters/controllers/OrderController.js

export class OrderController {
  constructor({ createOrder, cancelOrder, getOrderHistory }) {
    this.createOrder = createOrder;
    this.cancelOrder = cancelOrder;
    this.getOrderHistory = getOrderHistory;
  }

  // Translates HTTP request → Use Case input DTO
  async create(req, res, next) {
    try {
      const inputDTO = {
        customerId: req.user.id,         // from auth middleware
        items: req.body.items,           // [{ productId, quantity }]
        paymentMethodId: req.body.paymentMethodId,
      };

      const result = await this.createOrder.execute(inputDTO);
      res.status(201).json(OrderPresenter.created(result));
    } catch (error) {
      next(error);  // let error middleware handle it
    }
  }

  async cancel(req, res, next) {
    try {
      const result = await this.cancelOrder.execute({
        orderId: req.params.id,
        userId: req.user.id,
      });
      res.json(OrderPresenter.cancelled(result));
    } catch (error) {
      next(error);
    }
  }

  async history(req, res, next) {
    try {
      const result = await this.getOrderHistory.execute({
        customerId: req.user.id,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      });
      res.json(OrderPresenter.list(result));
    } catch (error) {
      next(error);
    }
  }
}


// ═══ Presenter (Adapter Layer) ═══
// adapters/presenters/OrderPresenter.js

export class OrderPresenter {
  static created(data) {
    return {
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: data.orderId,
        status: data.status,
        total: \`$\${data.total.toFixed(2)}\`,
        itemCount: data.itemCount,
      },
    };
  }

  static cancelled(data) {
    return {
      success: true,
      message: 'Order cancelled',
      data: { orderId: data.orderId, refundId: data.refundId },
    };
  }

  static list(data) {
    return {
      success: true,
      data: data.orders.map(o => ({
        id: o.id,
        status: o.status,
        total: \`$\${o.total.toFixed(2)}\`,
        createdAt: o.createdAt.toISOString(),
      })),
      pagination: {
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      },
    };
  }
}


// ═══ Express Routes (Framework Layer) ═══
// infrastructure/web/routes.js

import { Router } from 'express';
import { orderController } from '../di-container.js';
import { authMiddleware } from './middleware/auth.js';

const router = Router();

// Routes are THIN — they only connect HTTP to controllers
router.post('/orders',
  authMiddleware,
  (req, res, next) => orderController.create(req, res, next)
);

router.delete('/orders/:id',
  authMiddleware,
  (req, res, next) => orderController.cancel(req, res, next)
);

router.get('/orders/history',
  authMiddleware,
  (req, res, next) => orderController.history(req, res, next)
);

export default router;`,
      explanation: "This example shows the complete HTTP flow: (1) Express routes are thin glue — they apply middleware and delegate to controllers. (2) Controllers translate HTTP concepts (req.body, req.params, req.query) into plain DTOs and call use cases. (3) Presenters format use case output into HTTP-friendly JSON (adding success flags, formatting currency, structuring pagination). The key insight: if you replaced Express with Fastify or Hapi, you'd only change the routes file. Controllers and presenters have minimal framework coupling. The use cases and entities don't change at all.",
      order_index: 2,
    },
    {
      title: "DTOs and Mappers — Data Transformation Between Layers",
      description: "DTOs carry data across layer boundaries. Mappers convert between domain entities, persistence formats, and API responses. This ensures each layer works with its own data shape without exposing internal details.",
      language: "javascript",
      code: `// ═══ Input DTO with Validation ═══
// application/dto/CreateOrderDTO.js

export class CreateOrderDTO {
  constructor({ customerId, items, paymentMethodId }) {
    this.customerId = customerId;
    this.items = items;
    this.paymentMethodId = paymentMethodId;
  }

  static fromRequest(body, userId) {
    const errors = [];

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (body.items) {
      body.items.forEach((item, i) => {
        if (!item.productId) errors.push(\`Item \${i}: productId required\`);
        if (!item.quantity || item.quantity < 1) {
          errors.push(\`Item \${i}: quantity must be >= 1\`);
        }
      });
    }

    if (!body.paymentMethodId) {
      errors.push('Payment method is required');
    }

    if (errors.length > 0) {
      const err = new Error(\`Validation failed: \${errors.join('; ')}\`);
      err.name = 'ValidationError';
      throw err;
    }

    return new CreateOrderDTO({
      customerId: userId,
      items: body.items.map(i => ({
        productId: i.productId,
        quantity: parseInt(i.quantity, 10),
      })),
      paymentMethodId: body.paymentMethodId,
    });
  }
}


// ═══ Mapper — Converts Between Layer Representations ═══
// adapters/mappers/OrderMapper.js

import Order from '../../domain/entities/Order.js';

export class OrderMapper {
  // Domain Entity → Database Row (for persistence)
  static toPersistence(order) {
    return {
      id: order.id,
      customer_id: order.customerId,
      status: order.status,
      total_amount: order.total,
      items_json: JSON.stringify(order.items),
      created_at: order.createdAt,
      updated_at: new Date(),
    };
  }

  // Database Row → Domain Entity (for retrieval)
  static toDomain(row) {
    const order = new Order({
      id: row.id,
      customerId: row.customer_id,
      createdAt: row.created_at,
    });

    const items = JSON.parse(row.items_json);
    items.forEach(item => {
      order.addItem(
        {
          id: item.productId,
          name: item.name,
          price: item.unitPrice,
          isAvailable: () => true,  // already validated at creation
        },
        item.quantity
      );
    });

    return order;
  }

  // Domain Entity → API Response DTO (for controllers)
  static toResponse(order) {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      total: order.total,
      items: order.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
      })),
      createdAt: order.createdAt.toISOString(),
    };
  }

  // List of entities → List of response DTOs
  static toResponseList(orders) {
    return orders.map(order => OrderMapper.toResponse(order));
  }
}`,
      explanation: "DTOs and Mappers solve the 'impedance mismatch' between layers. The database uses snake_case columns and JSON strings; the domain uses camelCase properties and proper objects; the API uses a different subset of fields with formatted values. Mappers centralize these transformations so that: (1) Entities never contain persistence logic. (2) Database schema changes only affect the mapper, not use cases. (3) API response format can change independently of the domain. The CreateOrderDTO.fromRequest() method validates raw HTTP input before it reaches the use case — invalid data is rejected before touching business logic.",
      order_index: 3,
    },
    {
      title: "Error Handling Across Layers",
      description: "Each layer defines its own error types. A centralized error-handling middleware at the outermost boundary translates domain errors into appropriate HTTP responses, keeping inner layers HTTP-agnostic.",
      language: "javascript",
      code: `// ═══ Domain Layer Errors ═══
// domain/errors/DomainError.js
export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
  }
}

// domain/errors/ValidationError.js
export class ValidationError extends DomainError {
  constructor(field, reason) {
    super(\`Validation failed for '\${field}': \${reason}\`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ═══ Application Layer Errors ═══
// application/errors/NotFoundError.js
export class NotFoundError extends Error {
  constructor(entity, identifier) {
    super(\`\${entity} not found: \${identifier}\`);
    this.name = 'NotFoundError';
    this.entity = entity;
    this.identifier = identifier;
  }
}

// application/errors/AuthorizationError.js
export class AuthorizationError extends Error {
  constructor(action, resource) {
    super(\`Not authorized to \${action} on \${resource}\`);
    this.name = 'AuthorizationError';
    this.action = action;
    this.resource = resource;
  }
}

// application/errors/ConflictError.js
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

// ═══ Infrastructure Layer — Error Middleware ═══
// infrastructure/web/middleware/errorHandler.js

export function errorHandler(err, req, res, next) {
  // Log the full error for debugging
  console.error(\`[\${new Date().toISOString()}] \${err.name}: \${err.message}\`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Map error types to HTTP status codes
  const errorMap = {
    ValidationError:    { status: 400, expose: true },
    DomainError:        { status: 400, expose: true },
    AuthorizationError: { status: 403, expose: true },
    NotFoundError:      { status: 404, expose: true },
    ConflictError:      { status: 409, expose: true },
  };

  const mapped = errorMap[err.name];

  if (mapped) {
    return res.status(mapped.status).json({
      success: false,
      error: {
        type: err.name,
        message: mapped.expose ? err.message : 'An error occurred',
        ...(err.field && { field: err.field }),
      },
    });
  }

  // Unknown errors — don't leak internals in production
  res.status(500).json({
    success: false,
    error: {
      type: 'InternalError',
      message: process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal Server Error',
    },
  });
}

// ═══ Wiring in Express ═══
// infrastructure/web/express-app.js
import express from 'express';
import routes from './routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);  // MUST be last middleware

export default app;`,
      explanation: "Error handling in Clean Architecture follows the Dependency Rule: domain errors know nothing about HTTP. The flow is: (1) Entities throw DomainError/ValidationError when business rules are violated. (2) Use Cases throw NotFoundError/AuthorizationError for application-level failures. (3) Controllers catch nothing — they call next(error) to delegate. (4) The errorHandler middleware at the Express level maps error types to HTTP status codes. This means adding a new error type (e.g., RateLimitError → 429) requires changes only in the error middleware, not in any use case or entity.",
      order_index: 4,
    },
    {
      title: "Testing Each Layer with Fake Adapters",
      description: "Clean Architecture's greatest practical benefit is testability. Entity tests need no mocks. Use case tests use fake adapters. Integration tests use real databases. This example shows all three testing approaches.",
      language: "javascript",
      code: `// ═══ 1. Entity Tests — Pure Unit Tests, No Mocks ═══
// tests/unit/domain/Order.test.js

import Order from '../../../src/domain/entities/Order.js';

describe('Order Entity', () => {
  const product = {
    id: 'p1', name: 'Widget', price: 25.00,
    isAvailable: () => true,
  };

  test('calculates total with multiple items', () => {
    const order = new Order({ id: 'o1', customerId: 'c1' });
    order.addItem(product, 3);                          // 75.00
    order.addItem({ ...product, id: 'p2', price: 10 }, 2); // 20.00
    expect(order.total).toBe(95.00);
  });

  test('enforces business rule: cannot submit empty order', () => {
    const order = new Order({ id: 'o1', customerId: 'c1' });
    expect(() => order.submit()).toThrow('Cannot submit an empty order');
  });

  test('enforces business rule: cannot modify after submission', () => {
    const order = new Order({ id: 'o1', customerId: 'c1' });
    order.addItem(product, 1);
    order.submit();
    expect(() => order.addItem(product, 1)).toThrow('non-draft');
  });

  test('aggregates duplicate items', () => {
    const order = new Order({ id: 'o1', customerId: 'c1' });
    order.addItem(product, 2);
    order.addItem(product, 3);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(5);
    expect(order.total).toBe(125);
  });
});


// ═══ 2. Use Case Tests — Fake Adapters ═══
// tests/unit/application/CreateOrder.test.js

import CreateOrderUseCase from '../../../src/application/use-cases/order/CreateOrder.js';

// Fake adapters — in-memory implementations of ports
class FakeOrderRepository {
  orders = new Map();
  async save(order) { this.orders.set(order.id, order); }
  async findById(id) { return this.orders.get(id) || null; }
}

class FakeProductRepository {
  #products;
  constructor(products) { this.#products = new Map(products.map(p => [p.id, p])); }
  async findById(id) { return this.#products.get(id) || null; }
}

class FakePaymentGateway {
  charges = [];
  shouldFail = false;
  async charge(details) {
    this.charges.push(details);
    return this.shouldFail
      ? { success: false, error: 'Card declined' }
      : { success: true, paymentId: 'pay_fake_123' };
  }
}

class FakeEventBus {
  events = [];
  async publish(event, data) { this.events.push({ event, data }); }
}

describe('CreateOrderUseCase', () => {
  let orderRepo, productRepo, payment, eventBus, useCase;

  beforeEach(() => {
    orderRepo = new FakeOrderRepository();
    productRepo = new FakeProductRepository([
      { id: 'p1', name: 'Widget', price: 25, isAvailable: () => true },
      { id: 'p2', name: 'Gadget', price: 50, isAvailable: () => true },
    ]);
    payment = new FakePaymentGateway();
    eventBus = new FakeEventBus();
    useCase = new CreateOrderUseCase({
      orderRepository: orderRepo,
      productRepository: productRepo,
      paymentGateway: payment,
      eventBus,
    });
  });

  test('creates order, charges payment, publishes event', async () => {
    const result = await useCase.execute({
      customerId: 'c1',
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
      paymentMethodId: 'pm_123',
    });

    expect(result.status).toBe('submitted');
    expect(result.total).toBe(100);
    expect(result.itemCount).toBe(2);
    expect(payment.charges).toHaveLength(1);
    expect(payment.charges[0].amount).toBe(100);
    expect(eventBus.events).toHaveLength(1);
    expect(eventBus.events[0].event).toBe('order.created');
  });

  test('fails when payment is declined', async () => {
    payment.shouldFail = true;
    await expect(useCase.execute({
      customerId: 'c1',
      items: [{ productId: 'p1', quantity: 1 }],
      paymentMethodId: 'pm_bad',
    })).rejects.toThrow('Payment failed');
  });

  test('fails for non-existent product', async () => {
    await expect(useCase.execute({
      customerId: 'c1',
      items: [{ productId: 'p999', quantity: 1 }],
      paymentMethodId: 'pm_123',
    })).rejects.toThrow('Product not found');
  });
});


// ═══ 3. Adapter Tests — Integration with Real DB ═══
// tests/integration/PostgresOrderRepository.test.js

// These tests run against a real test database
// Use beforeAll/afterAll for connection lifecycle

describe('PostgresOrderRepository (integration)', () => {
  test('persists and retrieves an order', async () => {
    // ... setup pool connected to test database
    // ... insert test order
    // ... retrieve and assert fields match
  });
});`,
      explanation: "This example demonstrates the testing pyramid in Clean Architecture: (1) Entity tests are the fastest — pure JS, no I/O, no mocks. They test business rules directly. (2) Use case tests use Fake adapters — in-memory implementations of ports that record calls for assertions. No database, no HTTP, no Stripe — tests run in milliseconds. (3) Integration tests verify that real adapters (PostgresOrderRepository) work correctly with actual infrastructure. The key insight: because your use cases depend on PORTS (abstractions), you can substitute ANY implementation in tests. Fake adapters are preferred over mocking libraries because they're reusable, explicit, and catch interface mismatches at compile time.",
      order_index: 5,
    },
    {
      title: "Swappable Cache Adapter — Redis and In-Memory",
      description: "Demonstrates the power of ports and adapters by showing a cache port with two interchangeable implementations: Redis for production and an in-memory Map for development/testing.",
      language: "javascript",
      code: `// ═══ Port (Application Layer) ═══
// application/ports/CachePort.js
class CachePort {
  async get(key) { throw new Error('Not implemented'); }
  async set(key, value, ttlSeconds) { throw new Error('Not implemented'); }
  async delete(key) { throw new Error('Not implemented'); }
  async has(key) { throw new Error('Not implemented'); }
}


// ═══ Redis Adapter (Production) ═══
// infrastructure/cache/RedisCacheAdapter.js
class RedisCacheAdapter extends CachePort {
  constructor(redisClient) {
    super();
    this.client = redisClient;
  }

  async get(key) {
    const raw = await this.client.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async set(key, value, ttl = 3600) {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  async delete(key) {
    await this.client.del(key);
  }

  async has(key) {
    return (await this.client.exists(key)) === 1;
  }
}


// ═══ In-Memory Adapter (Dev/Test) ═══
// infrastructure/cache/MemoryCacheAdapter.js
class MemoryCacheAdapter extends CachePort {
  #store = new Map();

  async get(key) {
    const entry = this.#store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.#store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttl = 3600) {
    this.#store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async delete(key) {
    this.#store.delete(key);
  }

  async has(key) {
    const val = await this.get(key); // triggers expiry check
    return val !== null;
  }

  // Testing utility
  clear() {
    this.#store.clear();
  }
}


// ═══ Use Case — Cache-Aside Pattern ═══
// application/use-cases/user/GetUserById.js
class GetUserByIdUseCase {
  constructor({ userRepository, cache }) {
    this.userRepo = userRepository;
    this.cache = cache;
  }

  async execute(userId) {
    // 1. Check cache first
    const cacheKey = \`user:\${userId}\`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // 2. Load from database
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // 3. Store in cache for next time
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    await this.cache.set(cacheKey, userData, 600); // 10 min TTL

    return userData;
  }
}

// ═══ Composition Root Swap ═══
// In production:  cache = new RedisCacheAdapter(redisClient);
// In tests:       cache = new MemoryCacheAdapter();
// In development: cache = new MemoryCacheAdapter();`,
      explanation: "This example shows the concrete value of ports and adapters. The GetUserByIdUseCase depends on a CachePort abstraction. In production, it receives a RedisCacheAdapter backed by a real Redis instance. In tests, it receives a MemoryCacheAdapter that uses a simple Map — no Redis server needed. Both adapters implement identical behavior (get/set/delete/has with TTL), so the use case works identically regardless of which adapter is injected. The swap happens in exactly one place: the Composition Root. This pattern is especially powerful in interviews — it demonstrates understanding of DIP, testability, and practical architecture.",
      order_index: 6,
    },
    {
      title: "Complete Express Application with Clean Architecture",
      description: "A full, runnable Express application showing how all layers come together: entry point, route wiring, middleware, error handling, and graceful shutdown — all organized according to Clean Architecture principles.",
      language: "javascript",
      code: `// ═══ Entry Point ═══
// src/main.js
import app from './infrastructure/web/express-app.js';
import { shutdown } from './infrastructure/di-container.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

// Graceful shutdown
const signals = ['SIGTERM', 'SIGINT'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(\`\${signal} received, shutting down...\`);
    server.close(async () => {
      await shutdown(); // close DB pool, Redis, etc.
      process.exit(0);
    });
  });
});


// ═══ Express App Setup ═══
// infrastructure/web/express-app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();

// Framework-level middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);

// Routes (thin wrappers around controllers)
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Health check (infrastructure concern, not a use case)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: \`Route not found: \${req.method} \${req.path}\` },
  });
});

// Error handler (MUST be last)
app.use(errorHandler);

export default app;


// ═══ Route Files ═══
// infrastructure/web/routes/userRoutes.js
import { Router } from 'express';
import { userController } from '../../di-container.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res, next) =>
  userController.register(req, res, next)
);

router.get('/me', authMiddleware, (req, res, next) =>
  userController.getById(req, res, next)
);

export default router;`,
      explanation: "This shows the complete wiring of a Clean Architecture Express application. Notice the clear boundary: main.js is the composition root entry point. express-app.js is pure framework configuration (middleware, routes, error handling). Route files are thin — they import pre-wired controllers from the DI container and delegate immediately. No business logic exists at this layer. The entire Express setup could be replaced with Fastify by changing only the infrastructure/web directory — the domain, application, and adapter layers remain untouched. Graceful shutdown is handled at the infrastructure level, closing database pools and Redis connections.",
      order_index: 7,
    },
  ],
};
