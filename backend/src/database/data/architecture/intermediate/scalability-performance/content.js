// ============================================================================
// Scalability & Performance — Content (ENHANCED)
// ============================================================================

export const topic = {
  "name": "Scalability & Performance",
  "slug": "scalability-performance",
  "description": "Design systems that scale with caching, load balancing, horizontal scaling, and performance optimization techniques.",
  "estimated_time": 200,
  "order_index": 3
};

export const lessons = [
  {
    title: "Caching Strategies",
    slug: "caching-strategies",
    summary: "Master caching patterns, invalidation strategies, eviction policies, and multi-layer caching to dramatically reduce latency and database load.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "Cache-aside (lazy loading) is the most common pattern — check cache first, fall back to DB, then populate cache on miss",
  "Read-through and write-through caches sit between app and DB, simplifying code but coupling to cache provider",
  "Write-behind (write-back) batches writes for throughput but risks data loss on cache failure",
  "TTL-based invalidation is simple but can serve stale data; event-based invalidation is precise but complex",
  "LRU eviction removes least-recently-used entries — ideal for most web workloads with temporal locality",
  "Cache stampede (thundering herd) occurs when many requests miss cache simultaneously — solve with locking or probabilistic early expiration",
  "Multi-layer caching (browser → CDN → application → database) reduces latency at every hop",
  "HTTP caching headers (Cache-Control, ETag, Last-Modified) let browsers and CDNs cache responses without application changes"
],
    content: `# Caching Strategies

## Why Caching Matters

Without caching, every request hits your database or compute layer. A single PostgreSQL query might take 5–50ms, but a Redis cache lookup takes **0.1–0.5ms** — a 10–100x improvement. At scale, this difference determines whether your system handles 100 req/s or 100,000 req/s.

\`\`\`
Without cache:   Client → Server → Database (50ms)
With cache:      Client → Server → Cache HIT (0.5ms)
                 Client → Server → Cache MISS → Database → Populate Cache (55ms, then fast)
\`\`\`

## Cache Types

### In-Memory Cache (Same Process)

\`\`\`javascript
// Node.js in-memory cache using Map with TTL
class InMemoryCache {
  constructor(defaultTTL = 60000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  invalidate(key) {
    this.cache.delete(key);
  }
}

const cache = new InMemoryCache(30000); // 30s default TTL
\`\`\`

**Pros:** Zero network latency, no external dependency.
**Cons:** Not shared across server instances, lost on restart, limited by process memory.

### Distributed Cache (Redis / Memcached)

Shared across all application instances. Redis is the de facto standard:

\`\`\`javascript
import Redis from 'ioredis';
const redis = new Redis({ host: 'redis-cluster', port: 6379 });

// String cache with TTL
await redis.set('user:123', JSON.stringify(user), 'EX', 3600); // 1 hour
const cached = await redis.get('user:123');

// Hash for structured data (no serialize/deserialize needed)
await redis.hset('product:456', { name: 'Widget', price: '29.99', stock: '150' });
const product = await redis.hgetall('product:456');

// Sorted set for leaderboards / ranked data
await redis.zadd('leaderboard', 9500, 'player:alice');
await redis.zadd('leaderboard', 8700, 'player:bob');
const top10 = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');

// Pub/Sub for cache invalidation across instances
const pub = new Redis();
const sub = new Redis();
sub.subscribe('cache:invalidate');
sub.on('message', (channel, msg) => {
  localCache.invalidate(JSON.parse(msg).key);
});
\`\`\`

### CDN Cache (Edge)

Content Delivery Networks cache static and dynamic content at edge locations worldwide:

\`\`\`
User in Tokyo → CDN Edge in Tokyo (2ms) ✅
User in Tokyo → Origin Server in Virginia (150ms) ❌
\`\`\`

### Browser Cache

Controlled via HTTP headers — the cheapest cache because it lives on the client device with zero network cost.

## Caching Patterns

### 1. Cache-Aside (Lazy Loading) — Most Common

The application manages the cache explicitly:

\`\`\`javascript
async function getUserById(userId) {
  // 1. Check cache first
  const cacheKey = \\\`user:\\\${userId}\\\`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // Cache HIT
  }

  // 2. Cache MISS — fetch from database
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

  // 3. Populate cache for next time
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
  }

  return user;
}
\`\`\`

**Pros:** Only caches what's actually requested; cache failure doesn't break app (just slower).
**Cons:** First request always slow (cold start); possible stale data between DB write and cache invalidation.

### 2. Read-Through Cache

The cache library handles fetching from the data source on a miss:

\`\`\`javascript
// Read-through — cache handles misses itself
class ReadThroughCache {
  constructor(redis, loader, ttl = 3600) {
    this.redis = redis;
    this.loader = loader; // function that fetches from DB
    this.ttl = ttl;
  }

  async get(key) {
    let value = await this.redis.get(key);
    if (!value) {
      value = await this.loader(key); // Cache fetches from DB internally
      await this.redis.set(key, JSON.stringify(value), 'EX', this.ttl);
      return value;
    }
    return JSON.parse(value);
  }
}

const userCache = new ReadThroughCache(redis, async (key) => {
  const id = key.split(':')[1];
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}, 3600);
\`\`\`

### 3. Write-Through Cache

Writes go to cache **and** database synchronously — the cache is always fresh:

\`\`\`javascript
async function updateUser(userId, data) {
  // Write to database first
  const { rows } = await db.query(
    'UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *',
    [data.name, data.email, userId]
  );

  // Write to cache immediately (synchronous with DB write)
  await redis.set(\\\`user:\\\${userId}\\\`, JSON.stringify(rows[0]), 'EX', 3600);

  return rows[0];
}
\`\`\`

**Pros:** Cache is never stale after writes.
**Cons:** Higher write latency (write to both); unused data may fill cache.

### 4. Write-Behind (Write-Back) Cache

Writes go to cache immediately, then asynchronously flushed to database in batches:

\`\`\`javascript
class WriteBehindCache {
  constructor(redis, flushFn, interval = 5000) {
    this.redis = redis;
    this.dirty = new Set();
    this.flushFn = flushFn;

    setInterval(() => this.flush(), interval);
  }

  async write(key, value) {
    await this.redis.set(key, JSON.stringify(value));
    this.dirty.add(key);
  }

  async flush() {
    const keys = [...this.dirty];
    this.dirty.clear();
    for (const key of keys) {
      const value = await this.redis.get(key);
      await this.flushFn(key, JSON.parse(value)); // Write to DB
    }
  }
}
\`\`\`

**Pros:** Extremely fast writes; batching reduces DB load.
**Cons:** Data loss risk if cache crashes before flush; eventual consistency only.

## Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

### TTL (Time-To-Live)

\`\`\`javascript
// Simple: data expires after a fixed time
await redis.set('config:feature-flags', JSON.stringify(flags), 'EX', 300); // 5 min

// Problem: stale data for up to 5 minutes after a change
\`\`\`

### Event-Based Invalidation

\`\`\`javascript
// When data changes, explicitly invalidate all related cache keys
async function updateProduct(productId, data) {
  await db.query('UPDATE products SET price=$1 WHERE id=$2', [data.price, productId]);

  // Invalidate all affected cache entries
  await redis.del(\\\`product:\\\${productId}\\\`);
  await redis.del(\\\`category:\\\${data.categoryId}:products\\\`);
  await redis.del('products:bestsellers');
}
\`\`\`

### Pub/Sub Invalidation (Multi-Instance)

\`\`\`javascript
// Publisher: when data changes, notify all instances
async function onProductUpdate(productId) {
  await redis.publish('cache:invalidate', JSON.stringify({
    type: 'product',
    id: productId,
  }));
}

// Subscriber: each app instance listens and clears local cache
const sub = new Redis();
sub.subscribe('cache:invalidate');
sub.on('message', (channel, message) => {
  const { type, id } = JSON.parse(message);
  localCache.invalidate(\\\`\\\${type}:\\\${id}\\\`);
});
\`\`\`

## Cache Eviction Policies

When cache memory is full, which entries to remove?

| Policy | Strategy | Best For |
|---|---|---|
| **LRU** (Least Recently Used) | Evict the entry not accessed for the longest time | General web workloads — temporal locality |
| **LFU** (Least Frequently Used) | Evict the entry accessed fewest overall times | Hot/cold data with stable popularity |
| **FIFO** (First In, First Out) | Evict oldest entry regardless of access | Simple, predictable eviction |
| **Random** | Evict a random entry | When access patterns are uniform |
| **TTL-based** | Evict expired entries first | When data has natural expiration |

Redis supports \\\`maxmemory-policy\\\`: \\\`allkeys-lru\\\`, \\\`volatile-lru\\\`, \\\`allkeys-lfu\\\`, \\\`noeviction\\\`, etc.

\`\`\`
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
\`\`\`

## Cache Stampede / Thundering Herd

When a popular cache key expires, hundreds of concurrent requests all see a cache miss and all query the database simultaneously:

\`\`\`
Time 0:  Key "homepage" expires
Time 0:  200 requests arrive → all see MISS → all query DB → DB overloaded
\`\`\`

### Solution 1: Mutex Lock

\`\`\`javascript
async function getWithLock(key, fetchFn, ttl = 3600) {
  let value = await redis.get(key);
  if (value) return JSON.parse(value);

  // Try to acquire a lock (NX = only if not exists)
  const lockKey = \\\`lock:\\\${key}\\\`;
  const acquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');

  if (acquired) {
    // Winner: fetch data and populate cache
    value = await fetchFn();
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    await redis.del(lockKey);
    return value;
  } else {
    // Loser: wait briefly and retry
    await new Promise(r => setTimeout(r, 100));
    return getWithLock(key, fetchFn, ttl);
  }
}
\`\`\`

### Solution 2: Probabilistic Early Expiration

Randomly refresh cache before it actually expires to spread the load:

\`\`\`javascript
async function getWithEarlyExpiry(key, fetchFn, ttl = 3600) {
  const data = await redis.get(key);
  const remainingTTL = await redis.ttl(key);

  // Probabilistically refresh when TTL is low
  const shouldRefresh = remainingTTL > 0 && remainingTTL < ttl * 0.1
    && Math.random() < 0.2; // 20% chance when less than 10% TTL remaining

  if (!data || shouldRefresh) {
    const value = await fetchFn();
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    return value;
  }

  return JSON.parse(data);
}
\`\`\`

## Multi-Layer Caching

\`\`\`
Request Flow:
  Browser Cache (0ms) — Cache-Control headers
    ↓ MISS
  CDN Edge (2–10ms) — Cloudflare / CloudFront
    ↓ MISS
  Application Cache (0.5ms) — In-process Map or local Redis
    ↓ MISS
  Distributed Cache (1–5ms) — Redis cluster
    ↓ MISS
  Database (5–50ms) — PostgreSQL
\`\`\`

## HTTP Caching Headers

\`\`\`javascript
// Express.js HTTP caching
app.get('/api/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);

  // Cache-Control: browser caches 60s, CDN caches 300s
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300');

  // ETag for conditional requests
  const etag = crypto.createHash('md5')
    .update(JSON.stringify(product)).digest('hex');
  res.set('ETag', \\\`"\\\${etag}"\\\`);

  // If client sends If-None-Match and ETag matches → 304
  if (req.headers['if-none-match'] === \\\`"\\\${etag}"\\\`) {
    return res.status(304).end(); // Not Modified — no body sent
  }

  res.json(product);
});

// Static assets: cache for 1 year (use content hash in filename)
app.use('/assets', express.static('public', {
  maxAge: '1y',
  immutable: true, // Won't change — use versioned filenames
}));
\`\`\`

| Header | Purpose | Example |
|---|---|---|
| \\\`Cache-Control\\\` | Who can cache & for how long | \\\`public, max-age=3600\\\` |
| \\\`ETag\\\` | Content fingerprint for conditional requests | \\\`"a1b2c3d4"\\\` |
| \\\`Last-Modified\\\` | Timestamp for conditional requests | \\\`Wed, 15 Jan 2025 08:00:00 GMT\\\` |
| \\\`Vary\\\` | Which request headers affect the cached response | \\\`Vary: Accept-Encoding\\\` |

## CDN Caching Best Practices

\`\`\`
Static assets (JS, CSS, images):
  Cache-Control: public, max-age=31536000, immutable
  → Cache for 1 year, bust via content hash in filename

API responses (product list):
  Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=30
  → Browser: 1 min, CDN: 5 min, serve stale for 30s while revalidating

User-specific data (profile, cart):
  Cache-Control: private, no-cache
  → Never cached by CDN, browser always revalidates
\`\`\`

## Interview Checklist

1. **When to cache**: Read-heavy data that doesn't change frequently
2. **Where to cache**: As close to the client as possible (browser > CDN > app > distributed)
3. **How to invalidate**: TTL for simplicity, event-based for precision
4. **Cache key design**: Include all parameters that affect the response (\\\`user:123:locale:en\\\`)
5. **Failure mode**: What happens when cache is down? (Graceful degradation to DB)
`,
  },
  {
    title: "Load Balancing & Horizontal Scaling",
    slug: "load-balancing-horizontal-scaling",
    summary: "Scale systems horizontally with load balancing algorithms, auto-scaling, database replication, sharding, and stateless service design.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 2,
    key_points: [
  "Vertical scaling (bigger machine) has hard limits; horizontal scaling (more machines) scales linearly",
  "Round-robin distributes evenly but ignores server load; least-connections adapts to real-time capacity",
  "Consistent hashing minimizes key redistribution when nodes are added/removed — critical for caches",
  "L4 load balancers route by IP/port (fast, protocol-agnostic); L7 route by HTTP content (flexible, path-based routing)",
  "Sticky sessions pin users to one server — simple but breaks horizontal scaling benefits",
  "Stateless services store no session data in-process — any instance can handle any request",
  "Database horizontal scaling uses read replicas for reads, sharding for writes, and connection pooling to manage connections",
  "Health checks (liveness + readiness) let load balancers route traffic only to healthy instances"
],
    content: `# Load Balancing & Horizontal Scaling

## Vertical vs. Horizontal Scaling

| Aspect | Vertical (Scale Up) | Horizontal (Scale Out) |
|---|---|---|
| Approach | Bigger machine (more CPU, RAM) | More machines |
| Cost | Exponential (2x CPU ≠ 2x price) | Linear (2x servers ≈ 2x price) |
| Limit | Hardware ceiling (largest server) | Practically unlimited |
| Downtime | Usually requires restart | Zero downtime (add instances) |
| Complexity | Simple (same code) | Complex (distributed systems) |
| Failure | Single point of failure | Redundant — one node down, others continue |

\`\`\`
Vertical:   [ Server 32 CPU, 256GB RAM ] ← single beefy machine
Horizontal: [ Server A ] [ Server B ] [ Server C ] ← many small machines
                    ↑           ↑           ↑
                    └─────── Load Balancer ──┘
\`\`\`

**Interview rule of thumb:** Start vertical (simple), go horizontal when you hit limits or need high availability.

## Load Balancing Algorithms

### Round-Robin

Requests distributed evenly in rotation:

\`\`\`javascript
class RoundRobinBalancer {
  constructor(servers) {
    this.servers = servers;
    this.current = 0;
  }

  getNext() {
    const server = this.servers[this.current];
    this.current = (this.current + 1) % this.servers.length;
    return server;
  }
}

const lb = new RoundRobinBalancer(['10.0.0.1', '10.0.0.2', '10.0.0.3']);
// Request 1 → .1, Request 2 → .2, Request 3 → .3, Request 4 → .1 ...
\`\`\`

**Pros:** Simple, fair distribution.
**Cons:** Ignores server capacity — a slow server gets the same traffic as a fast one.

### Weighted Round-Robin

Servers with more capacity get proportionally more traffic:

\`\`\`javascript
class WeightedRoundRobin {
  constructor(servers) {
    // servers = [{ address: '10.0.0.1', weight: 5 }, { address: '10.0.0.2', weight: 3 }]
    this.pool = [];
    servers.forEach(s => {
      for (let i = 0; i < s.weight; i++) this.pool.push(s.address);
    });
    this.current = 0;
  }

  getNext() {
    const server = this.pool[this.current];
    this.current = (this.current + 1) % this.pool.length;
    return server;
  }
}
// weight=5 server gets 5 out of every 8 requests
\`\`\`

### Least Connections

Route to the server with the fewest active connections:

\`\`\`javascript
class LeastConnectionsBalancer {
  constructor(servers) {
    this.servers = servers.map(addr => ({ address: addr, connections: 0 }));
  }

  getNext() {
    const server = this.servers.reduce((min, s) =>
      s.connections < min.connections ? s : min
    );
    server.connections++;
    return server;
  }

  release(address) {
    const server = this.servers.find(s => s.address === address);
    if (server) server.connections--;
  }
}
\`\`\`

**Best for:** Requests with variable processing time (some fast, some slow).

### IP Hash

Hash the client IP so the same client always reaches the same server:

\`\`\`javascript
function ipHash(clientIP, servers) {
  let hash = 0;
  for (const char of clientIP) {
    hash = (hash * 31 + char.charCodeAt(0)) & 0x7fffffff;
  }
  return servers[hash % servers.length];
}
\`\`\`

### Consistent Hashing

Minimizes key redistribution when servers are added or removed — essential for distributed caches:

\`\`\`javascript
class ConsistentHashRing {
  constructor(nodes, virtualNodes = 150) {
    this.ring = new Map();
    this.sortedKeys = [];
    nodes.forEach(node => this.addNode(node, virtualNodes));
  }

  hash(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = ((h << 5) - h + key.charCodeAt(i)) & 0xffffffff;
    }
    return h >>> 0;
  }

  addNode(node, virtualNodes = 150) {
    for (let i = 0; i < virtualNodes; i++) {
      const vKey = this.hash(\\\`\\\${node}:\\\${i}\\\`);
      this.ring.set(vKey, node);
      this.sortedKeys.push(vKey);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  getNode(key) {
    const hash = this.hash(key);
    for (const ringKey of this.sortedKeys) {
      if (hash <= ringKey) return this.ring.get(ringKey);
    }
    return this.ring.get(this.sortedKeys[0]); // Wrap around
  }
}

// Adding a 4th node only redistributes ~25% of keys (1/N), not all
\`\`\`

## L4 vs L7 Load Balancing

| Feature | L4 (Transport Layer) | L7 (Application Layer) |
|---|---|---|
| Operates on | TCP/UDP packets | HTTP requests |
| Speed | Very fast (no payload inspection) | Slower (parses headers, body) |
| Routing decisions | IP, port, protocol | URL path, headers, cookies, body |
| SSL termination | Pass-through or terminate | Typically terminates |
| Use case | Database connections, non-HTTP | API routing, microservices |

\`\`\`nginx
# L7 Load Balancing — Nginx path-based routing
upstream api_servers {
    least_conn;
    server 10.0.1.1:3000 weight=3;
    server 10.0.1.2:3000 weight=2;
    server 10.0.1.3:3000;
}

upstream static_servers {
    server 10.0.2.1:80;
    server 10.0.2.2:80;
}

server {
    listen 80;

    # Route API traffic to API server pool
    location /api/ {
        proxy_pass http://api_servers;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Route static content to static server pool
    location /static/ {
        proxy_pass http://static_servers;
        proxy_cache_valid 200 1h;
    }
}
\`\`\`

## Session Persistence (Sticky Sessions)

\`\`\`nginx
# Nginx sticky sessions via IP hash
upstream backend {
    ip_hash;  # Same client IP → same server every time
    server 10.0.1.1:3000;
    server 10.0.1.2:3000;
}

# Better: sticky cookie (not built-in, requires nginx-sticky-module)
upstream backend_cookie {
    server 10.0.1.1:3000;
    server 10.0.1.2:3000;
    sticky cookie srv_id expires=1h;
}
\`\`\`

**Problem:** Sticky sessions create uneven load and a single point of failure. **Prefer stateless services.**

## Stateless Service Design

\`\`\`javascript
// ❌ Stateful: session stored in server memory
app.post('/login', (req, res) => {
  req.session.userId = user.id;     // In THIS server's memory
  req.session.cart = [];             // Lost if next request goes to another server
});

// ✅ Stateless with JWT: any server can verify the token
app.post('/login', async (req, res) => {
  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' });
  res.json({ token }); // Client sends token with every request
});

// ✅ Stateless with shared session store
const RedisStore = require('connect-redis').default;
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'keyboard-cat',
  resave: false,
  saveUninitialized: false,
}));
// All servers share session data via Redis
\`\`\`

## Health Checks

\`\`\`javascript
// Liveness: is the process running?
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness: can this instance actually serve traffic?
app.get('/health/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');       // DB reachable?
    await redis.ping();               // Cache reachable?
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});
\`\`\`

\`\`\`nginx
# Nginx health checks — passive
upstream backend {
    server 10.0.1.1:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.2:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.3:3000 max_fails=3 fail_timeout=30s;
}
\`\`\`

## Auto-Scaling

\`\`\`yaml
# Kubernetes Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
\`\`\`

**Scaling triggers:** CPU > 70%, memory > 80%, request queue depth, custom metrics (p99 latency, error rate).

## Database Scaling

### Read Replicas

\`\`\`javascript
// Route reads to replicas, writes to primary
class DatabaseRouter {
  constructor(primary, replicas) {
    this.primary = primary;
    this.replicas = replicas;
    this.replicaIndex = 0;
  }

  async read(query, params) {
    const replica = this.replicas[this.replicaIndex];
    this.replicaIndex = (this.replicaIndex + 1) % this.replicas.length;
    return replica.query(query, params);
  }

  async write(query, params) {
    return this.primary.query(query, params); // All writes to primary
  }
}
\`\`\`

### Sharding

Partition data across multiple databases by a shard key:

\`\`\`javascript
class ShardRouter {
  constructor(shards) {
    this.shards = shards; // Array of database pools
  }

  getShard(userId) {
    return this.shards[userId % this.shards.length];
  }

  async getUser(userId) {
    const shard = this.getShard(userId);
    return shard.query('SELECT * FROM users WHERE id = $1', [userId]);
  }

  async createOrder(userId, order) {
    const shard = this.getShard(userId);
    return shard.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2)',
      [userId, order.total]
    );
  }
}

// Shard 0: users 0, 3, 6, 9 ...
// Shard 1: users 1, 4, 7, 10 ...
// Shard 2: users 2, 5, 8, 11 ...
\`\`\`

### Connection Pooling

\`\`\`javascript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'db.example.com',
  max: 20,               // Max connections in pool
  min: 5,                // Keep at least 5 idle connections ready
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Connection borrowed from pool, used, then returned automatically
const result = await pool.query('SELECT * FROM users WHERE id = $1', [123]);
\`\`\`

## Service Discovery

\`\`\`javascript
// Consul-based service discovery
const Consul = require('consul');
const consul = new Consul({ host: '10.0.0.1' });

// Register this instance on startup
await consul.agent.service.register({
  name: 'user-service',
  address: '10.0.1.5',
  port: 3000,
  check: {
    http: 'http://10.0.1.5:3000/health/ready',
    interval: '10s',
  },
});

// Discover all healthy instances of a service
const { 0: services } = await consul.health.service({
  service: 'user-service',
  passing: true,
});

const instances = services.map(s => ({
  address: s.Service.Address,
  port: s.Service.Port,
}));
\`\`\`

## Load Balancer Comparison

| Feature | Nginx | HAProxy | AWS ALB | Cloud LB (GCP) |
|---|---|---|---|---|
| Layer | L4 + L7 | L4 + L7 | L7 only | L4 + L7 |
| SSL Termination | Yes | Yes | Yes | Yes |
| WebSocket | Yes | Yes | Yes | Yes |
| Auto-scaling | No (manual) | No (manual) | Yes | Yes |
| Cost | Free / self-hosted | Free / self-hosted | Pay per use | Pay per use |
| Config | File-based | File-based | Console / API | Console / API |

## Interview Checklist

1. **Why horizontal?** Eliminates single points of failure, scales linearly, zero-downtime deploys
2. **Algorithm choice:** Round-robin for uniform workloads, least-connections for variable, consistent hashing for caches
3. **Stateless design:** Sessions in Redis/JWT, never in server memory
4. **Database scaling:** Read replicas first (easy), sharding when replicas aren't enough (complex)
5. **Health checks:** Liveness (is it alive?) vs. readiness (can it serve traffic?)
`,
  },
];
