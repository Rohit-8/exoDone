// ============================================================================
// Event-Driven Architecture — Code Examples
// ============================================================================

const examples = {
  'event-driven-fundamentals': [
    {
      title: "Redis Pub/Sub Event System",
      description: "Cross-service communication using Redis pub/sub.",
      language: "javascript",
      code: `import { createClient } from 'redis';

class RedisEventBus {
  constructor(redisUrl) {
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });
    this.handlers = new Map();
  }

  async connect() {
    await this.publisher.connect();
    await this.subscriber.connect();
  }

  async publish(channel, event) {
    const message = JSON.stringify({
      ...event,
      id: event.id || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel, handler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
      await this.subscriber.subscribe(channel, (message) => {
        const event = JSON.parse(message);
        const handlers = this.handlers.get(channel) || [];
        handlers.forEach(h => h(event).catch(console.error));
      });
    }
    this.handlers.get(channel).push(handler);
  }

  async disconnect() {
    await this.publisher.disconnect();
    await this.subscriber.disconnect();
  }
}

// Usage
const bus = new RedisEventBus('redis://localhost:6379');
await bus.connect();

// Service A — publishes
await bus.publish('orders', {
  type: 'OrderPlaced',
  data: { orderId: '123', total: 99.99 },
});

// Service B — subscribes
await bus.subscribe('orders', async (event) => {
  if (event.type === 'OrderPlaced') {
    console.log('Processing order:', event.data.orderId);
  }
});`,
      explanation: "Redis Pub/Sub enables real-time cross-service communication. Each service subscribes to relevant channels. Published messages are delivered to all subscribers instantly.",
      order_index: 1,
    },
  ],
  'event-sourcing-cqrs': [
    {
      title: "Simple Event Store",
      description: "PostgreSQL-backed event store implementation.",
      language: "javascript",
      code: `class PostgresEventStore {
  constructor(pool) {
    this.pool = pool;
  }

  async init() {
    await this.pool.query(\`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        aggregate_id VARCHAR(255) NOT NULL,
        aggregate_type VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        version INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(aggregate_id, version)
      )
    \`);
    await this.pool.query(
      'CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_id, version)'
    );
  }

  async getEvents(aggregateId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM events WHERE aggregate_id = $1 ORDER BY version ASC',
      [aggregateId]
    );
    return rows;
  }

  async appendEvents(aggregateId, aggregateType, events, expectedVersion) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Optimistic concurrency check
      const { rows } = await client.query(
        'SELECT MAX(version) as max_version FROM events WHERE aggregate_id = $1',
        [aggregateId]
      );
      const currentVersion = rows[0].max_version || 0;

      if (currentVersion !== expectedVersion) {
        throw new Error(\`Concurrency conflict: expected v\${expectedVersion}, got v\${currentVersion}\`);
      }

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;

        await client.query(
          \`INSERT INTO events (aggregate_id, aggregate_type, event_type, data, metadata, version)
           VALUES ($1, $2, $3, $4, $5, $6)\`,
          [aggregateId, aggregateType, event.type, event.data, event.metadata || {}, version]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}`,
      explanation: "This event store uses PostgreSQL with optimistic concurrency control. The UNIQUE(aggregate_id, version) constraint prevents concurrent writes from corrupting the event stream.",
      order_index: 1,
    },
  ],
};

export default examples;
