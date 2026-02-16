// ============================================================================
// Event-Driven Architecture — Code Examples
// ============================================================================

export default {
  'event-driven-architecture-fundamentals': [
    {
      title: "In-Process Event Bus with Pub/Sub",
      description: "A complete in-process event bus implementation supporting subscribe, unsubscribe, wildcard listeners, and error isolation using Promise.allSettled.",
      language: "javascript",
      code: `class EventBus {
  #subscribers = new Map();

  subscribe(eventType, handler) {
    if (!this.#subscribers.has(eventType)) {
      this.#subscribers.set(eventType, []);
    }
    this.#subscribers.get(eventType).push(handler);

    // Return an unsubscribe function for cleanup
    return () => {
      const handlers = this.#subscribers.get(eventType);
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    };
  }

  async publish(event) {
    const specific = this.#subscribers.get(event.type) || [];
    const wildcard = this.#subscribers.get('*') || [];
    const allHandlers = [...specific, ...wildcard];

    // Promise.allSettled: one handler failure does NOT block others
    const results = await Promise.allSettled(
      allHandlers.map(h => h(event))
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(
        \`\${failures.length} handler(s) failed for "\${event.type}":\`,
        failures.map(f => f.reason.message)
      );
    }

    return results;
  }

  listenerCount(eventType) {
    return (this.#subscribers.get(eventType) || []).length;
  }
}

// --- Usage ---
const bus = new EventBus();

// Subscribe multiple consumers
bus.subscribe('OrderPlaced', async (event) => {
  console.log('Inventory: reserving stock for', event.data.orderId);
});

bus.subscribe('OrderPlaced', async (event) => {
  console.log('Email: sending confirmation to', event.data.customerId);
});

// Wildcard: log every event
bus.subscribe('*', async (event) => {
  console.log(\`[AUDIT] \${event.type} at \${event.metadata.timestamp}\`);
});

// Publish one event — all 3 handlers fire concurrently
await bus.publish({
  type: 'OrderPlaced',
  data: { orderId: 'ord_001', customerId: 'cust_123', totalAmount: 59.98 },
  metadata: { timestamp: new Date().toISOString(), correlationId: 'req_abc' },
});`,
      explanation: "This event bus demonstrates the core pub/sub pattern. Key design decisions: (1) Promise.allSettled ensures one failing handler doesn't prevent other handlers from running. (2) Wildcard '*' subscribers receive every event, useful for logging and auditing. (3) The subscribe method returns an unsubscribe function for easy cleanup, following the disposable pattern. (4) Private #subscribers field prevents external mutation. In production, you'd replace this with a message broker for cross-service communication, but this pattern is valuable for in-process decoupling within a monolith.",
      order_index: 1,
    },
    {
      title: "Idempotent Event Consumer with Deduplication",
      description: "Prevents duplicate event processing using an event ID tracking store, essential for at-least-once delivery systems.",
      language: "javascript",
      code: `class IdempotentConsumer {
  constructor(deduplicationStore) {
    // deduplicationStore can be Redis, PostgreSQL, or an in-memory Map
    this.store = deduplicationStore;
  }

  async handle(event, processorFn) {
    const eventId = event.id || event.eventId;

    if (!eventId) {
      throw new Error('Event must have an id for idempotency tracking');
    }

    // Step 1: Check if already processed
    const existing = await this.store.get(eventId);
    if (existing) {
      console.log(\`[IDEMPOTENT] Event \${eventId} already processed at \${existing.processedAt} — skipping\`);
      return { status: 'skipped', processedAt: existing.processedAt };
    }

    // Step 2: Process the event
    try {
      const result = await processorFn(event);

      // Step 3: Record successful processing
      await this.store.set(eventId, {
        processedAt: new Date().toISOString(),
        eventType: event.type,
        result: typeof result === 'object' ? JSON.stringify(result) : String(result),
      });

      return { status: 'processed', result };
    } catch (err) {
      // Do NOT mark as processed — allow retry
      console.error(\`[IDEMPOTENT] Processing failed for event \${eventId}:\`, err.message);
      throw err;
    }
  }
}

// --- In-Memory Store (for testing) ---
class InMemoryDeduplicationStore {
  #data = new Map();

  async get(key) { return this.#data.get(key) || null; }
  async set(key, value) { this.#data.set(key, value); }
  async has(key) { return this.#data.has(key); }
}

// --- Usage ---
const store = new InMemoryDeduplicationStore();
const consumer = new IdempotentConsumer(store);

const event = {
  id: 'evt_abc123',
  type: 'PaymentCharged',
  data: { orderId: 'ord_001', amount: 59.98 },
};

// First processing — executes the handler
const r1 = await consumer.handle(event, async (e) => {
  console.log('Charging payment:', e.data.amount);
  return { paymentId: 'pay_001' };
});
console.log(r1); // { status: 'processed', result: { paymentId: 'pay_001' } }

// Duplicate delivery — skipped automatically
const r2 = await consumer.handle(event, async (e) => {
  console.log('This will NOT execute');
});
console.log(r2); // { status: 'skipped', processedAt: '...' }`,
      explanation: "Idempotency is critical in event-driven systems because message brokers guarantee at-least-once delivery, meaning events can be delivered multiple times. This consumer tracks processed event IDs and skips duplicates. Key points: (1) Failed events are NOT marked as processed, allowing retry. (2) The deduplication store can be Redis (with TTL) or a database table. (3) In production, use a TTL to prevent unbounded storage growth. (4) For naturally idempotent operations like database UPSERTs, you may not need explicit tracking.",
      order_index: 2,
    },
    {
      title: "Event-Sourced Bank Account Aggregate",
      description: "A complete event-sourced aggregate implementing commands, events, state rebuilding from event history, and the separation of command validation from event application.",
      language: "javascript",
      code: `class EventSourcedAggregate {
  #uncommittedEvents = [];
  #version = 0;

  get uncommittedEvents() { return [...this.#uncommittedEvents]; }
  get version() { return this.#version; }

  applyEvent(event) {
    this.onEvent(event);    // subclass implements state mutation
    this.#version++;
  }

  recordEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
      version: this.#version + 1,
    };
    this.applyEvent(event);
    this.#uncommittedEvents.push(event);
  }

  clearUncommittedEvents() {
    this.#uncommittedEvents = [];
  }

  static rehydrate(events, AggregateClass) {
    const instance = new AggregateClass();
    for (const event of events) {
      instance.applyEvent(event);
    }
    instance.#uncommittedEvents = [];
    return instance;
  }
}

class BankAccount extends EventSourcedAggregate {
  #balance = 0;
  #status = 'pending';
  #accountId = null;
  #owner = null;

  get balance() { return this.#balance; }
  get status() { return this.#status; }
  get accountId() { return this.#accountId; }

  // --- Commands (validate invariants, then record events) ---
  open(accountId, owner, initialDeposit = 0) {
    if (this.#status !== 'pending') throw new Error('Account already opened');
    if (initialDeposit < 0) throw new Error('Initial deposit cannot be negative');
    this.recordEvent('AccountOpened', { accountId, owner, initialDeposit });
  }

  deposit(amount) {
    if (this.#status !== 'active') throw new Error('Account not active');
    if (amount <= 0) throw new Error('Amount must be positive');
    this.recordEvent('MoneyDeposited', { amount });
  }

  withdraw(amount) {
    if (this.#status !== 'active') throw new Error('Account not active');
    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > this.#balance) throw new Error(\`Insufficient funds: \${this.#balance} < \${amount}\`);
    this.recordEvent('MoneyWithdrawn', { amount });
  }

  close() {
    if (this.#status !== 'active') throw new Error('Account not active');
    if (this.#balance !== 0) throw new Error('Balance must be zero to close');
    this.recordEvent('AccountClosed', {});
  }

  // --- Event handlers (pure state transitions, no validation) ---
  onEvent(event) {
    switch (event.type) {
      case 'AccountOpened':
        this.#accountId = event.data.accountId;
        this.#owner = event.data.owner;
        this.#balance = event.data.initialDeposit;
        this.#status = 'active';
        break;
      case 'MoneyDeposited':
        this.#balance += event.data.amount;
        break;
      case 'MoneyWithdrawn':
        this.#balance -= event.data.amount;
        break;
      case 'AccountClosed':
        this.#status = 'closed';
        break;
    }
  }
}

// --- Demo: Create, transact, then rebuild from history ---
const account = new BankAccount();
account.open('acc_001', 'Alice', 100);
account.deposit(500);
account.withdraw(75);

console.log('Balance:', account.balance);  // 525
console.log('Version:', account.version);  // 3
console.log('Events:', account.uncommittedEvents.map(e => e.type));
// ['AccountOpened', 'MoneyDeposited', 'MoneyWithdrawn']

// Simulate saving and reloading from event store
const savedEvents = account.uncommittedEvents;
const rebuilt = EventSourcedAggregate.rehydrate(savedEvents, BankAccount);
console.log('Rebuilt balance:', rebuilt.balance);  // 525 — identical state
console.log('Uncommitted:', rebuilt.uncommittedEvents.length);  // 0`,
      explanation: "This demonstrates the core event sourcing pattern. The aggregate has two distinct code paths: (1) Commands — validate business rules (can a withdrawal happen?) and record events if valid. (2) Event handlers (onEvent) — pure state transitions with no validation, because events represent facts that already happened. The static rehydrate method rebuilds state by replaying events in order, proving that the event log is the true source of truth. Notice that validation is only in commands, never in event handlers — this is critical because when replaying historical events, we must not re-validate them.",
      order_index: 3,
    },
    {
      title: "CQRS: Separate Write and Read Models",
      description: "Implements Command Query Responsibility Segregation with an event-sourced write side, event-driven projection to a read model, and an optimized query service.",
      language: "javascript",
      code: `// ---- WRITE SIDE (Commands) ----
class CreateOrderCommandHandler {
  constructor(eventStore, eventBus) {
    this.eventStore = eventStore;
    this.eventBus = eventBus;
  }

  async execute({ orderId, customerId, items }) {
    // Validate command
    if (!items || items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity, 0
    );

    // Create event
    const event = {
      type: 'OrderPlaced',
      data: { orderId, customerId, items, totalAmount },
      metadata: { timestamp: new Date().toISOString() },
    };

    // Persist event (write model = event store)
    await this.eventStore.appendEvents(orderId, 'Order', [event], 0);

    // Publish for read side to pick up
    await this.eventBus.publish(event);

    return { orderId, totalAmount };
  }
}

// ---- READ SIDE (Projections) ----
class OrderDashboardProjection {
  constructor(readDb) {
    this.readDb = readDb;
  }

  // Subscribe this projection to events
  async onOrderPlaced(event) {
    const { orderId, customerId, items, totalAmount } = event.data;
    // Denormalized for fast reads — no joins needed
    await this.readDb.upsert('order_dashboard', {
      orderId,
      customerId,
      totalAmount,
      itemCount: items.length,
      status: 'placed',
      topItem: items.sort((a, b) => b.unitPrice - a.unitPrice)[0]?.productId,
      createdAt: event.metadata.timestamp,
    });
  }

  async onOrderShipped(event) {
    await this.readDb.update('order_dashboard', event.data.orderId, {
      status: 'shipped',
      shippedAt: event.metadata.timestamp,
      trackingNumber: event.data.trackingNumber,
    });
  }

  async onOrderCancelled(event) {
    await this.readDb.update('order_dashboard', event.data.orderId, {
      status: 'cancelled',
      cancelledAt: event.metadata.timestamp,
    });
  }
}

// ---- QUERY SERVICE ----
class OrderQueryService {
  constructor(readDb) {
    this.readDb = readDb;
  }

  // Optimized reads from denormalized data
  async getCustomerOrders(customerId, { status, limit = 20, offset = 0 } = {}) {
    const filters = { customerId };
    if (status) filters.status = status;
    return this.readDb.find('order_dashboard', filters, { limit, offset });
  }

  async getOrderStats(customerId) {
    return this.readDb.aggregate('order_dashboard', {
      match: { customerId },
      group: {
        totalOrders: { count: true },
        totalSpent: { sum: 'totalAmount' },
        avgOrderValue: { avg: 'totalAmount' },
      },
    });
  }
}

// ---- WIRING ----
const eventStore = new PostgresEventStore(pool);
const eventBus = new EventBus();
const readDb = new ReadDatabase();

const commandHandler = new CreateOrderCommandHandler(eventStore, eventBus);
const projection = new OrderDashboardProjection(readDb);
const queryService = new OrderQueryService(readDb);

// Wire projection to events
eventBus.subscribe('OrderPlaced', (e) => projection.onOrderPlaced(e));
eventBus.subscribe('OrderShipped', (e) => projection.onOrderShipped(e));
eventBus.subscribe('OrderCancelled', (e) => projection.onOrderCancelled(e));

// Write: store events and publish
await commandHandler.execute({
  orderId: 'ord_001',
  customerId: 'cust_123',
  items: [{ productId: 'p1', quantity: 2, unitPrice: 29.99 }],
});

// Read: fast denormalized query
const orders = await queryService.getCustomerOrders('cust_123');
const stats = await queryService.getOrderStats('cust_123');`,
      explanation: "CQRS separates the write model (event store with normalized events) from the read model (denormalized projections optimized for queries). The write side validates commands and appends events. The read side listens for events and updates denormalized views. Benefits: (1) The write side uses an event store for audit trail and consistency. (2) The read side uses denormalized data for fast queries without joins. (3) You can have multiple projections for different read use cases (dashboard, search, reports). (4) Each side can use a different database technology. The trade-off is eventual consistency — the read model lags behind the write model by the time it takes to process events.",
      order_index: 4,
    },
  ],
  'implementing-event-driven-systems': [
    {
      title: "RabbitMQ Publisher and Consumer with DLQ",
      description: "Production-ready RabbitMQ integration with topic exchange routing, persistent messages, prefetch control, and dead letter queue for failed messages.",
      language: "javascript",
      code: `import amqp from 'amqplib';

class RabbitMQEventBus {
  constructor(url) {
    this.url = url;
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();

    // Set up Dead Letter Exchange
    await this.channel.assertExchange('dlx', 'direct', { durable: true });
    await this.channel.assertQueue('dead-letter-queue', { durable: true });
    await this.channel.bindQueue('dead-letter-queue', 'dlx', '');

    this.connection.on('error', (err) => console.error('RabbitMQ error:', err));
    this.connection.on('close', () => {
      console.warn('RabbitMQ closed — reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  async publish(exchange, routingKey, event) {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(event)), {
      persistent: true,
      contentType: 'application/json',
      messageId: event.id || crypto.randomUUID(),
      timestamp: Date.now(),
      headers: {
        'event-type': event.type,
        'schema-version': String(event.version || 1),
      },
    });
    console.log(\`Published \${event.type} to \${exchange}/\${routingKey}\`);
  }

  async subscribe(exchange, pattern, queueName, handler, options = {}) {
    const { prefetch = 1, retryLimit = 3 } = options;

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: 'dlx',
      deadLetterRoutingKey: '',
    });
    await this.channel.bindQueue(q.queue, exchange, pattern);
    await this.channel.prefetch(prefetch);

    console.log(\`Subscribed: \${queueName} listening on \${exchange}/\${pattern}\`);

    this.channel.consume(q.queue, async (msg) => {
      if (!msg) return;

      const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);

      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel.ack(msg);
      } catch (err) {
        console.error(\`Error processing message (attempt \${retryCount + 1}): \${err.message}\`);

        if (retryCount < retryLimit) {
          // Republish with incremented retry count
          this.channel.ack(msg);
          this.channel.publish(exchange, msg.fields.routingKey, msg.content, {
            ...msg.properties,
            headers: {
              ...msg.properties.headers,
              'x-retry-count': retryCount + 1,
              'x-last-error': err.message,
            },
          });
        } else {
          // Max retries exceeded — send to DLQ
          this.channel.nack(msg, false, false);
          console.error(\`Message sent to DLQ after \${retryLimit} retries\`);
        }
      }
    });
  }

  async disconnect() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

// --- Usage ---
const bus = new RabbitMQEventBus('amqp://localhost');
await bus.connect();

// Publisher: Order Service
await bus.publish('events', 'order.placed', {
  id: 'evt_001',
  type: 'OrderPlaced',
  data: { orderId: 'ord_123', customerId: 'cust_456', totalAmount: 99.99 },
});

// Consumer: Inventory Service
await bus.subscribe('events', 'order.*', 'inventory-service-queue', async (event) => {
  if (event.type === 'OrderPlaced') {
    console.log('Reserving stock for order:', event.data.orderId);
    // ... business logic ...
  }
});

// Consumer: Notification Service
await bus.subscribe('events', 'order.placed', 'notification-queue', async (event) => {
  console.log('Sending confirmation email for:', event.data.orderId);
});`,
      explanation: "This RabbitMQ integration demonstrates production patterns: (1) Topic exchange allows flexible routing — 'order.*' matches all order events while 'order.placed' matches only placements. (2) Persistent messages and durable queues survive broker restarts. (3) Prefetch(1) ensures a consumer finishes processing before receiving the next message, preventing overload. (4) Dead Letter Exchange (DLX) catches messages that fail after exhausting retries. (5) Retry count is tracked in message headers. The retry strategy republishes the message with an incremented counter rather than using nack with requeue, giving more control over retry behavior.",
      order_index: 1,
    },
    {
      title: "Kafka Producer and Consumer with Consumer Groups",
      description: "Apache Kafka integration using kafkajs with idempotent producer, consumer groups, partition-key ordering, and header-based metadata propagation.",
      language: "javascript",
      code: `import { Kafka, logLevel } from 'kafkajs';

class KafkaEventBus {
  constructor(brokers, clientId) {
    this.kafka = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.WARN,
      retry: { initialRetryTime: 300, retries: 8 },
    });
    this.producer = null;
  }

  async connectProducer() {
    this.producer = this.kafka.producer({
      idempotent: true,        // exactly-once producer semantics
      maxInFlightRequests: 5,
    });
    await this.producer.connect();
    console.log('Kafka producer connected');
  }

  async publish(topic, event) {
    const result = await this.producer.send({
      topic,
      messages: [{
        // Key determines partition: same key → same partition → ordered
        key: event.aggregateId || event.data?.orderId || null,
        value: JSON.stringify(event),
        headers: {
          'event-type': event.type,
          'correlation-id': event.metadata?.correlationId || '',
          'schema-version': String(event.version || 1),
          'source': event.metadata?.source || process.env.SERVICE_NAME || '',
        },
        timestamp: Date.now().toString(),
      }],
    });
    console.log(\`Kafka: published \${event.type} to \${topic}, partition \${result[0].partition}\`);
    return result;
  }

  async subscribe(topic, groupId, handler, options = {}) {
    const { fromBeginning = false } = options;
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning });

    await consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        const event = JSON.parse(message.value.toString());
        const headers = {};
        for (const [key, val] of Object.entries(message.headers || {})) {
          headers[key] = val.toString();
        }

        const enrichedEvent = {
          ...event,
          _kafka: {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            headers,
            timestamp: message.timestamp,
          },
        };

        try {
          await handler(enrichedEvent);
          // Heartbeat for long-running handlers to prevent session timeout
          await heartbeat();
        } catch (err) {
          console.error(
            \`Consumer \${groupId} failed on \${topic}[\${partition}]@\${message.offset}: \${err.message}\`
          );
          throw err; // kafkajs will retry based on its retry config
        }
      },
    });

    console.log(\`Kafka consumer \${groupId} subscribed to \${topic}\`);
    return consumer;
  }

  async disconnect() {
    await this.producer?.disconnect();
  }
}

// --- Usage ---
const kafka = new KafkaEventBus(['kafka:9092'], 'order-service');
await kafka.connectProducer();

// Publish events — same orderId goes to same partition for ordering
await kafka.publish('order-events', {
  type: 'OrderPlaced',
  aggregateId: 'ord_001',
  data: { orderId: 'ord_001', customerId: 'cust_123', totalAmount: 149.99 },
  metadata: { correlationId: 'req_abc', source: 'order-service' },
  version: 1,
});

// Consumer Group: Inventory (3 instances share the partitions)
await kafka.subscribe('order-events', 'inventory-service', async (event) => {
  console.log(\`[Inventory] Processing \${event.type} from partition \${event._kafka.partition}\`);
});

// Different Consumer Group: Analytics (independent read position)
await kafka.subscribe('order-events', 'analytics-service', async (event) => {
  console.log(\`[Analytics] Recording \${event.type}\`);
});`,
      explanation: "This Kafka implementation highlights key Kafka concepts: (1) Partition key (aggregateId) ensures all events for the same aggregate go to the same partition, maintaining order. (2) Idempotent producer prevents duplicate messages from network retries. (3) Consumer groups enable parallel processing — multiple instances of a service share partitions. Different consumer groups (inventory-service vs analytics-service) independently read the same topic. (4) The heartbeat() call during long-running handlers prevents Kafka from thinking the consumer is dead. (5) Message headers carry metadata without polluting the event payload.",
      order_index: 2,
    },
    {
      title: "Saga Orchestrator for Order Processing",
      description: "A complete orchestration-based saga coordinating order creation, payment, inventory reservation, and shipping — with compensating transactions on failure.",
      language: "javascript",
      code: `class SagaStep {
  constructor(name, execute, compensate) {
    this.name = name;
    this.execute = execute;       // forward action
    this.compensate = compensate; // rollback action
  }
}

class SagaOrchestrator {
  #steps = [];
  #completedSteps = [];
  #sagaLog = [];

  constructor(sagaId) {
    this.sagaId = sagaId;
  }

  addStep(step) {
    this.#steps.push(step);
    return this; // chainable
  }

  async execute(context) {
    console.log(\`Saga \${this.sagaId} starting with \${this.#steps.length} steps\`);

    for (const step of this.#steps) {
      try {
        console.log(\`  Step: \${step.name} — executing...\`);
        const result = await step.execute(context);

        // Store result in context for subsequent steps
        context[\`\${step.name}Result\`] = result;
        this.#completedSteps.push(step);

        this.#sagaLog.push({
          step: step.name,
          status: 'completed',
          result,
          timestamp: new Date().toISOString(),
        });

        console.log(\`  Step: \${step.name} — completed\`);
      } catch (err) {
        console.error(\`  Step: \${step.name} — FAILED: \${err.message}\`);

        this.#sagaLog.push({
          step: step.name,
          status: 'failed',
          error: err.message,
          timestamp: new Date().toISOString(),
        });

        // Compensate all completed steps in reverse order
        await this.#compensate(context);

        return {
          success: false,
          failedStep: step.name,
          error: err.message,
          log: this.#sagaLog,
        };
      }
    }

    console.log(\`Saga \${this.sagaId} completed successfully\`);
    return { success: true, log: this.#sagaLog };
  }

  async #compensate(context) {
    console.log(\`  Compensating \${this.#completedSteps.length} steps...\`);

    for (let i = this.#completedSteps.length - 1; i >= 0; i--) {
      const step = this.#completedSteps[i];
      try {
        console.log(\`  Compensating: \${step.name}\`);
        await step.compensate(context);

        this.#sagaLog.push({
          step: step.name,
          status: 'compensated',
          timestamp: new Date().toISOString(),
        });
      } catch (compErr) {
        console.error(\`  Compensation FAILED for \${step.name}: \${compErr.message}\`);
        this.#sagaLog.push({
          step: step.name,
          status: 'compensation_failed',
          error: compErr.message,
          timestamp: new Date().toISOString(),
        });
        // In production: alert operations team for manual intervention
      }
    }
  }
}

// --- Define the Order Saga ---
function createOrderSaga(services) {
  const saga = new SagaOrchestrator(crypto.randomUUID());

  saga.addStep(new SagaStep(
    'createOrder',
    async (ctx) => {
      const order = await services.orders.create({
        customerId: ctx.customerId,
        items: ctx.items,
        status: 'pending',
      });
      ctx.orderId = order.id;
      return order;
    },
    async (ctx) => {
      await services.orders.cancel(ctx.orderId);
    }
  ));

  saga.addStep(new SagaStep(
    'processPayment',
    async (ctx) => {
      const payment = await services.payments.charge({
        customerId: ctx.customerId,
        amount: ctx.totalAmount,
        orderId: ctx.orderId,
        idempotencyKey: \`order-\${ctx.orderId}\`,
      });
      ctx.paymentId = payment.id;
      return payment;
    },
    async (ctx) => {
      await services.payments.refund(ctx.paymentId);
    }
  ));

  saga.addStep(new SagaStep(
    'reserveInventory',
    async (ctx) => {
      const reservation = await services.inventory.reserve({
        orderId: ctx.orderId,
        items: ctx.items,
      });
      ctx.reservationId = reservation.id;
      return reservation;
    },
    async (ctx) => {
      await services.inventory.release(ctx.reservationId);
    }
  ));

  saga.addStep(new SagaStep(
    'scheduleShipping',
    async (ctx) => {
      const shipment = await services.shipping.schedule({
        orderId: ctx.orderId,
        address: ctx.shippingAddress,
        items: ctx.items,
      });
      ctx.shipmentId = shipment.id;
      return shipment;
    },
    async (ctx) => {
      await services.shipping.cancel(ctx.shipmentId);
    }
  ));

  return saga;
}

// --- Run the saga ---
const saga = createOrderSaga(services);
const result = await saga.execute({
  customerId: 'cust_123',
  items: [{ productId: 'p1', quantity: 2, unitPrice: 29.99 }],
  totalAmount: 59.98,
  shippingAddress: { street: '123 Main St', city: 'Seattle', state: 'WA' },
});

console.log('Saga result:', result.success ? 'SUCCESS' : 'FAILED');
console.log('Log:', result.log);`,
      explanation: "This saga orchestrator manages a distributed transaction across four services. Key design decisions: (1) Each SagaStep has an execute (forward) and compensate (rollback) function. (2) If any step fails, all previously completed steps are compensated in reverse order — like unwinding a stack. (3) The saga context object is shared between steps, allowing later steps to use results from earlier ones (e.g., orderId from step 1 is used in step 2). (4) The saga log provides a complete audit trail for debugging. (5) Failed compensations are logged but don't stop other compensations — in production, these trigger alerts for manual intervention. This is the orchestration approach; choreography would use events instead of a central coordinator.",
      order_index: 3,
    },
    {
      title: "PostgreSQL Event Store with Snapshots and Optimistic Concurrency",
      description: "A production-grade event store implementation with optimistic concurrency control, snapshot support, and aggregate loading optimization.",
      language: "javascript",
      code: `class PostgresEventStore {
  constructor(pool) {
    this.pool = pool;
  }

  async initialize() {
    await this.pool.query(\`
      CREATE TABLE IF NOT EXISTS event_store (
        global_position BIGSERIAL PRIMARY KEY,
        aggregate_id VARCHAR(255) NOT NULL,
        aggregate_type VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        version INTEGER NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(aggregate_id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_es_aggregate
        ON event_store(aggregate_id, version ASC);
      CREATE INDEX IF NOT EXISTS idx_es_event_type
        ON event_store(event_type, global_position);

      CREATE TABLE IF NOT EXISTS event_snapshots (
        aggregate_id VARCHAR(255) PRIMARY KEY,
        aggregate_type VARCHAR(100) NOT NULL,
        version INTEGER NOT NULL,
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    \`);
  }

  // Read events for a single aggregate
  async getEvents(aggregateId, afterVersion = 0) {
    const { rows } = await this.pool.query(
      \`SELECT event_type, version, data, metadata, created_at
       FROM event_store
       WHERE aggregate_id = $1 AND version > $2
       ORDER BY version ASC\`,
      [aggregateId, afterVersion]
    );
    return rows.map(r => ({
      type: r.event_type,
      version: r.version,
      data: r.data,
      metadata: r.metadata,
      timestamp: r.created_at,
    }));
  }

  // Append events with optimistic concurrency control
  async appendEvents(aggregateId, aggregateType, events, expectedVersion) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check current version (optimistic lock)
      const { rows: [{ current_version: currentVersion }] } = await client.query(
        'SELECT COALESCE(MAX(version), 0) as current_version FROM event_store WHERE aggregate_id = $1',
        [aggregateId]
      );

      if (currentVersion !== expectedVersion) {
        throw new Error(
          \`Concurrency conflict on \${aggregateId}: expected v\${expectedVersion}, actual v\${currentVersion}\`
        );
      }

      for (let i = 0; i < events.length; i++) {
        const evt = events[i];
        const version = expectedVersion + i + 1;
        await client.query(
          \`INSERT INTO event_store
           (aggregate_id, aggregate_type, event_type, version, data, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)\`,
          [aggregateId, aggregateType, evt.type, version,
           JSON.stringify(evt.data), JSON.stringify(evt.metadata || {})]
        );
      }

      await client.query('COMMIT');
      return expectedVersion + events.length;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Save snapshot (for long-lived aggregates with many events)
  async saveSnapshot(aggregateId, aggregateType, version, state) {
    await this.pool.query(
      \`INSERT INTO event_snapshots (aggregate_id, aggregate_type, version, state)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (aggregate_id) DO UPDATE SET
         version = EXCLUDED.version,
         state = EXCLUDED.state,
         updated_at = NOW()\`,
      [aggregateId, aggregateType, version, JSON.stringify(state)]
    );
  }

  // Efficient aggregate loading: snapshot + newer events
  async loadAggregate(aggregateId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM event_snapshots WHERE aggregate_id = $1',
      [aggregateId]
    );
    const snapshot = rows[0] || null;
    const afterVersion = snapshot ? snapshot.version : 0;
    const events = await this.getEvents(aggregateId, afterVersion);
    return { snapshot, events, currentVersion: afterVersion + events.length };
  }

  // Global stream: read all events of a type (for projections)
  async readStream(eventType, afterPosition = 0, batchSize = 100) {
    const { rows } = await this.pool.query(
      \`SELECT global_position, aggregate_id, event_type, data, metadata, created_at
       FROM event_store
       WHERE event_type = $1 AND global_position > $2
       ORDER BY global_position ASC
       LIMIT $3\`,
      [eventType, afterPosition, batchSize]
    );
    return rows;
  }
}

// --- Usage ---
const store = new PostgresEventStore(pool);
await store.initialize();

// Append events with concurrency check
await store.appendEvents('acc_001', 'BankAccount', [
  { type: 'AccountOpened', data: { owner: 'Alice', initialBalance: 0 } },
  { type: 'MoneyDeposited', data: { amount: 1000 } },
], 0); // expectedVersion = 0 (new aggregate)

// Load aggregate
const { snapshot, events, currentVersion } = await store.loadAggregate('acc_001');
console.log(\`Loaded v\${currentVersion}: \${events.length} events\`);

// Save snapshot after many events for performance
await store.saveSnapshot('acc_001', 'BankAccount', currentVersion, { balance: 1000 });`,
      explanation: "This event store handles the critical concerns of event persistence: (1) Optimistic concurrency control via the expectedVersion check prevents lost updates when two processes try to modify the same aggregate simultaneously. (2) The UNIQUE(aggregate_id, version) constraint is the database-level safety net. (3) Snapshots allow efficient loading of aggregates with long event histories — instead of replaying 10,000 events, load the snapshot and replay only events after it. (4) The global_position column enables global ordering for projections that need to read events across all aggregates. (5) Transactions ensure all events in a batch are persisted atomically.",
      order_index: 4,
    },
  ],
};
