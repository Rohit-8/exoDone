// ============================================================================
// Domain-Driven Design — Content
// ============================================================================

export const topic = {
  name: "Domain-Driven Design",
  slug: "domain-driven-design",
  description: "Master Domain-Driven Design from strategic patterns (Bounded Contexts, Context Mapping, Ubiquitous Language, Subdomains) to tactical patterns (Entities, Value Objects, Aggregates, Repositories, Domain Events, Specifications) with production-grade Node.js implementations.",
  order_index: 8
};

export const lessons = [
  {
    slug: "ddd-strategic-patterns",
    title: "DDD Strategic Patterns",
    order_index: 1,
    content: `# DDD Strategic Patterns

## What Is Domain-Driven Design and Why It Matters

Domain-Driven Design (DDD) is a software development approach introduced by **Eric Evans** in his 2003 book *Domain-Driven Design: Tackling Complexity in the Heart of Software*. DDD provides a framework for making design decisions that accelerate software projects dealing with **complex domains**.

### The Core Premise

Most software complexity is not technical — it is **domain complexity**. A payroll system is hard not because HTTP is hard, but because payroll rules, tax codes, benefits, overtime calculations, and compliance regulations are hard. DDD says: put the domain model at the center of your architecture and invest the most effort in understanding and modeling the business domain accurately.

### When DDD Matters

DDD is **not** appropriate for every project. It adds overhead that only pays off when domain complexity is the primary challenge:

| Scenario | Use DDD? | Why |
|---|---|---|
| Simple CRUD app (blog, todo list) | No | Minimal business logic; anemic model is fine |
| Complex business rules (insurance, finance, logistics) | Yes | Rich invariants justify the investment |
| Startup MVP with uncertain domain | Partially | Use strategic DDD (Bounded Contexts) but defer tactical patterns |
| Microservices architecture | Yes | Bounded Contexts define natural service boundaries |

### DDD Is Divided into Two Halves

1. **Strategic Design** — the big picture: how do you decompose a large domain into manageable parts? (This lesson)
2. **Tactical Design** — the implementation patterns: Entities, Value Objects, Aggregates, etc. (Next lesson)

---

## Ubiquitous Language

**Ubiquitous Language** is the single most important concept in DDD. It is a shared, rigorous language between developers and domain experts that is:

- Used in code (class names, method names, variable names)
- Used in conversation (meetings, Slack, documentation)
- Used in tests (test names describe domain scenarios)
- **Bounded** to a specific context (the same word can mean different things in different contexts)

### Why It Matters

Miscommunication between developers and business stakeholders is the #1 cause of building the wrong software. When a business analyst says "account" and means a customer profile, but the developer interprets it as a financial ledger, the resulting code will be wrong in subtle ways.

### Building the Ubiquitous Language

\`\`\`
❌ WRONG — generic technical names:
  class DataProcessor { process(data) {} }
  class ItemManager { handleItem(item) {} }

✅ RIGHT — domain-specific names:
  class ClaimAdjudicator { adjudicateClaim(insuranceClaim) {} }
  class LoanUnderwriter { evaluateApplication(loanApplication) {} }
\`\`\`

### Practical Example: E-Commerce

| Business Term | Developer Translation | Used In |
|---|---|---|
| "Place an order" | \`Order.place()\` | Order aggregate method |
| "Cancel a shipment" | \`Shipment.cancel(reason)\` | Shipment aggregate method |
| "Apply a promo code" | \`Cart.applyPromoCode(code)\` | Cart aggregate method |
| "Customer is in good standing" | \`Customer.isInGoodStanding()\` | Customer entity method |
| "Item is back-ordered" | \`InventoryItem.isBackOrdered()\` | Inventory value object / entity |

### Rules for Ubiquitous Language

1. **No synonyms** — pick one term and use it everywhere. If the business says "client" sometimes and "customer" other times, force a decision.
2. **No abbreviations in the domain layer** — write \`PurchaseOrder\`, not \`PO\`.
3. **Reflect in code** — if the language changes, refactor the code to match immediately.
4. **Each Bounded Context has its own language** — "Account" in the Banking Context is not the same as "Account" in the Identity Context.

---

## Bounded Contexts

A **Bounded Context** is an explicit boundary within which a particular domain model is defined and applicable. Inside that boundary, every term has exactly one meaning. Outside the boundary, the same term may mean something completely different.

### The Problem Bounded Contexts Solve

In a large system, a single unified model for the entire domain becomes contradictory. Consider the word "Product":

- **Catalog Context**: Product has a description, images, categories, prices for display.
- **Inventory Context**: Product has warehouse location, stock count, reorder threshold.
- **Shipping Context**: Product has weight, dimensions, fragility flag.
- **Billing Context**: Product has tax classification, revenue recognition rules.

Trying to put all of these into a single \`Product\` class creates a tangled, constantly-changing God Object that no one understands.

### Bounded Context = Boundary of Meaning

\`\`\`
┌─────────────────────────┐   ┌─────────────────────────┐
│   CATALOG CONTEXT       │   │   INVENTORY CONTEXT     │
│                         │   │                         │
│  Product:               │   │  StockItem:             │
│   - name                │   │   - sku                 │
│   - description         │   │   - warehouseLocation   │
│   - images[]            │   │   - quantityOnHand      │
│   - price               │   │   - reorderThreshold    │
│   - categories[]        │   │   - isBackOrdered()     │
│                         │   │                         │
│  "Product" means a      │   │  "Product" is called    │
│   displayable item      │   │   "StockItem" here      │
└─────────────────────────┘   └─────────────────────────┘
\`\`\`

### Bounded Context vs Microservice

A Bounded Context is a **logical** boundary; a microservice is a **deployment** boundary. They often align, but not always:

- One microservice may contain multiple Bounded Contexts (early stage, monolith)
- One Bounded Context may be split across multiple microservices (rarely ideal)
- **Ideal**: one Bounded Context = one microservice (or module in a modular monolith)

### Identifying Bounded Contexts

Ask these questions:
1. Does the same word mean different things to different teams?
2. Would changing this model break an unrelated feature?
3. Does this team operate independently with its own release cycle?
4. Does a separate database or schema make sense here?

If yes to two or more, you likely have separate Bounded Contexts.

---

## Context Mapping

**Context Mapping** describes the relationships and integration patterns between Bounded Contexts. Eric Evans defined several relationship types:

### 1. Shared Kernel

Two contexts share a small subset of the domain model (code, schema, or data structures). Both teams must agree on changes to the shared part.

\`\`\`
┌──────────────┐     ┌──────────────┐
│  Context A   │     │  Context B   │
│              │     │              │
│         ┌────┴─────┴────┐        │
│         │  Shared Kernel │        │
│         │  (Money, UUID) │        │
│         └────┬─────┬────┘        │
│              │     │              │
└──────────────┘     └──────────────┘
\`\`\`

**When to use**: When two closely collaborating teams share fundamental types (e.g., Money, Address). Keep the kernel as small as possible.

**Risk**: Changes require coordination. If the kernel grows, you lose the autonomy benefits of separate contexts.

### 2. Customer-Supplier (Upstream-Downstream)

The upstream context (supplier) provides data/services that the downstream context (customer) depends on. The upstream team should accommodate the downstream team's needs.

\`\`\`
┌──────────────┐         ┌──────────────┐
│  ORDER MGMT  │ ──────► │   SHIPPING   │
│  (Upstream)  │         │ (Downstream) │
│  Supplier    │         │  Customer    │
└──────────────┘         └──────────────┘
\`\`\`

**When to use**: When one team depends on another and the upstream team is willing to prioritize downstream needs.

### 3. Conformist

Like Customer-Supplier, but the upstream team has **no motivation** to support the downstream team. The downstream team must conform to whatever the upstream provides — no negotiation.

**When to use**: Integrating with external APIs you don't control (Stripe, Twilio, government APIs). You conform to their model.

### 4. Anti-Corruption Layer (ACL)

The downstream context creates a **translation layer** that converts the upstream model into its own domain model. This prevents the upstream model from "corrupting" or leaking into the downstream domain.

\`\`\`
┌────────────────┐      ┌─────────────────────────┐      ┌────────────────┐
│                │      │  Anti-Corruption Layer   │      │                │
│  Legacy Billing│─────►│  - Translator            │─────►│  New Orders    │
│  System        │      │  - Adapter               │      │  Context       │
│  (Upstream)    │      │  - Facade                │      │  (Downstream)  │
└────────────────┘      └─────────────────────────┘      └────────────────┘
\`\`\`

**When to use**: Integrating with legacy systems, third-party APIs, or any upstream context whose model is fundamentally different from yours.

\`\`\`javascript
// Anti-Corruption Layer example
class LegacyBillingACL {
  constructor(legacyBillingClient) {
    this.client = legacyBillingClient;
  }

  async getInvoiceForOrder(orderId) {
    // Legacy system returns snake_case, different structure
    const legacyInvoice = await this.client.fetch_invoice({ order_num: orderId });

    // Translate to our domain model
    return new Invoice({
      id: InvoiceId.from(legacyInvoice.inv_id),
      amount: Money.of(legacyInvoice.total_amt / 100, legacyInvoice.curr),
      status: this.#mapStatus(legacyInvoice.stat_cd),
      lineItems: legacyInvoice.lines.map(line => new InvoiceLineItem({
        description: line.desc,
        quantity: line.qty,
        unitPrice: Money.of(line.unit_amt / 100, legacyInvoice.curr),
      })),
    });
  }

  #mapStatus(legacyCode) {
    const mapping = { 'P': 'pending', 'A': 'approved', 'R': 'rejected', 'X': 'cancelled' };
    return mapping[legacyCode] || 'unknown';
  }
}
\`\`\`

### 5. Open Host Service (OHS)

The upstream context defines a well-documented, versioned protocol (REST API, gRPC, GraphQL) that any downstream context can integrate with. Rather than one-off integrations, the upstream provides a general-purpose service.

**When to use**: When an upstream context has multiple downstream consumers. Provide a single, well-designed API instead of bespoke integrations.

### 6. Published Language

A well-documented, shared data format used for communication between contexts (e.g., JSON schemas, Protocol Buffers, Avro, XML schemas). Often paired with Open Host Service.

**When to use**: When you need a standardized contract between contexts, especially in event-driven or messaging-based architectures.

### Context Map Cheat Sheet

| Pattern | Who Adapts? | Power Dynamic | Example |
|---|---|---|---|
| Shared Kernel | Both | Equal | Two teams sharing a Money type |
| Customer-Supplier | Upstream accommodates | Upstream supportive | Orders → Shipping (same company) |
| Conformist | Downstream conforms | Upstream indifferent | Your app → Stripe API |
| Anti-Corruption Layer | Downstream translates | Upstream hostile/legacy | New system → Legacy mainframe |
| Open Host Service | Upstream provides API | Upstream serves many | Auth Service → all other services |
| Published Language | Shared schema | Contractual | Event schema (Avro/Protobuf) |

---

## Subdomains

**Subdomains** are areas of the business domain, identified through domain analysis. They are discovered, not designed — they exist whether or not you model them in software.

### Types of Subdomains

#### 1. Core Domain (Core Subdomain)

The part of the business that provides **competitive advantage**. This is what makes the company unique. Invest the most talent, time, and DDD rigor here.

- **Amazon**: Recommendation engine, logistics optimization, pricing algorithms
- **Netflix**: Content recommendation, streaming optimization
- **Uber**: Dynamic pricing, driver matching, route optimization
- **Your startup**: Whatever makes you different from competitors

**Strategy**: Build in-house with your best engineers. Apply full DDD tactical patterns. This is where Aggregates, Value Objects, and Domain Events earn their keep.

#### 2. Supporting Subdomain

Necessary for the business to operate but **not a competitive differentiator**. Still custom-built because off-the-shelf solutions don't fit, but doesn't need the same investment as the Core Domain.

- **Examples**: Customer onboarding flow, internal reporting dashboards, employee scheduling
- **Strategy**: Build reasonably well, but don't over-engineer. Simpler patterns (Transaction Script, Active Record) may be sufficient.

#### 3. Generic Subdomain

Solved problems that **every business faces**. No competitive advantage. Use existing solutions.

- **Examples**: Authentication, email sending, payment processing, PDF generation, file storage
- **Strategy**: Buy or use open-source. Don't build your own auth system; use Auth0/Cognito. Don't build payment processing; use Stripe.

### Subdomain Identification Process

\`\`\`
Step 1: List all business capabilities
Step 2: For each, ask "Does this differentiate us from competitors?"
  → Yes: Core Domain
  → No, but we must build custom: Supporting Subdomain
  → No, and off-the-shelf exists: Generic Subdomain
Step 3: Map subdomains to Bounded Contexts
Step 4: Assign teams and investment proportionally
\`\`\`

---

## Domain Events Between Contexts

**Domain Events** are the primary mechanism for communication between Bounded Contexts. They represent something that happened — a fact that is immutable once published.

### Naming Convention

Domain Events are always named in the **past tense** because they represent something that already occurred:

- \`OrderPlaced\` (not \`PlaceOrder\`)
- \`PaymentReceived\` (not \`ReceivePayment\`)
- \`ShipmentDispatched\` (not \`DispatchShipment\`)
- \`InventoryDepleted\` (not \`DepleteInventory\`)

### Inter-Context Communication via Events

\`\`\`
┌──────────────┐  OrderPlaced  ┌──────────────┐
│  ORDER CTX   │──────────────►│  PAYMENT CTX │
└──────────────┘               └──────┬───────┘
                                      │
                               PaymentReceived
                                      │
                                      ▼
                               ┌──────────────┐  ShipmentDispatched  ┌──────────────┐
                               │ SHIPPING CTX │────────────────────►│ NOTIFY CTX   │
                               └──────────────┘                     └──────────────┘
\`\`\`

### Event Structure

\`\`\`javascript
// A domain event should carry enough data for consumers
// to react without calling back to the source context
const orderPlacedEvent = {
  eventType: 'OrderPlaced',
  eventId: 'evt-uuid-123',
  aggregateId: 'order-uuid-456',
  aggregateType: 'Order',
  occurredAt: '2025-11-15T10:30:00Z',
  payload: {
    orderId: 'order-uuid-456',
    customerId: 'cust-uuid-789',
    items: [
      { productId: 'prod-001', quantity: 2, unitPrice: 29.99 },
      { productId: 'prod-002', quantity: 1, unitPrice: 49.99 },
    ],
    totalAmount: 109.97,
    currency: 'USD',
    shippingAddress: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
    },
  },
};
\`\`\`

### Eventual Consistency

When contexts communicate via events, they are **eventually consistent**. The Order Context doesn't wait for the Payment Context to confirm — it publishes the event and moves on. The Payment Context processes it asynchronously.

**Implications**:
- There is a window where data is inconsistent across contexts
- UIs must be designed to handle pending/processing states
- Idempotency is critical — events may be delivered more than once
- Ordering guarantees depend on the message broker configuration

---

## Strategic Design Process

Here is a practical step-by-step process for applying DDD strategic patterns:

### Step 1: Event Storming

Gather developers and domain experts in a room. Use sticky notes to map out:
- **Domain Events** (orange) — things that happen
- **Commands** (blue) — actions that trigger events
- **Aggregates** (yellow) — entities that handle commands
- **Read Models** (green) — views/queries
- **Policies** (lilac) — rules that react to events ("when X happens, do Y")
- **External Systems** (pink) — third-party integrations

### Step 2: Identify Bounded Contexts

Group related Aggregates, Events, and Commands into clusters. Each cluster is a candidate Bounded Context. Look for:
- Language boundaries (same term, different meaning)
- Team boundaries (different teams, different release cycles)
- Data ownership (who is the source of truth?)

### Step 3: Define Context Relationships

For each pair of related contexts, determine the relationship:
- Who depends on whom?
- Who has decision-making power?
- What integration pattern fits? (ACL, OHS, Conformist, etc.)

### Step 4: Classify Subdomains

For each context, determine if it's Core, Supporting, or Generic. This drives investment decisions:
- Core → full DDD tactical patterns, best engineers
- Supporting → simpler patterns, adequate quality
- Generic → buy/outsource

### Step 5: Iterate

A Context Map is a living document. As the business evolves, contexts split, merge, or change relationships. Revisit the map quarterly.

---

## Key Interview Takeaways

1. **DDD is about managing complexity** — not about patterns for their own sake.
2. **Ubiquitous Language** is the most impactful practice — even without any tactical patterns.
3. **Bounded Contexts** prevent the "Big Ball of Mud" by giving each model explicit boundaries.
4. **Context Mapping** is how you reason about integration between contexts and teams.
5. **Not everything is a Core Domain** — identify what matters and invest accordingly.
6. **Domain Events** enable eventual consistency between contexts without tight coupling.
7. **Event Storming** is the most practical technique for discovering domain structure.
`
  },
  {
    slug: "ddd-tactical-patterns",
    title: "DDD Tactical Patterns",
    order_index: 2,
    content: `# DDD Tactical Patterns

## Overview

Tactical patterns are the building blocks you use **inside** a Bounded Context to implement the domain model. While strategic patterns tell you *where* to draw boundaries, tactical patterns tell you *how* to structure the code within those boundaries.

The key tactical patterns are:
1. **Entities** — objects with identity
2. **Value Objects** — objects defined by their attributes
3. **Aggregates** — consistency boundaries
4. **Repositories** — persistence abstraction for aggregates
5. **Domain Services** — domain logic that doesn't belong to an entity
6. **Application Services** — orchestration of use cases
7. **Domain Events** — capturing what happened within a context
8. **Factories** — complex object creation
9. **Specifications** — composable business rules

---

## Entities

An **Entity** is a domain object that is distinguished by its **identity**, not by its attributes. Two entities with the same data but different IDs are different objects. An entity's identity persists across its entire lifecycle — even when every other attribute changes.

### Key Properties of Entities

1. **Unique Identity**: Every entity has an ID that distinguishes it from all other entities of the same type.
2. **Continuity**: The entity maintains its identity across time. A \`User\` entity is the same user whether their name is "John" or they later change it to "Jonathan."
3. **Mutability**: Entities can change state over time — but changes must go through domain methods that enforce business rules.
4. **Lifecycle**: Entities are created, go through state changes, and are eventually archived or deleted.

### Entity Example

\`\`\`javascript
class User {
  #id;
  #email;
  #name;
  #role;
  #status;
  #createdAt;

  constructor({ id, email, name, role = 'member', status = 'active' }) {
    if (!id) throw new Error('User ID is required');
    if (!email) throw new Error('Email is required');
    this.#id = id;
    this.#email = Email.create(email);  // Value Object
    this.#name = name;
    this.#role = role;
    this.#status = status;
    this.#createdAt = new Date();
  }

  promote() {
    if (this.#status !== 'active') {
      throw new Error('Cannot promote an inactive user');
    }
    if (this.#role === 'admin') {
      throw new Error('User is already an admin');
    }
    this.#role = 'admin';
  }

  deactivate() {
    if (this.#role === 'admin') {
      throw new Error('Cannot deactivate admin — demote first');
    }
    this.#status = 'inactive';
  }

  get id() { return this.#id; }
  get email() { return this.#email; }
  get name() { return this.#name; }
  get role() { return this.#role; }
  get status() { return this.#status; }

  // Entity equality is by identity, not attributes
  equals(other) {
    if (!(other instanceof User)) return false;
    return this.#id === other.id;
  }
}
\`\`\`

---

## Value Objects

A **Value Object** is a domain object that has **no identity**. It is defined entirely by its attributes. Two Value Objects with the same attributes are considered equal and interchangeable. Value Objects are **immutable** — you never modify one; you replace it with a new instance.

### Key Properties of Value Objects

1. **No Identity**: No ID field. Equality is determined by comparing all attributes.
2. **Immutability**: Once created, a Value Object never changes. Operations return new instances.
3. **Self-Validation**: A Value Object validates its own data on creation. An invalid Value Object cannot exist.
4. **Side-Effect Free**: Methods on Value Objects are pure functions — they return results without changing state.
5. **Replaceability**: Since they have no identity, you can freely replace one with another of equal value.

### When to Use Value Objects vs Entities

| Question | Entity | Value Object |
|---|---|---|
| Do I need to track this object over time? | Yes | No |
| Do I care *which* instance it is? | Yes (by ID) | No (by value) |
| Can two instances with the same data be swapped freely? | No | Yes |
| Should it be immutable? | No (mutable via methods) | Yes |

### Common Value Objects

- **Money** (amount + currency)
- **Email** (validated string)
- **Address** (street, city, state, zip, country)
- **DateRange** (start date + end date, must be valid range)
- **PhoneNumber** (validated, formatted)
- **Coordinates** (latitude + longitude)
- **Color** (r, g, b or hex)
- **Percentage** (0–100, validated)

### Value Object Example

\`\`\`javascript
class Email {
  #value;

  constructor(value) {
    const trimmed = value.trim().toLowerCase();
    if (!Email.#isValid(trimmed)) {
      throw new Error(\\\`Invalid email: \\\${value}\\\`);
    }
    this.#value = trimmed;
    Object.freeze(this);
  }

  static create(value) {
    return new Email(value);
  }

  static #isValid(email) {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }

  get value() { return this.#value; }

  get domain() {
    return this.#value.split('@')[1];
  }

  equals(other) {
    if (!(other instanceof Email)) return false;
    return this.#value === other.value;
  }

  toString() { return this.#value; }
}
\`\`\`

---

## Aggregates and Aggregate Roots

An **Aggregate** is a cluster of domain objects (Entities and Value Objects) treated as a single unit for data changes. Every Aggregate has an **Aggregate Root** — the single Entity through which all external access must pass.

### Aggregate Rules (Vaughn Vernon's Effective Aggregates)

1. **Protect business invariants inside Aggregate boundaries.** The Aggregate Root is responsible for enforcing all invariants (business rules) for everything inside the Aggregate.

2. **Design small Aggregates.** Each Aggregate should include only what is needed to enforce its invariants. Avoid large Aggregates that include everything related.

3. **Reference other Aggregates by identity only.** Don't hold direct object references to other Aggregates. Store their ID and load them separately if needed.

4. **Update other Aggregates eventually via Domain Events.** When something happens in one Aggregate that affects another, publish a Domain Event. Don't modify two Aggregates in the same transaction.

### Aggregate Boundary Example

\`\`\`
┌─────────────────────────────────────────────┐
│             ORDER AGGREGATE                 │
│                                             │
│  ┌──────────────────────────────────┐       │
│  │  Order (Aggregate Root)         │       │
│  │  - id: OrderId                  │       │
│  │  - customerId: CustomerId       │  ◄── Only entry point
│  │  - status: OrderStatus (VO)     │       │
│  │  - shippingAddress: Address (VO)│       │
│  │  + addItem()                    │       │
│  │  + removeItem()                 │       │
│  │  + place()                      │       │
│  │  + cancel()                     │       │
│  └──────────────┬───────────────────┘       │
│                 │ contains                  │
│  ┌──────────────▼───────────────────┐       │
│  │  OrderLineItem (Entity)         │       │
│  │  - id: LineItemId               │       │
│  │  - productId: ProductId         │ ◄── Not accessible
│  │  - productName: string          │     directly from outside
│  │  - quantity: Quantity (VO)      │       │
│  │  - unitPrice: Money (VO)       │       │
│  └──────────────────────────────────┘       │
│                                             │
│  Total: Money (VO) — derived, not stored    │
└─────────────────────────────────────────────┘
\`\`\`

### Why Small Aggregates?

Large Aggregates cause:
- **Concurrency conflicts**: If an Aggregate contains Orders AND OrderHistory, every read of history locks the entire Aggregate.
- **Performance problems**: Loading a large Aggregate from the database is expensive.
- **Transactional contention**: Multiple users modifying the same large Aggregate will conflict.

**Rule of thumb**: If you can split it without losing invariant protection, split it.

---

## Repositories

A **Repository** provides the illusion of an in-memory collection of Aggregates. It is the **only** way to persist and retrieve Aggregates. Repositories abstract away the database — the domain layer doesn't know if data is stored in PostgreSQL, MongoDB, or a flat file.

### Repository Contract

\`\`\`javascript
// This interface lives in the domain layer
// The implementation lives in the infrastructure layer
class OrderRepository {
  async findById(orderId) { throw new Error('Not implemented'); }
  async findByCustomerId(customerId) { throw new Error('Not implemented'); }
  async save(order) { throw new Error('Not implemented'); }
  async delete(orderId) { throw new Error('Not implemented'); }
  async nextId() { throw new Error('Not implemented'); }
}
\`\`\`

### Key Repository Rules

1. **One Repository per Aggregate Root** — never for Entities inside the Aggregate.
2. **Returns fully reconstituted Aggregates** — not raw database rows.
3. **Encapsulates query logic** — the domain doesn't know SQL/NoSQL.
4. **Handles persistence of the entire Aggregate** — including child Entities and Value Objects.
5. **All Aggregate retrieval goes through the Repository** — never query the database directly in the domain or application layer.

### Repository vs DAO vs ORM

| Pattern | Purpose | Returns |
|---|---|---|
| Repository | Domain-oriented collection abstraction | Aggregate Root instances |
| DAO (Data Access Object) | Database-oriented CRUD abstraction | Database row objects / DTOs |
| ORM (Sequelize, Prisma) | Object-relational mapping tool | ORM model instances |

A Repository may **use** an ORM internally, but the domain layer never sees ORM models.

---

## Domain Services vs Application Services

### Domain Services

A **Domain Service** contains domain logic that doesn't naturally belong to any single Entity or Value Object. If you find yourself forcing business logic into an Entity where it doesn't fit, extract it to a Domain Service.

**Characteristics**:
- Stateless
- Named using Ubiquitous Language
- Contains business logic only — no infrastructure concerns
- Lives in the domain layer

**Example**: Calculating shipping cost depends on items, weight, destination, and carrier rates. It doesn't belong to \`Order\` (the Order doesn't know carrier rates) or to \`Address\` (an address doesn't know about shipping). It's a Domain Service: \`ShippingCostCalculator.calculate(order, address, carrierRates)\`.

### Application Services

An **Application Service** orchestrates use cases by coordinating domain objects, repositories, and infrastructure services. It does **not** contain business logic — only workflow coordination.

**Characteristics**:
- Orchestrates domain objects and infrastructure
- Manages transactions
- Handles authorization checks
- Publishes domain events to the message bus
- Lives in the application layer (one layer above domain)

\`\`\`javascript
// Application Service — orchestration, no business logic
class PlaceOrderService {
  constructor(orderRepo, inventoryService, eventBus) {
    this.orderRepo = orderRepo;
    this.inventoryService = inventoryService;
    this.eventBus = eventBus;
  }

  async execute(command) {
    // 1. Load aggregate
    const order = await this.orderRepo.findById(command.orderId);

    // 2. Call domain method (business logic is HERE, in the aggregate)
    order.place();

    // 3. Persist
    await this.orderRepo.save(order);

    // 4. Publish events
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return { orderId: order.id, status: order.status };
  }
}
\`\`\`

### Service Comparison

| | Domain Service | Application Service |
|---|---|---|
| Contains business logic? | Yes | No — only orchestration |
| Knows about repositories? | No | Yes |
| Knows about transactions? | No | Yes |
| Knows about HTTP/messaging? | No | No (controller does) |
| Layer | Domain | Application |
| Example | PricingCalculator | PlaceOrderHandler |

---

## Domain Events (Within a Bounded Context)

**Domain Events** capture significant occurrences within the domain. Inside a Bounded Context, they enable **decoupled side effects**: when an Aggregate changes state, it records an event, and separate handlers react to it.

### Domain Event Pattern

\`\`\`javascript
class DomainEvent {
  constructor(type, payload) {
    this.eventId = crypto.randomUUID();
    this.type = type;
    this.occurredAt = new Date().toISOString();
    this.payload = Object.freeze(payload);
    Object.freeze(this);
  }
}

// The Aggregate Root base class collects events
class AggregateRoot {
  #domainEvents = [];

  addDomainEvent(event) {
    this.#domainEvents.push(event);
  }

  pullDomainEvents() {
    const events = [...this.#domainEvents];
    this.#domainEvents = [];
    return events;
  }

  get domainEvents() {
    return [...this.#domainEvents];
  }
}
\`\`\`

### Raising Events from Aggregates

\`\`\`javascript
class Order extends AggregateRoot {
  place() {
    if (this.items.length === 0) {
      throw new Error('Cannot place an empty order');
    }
    this.status = OrderStatus.PLACED;
    this.placedAt = new Date();

    // Record the event — don't publish yet
    this.addDomainEvent(new DomainEvent('OrderPlaced', {
      orderId: this.id,
      customerId: this.customerId,
      total: this.total.amount,
      currency: this.total.currency,
      itemCount: this.items.length,
    }));
  }
}
\`\`\`

### Event Handlers

\`\`\`javascript
// Handlers react to events — each handles one concern
class SendOrderConfirmationEmail {
  async handle(event) {
    if (event.type !== 'OrderPlaced') return;
    await emailService.send({
      to: event.payload.customerEmail,
      template: 'order-confirmation',
      data: { orderId: event.payload.orderId },
    });
  }
}

class UpdateInventoryReservation {
  async handle(event) {
    if (event.type !== 'OrderPlaced') return;
    for (const item of event.payload.items) {
      await inventoryService.reserve(item.productId, item.quantity);
    }
  }
}
\`\`\`

---

## Factories

A **Factory** encapsulates the logic of creating complex Aggregates or Entities. When object creation involves significant validation, initialization of multiple child objects, or conditional logic, a Factory keeps that complexity out of the constructor.

### When to Use a Factory

- Creating an Aggregate requires initializing child Entities
- The creation process involves business rules
- Different creation paths exist (e.g., creating from a DTO vs reconstituting from database)
- The Aggregate constructor would become too complex

\`\`\`javascript
class OrderFactory {
  static createFromCart(cart, customerId, shippingAddress) {
    const orderId = crypto.randomUUID();
    const order = new Order(orderId, customerId, shippingAddress);

    for (const cartItem of cart.items) {
      order.addItem(
        cartItem.productId,
        cartItem.productName,
        Money.of(cartItem.price, cartItem.currency),
        cartItem.quantity
      );
    }

    return order;
  }

  static reconstitute(data) {
    // Reconstitute from database — no validation, no events
    const order = Object.create(Order.prototype);
    Object.assign(order, {
      id: data.id,
      customerId: data.customer_id,
      status: OrderStatus.from(data.status),
      items: data.items.map(i => OrderLineItem.reconstitute(i)),
      total: Money.of(data.total_amount, data.currency),
      createdAt: data.created_at,
    });
    return order;
  }
}
\`\`\`

---

## Specifications Pattern

The **Specification** pattern encapsulates business rules into reusable, composable objects. A Specification answers one question: "Does this object satisfy the rule?"

### Why Specifications?

Without Specifications, business rules get scattered across services, repositories, and controllers. With Specifications, rules are named, testable, and composable.

\`\`\`javascript
class Specification {
  isSatisfiedBy(candidate) {
    throw new Error('Not implemented');
  }

  and(other) {
    return new AndSpecification(this, other);
  }

  or(other) {
    return new OrSpecification(this, other);
  }

  not() {
    return new NotSpecification(this);
  }
}

class AndSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
  isSatisfiedBy(candidate) {
    return this.left.isSatisfiedBy(candidate)
      && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
  isSatisfiedBy(candidate) {
    return this.left.isSatisfiedBy(candidate)
      || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification extends Specification {
  constructor(spec) {
    super();
    this.spec = spec;
  }
  isSatisfiedBy(candidate) {
    return !this.spec.isSatisfiedBy(candidate);
  }
}
\`\`\`

### Using Specifications

\`\`\`javascript
class OrderIsEligibleForExpressShipping extends Specification {
  isSatisfiedBy(order) {
    return order.total.amount >= 50
      && order.items.every(item => item.isInStock)
      && order.shippingAddress.country === 'US';
  }
}

class OrderIsHighValue extends Specification {
  isSatisfiedBy(order) {
    return order.total.amount >= 500;
  }
}

// Compose specifications
const expressAndHighValue = new OrderIsEligibleForExpressShipping()
  .and(new OrderIsHighValue());

if (expressAndHighValue.isSatisfiedBy(order)) {
  order.applyPriorityHandling();
}

// Use in repository queries
const eligibleOrders = allOrders.filter(o =>
  new OrderIsEligibleForExpressShipping().isSatisfiedBy(o)
);
\`\`\`

---

## Implementing DDD in Node.js — Architecture

### Folder Structure

\`\`\`
src/
├── domain/                   # Pure business logic — no dependencies
│   ├── order/
│   │   ├── Order.js          # Aggregate Root
│   │   ├── OrderLineItem.js  # Entity (inside aggregate)
│   │   ├── OrderStatus.js    # Value Object (enum)
│   │   ├── OrderRepository.js# Interface (abstract class)
│   │   ├── OrderPlaced.js    # Domain Event
│   │   └── specs/
│   │       └── OrderIsEligibleForRefund.js
│   └── shared/
│       ├── Money.js           # Value Object
│       ├── AggregateRoot.js   # Base class
│       └── DomainEvent.js     # Base class
├── application/              # Use case orchestration
│   ├── PlaceOrderService.js
│   └── CancelOrderService.js
├── infrastructure/           # External concerns
│   ├── persistence/
│   │   └── PostgresOrderRepository.js  # Implements OrderRepository
│   ├── messaging/
│   │   └── RabbitMQEventBus.js
│   └── http/
│       └── OrderController.js
\`\`\`

### The Dependency Rule in DDD

\`\`\`
  Infrastructure ──► Application ──► Domain
       │                  │             │
  Knows about         Knows about    Knows nothing
  everything          domain only    about outside
\`\`\`

- **Domain layer**: No imports from application or infrastructure. Pure JavaScript classes.
- **Application layer**: Imports from domain. Depends on abstractions (interfaces) for infrastructure.
- **Infrastructure layer**: Implements domain interfaces. Connects to databases, message brokers, HTTP.

---

## Key Interview Takeaways

1. **Entities** have identity (compared by ID); **Value Objects** have no identity (compared by value) and are immutable.
2. **Aggregates** are consistency boundaries with one root Entity — all external access goes through the root.
3. **Repositories** provide a collection-like abstraction — one per Aggregate Root, never for inner Entities.
4. **Domain Services** contain business logic that doesn't fit in Entities; **Application Services** orchestrate use cases without business logic.
5. **Domain Events** decouple side effects and enable eventual consistency between Aggregates.
6. **Factories** encapsulate complex object creation, especially when creation involves business rules.
7. **Specifications** make business rules composable, testable, and explicit.
8. **DDD folder structure** enforces the dependency rule: domain has zero external dependencies.
`
  },
];
