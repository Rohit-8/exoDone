// ============================================================================
// Event-Driven Architecture — Quiz Questions
// ============================================================================

export default {
  'event-driven-architecture-fundamentals': [
    {
      question_text: "What is the primary advantage of event-driven architecture over synchronous request-driven communication between services?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Event-driven systems always have lower latency than synchronous systems",
        "Loose coupling — producers and consumers are independent, can evolve separately, and new consumers can be added without modifying the producer",
        "Event-driven systems eliminate the need for databases entirely",
        "Event-driven architecture guarantees exactly-once processing by default"
      ]),
      correct_answer: "Loose coupling — producers and consumers are independent, can evolve separately, and new consumers can be added without modifying the producer",
      explanation: "The core advantage of EDA is loose coupling. In request-driven architecture, Service A must know Service B's API, URL, and must wait for a response (temporal, behavioral, and availability coupling). In EDA, Service A simply publishes an event ('OrderPlaced') and has no knowledge of consumers. This means: (1) New consumers (analytics, notifications) can be added without changing the producer. (2) If a consumer is down, events queue up and are processed when it recovers. (3) Services can be developed and deployed independently. EDA does NOT guarantee lower latency (async processing adds variable delay) and does NOT provide exactly-once semantics by default (at-least-once is typical).",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Why must event consumers be idempotent in an event-driven system, and what happens if they are not?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Idempotency is optional and only needed for performance optimization in high-throughput systems",
        "Because message brokers use at-least-once delivery, meaning events can be delivered multiple times due to retries, so non-idempotent consumers would produce incorrect results (duplicate charges, double emails, wrong counts)",
        "Idempotency is required because events are always delivered exactly once, but consumers may crash",
        "Idempotency prevents events from being published in the wrong order"
      ]),
      correct_answer: "Because message brokers use at-least-once delivery, meaning events can be delivered multiple times due to retries, so non-idempotent consumers would produce incorrect results (duplicate charges, double emails, wrong counts)",
      explanation: "Most message brokers guarantee at-least-once delivery, not exactly-once. Duplicates happen when: (1) A consumer processes an event but crashes before sending an ACK — the broker re-delivers. (2) Network timeout causes the broker to think the ACK was lost — re-delivery. (3) Manual event replay for disaster recovery. Without idempotency, duplicates cause real harm: a payment consumer charges the customer twice, an email consumer sends duplicate notifications, a counter consumer increments twice. Idempotency strategies include: tracking processed event IDs in a deduplication store, using UPSERT (ON CONFLICT) for database writes, using idempotency keys for external API calls (like Stripe's Idempotency-Key header), and using SET instead of INCREMENT for counters.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text: "What is the difference between a Domain Event and an Integration Event?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Domain Events are synchronous and Integration Events are asynchronous",
        "Domain Events represent business facts within a Bounded Context and may include internal details, while Integration Events are specifically designed for cross-service communication with versioned schemas and only externally-relevant data",
        "Domain Events are stored in databases while Integration Events are only kept in memory",
        "There is no meaningful difference — the terms are interchangeable"
      ]),
      correct_answer: "Domain Events represent business facts within a Bounded Context and may include internal details, while Integration Events are specifically designed for cross-service communication with versioned schemas and only externally-relevant data",
      explanation: "Domain Events and Integration Events serve different audiences. Domain Events are internal to a Bounded Context — they can include internal implementation details (like internalPriorityScore or internal order state), their schema can change freely since all consumers are within the same service, and they are typically transported via an in-process event bus. Integration Events are the public contract between services — they expose only externally-relevant data, must be versioned (v1, v2) because consumers are in different services that deploy independently, use namespaced naming (ecommerce.order.placed) to avoid collisions, and are transported via message brokers (Kafka, RabbitMQ). Treating all events as integration events leads to schema change paralysis; treating integration events casually leads to breaking external consumers.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text: "What is Event Sourcing and what problem does it solve compared to traditional state-based persistence?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Event Sourcing stores only the latest state in a cache for faster reads",
        "Event Sourcing persists every state change as an immutable event, making the event log the source of truth — this provides a complete audit trail, enables temporal queries, and allows rebuilding state by replaying events",
        "Event Sourcing is a logging technique that writes application logs to a message broker",
        "Event Sourcing replaces the database with an in-memory event bus for higher performance"
      ]),
      correct_answer: "Event Sourcing persists every state change as an immutable event, making the event log the source of truth — this provides a complete audit trail, enables temporal queries, and allows rebuilding state by replaying events",
      explanation: "In traditional persistence, you store the current state: account.balance = 950. If someone asks 'how did it get to 950?', you cannot answer. With Event Sourcing, you store every change: AccountOpened(0), MoneyDeposited(1000), MoneyWithdrawn(50). Current state (balance=950) is derived by replaying these events. Benefits: (1) Complete audit trail — every change is recorded as an immutable fact. (2) Temporal queries — reconstruct state at any point in time by replaying events up to that timestamp. (3) Debug production issues — replay events to reproduce exactly what happened. (4) Rebuild read models — if your search index is corrupted, replay all events to rebuild it. (5) Regulatory compliance — financial and healthcare regulations often require immutable audit logs. Trade-offs include increased storage, eventual consistency, and the need for snapshots when event streams become very long.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "What does CQRS (Command Query Responsibility Segregation) separate, and when is it worth introducing?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "CQRS separates the frontend from the backend by using different API gateways for reads and writes",
        "CQRS separates the write model (commands with business logic and validation) from the read model (optimized denormalized views), allowing each to be scaled and optimized independently",
        "CQRS separates authentication from authorization using two different middleware layers",
        "CQRS separates relational databases from NoSQL databases at the infrastructure level"
      ]),
      correct_answer: "CQRS separates the write model (commands with business logic and validation) from the read model (optimized denormalized views), allowing each to be scaled and optimized independently",
      explanation: "CQRS recognizes that read and write patterns are fundamentally different. The write side needs strong consistency, validation, business rules, domain model integrity, and transactional guarantees. The read side needs speed, denormalized data for display, can tolerate slight staleness, and often needs multiple views (list view, detail view, search, reports). By separating them, you can: use an event store (PostgreSQL) for writes and Elasticsearch/Redis for reads, scale the read side independently (most systems are 90%+ reads), create multiple projections for different use cases. Use CQRS when: read and write workloads differ significantly, you need multiple read representations, you're using Event Sourcing (CQRS is the natural read pattern for event-sourced systems). Avoid CQRS for simple CRUD applications — the added complexity isn't justified.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text: "How does eventual consistency manifest in event-driven systems, and what is the 'stale read' problem?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Eventual consistency means data is always immediately consistent across all services with no delay",
        "The stale read problem occurs when a user writes data (e.g., places an order) and immediately reads it back before the asynchronous projection has processed the event, seeing outdated results",
        "Eventual consistency only applies to systems using SQL databases and does not affect NoSQL systems",
        "The stale read problem is caused by database replication lag and has no relation to event-driven architecture"
      ]),
      correct_answer: "The stale read problem occurs when a user writes data (e.g., places an order) and immediately reads it back before the asynchronous projection has processed the event, seeing outdated results",
      explanation: "In CQRS/EDA, after a user places an order, the write side persists the event and returns success. But the read side (projection) processes the event asynchronously — there's a delay (milliseconds to seconds). If the user immediately navigates to their order list, the projection may not have processed the event yet, and the order appears missing. Mitigation strategies: (1) Read-Your-Own-Writes — return the order data directly from the write response, don't redirect to the read model. (2) Optimistic UI — the frontend immediately shows the expected state without waiting for confirmation. (3) Polling with short retries — retry the read a few times with small delays. (4) WebSocket push — the projection notifies the client when the read model is updated. In interviews, acknowledge this trade-off and explain the mitigation strategy you'd use.",
      difficulty: "hard",
      order_index: 6,
    },
  ],
  'implementing-event-driven-systems': [
    {
      question_text: "When should you choose Apache Kafka over RabbitMQ as your message broker?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "When you need simple task queues with request-reply patterns and complex routing rules",
        "When you need a distributed, immutable event log with event replay capability, high throughput (1M+ messages/sec), multiple independent consumer groups, and configurable retention for event sourcing or stream processing",
        "When you need fire-and-forget messaging with no persistence for real-time notifications",
        "When you want the simplest possible setup with minimal operational overhead"
      ]),
      correct_answer: "When you need a distributed, immutable event log with event replay capability, high throughput (1M+ messages/sec), multiple independent consumer groups, and configurable retention for event sourcing or stream processing",
      explanation: "Kafka and RabbitMQ solve different problems. Kafka is a distributed log — messages are appended to an ordered, immutable log and retained for a configurable period (days, weeks, or forever). Consumers pull from the log at their own pace, and multiple consumer groups can independently read the same data. This makes Kafka ideal for: event sourcing (the log IS the source of truth), event replay (new consumers can read from the beginning), high-throughput streaming (1M+ msg/sec), and analytics pipelines. RabbitMQ is a traditional message queue — messages are pushed to consumers and deleted after acknowledgment. RabbitMQ excels at: task queues (competing consumers), complex routing (topic/header exchanges), request-reply RPC patterns, and lower-latency delivery. Redis Pub/Sub is fire-and-forget (no persistence) — use it only for real-time notifications where message loss is acceptable.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What is a Dead Letter Queue (DLQ), and why is it essential in production event-driven systems?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A DLQ is a backup database that stores copies of all events for disaster recovery purposes",
        "A DLQ is a special queue where messages that cannot be processed after exhausting all retry attempts are sent, preventing poison messages from blocking the queue and preserving them for investigation and manual replay",
        "A DLQ is a message queue that only accepts messages during off-peak hours to reduce system load",
        "A DLQ is a logging mechanism that records which consumers are currently connected to a broker"
      ]),
      correct_answer: "A DLQ is a special queue where messages that cannot be processed after exhausting all retry attempts are sent, preventing poison messages from blocking the queue and preserving them for investigation and manual replay",
      explanation: "A Dead Letter Queue is a critical production pattern. Without a DLQ, a 'poison message' (one that always fails — e.g., malformed data, missing dependency) blocks the entire queue. The broker keeps retrying the same message, no subsequent messages get processed, and the system effectively halts. A DLQ solves this by: (1) Moving the failed message to a separate queue after N retries. (2) Allowing subsequent messages to be processed normally. (3) Preserving the failed message along with error details (error message, stack trace, retry count) for investigation. (4) Enabling manual replay once the bug is fixed — you can drain the DLQ back into the main queue. In production, you should monitor the DLQ depth and alert when it's > 0, because any message in the DLQ represents data that was NOT processed and may need manual attention.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "Why is exponential backoff with jitter recommended over fixed-delay retries in distributed event-driven systems?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Because fixed-delay retries are technically impossible to implement with message brokers",
        "Because exponential backoff gives the failing service time to recover, and jitter adds randomization to prevent the 'thundering herd' problem where all retrying consumers hit the recovered service simultaneously",
        "Because jitter makes retry behavior unpredictable which improves security",
        "Because exponential backoff always uses less total time than fixed delays"
      ]),
      correct_answer: "Because exponential backoff gives the failing service time to recover, and jitter adds randomization to prevent the 'thundering herd' problem where all retrying consumers hit the recovered service simultaneously",
      explanation: "When a downstream service goes down, all consumers that depend on it start failing and retrying. With fixed-delay retries (e.g., retry every 1 second), all 1000 consumers will retry at exactly the same time, creating a 'thundering herd' that can overwhelm the service the moment it recovers, causing it to crash again. Exponential backoff (1s, 2s, 4s, 8s...) gives the failing service progressively more time to recover. But pure exponential backoff still has the thundering herd problem — all consumers that failed at the same time will retry at the same times. Adding jitter (randomization) spreads the retries across time: instead of all retrying at exactly 4 seconds, they retry at random intervals between 0 and 4 seconds. This smooths the load on the recovering service. AWS recommends 'full jitter' (random between 0 and the exponential value) as the optimal strategy.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text: "What is the Saga pattern, and how does it differ from traditional distributed transactions?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A Saga is a type of two-phase commit (2PC) protocol that locks resources across all participating databases until the transaction completes",
        "A Saga manages distributed transactions by decomposing them into a sequence of local transactions, each publishing events; if any step fails, compensating transactions undo the previous steps — unlike 2PC, it does not hold locks across services",
        "A Saga is a message queue pattern that batches multiple events into a single atomic transaction",
        "A Saga is a caching strategy that stores intermediate transaction results in Redis"
      ]),
      correct_answer: "A Saga manages distributed transactions by decomposing them into a sequence of local transactions, each publishing events; if any step fails, compensating transactions undo the previous steps — unlike 2PC, it does not hold locks across services",
      explanation: "Traditional distributed transactions (two-phase commit / 2PC) lock resources across all participating databases until all agree to commit. This is impractical in microservices because: (1) It creates tight coupling between services. (2) Locks reduce throughput. (3) A single service being slow or unavailable blocks the entire transaction. The Saga pattern takes a different approach: break the distributed transaction into local transactions that are coordinated by events. Example: PlaceOrder saga = (1) Create order, (2) Charge payment, (3) Reserve inventory, (4) Schedule shipping. If step 3 fails, compensating transactions are executed in reverse: refund payment (undo step 2), cancel order (undo step 1). There are two saga styles: Choreography (each service reacts to events independently — simpler but harder to trace) and Orchestration (a central coordinator tells each service what to do — easier to debug but creates a coordination dependency).",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text: "What is the difference between choreography-based and orchestration-based sagas?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Choreography uses synchronous HTTP calls while orchestration uses asynchronous events",
        "In choreography, each service reacts to events independently with no central coordinator; in orchestration, a central saga coordinator directs each service step by step and handles compensation on failure",
        "Choreography is only used in monolithic applications while orchestration is only for microservices",
        "There is no practical difference — both terms describe the same pattern"
      ]),
      correct_answer: "In choreography, each service reacts to events independently with no central coordinator; in orchestration, a central saga coordinator directs each service step by step and handles compensation on failure",
      explanation: "Choreography-based sagas: Each service listens for events and decides what to do next. OrderService publishes 'OrderPlaced' → PaymentService hears it and charges, publishes 'PaymentCompleted' → InventoryService hears it and reserves stock. There's no single place that defines the full flow. Pros: very loose coupling, no single point of failure. Cons: hard to see the complete flow, debugging requires tracing through many services, adding new steps is error-prone. Orchestration-based sagas: A central OrderSagaOrchestrator defines all steps explicitly: step 1 = create order, step 2 = charge payment, step 3 = reserve inventory. It calls each service in sequence and handles compensation if any step fails. Pros: the entire flow is visible in one place, easy to debug. Cons: the orchestrator is a single point of coordination, slightly tighter coupling. Rule of thumb: use choreography for simple flows (2-3 steps) and orchestration for complex flows (4+ steps, branching logic, conditional steps).",
      difficulty: "hard",
      order_index: 5,
    },
    {
      question_text: "What is optimistic concurrency control in an event store, and why is it necessary?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It locks the entire event store table during writes to prevent any concurrent access",
        "It checks the expected aggregate version before appending events — if another process has written events in the meantime (version mismatch), the write is rejected with a concurrency conflict error, preventing lost updates",
        "It allows all concurrent writes to succeed and merges conflicting events automatically",
        "It uses database row-level locks on the aggregate for the entire duration of command processing"
      ]),
      correct_answer: "It checks the expected aggregate version before appending events — if another process has written events in the meantime (version mismatch), the write is rejected with a concurrency conflict error, preventing lost updates",
      explanation: "Without concurrency control, two processes could read the same aggregate version (v5), both make decisions based on that state, and both append events as v6 — the second write silently overwrites the first, causing a lost update (and potentially invalid state, like overdrawing a bank account). Optimistic concurrency control solves this without locks: (1) When loading an aggregate, record its current version (v5). (2) Before appending new events, check that the version is still v5 in the database. (3) If it's now v6 (another process wrote first), reject with a ConcurrencyConflict error. (4) The caller retries: reload the aggregate (now at v6), re-evaluate the command, and try again. This is 'optimistic' because it assumes conflicts are rare — it doesn't lock during the entire command processing time, only checks at write time. The UNIQUE(aggregate_id, version) database constraint is the ultimate safety net.",
      difficulty: "hard",
      order_index: 6,
    },
    {
      question_text: "What is the purpose of a correlation ID in event-driven systems?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A correlation ID is used to encrypt events during transit between services for security",
        "A correlation ID is a unique identifier that follows a request through all services and events it triggers, enabling end-to-end distributed tracing and debugging across the entire event flow",
        "A correlation ID determines which partition a message is assigned to in Kafka",
        "A correlation ID is used to deduplicate events and ensure idempotent processing"
      ]),
      correct_answer: "A correlation ID is a unique identifier that follows a request through all services and events it triggers, enabling end-to-end distributed tracing and debugging across the entire event flow",
      explanation: "In event-driven systems, a single user request can trigger a chain of events across many services: User places order → OrderPlaced event → PaymentService charges → PaymentCompleted event → InventoryService reserves stock → StockReserved event → ShippingService schedules delivery. Without a correlation ID, if something goes wrong (e.g., shipping fails), you have no way to connect the shipping failure back to the original order or payment. The correlation ID is generated when the initial request arrives (or extracted from the incoming X-Correlation-ID header) and is propagated through every event in the chain via the event metadata. When debugging, you filter logs and events by correlation ID to see the complete flow of a single request. A related concept is the causation ID — which specific event caused the current event to be produced. Together, correlation ID + causation ID give you a complete event genealogy tree.",
      difficulty: "medium",
      order_index: 7,
    },
    {
      question_text: "Why are event snapshots used in event sourcing, and when should you create one?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Snapshots replace the event log entirely — once a snapshot is taken, old events can be deleted",
        "Snapshots cache the aggregate state at a specific version so that rebuilding the aggregate only requires replaying events after the snapshot, dramatically improving load time for aggregates with many events",
        "Snapshots are used to convert events from one schema version to another during upgrades",
        "Snapshots are read-model projections stored alongside the event store for query performance"
      ]),
      correct_answer: "Snapshots cache the aggregate state at a specific version so that rebuilding the aggregate only requires replaying events after the snapshot, dramatically improving load time for aggregates with many events",
      explanation: "When an aggregate has thousands of events (e.g., a frequently-traded stock account), rebuilding its state by replaying every event from the beginning is slow. Snapshots solve this by periodically saving the current state along with the version number. Loading becomes: (1) Load the snapshot (state at version 5000). (2) Load and replay only events after version 5000 (e.g., events 5001-5023). This is dramatically faster than replaying all 5023 events. Important: snapshots do NOT replace or delete events. The event log remains the source of truth. Snapshots are a performance optimization — if a snapshot is corrupted or deleted, you can always rebuild from the full event history. Common strategies for when to snapshot: every N events (e.g., every 100), at regular time intervals, or when event count exceeds a threshold. The snapshot is stored in a separate table with the aggregate_id as the primary key, overwritten each time.",
      difficulty: "medium",
      order_index: 8,
    },
  ],
};
