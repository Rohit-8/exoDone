// ============================================================================
// Distributed Systems — Content
// ============================================================================

export const topic = {
  name: 'Distributed Systems',
  slug: 'distributed-systems',
  description: 'Master CAP theorem, consistency models, consensus algorithms, distributed transactions, and resilience patterns for building reliable distributed systems.',
  estimated_time: 400,
  order_index: 10,
};

export const lessons = [
  {
    title: 'CAP Theorem & Consistency Models',
    slug: 'cap-theorem-consistency',
    summary: 'Understand the fundamental trade-offs in distributed systems: Consistency, Availability, and Partition Tolerance, plus strong vs eventual consistency models.',
    difficulty_level: 'expert',
    estimated_time: 50,
    order_index: 1,
    key_points: [
      'CAP theorem states you can only guarantee two of three: Consistency, Availability, Partition Tolerance',
      'In practice, partition tolerance is mandatory — the real choice is between CP and AP',
      'Strong consistency guarantees all nodes see the same data at the same time',
      'Eventual consistency allows temporary divergence but guarantees convergence',
      'PACELC extends CAP: if Partitioned → A vs C; Else → Latency vs Consistency',
      'Linearizability is the strongest consistency model — operations appear instantaneous',
      'Causal consistency preserves cause-and-effect ordering without total ordering',
      'Vector clocks and Lamport timestamps help establish partial ordering in distributed systems',
    ],
    content: `# CAP Theorem & Consistency Models

## The CAP Theorem

The **CAP theorem** (Brewer's theorem, 2000) states that a distributed data store can provide at most **two out of three** guarantees simultaneously:

### The Three Properties

1. **Consistency (C)**: Every read receives the most recent write or an error. All nodes see the same data at the same time.
2. **Availability (A)**: Every request receives a non-error response, without guarantee that it contains the most recent write.
3. **Partition Tolerance (P)**: The system continues to operate despite an arbitrary number of messages being dropped or delayed by the network.

### Why You Can't Have All Three

\`\`\`
Network Partition Occurs:
┌─────────────┐     ✕ BROKEN ✕     ┌─────────────┐
│   Node A     │─────────────────── │   Node B     │
│   Data: X=1  │                    │   Data: X=1  │
└─────────────┘                    └─────────────┘

Client writes X=2 to Node A:

Option 1: CP (Consistent + Partition Tolerant)
  → Node A rejects the write (can't confirm with B)
  → System is UNAVAILABLE but CONSISTENT

Option 2: AP (Available + Partition Tolerant)
  → Node A accepts write X=2, Node B still has X=1
  → System is AVAILABLE but INCONSISTENT

Option 3: CA (Consistent + Available) — NOT POSSIBLE
  → Requires all nodes to communicate
  → Network partition makes this impossible
\`\`\`

### Real-World CAP Trade-offs

| System | Type | Behavior |
|--------|------|----------|
| PostgreSQL (single) | CA | Consistent + Available, no partition tolerance |
| MongoDB (with majority writes) | CP | Rejects writes during partition for consistency |
| Cassandra | AP | Always writable, eventually consistent |
| ZooKeeper | CP | Consistent coordination, unavailable during leader election |
| DynamoDB | AP (tunable) | Default eventual consistency, optional strong reads |
| CockroachDB | CP | Serializable consistency, reduced availability during partitions |

## PACELC Theorem

PACELC extends CAP by addressing what happens when there is **no** partition:

\`\`\`
If (Partition) then {Availability vs Consistency}
Else {Latency vs Consistency}

Examples:
┌────────────────┬─────────────┬──────────────┐
│ System         │ P → A or C  │ E → L or C   │
├────────────────┼─────────────┼──────────────┤
│ Cassandra      │ PA          │ EL           │
│ DynamoDB       │ PA          │ EL           │
│ MongoDB        │ PC          │ EC           │
│ CockroachDB    │ PC          │ EC           │
│ Cosmos DB      │ PA          │ EL or EC     │
└────────────────┴─────────────┴──────────────┘
\`\`\`

## Consistency Models Spectrum

\`\`\`
Strongest ─────────────────────────────────────── Weakest
Lineariz-  Sequential  Causal    Session   Eventual
ability    Consistency Consist.  Consist.  Consist.

← More coordination, higher latency
                         Less coordination, lower latency →
\`\`\`

### 1. Linearizability (Strongest)

Every operation appears to take effect **instantaneously** at some point between its invocation and completion.

\`\`\`javascript
// All clients see operations in real-time order
// If Client A writes X=2, and Client B reads after A's write completes,
// Client B is GUARANTEED to see X=2

// Implementation: Single leader with synchronous replication
class LinearizableStore {
  constructor() {
    this.data = new Map();
    this.lock = new Mutex();
  }

  async write(key, value) {
    await this.lock.acquire();
    try {
      this.data.set(key, value);
      await this.replicateToAllFollowers(key, value); // synchronous
    } finally {
      this.lock.release();
    }
  }

  async read(key) {
    await this.lock.acquire();
    try {
      return this.data.get(key);
    } finally {
      this.lock.release();
    }
  }
}
\`\`\`

### 2. Sequential Consistency

All operations appear in **some** sequential order that is consistent with the program order of each individual process.

\`\`\`javascript
// All clients see the SAME order, but it may not match real-time
// Valid sequential order: A writes X=1, B writes X=2, all see X=2
// Also valid: B writes X=2, A writes X=1, all see X=1
// Invalid: A sees X=1, B sees X=2 (different orders)
\`\`\`

### 3. Causal Consistency

Operations that are **causally related** are seen in the same order by all nodes. Concurrent operations may be seen in different orders.

\`\`\`javascript
// Causal relationship examples:
// 1. Read-then-write: if process reads X, then writes Y,
//    the write to Y is causally dependent on the read of X
// 2. Write-then-read: if process writes X, then reads Y from another process
//    that read X, there's a causal chain

class CausalStore {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.vectorClock = {};  // {nodeId: counter}
    this.data = new Map();
  }

  write(key, value) {
    // Increment own clock
    this.vectorClock[this.nodeId] = 
      (this.vectorClock[this.nodeId] || 0) + 1;
    
    this.data.set(key, {
      value,
      clock: { ...this.vectorClock },
    });
  }

  canApply(remoteClock) {
    // Check if all causal dependencies are satisfied
    for (const [node, time] of Object.entries(remoteClock)) {
      if (node === this.nodeId) continue;
      if ((this.vectorClock[node] || 0) < time) return false;
    }
    return true;
  }

  merge(key, value, remoteClock) {
    if (this.canApply(remoteClock)) {
      this.data.set(key, { value, clock: remoteClock });
      // Merge clocks: take max of each entry
      for (const [node, time] of Object.entries(remoteClock)) {
        this.vectorClock[node] = Math.max(
          this.vectorClock[node] || 0, time
        );
      }
    } else {
      // Buffer until dependencies are met
      this.pendingQueue.push({ key, value, clock: remoteClock });
    }
  }
}
\`\`\`

### 4. Eventual Consistency

If no new writes are made, all replicas will **eventually** converge to the same value.

\`\`\`javascript
// Anti-entropy protocols ensure convergence:
// 1. Read Repair: Fix stale data on read
// 2. Merkle Trees: Efficiently find differences between replicas
// 3. Gossip Protocol: Periodically exchange state with random peers

class EventuallyConsistentStore {
  constructor(nodeId, peers) {
    this.nodeId = nodeId;
    this.peers = peers;
    this.data = new Map(); // key → {value, timestamp}
    
    // Gossip every 1 second
    setInterval(() => this.gossip(), 1000);
  }

  write(key, value) {
    this.data.set(key, {
      value,
      timestamp: Date.now(),
      nodeId: this.nodeId,
    });
  }

  read(key) {
    return this.data.get(key)?.value;
  }

  // Last-Writer-Wins (LWW) conflict resolution
  merge(key, remoteEntry) {
    const local = this.data.get(key);
    if (!local || remoteEntry.timestamp > local.timestamp) {
      this.data.set(key, remoteEntry);
    }
  }

  async gossip() {
    const peer = this.peers[Math.floor(Math.random() * this.peers.length)];
    const peerData = await peer.getDigest();
    
    for (const [key, entry] of peerData) {
      this.merge(key, entry);
    }
  }
}
\`\`\`

## Vector Clocks & Lamport Timestamps

### Lamport Timestamps

Simple logical clock for establishing **happened-before** relationships:

\`\`\`javascript
class LamportClock {
  constructor() {
    this.time = 0;
  }

  // Before sending a message or local event
  tick() {
    this.time++;
    return this.time;
  }

  // On receiving a message with sender's timestamp
  receive(senderTime) {
    this.time = Math.max(this.time, senderTime) + 1;
    return this.time;
  }
}

// Usage:
// Process A: tick() → 1, tick() → 2, send(2)
// Process B: receive(2) → 3, tick() → 4
// If A's event has timestamp 2 and B's has timestamp 4:
//   A happened-before B (maybe, or concurrent)
// If timestamps are equal: events are concurrent
\`\`\`

### Vector Clocks

Track causality precisely across all nodes:

\`\`\`javascript
class VectorClock {
  constructor(nodeId, nodeCount) {
    this.nodeId = nodeId;
    this.clock = new Array(nodeCount).fill(0);
  }

  tick() {
    this.clock[this.nodeId]++;
    return [...this.clock];
  }

  receive(remoteClock) {
    for (let i = 0; i < this.clock.length; i++) {
      this.clock[i] = Math.max(this.clock[i], remoteClock[i]);
    }
    this.clock[this.nodeId]++;
    return [...this.clock];
  }

  // Compare two vector clocks
  static compare(a, b) {
    let aGreater = false, bGreater = false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] > b[i]) aGreater = true;
      if (b[i] > a[i]) bGreater = true;
    }
    if (aGreater && !bGreater) return 'BEFORE';  // a happened before b
    if (bGreater && !aGreater) return 'AFTER';   // a happened after b
    if (!aGreater && !bGreater) return 'EQUAL';
    return 'CONCURRENT'; // both have greater entries
  }
}
\`\`\`

## Quorum-Based Systems

Quorums ensure correctness without requiring all nodes to respond:

\`\`\`javascript
// N = total replicas, W = write quorum, R = read quorum
// Strong consistency: W + R > N
// Example: N=3, W=2, R=2 → guaranteed to read latest write

class QuorumStore {
  constructor(replicas) {
    this.replicas = replicas; // N nodes
    this.N = replicas.length;
    this.W = Math.ceil((this.N + 1) / 2); // majority write
    this.R = Math.ceil((this.N + 1) / 2); // majority read
  }

  async write(key, value) {
    const version = Date.now();
    const promises = this.replicas.map(r => 
      r.write(key, value, version).catch(() => null)
    );
    
    const results = await Promise.allSettled(promises);
    const successes = results.filter(r => r.status === 'fulfilled' && r.value);
    
    if (successes.length < this.W) {
      throw new Error('Write quorum not met');
    }
    return { success: true, version };
  }

  async read(key) {
    const promises = this.replicas.map(r =>
      r.read(key).catch(() => null)
    );
    
    const results = (await Promise.allSettled(promises))
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);
    
    if (results.length < this.R) {
      throw new Error('Read quorum not met');
    }
    
    // Return the value with the highest version (latest write)
    return results.reduce((latest, curr) =>
      curr.version > latest.version ? curr : latest
    );
  }
}
\`\`\`

## Key Takeaways

- **CAP is about trade-offs**, not absolute choices — most systems are tunable
- **Partition tolerance is non-negotiable** in real distributed systems
- Choose **CP** when correctness matters (banking, inventory)
- Choose **AP** when availability matters (social media feeds, caches)
- **Eventual consistency** is sufficient for many real-world use cases
- **Vector clocks** enable precise causality tracking
- **Quorums** provide tunable consistency guarantees
`,
  },
  {
    title: 'Distributed Transactions & Saga Pattern',
    slug: 'distributed-transactions-saga',
    summary: 'Learn strategies for maintaining data consistency across services: Two-Phase Commit, Saga patterns, Circuit Breaker, and compensating transactions.',
    difficulty_level: 'expert',
    estimated_time: 55,
    order_index: 2,
    key_points: [
      '2PC provides atomic commits across multiple databases but blocks on coordinator failure',
      '3PC adds a pre-commit phase to reduce blocking but adds complexity',
      'Sagas break distributed transactions into local transactions with compensating actions',
      'Choreography-based sagas use events — each service publishes and listens',
      'Orchestration-based sagas use a coordinator to direct the workflow',
      'The Circuit Breaker pattern prevents cascade failures by failing fast',
      'Idempotency keys ensure operations can be safely retried',
      'The Outbox Pattern solves the dual-write problem for reliable event publishing',
    ],
    content: `# Distributed Transactions & Saga Pattern

## The Problem: Distributed Transactions

In a monolith, a single database transaction guarantees ACID properties. In microservices, each service has its own database — there's no single transaction spanning them all.

\`\`\`
Order Service          Payment Service          Inventory Service
┌──────────┐          ┌──────────┐            ┌──────────┐
│ Orders DB │          │ Payments │            │ Inventory │
│           │          │    DB    │            │    DB     │
└──────────┘          └──────────┘            └──────────┘

Problem: How to ensure ALL THREE databases are updated
atomically when placing an order?
\`\`\`

## Two-Phase Commit (2PC)

The classic approach — a **coordinator** orchestrates an atomic commit across participants.

### Phase 1: Prepare (Voting)

\`\`\`javascript
class TwoPhaseCommitCoordinator {
  constructor(participants) {
    this.participants = participants;
    this.transactionLog = new TransactionLog();
  }

  async execute(transaction) {
    const txId = crypto.randomUUID();
    
    // Phase 1: PREPARE — Ask all participants to vote
    console.log(\`[2PC] Transaction \${txId}: PREPARE phase\`);
    this.transactionLog.write(txId, 'PREPARING');
    
    const votes = await Promise.allSettled(
      this.participants.map(p => 
        p.prepare(txId, transaction)
          .then(() => ({ node: p.id, vote: 'YES' }))
          .catch(err => ({ node: p.id, vote: 'NO', reason: err.message }))
      )
    );

    const allVotedYes = votes.every(
      v => v.status === 'fulfilled' && v.value.vote === 'YES'
    );

    // Phase 2: COMMIT or ABORT
    if (allVotedYes) {
      return this.commitAll(txId);
    } else {
      return this.abortAll(txId, votes);
    }
  }

  async commitAll(txId) {
    console.log(\`[2PC] Transaction \${txId}: COMMIT phase\`);
    this.transactionLog.write(txId, 'COMMITTING');
    
    await Promise.all(
      this.participants.map(p => p.commit(txId))
    );
    
    this.transactionLog.write(txId, 'COMMITTED');
    return { status: 'committed', txId };
  }

  async abortAll(txId, votes) {
    console.log(\`[2PC] Transaction \${txId}: ABORT phase\`);
    this.transactionLog.write(txId, 'ABORTING');
    
    // Only abort participants that voted YES
    const yesVoters = votes
      .filter(v => v.status === 'fulfilled' && v.value.vote === 'YES')
      .map(v => v.value.node);
    
    await Promise.all(
      this.participants
        .filter(p => yesVoters.includes(p.id))
        .map(p => p.abort(txId))
    );
    
    this.transactionLog.write(txId, 'ABORTED');
    return { status: 'aborted', txId };
  }
}

class Participant {
  constructor(id, db) {
    this.id = id;
    this.db = db;
    this.preparedTransactions = new Map();
  }

  async prepare(txId, transaction) {
    // Validate and lock resources
    const result = await this.db.query('BEGIN');
    await this.db.query(transaction.sql, transaction.params);
    // DON'T commit yet — hold the lock
    this.preparedTransactions.set(txId, result);
    return 'YES';
  }

  async commit(txId) {
    const tx = this.preparedTransactions.get(txId);
    await tx.query('COMMIT');
    this.preparedTransactions.delete(txId);
  }

  async abort(txId) {
    const tx = this.preparedTransactions.get(txId);
    await tx.query('ROLLBACK');
    this.preparedTransactions.delete(txId);
  }
}
\`\`\`

### 2PC Problems

- **Blocking**: If coordinator crashes after PREPARE, participants hold locks indefinitely
- **Single point of failure**: Coordinator crash can leave system in uncertain state
- **Performance**: Synchronous protocol adds significant latency
- **Not partition tolerant**: Network partition can cause inconsistency

## The Saga Pattern

Sagas replace a single distributed transaction with a **sequence of local transactions**, each with a **compensating action** to undo its effects.

\`\`\`
Forward flow:
  T1 → T2 → T3 → T4 → Success!

If T3 fails, compensate backwards:
  T1 → T2 → T3(fail) → C2 → C1

Where:
  T = Transaction (do)
  C = Compensation (undo)
\`\`\`

### Choreography-Based Saga

Each service publishes events; other services listen and react. No central coordinator.

\`\`\`javascript
// Order Service — starts the saga
class OrderService {
  async createOrder(orderData) {
    const order = await this.db.query(
      'INSERT INTO orders (customer_id, total, status) VALUES ($1, $2, $3) RETURNING *',
      [orderData.customerId, orderData.total, 'PENDING']
    );

    // Publish event — Payment Service will pick this up
    await this.eventBus.publish('order.created', {
      orderId: order.id,
      customerId: orderData.customerId,
      total: orderData.total,
      items: orderData.items,
    });

    return order;
  }

  // Compensation: if payment or inventory fails
  async handlePaymentFailed(event) {
    await this.db.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['CANCELLED', event.orderId]
    );
    await this.eventBus.publish('order.cancelled', {
      orderId: event.orderId,
      reason: event.reason,
    });
  }

  async handleInventoryFailed(event) {
    await this.db.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['CANCELLED', event.orderId]
    );
  }
}

// Payment Service — step 2
class PaymentService {
  constructor() {
    this.eventBus.subscribe('order.created', (e) => this.handleOrderCreated(e));
    this.eventBus.subscribe('inventory.failed', (e) => this.refundPayment(e));
  }

  async handleOrderCreated(event) {
    try {
      const payment = await this.processPayment(event.customerId, event.total);
      
      await this.eventBus.publish('payment.completed', {
        orderId: event.orderId,
        paymentId: payment.id,
        items: event.items,
      });
    } catch (error) {
      await this.eventBus.publish('payment.failed', {
        orderId: event.orderId,
        reason: error.message,
      });
    }
  }

  async refundPayment(event) {
    // Compensating transaction
    await this.db.query(
      'UPDATE payments SET status = $1 WHERE order_id = $2',
      ['REFUNDED', event.orderId]
    );
  }
}

// Inventory Service — step 3
class InventoryService {
  constructor() {
    this.eventBus.subscribe('payment.completed', (e) => this.reserveInventory(e));
  }

  async reserveInventory(event) {
    try {
      for (const item of event.items) {
        const result = await this.db.query(
          'UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2 AND quantity >= $1 RETURNING *',
          [item.quantity, item.productId]
        );
        if (result.rows.length === 0) {
          throw new Error(\`Insufficient stock for product \${item.productId}\`);
        }
      }

      await this.eventBus.publish('inventory.reserved', {
        orderId: event.orderId,
      });
    } catch (error) {
      await this.eventBus.publish('inventory.failed', {
        orderId: event.orderId,
        paymentId: event.paymentId,
        reason: error.message,
      });
    }
  }
}
\`\`\`

### Orchestration-Based Saga

A central **Saga Orchestrator** controls the flow, telling each service what to do.

\`\`\`javascript
class OrderSagaOrchestrator {
  constructor(orderService, paymentService, inventoryService) {
    this.steps = [
      {
        name: 'Create Order',
        execute: (ctx) => orderService.createOrder(ctx.orderData),
        compensate: (ctx) => orderService.cancelOrder(ctx.orderId),
      },
      {
        name: 'Process Payment',
        execute: (ctx) => paymentService.charge(ctx.orderId, ctx.total),
        compensate: (ctx) => paymentService.refund(ctx.orderId),
      },
      {
        name: 'Reserve Inventory',
        execute: (ctx) => inventoryService.reserve(ctx.orderId, ctx.items),
        compensate: (ctx) => inventoryService.release(ctx.orderId, ctx.items),
      },
      {
        name: 'Confirm Order',
        execute: (ctx) => orderService.confirm(ctx.orderId),
        compensate: null, // Last step — no compensation needed
      },
    ];
  }

  async execute(orderData) {
    const context = { orderData, orderId: null, total: orderData.total, items: orderData.items };
    const completedSteps = [];

    for (const step of this.steps) {
      try {
        console.log(\`[Saga] Executing: \${step.name}\`);
        const result = await step.execute(context);
        
        // Enrich context with results
        if (result?.orderId) context.orderId = result.orderId;
        
        completedSteps.push(step);
      } catch (error) {
        console.error(\`[Saga] Failed at: \${step.name} — \${error.message}\`);
        
        // Compensate in reverse order
        for (const completedStep of completedSteps.reverse()) {
          if (completedStep.compensate) {
            try {
              console.log(\`[Saga] Compensating: \${completedStep.name}\`);
              await completedStep.compensate(context);
            } catch (compError) {
              console.error(\`[Saga] Compensation failed: \${completedStep.name}\`, compError);
              // Log for manual intervention
              await this.logFailedCompensation(context, completedStep, compError);
            }
          }
        }
        throw new Error(\`Saga failed at \${step.name}: \${error.message}\`);
      }
    }

    return { success: true, orderId: context.orderId };
  }
}
\`\`\`

### Choreography vs Orchestration

| Aspect | Choreography | Orchestration |
|--------|-------------|---------------|
| Coupling | Loose — services only know events | Tighter — orchestrator knows all steps |
| Complexity | Grows with number of services | Centralized — easier to understand |
| Single point of failure | No | Yes (orchestrator) |
| Debugging | Hard — follow events across services | Easy — single place to check |
| Best for | Simple flows (2-3 steps) | Complex flows (4+ steps) |

## Circuit Breaker Pattern

Prevents cascade failures when a downstream service is failing.

\`\`\`javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    
    this.state = 'CLOSED';     // CLOSED → OPEN → HALF_OPEN → CLOSED
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
        console.log('[Circuit Breaker] → HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN — request rejected');
      }
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new Error('Circuit breaker HALF_OPEN — max test calls reached');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        console.log('[Circuit Breaker] → CLOSED (recovered)');
      }
    } else {
      this.failureCount = 0; // Reset on success in CLOSED state
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.log('[Circuit Breaker] → OPEN (half-open test failed)');
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('[Circuit Breaker] → OPEN (threshold exceeded)');
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailure: this.lastFailureTime,
    };
  }
}

// Usage
const paymentBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 10000,
});

async function processPayment(orderId, amount) {
  return paymentBreaker.call(async () => {
    const response = await fetch('https://payment-service/charge', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount }),
    });
    if (!response.ok) throw new Error(\`Payment failed: \${response.status}\`);
    return response.json();
  });
}
\`\`\`

## The Outbox Pattern

Solves the **dual-write problem** — how to atomically update a database AND publish an event.

\`\`\`javascript
// Problem: These two operations are NOT atomic
await db.query('UPDATE orders SET status = $1', ['confirmed']); // ← DB write
await eventBus.publish('order.confirmed', { orderId });          // ← Event publish
// If the app crashes between these two lines, data is inconsistent

// Solution: Outbox Pattern
class OutboxPublisher {
  constructor(db, poller) {
    this.db = db;
    
    // Background poller reads outbox and publishes events
    setInterval(() => this.pollAndPublish(), 1000);
  }

  // Step 1: Write business data AND event in SAME transaction
  async createOrder(orderData) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Business write
      const order = await client.query(
        'INSERT INTO orders (customer_id, total, status) VALUES ($1, $2, $3) RETURNING *',
        [orderData.customerId, orderData.total, 'CONFIRMED']
      );

      // Outbox write (same transaction!)
      await client.query(
        \`INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, $3, $4)\`,
        ['Order', order.rows[0].id, 'order.confirmed', JSON.stringify(order.rows[0])]
      );

      await client.query('COMMIT');
      return order.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Step 2: Background process reads outbox and publishes
  async pollAndPublish() {
    const result = await this.db.query(
      'SELECT * FROM outbox WHERE published = false ORDER BY created_at LIMIT 100'
    );

    for (const event of result.rows) {
      try {
        await this.eventBus.publish(event.event_type, JSON.parse(event.payload));
        await this.db.query(
          'UPDATE outbox SET published = true, published_at = NOW() WHERE id = $1',
          [event.id]
        );
      } catch (error) {
        console.error('Failed to publish event:', event.id, error);
        // Will retry on next poll — idempotency on consumer side handles duplicates
      }
    }
  }
}
\`\`\`

## Idempotency

Ensuring operations produce the same result regardless of how many times they're called.

\`\`\`javascript
class IdempotentProcessor {
  constructor(db) {
    this.db = db;
  }

  async processPayment(idempotencyKey, paymentData) {
    // Check if already processed
    const existing = await this.db.query(
      'SELECT * FROM processed_payments WHERE idempotency_key = $1',
      [idempotencyKey]
    );

    if (existing.rows.length > 0) {
      console.log(\`Payment \${idempotencyKey} already processed — returning cached result\`);
      return existing.rows[0].result;
    }

    // Process the payment
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const result = await this.chargeCustomer(paymentData);

      // Record that we processed this key
      await client.query(
        'INSERT INTO processed_payments (idempotency_key, result, created_at) VALUES ($1, $2, NOW())',
        [idempotencyKey, JSON.stringify(result)]
      );

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
\`\`\`

## Key Takeaways

- **2PC** is simple but blocking — avoid in high-throughput systems
- **Sagas** trade atomicity for availability and resilience
- Use **choreography** for simple flows, **orchestration** for complex ones
- **Circuit breakers** prevent cascading failures across services
- The **Outbox Pattern** solves dual-write problems reliably
- **Idempotency** is essential — networks are unreliable, retries are inevitable
- Design compensating actions carefully — they ARE your "undo" mechanism
`,
  },
];
