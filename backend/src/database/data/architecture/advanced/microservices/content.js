// ============================================================================
// Microservices Architecture — Content
// ============================================================================

export const topic = {
  "name": "Microservices Architecture",
  "slug": "microservices",
  "description": "Design, build, and operate microservices — service decomposition, API gateways, service mesh, and inter-service communication.",
  "estimated_time": 260,
  "order_index": 5
};

export const lessons = [
  {
    title: "Microservices Fundamentals",
    slug: "microservices-fundamentals",
    summary: "Understand microservices principles, service decomposition strategies, and when monoliths are better.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "Microservices: small, independently deployable services organized around business capabilities",
  "Each service owns its data — no shared database!",
  "Services communicate via APIs (sync) or events (async)",
  "Decompose by business capability (orders, payments, inventory) — not by technical layer",
  "Start with a monolith; extract services when complexity demands it"
],
    content: `# Microservices Fundamentals

## Monolith vs Microservices

| | Monolith | Microservices |
|---|---|---|
| Deployment | Single unit | Independent per service |
| Scaling | All-or-nothing | Scale individual services |
| Data | Shared database | Database-per-service |
| Team | One large team | Small teams per service |
| Complexity | In code | In infrastructure |
| Best for | Small teams, new products | Large teams, mature products |

## Service Decomposition

\`\`\`
E-Commerce Platform
├── 🛒 Order Service        → manages orders, checkout
├── 💳 Payment Service      → processes payments, refunds
├── 📦 Inventory Service    → tracks stock, reservations
├── 👤 User Service         → auth, profiles, preferences
├── 📧 Notification Service → email, SMS, push
├── 🔍 Search Service       → product search (Elasticsearch)
└── 📊 Analytics Service    → tracking, reporting
\`\`\`

### Decomposition Strategies

1. **By business capability**: Order, Payment, Shipping → matches org structure
2. **By subdomain** (DDD): Core, Supporting, Generic subdomains
3. **Strangler Fig**: Gradually extract from monolith

## Database Per Service

\`\`\`
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Order    │  │ Payment  │  │ User     │
│ Service  │  │ Service  │  │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│ OrderDB  │  │PaymentDB │  │ UserDB   │
│(Postgres)│  │(Postgres)│  │ (Mongo)  │
└──────────┘  └──────────┘  └──────────┘
\`\`\`

> Each service chooses the best database for its needs. Order Service might use PostgreSQL for transactions, while Search Service uses Elasticsearch.

## Inter-Service Communication

### Synchronous (Request/Response)
\`\`\`javascript
// REST call from Order Service to User Service
const user = await fetch(\`http://user-service:3001/api/users/\${userId}\`);
\`\`\`

### Asynchronous (Event-Based)
\`\`\`javascript
// Order Service publishes event
await messageBroker.publish('order.placed', {
  orderId: '123',
  items: [...],
  total: 99.99,
});

// Payment Service subscribes
messageBroker.subscribe('order.placed', async (event) => {
  await processPayment(event.data);
});
\`\`\`

## When NOT to Use Microservices

- Small team (< 5 developers)
- New product with unclear domain boundaries
- Low traffic that doesn't need independent scaling
- When the team lacks DevOps/infra expertise

> **"If you can't build a well-structured monolith, what makes you think microservices are the answer?"** — Simon Brown
`,
  },
  {
    title: "Service Communication & Resilience",
    slug: "service-communication-resilience",
    summary: "Handle inter-service communication failures with retries, circuit breakers, timeouts, and fallback strategies.",
    difficulty_level: "advanced",
    estimated_time: 35,
    order_index: 2,
    key_points: [
  "Network calls WILL fail — design for failure from day one",
  "Timeouts prevent one slow service from blocking the whole system",
  "Retries with exponential backoff handle transient failures",
  "Circuit breakers stop cascading failures across services",
  "Fallbacks provide degraded but functional responses when a service is down"
],
    content: `# Service Communication & Resilience

## The Fallacies of Distributed Computing

1. The network is NOT reliable
2. Latency is NOT zero
3. Bandwidth is NOT infinite
4. The network is NOT secure

## Resilience Patterns

### 1. Timeouts

\`\`\`javascript
// AbortController for fetch timeout
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}
\`\`\`

### 2. Retry with Exponential Backoff

\`\`\`javascript
async function withRetry(fn, { maxRetries = 3, baseDelay = 1000 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(\`Retry \${attempt + 1}/\${maxRetries} in \${delay.toFixed(0)}ms\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Usage
const user = await withRetry(
  () => fetchWithTimeout('http://user-service/api/users/42', 3000),
  { maxRetries: 3, baseDelay: 500 }
);
\`\`\`

### 3. Fallbacks

\`\`\`javascript
async function getUserWithFallback(userId) {
  try {
    // Try primary source
    return await userService.getUser(userId);
  } catch (error) {
    console.warn('User service unavailable, using cache:', error.message);
    // Fallback to cached data
    const cached = await cache.get(\`user:\${userId}\`);
    if (cached) return { ...cached, _stale: true };
    // If no cache, return minimal data
    return { id: userId, name: 'Unknown User', _unavailable: true };
  }
}
\`\`\`

### 4. Bulkhead Pattern

Isolate failures so one failing service doesn't consume all resources:

\`\`\`javascript
import pLimit from 'p-limit';

// Each service gets its own concurrency limit
const userServiceLimit = pLimit(10);      // Max 10 concurrent calls
const paymentServiceLimit = pLimit(5);    // Max 5 concurrent calls
const inventoryServiceLimit = pLimit(20); // Max 20 concurrent calls

// If user service is slow, it can't exhaust all connections
const user = await userServiceLimit(() => fetchUser(userId));
const payment = await paymentServiceLimit(() => chargePayment(data));
\`\`\`
`,
  },
];
