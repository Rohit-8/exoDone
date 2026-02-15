// ============================================================================
// Clean Architecture — Content
// ============================================================================

export const topic = {
  "name": "Clean Architecture",
  "slug": "clean-architecture",
  "description": "Design maintainable systems with layered architecture, SOLID principles, and dependency inversion.",
  "estimated_time": 240,
  "order_index": 7
};

export const lessons = [
  {
    title: "Layers & The Dependency Rule",
    slug: "layers-dependency-rule",
    summary: "Understand the concentric layers of Clean Architecture and the dependency rule that keeps inner layers independent.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "Clean Architecture separates concerns into concentric layers",
  "Inner layers never depend on outer layers (Dependency Rule)",
  "Entities: business rules and core logic — framework-agnostic",
  "Use Cases: application-specific business rules (orchestration)",
  "Adapters: convert between use cases and external frameworks",
  "Frameworks: database, web, UI — the outermost replaceable ring"
],
    content: `# Clean Architecture: Layers & The Dependency Rule

## The Concentric Layers

\`\`\`
┌──────────────────────────────────────────────┐
│  Frameworks & Drivers (DB, Web, UI)          │
│  ┌────────────────────────────────────────┐  │
│  │  Interface Adapters (Controllers, GW)  │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  Use Cases (Application Logic)   │  │  │
│  │  │  ┌────────────────────────────┐  │  │  │
│  │  │  │  Entities (Business Rules) │  │  │  │
│  │  │  └────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
\`\`\`

### The Dependency Rule

> Source code dependencies must point inward. Nothing in an inner circle can know about anything in an outer circle.

## Folder Structure

\`\`\`
src/
├── domain/            # Entities + Value Objects
│   ├── User.js
│   ├── Order.js
│   └── Money.js
├── application/       # Use Cases + Ports
│   ├── CreateOrder.js
│   ├── GetUserProfile.js
│   └── ports/
│       ├── UserRepository.js    # Interface (port)
│       └── PaymentGateway.js    # Interface (port)
├── infrastructure/    # External implementations (adapters)
│   ├── PostgresUserRepository.js
│   ├── StripePaymentGateway.js
│   └── JwtAuthService.js
└── interfaces/        # Controllers, Routes
    ├── http/
    │   ├── OrderController.js
    │   └── UserController.js
    └── cli/
        └── SeedCommand.js
\`\`\`

## Domain Entity

\`\`\`javascript
// domain/Order.js — no framework dependencies!
class Order {
  #items = [];
  #status = 'draft';

  constructor(id, customerId) {
    this.id = id;
    this.customerId = customerId;
    this.createdAt = new Date();
  }

  addItem(product, quantity, price) {
    if (this.#status !== 'draft') {
      throw new Error('Cannot modify a submitted order');
    }
    this.#items.push({ product, quantity, price });
  }

  get total() {
    return this.#items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  submit() {
    if (this.#items.length === 0) throw new Error('Order is empty');
    this.#status = 'submitted';
  }

  get status() { return this.#status; }
  get items() { return [...this.#items]; }
}

export default Order;
\`\`\`

## Use Case

\`\`\`javascript
// application/CreateOrder.js
class CreateOrderUseCase {
  constructor(orderRepo, paymentGateway, notifier) {
    this.orderRepo = orderRepo;
    this.paymentGateway = paymentGateway;
    this.notifier = notifier;
  }

  async execute({ customerId, items }) {
    const order = new Order(crypto.randomUUID(), customerId);

    for (const item of items) {
      order.addItem(item.product, item.quantity, item.price);
    }

    order.submit();

    await this.paymentGateway.charge(customerId, order.total);
    await this.orderRepo.save(order);
    await this.notifier.send(customerId, \`Order \${order.id} confirmed\`);

    return order;
  }
}

export default CreateOrderUseCase;
\`\`\`
`,
  },
  {
    title: "Ports, Adapters & Hexagonal Architecture",
    slug: "ports-adapters-hexagonal",
    summary: "Learn how ports and adapters decouple your application from external services, enabling easy testing and swapping.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 2,
    key_points: [
  "Ports are interfaces (contracts) defined by the application",
  "Adapters are concrete implementations of those ports",
  "Primary/driving adapters: controllers, CLI, event handlers — call the application",
  "Secondary/driven adapters: databases, APIs, message queues — called by the application",
  "Hexagonal Architecture = Ports & Adapters = focus on the core, plug peripherals"
],
    content: `# Ports, Adapters & Hexagonal Architecture

## Ports & Adapters

\`\`\`
               ┌──────────────────────┐
   HTTP ──────►│   Port (Controller)  │
               │         ↓            │
   CLI ───────►│   APPLICATION CORE   │───► Port (Repository) ──► PostgreSQL
               │                      │
   Events ────►│   Use Cases +        │───► Port (Mailer)     ──► SendGrid
               │   Domain Entities    │
               │                      │───► Port (Cache)      ──► Redis
               └──────────────────────┘
\`\`\`

## Defining Ports

\`\`\`javascript
// application/ports/UserRepository.js — PORT (interface)
class UserRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findByEmail(email) { throw new Error('Not implemented'); }
  async save(user) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

export default UserRepository;
\`\`\`

## Creating Adapters

\`\`\`javascript
// infrastructure/PostgresUserRepository.js — ADAPTER
import UserRepository from '../application/ports/UserRepository.js';

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

  async save(user) {
    const { rows } = await this.pool.query(
      \`INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name=$2, email=$3
       RETURNING *\`,
      [user.id, user.name, user.email, user.passwordHash]
    );
    return this.#toDomain(rows[0]);
  }

  #toDomain(row) {
    return { id: row.id, name: row.name, email: row.email };
  }
}

export default PostgresUserRepository;
\`\`\`

## Testing with Fake Adapters

\`\`\`javascript
// tests/FakeUserRepository.js — test adapter
class FakeUserRepository extends UserRepository {
  #users = new Map();

  async findById(id) { return this.#users.get(id) || null; }
  async save(user) { this.#users.set(user.id, user); return user; }
  async delete(id) { this.#users.delete(id); }
}

// Test is fast — no database needed
const repo = new FakeUserRepository();
const useCase = new GetUserProfileUseCase(repo);
await repo.save({ id: '1', name: 'Alice', email: 'a@b.com' });
const profile = await useCase.execute('1');
expect(profile.name).toBe('Alice');
\`\`\`
`,
  },
];
