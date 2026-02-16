const examples = {
  "design-url-shortener": [
    {
      title: "URL Shortening Service with Base62 Encoding",
      description:
        "A complete URL shortening service that uses a counter-based approach with Base62 encoding to generate short URLs. Includes in-memory storage, collision-free key generation, and redirect handling with analytics tracking.",
      language: "javascript",
      code: `// ============================================================
// URL Shortening Service with Base62 Encoding
// ============================================================
// Demonstrates: Counter-based ID generation, Base62 encoding,
// redirect handling (301 vs 302), and basic analytics.

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

class Base62Encoder {
  /**
   * Encode a numeric ID into a Base62 string.
   * 7 characters gives us 62^7 ≈ 3.5 trillion unique URLs.
   */
  static encode(num, minLength = 7) {
    if (num === 0) return BASE62_CHARS[0].padStart(minLength, '0');

    let encoded = '';
    while (num > 0) {
      encoded = BASE62_CHARS[num % 62] + encoded;
      num = Math.floor(num / 62);
    }

    // Pad to minimum length for consistent URL lengths
    return encoded.padStart(minLength, '0');
  }

  /**
   * Decode a Base62 string back to a numeric ID.
   */
  static decode(str) {
    let num = 0;
    for (const char of str) {
      num = num * 62 + BASE62_CHARS.indexOf(char);
    }
    return num;
  }
}

class URLShortener {
  constructor(baseUrl = 'https://short.ly') {
    this.baseUrl = baseUrl;
    this.counter = 100000;             // Starting counter (avoid short codes)
    this.urlStore = new Map();          // short_key → { longUrl, createdAt, clickCount, ... }
    this.reverseIndex = new Map();     // longUrl → short_key (for deduplication)
    this.analytics = new Map();        // short_key → [{ timestamp, ip, referrer, ... }]
  }

  /**
   * Create a shortened URL.
   * Supports optional custom aliases and expiration.
   */
  shorten(longUrl, options = {}) {
    const { customAlias, expiresIn, userId } = options;

    // Validate URL
    try {
      new URL(longUrl);
    } catch {
      throw new Error('Invalid URL provided');
    }

    // Deduplication: return existing short URL if long URL was already shortened
    if (!customAlias && this.reverseIndex.has(longUrl)) {
      const existingKey = this.reverseIndex.get(longUrl);
      return { shortUrl: this.baseUrl + '/' + existingKey, key: existingKey, reused: true };
    }

    // Generate or validate the short key
    let shortKey;
    if (customAlias) {
      if (this.urlStore.has(customAlias)) {
        throw new Error('Custom alias already taken: ' + customAlias);
      }
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(customAlias)) {
        throw new Error('Custom alias must be 3-20 alphanumeric characters');
      }
      shortKey = customAlias;
    } else {
      // Counter-based generation with Base62 encoding
      this.counter++;
      shortKey = Base62Encoder.encode(this.counter);
    }

    // Calculate expiration
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // Store the mapping
    const record = {
      longUrl,
      shortKey,
      userId: userId || null,
      createdAt: new Date(),
      expiresAt,
      clickCount: 0,
    };

    this.urlStore.set(shortKey, record);
    this.reverseIndex.set(longUrl, shortKey);
    this.analytics.set(shortKey, []);

    return {
      shortUrl: this.baseUrl + '/' + shortKey,
      key: shortKey,
      expiresAt: record.expiresAt,
      reused: false,
    };
  }

  /**
   * Resolve a short key to the original URL.
   * Returns redirect info including the recommended status code.
   */
  resolve(shortKey, requestMeta = {}) {
    const record = this.urlStore.get(shortKey);

    if (!record) {
      return { found: false, error: 'Short URL not found' };
    }

    // Check expiration
    if (record.expiresAt && new Date() > record.expiresAt) {
      this.urlStore.delete(shortKey);
      this.reverseIndex.delete(record.longUrl);
      return { found: false, error: 'Short URL has expired' };
    }

    // Track analytics asynchronously (simulated)
    record.clickCount++;
    this.analytics.get(shortKey).push({
      timestamp: new Date(),
      ip: requestMeta.ip || 'unknown',
      referrer: requestMeta.referrer || 'direct',
      userAgent: requestMeta.userAgent || 'unknown',
    });

    return {
      found: true,
      longUrl: record.longUrl,
      // Use 302 to ensure every click is tracked;
      // Use 301 if analytics aren't needed (browser caches the redirect)
      statusCode: 302,
    };
  }

  /**
   * Get analytics for a short URL.
   */
  getStats(shortKey) {
    const record = this.urlStore.get(shortKey);
    if (!record) return null;

    const clicks = this.analytics.get(shortKey) || [];
    return {
      shortKey,
      longUrl: record.longUrl,
      createdAt: record.createdAt,
      totalClicks: record.clickCount,
      recentClicks: clicks.slice(-10),
    };
  }
}

// --- Usage Demo ---
const shortener = new URLShortener('https://short.ly');

// Shorten a URL
const result1 = shortener.shorten('https://www.example.com/very/long/path?param=value');
console.log('Shortened:', result1);
// { shortUrl: 'https://short.ly/00019Gx', key: '00019Gx', ... }

// Deduplication: same long URL returns the same short URL
const result2 = shortener.shorten('https://www.example.com/very/long/path?param=value');
console.log('Deduplicated:', result2.reused); // true

// Custom alias
const result3 = shortener.shorten('https://docs.example.com', { customAlias: 'my-docs' });
console.log('Custom:', result3.shortUrl); // https://short.ly/my-docs

// Resolve and redirect
const redirect = shortener.resolve('00019Gx', { ip: '203.0.113.1', referrer: 'google.com' });
console.log('Redirect:', redirect);
// { found: true, longUrl: '...', statusCode: 302 }

// Get analytics
const stats = shortener.getStats('00019Gx');
console.log('Stats:', stats);`,
      explanation:
        "This example implements the core URL shortening service using a counter-based approach with Base62 encoding. Key design decisions illustrated: (1) Counter-based IDs guarantee no collisions without database lookups. (2) Base62 encoding produces compact, URL-safe short keys. (3) A reverse index enables deduplication — the same long URL always maps to the same short key. (4) 302 redirects are used so the server sees every click for analytics. (5) Expiration support via TTL. In a production system, the counter would be managed by Zookeeper or a distributed sequence generator, and the store would be a sharded database.",
      order_index: 1,
    },
    {
      title: "Pre-Generated Key Service (KGS) with Batch Allocation",
      description:
        "Implementation of a Key Generation Service that pre-generates unique short keys in bulk, allocates them in batches to application servers, and handles key recycling. This is the most robust strategy for high-throughput URL shorteners.",
      language: "javascript",
      code: `// ============================================================
// Pre-Generated Key Service (KGS) with Batch Allocation
// ============================================================
// Demonstrates: Bulk key pre-generation, atomic batch allocation,
// key recycling, and distributed coordination.

const crypto = require('crypto');

class KeyGenerationService {
  constructor(keyLength = 7) {
    this.keyLength = keyLength;
    this.freeKeys = [];           // Pool of available keys
    this.usedKeys = new Set();    // Track used keys for uniqueness
    this.allocatedBatches = new Map(); // serverId → [keys]
    this.batchSize = 1000;        // Keys per batch allocation
    this.lowWaterMark = 10000;    // Trigger regeneration when pool drops below this
    this.isGenerating = false;
  }

  /**
   * Pre-generate a batch of unique random keys.
   * In production, this runs as a background job.
   */
  async generateKeys(count = 100000) {
    if (this.isGenerating) {
      console.log('[KGS] Key generation already in progress...');
      return;
    }

    this.isGenerating = true;
    console.log('[KGS] Generating ' + count + ' new keys...');
    const startTime = Date.now();
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let generated = 0;

    while (generated < count) {
      // Generate cryptographically random key
      const bytes = crypto.randomBytes(this.keyLength);
      let key = '';
      for (let i = 0; i < this.keyLength; i++) {
        key += chars[bytes[i] % 62];
      }

      // Ensure uniqueness
      if (!this.usedKeys.has(key) && !this.freeKeys.includes(key)) {
        this.freeKeys.push(key);
        generated++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log('[KGS] Generated ' + generated + ' keys in ' + elapsed + 'ms');
    console.log('[KGS] Free pool size: ' + this.freeKeys.length);
    this.isGenerating = false;
  }

  /**
   * Allocate a batch of keys to an application server.
   * This is an atomic operation — once allocated, keys are
   * reserved for that server and removed from the free pool.
   */
  allocateBatch(serverId) {
    if (this.freeKeys.length < this.batchSize) {
      throw new Error('Insufficient keys in pool. Trigger regeneration.');
    }

    // Atomic batch extraction
    const batch = this.freeKeys.splice(0, this.batchSize);

    // Track which server has which keys
    if (!this.allocatedBatches.has(serverId)) {
      this.allocatedBatches.set(serverId, []);
    }
    this.allocatedBatches.get(serverId).push(...batch);

    console.log('[KGS] Allocated ' + batch.length + ' keys to server ' + serverId);
    console.log('[KGS] Remaining free keys: ' + this.freeKeys.length);

    // Check if we need to trigger background regeneration
    if (this.freeKeys.length < this.lowWaterMark) {
      console.log('[KGS] Low water mark reached! Triggering background regeneration...');
      this.generateKeys(100000); // async, non-blocking
    }

    return batch;
  }

  /**
   * Mark a key as used (called when a URL is actually created).
   */
  markUsed(key) {
    this.usedKeys.add(key);
  }

  /**
   * Recycle keys from a crashed/decommissioned server.
   * Keys that were allocated but never used are returned to the pool.
   */
  recycleKeys(serverId, unusedKeys) {
    const recycled = unusedKeys.filter(key => !this.usedKeys.has(key));
    this.freeKeys.push(...recycled);

    // Clean up allocation tracking
    this.allocatedBatches.delete(serverId);

    console.log('[KGS] Recycled ' + recycled.length + ' keys from server ' + serverId);
    return recycled.length;
  }

  /**
   * Get the current status of the KGS.
   */
  getStatus() {
    return {
      freeKeys: this.freeKeys.length,
      usedKeys: this.usedKeys.size,
      allocatedServers: this.allocatedBatches.size,
      totalAllocated: Array.from(this.allocatedBatches.values())
        .reduce((sum, batch) => sum + batch.length, 0),
      isGenerating: this.isGenerating,
    };
  }
}

/**
 * Application server that uses KGS for zero-collision URL shortening.
 */
class AppServer {
  constructor(serverId, kgs) {
    this.serverId = serverId;
    this.kgs = kgs;
    this.localKeyPool = [];      // Local batch of pre-allocated keys
    this.urlStore = new Map();
  }

  /**
   * Refill local key pool from KGS.
   */
  refillKeys() {
    const batch = this.kgs.allocateBatch(this.serverId);
    this.localKeyPool.push(...batch);
    console.log('[Server ' + this.serverId + '] Refilled with ' + batch.length + ' keys. Local pool: ' + this.localKeyPool.length);
  }

  /**
   * Create a short URL using a pre-generated key.
   * O(1) — no collision checking needed!
   */
  shortenUrl(longUrl) {
    // Refill if running low
    if (this.localKeyPool.length < 100) {
      this.refillKeys();
    }

    // Pop a key from the local pool — guaranteed unique
    const shortKey = this.localKeyPool.shift();
    this.kgs.markUsed(shortKey);

    this.urlStore.set(shortKey, {
      longUrl,
      createdAt: new Date(),
    });

    return { shortKey, shortUrl: 'https://short.ly/' + shortKey };
  }
}

// --- Demonstration ---
async function demo() {
  const kgs = new KeyGenerationService(7);

  // Pre-generate keys (background job in production)
  await kgs.generateKeys(50000);

  // Simulate two application servers
  const server1 = new AppServer('app-server-1', kgs);
  const server2 = new AppServer('app-server-2', kgs);

  // Each server gets its own batch — no coordination needed for writes
  server1.refillKeys();
  server2.refillKeys();

  // Both servers can create URLs concurrently with ZERO collision risk
  const url1 = server1.shortenUrl('https://example.com/page1');
  const url2 = server2.shortenUrl('https://example.com/page2');
  const url3 = server1.shortenUrl('https://example.com/page3');

  console.log('\\nURL 1:', url1);
  console.log('URL 2:', url2);
  console.log('URL 3:', url3);

  // Simulate server crash — recycle unused keys
  console.log('\\nSimulating server-2 crash...');
  const unusedKeys = server2.localKeyPool;
  kgs.recycleKeys('app-server-2', unusedKeys);

  console.log('\\nKGS Status:', kgs.getStatus());
}

demo();`,
      explanation:
        "The Key Generation Service (KGS) is the recommended approach for production URL shorteners. Key design principles: (1) Keys are pre-generated in bulk by a background process, eliminating collision risk entirely. (2) Batch allocation gives each app server a local pool of keys — no coordination needed during URL creation (O(1) per write). (3) The low-water-mark triggers proactive regeneration before the pool is exhausted. (4) Key recycling handles server crashes — allocated but unused keys are returned to the free pool. (5) In production, the KGS would use a database (e.g., two tables: free_keys and used_keys) with row-level locking for atomic batch extraction.",
      order_index: 2,
    },
    {
      title: "Caching Layer with LRU and Cache-Aside Pattern",
      description:
        "A caching layer for the URL shortener using the Cache-Aside pattern with LRU eviction. Demonstrates cache hit/miss handling, TTL-based expiration, write-through invalidation, and cache performance monitoring.",
      language: "javascript",
      code: `// ============================================================
// Caching Layer with LRU Eviction & Cache-Aside Pattern
// ============================================================
// Demonstrates: Cache-aside reads, write-through invalidation,
// TTL expiration, LRU eviction, and performance monitoring.

class LRUCache {
  constructor(capacity, defaultTTL = 86400) {
    this.capacity = capacity;
    this.defaultTTL = defaultTTL * 1000; // Convert to ms
    this.cache = new Map();              // Maintains insertion order
    this.stats = { hits: 0, misses: 0, evictions: 0, expirations: 0 };
  }

  /**
   * Get a value from the cache.
   * Returns null on miss or expiration.
   * Moves accessed item to the end (most recently used).
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const entry = this.cache.get(key);

    // Check TTL expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    // Move to end (most recently used) — Map maintains insertion order
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Put a value into the cache with optional TTL.
   * Evicts the LRU entry if at capacity.
   */
  put(key, value, ttlSeconds) {
    // If key exists, delete first (will be re-inserted at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict LRU entry if at capacity
    if (this.cache.size >= this.capacity) {
      const lruKey = this.cache.keys().next().value; // First item = LRU
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      cachedAt: Date.now(),
    });
  }

  /**
   * Invalidate (delete) a cache entry.
   */
  invalidate(key) {
    return this.cache.delete(key);
  }

  /**
   * Get cache performance metrics.
   */
  getMetrics() {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      capacity: this.capacity,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A',
      ...this.stats,
    };
  }
}

/**
 * URL Repository with Cache-Aside Pattern.
 * Wraps the database layer with transparent caching.
 */
class CachedURLRepository {
  constructor(cacheCapacity = 10000) {
    this.cache = new LRUCache(cacheCapacity);
    this.db = new Map(); // Simulated database

    // Simulate database latency
    this.dbLatencyMs = 5;
    this.cacheLatencyMs = 0.1;
  }

  /**
   * Simulate database read with latency.
   */
  async _dbRead(key) {
    await new Promise(resolve => setTimeout(resolve, this.dbLatencyMs));
    return this.db.get(key) || null;
  }

  /**
   * Simulate database write with latency.
   */
  async _dbWrite(key, value) {
    await new Promise(resolve => setTimeout(resolve, this.dbLatencyMs));
    this.db.set(key, value);
  }

  /**
   * CACHE-ASIDE READ PATTERN:
   * 1. Check cache first (fast path)
   * 2. On miss, query database (slow path)
   * 3. Populate cache with the result
   */
  async resolve(shortKey) {
    const startTime = performance.now();

    // Step 1: Check cache
    const cached = this.cache.get(shortKey);
    if (cached) {
      const latency = (performance.now() - startTime).toFixed(3);
      return {
        ...cached,
        source: 'cache',
        latencyMs: parseFloat(latency),
      };
    }

    // Step 2: Cache miss — query database
    const dbResult = await this._dbRead(shortKey);
    if (!dbResult) {
      return null; // URL not found anywhere
    }

    // Step 3: Populate cache for future reads
    // Use shorter TTL for URLs that expire soon
    const ttl = dbResult.expiresAt
      ? Math.max(0, (dbResult.expiresAt - Date.now()) / 1000)
      : 86400; // 24 hours default

    this.cache.put(shortKey, dbResult, ttl);

    const latency = (performance.now() - startTime).toFixed(3);
    return {
      ...dbResult,
      source: 'database',
      latencyMs: parseFloat(latency),
    };
  }

  /**
   * WRITE-THROUGH PATTERN:
   * 1. Write to database (source of truth)
   * 2. Invalidate cache entry (or update it)
   */
  async create(shortKey, longUrl, options = {}) {
    const record = {
      longUrl,
      shortKey,
      createdAt: new Date(),
      expiresAt: options.expiresIn
        ? new Date(Date.now() + options.expiresIn * 1000)
        : null,
      clickCount: 0,
    };

    // Write to DB first (source of truth)
    await this._dbWrite(shortKey, record);

    // Optionally warm the cache immediately
    // (write-through: good for URLs likely to be accessed soon)
    this.cache.put(shortKey, record);

    return record;
  }

  /**
   * Delete a URL — invalidate cache AND delete from DB.
   */
  async delete(shortKey) {
    this.cache.invalidate(shortKey);
    this.db.delete(shortKey);
  }

  /**
   * Increment click count — update both DB and cache.
   */
  async incrementClicks(shortKey) {
    const record = await this._dbRead(shortKey);
    if (!record) return;

    record.clickCount++;
    await this._dbWrite(shortKey, record);

    // Update cache if entry exists (don't create new entry)
    if (this.cache.get(shortKey)) {
      this.cache.put(shortKey, record);
    }
  }

  getMetrics() {
    return this.cache.getMetrics();
  }
}

// --- Demonstration ---
async function demo() {
  const repo = new CachedURLRepository(5); // Small cache for demo

  // Create some URLs
  await repo.create('abc123', 'https://example.com/page1');
  await repo.create('def456', 'https://example.com/page2');
  await repo.create('ghi789', 'https://example.com/page3');

  console.log('=== Cache-Aside Read Pattern ===');

  // First read: cache HIT (warmed during create)
  let result = await repo.resolve('abc123');
  console.log('Read 1 (abc123):', result.source, '- Latency:', result.latencyMs + 'ms');

  // Read again: cache HIT
  result = await repo.resolve('abc123');
  console.log('Read 2 (abc123):', result.source, '- Latency:', result.latencyMs + 'ms');

  // Invalidate and re-read: cache MISS then populated
  repo.cache.invalidate('abc123');
  result = await repo.resolve('abc123');
  console.log('Read 3 (abc123, after invalidation):', result.source, '- Latency:', result.latencyMs + 'ms');

  // Read again: cache HIT
  result = await repo.resolve('abc123');
  console.log('Read 4 (abc123):', result.source, '- Latency:', result.latencyMs + 'ms');

  console.log('\\n=== LRU Eviction Demo ===');

  // Fill cache beyond capacity to trigger evictions
  await repo.create('url_1', 'https://example.com/1');
  await repo.create('url_2', 'https://example.com/2');
  await repo.create('url_3', 'https://example.com/3');
  // Capacity is 5: oldest entries (def456, ghi789) should be evicted

  result = await repo.resolve('def456');
  console.log('Read evicted key (def456):', result?.source || 'evicted, fetched from DB');

  console.log('\\n=== Cache Metrics ===');
  console.log(repo.getMetrics());
}

demo();`,
      explanation:
        "This example implements a production-grade caching layer for the URL shortener. Key patterns demonstrated: (1) Cache-Aside (Lazy Loading) — the application checks the cache first, and on a miss, queries the database and populates the cache. This is the most common caching pattern for read-heavy workloads. (2) LRU (Least Recently Used) eviction — when the cache is full, the least recently accessed entry is evicted, which aligns with the 80/20 rule where 20% of URLs generate 80% of traffic. (3) TTL-based expiration — entries automatically expire, preventing stale data. (4) Write-through cache warming — newly created URLs are immediately cached since they're likely to be accessed soon. (5) Performance monitoring — tracking hit rate, evictions, and latency helps tune cache size and TTL. In production, this would use Redis Cluster with ~1.2 TB distributed across nodes.",
      order_index: 3,
    },
  ],
  "design-chat-system": [
    {
      title: "WebSocket Chat Server with Room Management",
      description:
        "A real-time WebSocket chat server supporting 1-on-1 messaging, group chat rooms, typing indicators, and message acknowledgments. Demonstrates the core server-side architecture of a chat system.",
      language: "javascript",
      code: `// ============================================================
// WebSocket Chat Server with Room Management
// ============================================================
// Demonstrates: WebSocket connection handling, message routing,
// group rooms, typing indicators, and delivery acknowledgments.

const WebSocket = require('ws');
const crypto = require('crypto');

class ChatServer {
  constructor(port = 8080) {
    this.port = port;
    this.connections = new Map();   // userId → WebSocket
    this.rooms = new Map();         // roomId → Set<userId>
    this.userRooms = new Map();     // userId → Set<roomId>
    this.messageStore = [];         // In-memory message log
    this.wss = null;
  }

  /**
   * Generate a Snowflake-inspired message ID.
   * Combines timestamp + random bits for uniqueness and ordering.
   */
  generateMessageId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).readUInt32BE(0) % 4096;
    // Simple Snowflake: timestamp (ms) shifted left + sequence
    return BigInt(timestamp) * 4096n + BigInt(random);
  }

  /**
   * Start the WebSocket server.
   */
  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    console.log('[ChatServer] Listening on port ' + this.port);

    this.wss.on('connection', (ws) => {
      let userId = null;

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message, (id) => { userId = id; });
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        if (userId) {
          this.handleDisconnect(userId);
        }
      });

      ws.on('error', (err) => {
        console.error('[ChatServer] WebSocket error:', err.message);
      });
    });
  }

  /**
   * Route incoming messages based on type.
   */
  handleMessage(ws, message, setUserId) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(ws, message, setUserId);
        break;
      case 'direct_message':
        this.handleDirectMessage(ws, message);
        break;
      case 'group_message':
        this.handleGroupMessage(ws, message);
        break;
      case 'join_room':
        this.handleJoinRoom(ws, message);
        break;
      case 'leave_room':
        this.handleLeaveRoom(ws, message);
        break;
      case 'typing':
        this.handleTypingIndicator(ws, message);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type: ' + message.type }));
    }
  }

  /**
   * Authenticate and register a user connection.
   */
  handleAuth(ws, message, setUserId) {
    const { userId, token } = message;

    // In production: validate JWT token here
    if (!userId) {
      ws.send(JSON.stringify({ type: 'error', error: 'userId required' }));
      return;
    }

    // Register connection
    this.connections.set(userId, ws);
    this.userRooms.set(userId, new Set());
    setUserId(userId);

    // Notify friends that user is online (simplified)
    this.broadcastPresence(userId, 'online');

    ws.send(JSON.stringify({
      type: 'auth_success',
      userId,
      timestamp: Date.now(),
    }));

    console.log('[ChatServer] User ' + userId + ' connected. Total: ' + this.connections.size);
  }

  /**
   * Handle 1-on-1 direct messages.
   */
  handleDirectMessage(ws, message) {
    const { senderId, recipientId, content, clientMessageId } = message;
    const messageId = this.generateMessageId().toString();

    // Create message record
    const chatMessage = {
      id: messageId,
      senderId,
      recipientId,
      content,
      type: 'text',
      timestamp: Date.now(),
      status: 'sent',
    };

    // Persist message (in production: write to Cassandra)
    this.messageStore.push(chatMessage);

    // ACK to sender: message received by server
    ws.send(JSON.stringify({
      type: 'message_ack',
      clientMessageId,
      serverMessageId: messageId,
      status: 'sent',
      timestamp: chatMessage.timestamp,
    }));

    // Deliver to recipient if online
    const recipientWs = this.connections.get(recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify({
        type: 'new_message',
        message: chatMessage,
      }));
      chatMessage.status = 'delivered';

      // Notify sender of delivery
      ws.send(JSON.stringify({
        type: 'message_status',
        messageId,
        status: 'delivered',
      }));
    } else {
      // User offline: queue for push notification
      console.log('[ChatServer] User ' + recipientId + ' offline. Queuing notification.');
      // In production: push to notification queue (Kafka/SQS)
    }
  }

  /**
   * Handle group chat messages with fan-out.
   */
  handleGroupMessage(ws, message) {
    const { senderId, roomId, content } = message;
    const messageId = this.generateMessageId().toString();

    const room = this.rooms.get(roomId);
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', error: 'Room not found: ' + roomId }));
      return;
    }

    if (!room.has(senderId)) {
      ws.send(JSON.stringify({ type: 'error', error: 'Not a member of room: ' + roomId }));
      return;
    }

    const chatMessage = {
      id: messageId,
      senderId,
      roomId,
      content,
      type: 'group_text',
      timestamp: Date.now(),
    };

    this.messageStore.push(chatMessage);

    // Fan-out to all room members (except sender)
    let deliveredCount = 0;
    for (const memberId of room) {
      if (memberId === senderId) continue;

      const memberWs = this.connections.get(memberId);
      if (memberWs && memberWs.readyState === WebSocket.OPEN) {
        memberWs.send(JSON.stringify({
          type: 'new_group_message',
          message: chatMessage,
        }));
        deliveredCount++;
      }
    }

    // ACK to sender
    ws.send(JSON.stringify({
      type: 'message_ack',
      serverMessageId: messageId,
      status: 'sent',
      deliveredTo: deliveredCount,
      totalMembers: room.size - 1,
    }));
  }

  /**
   * Handle room join requests.
   */
  handleJoinRoom(ws, message) {
    const { userId, roomId } = message;

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId).add(userId);
    this.userRooms.get(userId)?.add(roomId);

    // Notify room members
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId,
      roomId,
      timestamp: Date.now(),
    }, userId);

    ws.send(JSON.stringify({
      type: 'room_joined',
      roomId,
      members: Array.from(this.rooms.get(roomId)),
    }));
  }

  /**
   * Handle room leave.
   */
  handleLeaveRoom(ws, message) {
    const { userId, roomId } = message;
    this.rooms.get(roomId)?.delete(userId);
    this.userRooms.get(userId)?.delete(roomId);

    this.broadcastToRoom(roomId, {
      type: 'user_left',
      userId,
      roomId,
      timestamp: Date.now(),
    }, userId);
  }

  /**
   * Handle typing indicators — broadcast to conversation partner(s).
   */
  handleTypingIndicator(ws, message) {
    const { senderId, recipientId, roomId, isTyping } = message;

    const payload = {
      type: 'typing_indicator',
      userId: senderId,
      isTyping,
      timestamp: Date.now(),
    };

    if (roomId) {
      // Group typing indicator
      this.broadcastToRoom(roomId, payload, senderId);
    } else if (recipientId) {
      // Direct typing indicator
      const recipientWs = this.connections.get(recipientId);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify(payload));
      }
    }
  }

  /**
   * Broadcast a message to all members of a room.
   */
  broadcastToRoom(roomId, payload, excludeUserId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(payload);
    for (const memberId of room) {
      if (memberId === excludeUserId) continue;
      const memberWs = this.connections.get(memberId);
      if (memberWs && memberWs.readyState === WebSocket.OPEN) {
        memberWs.send(data);
      }
    }
  }

  /**
   * Broadcast presence change to relevant users.
   */
  broadcastPresence(userId, status) {
    const payload = JSON.stringify({
      type: 'presence',
      userId,
      status,
      timestamp: Date.now(),
    });

    // In production: only notify friends/contacts, not all users
    for (const [id, ws] of this.connections) {
      if (id !== userId && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  /**
   * Handle user disconnection.
   */
  handleDisconnect(userId) {
    this.connections.delete(userId);

    // Remove from all rooms
    const rooms = this.userRooms.get(userId) || new Set();
    for (const roomId of rooms) {
      this.rooms.get(roomId)?.delete(userId);
    }
    this.userRooms.delete(userId);

    // Broadcast offline status
    this.broadcastPresence(userId, 'offline');

    console.log('[ChatServer] User ' + userId + ' disconnected. Total: ' + this.connections.size);
  }
}

// --- Usage ---
// const server = new ChatServer(8080);
// server.start();

// Example client interaction flow:
console.log('=== Chat Server Message Flow Demo ===');
console.log(\`
Client connects via WebSocket to ws://chat.example.com

1. AUTH:
   → { type: "auth", userId: "alice", token: "jwt..." }
   ← { type: "auth_success", userId: "alice" }

2. DIRECT MESSAGE:
   → { type: "direct_message", senderId: "alice", recipientId: "bob", content: "Hello!" }
   ← { type: "message_ack", serverMessageId: "...", status: "sent" }
   ← { type: "message_status", messageId: "...", status: "delivered" } (when bob receives)

3. JOIN GROUP:
   → { type: "join_room", userId: "alice", roomId: "team-chat" }
   ← { type: "room_joined", roomId: "team-chat", members: ["alice", "bob", "carol"] }

4. GROUP MESSAGE:
   → { type: "group_message", senderId: "alice", roomId: "team-chat", content: "Hi team!" }
   ← { type: "message_ack", deliveredTo: 2, totalMembers: 2 }

5. TYPING INDICATOR:
   → { type: "typing", senderId: "alice", recipientId: "bob", isTyping: true }
   (bob sees: alice is typing...)
\`);`,
      explanation:
        "This example implements the core WebSocket chat server that handles real-time messaging. Key design decisions: (1) WebSocket provides full-duplex, persistent connections — the server can push messages to clients instantly without polling. (2) Message routing distinguishes between direct (1-on-1) and group messages with different fan-out strategies. (3) Snowflake-inspired IDs ensure messages are globally unique and time-sortable. (4) Message ACKs provide delivery guarantees — the sender knows when the server received the message ('sent') and when the recipient received it ('delivered'). (5) Typing indicators are lightweight, ephemeral events that don't need persistence. In production, multiple Chat Server instances coordinate via a message broker (Kafka) and Service Discovery maps users to their connected server.",
      order_index: 1,
    },
    {
      title: "Presence Service with Heartbeat Detection",
      description:
        "A presence service that tracks user online/offline status using heartbeat-based detection with configurable intervals, grace periods, and efficient subscription-based notifications. Uses Redis-like TTL semantics.",
      language: "javascript",
      code: `// ============================================================
// Presence Service with Heartbeat Detection
// ============================================================
// Demonstrates: Heartbeat-based online detection, TTL expiration,
// last-seen tracking, presence subscriptions, and batch status queries.

class PresenceService {
  constructor(options = {}) {
    this.heartbeatInterval = options.heartbeatInterval || 5000;    // 5 seconds
    this.heartbeatTimeout = options.heartbeatTimeout || 30000;     // 30 seconds grace
    this.batchUpdateInterval = options.batchUpdateInterval || 60000; // 1 min DB sync

    // In production: Redis with TTL
    this.presenceStore = new Map();   // userId → { status, lastHeartbeat, lastSeen, devices }
    this.subscribers = new Map();     // userId → Set<subscriberCallbacks>
    this.cleanupTimer = null;
  }

  /**
   * Start the background cleanup timer.
   * Periodically checks for expired heartbeats.
   */
  start() {
    this.cleanupTimer = setInterval(() => {
      this._cleanupExpiredSessions();
    }, this.heartbeatInterval);

    console.log('[Presence] Service started. Heartbeat interval: ' +
      this.heartbeatInterval + 'ms, Timeout: ' + this.heartbeatTimeout + 'ms');
  }

  /**
   * Stop the service.
   */
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Process a heartbeat from a user.
   * Updates their online status and last-seen timestamp.
   *
   * In production, this is called when the WebSocket server
   * receives a ping from the client (every 5 seconds).
   */
  heartbeat(userId, deviceInfo = {}) {
    const now = Date.now();
    const existing = this.presenceStore.get(userId);

    const wasOffline = !existing || existing.status === 'offline';

    // Manage multi-device presence
    const devices = existing?.devices || new Map();
    devices.set(deviceInfo.deviceId || 'default', {
      type: deviceInfo.type || 'unknown',    // mobile, desktop, web
      lastHeartbeat: now,
      ip: deviceInfo.ip || 'unknown',
    });

    const entry = {
      userId,
      status: 'online',
      lastHeartbeat: now,
      lastSeen: now,
      connectedSince: existing?.connectedSince || now,
      devices,
    };

    this.presenceStore.set(userId, entry);

    // Notify subscribers if user just came online
    if (wasOffline) {
      console.log('[Presence] User ' + userId + ' came ONLINE');
      this._notifySubscribers(userId, 'online', entry);
    }

    return entry;
  }

  /**
   * Explicitly set a user as offline (e.g., on WebSocket disconnect).
   * Faster than waiting for heartbeat timeout.
   */
  setOffline(userId, deviceId = 'default') {
    const entry = this.presenceStore.get(userId);
    if (!entry) return;

    // Remove the specific device
    entry.devices.delete(deviceId);

    // User is offline only if ALL devices are disconnected
    if (entry.devices.size === 0) {
      entry.status = 'offline';
      entry.lastSeen = Date.now();
      this.presenceStore.set(userId, entry);

      console.log('[Presence] User ' + userId + ' went OFFLINE (explicit)');
      this._notifySubscribers(userId, 'offline', entry);
    } else {
      console.log('[Presence] User ' + userId + ' disconnected device ' +
        deviceId + ', still online on ' + entry.devices.size + ' device(s)');
    }
  }

  /**
   * Get the online status of a single user.
   */
  getStatus(userId) {
    const entry = this.presenceStore.get(userId);
    if (!entry) {
      return { userId, status: 'offline', lastSeen: null };
    }

    return {
      userId,
      status: entry.status,
      lastSeen: entry.lastSeen,
      connectedSince: entry.status === 'online' ? entry.connectedSince : null,
      deviceCount: entry.devices.size,
      lastSeenFormatted: this._formatLastSeen(entry.lastSeen),
    };
  }

  /**
   * Batch query: get status for multiple users at once.
   * Efficient for loading a contact list or group member statuses.
   */
  getBatchStatus(userIds) {
    return userIds.map(userId => this.getStatus(userId));
  }

  /**
   * Subscribe to presence changes for a specific user.
   * Returns an unsubscribe function.
   *
   * In production: Use Redis Pub/Sub channels per user.
   */
  subscribe(targetUserId, callback) {
    if (!this.subscribers.has(targetUserId)) {
      this.subscribers.set(targetUserId, new Set());
    }
    this.subscribers.get(targetUserId).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(targetUserId)?.delete(callback);
    };
  }

  /**
   * Format "last seen" into a human-readable string.
   */
  _formatLastSeen(timestamp) {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
  }

  /**
   * Notify all subscribers of a user's presence change.
   */
  _notifySubscribers(userId, status, entry) {
    const callbacks = this.subscribers.get(userId);
    if (!callbacks) return;

    const event = {
      userId,
      status,
      lastSeen: entry.lastSeen,
      timestamp: Date.now(),
    };

    for (const callback of callbacks) {
      try {
        callback(event);
      } catch (err) {
        console.error('[Presence] Subscriber callback error:', err.message);
      }
    }
  }

  /**
   * Background cleanup: detect users who missed heartbeats.
   * If no heartbeat received within the timeout window,
   * the user is considered offline.
   */
  _cleanupExpiredSessions() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [userId, entry] of this.presenceStore) {
      if (entry.status !== 'online') continue;

      // Check each device's heartbeat
      for (const [deviceId, device] of entry.devices) {
        if (now - device.lastHeartbeat > this.heartbeatTimeout) {
          entry.devices.delete(deviceId);
        }
      }

      // If all devices expired, mark user offline
      if (entry.devices.size === 0) {
        entry.status = 'offline';
        entry.lastSeen = entry.lastHeartbeat; // Last known alive time
        this.presenceStore.set(userId, entry);

        console.log('[Presence] User ' + userId + ' went OFFLINE (heartbeat timeout)');
        this._notifySubscribers(userId, 'offline', entry);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log('[Presence] Cleanup: ' + expiredCount + ' user(s) timed out');
    }
  }

  /**
   * Get service metrics.
   */
  getMetrics() {
    let online = 0, offline = 0;
    for (const entry of this.presenceStore.values()) {
      if (entry.status === 'online') online++;
      else offline++;
    }
    return {
      totalTracked: this.presenceStore.size,
      online,
      offline,
      totalSubscriptions: Array.from(this.subscribers.values())
        .reduce((sum, s) => sum + s.size, 0),
    };
  }
}

// --- Demonstration ---
const presence = new PresenceService({
  heartbeatInterval: 2000,   // Check every 2s
  heartbeatTimeout: 6000,    // Offline after 6s without heartbeat
});

presence.start();

// Subscribe to Alice's presence (e.g., Bob is watching Alice's status)
const unsubscribe = presence.subscribe('alice', (event) => {
  console.log('[Subscriber] Alice is now ' + event.status +
    (event.status === 'offline' ? ' (last seen: ' + new Date(event.lastSeen).toISOString() + ')' : ''));
});

// Simulate Alice connecting from two devices
console.log('\\n=== Multi-Device Presence ===');
presence.heartbeat('alice', { deviceId: 'iphone', type: 'mobile' });
presence.heartbeat('alice', { deviceId: 'macbook', type: 'desktop' });
console.log('Status:', presence.getStatus('alice'));

// Alice disconnects phone but stays on laptop
console.log('\\n=== Partial Disconnect ===');
presence.setOffline('alice', 'iphone');
console.log('Status:', presence.getStatus('alice')); // Still online!

// Alice disconnects laptop
console.log('\\n=== Full Disconnect ===');
presence.setOffline('alice', 'macbook');
console.log('Status:', presence.getStatus('alice')); // Now offline

// Simulate multiple users for batch query
presence.heartbeat('bob', { deviceId: 'web', type: 'web' });
presence.heartbeat('carol', { deviceId: 'android', type: 'mobile' });

console.log('\\n=== Batch Status Query ===');
const statuses = presence.getBatchStatus(['alice', 'bob', 'carol', 'dave']);
statuses.forEach(s => {
  console.log(s.userId + ': ' + s.status + ' (' + s.lastSeenFormatted + ')');
});

console.log('\\n=== Service Metrics ===');
console.log(presence.getMetrics());

// Cleanup
unsubscribe();
presence.stop();`,
      explanation:
        "This example implements a complete presence service for the chat system. Key design decisions: (1) Heartbeat-based detection — clients send periodic pings (every 5 seconds), and if no heartbeat is received within the timeout window (30 seconds), the user is marked offline. This handles ungraceful disconnects (network drops, app crashes). (2) Multi-device support — a user is 'online' as long as at least one device has an active heartbeat. Disconnecting one device doesn't change status if others remain connected. (3) Subscription-based notifications — other users subscribe to presence changes through callbacks (Redis Pub/Sub in production). (4) Lazy 'last seen' formatting reduces client-side computation. (5) Background cleanup thread periodically scans for expired heartbeats. In production, each user's presence is a Redis key with TTL — the key auto-expires if not refreshed.",
      order_index: 2,
    },
    {
      title: "Message Storage with Fan-Out Strategies",
      description:
        "A message storage system demonstrating both fan-out-on-write and fan-out-on-read strategies, per-conversation partitioning with Cassandra-like data modeling, pagination, and the hybrid approach for optimal performance.",
      language: "javascript",
      code: `// ============================================================
// Message Storage with Fan-Out Strategies
// ============================================================
// Demonstrates: Fan-out-on-write vs fan-out-on-read,
// conversation-partitioned storage, Snowflake IDs,
// pagination, and hybrid fan-out for groups.

/**
 * Snowflake ID Generator
 * Generates globally unique, time-sortable 64-bit IDs.
 */
class SnowflakeIdGenerator {
  constructor(datacenterId = 0, machineId = 0) {
    this.epoch = 1609459200000n; // Custom epoch: 2021-01-01T00:00:00Z
    this.datacenterId = BigInt(datacenterId);
    this.machineId = BigInt(machineId);
    this.sequence = 0n;
    this.lastTimestamp = -1n;
  }

  generate() {
    let timestamp = BigInt(Date.now()) - this.epoch;

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 4095n; // 12-bit sequence
      if (this.sequence === 0n) {
        // Wait for next millisecond
        while (BigInt(Date.now()) - this.epoch <= this.lastTimestamp) {}
        timestamp = BigInt(Date.now()) - this.epoch;
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    const id = (timestamp << 22n) |
               (this.datacenterId << 17n) |
               (this.machineId << 12n) |
               this.sequence;

    return id;
  }

  /**
   * Extract the timestamp from a Snowflake ID.
   * Useful for time-based queries without additional columns.
   */
  extractTimestamp(id) {
    const timestamp = (BigInt(id) >> 22n) + this.epoch;
    return new Date(Number(timestamp));
  }
}

/**
 * Conversation-Partitioned Message Store
 * Models Cassandra's wide-column storage pattern where
 * partition_key = conversation_id, clustering_key = message_id (desc).
 */
class MessageStore {
  constructor() {
    this.idGen = new SnowflakeIdGenerator(1, 1);

    // Partition map: conversation_id → sorted array of messages
    // In Cassandra: partition_key = conversation_id, clustering_key = message_id DESC
    this.partitions = new Map();

    // Per-user inbox for fan-out-on-write
    // Each user has their own "inbox" with recent messages
    this.userInboxes = new Map();   // userId → [{ conversationId, messageId, snippet }]

    // Conversation membership
    this.conversationMembers = new Map(); // conversationId → Set<userId>

    // Configuration
    this.fanOutThreshold = 100; // Groups > 100 members use fan-out-on-read
  }

  /**
   * Create a new conversation (1-on-1 or group).
   */
  createConversation(conversationId, memberIds, options = {}) {
    this.conversationMembers.set(conversationId, new Set(memberIds));
    this.partitions.set(conversationId, []);

    // Initialize inboxes for all members
    for (const memberId of memberIds) {
      if (!this.userInboxes.has(memberId)) {
        this.userInboxes.set(memberId, []);
      }
    }

    return {
      conversationId,
      members: memberIds,
      type: memberIds.length === 2 ? '1-on-1' : 'group',
      createdAt: new Date(),
    };
  }

  /**
   * Send a message to a conversation.
   * Chooses fan-out strategy based on group size.
   */
  sendMessage(conversationId, senderId, content, type = 'text') {
    const members = this.conversationMembers.get(conversationId);
    if (!members) {
      throw new Error('Conversation not found: ' + conversationId);
    }

    if (!members.has(senderId)) {
      throw new Error('User ' + senderId + ' is not a member of ' + conversationId);
    }

    // Generate Snowflake ID (globally unique, time-sortable)
    const messageId = this.idGen.generate();

    const message = {
      messageId: messageId.toString(),
      conversationId,
      senderId,
      content,
      type,
      timestamp: Date.now(),
      createdAt: this.idGen.extractTimestamp(messageId),
    };

    // Store message in the conversation partition (always needed)
    const partition = this.partitions.get(conversationId);
    partition.push(message); // In Cassandra: inserted in sort order by clustering key

    // Choose fan-out strategy based on group size
    if (members.size <= this.fanOutThreshold) {
      this._fanOutOnWrite(message, members);
    } else {
      // Large group: fan-out-on-read (no inbox writes)
      console.log('[Store] Large group (' + members.size + ' members) — using fan-out-on-read');
    }

    return message;
  }

  /**
   * FAN-OUT-ON-WRITE (Push Model)
   * Write a pointer to each member's inbox.
   *
   * Pros: Fast reads — each user reads from their own inbox
   * Cons: Expensive writes — N writes for N members
   * Best for: Small groups (< 100 members), 1-on-1 chats
   */
  _fanOutOnWrite(message, members) {
    const inboxEntry = {
      conversationId: message.conversationId,
      messageId: message.messageId,
      senderId: message.senderId,
      snippet: message.content.substring(0, 100),
      timestamp: message.timestamp,
    };

    let writeCount = 0;
    for (const memberId of members) {
      if (memberId === message.senderId) continue; // Skip sender

      const inbox = this.userInboxes.get(memberId);
      if (inbox) {
        inbox.push(inboxEntry);
        writeCount++;
      }
    }

    console.log('[Store] Fan-out-on-write: ' + writeCount + ' inbox writes for ' +
      (members.size - 1) + ' recipients');
  }

  /**
   * FAN-OUT-ON-READ (Pull Model)
   * Get messages for a user by querying all their conversations.
   *
   * Pros: Efficient writes — one write per message
   * Cons: Slower reads — must query multiple partitions
   * Best for: Large groups (100+ members)
   */
  getMessagesForUser(userId, options = {}) {
    const { limit = 20, beforeTimestamp } = options;
    const allMessages = [];

    // Find all conversations this user belongs to
    for (const [convId, members] of this.conversationMembers) {
      if (!members.has(userId)) continue;

      const partition = this.partitions.get(convId) || [];

      // Get recent messages from this conversation
      const filtered = beforeTimestamp
        ? partition.filter(m => m.timestamp < beforeTimestamp)
        : partition;

      allMessages.push(...filtered);
    }

    // Sort by timestamp descending (most recent first)
    allMessages.sort((a, b) => b.timestamp - a.timestamp);

    return allMessages.slice(0, limit);
  }

  /**
   * Get messages for a specific conversation with cursor-based pagination.
   * This is the primary read path for both fan-out strategies.
   *
   * In Cassandra: SELECT * FROM messages
   *   WHERE conversation_id = ? AND message_id < ?
   *   ORDER BY message_id DESC LIMIT ?
   */
  getConversationMessages(conversationId, options = {}) {
    const { limit = 50, beforeMessageId, afterMessageId } = options;

    const partition = this.partitions.get(conversationId);
    if (!partition) return { messages: [], hasMore: false };

    let filtered = [...partition];

    // Cursor-based pagination
    if (beforeMessageId) {
      const idx = filtered.findIndex(m => m.messageId === beforeMessageId);
      if (idx > 0) {
        filtered = filtered.slice(0, idx);
      }
    }

    if (afterMessageId) {
      const idx = filtered.findIndex(m => m.messageId === afterMessageId);
      if (idx >= 0) {
        filtered = filtered.slice(idx + 1);
      }
    }

    // Get the last 'limit' messages (most recent)
    const hasMore = filtered.length > limit;
    const messages = filtered.slice(-limit);

    return {
      messages,
      hasMore,
      cursor: messages.length > 0 ? messages[0].messageId : null,
    };
  }

  /**
   * Get a user's inbox (fan-out-on-write results).
   * Shows the most recent message from each conversation.
   */
  getUserInbox(userId, limit = 20) {
    const inbox = this.userInboxes.get(userId) || [];

    // Deduplicate: keep only the latest message per conversation
    const latestPerConv = new Map();
    for (const entry of inbox) {
      const existing = latestPerConv.get(entry.conversationId);
      if (!existing || entry.timestamp > existing.timestamp) {
        latestPerConv.set(entry.conversationId, entry);
      }
    }

    // Sort by most recent first
    return Array.from(latestPerConv.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get storage metrics.
   */
  getMetrics() {
    let totalMessages = 0;
    let totalInboxEntries = 0;

    for (const partition of this.partitions.values()) {
      totalMessages += partition.length;
    }
    for (const inbox of this.userInboxes.values()) {
      totalInboxEntries += inbox.length;
    }

    return {
      conversations: this.partitions.size,
      totalMessages,
      totalInboxEntries,
      storageAmplification: totalInboxEntries > 0
        ? (totalInboxEntries / totalMessages).toFixed(2) + 'x'
        : '0x',
    };
  }
}

// --- Demonstration ---
const store = new MessageStore();

console.log('=== 1-on-1 Chat (Fan-Out-on-Write) ===');
store.createConversation('conv-alice-bob', ['alice', 'bob']);

store.sendMessage('conv-alice-bob', 'alice', 'Hey Bob! How are you?');
store.sendMessage('conv-alice-bob', 'bob', 'Hi Alice! Doing great, thanks!');
store.sendMessage('conv-alice-bob', 'alice', 'Want to grab coffee?');

// Bob checks his inbox
console.log("\\nBob's Inbox:", store.getUserInbox('bob'));

// Load conversation with pagination
console.log('\\nConversation Messages:', store.getConversationMessages('conv-alice-bob', { limit: 2 }));

console.log('\\n=== Small Group Chat (Fan-Out-on-Write) ===');
store.createConversation('team-chat', ['alice', 'bob', 'carol', 'dave']);

store.sendMessage('team-chat', 'alice', 'Team standup in 5 minutes!');
store.sendMessage('team-chat', 'bob', 'On my way!');

// Carol checks her inbox — sees both 1-on-1 and group messages
console.log("\\nCarol's Inbox:", store.getUserInbox('carol'));

console.log('\\n=== Large Group (Fan-Out-on-Read) ===');
const largeGroupMembers = Array.from({ length: 150 }, (_, i) => 'user_' + i);
store.createConversation('large-group', largeGroupMembers);

store.sendMessage('large-group', 'user_0', 'Hello everyone!');
// Note: No inbox writes for large group — members pull messages on demand

// user_50 reads messages from the large group
console.log("\\nLarge group messages (fan-out-on-read):",
  store.getConversationMessages('large-group', { limit: 10 }));

console.log('\\n=== Snowflake ID Properties ===');
const idGen = new SnowflakeIdGenerator(1, 1);
const id1 = idGen.generate();
const id2 = idGen.generate();
const id3 = idGen.generate();

console.log('ID 1:', id1.toString(), '→ Time:', idGen.extractTimestamp(id1));
console.log('ID 2:', id2.toString(), '→ Time:', idGen.extractTimestamp(id2));
console.log('ID 3:', id3.toString(), '→ Time:', idGen.extractTimestamp(id3));
console.log('IDs are ordered:', id1 < id2 && id2 < id3); // Always true

console.log('\\n=== Storage Metrics ===');
console.log(store.getMetrics());`,
      explanation:
        "This example implements the message storage layer with both fan-out strategies. Key design decisions: (1) Conversation-partitioned storage mirrors Cassandra's data model — all messages in a conversation are co-located on the same partition for efficient range queries. (2) Fan-out-on-write pushes inbox entries to each recipient, enabling fast 'recent conversations' queries but amplifying writes. Storage amplification is tracked via metrics. (3) Fan-out-on-read writes once and recipients pull messages on demand — ideal for large groups where write amplification would be excessive. (4) The hybrid approach uses a configurable threshold (100 members) to automatically choose the optimal strategy. (5) Snowflake IDs provide globally unique, time-sortable identifiers — the timestamp can be extracted directly from the ID, eliminating the need for a separate timestamp column in some queries. (6) Cursor-based pagination with message IDs provides consistent pagination even as new messages arrive.",
      order_index: 3,
    },
  ],
};

export default examples;
