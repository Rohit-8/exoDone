import pool from '../config/database.js';

async function seedEventDrivenArchitecture() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Event-Driven Architecture lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'event-driven-architecture'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Event-Driven Architecture & Message Queues', 'event-driven-architecture', $2, 'Learn event-driven architecture, message queues (RabbitMQ, Kafka), pub/sub patterns, event sourcing, and CQRS', 'intermediate', 55, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Event-Driven Architecture

## What is Event-Driven Architecture (EDA)?

**Event-Driven Architecture** is a software design pattern where the flow of the program is determined by events. Events are significant changes in state or important occurrences that other parts of the system need to know about.

### Key Concepts

- **Event**: Something that happened (past tense)
- **Event Producer**: Component that detects and publishes events
- **Event Consumer**: Component that listens and reacts to events
- **Event Channel**: Medium for transmitting events (message queue, event bus)

### Benefits

✅ **Loose Coupling**: Producers and consumers do not know about each other
✅ **Scalability**: Easy to add new consumers without changing producers
✅ **Asynchronous Processing**: Non-blocking operations
✅ **Resilience**: Failures in one component do not affect others
✅ **Audit Trail**: Events provide history of what happened

### Challenges

❌ **Complexity**: More moving parts to manage
❌ **Eventual Consistency**: Data may not be immediately consistent
❌ **Debugging**: Harder to trace execution flow
❌ **Message Ordering**: Ensuring events are processed in correct order

## Event Types

### 1. Domain Events

Events that represent business-meaningful occurrences.

\\\`\\\`\\\`typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
}

class OrderPlacedEvent implements DomainEvent {
  eventId: string;
  eventType = 'OrderPlaced';
  occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly customerId: string,
    public readonly items: OrderItem[],
    public readonly totalAmount: number
  ) {
    this.eventId = this.generateId();
    this.occurredAt = new Date();
  }

  private generateId(): string {
    return \\\`\\\${Date.now()}-\\\${Math.random().toString(36).substr(2, 9)}\\\`;
  }
}

class PaymentProcessedEvent implements DomainEvent {
  eventId: string;
  eventType = 'PaymentProcessed';
  occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly paymentMethod: string
  ) {
    this.eventId = this.generateId();
    this.occurredAt = new Date();
  }

  private generateId(): string {
    return \\\`\\\${Date.now()}-\\\${Math.random().toString(36).substr(2, 9)}\\\`;
  }
}
\\\`\\\`\\\`

### 2. Integration Events

Events used for communication between different bounded contexts or microservices.

\\\`\\\`\\\`typescript
interface IntegrationEvent {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  version: string;
  source: string;
}

class UserRegisteredIntegrationEvent implements IntegrationEvent {
  eventId: string;
  eventType = 'UserRegistered';
  occurredAt: Date;
  version = '1.0';
  source = 'auth-service';

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string
  ) {
    this.eventId = this.generateId();
    this.occurredAt = new Date();
  }

  private generateId(): string {
    return \\\`\\\${Date.now()}-\\\${Math.random().toString(36).substr(2, 9)}\\\`;
  }
}
\\\`\\\`\\\`

## Message Queues

### RabbitMQ

**RabbitMQ** is a message broker that implements AMQP (Advanced Message Queuing Protocol).

\\\`\\\`\\\`typescript
import amqp from 'amqplib';

// Producer
class RabbitMQProducer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
  }

  async publishEvent(exchange: string, routingKey: string, event: any): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log(\\\`Published event to \\\${exchange} with key \\\${routingKey}\\\`);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

// Consumer
class RabbitMQConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
  }

  async subscribe(
    exchange: string,
    routingKey: string,
    queueName: string,
    handler: (event: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, exchange, routingKey);

    this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handler(event);
          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel?.nack(msg, false, false); // Dead letter queue
        }
      }
    });

    console.log(\\\`Subscribed to \\\${exchange} with key \\\${routingKey}\\\`);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

// Usage
const producer = new RabbitMQProducer();
await producer.connect();

const event = new OrderPlacedEvent(
  'order-123',
  'customer-456',
  [{ productId: 'prod-1', quantity: 2 }],
  99.99
);

await producer.publishEvent('orders', 'order.placed', event);

// Consumer
const consumer = new RabbitMQConsumer();
await consumer.connect();

await consumer.subscribe(
  'orders',
  'order.placed',
  'email-service-queue',
  async (event: OrderPlacedEvent) => {
    console.log('Sending order confirmation email...');
    // Send email logic
  }
);
\\\`\\\`\\\`

### Apache Kafka

**Kafka** is a distributed event streaming platform for high-throughput, fault-tolerant messaging.

\\\`\\\`\\\`typescript
import { Kafka, Producer, Consumer } from 'kafkajs';

// Producer
class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;

  constructor(brokers: string[]) {
    this.kafka = new Kafka({
      clientId: 'my-app',
      brokers,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async publishEvent(topic: string, event: any): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event),
          headers: {
            eventType: event.eventType,
            occurredAt: event.occurredAt.toISOString(),
          },
        },
      ],
    });

    console.log(\\\`Published event to topic \\\${topic}\\\`);
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}

// Consumer
class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(brokers: string[], groupId: string) {
    this.kafka = new Kafka({
      clientId: 'my-app',
      brokers,
    });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
  }

  async subscribe(
    topic: string,
    handler: (event: any) => Promise<void>
  ): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}');
          await handler(event);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });

    console.log(\\\`Subscribed to topic \\\${topic}\\\`);
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}

// Usage
const producer = new KafkaProducer(['localhost:9092']);
await producer.connect();

const event = new OrderPlacedEvent('order-123', 'customer-456', [], 99.99);
await producer.publishEvent('orders', event);

// Consumer
const consumer = new KafkaConsumer(['localhost:9092'], 'email-service-group');
await consumer.connect();

await consumer.subscribe('orders', async (event: OrderPlacedEvent) => {
  if (event.eventType === 'OrderPlaced') {
    console.log('Processing order:', event.aggregateId);
  }
});
\\\`\\\`\\\`

## Pub/Sub Pattern

**Publish-Subscribe** is a messaging pattern where publishers send messages without knowing who the subscribers are.

\\\`\\\`\\\`typescript
// In-Memory Event Bus
class EventBus {
  private handlers: Map<string, Array<(event: any) => Promise<void>>> = new Map();

  subscribe(eventType: string, handler: (event: any) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: any): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    await Promise.all(
      handlers.map(handler => 
        handler(event).catch(error => 
          console.error(\\\`Error in handler for \\\${eventType}:\\\`, error)
        )
      )
    );
  }
}

// Usage
const eventBus = new EventBus();

// Subscribe handlers
eventBus.subscribe('OrderPlaced', async (event: OrderPlacedEvent) => {
  console.log('Sending confirmation email...');
  // Email logic
});

eventBus.subscribe('OrderPlaced', async (event: OrderPlacedEvent) => {
  console.log('Reserving inventory...');
  // Inventory logic
});

eventBus.subscribe('OrderPlaced', async (event: OrderPlacedEvent) => {
  console.log('Notifying warehouse...');
  // Warehouse notification logic
});

// Publish event
const order = new OrderPlacedEvent('order-123', 'customer-456', [], 99.99);
await eventBus.publish(order);
\\\`\\\`\\\`

## Event Sourcing

**Event Sourcing** is a pattern where state changes are stored as a sequence of events rather than just the current state.

### Benefits

✅ **Complete Audit Trail**: Every change is recorded
✅ **Time Travel**: Can reconstruct state at any point in time
✅ **Event Replay**: Can rebuild projections from events
✅ **Debugging**: Easy to see what happened

\\\`\\\`\\\`typescript
// Event Store
class EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  async append(aggregateId: string, event: DomainEvent): Promise<void> {
    if (!this.events.has(aggregateId)) {
      this.events.set(aggregateId, []);
    }
    this.events.get(aggregateId)!.push(event);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.get(aggregateId) || [];
  }
}

// Aggregate with Event Sourcing
class BankAccount {
  private balance: number = 0;
  private isActive: boolean = true;
  private uncommittedEvents: DomainEvent[] = [];

  constructor(private readonly accountId: string) {}

  // Command methods
  deposit(amount: number): void {
    if (!this.isActive) {
      throw new Error('Account is closed');
    }
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    this.apply(new MoneyDepositedEvent(this.accountId, amount));
  }

  withdraw(amount: number): void {
    if (!this.isActive) {
      throw new Error('Account is closed');
    }
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (this.balance < amount) {
      throw new Error('Insufficient funds');
    }

    this.apply(new MoneyWithdrawnEvent(this.accountId, amount));
  }

  close(): void {
    if (!this.isActive) {
      throw new Error('Account already closed');
    }

    this.apply(new AccountClosedEvent(this.accountId));
  }

  // Apply event and update state
  private apply(event: DomainEvent): void {
    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  // Update state based on event
  private applyEvent(event: DomainEvent): void {
    if (event instanceof MoneyDepositedEvent) {
      this.balance += event.amount;
    } else if (event instanceof MoneyWithdrawnEvent) {
      this.balance -= event.amount;
    } else if (event instanceof AccountClosedEvent) {
      this.isActive = false;
    }
  }

  // Reconstitute from events
  static fromEvents(accountId: string, events: DomainEvent[]): BankAccount {
    const account = new BankAccount(accountId);
    for (const event of events) {
      account.applyEvent(event);
    }
    return account;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  getBalance(): number {
    return this.balance;
  }
}

// Event classes
class MoneyDepositedEvent implements DomainEvent {
  eventId: string;
  eventType = 'MoneyDeposited';
  occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly amount: number
  ) {
    this.eventId = \\\`\\\${Date.now()}\\\`;
    this.occurredAt = new Date();
  }
}

class MoneyWithdrawnEvent implements DomainEvent {
  eventId: string;
  eventType = 'MoneyWithdrawn';
  occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly amount: number
  ) {
    this.eventId = \\\`\\\${Date.now()}\\\`;
    this.occurredAt = new Date();
  }
}

class AccountClosedEvent implements DomainEvent {
  eventId: string;
  eventType = 'AccountClosed';
  occurredAt: Date;

  constructor(public readonly aggregateId: string) {
    this.eventId = \\\`\\\${Date.now()}\\\`;
    this.occurredAt = new Date();
  }
}

// Usage
const eventStore = new EventStore();
const account = new BankAccount('acc-123');

account.deposit(1000);
account.withdraw(200);
account.deposit(500);

// Save events
const events = account.getUncommittedEvents();
for (const event of events) {
  await eventStore.append('acc-123', event);
}

// Reconstruct from events
const storedEvents = await eventStore.getEvents('acc-123');
const reconstructedAccount = BankAccount.fromEvents('acc-123', storedEvents);
console.log(reconstructedAccount.getBalance()); // 1300
\\\`\\\`\\\`

## CQRS (Command Query Responsibility Segregation)

**CQRS** separates read and write operations into different models.

### Benefits

✅ **Optimized Models**: Read and write models can be optimized separately
✅ **Scalability**: Scale reads and writes independently
✅ **Flexibility**: Use different databases for reads and writes
✅ **Simpler Queries**: Read models can be denormalized

\\\`\\\`\\\`typescript
// Commands (Write Side)
interface Command {
  commandType: string;
}

class CreateOrderCommand implements Command {
  commandType = 'CreateOrder';

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItem[]
  ) {}
}

class CancelOrderCommand implements Command {
  commandType = 'CancelOrder';

  constructor(
    public readonly orderId: string,
    public readonly reason: string
  ) {}
}

// Command Handler
class OrderCommandHandler {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async handle(command: Command): Promise<void> {
    if (command instanceof CreateOrderCommand) {
      await this.handleCreateOrder(command);
    } else if (command instanceof CancelOrderCommand) {
      await this.handleCancelOrder(command);
    }
  }

  private async handleCreateOrder(command: CreateOrderCommand): Promise<void> {
    const order = new Order(command.orderId, command.customerId);
    
    for (const item of command.items) {
      order.addItem(item);
    }

    await this.orderRepository.save(order);

    const events = order.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }

  private async handleCancelOrder(command: CancelOrderCommand): Promise<void> {
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.cancel(command.reason);
    await this.orderRepository.save(order);

    const events = order.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
}

// Queries (Read Side)
interface Query {
  queryType: string;
}

class GetOrderByIdQuery implements Query {
  queryType = 'GetOrderById';

  constructor(public readonly orderId: string) {}
}

class GetOrdersByCustomerQuery implements Query {
  queryType = 'GetOrdersByCustomer';

  constructor(public readonly customerId: string) {}
}

// Query Handler (uses read-optimized model)
class OrderQueryHandler {
  constructor(private readonly db: any) {}

  async handle(query: Query): Promise<any> {
    if (query instanceof GetOrderByIdQuery) {
      return this.handleGetOrderById(query);
    } else if (query instanceof GetOrdersByCustomerQuery) {
      return this.handleGetOrdersByCustomer(query);
    }
  }

  private async handleGetOrderById(query: GetOrderByIdQuery): Promise<any> {
    // Query from denormalized read model
    return await this.db.orderReadModel.findOne({
      orderId: query.orderId,
    });
  }

  private async handleGetOrdersByCustomer(query: GetOrdersByCustomerQuery): Promise<any> {
    // Query from denormalized read model
    return await this.db.orderReadModel.find({
      customerId: query.customerId,
    });
  }
}

// Projection Builder (updates read model from events)
class OrderProjectionBuilder {
  constructor(private readonly db: any) {}

  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.db.orderReadModel.insert({
      orderId: event.aggregateId,
      customerId: event.customerId,
      status: 'PENDING',
      totalAmount: event.totalAmount,
      createdAt: event.occurredAt,
    });
  }

  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.db.orderReadModel.update(
      { orderId: event.aggregateId },
      { status: 'CANCELLED', cancelledAt: event.occurredAt }
    );
  }
}
\\\`\\\`\\\`

## Best Practices

1. **Use idempotent consumers**: Handle duplicate events gracefully
2. **Include event versioning**: Support schema evolution
3. **Add retry logic**: Handle transient failures
4. **Use dead letter queues**: Capture failed messages
5. **Monitor message lag**: Ensure consumers keep up
6. **Include correlation IDs**: Track events across services
7. **Set appropriate timeouts**: Prevent hanging consumers
8. **Use schemas**: Validate event structure
9. **Keep events immutable**: Never modify published events
10. **Design for eventual consistency**: Accept temporary inconsistencies`,
      [
        'Event-driven architecture decouples components through asynchronous messaging',
        'Message queues like RabbitMQ and Kafka enable reliable event distribution',
        'Pub/Sub pattern allows multiple consumers to react to the same event',
        'Event sourcing stores all state changes as events for complete audit trail',
        'CQRS separates read and write models for better scalability'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'RabbitMQ Producer/Consumer', 'Message queue implementation', 'typescript', $2, 'Shows how to implement producer and consumer with RabbitMQ for reliable message delivery', 1),
      ($1, 'Event Bus Pattern', 'In-memory pub/sub implementation', 'typescript', $3, 'Demonstrates publish-subscribe pattern for decoupling event producers and consumers', 2),
      ($1, 'Event Sourcing', 'Bank account with event sourcing', 'typescript', $4, 'Shows how to implement event sourcing to store all state changes as events', 3),
      ($1, 'CQRS Pattern', 'Separate read and write models', 'typescript', $5, 'Demonstrates command query responsibility segregation for optimized reads and writes', 4)
    `, [
      lesson.rows[0].id,
      `import amqp from 'amqplib';

class RabbitMQProducer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
  }

  async publishEvent(exchange: string, routingKey: string, event: any): Promise<void> {
    if (!this.channel) throw new Error('Not connected');

    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log(\`Published: \${routingKey}\`);
  }
}

class RabbitMQConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
  }

  async subscribe(
    exchange: string,
    routingKey: string,
    queueName: string,
    handler: (event: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) throw new Error('Not connected');

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, exchange, routingKey);

    this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handler(event);
          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error:', error);
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }
}`,
      `type EventHandler = (event: any) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: any): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    await Promise.all(
      handlers.map(handler =>
        handler(event).catch(error =>
          console.error(\`Error in \${eventType} handler:\`, error)
        )
      )
    );
  }
}

// Usage
const bus = new EventBus();

bus.subscribe('OrderPlaced', async (event) => {
  console.log('Sending email...');
});

bus.subscribe('OrderPlaced', async (event) => {
  console.log('Reserving inventory...');
});

bus.subscribe('OrderPlaced', async (event) => {
  console.log('Notifying warehouse...');
});

await bus.publish({
  eventType: 'OrderPlaced',
  orderId: '123',
  customerId: '456',
});`,
      `class BankAccount {
  private balance: number = 0;
  private uncommittedEvents: DomainEvent[] = [];

  constructor(private readonly accountId: string) {}

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Invalid amount');
    this.apply(new MoneyDepositedEvent(this.accountId, amount));
  }

  withdraw(amount: number): void {
    if (amount <= 0) throw new Error('Invalid amount');
    if (this.balance < amount) throw new Error('Insufficient funds');
    this.apply(new MoneyWithdrawnEvent(this.accountId, amount));
  }

  private apply(event: DomainEvent): void {
    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: DomainEvent): void {
    if (event instanceof MoneyDepositedEvent) {
      this.balance += event.amount;
    } else if (event instanceof MoneyWithdrawnEvent) {
      this.balance -= event.amount;
    }
  }

  static fromEvents(accountId: string, events: DomainEvent[]): BankAccount {
    const account = new BankAccount(accountId);
    for (const event of events) {
      account.applyEvent(event);
    }
    return account;
  }

  getBalance(): number {
    return this.balance;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }
}

// Usage
const account = new BankAccount('acc-123');
account.deposit(1000);
account.withdraw(200);

const events = account.getUncommittedEvents();
// Save events to store

// Reconstruct from events
const reconstructed = BankAccount.fromEvents('acc-123', events);
console.log(reconstructed.getBalance()); // 800`,
      `// Write Side
class CreateOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItem[]
  ) {}
}

class OrderCommandHandler {
  async handle(command: CreateOrderCommand): Promise<void> {
    const order = new Order(command.orderId, command.customerId);
    
    for (const item of command.items) {
      order.addItem(item);
    }

    await this.orderRepository.save(order);
    await this.publishEvents(order.getUncommittedEvents());
  }
}

// Read Side
class GetOrderByIdQuery {
  constructor(public readonly orderId: string) {}
}

class OrderQueryHandler {
  async handle(query: GetOrderByIdQuery): Promise<any> {
    // Query from denormalized read model
    return await this.db.orderReadModel.findOne({
      orderId: query.orderId,
    });
  }
}

// Projection
class OrderProjection {
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.db.orderReadModel.insert({
      orderId: event.aggregateId,
      customerId: event.customerId,
      status: 'PENDING',
      totalAmount: event.totalAmount,
      createdAt: event.occurredAt,
    });
  }
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main benefit of event-driven architecture?', 'multiple_choice', $2, 'Loose coupling between components', 'Event-driven architecture promotes loose coupling because producers and consumers do not know about each other directly, communicating only through events.', 'easy', 10, 1),
      ($1, 'What is the purpose of a message queue like RabbitMQ?', 'multiple_choice', $3, 'To reliably deliver messages between services even if consumers are temporarily unavailable', 'Message queues provide reliable, asynchronous communication between services. They buffer messages and ensure delivery even when consumers are down.', 'medium', 15, 2),
      ($1, 'What is event sourcing?', 'multiple_choice', $4, 'Storing all state changes as a sequence of events rather than just current state', 'Event sourcing stores every state change as an event. This provides a complete audit trail and allows reconstructing state at any point in time.', 'medium', 15, 3),
      ($1, 'What does CQRS stand for and what is its main benefit?', 'multiple_choice', $5, 'Command Query Responsibility Segregation - allows separate optimization of read and write operations', 'CQRS separates read and write models, allowing each to be optimized independently. This improves scalability and performance for complex domains.', 'medium', 15, 4),
      ($1, 'Why is idempotency important in event consumers?', 'multiple_choice', $6, 'To handle duplicate events safely without side effects', 'Message delivery systems may deliver the same event multiple times. Idempotent consumers can process the same event multiple times without causing problems.', 'easy', 10, 5)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Faster processing', 'Loose coupling between components', 'Better security', 'Simpler code']),
      JSON.stringify(['To store data permanently', 'To encrypt messages', 'To reliably deliver messages between services even if consumers are temporarily unavailable', 'To reduce network traffic']),
      JSON.stringify(['Storing events in a database', 'Storing all state changes as a sequence of events rather than just current state', 'Publishing events to multiple consumers', 'Filtering events by type']),
      JSON.stringify(['Command Query Responsibility Segregation - allows separate optimization of read and write operations', 'Common Query Result Set - standardizes database queries', 'Continuous Quality Review System - ensures code quality', 'Cascading Query Resource Sharing - shares database resources']),
      JSON.stringify(['To improve performance', 'To reduce memory usage', 'To handle duplicate events safely without side effects', 'To enable event replay'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Event-Driven Architecture lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedEventDrivenArchitecture()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
