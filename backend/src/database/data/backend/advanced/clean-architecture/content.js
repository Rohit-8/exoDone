// ============================================================================
// Clean Architecture — Content
// ============================================================================

export const topic = {
  name: "Clean Architecture",
  slug: "clean-architecture",
  description: "Design maintainable, testable, and framework-independent systems using Robert C. Martin's Clean Architecture principles, the Dependency Rule, layered separation, and SOLID-based design strategies.",
  order_index: 7
};

export const lessons = [
  {
    slug: "clean-architecture-principles",
    title: "Clean Architecture Principles",
    order_index: 1,
    content: `# Clean Architecture Principles

## Introduction to Clean Architecture

Clean Architecture is a software design philosophy introduced by **Robert C. Martin (Uncle Bob)** in his 2012 blog post and later expanded in his 2017 book *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. It synthesizes ideas from several earlier architectural patterns:

- **Hexagonal Architecture** (Alistair Cockburn, 2005) — also called Ports & Adapters
- **Onion Architecture** (Jeffrey Palermo, 2008)
- **BCE (Boundary-Control-Entity)** (Ivar Jacobson, 1992)

All of these architectures share a common objective: **separation of concerns** through layering, with the core business logic at the center, independent of external frameworks, databases, and delivery mechanisms.

### The Central Goal

> *"The goal of software architecture is to minimize the human resources required to build and maintain the required system."*
> — Robert C. Martin

Clean Architecture achieves this by ensuring that:

1. **Business rules are isolated** from infrastructure concerns
2. **Frameworks are tools**, not constraints — they can be swapped without rewriting business logic
3. **Testability is built-in** — core logic can be tested without databases, web servers, or external services
4. **The system is independent of the UI** — a web UI, CLI, or API can be swapped without touching core logic

---

## The Dependency Rule

The **Dependency Rule** is the single most important concept in Clean Architecture:

> **Source code dependencies must only point inward. Nothing in an inner circle can know anything at all about something in an outer circle.**

This means:

- **Entities** know nothing about Use Cases, Controllers, or the Database
- **Use Cases** know about Entities but nothing about Controllers or Frameworks
- **Interface Adapters** know about Use Cases but nothing about specific Frameworks
- **Frameworks & Drivers** know about everything (they are the outermost layer)

\`\`\`
┌─────────────────────────────────────────────────────────┐
│              Frameworks & Drivers                       │
│   (Express, PostgreSQL, Redis, SendGrid, AWS S3)        │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Interface Adapters                      │  │
│  │   (Controllers, Presenters, Gateways, Mappers)    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │          Use Cases                          │  │  │
│  │  │   (Application Business Rules)              │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │          Entities                     │  │  │  │
│  │  │  │   (Enterprise Business Rules)         │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

         Dependencies always point INWARD →
\`\`\`

### Why Inward Dependencies Matter

When inner layers depend on outer layers, changing a database or framework forces changes to business logic. By inverting this, the core remains stable even when infrastructure changes:

| Scenario | Without Clean Arch | With Clean Arch |
|---|---|---|
| Switch from PostgreSQL to MongoDB | Rewrite business logic, services, controllers | Change only the repository adapter |
| Replace Express with Fastify | Modify every route handler and middleware | Change only the HTTP adapter layer |
| Add a CLI interface | Duplicate business logic | Create a new CLI adapter, reuse use cases |
| Write unit tests | Need database and server running | Test entities and use cases in isolation |

---

## Layer 1: Entities (Enterprise Business Rules)

Entities are the **innermost layer**. They encapsulate the most general and high-level business rules of the enterprise. An entity can be an object with methods, or it can be a set of data structures and functions.

### Characteristics of Entities

- **Framework-agnostic**: No imports from Express, Sequelize, Mongoose, etc.
- **Database-agnostic**: No SQL queries, no ORM decorators
- **Self-validating**: Entities enforce their own invariants
- **Pure business logic**: They represent what the business IS, not how the system works
- **Least likely to change**: When external systems change, entities remain stable

\`\`\`javascript
// domain/entities/User.js — A pure Entity
class User {
  constructor({ id, email, name, passwordHash, role, createdAt }) {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this.id = id;
    this.email = email.toLowerCase();
    this.name = name.trim();
    this.passwordHash = passwordHash;
    this.role = role || 'user';
    this.createdAt = createdAt || new Date();
  }

  isAdmin() {
    return this.role === 'admin';
  }

  canAccessResource(resource) {
    if (this.isAdmin()) return true;
    return resource.ownerId === this.id;
  }

  updateProfile({ name, email }) {
    if (name) this.name = name.trim();
    if (email) {
      if (!email.includes('@')) throw new Error('Invalid email');
      this.email = email.toLowerCase();
    }
  }
}
\`\`\`

### Value Objects

Value Objects complement Entities. They are **immutable** objects defined entirely by their attributes, with no identity:

\`\`\`javascript
// domain/value-objects/Money.js
class Money {
  constructor(amount, currency = 'USD') {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    this.amount = amount;
    this.currency = currency;
    Object.freeze(this);
  }

  add(other) {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor) {
    return new Money(
      Math.round(this.amount * factor * 100) / 100,
      this.currency
    );
  }

  equals(other) {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
\`\`\`

---

## Layer 2: Use Cases (Application Business Rules)

Use Cases contain **application-specific** business rules. They orchestrate the flow of data to and from Entities and direct those Entities to use their enterprise business rules.

### Characteristics of Use Cases

- **One class per use case**: Single Responsibility Principle in action
- **Coordinate entities**: They call entity methods but don't contain business rules themselves
- **Define ports**: They declare interfaces (ports) for the external services they need
- **Framework-independent**: No HTTP concepts (req, res), no database queries
- **Accept Input DTOs, return Output DTOs**: Data flows through defined boundaries

\`\`\`javascript
// application/use-cases/CreateOrder.js
class CreateOrderUseCase {
  constructor({ orderRepository, productRepository, paymentGateway, notifier }) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.paymentGateway = paymentGateway;
    this.notifier = notifier;
  }

  async execute(inputDTO) {
    // 1. Validate and load products
    const products = await Promise.all(
      inputDTO.items.map(item =>
        this.productRepository.findById(item.productId)
      )
    );

    // 2. Create domain entity (business rules enforced here)
    const order = new Order(crypto.randomUUID(), inputDTO.customerId);
    for (let i = 0; i < products.length; i++) {
      order.addItem(products[i], inputDTO.items[i].quantity);
    }
    order.submit(); // entity validates itself

    // 3. Charge payment (through port)
    await this.paymentGateway.charge(inputDTO.customerId, order.total);

    // 4. Persist (through port)
    await this.orderRepository.save(order);

    // 5. Notify (through port)
    await this.notifier.send(
      inputDTO.customerId,
      \`Order \${order.id} confirmed — total: $\${order.total}\`
    );

    // 6. Return output DTO
    return {
      orderId: order.id,
      total: order.total,
      itemCount: order.items.length,
      status: order.status,
    };
  }
}
\`\`\`

### Ports (Interfaces)

Ports define the **contracts** that outer layers must fulfill. Use Cases depend on these abstractions, not on concrete implementations:

\`\`\`javascript
// application/ports/OrderRepository.js — PORT (interface)
class OrderRepository {
  async findById(id)       { throw new Error('Not implemented'); }
  async findByCustomer(id) { throw new Error('Not implemented'); }
  async save(order)        { throw new Error('Not implemented'); }
  async delete(id)         { throw new Error('Not implemented'); }
}
\`\`\`

---

## Layer 3: Interface Adapters (Controllers, Presenters, Gateways)

Interface Adapters **convert data** between the format most convenient for the Use Cases and Entities, and the format most convenient for external agencies like databases and the web.

### This layer includes:

1. **Controllers** — receive HTTP requests, translate them into Use Case input DTOs, invoke use cases
2. **Presenters** — format Use Case output DTOs into view-appropriate data (JSON, HTML, etc.)
3. **Gateways** — implement port interfaces with concrete technology (PostgreSQL, Redis, Stripe)
4. **Mappers / DTOs** — transform data between layers

\`\`\`javascript
// adapters/controllers/OrderController.js
class OrderController {
  constructor(createOrderUseCase, getOrderUseCase) {
    this.createOrderUseCase = createOrderUseCase;
    this.getOrderUseCase = getOrderUseCase;
  }

  async create(req, res) {
    try {
      const inputDTO = {
        customerId: req.user.id,  // from auth middleware
        items: req.body.items,
      };
      const result = await this.createOrderUseCase.execute(inputDTO);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('empty')) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }
}
\`\`\`

---

## Layer 4: Frameworks & Drivers

The **outermost layer** is composed of frameworks and tools — the database, the web framework, message queues, third-party services. This layer:

- Contains **no business logic**
- Is the most **volatile** layer (frameworks update, APIs change)
- **Glues everything together**: wiring routes, setting up middleware, database connections

\`\`\`javascript
// frameworks/express/app.js
import express from 'express';
import { createOrderController } from './di-container.js';

const app = express();
app.use(express.json());

// Routes simply delegate to controllers
app.post('/api/orders', (req, res) =>
  createOrderController.create(req, res)
);
app.get('/api/orders/:id', (req, res) =>
  createOrderController.getById(req, res)
);

app.listen(3000);
\`\`\`

---

## SOLID Principles in Clean Architecture

Clean Architecture is deeply rooted in the **SOLID principles**. Each principle maps directly to an architectural decision:

### 1. Single Responsibility Principle (SRP)

> *A module should have one, and only one, reason to change.*

Each class has one reason to change. Entities change only when business rules change. Controllers change only when the HTTP contract changes. Repositories change only when the data access strategy changes.

**In practice**: One use case class per user action. \`CreateOrder\`, \`CancelOrder\`, \`GetOrderHistory\` are all separate classes, even though they deal with the same entity.

### 2. Open/Closed Principle (OCP)

> *Software entities should be open for extension, but closed for modification.*

The system is open for extension (add new adapters, new use cases, new delivery mechanisms) but closed for modification (existing code doesn't change when adding new features).

**In practice**: Adding GraphQL support means creating a new GraphQL adapter that calls the same use cases. The use cases and entities are never modified.

### 3. Liskov Substitution Principle (LSP)

> *Objects of a superclass should be replaceable with objects of a subclass without affecting correctness.*

Any adapter implementing a port can be substituted without breaking the use case. A \`MongoUserRepository\` can replace \`PostgresUserRepository\` seamlessly because both fulfill the same \`UserRepository\` port contract.

**In practice**: \`FakeUserRepository\` in tests, \`PostgresUserRepository\` in production — the use case works identically with both.

### 4. Interface Segregation Principle (ISP)

> *Clients should not be forced to depend on methods they do not use.*

Ports are narrow and specific. Instead of one giant \`Database\` interface with hundreds of methods, you have focused \`UserRepository\`, \`OrderRepository\`, \`ProductRepository\` ports — each with only the methods that their consumers need.

**In practice**: The \`CreateOrderUseCase\` depends on \`OrderRepository\` (with \`save()\`) and \`ProductRepository\` (with \`findById()\`), not on a monolithic \`Database\` object.

### 5. Dependency Inversion Principle (DIP)

> *High-level modules should not depend on low-level modules. Both should depend on abstractions.*

This is the architectural embodiment of DIP. Use Cases (high-level) depend on Ports (abstractions), not on PostgreSQL or Redis (low-level). The Composition Root wires concrete implementations to those abstractions.

**In practice**: \`CreateOrderUseCase\` receives an \`orderRepository\` parameter typed to the \`OrderRepository\` port interface. It never imports \`PostgresOrderRepository\` directly.

---

## Benefits of Clean Architecture

| Benefit | How It's Achieved |
|---|---|
| **Testability** | Use cases and entities can be tested without frameworks, databases, or external services |
| **Framework Independence** | Express, Fastify, Koa — the framework is a detail, not a commitment |
| **Database Independence** | PostgreSQL, MongoDB, DynamoDB — swap by changing only the adapter |
| **UI Independence** | REST API, GraphQL, CLI, WebSocket — all can coexist using the same use cases |
| **Maintainability** | Changes are localized to the appropriate layer; a database bug can't hide in business logic |
| **Team Scalability** | Different teams can work on different layers independently with clear contracts |
| **Longevity** | Business logic survives framework migrations, database changes, and API redesigns |
| **Deferred Decisions** | You can start with SQLite and switch to PostgreSQL later without rewriting the application |

---

## When to Use Clean Architecture

### Good Fit

- **Enterprise applications** with complex, evolving business rules
- **Long-lived projects** expected to outlast any single framework version
- **Systems requiring multiple interfaces** (web, mobile API, CLI, event-driven consumers)
- **Microservices** where each service has distinct bounded contexts
- **Projects with strict testing requirements** or regulatory compliance
- **Teams larger than 3-4 developers** who need clear boundaries and contracts

### Not Ideal For

- **Simple CRUD applications** with little to no business logic — the overhead isn't justified
- **Prototypes and MVPs** where speed of initial delivery is the highest priority
- **Small scripts or utilities** that don't need layered architecture
- **Projects with a single developer** who can hold the entire system in their head
- **Short-lived or throwaway code** where maintainability doesn't matter

### The Pragmatic Approach

> *"Architecture is about the important decisions that shape the system. Not every decision is important, and not every system needs the same level of architecture."*

Start with a simpler structure (e.g., simple MVC or feature folders) and **evolve toward Clean Architecture** as complexity grows. The key indicators that you need it:

1. Business logic is leaking into controllers or database queries
2. Tests require spinning up a database or HTTP server
3. Changing a framework or library forces changes across the codebase
4. Team members step on each other's toes because concerns aren't separated

---

## Key Terminology Summary

| Term | Definition |
|---|---|
| **Entity** | Object embodying enterprise-wide business rules; framework-agnostic and self-validating |
| **Use Case** | Application-specific business rule orchestrator; one per user action |
| **Port** | Abstract interface defining how the application communicates with the outside world |
| **Adapter** | Concrete implementation of a port (e.g., PostgresUserRepository, StripePaymentGateway) |
| **DTO** | Data Transfer Object — simple data carrier between layers with no business logic |
| **Mapper** | Converts data between representations (domain ↔ persistence, domain ↔ API response) |
| **Composition Root** | The single place where all dependencies are instantiated and wired together |
| **Dependency Rule** | Source code dependencies must only point inward toward higher-level policies |
| **Driving Adapter** | Adapter that calls into the application (Controller, CLI handler, event listener) |
| **Driven Adapter** | Adapter called by the application through ports (Repository, Payment Gateway, Mailer) |
| **Value Object** | Immutable object with no identity, defined entirely by its attributes (Money, Email, Address) |
| **Invariant** | A business rule that must always be true (e.g., "an order cannot have negative quantity") |
`
  },
  {
    slug: "implementing-clean-architecture-nodejs",
    title: "Implementing Clean Architecture in Node.js",
    order_index: 2,
    content: `# Implementing Clean Architecture in Node.js

## Project Structure

A well-organized folder structure is crucial. Each top-level directory corresponds to a Clean Architecture layer:

\`\`\`
project-root/
├── src/
│   ├── domain/                  # Layer 1: Entities & Value Objects
│   │   ├── entities/
│   │   │   ├── User.js
│   │   │   ├── Order.js
│   │   │   └── Product.js
│   │   ├── value-objects/
│   │   │   ├── Email.js
│   │   │   ├── Money.js
│   │   │   └── Address.js
│   │   └── errors/
│   │       ├── DomainError.js
│   │       └── ValidationError.js
│   │
│   ├── application/             # Layer 2: Use Cases & Ports
│   │   ├── use-cases/
│   │   │   ├── user/
│   │   │   │   ├── CreateUser.js
│   │   │   │   ├── GetUserById.js
│   │   │   │   └── UpdateUserProfile.js
│   │   │   └── order/
│   │   │       ├── CreateOrder.js
│   │   │       ├── CancelOrder.js
│   │   │       └── GetOrderHistory.js
│   │   ├── ports/
│   │   │   ├── UserRepository.js
│   │   │   ├── OrderRepository.js
│   │   │   ├── PaymentGateway.js
│   │   │   └── EmailService.js
│   │   └── dto/
│   │       ├── CreateUserDTO.js
│   │       └── OrderResponseDTO.js
│   │
│   ├── adapters/                # Layer 3: Interface Adapters
│   │   ├── controllers/
│   │   │   ├── UserController.js
│   │   │   └── OrderController.js
│   │   ├── presenters/
│   │   │   ├── UserPresenter.js
│   │   │   └── OrderPresenter.js
│   │   └── mappers/
│   │       ├── UserMapper.js
│   │       └── OrderMapper.js
│   │
│   ├── infrastructure/          # Layer 4: Frameworks & Drivers
│   │   ├── database/
│   │   │   ├── PostgresUserRepository.js
│   │   │   ├── PostgresOrderRepository.js
│   │   │   └── connection.js
│   │   ├── external-services/
│   │   │   ├── StripePaymentGateway.js
│   │   │   └── SendGridEmailService.js
│   │   ├── web/
│   │   │   ├── express-app.js
│   │   │   ├── routes.js
│   │   │   └── middleware/
│   │   │       ├── auth.js
│   │   │       └── errorHandler.js
│   │   └── di-container.js      # Composition Root
│   │
│   └── main.js                  # Entry point
│
└── tests/
    ├── unit/
    │   ├── domain/
    │   └── application/
    ├── integration/
    │   └── infrastructure/
    └── fakes/
        ├── FakeUserRepository.js
        └── FakePaymentGateway.js
\`\`\`

### Why This Structure?

- **domain/** has ZERO imports from any other folder — this enforces the Dependency Rule at the filesystem level
- **application/** imports only from domain/ — use cases depend only on entities and ports
- **adapters/** imports from application/ — controllers depend on use cases
- **infrastructure/** imports from all layers — it wires everything together
- **di-container.js** is the Composition Root — the ONLY file that knows about all concrete classes

---

## Implementing Domain Entities

Domain entities in Node.js are plain JavaScript classes. They have no decorators, no ORM annotations, and no framework imports:

\`\`\`javascript
// src/domain/entities/Order.js
import { DomainError } from '../errors/DomainError.js';

class Order {
  #items = [];
  #status = 'draft';

  constructor({ id, customerId, createdAt }) {
    if (!id) throw new DomainError('Order ID is required');
    if (!customerId) throw new DomainError('Customer ID is required');

    this.id = id;
    this.customerId = customerId;
    this.createdAt = createdAt || new Date();
  }

  addItem(product, quantity) {
    if (this.#status !== 'draft') {
      throw new DomainError('Cannot modify a non-draft order');
    }
    if (quantity <= 0) {
      throw new DomainError('Quantity must be positive');
    }
    if (!product.isAvailable()) {
      throw new DomainError(\`Product \${product.name} is not available\`);
    }

    const existingItem = this.#items.find(
      i => i.productId === product.id
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.#items.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity,
      });
    }
  }

  removeItem(productId) {
    if (this.#status !== 'draft') {
      throw new DomainError('Cannot modify a non-draft order');
    }
    this.#items = this.#items.filter(i => i.productId !== productId);
  }

  get total() {
    return this.#items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }

  submit() {
    if (this.#items.length === 0) {
      throw new DomainError('Cannot submit an empty order');
    }
    if (this.#status !== 'draft') {
      throw new DomainError('Order is already submitted');
    }
    this.#status = 'submitted';
    return this;
  }

  cancel() {
    if (this.#status === 'cancelled') {
      throw new DomainError('Order is already cancelled');
    }
    if (this.#status === 'shipped') {
      throw new DomainError('Cannot cancel a shipped order');
    }
    this.#status = 'cancelled';
    return this;
  }

  get status()  { return this.#status; }
  get items()   { return [...this.#items]; }
  get isEmpty() { return this.#items.length === 0; }
}

export default Order;
\`\`\`

### Custom Domain Error Classes

\`\`\`javascript
// src/domain/errors/DomainError.js
export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
  }
}

// src/domain/errors/ValidationError.js
export class ValidationError extends DomainError {
  constructor(field, message) {
    super(\`Validation failed for \${field}: \${message}\`);
    this.name = 'ValidationError';
    this.field = field;
  }
}
\`\`\`

---

## Implementing Use Cases

Each use case is a single class with an \`execute()\` method. It receives its dependencies through **constructor injection** — the use case never creates its own dependencies:

\`\`\`javascript
// src/application/use-cases/user/CreateUser.js
import User from '../../../domain/entities/User.js';

class CreateUserUseCase {
  constructor({ userRepository, passwordHasher, emailService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.emailService = emailService;
  }

  async execute(inputDTO) {
    // 1. Check if user already exists
    const existing = await this.userRepository.findByEmail(
      inputDTO.email
    );
    if (existing) {
      throw new Error('A user with this email already exists');
    }

    // 2. Hash password (through port, not directly using bcrypt)
    const passwordHash = await this.passwordHasher.hash(
      inputDTO.password
    );

    // 3. Create domain entity (validates itself in constructor)
    const user = new User({
      id: crypto.randomUUID(),
      email: inputDTO.email,
      name: inputDTO.name,
      passwordHash,
      role: 'user',
    });

    // 4. Persist through repository port
    await this.userRepository.save(user);

    // 5. Send welcome email through email port
    await this.emailService.send(
      user.email,
      'Welcome!',
      \`Hello \${user.name}, your account is ready.\`
    );

    // 6. Return output DTO (not the entity itself)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export default CreateUserUseCase;
\`\`\`

---

## Dependency Injection & The Composition Root

The **Composition Root** is where all concrete implementations are instantiated and wired together. This is the only file that imports from every layer:

\`\`\`javascript
// src/infrastructure/di-container.js — THE COMPOSITION ROOT
import pg from 'pg';

// Infrastructure (concrete implementations)
import { PostgresUserRepository }
  from './database/PostgresUserRepository.js';
import { PostgresOrderRepository }
  from './database/PostgresOrderRepository.js';
import { StripePaymentGateway }
  from './external-services/StripePaymentGateway.js';
import { SendGridEmailService }
  from './external-services/SendGridEmailService.js';
import { BcryptPasswordHasher }
  from './security/BcryptPasswordHasher.js';

// Use Cases
import CreateUserUseCase
  from '../application/use-cases/user/CreateUser.js';
import GetUserByIdUseCase
  from '../application/use-cases/user/GetUserById.js';
import CreateOrderUseCase
  from '../application/use-cases/order/CreateOrder.js';

// Controllers
import { UserController }
  from '../adapters/controllers/UserController.js';
import { OrderController }
  from '../adapters/controllers/OrderController.js';

// --- Infrastructure instances ---
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const userRepo = new PostgresUserRepository(pool);
const orderRepo = new PostgresOrderRepository(pool);
const paymentGateway = new StripePaymentGateway(
  process.env.STRIPE_KEY
);
const emailService = new SendGridEmailService(
  process.env.SENDGRID_KEY
);
const passwordHasher = new BcryptPasswordHasher();

// --- Use case instances (injected with ports) ---
const createUser = new CreateUserUseCase({
  userRepository: userRepo,
  passwordHasher,
  emailService,
});
const getUserById = new GetUserByIdUseCase({
  userRepository: userRepo,
});
const createOrder = new CreateOrderUseCase({
  orderRepository: orderRepo,
  paymentGateway,
  notifier: emailService,
});

// --- Controller instances (injected with use cases) ---
export const userController = new UserController(
  createUser, getUserById
);
export const orderController = new OrderController(createOrder);
\`\`\`

### Benefits of the Composition Root Pattern

1. **Single source of truth** for all dependency wiring
2. **Easy to swap implementations** — change one line to switch databases
3. **Testing becomes trivial** — inject fakes/mocks in tests
4. **No service locator anti-pattern** — dependencies are explicit in constructors
5. **Framework-independent DI** — no need for InversifyJS, tsyringe, or any DI container library

---

## Repository Pattern Implementation

The Repository Pattern provides a **collection-like interface** for accessing domain objects, hiding all data access details:

\`\`\`javascript
// application/ports/UserRepository.js — PORT (abstract interface)
class UserRepository {
  async findById(id)       { throw new Error('Not implemented'); }
  async findByEmail(email) { throw new Error('Not implemented'); }
  async save(user)         { throw new Error('Not implemented'); }
  async delete(id)         { throw new Error('Not implemented'); }
  async findAll(filters)   { throw new Error('Not implemented'); }
}
export default UserRepository;
\`\`\`

\`\`\`javascript
// infrastructure/database/PostgresUserRepository.js — ADAPTER
import UserRepository from
  '../../application/ports/UserRepository.js';
import User from '../../domain/entities/User.js';

class PostgresUserRepository extends UserRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] ? this.#toDomain(rows[0]) : null;
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return rows[0] ? this.#toDomain(rows[0]) : null;
  }

  async save(user) {
    await this.pool.query(
      \`INSERT INTO users (id, email, name, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
       SET email = $2, name = $3, role = $5\`,
      [user.id, user.email, user.name,
       user.passwordHash, user.role, user.createdAt]
    );
    return user;
  }

  async delete(id) {
    await this.pool.query(
      'DELETE FROM users WHERE id = $1', [id]
    );
  }

  // Maps database row → domain entity
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

export default PostgresUserRepository;
\`\`\`

---

## Controllers and Presenters

**Controllers** sit at the boundary between HTTP and the application. They translate HTTP requests into use case input DTOs:

\`\`\`javascript
// adapters/controllers/UserController.js
import { UserPresenter } from '../presenters/UserPresenter.js';

export class UserController {
  constructor(createUserUseCase, getUserByIdUseCase) {
    this.createUserUseCase = createUserUseCase;
    this.getUserByIdUseCase = getUserByIdUseCase;
  }

  async register(req, res, next) {
    try {
      const result = await this.createUserUseCase.execute({
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
      });
      res.status(201).json(UserPresenter.toJSON(result));
    } catch (error) {
      next(error);  // delegate to error-handling middleware
    }
  }

  async getById(req, res, next) {
    try {
      const user = await this.getUserByIdUseCase.execute(
        req.params.id
      );
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(UserPresenter.toJSON(user));
    } catch (error) {
      next(error);
    }
  }
}
\`\`\`

**Presenters** are responsible for formatting output data for a specific delivery mechanism:

\`\`\`javascript
// adapters/presenters/UserPresenter.js
export class UserPresenter {
  static toJSON(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberSince: user.createdAt.toISOString(),
    };
  }

  static toListJSON(users) {
    return users.map(u => UserPresenter.toJSON(u));
  }

  // Different presentation for admin views
  static toAdminJSON(user) {
    return {
      ...UserPresenter.toJSON(user),
      passwordHash: '[REDACTED]',
      lastLogin: user.lastLogin?.toISOString() || 'Never',
    };
  }
}
\`\`\`

---

## DTOs and Mappers

**Data Transfer Objects (DTOs)** carry data across layer boundaries without exposing domain internals. **Mappers** convert between data representations:

\`\`\`javascript
// application/dto/CreateUserDTO.js
export class CreateUserDTO {
  constructor({ email, name, password }) {
    this.email = email;
    this.name = name;
    this.password = password;
  }

  static validate(data) {
    const errors = [];
    if (!data.email) errors.push('Email is required');
    if (!data.name) errors.push('Name is required');
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (errors.length > 0) {
      throw new Error(
        \`Validation errors: \${errors.join(', ')}\`
      );
    }
    return new CreateUserDTO(data);
  }
}
\`\`\`

\`\`\`javascript
// adapters/mappers/OrderMapper.js
import Order from '../../domain/entities/Order.js';

export class OrderMapper {
  // Domain Entity → Database Row
  static toPersistence(order) {
    return {
      id: order.id,
      customer_id: order.customerId,
      status: order.status,
      total: order.total,
      items: JSON.stringify(order.items),
      created_at: order.createdAt,
    };
  }

  // Database Row → Domain Entity
  static toDomain(row) {
    const order = new Order({
      id: row.id,
      customerId: row.customer_id,
      createdAt: row.created_at,
    });
    const items = JSON.parse(row.items);
    items.forEach(item =>
      order.addItem(
        { id: item.productId, name: item.name,
          price: item.unitPrice, isAvailable: () => true },
        item.quantity
      )
    );
    return order;
  }

  // Domain Entity → API Response
  static toResponse(order) {
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
\`\`\`

---

## Error Handling Across Layers

Each layer defines its own error types. An **error-handling middleware** at the outermost boundary translates domain errors into HTTP responses:

\`\`\`javascript
// domain/errors — already defined above
// DomainError, ValidationError

// application/errors/NotFoundError.js
export class NotFoundError extends Error {
  constructor(entity, id) {
    super(\`\${entity} with id \${id} not found\`);
    this.name = 'NotFoundError';
    this.entity = entity;
  }
}

// application/errors/AuthorizationError.js
export class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// infrastructure/web/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error(\`[\${err.name}] \${err.message}\`);

  // Map domain/application errors to HTTP status codes
  const statusMap = {
    ValidationError:    400,
    DomainError:        400,
    AuthorizationError: 403,
    NotFoundError:      404,
  };

  const status = statusMap[err.name] || 500;
  const message = status === 500
    ? 'Internal Server Error'
    : err.message;

  res.status(status).json({
    success: false,
    error: { type: err.name, message },
  });
}
\`\`\`

This way, inner layers throw **domain-specific errors** without knowing about HTTP. The outer middleware maps them to appropriate HTTP status codes and response shapes.

---

## Testing Each Layer

Clean Architecture makes testing straightforward because each layer can be tested in complete isolation:

### Testing Entities (Unit Tests — No Mocks Needed)

\`\`\`javascript
// tests/unit/domain/Order.test.js
import Order from '../../../src/domain/entities/Order.js';

describe('Order Entity', () => {
  const mockProduct = {
    id: 'p1', name: 'Widget', price: 25,
    isAvailable: () => true
  };

  test('calculates total correctly', () => {
    const order = new Order({ id: '1', customerId: 'c1' });
    order.addItem(mockProduct, 3);
    order.addItem(
      { id: 'p2', name: 'Gadget', price: 50,
        isAvailable: () => true }, 1
    );
    expect(order.total).toBe(125);
  });

  test('prevents submission of empty order', () => {
    const order = new Order({ id: '1', customerId: 'c1' });
    expect(() => order.submit()).toThrow(
      'Cannot submit an empty order'
    );
  });

  test('prevents modification after submission', () => {
    const order = new Order({ id: '1', customerId: 'c1' });
    order.addItem(mockProduct, 1);
    order.submit();
    expect(() => order.addItem(mockProduct, 1)).toThrow(
      'Cannot modify a non-draft order'
    );
  });
});
\`\`\`

### Testing Use Cases (Unit Tests with Fake Adapters)

\`\`\`javascript
// tests/unit/application/CreateUser.test.js
import CreateUserUseCase
  from '../../../src/application/use-cases/user/CreateUser.js';

// Fake implementations of ports
class FakeUserRepository {
  #users = new Map();
  async findByEmail(email) {
    return [...this.#users.values()].find(
      u => u.email === email
    ) || null;
  }
  async save(user) {
    this.#users.set(user.id, user);
    return user;
  }
}

class FakePasswordHasher {
  async hash(password) { return \`hashed_\${password}\`; }
}

class FakeEmailService {
  sentEmails = [];
  async send(to, subject, body) {
    this.sentEmails.push({ to, subject, body });
  }
}

describe('CreateUserUseCase', () => {
  let userRepo, hasher, emailService, useCase;

  beforeEach(() => {
    userRepo = new FakeUserRepository();
    hasher = new FakePasswordHasher();
    emailService = new FakeEmailService();
    useCase = new CreateUserUseCase({
      userRepository: userRepo,
      passwordHasher: hasher,
      emailService,
    });
  });

  test('creates user and sends welcome email', async () => {
    const result = await useCase.execute({
      email: 'alice@example.com',
      name: 'Alice',
      password: 'securepass123',
    });

    expect(result.email).toBe('alice@example.com');
    expect(result.name).toBe('Alice');
    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].to).toBe(
      'alice@example.com'
    );
  });

  test('rejects duplicate email', async () => {
    await useCase.execute({
      email: 'a@b.com', name: 'A', password: 'password123'
    });
    await expect(
      useCase.execute({
        email: 'a@b.com', name: 'B', password: 'password456'
      })
    ).rejects.toThrow('already exists');
  });
});
\`\`\`

### Testing Adapters (Integration Tests with Real Dependencies)

\`\`\`javascript
// tests/integration/PostgresUserRepository.test.js
import pg from 'pg';
import PostgresUserRepository
  from '../../src/infrastructure/database/PostgresUserRepository.js';
import User from '../../src/domain/entities/User.js';

describe('PostgresUserRepository', () => {
  let pool, repo;

  beforeAll(async () => {
    pool = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    repo = new PostgresUserRepository(pool);
  });

  afterAll(() => pool.end());

  afterEach(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1',
      ['%@test.com']);
  });

  test('saves and retrieves a user', async () => {
    const user = new User({
      id: crypto.randomUUID(),
      email: 'integration@test.com',
      name: 'Test User',
      passwordHash: 'hashed_value',
    });

    await repo.save(user);
    const found = await repo.findById(user.id);

    expect(found.email).toBe('integration@test.com');
    expect(found.name).toBe('Test User');
  });
});
\`\`\`

---

## Summary: The Implementation Checklist

When implementing Clean Architecture in a Node.js project, follow this order:

1. **Start with the domain** — define entities and value objects with zero external dependencies
2. **Define ports** — abstract interfaces for every external service your use cases need
3. **Write use cases** — one class per user action, depending only on entities and ports
4. **Build adapters** — controllers for HTTP, repositories for databases, gateways for APIs
5. **Build the Composition Root** — instantiate everything and inject dependencies in one place
6. **Add error handling** — domain errors at the core, HTTP mapping at the edge
7. **Test from inside out** — entities first (pure unit tests), then use cases with fakes, then adapters with real services
8. **Wire routes** — connect Express routes to controllers, apply middleware

The key principle: **code flows inward, data flows across**. Inner layers define the rules, outer layers handle the plumbing.
`
  }
];
