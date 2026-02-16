// ============================================================================
// Distributed Systems — Code Examples
// ============================================================================

const examples = {
  'cap-theorem-consistency': [
    {
      title: 'Quorum-Based Read/Write System',
      description: 'Implements a distributed key-value store with configurable read/write quorums for tunable consistency.',
      language: 'javascript',
      code: `// Quorum-Based Distributed Key-Value Store
// N replicas, W write quorum, R read quorum
// Strong consistency when W + R > N

class ReplicaNode {
  constructor(id) {
    this.id = id;
    this.store = new Map(); // key → { value, version, timestamp }
    this.healthy = true;
  }

  async write(key, value, version) {
    if (!this.healthy) throw new Error(\`Node \${this.id} is down\`);
    // Simulate network latency
    await new Promise(r => setTimeout(r, Math.random() * 50));
    this.store.set(key, { value, version, timestamp: Date.now() });
    return { nodeId: this.id, version };
  }

  async read(key) {
    if (!this.healthy) throw new Error(\`Node \${this.id} is down\`);
    await new Promise(r => setTimeout(r, Math.random() * 50));
    const entry = this.store.get(key);
    if (!entry) return null;
    return { ...entry, nodeId: this.id };
  }
}

class QuorumKVStore {
  constructor(replicaCount = 3) {
    this.replicas = Array.from(
      { length: replicaCount },
      (_, i) => new ReplicaNode(i)
    );
    this.N = replicaCount;
    this.W = Math.ceil((this.N + 1) / 2); // Majority
    this.R = Math.ceil((this.N + 1) / 2); // Majority
    this.versionCounter = 0;
  }

  async put(key, value) {
    const version = ++this.versionCounter;

    const results = await Promise.allSettled(
      this.replicas.map(r => r.write(key, value, version))
    );

    const successes = results.filter(r => r.status === 'fulfilled');

    if (successes.length < this.W) {
      throw new Error(
        \`Write quorum failed: \${successes.length}/\${this.W} ackd\`
      );
    }

    console.log(\`[PUT] key=\${key}, value=\${value}, version=\${version}, acks=\${successes.length}\`);
    return { key, value, version };
  }

  async get(key) {
    const results = await Promise.allSettled(
      this.replicas.map(r => r.read(key))
    );

    const responses = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    if (responses.length < this.R) {
      throw new Error(
        \`Read quorum failed: \${responses.length}/\${this.R} responded\`
      );
    }

    // Return highest version (most recent write)
    const latest = responses.reduce((best, curr) =>
      curr.version > best.version ? curr : best
    );

    // Read repair: update stale replicas
    this.readRepair(key, latest);

    console.log(\`[GET] key=\${key}, value=\${latest.value}, version=\${latest.version}\`);
    return latest;
  }

  async readRepair(key, latestEntry) {
    // Fire-and-forget: update stale nodes
    for (const replica of this.replicas) {
      const entry = await replica.read(key).catch(() => null);
      if (!entry || entry.version < latestEntry.version) {
        replica.write(key, latestEntry.value, latestEntry.version).catch(() => {});
      }
    }
  }
}

// --- Demo ---
const store = new QuorumKVStore(5); // 5 replicas, W=3, R=3
await store.put('user:1', { name: 'Alice', email: 'alice@example.com' });
const result = await store.get('user:1');
console.log('Read result:', result);

// Simulate node failure
store.replicas[0].healthy = false;
store.replicas[1].healthy = false;
// Still works! We need 3 of 5, and 3 are still up
const result2 = await store.get('user:1');
console.log('Read with 2 nodes down:', result2);`,
      explanation: 'Demonstrates a quorum-based distributed store where W + R > N ensures strong consistency. Read repair fixes stale replicas encountered during reads. The system tolerates node failures as long as quorum thresholds are met.',
      order_index: 1,
    },
    {
      title: 'Vector Clock Implementation',
      description: 'Full vector clock implementation for tracking causality and detecting concurrent writes in a distributed system.',
      language: 'javascript',
      code: `// Vector Clock for Distributed Causality Tracking

class VectorClock {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.clock = {}; // { nodeId: logicalTime }
  }

  // Increment own position on local event
  increment() {
    this.clock[this.nodeId] = (this.clock[this.nodeId] || 0) + 1;
    return this.clone();
  }

  // Merge with remote clock on receive
  merge(remoteClock) {
    const allNodes = new Set([
      ...Object.keys(this.clock),
      ...Object.keys(remoteClock),
    ]);
    for (const node of allNodes) {
      this.clock[node] = Math.max(
        this.clock[node] || 0,
        remoteClock[node] || 0
      );
    }
    this.clock[this.nodeId] = (this.clock[this.nodeId] || 0) + 1;
    return this.clone();
  }

  clone() {
    return { ...this.clock };
  }

  // Compare two vector clocks
  static compare(a, b) {
    const allNodes = new Set([...Object.keys(a), ...Object.keys(b)]);
    let aGreater = false;
    let bGreater = false;

    for (const node of allNodes) {
      const aTime = a[node] || 0;
      const bTime = b[node] || 0;
      if (aTime > bTime) aGreater = true;
      if (bTime > aTime) bGreater = true;
    }

    if (aGreater && !bGreater) return 'HAPPENS_BEFORE'; // a → b
    if (bGreater && !aGreater) return 'HAPPENS_AFTER';  // b → a
    if (!aGreater && !bGreater) return 'EQUAL';
    return 'CONCURRENT'; // conflict!
  }

  static dominates(a, b) {
    return this.compare(a, b) === 'HAPPENS_BEFORE';
  }
}

// Distributed Store with Conflict Detection
class DistributedStore {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.vclock = new VectorClock(nodeId);
    this.data = new Map(); // key → [{ value, clock }]  (siblings for conflicts)
  }

  put(key, value) {
    const clock = this.vclock.increment();
    this.data.set(key, [{ value, clock }]);
    return { key, value, clock };
  }

  get(key) {
    const entries = this.data.get(key);
    if (!entries) return null;
    if (entries.length === 1) return entries[0];
    // Multiple siblings → conflict, client must resolve
    return { conflict: true, siblings: entries };
  }

  // Receive a write from another node
  receiveWrite(key, value, remoteClock) {
    this.vclock.merge(remoteClock);
    const existing = this.data.get(key);

    if (!existing) {
      this.data.set(key, [{ value, clock: remoteClock }]);
      return;
    }

    const newSiblings = [];
    let dominated = false;

    for (const entry of existing) {
      const cmp = VectorClock.compare(entry.clock, remoteClock);

      if (cmp === 'HAPPENS_AFTER') {
        // Existing entry is newer → ignore remote write
        dominated = true;
        newSiblings.push(entry);
      } else if (cmp === 'HAPPENS_BEFORE') {
        // Remote is newer → replace
        // Don't add the existing entry
      } else if (cmp === 'CONCURRENT') {
        // Conflict! Keep both as siblings
        newSiblings.push(entry);
      } else {
        newSiblings.push(entry);
      }
    }

    if (!dominated) {
      newSiblings.push({ value, clock: remoteClock });
    }

    this.data.set(key, newSiblings);
  }

  // Resolve conflict by choosing a value
  resolveConflict(key, resolvedValue) {
    const clock = this.vclock.increment();
    this.data.set(key, [{ value: resolvedValue, clock }]);
  }
}

// --- Demo ---
const nodeA = new DistributedStore('A');
const nodeB = new DistributedStore('B');

// Normal operation
const write1 = nodeA.put('user:1', { name: 'Alice' });
nodeB.receiveWrite('user:1', write1.value, write1.clock);
console.log('Node B after replication:', nodeB.get('user:1'));

// Concurrent writes (simulate network partition)
const writeA = nodeA.put('user:1', { name: 'Alice Updated A' });
const writeB = nodeB.put('user:1', { name: 'Alice Updated B' });

// When partition heals, exchange writes
nodeA.receiveWrite('user:1', writeB.value, writeB.clock);
const conflicted = nodeA.get('user:1');
console.log('Conflict detected:', conflicted);
// { conflict: true, siblings: [ {value: 'Alice Updated A', ...}, {value: 'Alice Updated B', ...} ] }

// Application resolves the conflict
nodeA.resolveConflict('user:1', { name: 'Alice Merged' });
console.log('After resolution:', nodeA.get('user:1'));`,
      explanation: 'Vector clocks track causality across distributed nodes. When two nodes write concurrently (during a partition), the vector clocks detect the conflict. The application must then resolve siblings — this is how systems like Amazon DynamoDB and Riak handle conflicts.',
      order_index: 2,
    },
    {
      title: 'Gossip Protocol for State Dissemination',
      description: 'Implements the gossip (epidemic) protocol for eventually consistent state propagation across a cluster.',
      language: 'javascript',
      code: `// Gossip Protocol — Epidemic-style state dissemination

class GossipNode {
  constructor(id, allPeers) {
    this.id = id;
    this.peers = allPeers.filter(p => p !== id);
    this.state = new Map(); // key → { value, version, origin }
    this.heartbeat = 0;
    this.memberList = new Map(); // nodeId → { heartbeat, timestamp, status }
    this.memberList.set(id, {
      heartbeat: 0, timestamp: Date.now(), status: 'ALIVE',
    });
  }

  // Set local state
  set(key, value) {
    const version = Date.now();
    this.state.set(key, { value, version, origin: this.id });
  }

  get(key) {
    return this.state.get(key)?.value ?? null;
  }

  // Periodic gossip round
  gossipRound(cluster) {
    this.heartbeat++;
    this.memberList.get(this.id).heartbeat = this.heartbeat;
    this.memberList.get(this.id).timestamp = Date.now();

    // Select random peer (fan-out = 1 for simplicity)
    const peerId = this.peers[Math.floor(Math.random() * this.peers.length)];
    const peer = cluster.get(peerId);
    if (!peer) return;

    // Send our state digest
    const digest = this.getDigest();
    const peerDigest = peer.receiveGossip(this.id, digest, cluster);

    // Process peer's response (pull)
    this.mergeDigest(peerDigest);
  }

  getDigest() {
    return {
      state: new Map(this.state),
      members: new Map(this.memberList),
    };
  }

  receiveGossip(fromId, remoteDigest, cluster) {
    // Merge state — Last-Writer-Wins by version
    for (const [key, remote] of remoteDigest.state) {
      const local = this.state.get(key);
      if (!local || remote.version > local.version) {
        this.state.set(key, { ...remote });
      }
    }

    // Merge membership list
    for (const [nodeId, remote] of remoteDigest.members) {
      const local = this.memberList.get(nodeId);
      if (!local || remote.heartbeat > local.heartbeat) {
        this.memberList.set(nodeId, { ...remote, timestamp: Date.now() });
      }
    }

    // Return our digest so the sender can pull from us
    return this.getDigest();
  }

  // Failure detection: nodes that haven't gossiped recently
  detectFailures(timeoutMs = 5000) {
    const now = Date.now();
    for (const [nodeId, info] of this.memberList) {
      if (nodeId === this.id) continue;
      if (now - info.timestamp > timeoutMs && info.status === 'ALIVE') {
        info.status = 'SUSPECT';
        console.log(\`[Node \${this.id}] Suspects node \${nodeId} has failed\`);
      }
      if (now - info.timestamp > timeoutMs * 3) {
        info.status = 'DEAD';
        console.log(\`[Node \${this.id}] Marks node \${nodeId} as DEAD\`);
      }
    }
  }
}

// --- Simulation ---
const nodeIds = ['A', 'B', 'C', 'D', 'E'];
const cluster = new Map();

for (const id of nodeIds) {
  cluster.set(id, new GossipNode(id, nodeIds));
}

// Node A sets a value
cluster.get('A').set('config:version', '2.0.0');

// Simulate gossip rounds
for (let round = 0; round < 10; round++) {
  console.log(\`\\n--- Gossip Round \${round + 1} ---\`);
  for (const [id, node] of cluster) {
    node.gossipRound(cluster);
  }

  // Check convergence
  for (const [id, node] of cluster) {
    const val = node.get('config:version');
    console.log(\`  Node \${id}: config:version = \${val}\`);
  }
}

// After a few rounds, all nodes converge to '2.0.0'`,
      explanation: 'The gossip protocol spreads information like a virus through random peer-to-peer exchanges. Each round, a node picks a random peer to exchange state with. Within O(log N) rounds, information reaches all nodes with high probability. This is used by Cassandra, DynamoDB, and Consul for cluster membership and state propagation.',
      order_index: 3,
    },
  ],

  'distributed-transactions-saga': [
    {
      title: 'Production-Ready Saga Orchestrator',
      description: 'A complete saga orchestrator implementation with persistent state, retry logic, and timeout handling.',
      language: 'javascript',
      code: `// Production-Ready Saga Orchestrator with Persistent State

class SagaDefinition {
  constructor(name) {
    this.name = name;
    this.steps = [];
  }

  step(name, executeFn, compensateFn) {
    this.steps.push({ name, execute: executeFn, compensate: compensateFn });
    return this; // Fluent API
  }

  build() {
    return this.steps;
  }
}

class SagaState {
  constructor(sagaId, sagaName) {
    this.sagaId = sagaId;
    this.sagaName = sagaName;
    this.status = 'STARTED'; // STARTED | RUNNING | COMPENSATING | COMPLETED | FAILED
    this.currentStep = 0;
    this.completedSteps = [];
    this.context = {};
    this.error = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

class SagaOrchestrator {
  constructor(db) {
    this.db = db;
    this.definitions = new Map();
    this.maxRetries = 3;
    this.retryDelayMs = 1000;
  }

  register(name, definitionBuilder) {
    const def = new SagaDefinition(name);
    definitionBuilder(def);
    this.definitions.set(name, def.build());
  }

  async execute(sagaName, initialContext) {
    const sagaId = crypto.randomUUID();
    const steps = this.definitions.get(sagaName);
    if (!steps) throw new Error(\`Unknown saga: \${sagaName}\`);

    const state = new SagaState(sagaId, sagaName);
    state.context = { ...initialContext };
    await this.persistState(state);

    console.log(\`[Saga \${sagaId}] Starting '\${sagaName}' with \${steps.length} steps\`);

    // Execute forward
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      state.currentStep = i;
      state.status = 'RUNNING';
      await this.persistState(state);

      try {
        console.log(\`[Saga \${sagaId}] Step \${i + 1}/\${steps.length}: \${step.name}\`);
        const result = await this.executeWithRetry(
          step.execute, state.context, step.name
        );

        // Merge step result into context
        if (result && typeof result === 'object') {
          Object.assign(state.context, result);
        }
        state.completedSteps.push(i);
        await this.persistState(state);

      } catch (error) {
        console.error(\`[Saga \${sagaId}] Step '\${step.name}' failed: \${error.message}\`);
        state.error = error.message;
        state.status = 'COMPENSATING';
        await this.persistState(state);

        // Compensate in reverse
        await this.compensate(sagaId, steps, state);
        return { sagaId, status: 'FAILED', error: error.message };
      }
    }

    state.status = 'COMPLETED';
    state.updatedAt = new Date();
    await this.persistState(state);
    console.log(\`[Saga \${sagaId}] Completed successfully\`);
    return { sagaId, status: 'COMPLETED', context: state.context };
  }

  async compensate(sagaId, steps, state) {
    console.log(\`[Saga \${sagaId}] Compensating \${state.completedSteps.length} steps\`);

    // Reverse order
    for (const stepIndex of [...state.completedSteps].reverse()) {
      const step = steps[stepIndex];
      if (!step.compensate) continue;

      try {
        console.log(\`[Saga \${sagaId}] Compensating: \${step.name}\`);
        await this.executeWithRetry(
          step.compensate, state.context, \`compensate:\${step.name}\`
        );
      } catch (compError) {
        console.error(
          \`[Saga \${sagaId}] Compensation failed for '\${step.name}': \${compError.message}\`
        );
        state.status = 'FAILED';
        state.error += \`; Compensation failed: \${step.name}\`;
        await this.persistState(state);
        // Alert operations team for manual intervention
        await this.alertOps(sagaId, step.name, compError);
      }
    }
  }

  async executeWithRetry(fn, context, stepName) {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn(context);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          console.log(
            \`[Retry] \${stepName} attempt \${attempt}/\${this.maxRetries} failed, retrying in \${delay}ms\`
          );
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  async persistState(state) {
    state.updatedAt = new Date();
    // In production: INSERT/UPDATE saga_state table
    console.log(\`[Persist] Saga \${state.sagaId}: \${state.status} (step \${state.currentStep})\`);
  }

  async alertOps(sagaId, stepName, error) {
    console.error(\`[ALERT] Manual intervention needed: saga=\${sagaId}, step=\${stepName}\`);
  }
}

// --- Usage: Order Saga ---
const orchestrator = new SagaOrchestrator(db);

orchestrator.register('place-order', (saga) => {
  saga
    .step('Create Order',
      async (ctx) => {
        const orderId = 'ORD-' + Date.now();
        // await db.query('INSERT INTO orders ...')
        console.log(\`  Created order: \${orderId}\`);
        return { orderId };
      },
      async (ctx) => {
        // await db.query('UPDATE orders SET status = cancelled WHERE id = $1', [ctx.orderId])
        console.log(\`  Cancelled order: \${ctx.orderId}\`);
      }
    )
    .step('Reserve Inventory',
      async (ctx) => {
        // await inventoryService.reserve(ctx.orderId, ctx.items)
        console.log(\`  Reserved inventory for \${ctx.orderId}\`);
        return { inventoryReserved: true };
      },
      async (ctx) => {
        // await inventoryService.release(ctx.orderId, ctx.items)
        console.log(\`  Released inventory for \${ctx.orderId}\`);
      }
    )
    .step('Charge Payment',
      async (ctx) => {
        // await paymentService.charge(ctx.orderId, ctx.total)
        console.log(\`  Charged \${ctx.total} for \${ctx.orderId}\`);
        return { paymentId: 'PAY-' + Date.now() };
      },
      async (ctx) => {
        // await paymentService.refund(ctx.paymentId)
        console.log(\`  Refunded payment: \${ctx.paymentId}\`);
      }
    )
    .step('Send Confirmation',
      async (ctx) => {
        // await notificationService.send(ctx.orderId, ctx.email)
        console.log(\`  Sent confirmation for \${ctx.orderId}\`);
      },
      null // No compensation for notifications
    );
});

// Execute the saga
const result = await orchestrator.execute('place-order', {
  customerId: 'CUST-123',
  items: [{ productId: 'PROD-1', qty: 2 }],
  total: 49.99,
});
console.log('Saga result:', result);`,
      explanation: 'This production-ready saga orchestrator features: 1) Persistent state for crash recovery, 2) Exponential backoff retries, 3) Automatic compensation on failure, 4) Fluent API for defining saga steps, 5) Operation alerts for manual intervention when compensation fails. Each step enriches the context that subsequent steps (and compensations) can use.',
      order_index: 1,
    },
    {
      title: 'Circuit Breaker with Monitoring',
      description: 'Advanced circuit breaker with sliding window failure tracking, health metrics, and fallback support.',
      language: 'javascript',
      code: `// Advanced Circuit Breaker with Sliding Window & Metrics

class SlidingWindowCounter {
  constructor(windowSizeMs, bucketCount) {
    this.windowSizeMs = windowSizeMs;
    this.bucketCount = bucketCount;
    this.bucketSizeMs = windowSizeMs / bucketCount;
    this.buckets = [];
    this.currentBucketStart = Date.now();
  }

  record(success) {
    this.rotate();
    const bucket = this.buckets[this.buckets.length - 1];
    if (success) bucket.successes++;
    else bucket.failures++;
    bucket.total++;
  }

  rotate() {
    const now = Date.now();
    while (now - this.currentBucketStart >= this.bucketSizeMs) {
      this.buckets.push({ successes: 0, failures: 0, total: 0 });
      this.currentBucketStart += this.bucketSizeMs;
      // Remove old buckets
      while (this.buckets.length > this.bucketCount) {
        this.buckets.shift();
      }
    }
    if (this.buckets.length === 0) {
      this.buckets.push({ successes: 0, failures: 0, total: 0 });
    }
  }

  getStats() {
    this.rotate();
    const totals = this.buckets.reduce(
      (acc, b) => ({
        successes: acc.successes + b.successes,
        failures: acc.failures + b.failures,
        total: acc.total + b.total,
      }),
      { successes: 0, failures: 0, total: 0 }
    );
    totals.failureRate = totals.total > 0
      ? (totals.failures / totals.total) * 100
      : 0;
    return totals;
  }
}

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureRateThreshold = options.failureRateThreshold || 50; // %
    this.minimumCalls = options.minimumCalls || 10;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 5;
    this.windowSizeMs = options.windowSizeMs || 60000;
    this.fallback = options.fallback || null;

    this.state = 'CLOSED';
    this.counter = new SlidingWindowCounter(this.windowSizeMs, 10);
    this.openedAt = null;
    this.halfOpenSuccesses = 0;
    this.halfOpenFailures = 0;
    this.halfOpenCalls = 0;

    // Metrics
    this.metrics = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      fallbackCalls: 0,
      stateChanges: [],
    };
  }

  async execute(fn) {
    this.metrics.totalCalls++;

    // Check state transitions
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt >= this.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      } else {
        this.metrics.rejectedCalls++;
        return this.handleRejection();
      }
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      this.metrics.rejectedCalls++;
      return this.handleRejection();
    }

    // Execute the function
    try {
      if (this.state === 'HALF_OPEN') this.halfOpenCalls++;
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      if (this.fallback) {
        this.metrics.fallbackCalls++;
        return this.fallback(error);
      }
      throw error;
    }
  }

  recordSuccess() {
    this.metrics.successCalls++;
    this.counter.record(true);

    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenMaxCalls) {
        this.transitionTo('CLOSED');
      }
    }
  }

  recordFailure() {
    this.metrics.failedCalls++;
    this.counter.record(false);

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
      return;
    }

    // Check if failure rate exceeds threshold
    const stats = this.counter.getStats();
    if (stats.total >= this.minimumCalls &&
        stats.failureRate >= this.failureRateThreshold) {
      this.transitionTo('OPEN');
    }
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;

    console.log(\`[CB:\${this.name}] \${oldState} → \${newState}\`);
    this.metrics.stateChanges.push({
      from: oldState, to: newState, at: new Date(),
    });

    if (newState === 'OPEN') {
      this.openedAt = Date.now();
      this.halfOpenCalls = 0;
      this.halfOpenSuccesses = 0;
      this.halfOpenFailures = 0;
    }

    if (newState === 'CLOSED') {
      this.halfOpenCalls = 0;
      this.halfOpenSuccesses = 0;
    }
  }

  handleRejection() {
    if (this.fallback) {
      this.metrics.fallbackCalls++;
      return this.fallback(new Error('Circuit breaker is OPEN'));
    }
    throw new Error(\`[CB:\${this.name}] Circuit breaker is \${this.state}\`);
  }

  getHealth() {
    const stats = this.counter.getStats();
    return {
      name: this.name,
      state: this.state,
      failureRate: stats.failureRate.toFixed(1) + '%',
      totalCalls: this.metrics.totalCalls,
      rejected: this.metrics.rejectedCalls,
      fallbacks: this.metrics.fallbackCalls,
      recentChanges: this.metrics.stateChanges.slice(-5),
    };
  }
}

// --- Usage ---
const paymentCB = new CircuitBreaker('payment-service', {
  failureRateThreshold: 50,
  minimumCalls: 5,
  resetTimeoutMs: 10000,
  fallback: (err) => ({
    status: 'queued',
    message: 'Payment service unavailable, your order is queued.',
  }),
});

async function chargeCustomer(amount) {
  return paymentCB.execute(async () => {
    const res = await fetch('https://payment-api.internal/charge', {
      method: 'POST',
      body: JSON.stringify({ amount }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(\`Payment failed: \${res.status}\`);
    return res.json();
  });
}

// Health endpoint
app.get('/health/circuit-breakers', (req, res) => {
  res.json({ paymentService: paymentCB.getHealth() });
});`,
      explanation: 'This advanced circuit breaker uses a sliding window to calculate failure rates over time rather than simple counters. Features include: configurable failure rate thresholds, minimum call counts before triggering, fallback functions for graceful degradation, and comprehensive metrics for monitoring dashboards.',
      order_index: 2,
    },
    {
      title: 'Outbox Pattern with Change Data Capture',
      description: 'Implements the transactional outbox pattern to reliably publish domain events to a message broker.',
      language: 'javascript',
      code: `// Transactional Outbox Pattern with Polling Publisher

import pg from 'pg';
const { Pool } = pg;

// Schema:
// CREATE TABLE outbox (
//   id            BIGSERIAL PRIMARY KEY,
//   aggregate_type VARCHAR(100) NOT NULL,
//   aggregate_id   VARCHAR(100) NOT NULL,
//   event_type    VARCHAR(200) NOT NULL,
//   payload       JSONB NOT NULL,
//   created_at    TIMESTAMPTZ DEFAULT NOW(),
//   published     BOOLEAN DEFAULT FALSE,
//   published_at  TIMESTAMPTZ,
//   retry_count   INT DEFAULT 0,
//   last_error    TEXT
// );
// CREATE INDEX idx_outbox_unpublished ON outbox (published, created_at) WHERE published = FALSE;

class OutboxWriter {
  // Write business data + event in ONE transaction
  static async withOutboxEvent(pool, businessFn, event) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Execute business logic (e.g., INSERT INTO orders)
      const businessResult = await businessFn(client);

      // Write event to outbox in the SAME transaction
      await client.query(
        \`INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, $3, $4)\`,
        [event.aggregateType, event.aggregateId, event.eventType, JSON.stringify(event.payload)]
      );

      await client.query('COMMIT');
      return businessResult;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Polling Publisher — reads outbox and publishes to message broker
class OutboxPublisher {
  constructor(pool, messageBroker, options = {}) {
    this.pool = pool;
    this.broker = messageBroker;
    this.batchSize = options.batchSize || 100;
    this.pollIntervalMs = options.pollIntervalMs || 1000;
    this.maxRetries = options.maxRetries || 5;
    this.running = false;
  }

  start() {
    this.running = true;
    this.poll();
    console.log('[Outbox Publisher] Started');
  }

  stop() {
    this.running = false;
    console.log('[Outbox Publisher] Stopped');
  }

  async poll() {
    while (this.running) {
      try {
        const published = await this.publishBatch();
        if (published === 0) {
          // No events to publish — wait before next poll
          await new Promise(r => setTimeout(r, this.pollIntervalMs));
        }
        // If we published events, immediately check for more
      } catch (error) {
        console.error('[Outbox Publisher] Error:', error.message);
        await new Promise(r => setTimeout(r, this.pollIntervalMs * 2));
      }
    }
  }

  async publishBatch() {
    // Lock and fetch unpublished events (FOR UPDATE SKIP LOCKED for concurrency)
    const result = await this.pool.query(
      \`SELECT * FROM outbox
       WHERE published = FALSE AND retry_count < $1
       ORDER BY created_at ASC
       LIMIT $2
       FOR UPDATE SKIP LOCKED\`,
      [this.maxRetries, this.batchSize]
    );

    if (result.rows.length === 0) return 0;

    let publishedCount = 0;

    for (const event of result.rows) {
      try {
        await this.broker.publish(event.event_type, {
          eventId: event.id,
          aggregateType: event.aggregate_type,
          aggregateId: event.aggregate_id,
          payload: event.payload,
          createdAt: event.created_at,
        });

        await this.pool.query(
          'UPDATE outbox SET published = TRUE, published_at = NOW() WHERE id = $1',
          [event.id]
        );
        publishedCount++;
      } catch (error) {
        console.error(\`[Outbox] Failed to publish event \${event.id}:\`, error.message);
        await this.pool.query(
          'UPDATE outbox SET retry_count = retry_count + 1, last_error = $1 WHERE id = $2',
          [error.message, event.id]
        );
      }
    }

    console.log(\`[Outbox] Published \${publishedCount}/\${result.rows.length} events\`);
    return publishedCount;
  }
}

// --- Usage in Order Service ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class OrderService {
  async createOrder(customerId, items, total) {
    const order = await OutboxWriter.withOutboxEvent(
      pool,
      async (client) => {
        const result = await client.query(
          'INSERT INTO orders (customer_id, total, status) VALUES ($1, $2, $3) RETURNING *',
          [customerId, total, 'CREATED']
        );
        return result.rows[0];
      },
      {
        aggregateType: 'Order',
        aggregateId: customerId, // Will be replaced with actual order ID
        eventType: 'order.created',
        payload: { customerId, items, total },
      }
    );
    return order;
  }
}

// Start the outbox publisher
const publisher = new OutboxPublisher(pool, messageBroker, {
  batchSize: 50,
  pollIntervalMs: 500,
  maxRetries: 5,
});
publisher.start();`,
      explanation: 'The outbox pattern solves the dual-write problem: instead of writing to the database AND publishing an event (two operations that can partially fail), we write both to the database in a single transaction. A background publisher polls the outbox table and forwards events to the message broker. FOR UPDATE SKIP LOCKED enables concurrent publishers without conflicts.',
      order_index: 3,
    },
  ],
};

export default examples;
