// ============================================================================
// Distributed Systems — Content
// ============================================================================

export const topic = {
  "name": "Distributed Systems",
  "slug": "distributed-systems",
  "description": "Tackle the hardest problems in software engineering — CAP theorem, consensus algorithms, distributed transactions, and fault tolerance.",
  "estimated_time": 300,
  "order_index": 10
};

export const lessons = [
  {
    title: "CAP Theorem & Consistency Models",
    slug: "cap-theorem-consistency",
    summary: "Understand the fundamental trade-offs in distributed systems: Consistency, Availability, and Partition Tolerance.",
    difficulty_level: "expert",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "CAP: in a network partition, choose either Consistency or Availability",
  "Strong Consistency: every read reflects the most recent write",
  "Eventual Consistency: reads may lag but will converge",
  "PACELC extends CAP: even without Partitions, choose Latency vs Consistency",
  "Real systems exist on a spectrum — not a binary choice"
],
    content: `# CAP Theorem & Consistency Models

## CAP Theorem

In a distributed system experiencing a **network partition**, you must choose between:

| Property | Meaning |
|---|---|
| **C**onsistency | Every read receives the most recent write (or an error) |
| **A**vailability | Every request receives a response (may not be the latest) |
| **P**artition tolerance | System operates despite network failures between nodes |

> You **must** tolerate partitions (P is non-negotiable in distributed systems). So the real choice is **CP** vs **AP**.

### CP Systems — Favor Consistency
- PostgreSQL with synchronous replication
- MongoDB (with majority write concern)
- ZooKeeper, etcd

### AP Systems — Favor Availability
- Cassandra
- DynamoDB
- DNS

## Consistency Models

\`\`\`
Strongest ─────────────────────────────── Weakest
Linearizable → Sequential → Causal → Eventual
\`\`\`

### Eventual Consistency in Practice

\`\`\`javascript
// Write to primary
await primaryDB.query(
  'UPDATE products SET stock = stock - 1 WHERE id = $1',
  [productId]
);

// Replicas may lag by milliseconds to seconds
// A read from a replica might return stale data
const result = await replicaDB.query(
  'SELECT stock FROM products WHERE id = $1',
  [productId]
);
// result.rows[0].stock might be the OLD value!
\`\`\`

### Read-Your-Writes Consistency

\`\`\`javascript
// Solution: after a write, read from primary for a short window
class SmartReadRouter {
  constructor(primary, replica) {
    this.primary = primary;
    this.replica = replica;
    this.recentWrites = new Map(); // userId → timestamp
  }

  async read(userId, query, params) {
    const lastWrite = this.recentWrites.get(userId);
    const usePrimary = lastWrite && (Date.now() - lastWrite < 5000);

    const db = usePrimary ? this.primary : this.replica;
    return db.query(query, params);
  }

  recordWrite(userId) {
    this.recentWrites.set(userId, Date.now());
  }
}
\`\`\`

## PACELC Theorem

> If there is a **P**artition, choose **A** or **C**;  
> **E**lse (normal operation), choose **L**atency or **C**onsistency.

| System | P→A/C | E→L/C |
|---|---|---|
| DynamoDB | PA | EL (fast reads, eventual) |
| PostgreSQL | PC | EC (consistent, higher latency) |
| Cassandra | PA | EL (tunable) |
`,
  },
  {
    title: "Distributed Transactions & Saga Pattern",
    slug: "distributed-transactions-saga",
    summary: "Manage multi-service transactions with the Saga pattern — choreography and orchestration approaches.",
    difficulty_level: "expert",
    estimated_time: 45,
    order_index: 2,
    key_points: [
  "Two-Phase Commit (2PC) has availability problems — avoid in microservices",
  "Saga pattern breaks a distributed transaction into local transactions + compensations",
  "Choreography: services react to events — no central coordinator",
  "Orchestration: a central saga coordinator directs the steps",
  "Each step must have a compensating action (rollback) for failure scenarios"
],
    content: `# Distributed Transactions & the Saga Pattern

## The Problem

In a microservices world, a single business operation (e.g., "place an order") spans multiple services and databases. Traditional database transactions (ACID) don't work across service boundaries.

## Two-Phase Commit (2PC) — Avoid in Microservices

1. **Prepare**: coordinator asks all participants to prepare
2. **Commit**: if all say "yes", commit; otherwise rollback

Problems: single point of failure, blocking, poor availability.

## Saga Pattern

Break the distributed transaction into a sequence of **local transactions**, each with a **compensating action**:

\`\`\`
Step 1: Create Order        → Compensate: Cancel Order
Step 2: Reserve Inventory   → Compensate: Release Inventory
Step 3: Process Payment     → Compensate: Refund Payment
Step 4: Ship Order          → (final step, no compensation)
\`\`\`

### Saga Orchestrator

\`\`\`javascript
class OrderSaga {
  #steps = [
    {
      name: 'createOrder',
      execute: async (ctx) => {
        ctx.orderId = await orderService.create(ctx.orderData);
      },
      compensate: async (ctx) => {
        await orderService.cancel(ctx.orderId);
      },
    },
    {
      name: 'reserveInventory',
      execute: async (ctx) => {
        await inventoryService.reserve(ctx.orderData.items);
      },
      compensate: async (ctx) => {
        await inventoryService.release(ctx.orderData.items);
      },
    },
    {
      name: 'processPayment',
      execute: async (ctx) => {
        ctx.paymentId = await paymentService.charge(
          ctx.orderData.customerId,
          ctx.orderData.total
        );
      },
      compensate: async (ctx) => {
        await paymentService.refund(ctx.paymentId);
      },
    },
    {
      name: 'confirmOrder',
      execute: async (ctx) => {
        await orderService.confirm(ctx.orderId);
      },
      // Final step — no compensation
    },
  ];

  async execute(orderData) {
    const ctx = { orderData };
    const completedSteps = [];

    for (const step of this.#steps) {
      try {
        console.log(\`Executing: \${step.name}\`);
        await step.execute(ctx);
        completedSteps.push(step);
      } catch (error) {
        console.error(\`Failed at: \${step.name}\`, error.message);
        // Compensate in reverse order
        for (const completed of completedSteps.reverse()) {
          if (completed.compensate) {
            try {
              console.log(\`Compensating: \${completed.name}\`);
              await completed.compensate(ctx);
            } catch (compError) {
              console.error(\`Compensation failed: \${completed.name}\`, compError);
              // Log for manual resolution
            }
          }
        }
        throw new Error(\`Saga failed at \${step.name}: \${error.message}\`);
      }
    }

    return ctx;
  }
}

// Usage
const saga = new OrderSaga();
await saga.execute({
  customerId: 'cust_123',
  items: [{ productId: 'prod_1', quantity: 2 }],
  total: 59.98,
});
\`\`\`
`,
  },
];
