// ============================================================================
// Event-Driven Architecture — Content
// ============================================================================

export const topic = {
  name: "Event-Driven Architecture",
  slug: "event-driven-architecture",
  description: "Master Event-Driven Architecture from foundational concepts (event types, pub/sub, event sourcing, CQRS, eventual consistency, idempotency) to production implementation (message brokers, Node.js EventEmitter, distributed events, saga patterns, dead letter queues, event schemas, monitoring) with real-world Node.js examples.",
  order_index: 9
};

export const lessons = [
  {
    slug: "event-driven-architecture-fundamentals",
    title: "Event-Driven Architecture Fundamentals",
    order_index: 1,
    content: `# Event-Driven Architecture Fundamentals

## What Is Event-Driven Architecture?

Event-Driven Architecture (EDA) is an architectural paradigm in which the flow of a program is determined by **events** — significant changes in state that the system records and reacts to. Instead of services calling each other directly with synchronous request-response patterns (like REST calls), services communicate by **producing events** and **consuming events** through an intermediary (an event channel or message broker).

### The Core Idea

In traditional request-driven architecture, Service A calls Service B and waits for a response. This creates **temporal coupling** (A must wait for B), **behavioral coupling** (A must know B's API), and **availability coupling** (if B is down, A fails). In event-driven architecture, Service A publishes an event saying "something happened," and any number of services can react independently:

\`\`\`
Request-Driven (tight coupling):
  Order Service ──HTTP POST──► Inventory Service   (must wait, must know API, fails if down)
                 ──HTTP POST──► Email Service        (sequential, slow, fragile)
                 ──HTTP POST──► Analytics Service

Event-Driven (loose coupling):
  Order Service ──publishes "OrderPlaced"──► Event Broker
                                                │
                                    ┌───────────┼───────────┐
                                    ▼           ▼           ▼
                               Inventory    Email      Analytics
                               Service     Service     Service
                            (subscribes)  (subscribes) (subscribes)
\`\`\`

### Why EDA Matters for Interviews

Event-driven architecture is a top-tier interview topic for senior backend and system design roles. Interviewers want to know that you understand:
- When to choose EDA over synchronous patterns
- Trade-offs (eventual consistency, debugging complexity, idempotency requirements)
- Real-world implementation with message brokers
- How EDA enables scalability and resilience in distributed systems

---

## Event Types

Events can be classified into several categories based on their purpose and scope. Understanding these distinctions is critical for designing clean event-driven systems.

### 1. Domain Events

Domain Events represent something meaningful that happened **within the business domain**. They are named in the past tense using business language (Ubiquitous Language from DDD). Domain Events are the most important event type — they capture business facts.

\`\`\`javascript
// Domain Events — business-meaningful facts
const domainEvents = {
  // E-commerce domain
  OrderPlaced: {
    orderId: 'ord_abc123',
    customerId: 'cust_456',
    items: [{ productId: 'prod_001', quantity: 2, unitPrice: 29.99 }],
    totalAmount: 59.98,
    currency: 'USD',
    placedAt: '2025-01-15T10:30:00Z',
  },

  // Banking domain
  FundsTransferred: {
    transferId: 'txn_789',
    fromAccountId: 'acc_111',
    toAccountId: 'acc_222',
    amount: 500.00,
    currency: 'USD',
    transferredAt: '2025-01-15T11:00:00Z',
  },

  // Healthcare domain
  AppointmentScheduled: {
    appointmentId: 'apt_333',
    patientId: 'pat_444',
    doctorId: 'doc_555',
    scheduledFor: '2025-02-01T14:00:00Z',
    department: 'Cardiology',
  },
};
\`\`\`

**Key characteristics of Domain Events:**
- Named in past tense (\`OrderPlaced\`, not \`PlaceOrder\`)
- Immutable — once emitted, they never change
- Contain all data needed for consumers to react (self-contained)
- Belong to a specific Bounded Context

### 2. Integration Events

Integration Events are used for **cross-service communication** — they carry information between Bounded Contexts or microservices. They are a subset of Domain Events specifically designed for external consumption.

\`\`\`javascript
// Integration Event — intended for external services
// Contains only the data external services need (no internal details)
const orderPlacedIntegrationEvent = {
  eventId: 'evt_abc123',
  eventType: 'ecommerce.order.placed',    // namespaced to avoid collisions
  source: 'order-service',
  version: 2,                              // schema version for evolution
  timestamp: '2025-01-15T10:30:00Z',
  correlationId: 'req_xyz789',             // traces the original request
  data: {
    orderId: 'ord_abc123',
    customerId: 'cust_456',
    totalAmount: 59.98,
    currency: 'USD',
    // Note: does NOT expose internal fields like internalPriorityScore
  },
};
\`\`\`

**Domain Events vs. Integration Events:**
| Aspect | Domain Event | Integration Event |
|---|---|---|
| Scope | Within a Bounded Context | Across services |
| Naming | Business language | Namespaced (service.entity.action) |
| Data | Can include internal details | Only externally-relevant data |
| Schema | Can change freely | Must be versioned for backward compatibility |
| Transport | In-process event bus | Message broker (Kafka, RabbitMQ) |

### 3. Notification Events

Notification Events are **thin events** — they carry minimal data, typically just an identifier and event type. The consumer must call back to the source service to get the full details. This is useful when event payloads would be very large or when you want to ensure consumers always see the latest state.

\`\`\`javascript
// Notification Event — thin, carries minimal data
const notificationEvent = {
  eventType: 'OrderPlaced',
  orderId: 'ord_abc123',
  timestamp: '2025-01-15T10:30:00Z',
  // Consumer must call GET /orders/ord_abc123 to get full details
};

// Event-Carried State Transfer — fat event, carries full state
const stateTransferEvent = {
  eventType: 'OrderPlaced',
  orderId: 'ord_abc123',
  timestamp: '2025-01-15T10:30:00Z',
  data: {
    customerId: 'cust_456',
    items: [{ productId: 'prod_001', quantity: 2, unitPrice: 29.99 }],
    totalAmount: 59.98,
    shippingAddress: { street: '123 Main St', city: 'Seattle', state: 'WA' },
    // Full data — consumer does not need to call back
  },
};
\`\`\`

**Trade-offs:**
- **Notification Events** — smaller messages, consumers always get latest data, but create coupling (consumer must call back)
- **Event-Carried State Transfer** — larger messages, consumer is fully decoupled, but data may be stale

---

## Event Producers and Consumers

### Producers (Publishers)

Producers are components that **detect state changes and emit events**. A producer does not know or care who will consume its events — this is the essence of loose coupling.

\`\`\`javascript
class OrderService {
  constructor(eventBus, orderRepository) {
    this.eventBus = eventBus;
    this.orderRepository = orderRepository;
  }

  async placeOrder(customerId, items) {
    // 1. Execute business logic
    const order = Order.create(customerId, items);
    order.validate();                       // throws if invalid
    order.calculateTotals();

    // 2. Persist state
    await this.orderRepository.save(order);

    // 3. Publish event — producer does not know who consumes this
    await this.eventBus.publish({
      type: 'OrderPlaced',
      aggregateId: order.id,
      data: {
        orderId: order.id,
        customerId,
        items: order.items,
        totalAmount: order.totalAmount,
      },
      metadata: {
        correlationId: order.correlationId,
        timestamp: new Date().toISOString(),
        version: 1,
      },
    });

    return order;
  }
}
\`\`\`

### Consumers (Subscribers)

Consumers **listen for specific event types** and react accordingly. Multiple consumers can react to the same event independently — this is the power of EDA.

\`\`\`javascript
// Multiple independent consumers for the same event
class InventoryConsumer {
  async handle(event) {
    if (event.type !== 'OrderPlaced') return;
    for (const item of event.data.items) {
      await this.inventoryRepo.reserveStock(item.productId, item.quantity);
    }
  }
}

class NotificationConsumer {
  async handle(event) {
    if (event.type !== 'OrderPlaced') return;
    const customer = await this.customerRepo.findById(event.data.customerId);
    await this.emailService.send({
      to: customer.email,
      subject: 'Order Confirmed',
      body: \`Your order \${event.data.orderId} has been placed successfully.\`,
    });
  }
}

class AnalyticsConsumer {
  async handle(event) {
    if (event.type !== 'OrderPlaced') return;
    await this.analyticsRepo.recordPurchase({
      orderId: event.data.orderId,
      revenue: event.data.totalAmount,
      itemCount: event.data.items.length,
    });
  }
}
\`\`\`

---

## Event Channels and Brokers

An **event channel** (or message broker) is the infrastructure component that sits between producers and consumers. It receives events from producers, stores them (at least temporarily), and delivers them to consumers.

### Core Broker Responsibilities

1. **Message routing** — delivering events to the correct consumers
2. **Persistence** — storing events until consumers process them (durability)
3. **Delivery guarantees** — at-most-once, at-least-once, or exactly-once semantics
4. **Ordering** — maintaining event order within a partition or queue
5. **Fan-out** — delivering the same event to multiple consumer groups

### Broker Comparison

| Feature | RabbitMQ | Apache Kafka | Redis Pub/Sub |
|---|---|---|---|
| **Model** | Message queue (push) | Distributed log (pull) | Pub/sub (push) |
| **Persistence** | Until consumed | Configurable retention (days/forever) | None (fire-and-forget) |
| **Ordering** | Per-queue | Per-partition | No guarantees |
| **Throughput** | ~50K msg/sec | ~1M+ msg/sec | ~500K msg/sec |
| **Best for** | Task queues, RPC | Event streaming, event sourcing | Real-time notifications, caching |
| **Replay** | No (consumed = deleted) | Yes (consumers can seek to any offset) | No |
| **Consumer groups** | Via exchanges + queues | Native consumer groups | Not native |
| **Delivery** | At-least-once (with acks) | At-least-once / exactly-once | At-most-once |

---

## Pub/Sub Pattern

The **Publish-Subscribe** (Pub/Sub) pattern is the most fundamental messaging pattern in EDA. Publishers send messages to a **topic** (not to specific subscribers), and all subscribers registered to that topic receive the message.

\`\`\`javascript
// In-Process Pub/Sub implementation
class EventBus {
  #subscribers = new Map();

  subscribe(eventType, handler) {
    if (!this.#subscribers.has(eventType)) {
      this.#subscribers.set(eventType, []);
    }
    this.#subscribers.get(eventType).push(handler);

    // Return unsubscribe function for cleanup
    return () => {
      const handlers = this.#subscribers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  async publish(event) {
    const handlers = this.#subscribers.get(event.type) || [];
    const wildcardHandlers = this.#subscribers.get('*') || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    // Execute all handlers concurrently — one failure must not stop others
    const results = await Promise.allSettled(
      allHandlers.map(handler => handler(event))
    );

    // Log failures without crashing
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(\`Handler \${i} failed for \${event.type}:\`, result.reason);
      }
    });

    return results;
  }
}
\`\`\`

### Pub/Sub vs Point-to-Point

| Pattern | Pub/Sub | Point-to-Point (Queue) |
|---|---|---|
| Consumers | Many (all receive the message) | One (competing consumers) |
| Use case | Broadcasting events | Task distribution |
| Example | "OrderPlaced" → Inventory + Email + Analytics | "ProcessImage" → one available worker |

---

## Event Sourcing Basics

**Event Sourcing** is a pattern where you persist the **full sequence of events** that led to the current state, rather than storing only the current state. The event log is the single source of truth.

### Traditional State Storage vs Event Sourcing

\`\`\`
Traditional (State-Based):
  ┌──────────────────────┐
  │ Account: acc_001     │
  │ Balance: 950.00      │  ← How did we get here? Unknown.
  │ Status: Active       │
  └──────────────────────┘

Event Sourced:
  Event 1: AccountOpened    { initialBalance: 0 }         → balance: 0
  Event 2: MoneyDeposited   { amount: 1000 }               → balance: 1000
  Event 3: MoneyWithdrawn   { amount: 50 }                 → balance: 950
  ─────────────────────────────────────────────────────────
  Current state (derived): balance = 950                   ← Full audit trail!
\`\`\`

### Why Event Sourcing?

1. **Complete audit trail** — every change is recorded forever; you can answer "how did we get to this state?"
2. **Temporal queries** — reconstruct the state at any point in time
3. **Debug production issues** — replay events to reproduce bugs exactly
4. **Event replay** — feed historical events to new consumers (e.g., rebuild a read model)
5. **Regulatory compliance** — financial, healthcare, and legal domains require immutable audit logs

### Event Sourcing Implementation

\`\`\`javascript
class EventSourcedAggregate {
  #uncommittedEvents = [];
  #version = 0;

  get uncommittedEvents() { return [...this.#uncommittedEvents]; }
  get version() { return this.#version; }

  // Apply an event to update internal state
  applyEvent(event) {
    this.onEvent(event);     // subclass implements state mutation
    this.#version++;
  }

  // Record a new event (when handling a command)
  recordEvent(eventType, data) {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      version: this.#version + 1,
    };
    this.applyEvent(event);
    this.#uncommittedEvents.push(event);
  }

  // Hydrate from stored events
  static fromHistory(events, AggregateClass) {
    const instance = new AggregateClass();
    events.forEach(event => instance.applyEvent(event));
    instance.#uncommittedEvents = [];
    return instance;
  }

  clearUncommittedEvents() {
    this.#uncommittedEvents = [];
  }
}

class BankAccount extends EventSourcedAggregate {
  #balance = 0;
  #status = 'pending';
  #accountId = null;

  get balance() { return this.#balance; }
  get status() { return this.#status; }

  // Command: Open Account
  open(accountId, initialDeposit) {
    if (this.#status !== 'pending') throw new Error('Account already opened');
    if (initialDeposit < 0) throw new Error('Initial deposit cannot be negative');
    this.recordEvent('AccountOpened', { accountId, initialDeposit });
  }

  // Command: Deposit Money
  deposit(amount) {
    if (this.#status !== 'active') throw new Error('Account is not active');
    if (amount <= 0) throw new Error('Deposit amount must be positive');
    this.recordEvent('MoneyDeposited', { amount });
  }

  // Command: Withdraw Money
  withdraw(amount) {
    if (this.#status !== 'active') throw new Error('Account is not active');
    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.recordEvent('MoneyWithdrawn', { amount });
  }

  // State transitions based on events
  onEvent(event) {
    switch (event.type) {
      case 'AccountOpened':
        this.#accountId = event.data.accountId;
        this.#balance = event.data.initialDeposit;
        this.#status = 'active';
        break;
      case 'MoneyDeposited':
        this.#balance += event.data.amount;
        break;
      case 'MoneyWithdrawn':
        this.#balance -= event.data.amount;
        break;
    }
  }
}
\`\`\`

---

## CQRS (Command Query Responsibility Segregation)

CQRS is the principle that **commands** (writes that change state) and **queries** (reads that return data) should use **separate models**, and often separate databases.

### Why Separate Reads and Writes?

In most applications, read patterns and write patterns are fundamentally different:
- **Writes** need strong consistency, validation, business rules, and transactional guarantees
- **Reads** need speed, denormalized data for display, and can tolerate slight staleness

By separating them, you optimize each independently:

\`\`\`
                 ┌──────────────┐
   Command ────►│  Write Model  │────► Event Store (PostgreSQL)
   (POST/PUT)   │  (Normalized) │         │
                 └──────────────┘         │ Domain Events
                                          ▼
                                    ┌───────────┐
                                    │ Projector  │  (listens for events,
                                    │ (Event     │   updates read model)
                                    │  Handler)  │
                                    └───────────┘
                                          │
                 ┌──────────────┐         ▼
   Query ──────►│  Read Model   │◄─── Read DB (Elasticsearch/Redis/Mongo)
   (GET)        │ (Denormalized)│
                 └──────────────┘
\`\`\`

### CQRS Implementation Sketch

\`\`\`javascript
// --- WRITE SIDE ---
class PlaceOrderCommandHandler {
  constructor(eventStore, eventBus) {
    this.eventStore = eventStore;
    this.eventBus = eventBus;
  }

  async execute(command) {
    // Load aggregate from events
    const events = await this.eventStore.getEvents(command.orderId);
    const order = Order.fromHistory(events);

    // Execute command (validates business rules, records events)
    order.place(command.customerId, command.items);

    // Persist new events
    const newEvents = order.uncommittedEvents;
    await this.eventStore.appendEvents(
      command.orderId, 'Order', newEvents, order.version - newEvents.length
    );

    // Publish events to read side
    for (const event of newEvents) {
      await this.eventBus.publish(event);
    }
  }
}

// --- READ SIDE (Projection) ---
class OrderListProjection {
  constructor(readDb, eventBus) {
    this.readDb = readDb;
    eventBus.subscribe('OrderPlaced', (e) => this.onOrderPlaced(e));
    eventBus.subscribe('OrderShipped', (e) => this.onOrderShipped(e));
    eventBus.subscribe('OrderCancelled', (e) => this.onOrderCancelled(e));
  }

  async onOrderPlaced(event) {
    await this.readDb.upsert('order_list', {
      id: event.data.orderId,
      customerId: event.data.customerId,
      totalAmount: event.data.totalAmount,
      status: 'placed',
      itemCount: event.data.items.length,
      placedAt: event.timestamp,
    });
  }

  async onOrderShipped(event) {
    await this.readDb.update('order_list', event.data.orderId, {
      status: 'shipped',
      shippedAt: event.timestamp,
      trackingNumber: event.data.trackingNumber,
    });
  }

  async onOrderCancelled(event) {
    await this.readDb.update('order_list', event.data.orderId, {
      status: 'cancelled',
      cancelledAt: event.timestamp,
      cancellationReason: event.data.reason,
    });
  }
}

// --- QUERY SIDE ---
class OrderQueryService {
  constructor(readDb) {
    this.readDb = readDb;
  }

  async getOrderList(customerId, filters) {
    return this.readDb.find('order_list', { customerId, ...filters });
  }

  async getOrderDetails(orderId) {
    return this.readDb.findById('order_details', orderId);
  }
}
\`\`\`

### When to Use CQRS

| Use CQRS When | Avoid CQRS When |
|---|---|
| Read and write workloads are vastly different | Simple CRUD with similar read/write patterns |
| Complex domain with rich business rules on writes | Few business rules |
| Need different read models (lists, search, reports) | Single way to display data |
| Using Event Sourcing (CQRS is a natural complement) | Team is small and unfamiliar with the pattern |
| High read-to-write ratio (optimize reads independently) | Simple application with low traffic |

---

## Event-Driven vs Request-Driven Architecture

| Aspect | Request-Driven | Event-Driven |
|---|---|---|
| **Communication** | Synchronous (HTTP, gRPC) | Asynchronous (message broker) |
| **Coupling** | Tight (caller knows callee) | Loose (producer does not know consumers) |
| **Failure impact** | Cascading failures | Isolated failures |
| **Consistency** | Immediate (strong) | Eventual |
| **Scalability** | Limited by slowest service | Each service scales independently |
| **Debugging** | Linear call trace (easy) | Distributed event flow (harder) |
| **Adding features** | Modify existing services | Add new consumers (Open/Closed Principle) |
| **Latency** | Predictable | Variable (async processing) |
| **Best for** | Simple CRUD, user-facing queries | Complex workflows, high-throughput, integrations |

**Interview tip:** Do not present EDA as universally better. Explain that most production systems use a **hybrid approach** — synchronous for user-facing queries that need immediate response, asynchronous events for side effects, integrations, and background processing.

---

## Benefits and Challenges of EDA

### Benefits

1. **Loose Coupling** — producers and consumers can be developed, deployed, and scaled independently
2. **Scalability** — add consumers without touching producers; scale hot paths independently
3. **Resilience** — if a consumer is down, events queue up and are processed when it recovers
4. **Extensibility** — add new functionality by adding new consumers (Open/Closed Principle)
5. **Audit Trail** — events naturally create a log of everything that happened
6. **Temporal Decoupling** — producer and consumer do not need to be available at the same time
7. **Performance** — non-blocking; producer returns immediately after publishing

### Challenges

1. **Eventual Consistency** — consumers update asynchronously; reads may show stale data
2. **Debugging Complexity** — no single call stack; events flow through multiple services
3. **Idempotency Requirement** — consumers must handle duplicate events (at-least-once delivery)
4. **Ordering Issues** — events may arrive out of order without careful partitioning
5. **Schema Evolution** — changing event schemas requires backward compatibility
6. **Error Handling** — failures are harder to propagate back to the caller
7. **Testing** — integration testing async flows is more complex than REST API tests

---

## Eventual Consistency

In EDA, because events are processed asynchronously, there is a delay between when a state change occurs and when all consumers reflect that change. This is called **eventual consistency** — the system will become consistent, but not immediately.

### Example: The Stale Read Problem

\`\`\`
1. User places order ────► Order Service writes to DB ────► publishes "OrderPlaced"
2. User immediately views order list ────► Query Service reads from READ DB
3. Problem: The projection has not processed "OrderPlaced" yet → user sees no order!
\`\`\`

### Mitigation Strategies

\`\`\`javascript
// Strategy 1: Read-Your-Own-Writes
// After a write, read from the write model (not the read model) for immediate confirmation
class OrderController {
  async placeOrder(req, res) {
    const order = await this.commandHandler.placeOrder(req.body);
    // Return the order directly from the write — do not read from projection
    res.status(201).json({
      orderId: order.id,
      status: 'placed',
      message: 'Order placed successfully',
    });
  }
}

// Strategy 2: Polling with short retries
class OrderController {
  async getOrder(req, res) {
    const maxRetries = 5;
    const delay = 200; // ms
    for (let i = 0; i < maxRetries; i++) {
      const order = await this.queryService.getOrder(req.params.id);
      if (order) return res.json(order);
      await new Promise(r => setTimeout(r, delay));
    }
    res.status(404).json({ message: 'Order not found yet — try again shortly' });
  }
}

// Strategy 3: Optimistic UI (frontend)
// The frontend immediately shows the expected state without waiting for the backend
\`\`\`

---

## Idempotency

**Idempotency** means processing the same event multiple times produces the same result as processing it once. This is **non-negotiable** in EDA because message brokers use "at-least-once" delivery — events may be delivered more than once due to retries, network issues, or consumer crashes.

### Why Duplicates Happen

1. Consumer processes event, crashes before acknowledging → broker re-delivers
2. Network timeout: broker does not receive ACK → re-delivers
3. Consumer is slow: broker times out and re-delivers
4. Manual replay of events for recovery

### Implementing Idempotency

\`\`\`javascript
class IdempotentEventHandler {
  constructor(processedEventStore) {
    this.processedEventStore = processedEventStore; // e.g., Redis SET or DB table
  }

  async handle(event, processorFn) {
    const eventId = event.id || event.eventId;

    // 1. Check if already processed
    const alreadyProcessed = await this.processedEventStore.has(eventId);
    if (alreadyProcessed) {
      console.log(\`Event \${eventId} already processed — skipping (idempotent)\`);
      return { skipped: true };
    }

    // 2. Process the event
    const result = await processorFn(event);

    // 3. Record that we processed it (with a TTL for cleanup)
    await this.processedEventStore.set(eventId, {
      processedAt: new Date().toISOString(),
      eventType: event.type,
    }, { ttl: 7 * 24 * 60 * 60 }); // 7 days TTL

    return { skipped: false, result };
  }
}

// Alternative: Use naturally idempotent operations
class NaturallyIdempotentHandler {
  async handleOrderPlaced(event) {
    // UPSERT is naturally idempotent — running it twice produces the same result
    await db.query(
      \`INSERT INTO order_projections (order_id, customer_id, total, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         total = EXCLUDED.total,
         status = EXCLUDED.status\`,
      [event.data.orderId, event.data.customerId, event.data.totalAmount, 'placed']
    );
  }
}
\`\`\`

### Idempotency Checklist for Interviews

- **Database writes**: Use UPSERT / ON CONFLICT instead of INSERT
- **Payments**: Check if payment was already processed before charging
- **Emails**: Check if notification was already sent for this event
- **Counters**: Use SET (absolute value) instead of INCREMENT (relative)
- **External APIs**: Use idempotency keys (e.g., Stripe's Idempotency-Key header)
`
  },
  {
    slug: "implementing-event-driven-systems",
    title: "Implementing Event-Driven Systems",
    order_index: 2,
    content: `# Implementing Event-Driven Systems

## Message Brokers in Practice

Choosing the right message broker is one of the most important infrastructure decisions in an event-driven system. Each broker has different strengths and trade-offs.

### RabbitMQ

RabbitMQ is a traditional **message queue** broker that implements the AMQP protocol. It uses a **push-based** model where the broker pushes messages to consumers. Messages are deleted after being consumed (acknowledged).

\`\`\`javascript
// RabbitMQ with amqplib
import amqp from 'amqplib';

class RabbitMQBroker {
  constructor(url) {
    this.url = url;
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();

    this.connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });
    this.connection.on('close', () => {
      console.warn('RabbitMQ connection closed — reconnecting...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  // Publish to a topic exchange (fan-out to all bound queues)
  async publish(exchange, routingKey, event) {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const message = Buffer.from(JSON.stringify(event));
    this.channel.publish(exchange, routingKey, message, {
      persistent: true,
      contentType: 'application/json',
      messageId: event.id,
      timestamp: Date.now(),
    });
  }

  // Subscribe: each service gets its own queue bound to the exchange
  async subscribe(exchange, routingPattern, queueName, handler) {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: 'dlx',  // failed messages go to DLQ
    });
    await this.channel.bindQueue(q.queue, exchange, routingPattern);
    await this.channel.prefetch(1);

    this.channel.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel.ack(msg);     // acknowledge: remove from queue
      } catch (err) {
        console.error('Failed to process message:', err);
        this.channel.nack(msg, false, false); // send to DLQ
      }
    });
  }
}
\`\`\`

**When to use RabbitMQ:**
- Task queues (job processing, background work)
- Request-reply patterns (RPC over message queue)
- Complex routing logic (topic exchanges, header-based routing)
- When you need messages to be consumed exactly once (with ack)

### Apache Kafka

Kafka is a **distributed event streaming platform** that uses a **pull-based** log model. Events are appended to an immutable, ordered log (topic partition) and consumers read from the log at their own pace. Events are **retained** even after being consumed (configurable retention period).

\`\`\`javascript
// Kafka with kafkajs
import { Kafka } from 'kafkajs';

class KafkaBroker {
  constructor(brokers, clientId) {
    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: { initialRetryTime: 300, retries: 10 },
    });
    this.producer = null;
    this.consumers = new Map();
  }

  async connectProducer() {
    this.producer = this.kafka.producer({ idempotent: true });
    await this.producer.connect();
  }

  async publish(topic, event) {
    await this.producer.send({
      topic,
      messages: [{
        key: event.aggregateId,      // same aggregate → same partition → ordered
        value: JSON.stringify(event),
        headers: {
          'event-type': event.type,
          'correlation-id': event.correlationId || '',
          'schema-version': String(event.version || 1),
        },
      }],
    });
  }

  async subscribe(topic, groupId, handler) {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        const headers = Object.fromEntries(
          Object.entries(message.headers).map(([k, v]) => [k, v.toString()])
        );
        await handler({
          ...event,
          _kafka: { topic, partition, offset: message.offset, headers },
        });
      },
    });

    this.consumers.set(groupId, consumer);
  }
}
\`\`\`

**When to use Kafka:**
- Event sourcing (immutable log is the source of truth)
- High-throughput event streaming (millions of events/sec)
- Event replay (consumers can rewind and re-read events)
- Multiple consumer groups reading the same stream independently
- Real-time analytics pipelines

### Redis Pub/Sub and Redis Streams

Redis Pub/Sub is a lightweight, fire-and-forget pub/sub mechanism. Redis Streams (introduced in Redis 5.0) adds persistence and consumer groups.

\`\`\`javascript
import { createClient } from 'redis';

class RedisStreamBroker {
  constructor(redisUrl) {
    this.client = createClient({ url: redisUrl });
  }

  async connect() {
    await this.client.connect();
  }

  async publish(stream, event) {
    const id = await this.client.xAdd(stream, '*', {
      type: event.type,
      data: JSON.stringify(event.data),
      timestamp: new Date().toISOString(),
    });
    return id;
  }

  async subscribe(stream, groupName, consumerName, handler) {
    // Create consumer group (ignore error if already exists)
    try {
      await this.client.xGroupCreate(stream, groupName, '0', { MKSTREAM: true });
    } catch (err) {
      if (!err.message.includes('BUSYGROUP')) throw err;
    }

    while (true) {
      try {
        const results = await this.client.xReadGroup(
          groupName, consumerName,
          [{ key: stream, id: '>' }],
          { COUNT: 10, BLOCK: 5000 }
        );

        if (results) {
          for (const { messages } of results) {
            for (const { id, message } of messages) {
              const event = {
                type: message.type,
                data: JSON.parse(message.data),
                timestamp: message.timestamp,
              };
              await handler(event);
              await this.client.xAck(stream, groupName, id);
            }
          }
        }
      } catch (err) {
        console.error('Redis stream read error:', err);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}
\`\`\`

**Redis Pub/Sub vs Redis Streams:**
| Feature | Redis Pub/Sub | Redis Streams |
|---|---|---|
| Persistence | No (fire-and-forget) | Yes (stored in stream) |
| Consumer groups | No | Yes |
| Message acknowledgment | No | Yes (XACK) |
| Replay | No | Yes (read from any ID) |
| Use case | Real-time notifications | Lightweight event streaming |

---

## Implementing Events with Node.js EventEmitter

Node.js has a built-in \`EventEmitter\` class that implements the observer pattern. It is useful for **in-process** event-driven design within a single application.

\`\`\`javascript
import { EventEmitter } from 'events';

class DomainEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  // Type-safe publish with metadata
  emitDomainEvent(eventType, data, metadata = {}) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: process.env.SERVICE_NAME || 'unknown',
      },
    };

    this.emit(eventType, event);   // specific listeners
    this.emit('*', event);         // wildcard listeners (logging, auditing)
    return event;
  }

  // Register a handler with error isolation
  onDomainEvent(eventType, handler) {
    this.on(eventType, async (event) => {
      try {
        await handler(event);
      } catch (err) {
        console.error(\`Handler error for \${eventType}:\`, err);
        this.emit('error', { event, error: err });
      }
    });
  }
}

// Usage
const domainEvents = new DomainEventEmitter();

domainEvents.onDomainEvent('UserRegistered', async (event) => {
  await sendWelcomeEmail(event.data.email);
});

domainEvents.onDomainEvent('UserRegistered', async (event) => {
  await createDefaultSettings(event.data.userId);
});

domainEvents.onDomainEvent('*', async (event) => {
  await auditLog.record(event);
});

domainEvents.emitDomainEvent('UserRegistered', {
  userId: 'user_123',
  email: 'jane@example.com',
  plan: 'premium',
});
\`\`\`

**Limitations of Node.js EventEmitter:**
- In-process only — cannot communicate between services
- No persistence — events are lost if the process crashes
- No replay — no way to re-process past events
- No ordering guarantees across async handlers
- For cross-service events, use a message broker (RabbitMQ, Kafka, Redis Streams)

---

## Event Schemas and Versioning

As systems evolve, event schemas change. Without careful versioning, schema changes break consumers. This is one of the most critical operational concerns in EDA.

### Schema Versioning Strategies

\`\`\`javascript
// Strategy 1: Version in event type name (simple, explicit)
const eventV1 = {
  type: 'OrderPlaced_v1',
  data: { orderId: '123', total: 99.99 },
};
const eventV2 = {
  type: 'OrderPlaced_v2',
  data: { orderId: '123', totalAmount: 99.99, currency: 'USD' },
};

// Strategy 2: Version in metadata (clean, recommended)
const event = {
  type: 'OrderPlaced',
  version: 2,
  data: { orderId: '123', totalAmount: 99.99, currency: 'USD' },
};

// Event Upcaster: transform old event versions into the current schema
class EventUpcaster {
  #upcasters = new Map();

  register(eventType, fromVersion, toVersion, transform) {
    this.#upcasters.set(
      \`\${eventType}:\${fromVersion}->\${toVersion}\`,
      transform
    );
  }

  upcast(event) {
    const currentVersion = event.version || 1;
    const latestVersion = this.getLatestVersion(event.type);

    let result = { ...event };
    for (let v = currentVersion; v < latestVersion; v++) {
      const key = \`\${event.type}:\${v}->\${v + 1}\`;
      const transform = this.#upcasters.get(key);
      if (!transform) throw new Error(\`No upcaster for \${key}\`);
      result = transform(result);
    }
    return result;
  }

  getLatestVersion(eventType) {
    let max = 1;
    for (const key of this.#upcasters.keys()) {
      if (key.startsWith(eventType)) {
        const toVersion = parseInt(key.split('->')[1]);
        if (toVersion > max) max = toVersion;
      }
    }
    return max;
  }
}

// Register upcasters
const upcaster = new EventUpcaster();
upcaster.register('OrderPlaced', 1, 2, (event) => ({
  ...event,
  version: 2,
  data: {
    ...event.data,
    totalAmount: event.data.total,            // renamed field
    currency: event.data.currency || 'USD',   // new required field with default
  },
}));
\`\`\`

### Schema Evolution Rules (Backward Compatibility)

| Safe Change | Unsafe Change |
|---|---|
| Add optional field with default | Remove an existing field |
| Add new event type | Rename an existing field |
| Deprecate a field (keep but ignore) | Change field type (string to number) |
| Add a new version with upcaster | Change the meaning of a field |

---

## Dead Letter Queues (DLQ)

A **Dead Letter Queue** is a special queue where messages that cannot be processed are sent after exhausting all retry attempts. This prevents "poison messages" from blocking the entire queue.

\`\`\`javascript
class DeadLetterQueueHandler {
  constructor(broker, maxRetries = 3) {
    this.broker = broker;
    this.maxRetries = maxRetries;
  }

  async processWithDLQ(event, handler, dlqTopic) {
    const retryCount = event._retryCount || 0;

    try {
      await handler(event);
    } catch (err) {
      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.warn(
          \`Retry \${retryCount + 1}/\${this.maxRetries} for event \${event.id} in \${delay}ms\`
        );
        await new Promise(r => setTimeout(r, delay));
        await this.processWithDLQ(
          { ...event, _retryCount: retryCount + 1 },
          handler,
          dlqTopic
        );
      } else {
        console.error(
          \`Event \${event.id} failed after \${this.maxRetries} retries — sending to DLQ\`
        );
        await this.broker.publish(dlqTopic, {
          originalEvent: event,
          error: {
            message: err.message,
            stack: err.stack,
            failedAt: new Date().toISOString(),
          },
          retryCount,
        });
      }
    }
  }
}
\`\`\`

### Why DLQ Matters

- **Prevents queue poisoning** — one bad message does not block all subsequent messages
- **Enables investigation** — failed messages are preserved for debugging
- **Supports manual replay** — once the bug is fixed, DLQ messages can be replayed
- **Production essential** — every production event-driven system needs a DLQ strategy

---

## Retry Strategies

Retry strategies determine how the system handles transient failures (network timeouts, temporary unavailability).

\`\`\`javascript
class RetryStrategy {
  // Fixed delay: always wait the same amount of time
  static fixed(delayMs) {
    return (attempt) => delayMs;
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
  static exponentialBackoff(baseMs = 1000, maxMs = 30000) {
    return (attempt) => Math.min(baseMs * Math.pow(2, attempt), maxMs);
  }

  // Exponential backoff with jitter (recommended for distributed systems)
  // Prevents thundering herd — all retrying consumers hitting at the same time
  static exponentialBackoffWithJitter(baseMs = 1000, maxMs = 30000) {
    return (attempt) => {
      const exponentialDelay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
      const jitter = Math.random() * exponentialDelay;
      return Math.floor(jitter);
    };
  }
}

class ResilientEventProcessor {
  constructor(strategy, maxRetries = 5) {
    this.getDelay = strategy;
    this.maxRetries = maxRetries;
  }

  async process(event, handler) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await handler(event);
      } catch (err) {
        lastError = err;

        // Do not retry non-transient errors
        if (this.isNonTransient(err)) throw err;

        if (attempt < this.maxRetries) {
          const delay = this.getDelay(attempt);
          console.warn(
            \`Attempt \${attempt + 1} failed, retrying in \${delay}ms: \${err.message}\`
          );
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }

  isNonTransient(err) {
    return err.statusCode === 400 ||
           err.statusCode === 404 ||
           err.code === 'VALIDATION_ERROR';
  }
}
\`\`\`

---

## Saga Pattern for Distributed Transactions

In microservices, you cannot use traditional database transactions across services. The **Saga pattern** manages distributed transactions by breaking them into a sequence of **local transactions**, each publishing an event that triggers the next step. If any step fails, **compensating transactions** undo previous steps.

### Choreography-Based Saga

In choreography, each service listens for events and decides what to do next. There is no central coordinator — services react independently.

\`\`\`javascript
// Choreography: each service reacts to events independently
class OrderService {
  async placeOrder(orderData) {
    const order = await this.orderRepo.create({ ...orderData, status: 'pending' });
    await this.eventBus.publish({
      type: 'OrderPlaced',
      data: { orderId: order.id, ...orderData },
    });
  }

  async onPaymentFailed(event) {
    await this.orderRepo.updateStatus(event.data.orderId, 'cancelled');
    await this.eventBus.publish({
      type: 'OrderCancelled',
      data: { orderId: event.data.orderId, reason: 'Payment failed' },
    });
  }
}

class PaymentService {
  async onOrderPlaced(event) {
    try {
      await this.paymentGateway.charge(event.data.customerId, event.data.totalAmount);
      await this.eventBus.publish({
        type: 'PaymentCompleted',
        data: { orderId: event.data.orderId, paymentId: 'pay_123' },
      });
    } catch (err) {
      await this.eventBus.publish({
        type: 'PaymentFailed',
        data: { orderId: event.data.orderId, reason: err.message },
      });
    }
  }
}

class InventoryService {
  async onPaymentCompleted(event) {
    try {
      await this.inventoryRepo.reserveStock(event.data.orderId);
      await this.eventBus.publish({
        type: 'StockReserved',
        data: { orderId: event.data.orderId },
      });
    } catch (err) {
      await this.eventBus.publish({
        type: 'StockReservationFailed',
        data: { orderId: event.data.orderId, reason: err.message },
      });
    }
  }
}
\`\`\`

### Orchestration-Based Saga

In orchestration, a **central coordinator** (saga orchestrator) tells each service what to do and handles failures.

\`\`\`javascript
class OrderSagaOrchestrator {
  constructor(services, eventBus) {
    this.services = services;
    this.eventBus = eventBus;
  }

  async execute(orderData) {
    const sagaId = crypto.randomUUID();
    const compensations = [];

    try {
      // Step 1: Create Order
      const order = await this.services.order.create(orderData);
      compensations.push(() => this.services.order.cancel(order.id));

      // Step 2: Process Payment
      const payment = await this.services.payment.charge(
        orderData.customerId, orderData.totalAmount
      );
      compensations.push(() => this.services.payment.refund(payment.id));

      // Step 3: Reserve Inventory
      const reservation = await this.services.inventory.reserve(orderData.items);
      compensations.push(() => this.services.inventory.release(reservation.id));

      // Step 4: Arrange Shipping
      const shipment = await this.services.shipping.schedule(order.id, orderData.address);
      compensations.push(() => this.services.shipping.cancel(shipment.id));

      // All steps succeeded
      await this.services.order.updateStatus(order.id, 'confirmed');
      await this.eventBus.publish({
        type: 'OrderSagaCompleted',
        data: { sagaId, orderId: order.id },
      });

      return { success: true, orderId: order.id };
    } catch (err) {
      // Execute compensations in REVERSE order
      console.error(\`Saga \${sagaId} failed: \${err.message}\`);

      for (let i = compensations.length - 1; i >= 0; i--) {
        try {
          await compensations[i]();
        } catch (compErr) {
          console.error(\`Compensation \${i} FAILED: \${compErr.message}\`);
          await this.eventBus.publish({
            type: 'SagaCompensationFailed',
            data: { sagaId, step: i, error: compErr.message },
          });
        }
      }

      return { success: false, error: err.message };
    }
  }
}
\`\`\`

### Choreography vs Orchestration

| Aspect | Choreography | Orchestration |
|---|---|---|
| Coordination | Decentralized (each service decides) | Centralized (saga coordinator) |
| Coupling | Very loose | Coordinator knows all steps |
| Visibility | Hard to see the full flow | Easy to see the full flow |
| Debugging | Difficult (trace through many services) | Easier (single coordinator logs) |
| Single point of failure | No | Yes (the orchestrator) |
| Best for | Simple sagas (2-3 steps) | Complex sagas (4+ steps) |

---

## Event Store Implementation

An event store is a specialized database optimized for storing and retrieving event streams. It must support: appending events, reading events by aggregate ID, optimistic concurrency control, and optionally snapshots.

\`\`\`javascript
class PostgresEventStore {
  constructor(pool) {
    this.pool = pool;
  }

  async initialize() {
    await this.pool.query(\`
      CREATE TABLE IF NOT EXISTS event_store (
        id BIGSERIAL PRIMARY KEY,
        aggregate_id VARCHAR(255) NOT NULL,
        aggregate_type VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        version INTEGER NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(aggregate_id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_event_store_aggregate
        ON event_store(aggregate_id, version ASC);

      CREATE TABLE IF NOT EXISTS event_snapshots (
        aggregate_id VARCHAR(255) PRIMARY KEY,
        aggregate_type VARCHAR(100) NOT NULL,
        version INTEGER NOT NULL,
        state JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    \`);
  }

  async getEvents(aggregateId, afterVersion = 0) {
    const { rows } = await this.pool.query(
      'SELECT * FROM event_store WHERE aggregate_id = $1 AND version > $2 ORDER BY version ASC',
      [aggregateId, afterVersion]
    );
    return rows;
  }

  async appendEvents(aggregateId, aggregateType, events, expectedVersion) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Optimistic concurrency control
      const { rows } = await client.query(
        'SELECT COALESCE(MAX(version), 0) as current_version FROM event_store WHERE aggregate_id = $1',
        [aggregateId]
      );
      const currentVersion = rows[0].current_version;

      if (currentVersion !== expectedVersion) {
        throw new Error(
          \`Concurrency conflict: expected v\${expectedVersion}, got v\${currentVersion}\`
        );
      }

      const savedEvents = [];
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;
        const { rows: inserted } = await client.query(
          \`INSERT INTO event_store (aggregate_id, aggregate_type, event_type, version, data, metadata)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *\`,
          [aggregateId, aggregateType, event.type, version, event.data, event.metadata || {}]
        );
        savedEvents.push(inserted[0]);
      }

      await client.query('COMMIT');
      return savedEvents;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async saveSnapshot(aggregateId, aggregateType, version, state) {
    await this.pool.query(
      \`INSERT INTO event_snapshots (aggregate_id, aggregate_type, version, state)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (aggregate_id) DO UPDATE SET
         version = EXCLUDED.version,
         state = EXCLUDED.state,
         created_at = NOW()\`,
      [aggregateId, aggregateType, version, state]
    );
  }

  async loadAggregate(aggregateId) {
    const { rows: snapRows } = await this.pool.query(
      'SELECT * FROM event_snapshots WHERE aggregate_id = $1',
      [aggregateId]
    );
    const snapshot = snapRows[0] || null;
    const afterVersion = snapshot ? snapshot.version : 0;
    const events = await this.getEvents(aggregateId, afterVersion);
    return { snapshot, events };
  }
}
\`\`\`

---

## Monitoring and Debugging Event-Driven Systems

Event-driven systems are harder to monitor than synchronous systems because there is no single request-response flow. You need specialized tooling and patterns.

### Correlation IDs

A **correlation ID** is a unique identifier that follows a request through all services and events it triggers. This is the single most important debugging tool in EDA.

\`\`\`javascript
// Middleware to extract or generate correlation ID
function correlationMiddleware(req, res, next) {
  req.correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}

// Always include correlation ID in events
async function publishWithCorrelation(eventBus, eventType, data, correlationId) {
  await eventBus.publish({
    id: crypto.randomUUID(),
    type: eventType,
    data,
    metadata: {
      correlationId,
      timestamp: new Date().toISOString(),
      source: process.env.SERVICE_NAME,
    },
  });
}

// When consuming and re-publishing, propagate the correlation ID
async function handleOrderPlaced(event) {
  // ... process the event ...
  await eventBus.publish({
    type: 'PaymentProcessed',
    data: { orderId: event.data.orderId, paymentId: 'pay_456' },
    metadata: {
      correlationId: event.metadata.correlationId,  // SAME correlation ID
      causationId: event.id,                         // which event caused this one
    },
  });
}
\`\`\`

### Key Metrics to Monitor

| Metric | What It Tells You | Alert Threshold |
|---|---|---|
| **Event lag** | Time between publish and consume | > 30 seconds |
| **Consumer lag** | Number of unconsumed events per consumer | > 10,000 |
| **DLQ depth** | Number of messages in dead letter queue | > 0 |
| **Processing rate** | Events processed per second per consumer | Sudden drop |
| **Error rate** | Percentage of events that fail processing | > 1% |
| **End-to-end latency** | Total time from first event to saga completion | > SLA |

### Debugging Checklist for EDA Issues

1. **Check the correlation ID** — trace the event flow across services
2. **Check the DLQ** — are events failing and ending up in the dead letter queue?
3. **Check consumer lag** — is a consumer falling behind?
4. **Check idempotency** — is the same event being processed multiple times?
5. **Check event ordering** — are events arriving in the wrong order?
6. **Check schema version** — is a producer sending a newer schema than the consumer expects?
7. **Check backpressure** — is the producer overwhelming the consumer?
`
  },
];
