// ============================================================================
// Microservices Architecture — Code Examples
// ============================================================================

const examples = {
  'microservices-fundamentals': [
    {
      title: "API Gateway Pattern",
      description: "A simple API gateway that routes requests to backend services.",
      language: "javascript",
      code: `import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Service registry
const services = {
  users: 'http://user-service:3001',
  orders: 'http://order-service:3002',
  products: 'http://product-service:3003',
  payments: 'http://payment-service:3004',
};

// Auth middleware (applied before routing)
app.use('/api', authenticate);

// Route to appropriate service
for (const [name, target] of Object.entries(services)) {
  app.use(
    \`/api/\${name}\`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [\`^/api/\${name}\`]: '/api' },
      onError: (err, req, res) => {
        console.error(\`Proxy error [\${name}]:\`, err.message);
        res.status(503).json({ error: \`\${name} service unavailable\` });
      },
    })
  );
}

// Rate limiting per client
app.use(rateLimiter({ windowMs: 60000, max: 200 }));

// Aggregation endpoint (BFF pattern)
app.get('/api/dashboard', async (req, res) => {
  const [user, orders, recommendations] = await Promise.allSettled([
    fetch(\`\${services.users}/api/profile\`, { headers: req.headers }),
    fetch(\`\${services.orders}/api/recent\`, { headers: req.headers }),
    fetch(\`\${services.products}/api/recommended\`, { headers: req.headers }),
  ]);

  res.json({
    user: user.status === 'fulfilled' ? await user.value.json() : null,
    orders: orders.status === 'fulfilled' ? await orders.value.json() : [],
    recommendations: recommendations.status === 'fulfilled' ? await recommendations.value.json() : [],
  });
});

app.listen(8080);`,
      explanation: "The API Gateway is the single entry point for clients. It handles auth, rate limiting, and routing. The dashboard endpoint aggregates data from multiple services — the Backend-for-Frontend (BFF) pattern.",
      order_index: 1,
    },
  ],
  'service-communication-resilience': [
    {
      title: "Resilient Service Client",
      description: "A service client combining timeout, retry, circuit breaker, and fallback.",
      language: "javascript",
      code: `class ResilientClient {
  #baseUrl;
  #timeout;
  #maxRetries;
  #circuitBreaker;
  #cache;

  constructor({ baseUrl, timeout = 5000, maxRetries = 3, cache }) {
    this.#baseUrl = baseUrl;
    this.#timeout = timeout;
    this.#maxRetries = maxRetries;
    this.#cache = cache;
    this.#circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      threshold: 5,
      resetTimeout: 30000,
      lastFailure: null,
    };
  }

  async get(path, { fallback, cacheKey, cacheTTL = 300 } = {}) {
    // Check circuit breaker
    if (this.#isCircuitOpen()) {
      console.warn(\`Circuit OPEN for \${this.#baseUrl}\`);
      return this.#fallback(cacheKey, fallback);
    }

    for (let attempt = 0; attempt <= this.#maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.#timeout);

        const res = await fetch(\`\${this.#baseUrl}\${path}\`, {
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

        const data = await res.json();
        this.#onSuccess();

        // Cache successful response
        if (this.#cache && cacheKey) {
          await this.#cache.set(cacheKey, data, cacheTTL);
        }

        return data;
      } catch (err) {
        if (attempt === this.#maxRetries) {
          this.#onFailure();
          return this.#fallback(cacheKey, fallback);
        }
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  #isCircuitOpen() {
    if (this.#circuitBreaker.state !== 'OPEN') return false;
    if (Date.now() - this.#circuitBreaker.lastFailure > this.#circuitBreaker.resetTimeout) {
      this.#circuitBreaker.state = 'HALF_OPEN';
      return false;
    }
    return true;
  }

  #onSuccess() { this.#circuitBreaker.failures = 0; this.#circuitBreaker.state = 'CLOSED'; }

  #onFailure() {
    this.#circuitBreaker.failures++;
    this.#circuitBreaker.lastFailure = Date.now();
    if (this.#circuitBreaker.failures >= this.#circuitBreaker.threshold) {
      this.#circuitBreaker.state = 'OPEN';
    }
  }

  async #fallback(cacheKey, fallbackFn) {
    if (this.#cache && cacheKey) {
      const cached = await this.#cache.get(cacheKey);
      if (cached) return { ...cached, _stale: true };
    }
    if (fallbackFn) return fallbackFn();
    throw new Error(\`Service \${this.#baseUrl} unavailable\`);
  }
}

// Usage
const userClient = new ResilientClient({
  baseUrl: 'http://user-service:3001',
  timeout: 3000,
  cache: redisCache,
});

const user = await userClient.get('/api/users/42', {
  cacheKey: 'user:42',
  fallback: () => ({ id: 42, name: 'Unknown', _unavailable: true }),
});`,
      explanation: "This client combines ALL resilience patterns: timeout (AbortController), retry with exponential backoff, circuit breaker (stops after 5 failures), cache fallback, and custom fallback function.",
      order_index: 1,
    },
  ],
};

export default examples;
