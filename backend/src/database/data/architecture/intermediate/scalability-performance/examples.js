// ============================================================================
// Scalability & Performance — Code Examples
// ============================================================================

const examples = {
  'caching-strategies': [
    {
      title: "Redis Cache Service",
      description: "Reusable caching service with cache-aside and cache-through patterns.",
      language: "javascript",
      code: `class CacheService {
  constructor(redisClient, defaultTTL = 3600) {
    this.redis = redisClient;
    this.defaultTTL = defaultTTL;
  }

  async get(key) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.redis.setEx(key, ttl, JSON.stringify(value));
  }

  async delete(key) {
    await this.redis.del(key);
  }

  // Cache-aside with automatic population
  async getOrSet(key, fetcher, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttl);
    }
    return fresh;
  }

  // Invalidate by pattern (e.g., "user:42:*")
  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  // Cache-through write
  async writeThrough(key, value, writer, ttl = this.defaultTTL) {
    const result = await writer(value);
    await this.set(key, result, ttl);
    return result;
  }
}

// Usage
const cache = new CacheService(redis);

// Cache-aside
const user = await cache.getOrSet(
  \`user:\${userId}\`,
  () => userRepo.findById(userId),
  1800  // 30 minutes
);

// After update — invalidate
await cache.delete(\`user:\${userId}\`);
await cache.invalidatePattern(\`user:\${userId}:*\`);`,
      explanation: "getOrSet implements cache-aside: returns cached data if available, otherwise calls the fetcher function and caches the result. writeThrough ensures the cache is always in sync with the database.",
      order_index: 1,
    },
  ],
  'load-balancing-horizontal-scaling': [
    {
      title: "Health Check Endpoint for Load Balancers",
      description: "A health endpoint that load balancers use to determine server availability.",
      language: "javascript",
      code: `import pool from '../config/database.js';

// Health check endpoint — used by load balancer
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  // Check database connectivity
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    health.checks.database = {
      status: 'ok',
      responseTime: Date.now() - start,
    };
  } catch (err) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'error',
      error: err.message,
    };
  }

  // Check Redis connectivity
  try {
    const start = Date.now();
    await redis.ping();
    health.checks.redis = {
      status: 'ok',
      responseTime: Date.now() - start,
    };
  } catch (err) {
    health.status = 'degraded';
    health.checks.redis = {
      status: 'error',
      error: err.message,
    };
  }

  // Memory usage
  const mem = process.memoryUsage();
  health.checks.memory = {
    rss: \`\${(mem.rss / 1024 / 1024).toFixed(1)} MB\`,
    heapUsed: \`\${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB\`,
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});`,
      explanation: "Load balancers poll /health periodically. If a server returns 503, the LB removes it from rotation. The endpoint checks all critical dependencies (database, cache) and reports memory usage.",
      order_index: 1,
    },
  ],
};

export default examples;
