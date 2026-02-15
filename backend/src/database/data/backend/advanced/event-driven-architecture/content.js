// ============================================================================
// Event-Driven Architecture — Content
// ============================================================================

export const topic = {
  "name": "Event-Driven Architecture",
  "slug": "event-driven-architecture",
  "description": "Build loosely coupled systems with event sourcing, CQRS, message queues, and asynchronous communication patterns.",
  "estimated_time": 240,
  "order_index": 9
};

export const lessons = [
  {
    title: "Event-Driven Fundamentals",
    slug: "event-driven-fundamentals",
    summary: "Understand event-driven architecture, event types, message brokers, and pub/sub patterns.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "Events represent something that happened — they are immutable facts",
  "Producers emit events; Consumers react to them — loose coupling",
  "Message brokers (RabbitMQ, Kafka, Redis Pub/Sub) enable async communication",
  "Event types: Domain Events, Integration Events, System Events",
  "At-least-once delivery requires idempotent consumers"
],
    content: `# Event-Driven Architecture Fundamentals

## What is Event-Driven Architecture?

Instead of services calling each other directly (synchronous), services communicate by **producing and consuming events** (asynchronous).

\`\`\`
┌────────────┐    Event     ┌────────────────┐    Event     ┌───────────────┐
│  Order     │────────────►│  Message Broker  │────────────►│  Inventory    │
│  Service   │              │  (Kafka/Redis)  │             │  Service      │
└────────────┘              └────────────────┘             └───────────────┘
                                    │
                                    │ Event
                                    ▼
                            ┌───────────────┐
                            │  Notification  │
                            │  Service       │
                            └───────────────┘
\`\`\`

## Event Structure

\`\`\`javascript
const orderPlacedEvent = {
  id: 'evt_abc123',
  type: 'OrderPlaced',
  source: 'order-service',
  timestamp: '2024-01-15T10:30:00Z',
  data: {
    orderId: 'ord_456',
    customerId: 'cust_789',
    items: [
      { productId: 'prod_001', quantity: 2, price: 29.99 }
    ],
    total: 59.98,
  },
  metadata: {
    correlationId: 'req_xyz',
    version: 1,
  },
};
\`\`\`

## In-Process Event Bus

\`\`\`javascript
class EventBus {
  #handlers = new Map();

  subscribe(eventType, handler) {
    if (!this.#handlers.has(eventType)) {
      this.#handlers.set(eventType, []);
    }
    this.#handlers.get(eventType).push(handler);
  }

  async publish(event) {
    const handlers = this.#handlers.get(event.type) || [];
    await Promise.allSettled(
      handlers.map(handler => handler(event))
    );
  }
}

const bus = new EventBus();

bus.subscribe('OrderPlaced', async (event) => {
  await inventoryService.reserveStock(event.data.items);
});

bus.subscribe('OrderPlaced', async (event) => {
  await emailService.sendConfirmation(event.data.customerId);
});

bus.subscribe('OrderPlaced', async (event) => {
  await analyticsService.trackPurchase(event.data);
});

// Single publish triggers multiple independent reactions
await bus.publish(orderPlacedEvent);
\`\`\`

## Idempotent Consumers

Since messages can be delivered more than once, consumers must handle duplicates:

\`\`\`javascript
class IdempotentConsumer {
  constructor(processedStore) {
    this.processedStore = processedStore;
  }

  async handle(event, processor) {
    // Check if this event was already processed
    if (await this.processedStore.has(event.id)) {
      console.log(\`Event \${event.id} already processed — skipping\`);
      return;
    }

    await processor(event);

    // Mark as processed
    await this.processedStore.set(event.id, { processedAt: new Date() });
  }
}
\`\`\`
`,
  },
  {
    title: "Event Sourcing & CQRS",
    slug: "event-sourcing-cqrs",
    summary: "Store state as a sequence of events and separate read/write models for optimized performance and full audit trails.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 2,
    key_points: [
  "Event Sourcing stores events instead of current state — the event log IS the source of truth",
  "Current state is derived by replaying events in order",
  "CQRS separates the read model (queries) from the write model (commands)",
  "Event Sourcing provides a complete audit log for free",
  "Snapshots optimize replay performance for long event streams"
],
    content: `# Event Sourcing & CQRS

## Event Sourcing

Instead of storing current state, store **every change** as an immutable event:

\`\`\`
Traditional:  account.balance = 950  ← How did it get here?
Event Sourced:
  1. AccountOpened { balance: 0 }
  2. MoneyDeposited { amount: 1000 }
  3. MoneyWithdrawn { amount: 50 }
  → Current balance: 950  ← Full history!
\`\`\`

\`\`\`javascript
class EventSourcedAccount {
  #events = [];
  #balance = 0;

  // Apply events to rebuild state
  #apply(event) {
    switch (event.type) {
      case 'AccountOpened':
        this.#balance = event.data.initialBalance || 0;
        break;
      case 'MoneyDeposited':
        this.#balance += event.data.amount;
        break;
      case 'MoneyWithdrawn':
        this.#balance -= event.data.amount;
        break;
    }
    this.#events.push(event);
  }

  // Commands validate, then produce events
  deposit(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.#apply({
      type: 'MoneyDeposited',
      data: { amount },
      timestamp: new Date(),
    });
  }

  withdraw(amount) {
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.#apply({
      type: 'MoneyWithdrawn',
      data: { amount },
      timestamp: new Date(),
    });
  }

  get balance() { return this.#balance; }
  get events() { return [...this.#events]; }

  // Rebuild from stored events
  static fromEvents(events) {
    const account = new EventSourcedAccount();
    events.forEach(e => account.#apply(e));
    return account;
  }
}
\`\`\`

## CQRS (Command Query Responsibility Segregation)

\`\`\`
   Commands (writes)            Queries (reads)
        │                            │
        ▼                            ▼
  ┌───────────┐              ┌───────────────┐
  │  Write    │   events     │   Read Model  │
  │  Model    │─────────────►│  (Projections)│
  │  (Events) │              │  (Denormalized)│
  └───────────┘              └───────────────┘
        │                            │
   Event Store               Read Database
   (PostgreSQL)            (Elasticsearch/Redis)
\`\`\`

### Write Side (Commands)
\`\`\`javascript
// Handle a command → produce events
async function handleWithdrawCommand(accountId, amount) {
  const events = await eventStore.getEvents(accountId);
  const account = EventSourcedAccount.fromEvents(events);

  account.withdraw(amount);

  const newEvents = account.events.slice(events.length);
  await eventStore.appendEvents(accountId, newEvents);

  // Publish to read side
  for (const event of newEvents) {
    await eventBus.publish(event);
  }
}
\`\`\`

### Read Side (Projections)
\`\`\`javascript
// Listen for events and update read-optimized views
bus.subscribe('MoneyDeposited', async (event) => {
  await readDb.query(
    'UPDATE account_view SET balance = balance + $1 WHERE id = $2',
    [event.data.amount, event.aggregateId]
  );
});
\`\`\`
`,
  },
];
