// ============================================================================
// Microservices Architecture — Code Examples
// ============================================================================

const examples = {
  'microservices-fundamentals': [
    {
      title: "API Gateway with Routing, Auth & Aggregation",
      description: "A production-style API gateway that handles JWT authentication, service routing with proxy, rate limiting, and response aggregation (BFF pattern) — the single entry point for all clients.",
      language: "javascript",
      code: `import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json());

// ─── Service Registry (in production, use Consul/Eureka/K8s DNS) ───
const SERVICES = {
  users:    process.env.USER_SERVICE_URL    || 'http://user-service:3001',
  orders:   process.env.ORDER_SERVICE_URL   || 'http://order-service:3002',
  products: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
};

// ─── Rate Limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute window
  max: 200,              // 200 requests per window per IP
  standardHeaders: true, // Return rate limit info in headers
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// ─── JWT Authentication Middleware ─────────────────────────────────
function authenticate(req, res, next) {
  // Public routes skip auth
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/health'];
  if (publicPaths.some(p => req.path.startsWith(p))) return next();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Forward user info to downstream services via headers
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
app.use(authenticate);

// ─── Proxy Routing to Backend Services ─────────────────────────────
for (const [name, target] of Object.entries(SERVICES)) {
  app.use(
    \`/api/\${name}\`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [\`^/api/\${name}\`]: '/api' },
      timeout: 10000,
      onError: (err, req, res) => {
        console.error(\`[Gateway] Proxy error [\${name}]:\`, err.message);
        res.status(503).json({
          error: \`\${name} service unavailable\`,
          service: name,
        });
      },
    })
  );
}

// ─── Aggregation Endpoint (BFF Pattern) ────────────────────────────
// Combines data from multiple services into a single response
app.get('/api/dashboard', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const headers = {
    'x-user-id': userId,
    'Content-Type': 'application/json',
  };

  try {
    // Parallel calls to multiple services
    const results = await Promise.allSettled([
      fetch(\`\${SERVICES.users}/api/profile/\${userId}\`, { headers, signal: AbortSignal.timeout(3000) }),
      fetch(\`\${SERVICES.orders}/api/recent?userId=\${userId}&limit=5\`, { headers, signal: AbortSignal.timeout(3000) }),
      fetch(\`\${SERVICES.products}/api/recommendations?userId=\${userId}\`, { headers, signal: AbortSignal.timeout(3000) }),
    ]);

    // Graceful degradation: return partial data if some services fail
    const dashboard = {
      user: results[0].status === 'fulfilled' ? await results[0].value.json() : null,
      recentOrders: results[1].status === 'fulfilled' ? await results[1].value.json() : [],
      recommendations: results[2].status === 'fulfilled' ? await results[2].value.json() : [],
      _meta: {
        partial: results.some(r => r.status === 'rejected'),
        timestamp: new Date().toISOString(),
      },
    };

    res.json(dashboard);
  } catch (err) {
    console.error('[Gateway] Dashboard aggregation error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ─── Health Check ──────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const checks = {};
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const resp = await fetch(\`\${url}/health\`, { signal: AbortSignal.timeout(2000) });
      checks[name] = resp.ok ? 'UP' : 'DOWN';
    } catch {
      checks[name] = 'DOWN';
    }
  }
  const allUp = Object.values(checks).every(s => s === 'UP');
  res.status(allUp ? 200 : 207).json({ status: allUp ? 'UP' : 'DEGRADED', services: checks });
});

app.listen(8080, () => console.log('API Gateway running on :8080'));`,
      explanation: `This API Gateway demonstrates five key responsibilities:

1. **JWT Authentication** — validates tokens before forwarding requests, and passes user context via x-user-id / x-user-role headers so downstream services don't need to re-validate.

2. **Rate Limiting** — protects backend services from abuse (200 req/min per IP).

3. **Service Routing** — proxies /api/users to user-service, /api/orders to order-service, etc. The service registry is config-driven (env vars) for easy deployment changes.

4. **Response Aggregation (BFF)** — the /api/dashboard endpoint calls three services in parallel (Promise.allSettled) and combines results. It uses graceful degradation: if recommendations fail, the dashboard still returns user + orders.

5. **Health Check Aggregation** — /health reports the status of all downstream services, returning DEGRADED if any service is down.

In production, replace the in-memory service registry with Consul, Eureka, or Kubernetes DNS. The gateway is a potential single point of failure, so deploy multiple instances behind a load balancer.`,
      order_index: 1,
    },
    {
      title: "Service Discovery with Health-Checked Registry",
      description: "A lightweight service registry that tracks service instances with health checks, supports registration, deregistration, and client-side load balancing.",
      language: "javascript",
      code: `// ─── Service Registry (simplified Consul/Eureka) ─────────────────
class ServiceRegistry {
  constructor() {
    this.services = new Map(); // serviceName → Map<instanceId, instanceInfo>
    this.healthCheckInterval = 10_000; // 10 seconds

    // Periodically health-check all instances
    setInterval(() => this.#runHealthChecks(), this.healthCheckInterval);
  }

  // Register a service instance
  register(serviceName, instanceId, host, port, metadata = {}) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new Map());
    }

    this.services.get(serviceName).set(instanceId, {
      instanceId,
      host,
      port,
      url: \`http://\${host}:\${port}\`,
      metadata,
      status: 'UP',
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      consecutiveFailures: 0,
    });

    console.log(\`[Registry] Registered \${serviceName}/\${instanceId} at \${host}:\${port}\`);
    return { instanceId, serviceName };
  }

  // Deregister a service instance
  deregister(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    if (instances) {
      instances.delete(instanceId);
      console.log(\`[Registry] Deregistered \${serviceName}/\${instanceId}\`);
    }
  }

  // Get all healthy instances of a service
  getInstances(serviceName) {
    const instances = this.services.get(serviceName);
    if (!instances) return [];

    return [...instances.values()].filter(i => i.status === 'UP');
  }

  // Client-side load balancing: round-robin
  #roundRobinCounters = new Map();

  resolve(serviceName) {
    const healthy = this.getInstances(serviceName);
    if (healthy.length === 0) {
      throw new Error(\`No healthy instances for \${serviceName}\`);
    }

    // Round-robin selection
    const counter = (this.#roundRobinCounters.get(serviceName) || 0) % healthy.length;
    this.#roundRobinCounters.set(serviceName, counter + 1);

    return healthy[counter];
  }

  // Heartbeat from a service instance
  heartbeat(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    const instance = instances?.get(instanceId);
    if (instance) {
      instance.lastHeartbeat = new Date();
      instance.consecutiveFailures = 0;
      instance.status = 'UP';
    }
  }

  // Health check all registered instances
  async #runHealthChecks() {
    for (const [serviceName, instances] of this.services) {
      for (const [instanceId, instance] of instances) {
        try {
          const resp = await fetch(\`\${instance.url}/health\`, {
            signal: AbortSignal.timeout(3000),
          });

          if (resp.ok) {
            instance.status = 'UP';
            instance.consecutiveFailures = 0;
          } else {
            instance.consecutiveFailures++;
          }
        } catch {
          instance.consecutiveFailures++;
        }

        // Mark DOWN after 3 consecutive failures
        if (instance.consecutiveFailures >= 3) {
          instance.status = 'DOWN';
          console.warn(\`[Registry] \${serviceName}/\${instanceId} marked DOWN\`);
        }

        // Remove after 5 consecutive failures
        if (instance.consecutiveFailures >= 5) {
          instances.delete(instanceId);
          console.warn(\`[Registry] \${serviceName}/\${instanceId} evicted\`);
        }
      }
    }
  }

  // List all services and their instance counts
  listServices() {
    const summary = {};
    for (const [name, instances] of this.services) {
      const healthy = [...instances.values()].filter(i => i.status === 'UP').length;
      summary[name] = { total: instances.size, healthy };
    }
    return summary;
  }
}

// ─── Usage Example ────────────────────────────────────────────────
const registry = new ServiceRegistry();

// Services register themselves on startup
registry.register('order-service', 'order-1', 'localhost', 3001);
registry.register('order-service', 'order-2', 'localhost', 3002);
registry.register('payment-service', 'payment-1', 'localhost', 4001);

// Other services discover and call them
const orderInstance = registry.resolve('order-service');
console.log(\`Calling order service at \${orderInstance.url}\`);
// Output: Calling order service at http://localhost:3001
// Next call returns :3002 (round-robin)

// Dashboard: list all services
console.log(registry.listServices());
// { 'order-service': { total: 2, healthy: 2 }, 'payment-service': { total: 1, healthy: 1 } }`,
      explanation: `This service registry demonstrates all key discovery concepts:

1. **Registration** — services register themselves with name, host, port, and metadata on startup. Each instance gets a unique ID (e.g., "order-1", "order-2").

2. **Health Checking** — the registry periodically pings each instance's /health endpoint. After 3 consecutive failures, the instance is marked DOWN (removed from load balancing). After 5 failures, it's evicted entirely.

3. **Client-Side Discovery** — callers use \`resolve(serviceName)\` to get a healthy instance. The registry uses round-robin load balancing to distribute requests evenly.

4. **Heartbeats** — services can send heartbeats to confirm they're alive, resetting the failure counter.

In production, use a dedicated registry like HashiCorp Consul (health checks + KV store), Netflix Eureka (Spring ecosystem), or Kubernetes Services (built-in DNS-based discovery). This example illustrates the mechanics behind those tools.`,
      order_index: 2,
    },
    {
      title: "Dockerized Microservice with Multi-Stage Build",
      description: "A complete Dockerfile with multi-stage build, non-root user, health checks, and a Docker Compose file for local multi-service development with database dependencies.",
      language: "javascript",
      code: `// ─── Dockerfile (multi-stage, production-ready) ──────────────────
// Save as: services/order-service/Dockerfile

/*
# Stage 1: Install dependencies only (cached layer)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production image (minimal)
FROM node:20-alpine AS runner
LABEL maintainer="platform-team@company.com"
LABEL service="order-service"

# Security: create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose service port
EXPOSE 3000

# Health check — Kubernetes will also probe this
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

# Use exec form (PID 1, receives signals properly)
CMD ["node", "src/server.js"]
*/

// ─── docker-compose.yml (local development) ──────────────────────
/*
version: "3.9"

services:
  # ── API Gateway ──────────────────────────────────────────────
  api-gateway:
    build: ./services/gateway
    ports:
      - "8080:8080"
    environment:
      - USER_SERVICE_URL=http://user-service:3000
      - ORDER_SERVICE_URL=http://order-service:3000
      - PRODUCT_SERVICE_URL=http://product-service:3000
      - JWT_SECRET=dev-secret-change-in-prod
    depends_on:
      order-service:
        condition: service_healthy
      user-service:
        condition: service_healthy

  # ── Order Service ────────────────────────────────────────────
  order-service:
    build: ./services/order
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@order-db:5432/orders
      - KAFKA_BROKERS=kafka:9092
      - NODE_ENV=development
    depends_on:
      order-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s

  # ── User Service ─────────────────────────────────────────────
  user-service:
    build: ./services/user
    ports:
      - "3002:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@user-db:5432/users
      - JWT_SECRET=dev-secret-change-in-prod
    depends_on:
      user-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  # ── Product Service ──────────────────────────────────────────
  product-service:
    build: ./services/product
    ports:
      - "3003:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@product-db:5432/products
    depends_on:
      product-db:
        condition: service_healthy

  # ── Databases (one per service!) ─────────────────────────────
  order-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_PASSWORD: secret
    volumes:
      - order_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  user-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: users
      POSTGRES_PASSWORD: secret
    volumes:
      - user_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  product-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: products
      POSTGRES_PASSWORD: secret
    volumes:
      - product_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  # ── Infrastructure ───────────────────────────────────────────
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      CLUSTER_ID: "microservices-cluster"

volumes:
  order_data:
  user_data:
  product_data:
*/

// ─── Health Check Endpoint (add to every service) ────────────────
import express from 'express';
import pool from './config/database.js';

const app = express();

// Liveness: is the process running?
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Readiness: can it serve traffic?
app.get('/health/ready', async (req, res) => {
  const checks = {};

  // Check database connection
  try {
    await pool.query('SELECT 1');
    checks.database = 'UP';
  } catch {
    checks.database = 'DOWN';
  }

  const allUp = Object.values(checks).every(v => v === 'UP');
  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'UP' : 'DOWN',
    checks,
    uptime: process.uptime(),
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
  });
});

// Graceful shutdown (container receives SIGTERM)
function shutdown(signal) {
  console.log(\`[Order Service] \${signal} received. Shutting down gracefully...\`);

  server.close(async () => {
    await pool.end();
    console.log('[Order Service] Database pool closed. Exiting.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => process.exit(1), 30_000);
}

const server = app.listen(3000, () => {
  console.log('[Order Service] Running on port 3000');
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));`,
      explanation: `This example covers the complete containerization workflow for microservices:

**Dockerfile (multi-stage build):**
- Stage 1 installs dependencies in a separate layer (cached between builds if package.json hasn't changed).
- Stage 2 copies only production dependencies, runs as non-root user (security best practice), includes a HEALTHCHECK for Docker/Kubernetes, and uses exec form CMD so the Node process receives SIGTERM properly.

**Docker Compose (local development):**
- Demonstrates database-per-service: each service gets its own PostgreSQL instance.
- Uses healthcheck + depends_on with condition: service_healthy to ensure databases are ready before services start.
- Includes Kafka for async communication between services.
- Named volumes persist database data across container restarts.

**Health Check Endpoints:**
- /health (liveness) — always returns UP if the process is running. Used by Kubernetes liveness probes to restart crashed containers.
- /health/ready (readiness) — checks database connectivity. Used by Kubernetes readiness probes to stop sending traffic when dependencies are down.

**Graceful Shutdown:**
- Listens for SIGTERM (sent by Docker/Kubernetes during shutdown).
- Stops accepting new connections, drains in-flight requests, closes database pool, then exits.
- 30-second timeout ensures the process doesn't hang indefinitely.`,
      order_index: 3,
    },
  ],

  'service-communication-resilience': [
    {
      title: "Circuit Breaker with Retry & Exponential Backoff",
      description: "A production-ready circuit breaker implementation with configurable thresholds, exponential backoff with jitter, and fallback strategies — the essential resilience pattern for microservices.",
      language: "javascript",
      code: `// ─── Circuit Breaker ──────────────────────────────────────────────
class CircuitBreaker {
  static CLOSED    = 'CLOSED';
  static OPEN      = 'OPEN';
  static HALF_OPEN = 'HALF_OPEN';

  constructor(name, options = {}) {
    this.name = name;
    this.state = CircuitBreaker.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;

    // Configuration
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 3;
    this.timeout          = options.timeout ?? 30_000;  // 30s before trying again
    this.monitorWindow    = options.monitorWindow ?? 60_000;  // reset failures after 60s
  }

  async call(fn, fallback = null) {
    if (this.state === CircuitBreaker.OPEN) {
      // Check if timeout has elapsed → try half-open
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CircuitBreaker.HALF_OPEN;
        console.log(\`[CB:\${this.name}] Transitioning to HALF_OPEN\`);
      } else {
        console.log(\`[CB:\${this.name}] OPEN — rejecting request\`);
        if (fallback) return fallback();
        throw new Error(\`Circuit breaker [\${this.name}] is OPEN\`);
      }
    }

    try {
      const result = await fn();
      this.#onSuccess();
      return result;
    } catch (error) {
      this.#onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }

  #onSuccess() {
    if (this.state === CircuitBreaker.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitBreaker.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        console.log(\`[CB:\${this.name}] Circuit CLOSED (service recovered)\`);
      }
    } else {
      this.failureCount = 0; // Reset on success in closed state
    }
  }

  #onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreaker.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreaker.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      this.successCount = 0;
      console.log(\`[CB:\${this.name}] Circuit OPENED (failures: \${this.failureCount})\`);
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}

// ─── Retry with Exponential Backoff + Jitter ─────────────────────
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries   = 3,
    baseDelay    = 1000,
    maxDelay     = 30_000,
    jitter       = true,
    retryOnError = (err) => err.status >= 500 || err.code === 'ECONNREFUSED',
    onRetry      = () => {},
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry client errors (4xx) — they won't succeed on retry
      if (!retryOnError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error; // Exhausted all retries
      }

      // Calculate delay: baseDelay * 2^attempt, capped at maxDelay
      let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = Math.random() * delay;
      }

      onRetry({ attempt: attempt + 1, delay, error: error.message });
      console.log(\`[Retry] Attempt \${attempt + 1}/\${maxRetries}, waiting \${Math.round(delay)}ms...\`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ─── Usage: Combining Circuit Breaker + Retry ────────────────────
const paymentBreaker = new CircuitBreaker('payment-service', {
  failureThreshold: 5,
  timeout: 30_000,
  successThreshold: 3,
});

async function chargePayment(orderId, amount) {
  return paymentBreaker.call(
    // Main call with retries
    () => retryWithBackoff(
      async () => {
        const response = await fetch('http://payment-service:3000/api/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, amount }),
          signal: AbortSignal.timeout(5000), // 5s timeout per attempt
        });

        if (!response.ok) {
          const err = new Error(\`Payment failed: \${response.status}\`);
          err.status = response.status;
          throw err;
        }

        return response.json();
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: ({ attempt, delay }) => {
          console.log(\`[Payment] Retry \${attempt}, backoff \${Math.round(delay)}ms\`);
        },
      }
    ),

    // Fallback when circuit is open
    () => {
      console.log('[Payment] Circuit open — queuing for later processing');
      return { status: 'QUEUED', message: 'Payment will be processed shortly' };
    }
  );
}

// Example usage
try {
  const result = await chargePayment('order-123', 99.99);
  console.log('Payment result:', result);
} catch (err) {
  console.error('Payment failed after all retries:', err.message);
}`,
      explanation: `This example combines two essential resilience patterns:

**Circuit Breaker:**
- CLOSED state: all requests pass through. Failures are counted.
- When failures exceed the threshold (5), the circuit OPENS: all requests are immediately rejected with a fallback response (no network call).
- After a timeout (30s), the circuit moves to HALF_OPEN: one request is allowed through as a test.
- If the test request succeeds 3 times, the circuit CLOSES. If it fails, it re-OPENS.

**Retry with Exponential Backoff + Jitter:**
- Retries only on transient errors (5xx, connection refused). Client errors (4xx) are NOT retried.
- Each retry waits exponentially longer: 1s → 2s → 4s (capped at maxDelay).
- Jitter adds randomization to the delay (delay = random(0, calculatedDelay)), preventing the "thundering herd" problem where thousands of clients retry at exactly the same time.

**Combining both:** The circuit breaker wraps the retry logic. If the payment service has been failing consistently, the circuit opens and we skip retries entirely — failing fast and returning a fallback response. This prevents wasting resources on requests that are almost certain to fail.`,
      order_index: 1,
    },
    {
      title: "Event-Driven Communication with Message Broker",
      description: "Publish/subscribe messaging pattern using an event bus abstraction — demonstrates how microservices communicate asynchronously through domain events with error handling and dead letter queues.",
      language: "javascript",
      code: `// ─── Event Bus Abstraction ────────────────────────────────────────
// In production, replace with RabbitMQ (amqplib) or Kafka (kafkajs)

class EventBus {
  constructor() {
    this.subscribers = new Map();  // topic → Set<handler>
    this.deadLetterQueue = [];
    this.retryPolicy = { maxRetries: 3, baseDelay: 1000 };
  }

  // Subscribe to a topic with a handler
  subscribe(topic, handler, options = {}) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic).push({
      handler,
      group: options.group || 'default',  // consumer group
      filter: options.filter || null,      // message filter
    });
    console.log(\`[EventBus] Subscribed to "\${topic}" (group: \${options.group || 'default'})\`);
  }

  // Publish an event to a topic
  async publish(topic, event) {
    const envelope = {
      id: crypto.randomUUID(),
      topic,
      payload: event,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    console.log(\`[EventBus] Publishing to "\${topic}": \${JSON.stringify(event).slice(0, 100)}\`);

    const handlers = this.subscribers.get(topic) || [];
    if (handlers.length === 0) {
      console.warn(\`[EventBus] No subscribers for "\${topic}"\`);
      return;
    }

    // Deliver to one handler per consumer group (like Kafka consumer groups)
    const groups = new Map();
    for (const sub of handlers) {
      if (!groups.has(sub.group)) groups.set(sub.group, []);
      groups.get(sub.group).push(sub);
    }

    for (const [group, subs] of groups) {
      // Round-robin within group
      const selected = subs[Math.floor(Math.random() * subs.length)];

      // Apply filter if configured
      if (selected.filter && !selected.filter(event)) continue;

      try {
        await this.#deliverWithRetry(selected.handler, envelope, group);
      } catch (err) {
        // Send to dead letter queue after all retries exhausted
        this.deadLetterQueue.push({
          ...envelope,
          error: err.message,
          failedAt: new Date().toISOString(),
          group,
        });
        console.error(\`[EventBus] Message sent to DLQ: \${envelope.id}\`);
      }
    }
  }

  async #deliverWithRetry(handler, envelope, group) {
    const { maxRetries, baseDelay } = this.retryPolicy;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await handler(envelope.payload, {
          messageId: envelope.id,
          topic: envelope.topic,
          timestamp: envelope.timestamp,
          attempt,
        });
        return; // Success
      } catch (err) {
        if (attempt === maxRetries) throw err;

        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(\`[EventBus] Retry \${attempt + 1}/\${maxRetries} for group "\${group}": \${err.message}\`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  getDLQMessages() {
    return [...this.deadLetterQueue];
  }
}

// ─── Domain Events ────────────────────────────────────────────────
// Define clear event contracts between services

const DomainEvents = {
  ORDER_CREATED:   'order.created',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_CHARGED: 'payment.charged',
  PAYMENT_FAILED:  'payment.failed',
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_OUT_OF_STOCK: 'inventory.out_of_stock',
  NOTIFICATION_REQUESTED: 'notification.requested',
};

// ─── Service Implementations ──────────────────────────────────────
const eventBus = new EventBus();

// 🛒 Order Service: publishes events when orders are created
async function createOrder(orderData) {
  // Save order to database
  const order = {
    id: crypto.randomUUID(),
    ...orderData,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  console.log(\`[OrderService] Order created: \${order.id}\`);

  // Publish domain event (other services react)
  await eventBus.publish(DomainEvents.ORDER_CREATED, {
    orderId: order.id,
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
  });

  return order;
}

// 💳 Payment Service: listens for orders, processes payment
eventBus.subscribe(DomainEvents.ORDER_CREATED, async (event, meta) => {
  console.log(\`[PaymentService] Processing payment for order \${event.orderId}\`);

  try {
    // Simulate payment processing
    const success = Math.random() > 0.2; // 80% success rate in this demo

    if (success) {
      await eventBus.publish(DomainEvents.PAYMENT_CHARGED, {
        orderId: event.orderId,
        amount: event.totalAmount,
        transactionId: \`txn_\${Date.now()}\`,
      });
    } else {
      throw new Error('Payment declined');
    }
  } catch (err) {
    await eventBus.publish(DomainEvents.PAYMENT_FAILED, {
      orderId: event.orderId,
      reason: err.message,
    });
  }
}, { group: 'payment-service' });

// 📦 Inventory Service: listens for orders, reserves stock
eventBus.subscribe(DomainEvents.ORDER_CREATED, async (event, meta) => {
  console.log(\`[InventoryService] Reserving stock for order \${event.orderId}\`);

  for (const item of event.items) {
    console.log(\`  Reserving \${item.quantity}x \${item.productId}\`);
  }

  await eventBus.publish(DomainEvents.INVENTORY_RESERVED, {
    orderId: event.orderId,
    items: event.items,
  });
}, { group: 'inventory-service' });

// 📧 Notification Service: listens for payment results
eventBus.subscribe(DomainEvents.PAYMENT_CHARGED, async (event) => {
  console.log(\`[NotificationService] Sending confirmation for order \${event.orderId}\`);
  // Send email, SMS, push notification...
}, { group: 'notification-service' });

eventBus.subscribe(DomainEvents.PAYMENT_FAILED, async (event) => {
  console.log(\`[NotificationService] Sending payment failure alert for order \${event.orderId}\`);
}, { group: 'notification-service' });

// ─── Run the Flow ─────────────────────────────────────────────────
await createOrder({
  userId: 'user-42',
  items: [
    { productId: 'prod-1', name: 'Keyboard', quantity: 1, price: 79.99 },
    { productId: 'prod-2', name: 'Mouse', quantity: 2, price: 29.99 },
  ],
  totalAmount: 139.97,
});`,
      explanation: `This example demonstrates asynchronous event-driven communication between microservices:

**Event Bus (Message Broker Abstraction):**
- Implements publish/subscribe with consumer groups (like Kafka consumer groups — each group gets one copy of the message).
- Includes retry with exponential backoff for failed message processing.
- Failed messages go to a Dead Letter Queue (DLQ) for manual inspection and reprocessing.

**Domain Events as Contracts:**
- Events are named with a clear convention: \`entity.action\` (order.created, payment.charged).
- Each event carries only the data consumers need — no leaking internal service models.

**The Flow (Choreography Saga):**
1. Order Service creates an order and publishes ORDER_CREATED.
2. Payment Service and Inventory Service BOTH receive the event (different consumer groups) and process in parallel.
3. Payment Service publishes PAYMENT_CHARGED or PAYMENT_FAILED.
4. Notification Service reacts to payment events and notifies the user.

No service calls another directly. If Payment Service is down, its messages queue up and are processed when it recovers. The Order Service doesn't wait — it continues serving other requests.

In production, replace the EventBus class with a real broker: amqplib for RabbitMQ or kafkajs for Apache Kafka.`,
      order_index: 2,
    },
    {
      title: "Bulkhead Pattern with Request Isolation & Observability",
      description: "Implements the bulkhead pattern to isolate service calls into separate resource pools, combined with timeout management, structured logging, and basic distributed tracing via correlation IDs.",
      language: "javascript",
      code: `// ─── Bulkhead: Isolate Service Calls into Resource Pools ─────────
class Bulkhead {
  constructor(name, maxConcurrent = 10, maxQueue = 50) {
    this.name = name;
    this.maxConcurrent = maxConcurrent;
    this.maxQueue = maxQueue;
    this.activeCount = 0;
    this.queue = [];

    // Metrics
    this.metrics = {
      totalCalls: 0,
      rejected: 0,
      timeouts: 0,
      successes: 0,
      failures: 0,
    };
  }

  async execute(fn, timeoutMs = 5000) {
    this.metrics.totalCalls++;

    // Reject if both pool and queue are full
    if (this.activeCount >= this.maxConcurrent && this.queue.length >= this.maxQueue) {
      this.metrics.rejected++;
      throw new Error(\`[Bulkhead:\${this.name}] Rejected — pool exhausted (\${this.activeCount}/\${this.maxConcurrent} active, \${this.queue.length}/\${this.maxQueue} queued)\`);
    }

    // If pool is full, wait in queue
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = this.queue.indexOf(resolve);
          if (idx !== -1) this.queue.splice(idx, 1);
          this.metrics.timeouts++;
          reject(new Error(\`[Bulkhead:\${this.name}] Queue timeout after \${timeoutMs}ms\`));
        }, timeoutMs);

        this.queue.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    this.activeCount++;
    try {
      // Timeout wrapper for the actual call
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(\`[Bulkhead:\${this.name}] Call timeout after \${timeoutMs}ms\`)), timeoutMs)
        ),
      ]);
      this.metrics.successes++;
      return result;
    } catch (err) {
      this.metrics.failures++;
      throw err;
    } finally {
      this.activeCount--;
      // Release next item from queue
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }

  getMetrics() {
    return {
      name: this.name,
      active: this.activeCount,
      queued: this.queue.length,
      ...this.metrics,
    };
  }
}

// ─── Structured Logger with Trace Context ────────────────────────
class StructuredLogger {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  #log(level, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context,
    };
    // In production: send to ELK/Loki/CloudWatch
    console.log(JSON.stringify(entry));
  }

  info(msg, ctx)  { this.#log('INFO', msg, ctx); }
  warn(msg, ctx)  { this.#log('WARN', msg, ctx); }
  error(msg, ctx) { this.#log('ERROR', msg, ctx); }
}

// ─── Distributed Tracing Context ─────────────────────────────────
class TraceContext {
  constructor(traceId = null, parentSpanId = null) {
    this.traceId = traceId || crypto.randomUUID();
    this.spanId = crypto.randomUUID().slice(0, 16);
    this.parentSpanId = parentSpanId;
    this.startTime = performance.now();
    this.spans = [];
  }

  createChildSpan(operationName) {
    const span = {
      traceId: this.traceId,
      spanId: crypto.randomUUID().slice(0, 16),
      parentSpanId: this.spanId,
      operation: operationName,
      startTime: performance.now(),
      endTime: null,
      duration: null,
      tags: {},
      status: 'OK',
    };
    this.spans.push(span);
    return {
      setTag: (key, value) => { span.tags[key] = value; },
      setStatus: (status) => { span.status = status; },
      end: () => {
        span.endTime = performance.now();
        span.duration = Math.round(span.endTime - span.startTime);
      },
    };
  }

  // Headers to propagate trace context across services
  toHeaders() {
    return {
      'x-trace-id': this.traceId,
      'x-span-id': this.spanId,
    };
  }

  static fromHeaders(headers) {
    return new TraceContext(
      headers['x-trace-id'],
      headers['x-span-id']
    );
  }
}

// ─── Integration: Order Service with All Patterns ────────────────
const logger = new StructuredLogger('order-service');

// Separate bulkheads per downstream service
const paymentBulkhead  = new Bulkhead('payment-service', 20, 50);
const inventoryBulkhead = new Bulkhead('inventory-service', 15, 30);
const emailBulkhead     = new Bulkhead('email-service', 10, 100);

async function processOrder(orderData, incomingHeaders = {}) {
  const trace = TraceContext.fromHeaders(incomingHeaders);

  logger.info('Processing order', {
    traceId: trace.traceId,
    orderId: orderData.id,
    userId: orderData.userId,
  });

  // 1. Charge payment (isolated pool, 5s timeout)
  const paymentSpan = trace.createChildSpan('charge-payment');
  try {
    const payment = await paymentBulkhead.execute(async () => {
      const resp = await fetch('http://payment-service:3000/api/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...trace.toHeaders() },
        body: JSON.stringify({ orderId: orderData.id, amount: orderData.total }),
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) throw new Error(\`Payment failed: \${resp.status}\`);
      return resp.json();
    }, 5000);

    paymentSpan.setTag('transactionId', payment.transactionId);
    paymentSpan.end();

    logger.info('Payment successful', {
      traceId: trace.traceId,
      orderId: orderData.id,
      transactionId: payment.transactionId,
      duration_ms: paymentSpan.duration,
    });
  } catch (err) {
    paymentSpan.setStatus('ERROR');
    paymentSpan.end();
    logger.error('Payment failed', {
      traceId: trace.traceId,
      orderId: orderData.id,
      error: err.message,
    });
    throw err;
  }

  // 2. Reserve inventory (separate pool, 3s timeout)
  const inventorySpan = trace.createChildSpan('reserve-inventory');
  try {
    await inventoryBulkhead.execute(async () => {
      const resp = await fetch('http://inventory-service:3000/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...trace.toHeaders() },
        body: JSON.stringify({ orderId: orderData.id, items: orderData.items }),
        signal: AbortSignal.timeout(3000),
      });
      if (!resp.ok) throw new Error(\`Inventory reservation failed: \${resp.status}\`);
      return resp.json();
    }, 3000);
    inventorySpan.end();
  } catch (err) {
    inventorySpan.setStatus('ERROR');
    inventorySpan.end();
    logger.error('Inventory reservation failed', {
      traceId: trace.traceId,
      orderId: orderData.id,
      error: err.message,
    });
    throw err;
  }

  // 3. Send confirmation email (separate pool, fire-and-forget)
  emailBulkhead.execute(async () => {
    await fetch('http://email-service:3000/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...trace.toHeaders() },
      body: JSON.stringify({
        to: orderData.userEmail,
        template: 'order-confirmation',
        data: { orderId: orderData.id },
      }),
    });
  }, 3000).catch(err => {
    // Don't fail the order if email fails
    logger.warn('Email send failed (non-critical)', {
      traceId: trace.traceId,
      orderId: orderData.id,
      error: err.message,
    });
  });

  // Print bulkhead metrics (in production, export to Prometheus)
  console.log('Bulkhead metrics:', {
    payment: paymentBulkhead.getMetrics(),
    inventory: inventoryBulkhead.getMetrics(),
    email: emailBulkhead.getMetrics(),
  });
}

// Example invocation
await processOrder({
  id: 'order-789',
  userId: 'user-42',
  userEmail: 'alice@example.com',
  items: [{ productId: 'p1', qty: 2 }],
  total: 159.98,
});`,
      explanation: `This example integrates three advanced resilience and observability patterns:

**Bulkhead Pattern:**
- Each downstream service gets its own resource pool with a maximum concurrent call limit: payment (20), inventory (15), email (10).
- If one service is slow, it saturates only its own pool — other services remain unaffected.
- When the pool is full, requests queue up (up to maxQueue). If the queue is also full, requests are rejected immediately.
- Each bulkhead tracks metrics (total calls, rejected, timeouts, successes, failures) for monitoring.

**Structured Logging:**
- Every log entry is a JSON object with timestamp, level, service name, traceId, and contextual data.
- Consistent structure enables searching and filtering in tools like Elasticsearch/Kibana or Grafana Loki.

**Distributed Tracing:**
- TraceContext propagates a traceId across services via HTTP headers (x-trace-id, x-span-id).
- Each operation creates a child span with timing data, tags, and status.
- The trace allows you to see the full request path: API Gateway → Order Service → Payment Service → Stripe (and identify the bottleneck).
- In production, use the OpenTelemetry SDK instead — it auto-instruments HTTP calls, database queries, and exports to Jaeger/Zipkin/Datadog.

Notice how email sending is fire-and-forget: if it fails, we log a warning but don't fail the order. This is a common pattern for non-critical side effects.`,
      order_index: 3,
    },
  ],
};

export default examples;
