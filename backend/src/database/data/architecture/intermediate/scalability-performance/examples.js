// ============================================================================
// Scalability & Performance — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 1: Caching Strategies (3 examples)
  // ─────────────────────────────────────────────────────────────────────────
  'caching-strategies': [
    {
      title: "Production-Grade Cache Service with Stampede Protection",
      description: "A reusable Redis caching layer that implements cache-aside, write-through, pattern-based invalidation, and mutex-based stampede protection.",
      language: "javascript",
      code: `import Redis from 'ioredis';

class CacheService {
  constructor(redisClient, defaultTTL = 3600) {
    this.redis = redisClient;
    this.defaultTTL = defaultTTL;
    this.localCache = new Map(); // L1 in-process cache
    this.localTTL = 5000;       // 5s local cache
  }

  // ── L1 (local) + L2 (Redis) layered get ──────────────────────────
  async get(key) {
    // L1: check in-process cache first (0ms)
    const local = this.localCache.get(key);
    if (local && Date.now() < local.expiresAt) {
      return local.value;
    }

    // L2: check Redis (~1ms)
    const data = await this.redis.get(key);
    if (data) {
      const parsed = JSON.parse(data);
      this.localCache.set(key, {
        value: parsed,
        expiresAt: Date.now() + this.localTTL,
      });
      return parsed;
    }

    return null;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    this.localCache.set(key, {
      value,
      expiresAt: Date.now() + this.localTTL,
    });
  }

  // ── Cache-aside with stampede protection ──────────────────────────
  async getOrSet(key, fetcher, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    // Mutex lock to prevent thundering herd
    const lockKey = \`lock:\${key}\`;
    const acquired = await this.redis.set(lockKey, '1', 'EX', 10, 'NX');

    if (acquired) {
      try {
        const fresh = await fetcher();
        if (fresh !== null && fresh !== undefined) {
          await this.set(key, fresh, ttl);
        }
        return fresh;
      } finally {
        await this.redis.del(lockKey);
      }
    }

    // Another process is fetching — wait and retry
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getOrSet(key, fetcher, ttl);
  }

  // ── Write-through ────────────────────────────────────────────────
  async writeThrough(key, value, writer, ttl = this.defaultTTL) {
    const result = await writer(value);
    await this.set(key, result, ttl);
    return result;
  }

  // ── Invalidation ─────────────────────────────────────────────────
  async invalidate(key) {
    await this.redis.del(key);
    this.localCache.delete(key);
  }

  async invalidatePattern(pattern) {
    // SCAN-based (production safe — never use KEYS in production)
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor, 'MATCH', pattern, 'COUNT', 100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redis.del(...keys);
        keys.forEach(k => this.localCache.delete(k));
      }
    } while (cursor !== '0');
  }
}

// ── Usage ───────────────────────────────────────────────────────────
const redis = new Redis({ host: 'localhost', port: 6379 });
const cache = new CacheService(redis, 1800);

// Cache-aside with stampede protection
const user = await cache.getOrSet(
  \`user:\${userId}\`,
  () => db.query('SELECT * FROM users WHERE id = $1', [userId]),
  3600
);

// Write-through on update
await cache.writeThrough(
  \`user:\${userId}\`,
  { name: 'Alice', email: 'alice@example.com' },
  async (data) => {
    const { rows } = await db.query(
      'UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *',
      [data.name, data.email, userId]
    );
    return rows[0];
  }
);

// Invalidate all cache entries for a user
await cache.invalidatePattern(\`user:\${userId}:*\`);`,
      explanation: "This service layers an in-process Map (L1, 0ms) in front of Redis (L2, ~1ms). getOrSet implements cache-aside with a Redis-based mutex lock to prevent cache stampede — only one process fetches from DB while others wait. invalidatePattern uses SCAN instead of KEYS, which is safe in production because it doesn't block the Redis event loop. In interviews, mention this multi-layer approach and why KEYS is dangerous (blocks Redis for O(N) time).",
      order_index: 1,
    },
    {
      title: "HTTP Caching Middleware with ETag and Conditional Requests",
      description: "Express middleware that adds proper Cache-Control, ETag, and Last-Modified headers for both static and dynamic responses.",
      language: "javascript",
      code: `import crypto from 'crypto';

// ── Middleware: add ETag and handle conditional requests ────────────
function conditionalCache(options = {}) {
  const {
    maxAge = 60,           // Browser cache duration (seconds)
    sMaxAge = 300,         // CDN cache duration (seconds)
    isPrivate = false,     // true = Cache-Control: private (user-specific)
    staleWhileRevalidate = 30,
  } = options;

  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Generate ETag from response body
      const content = JSON.stringify(body);
      const etag = '"' + crypto
        .createHash('md5')
        .update(content)
        .digest('hex') + '"';

      res.set('ETag', etag);

      // Set Cache-Control
      const visibility = isPrivate ? 'private' : 'public';
      const parts = [\`\${visibility}\`, \`max-age=\${maxAge}\`];
      if (!isPrivate) {
        parts.push(\`s-maxage=\${sMaxAge}\`);
        parts.push(\`stale-while-revalidate=\${staleWhileRevalidate}\`);
      }
      res.set('Cache-Control', parts.join(', '));

      // Check If-None-Match (ETag-based conditional request)
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end(); // Not Modified — save bandwidth
      }

      // Check If-Modified-Since (time-based conditional request)
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince && res.get('Last-Modified')) {
        const clientDate = new Date(ifModifiedSince);
        const serverDate = new Date(res.get('Last-Modified'));
        if (clientDate >= serverDate) {
          return res.status(304).end();
        }
      }

      return originalJson(body);
    };

    next();
  };
}

// ── Usage in routes ─────────────────────────────────────────────────

// Public product listing — cached by CDN
app.get('/api/products',
  conditionalCache({ maxAge: 60, sMaxAge: 300 }),
  async (req, res) => {
    const products = await productService.getAll();
    res.set('Last-Modified', products.updatedAt.toUTCString());
    res.json(products.data);
  }
);

// User profile — private, cached in browser only
app.get('/api/me',
  authMiddleware,
  conditionalCache({ maxAge: 30, isPrivate: true }),
  async (req, res) => {
    const profile = await userService.getById(req.userId);
    res.json(profile);
  }
);

// Static assets — immutable, cache forever (bust via filename hash)
app.use('/assets', express.static('dist/assets', {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));`,
      explanation: "This middleware adds proper HTTP caching headers to API responses. ETag-based conditional requests (If-None-Match) let clients and CDNs validate cached content without re-downloading the body — a 304 response has no body, saving bandwidth. The s-maxage directive tells CDNs to cache longer than browsers. stale-while-revalidate allows serving stale content while fetching a fresh copy in the background, avoiding user-visible latency. In interviews, explain the difference between max-age (browser), s-maxage (shared/CDN), and why immutable is perfect for hashed filenames.",
      order_index: 2,
    },
    {
      title: "Write-Behind Cache with Batch Flush and Error Recovery",
      description: "A write-behind (write-back) cache that buffers writes in Redis and periodically flushes to the database in batches, with dead-letter handling for failed writes.",
      language: "javascript",
      code: `class WriteBehindCache {
  constructor(redis, db, options = {}) {
    this.redis = redis;
    this.db = db;
    this.flushInterval = options.flushInterval || 5000;  // 5s
    this.batchSize = options.batchSize || 50;
    this.maxRetries = options.maxRetries || 3;
    this.dirtyQueue = 'cache:dirty-queue';     // Redis list of dirty keys
    this.deadLetter = 'cache:dead-letter';     // Failed writes
    this.running = false;
  }

  // ── Write to cache immediately, mark for async DB flush ──────────
  async write(key, value) {
    const pipeline = this.redis.pipeline();
    pipeline.set(key, JSON.stringify(value));
    pipeline.lpush(this.dirtyQueue, JSON.stringify({
      key,
      timestamp: Date.now(),
      retries: 0,
    }));
    await pipeline.exec();
  }

  // ── Read from cache (always fresh because writes go here first) ──
  async read(key) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ── Start the background flush loop ──────────────────────────────
  start() {
    this.running = true;
    this.flushLoop();
    console.log('[WriteBehind] Started flush loop');
  }

  stop() {
    this.running = false;
  }

  async flushLoop() {
    while (this.running) {
      try {
        await this.flushBatch();
      } catch (err) {
        console.error('[WriteBehind] Flush error:', err.message);
      }
      await new Promise(r => setTimeout(r, this.flushInterval));
    }
  }

  // ── Flush a batch of dirty keys to the database ──────────────────
  async flushBatch() {
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      const item = await this.redis.rpop(this.dirtyQueue);
      if (!item) break;
      batch.push(JSON.parse(item));
    }

    if (batch.length === 0) return;
    console.log(\`[WriteBehind] Flushing \${batch.length} items to DB\`);

    for (const item of batch) {
      try {
        const value = await this.read(item.key);
        if (!value) continue;

        // Write to database (application-specific)
        await this.persistToDb(item.key, value);
      } catch (err) {
        // Retry or send to dead-letter queue
        if (item.retries < this.maxRetries) {
          item.retries++;
          await this.redis.lpush(this.dirtyQueue, JSON.stringify(item));
          console.warn(\`[WriteBehind] Retry \${item.retries}/\${this.maxRetries}: \${item.key}\`);
        } else {
          await this.redis.lpush(this.deadLetter, JSON.stringify({
            ...item,
            error: err.message,
            failedAt: Date.now(),
          }));
          console.error(\`[WriteBehind] Dead-lettered: \${item.key}\`);
        }
      }
    }
  }

  async persistToDb(key, value) {
    // Example: key = "analytics:page:home", value = { views: 1500 }
    const [, type, id] = key.split(':');
    if (type === 'page') {
      await this.db.query(
        'UPDATE page_analytics SET views=$1, updated_at=NOW() WHERE page_id=$2',
        [value.views, id]
      );
    }
  }
}

// ── Usage for high-frequency writes (analytics, counters) ──────────
const writeBehind = new WriteBehindCache(redis, db, {
  flushInterval: 3000,
  batchSize: 100,
  maxRetries: 3,
});
writeBehind.start();

// High-frequency page view counter — writes never hit DB directly
app.post('/api/analytics/pageview', async (req, res) => {
  const key = \`analytics:page:\${req.body.pageId}\`;
  const current = await writeBehind.read(key) || { views: 0 };
  current.views++;
  await writeBehind.write(key, current);
  res.status(204).end();
});`,
      explanation: "Write-behind is ideal for high-frequency, low-criticality writes like analytics counters, view counts, and activity logs. Writes go to Redis instantly (~0.5ms instead of ~10ms to DB), and a background loop flushes to the database in batches. The dead-letter queue captures writes that fail after max retries, so you can investigate and replay them later. In interviews, mention the trade-off: write-behind risks losing data if Redis crashes before flushing, so it's not suitable for financial transactions — use write-through for those.",
      order_index: 3,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 2: Load Balancing & Horizontal Scaling (3 examples)
  // ─────────────────────────────────────────────────────────────────────────
  'load-balancing-horizontal-scaling': [
    {
      title: "Consistent Hash Ring with Virtual Nodes",
      description: "A complete consistent hashing implementation for distributing cache keys or requests across nodes, with virtual nodes for even distribution and dynamic node addition/removal.",
      language: "javascript",
      code: `import crypto from 'crypto';

class ConsistentHashRing {
  constructor(virtualNodesPerServer = 150) {
    this.virtualNodesPerServer = virtualNodesPerServer;
    this.ring = new Map();      // hash → physical node
    this.sortedHashes = [];     // sorted list of ring positions
    this.nodes = new Set();     // track physical nodes
  }

  // ── Hash function (MD5 for uniform distribution) ─────────────────
  hash(key) {
    return parseInt(
      crypto.createHash('md5').update(key).digest('hex').slice(0, 8),
      16
    );
  }

  // ── Add a node with virtual replicas ─────────────────────────────
  addNode(node) {
    if (this.nodes.has(node)) return;
    this.nodes.add(node);

    for (let i = 0; i < this.virtualNodesPerServer; i++) {
      const virtualKey = \`\${node}#vn\${i}\`;
      const h = this.hash(virtualKey);
      this.ring.set(h, node);
      this.sortedHashes.push(h);
    }

    this.sortedHashes.sort((a, b) => a - b);
    console.log(\`[HashRing] Added \${node} (\${this.virtualNodesPerServer} vnodes). Total: \${this.nodes.size} nodes\`);
  }

  // ── Remove a node (only its keys are redistributed) ──────────────
  removeNode(node) {
    if (!this.nodes.has(node)) return;
    this.nodes.delete(node);

    for (let i = 0; i < this.virtualNodesPerServer; i++) {
      const virtualKey = \`\${node}#vn\${i}\`;
      const h = this.hash(virtualKey);
      this.ring.delete(h);
    }

    this.sortedHashes = this.sortedHashes.filter(h => this.ring.has(h));
    console.log(\`[HashRing] Removed \${node}. Total: \${this.nodes.size} nodes\`);
  }

  // ── Find the node responsible for a key ──────────────────────────
  getNode(key) {
    if (this.sortedHashes.length === 0) return null;

    const h = this.hash(key);

    // Binary search for the first ring position >= hash
    let low = 0, high = this.sortedHashes.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.sortedHashes[mid] < h) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    // Wrap around if we're past the last position
    const idx = this.sortedHashes[low] >= h ? low : 0;
    return this.ring.get(this.sortedHashes[idx]);
  }

  // ── Get distribution stats (verify evenness) ─────────────────────
  getDistribution(sampleKeys = 10000) {
    const counts = {};
    for (const node of this.nodes) counts[node] = 0;

    for (let i = 0; i < sampleKeys; i++) {
      const node = this.getNode(\`test-key-\${i}\`);
      counts[node]++;
    }

    const ideal = sampleKeys / this.nodes.size;
    for (const [node, count] of Object.entries(counts)) {
      const deviation = ((count - ideal) / ideal * 100).toFixed(1);
      console.log(\`  \${node}: \${count} keys (\${deviation > 0 ? '+' : ''}\${deviation}%)\`);
    }
    return counts;
  }
}

// ── Usage ───────────────────────────────────────────────────────────
const ring = new ConsistentHashRing(150);
ring.addNode('redis-1.example.com');
ring.addNode('redis-2.example.com');
ring.addNode('redis-3.example.com');

// Route cache keys to the correct Redis node
const node = ring.getNode('user:42:profile');
console.log(\`Key "user:42:profile" → \${node}\`);

// Adding a 4th node only moves ~25% of keys
ring.addNode('redis-4.example.com');
ring.getDistribution();`,
      explanation: "Consistent hashing is fundamental to distributed systems — used by Redis Cluster, DynamoDB, Cassandra, and CDNs. Virtual nodes (150 per server) ensure even key distribution even with few physical nodes. When a node is added, only ~1/N of keys are redistributed (instead of reshuffling everything). The binary search in getNode is O(log V) where V is total virtual nodes. In interviews, explain why naïve modular hashing (key % N) fails: adding one server redistributes almost every key, causing a cache avalanche.",
      order_index: 1,
    },
    {
      title: "Health-Aware Load Balancer with Weighted Least Connections",
      description: "A load balancer that combines server weights with real-time connection counts and periodic health checks to route traffic intelligently.",
      language: "javascript",
      code: `class HealthAwareLoadBalancer {
  constructor(options = {}) {
    this.servers = new Map();
    this.healthCheckInterval = options.healthCheckInterval || 10000;
    this.healthCheckPath = options.healthCheckPath || '/health/ready';
    this.maxFailures = options.maxFailures || 3;
    this.running = false;
  }

  // ── Register a backend server ────────────────────────────────────
  addServer(address, weight = 1) {
    this.servers.set(address, {
      address,
      weight,
      connections: 0,
      healthy: true,
      consecutiveFailures: 0,
      lastHealthCheck: null,
      responseTimeAvg: 0,
    });
  }

  // ── Weighted least-connections algorithm ─────────────────────────
  getServer() {
    let best = null;
    let bestScore = Infinity;

    for (const server of this.servers.values()) {
      if (!server.healthy) continue;

      // Score = active connections / weight (lower is better)
      // A server with weight=3 and 6 connections scores 2.0
      // A server with weight=1 and 3 connections scores 3.0
      const score = server.connections / server.weight;

      if (score < bestScore) {
        bestScore = score;
        best = server;
      }
    }

    if (!best) throw new Error('No healthy servers available');

    best.connections++;
    return best;
  }

  // ── Release a connection when request completes ──────────────────
  release(address, responseTime) {
    const server = this.servers.get(address);
    if (!server) return;

    server.connections = Math.max(0, server.connections - 1);

    // Exponential moving average of response time
    server.responseTimeAvg = server.responseTimeAvg === 0
      ? responseTime
      : server.responseTimeAvg * 0.7 + responseTime * 0.3;
  }

  // ── Health check loop ────────────────────────────────────────────
  start() {
    this.running = true;
    this.healthLoop();
  }

  stop() {
    this.running = false;
  }

  async healthLoop() {
    while (this.running) {
      await Promise.all(
        [...this.servers.values()].map(s => this.checkHealth(s))
      );
      await new Promise(r => setTimeout(r, this.healthCheckInterval));
    }
  }

  async checkHealth(server) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const start = Date.now();
      const response = await fetch(
        \`http://\${server.address}\${this.healthCheckPath}\`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (response.ok) {
        const wasUnhealthy = !server.healthy;
        server.healthy = true;
        server.consecutiveFailures = 0;
        server.lastHealthCheck = Date.now();

        if (wasUnhealthy) {
          console.log(\`[LB] Server \${server.address} is BACK online\`);
        }
      } else {
        this.markFailure(server);
      }
    } catch {
      this.markFailure(server);
    }
  }

  markFailure(server) {
    server.consecutiveFailures++;
    if (server.consecutiveFailures >= this.maxFailures) {
      server.healthy = false;
      server.connections = 0;
      console.warn(
        \`[LB] Server \${server.address} marked UNHEALTHY after \${this.maxFailures} consecutive failures\`
      );
    }
  }

  // ── Status overview ──────────────────────────────────────────────
  getStatus() {
    return [...this.servers.values()].map(s => ({
      address: s.address,
      healthy: s.healthy,
      connections: s.connections,
      weight: s.weight,
      avgResponseTime: Math.round(s.responseTimeAvg),
    }));
  }
}

// ── Usage ───────────────────────────────────────────────────────────
const lb = new HealthAwareLoadBalancer({
  healthCheckInterval: 10000,
  maxFailures: 3,
});

lb.addServer('10.0.1.1:3000', 3);  // powerful server
lb.addServer('10.0.1.2:3000', 2);  // medium server
lb.addServer('10.0.1.3:3000', 1);  // small server
lb.start();

// Route a request
async function handleRequest(req, res) {
  const server = lb.getServer();
  const start = Date.now();
  try {
    const result = await fetch(\`http://\${server.address}\${req.path}\`);
    lb.release(server.address, Date.now() - start);
    res.status(result.status).json(await result.json());
  } catch (err) {
    lb.release(server.address, Date.now() - start);
    lb.markFailure(server);
    res.status(502).json({ error: 'Bad Gateway' });
  }
}`,
      explanation: "This load balancer scores servers by (connections / weight) — a server with weight 3 can handle 3x the connections before being considered 'busier' than a weight-1 server. Health checks run in parallel every 10 seconds; after 3 consecutive failures a server is removed from rotation. The exponential moving average of response times can be used for advanced routing (avoid slow servers). In interviews, compare this to Nginx's 'least_conn' with 'weight' directives and explain why health checks need both liveness (is it running?) and readiness (can it serve?) probes.",
      order_index: 2,
    },
    {
      title: "Database Read/Write Splitting with Replication Lag Awareness",
      description: "A database router that directs writes to the primary and reads to replicas, with replication lag monitoring to avoid serving stale data.",
      language: "javascript",
      code: `import { Pool } from 'pg';

class ReplicaAwareDatabaseRouter {
  constructor(config) {
    // Primary (read-write)
    this.primary = new Pool({
      host: config.primaryHost,
      port: config.port || 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.primaryMaxConnections || 20,
    });

    // Read replicas
    this.replicas = config.replicaHosts.map(host => ({
      pool: new Pool({
        host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        password: config.password,
        max: config.replicaMaxConnections || 30,
      }),
      host,
      lagBytes: 0,
      healthy: true,
    }));

    this.replicaIndex = 0;
    this.maxAcceptableLag = config.maxAcceptableLag || 1048576; // 1MB

    // Monitor replication lag
    setInterval(() => this.checkReplicaLag(), 5000);
  }

  // ── Route writes to primary ──────────────────────────────────────
  async write(query, params) {
    return this.primary.query(query, params);
  }

  // ── Route reads to replicas (round-robin, skip unhealthy) ────────
  async read(query, params, options = {}) {
    // Force primary read if caller needs strong consistency
    if (options.fromPrimary) {
      return this.primary.query(query, params);
    }

    const healthy = this.replicas.filter(r => r.healthy);

    if (healthy.length === 0) {
      // Fallback to primary if all replicas are down
      console.warn('[DBRouter] All replicas unhealthy, reading from primary');
      return this.primary.query(query, params);
    }

    // Round-robin across healthy replicas
    const idx = this.replicaIndex % healthy.length;
    this.replicaIndex++;
    return healthy[idx].pool.query(query, params);
  }

  // ── Write then read from primary (avoid lag issues) ──────────────
  async writeAndRead(writeQuery, writeParams, readQuery, readParams) {
    await this.primary.query(writeQuery, writeParams);
    // Read from primary to avoid replication lag after write
    return this.primary.query(readQuery, readParams);
  }

  // ── Monitor replication lag on each replica ──────────────────────
  async checkReplicaLag() {
    for (const replica of this.replicas) {
      try {
        const { rows } = await replica.pool.query(\`
          SELECT CASE
            WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() THEN 0
            ELSE EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp())
          END AS lag_seconds,
          pg_wal_lsn_diff(
            pg_last_wal_receive_lsn(),
            pg_last_wal_replay_lsn()
          ) AS lag_bytes
        \`);

        replica.lagBytes = parseInt(rows[0]?.lag_bytes || '0');

        if (replica.lagBytes > this.maxAcceptableLag) {
          replica.healthy = false;
          console.warn(
            \`[DBRouter] Replica \${replica.host} lagging \${(replica.lagBytes / 1024).toFixed(0)}KB — removed from rotation\`
          );
        } else {
          replica.healthy = true;
        }
      } catch {
        replica.healthy = false;
        console.warn(\`[DBRouter] Replica \${replica.host} unreachable\`);
      }
    }
  }

  // ── Connection pool stats ────────────────────────────────────────
  getStats() {
    return {
      primary: {
        total: this.primary.totalCount,
        idle: this.primary.idleCount,
        waiting: this.primary.waitingCount,
      },
      replicas: this.replicas.map(r => ({
        host: r.host,
        healthy: r.healthy,
        lagBytes: r.lagBytes,
        total: r.pool.totalCount,
        idle: r.pool.idleCount,
      })),
    };
  }

  async close() {
    await this.primary.end();
    await Promise.all(this.replicas.map(r => r.pool.end()));
  }
}

// ── Usage ───────────────────────────────────────────────────────────
const db = new ReplicaAwareDatabaseRouter({
  primaryHost: 'db-primary.internal',
  replicaHosts: ['db-replica-1.internal', 'db-replica-2.internal'],
  database: 'myapp',
  user: 'app',
  password: process.env.DB_PASSWORD,
  maxAcceptableLag: 1048576, // 1MB — remove lagging replicas
});

// Reads go to replicas
const users = await db.read('SELECT * FROM users WHERE active = true');

// Writes go to primary
await db.write('INSERT INTO orders (user_id, total) VALUES ($1, $2)', [42, 99.99]);

// After write, read from primary to avoid stale data
const order = await db.writeAndRead(
  'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id',
  [42, 99.99],
  'SELECT * FROM orders WHERE id = $1',
  [newOrderId]
);`,
      explanation: "Read/write splitting is one of the first database scaling strategies. This router sends writes to the primary and distributes reads across replicas using round-robin. Replication lag monitoring (checking pg_wal_lsn_diff every 5s) automatically removes replicas that fall too far behind, preventing users from seeing stale data. The writeAndRead helper forces the read to hit the primary after a write, sidestepping the eventual-consistency window of async replication. In interviews, explain the CAP theorem trade-off: read replicas give availability and partition tolerance at the cost of strong consistency.",
      order_index: 3,
    },
  ],
};

export default examples;
