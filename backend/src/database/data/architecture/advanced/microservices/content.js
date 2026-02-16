// ============================================================================
// Microservices Architecture — Content
// ============================================================================

export const topic = {
  "name": "Microservices Architecture",
  "slug": "microservices",
  "description": "Design, build, and operate microservices — service boundaries, communication patterns, and resilience.",
  "estimated_time": 220,
  "order_index": 5
};

export const lessons = [
  {
    title: "Microservices Fundamentals",
    slug: "microservices-fundamentals",
    summary: "Understand monolith vs microservices trade-offs, service decomposition, bounded contexts, API gateways, and deployment strategies.",
    difficulty_level: "advanced",
    estimated_time: 45,
    order_index: 1,
    key_points: [
      "Microservices are small, independently deployable services organized around business capabilities",
      "Each service owns its data — database-per-service is a core principle",
      "Decompose by business capability or subdomain, not by technical layer",
      "Bounded Contexts from DDD define clear service boundaries and ownership",
      "API Gateways handle routing, authentication, rate limiting, and response aggregation",
      "BFF (Backend for Frontend) tailors APIs to specific client needs (web, mobile, IoT)",
      "Service registry and discovery enable dynamic service location without hard-coded URLs",
      "Deployment patterns (blue-green, canary, rolling) minimize downtime and risk during releases"
    ],
    content: `# Microservices Fundamentals

## 1. Monolith vs Microservices

### Comparison Table

| Dimension | Monolith | Microservices |
|---|---|---|
| **Deployment** | Single deployable unit | Independent per service |
| **Scaling** | Scale entire application | Scale individual services |
| **Data** | Single shared database | Database-per-service |
| **Teams** | One large team | Small autonomous teams (2-pizza rule) |
| **Complexity** | In the codebase | In the infrastructure |
| **Technology** | Single tech stack | Polyglot (use best tool per service) |
| **Failure** | One bug can crash everything | Failures are isolated to a service |
| **Development speed** | Fast initially, slows with growth | Slower initially, scales with organization |
| **Testing** | Simple end-to-end tests | Complex integration testing |
| **Deployment risk** | High — any change redeploys all | Low — change one service at a time |

### Pros of Microservices
- **Independent deployability** — deploy services without coordinating with other teams
- **Technology freedom** — use Python for ML, Go for high-throughput, Node.js for real-time
- **Fault isolation** — a crashing recommendation engine doesn't take down checkout
- **Scalability** — scale the hot path (e.g., search) independently of cold paths
- **Team autonomy** — teams own services end-to-end (you build it, you run it)

### Cons of Microservices
- **Distributed system complexity** — network failures, partial failures, eventual consistency
- **Operational overhead** — monitoring, logging, and tracing across dozens of services
- **Data consistency** — no more simple JOINs across service boundaries
- **Testing complexity** — contract testing, integration environments, end-to-end testing
- **Latency** — network hops add latency compared to in-process calls

---

## 2. When to Use Microservices (and When NOT to)

### ✅ Use Microservices When:
- Your **team is large** (50+ engineers) and needs autonomous squads
- Different parts of the system have **different scaling needs**
- You need **independent deployment** for rapid iteration
- The **domain is well-understood** with clear boundaries
- You have **mature DevOps** capabilities (CI/CD, monitoring, containerization)

### ❌ Do NOT Use Microservices When:
- You're a **small team** (< 10 engineers) — the overhead will slow you down
- The product is a **new/unproven idea** — domain boundaries are unclear
- You lack **DevOps maturity** — no CI/CD, no container orchestration, no monitoring
- **Performance is critical** and you cannot tolerate network latency between services
- Strong **data consistency** (ACID transactions) is required across multiple entities

> **Interview Tip:** "Start with a well-structured monolith. Extract services when the organizational pain of coordinating deployments exceeds the technical pain of managing distributed systems." — Martin Fowler's Monolith First approach.

---

## 3. Service Decomposition Strategies

### Strategy 1: Decompose by Business Capability

Business capabilities are what the organization does to generate value:

\`\`\`
E-Commerce Platform — Business Capabilities
├── 🛒 Order Management    → create, update, cancel orders
├── 💳 Payment Processing  → charge, refund, payment methods
├── 📦 Inventory           → stock levels, reservations, fulfillment
├── 👤 Identity & Access   → registration, auth, profiles
├── 📧 Notifications       → email, SMS, push notifications
├── 🔍 Product Search      → catalog search, filtering, ranking
├── 📊 Analytics           → user behavior, sales reports
└── 🚚 Shipping            → carrier integration, tracking, rates
\`\`\`

### Strategy 2: Decompose by Subdomain (DDD)

Domain-Driven Design identifies three types of subdomains:

| Subdomain Type | Description | Example | Strategy |
|---|---|---|---|
| **Core** | Competitive advantage | Recommendation engine, pricing | Build in-house, invest heavily |
| **Supporting** | Necessary but not differentiating | Order management | Build or buy |
| **Generic** | Commodity | Authentication, email sending | Buy / use SaaS |

### How to Identify Service Boundaries

1. **Event Storming** — map domain events with sticky notes (orange = event, blue = command, yellow = aggregate)
2. **Look for nouns** — "Order", "Payment", "User" suggest bounded contexts
3. **Look for organizational boundaries** — teams that work independently suggest service boundaries
4. **Look for different rates of change** — search may change weekly, auth monthly
5. **Look for different scaling needs** — search handles 10,000 req/s, orders 100 req/s

---

## 4. Bounded Contexts (from Domain-Driven Design)

A Bounded Context defines the boundary within which a particular domain model applies. The same word can mean different things in different contexts:

\`\`\`
"Product" in Different Bounded Contexts:

📦 Catalog Context:     { id, name, description, images, price, category }
🛒 Order Context:       { id, name, quantity, unitPrice }
📦 Inventory Context:   { id, sku, warehouseId, stockLevel }
🚚 Shipping Context:    { id, weight, dimensions, fragile }
\`\`\`

### Context Mapping Relationships

| Relationship | Description |
|---|---|
| **Shared Kernel** | Two contexts share a small common model (tight coupling — use sparingly) |
| **Customer-Supplier** | Upstream (supplier) provides data; downstream (customer) consumes it |
| **Conformist** | Downstream conforms to upstream's model (no negotiation) |
| **Anti-Corruption Layer** | Downstream translates upstream's model to its own (prevents model pollution) |
| **Open Host Service** | Upstream publishes a well-defined API for multiple consumers |
| **Published Language** | Shared standard (e.g., JSON Schema, Protobuf) used for communication |

> **Interview Tip:** An Anti-Corruption Layer is critical when integrating with legacy systems. It translates external models into your domain model, preventing legacy concepts from leaking into your clean architecture.

---

## 5. Database-Per-Service Pattern

Each microservice owns its database — **no sharing**.

\`\`\`
✅ Correct: Database Per Service
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Order   │   │ Payment  │   │ Inventory│
│ Service  │   │ Service  │   │ Service  │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
   ┌─┴─┐          ┌─┴─┐          ┌─┴─┐
   │ DB │          │ DB │          │ DB │
   │Postgres│     │Stripe│       │Redis │
   └───┘          └───┘          └───┘

❌ Wrong: Shared Database
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Order   │   │ Payment  │   │ Inventory│
│ Service  │   │ Service  │   │ Service  │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                  ┌─┴─┐
                  │ DB │  ← coupling!
                  └───┘
\`\`\`

### Benefits
- **Technology freedom** — use PostgreSQL for orders, Redis for inventory, Elasticsearch for search
- **Independent scaling** — scale the database with the service
- **Loose coupling** — schema changes don't break other services
- **Independent deployment** — migrate your DB without coordinating

### Challenge: Cross-Service Queries
Without JOINs, you must use **API composition** or **CQRS** to aggregate data across services (covered in Lesson 2).

---

## 6. API Gateway Pattern

The API Gateway is the **single entry point** for all clients:

\`\`\`
┌─────────┐  ┌──────────┐  ┌──────────┐
│  Web    │  │  Mobile  │  │  IoT     │
│  App    │  │  App     │  │ Device   │
└────┬────┘  └────┬─────┘  └────┬─────┘
     │            │             │
     └────────────┼─────────────┘
                  │
           ┌──────┴──────┐
           │  API Gateway │  ← routing, auth, rate limit
           └──────┬──────┘
       ┌──────────┼──────────┐
  ┌────┴────┐ ┌───┴───┐ ┌───┴────┐
  │  User   │ │ Order │ │Product │
  │ Service │ │Service│ │Service │
  └─────────┘ └───────┘ └────────┘
\`\`\`

### Gateway Responsibilities

| Responsibility | Description |
|---|---|
| **Routing** | Forward /api/users to User Service, /api/orders to Order Service |
| **Authentication** | Validate JWT tokens before forwarding requests |
| **Rate Limiting** | Prevent abuse (e.g., 200 requests/minute per client) |
| **Response Aggregation** | Combine data from multiple services into one response |
| **SSL Termination** | Handle HTTPS at the gateway, use HTTP internally |
| **Caching** | Cache frequent responses to reduce backend load |
| **Load Balancing** | Distribute requests across service instances |
| **Circuit Breaking** | Stop forwarding to unhealthy services |

### Popular API Gateways
- **Kong** — open-source, plugin-based, built on NGINX
- **AWS API Gateway** — serverless, managed, pay-per-request
- **NGINX / Envoy** — lightweight, high-performance reverse proxies
- **Traefik** — auto-discovery, integrates with Docker/Kubernetes

---

## 7. BFF (Backend for Frontend)

Different clients need different API shapes:

\`\`\`
┌───────────┐    ┌──────────────┐
│  Web App  ├───►│  Web BFF     │──┐
└───────────┘    └──────────────┘  │
                                   ├──► Microservices
┌───────────┐    ┌──────────────┐  │
│ Mobile App├───►│  Mobile BFF  │──┘
└───────────┘    └──────────────┘
\`\`\`

| Concern | Web BFF | Mobile BFF |
|---|---|---|
| Payload size | Rich, detailed responses | Minimal, bandwidth-optimized |
| Image URLs | High-res desktop images | Device-appropriate thumbnails |
| Pagination | 50 items per page | 10 items (infinite scroll) |
| Auth | Cookie-based sessions | JWT with refresh tokens |
| Features | Full admin panels | Core user features only |

> **Interview Tip:** BFF prevents "one-size-fits-all" API bloat. Each frontend team owns their BFF and can evolve it independently without affecting other clients.

---

## 8. Service Registry & Discovery

In a dynamic environment (containers, auto-scaling), service locations change constantly:

### Client-Side Discovery

\`\`\`
┌──────────┐  1. Query registry  ┌──────────────┐
│  Order   ├─────────────────────►│   Service    │
│ Service  │◄─────────────────────┤   Registry   │
└────┬─────┘  2. Get addresses    │ (Consul/Eureka)│
     │                            └──────────────┘
     │  3. Call directly + load balance
     ▼
┌──────────┐ ┌──────────┐
│ Payment  │ │ Payment  │
│ :3001    │ │ :3002    │
└──────────┘ └──────────┘
\`\`\`

### Server-Side Discovery (Kubernetes)

\`\`\`
┌──────────┐           ┌──────────────┐
│  Order   ├──────────►│ Load Balancer│
│ Service  │           │ (K8s Service)│
└──────────┘           └──────┬───────┘
                        ┌─────┼─────┐
                   ┌────┴─┐ ┌┴────┐ ┌┴────┐
                   │Pod 1 │ │Pod 2│ │Pod 3│
                   └──────┘ └─────┘ └─────┘
\`\`\`

| Approach | Pros | Cons | Example |
|---|---|---|---|
| **Client-side** | No extra hop, flexible LB | Client complexity | Netflix Eureka |
| **Server-side** | Simpler clients | Extra network hop | Kubernetes Services |
| **DNS-based** | Simple, standard | TTL caching delays | AWS Cloud Map |

---

## 9. Docker Containerization Basics

Containers package application code + dependencies into a portable, reproducible unit:

\`\`\`dockerfile
# Multi-stage build — keeps final image small
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/server.js"]
\`\`\`

### Docker Compose for Local Development

\`\`\`yaml
version: "3.9"
services:
  order-service:
    build: ./services/order
    ports: ["3001:3000"]
    environment:
      - DATABASE_URL=postgres://db:5432/orders
      - PAYMENT_SERVICE_URL=http://payment-service:3000
    depends_on:
      db:
        condition: service_healthy

  payment-service:
    build: ./services/payment
    ports: ["3002:3000"]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
\`\`\`

---

## 10. Deployment Patterns

### Blue-Green Deployment

\`\`\`
Traffic ──► Load Balancer
              │
        ┌─────┴─────┐
        ▼            ▼
   ┌────────┐   ┌────────┐
   │  BLUE  │   │ GREEN  │
   │ (live) │   │ (new)  │
   └────────┘   └────────┘
   
1. Deploy new version to GREEN
2. Run smoke tests on GREEN
3. Switch load balancer to GREEN
4. BLUE becomes standby (instant rollback)
\`\`\`

### Canary Deployment

\`\`\`
Traffic ──► Load Balancer
              │
        ┌─────┴─────┐
        │95%         │5%
        ▼            ▼
   ┌────────┐   ┌────────┐
   │  v1.0  │   │  v1.1  │ ← canary
   │(stable)│   │ (new)  │
   └────────┘   └────────┘

1. Route 5% of traffic to new version
2. Monitor error rates, latency, business metrics
3. Gradually increase (10%, 25%, 50%, 100%)
4. Roll back instantly if metrics degrade
\`\`\`

### Rolling Update (Kubernetes Default)

\`\`\`
Step 1: [v1] [v1] [v1] [v1]     ← 4 pods running v1
Step 2: [v1] [v1] [v1] [v2]     ← 1 pod updated to v2
Step 3: [v1] [v1] [v2] [v2]     ← 2 pods updated
Step 4: [v1] [v2] [v2] [v2]     ← 3 pods updated
Step 5: [v2] [v2] [v2] [v2]     ← all pods on v2
\`\`\`

| Pattern | Zero Downtime | Rollback Speed | Resource Cost | Risk |
|---|---|---|---|---|
| **Blue-Green** | ✅ | Instant (switch LB) | 2x (two full environments) | Low |
| **Canary** | ✅ | Fast (route away) | Low (few canary instances) | Very low |
| **Rolling** | ✅ | Slow (roll forward) | Low (in-place) | Medium |

> **Interview Tip:** Blue-green gives the fastest rollback but costs the most. Canary gives the best risk management. Rolling is the simplest and is Kubernetes' default strategy.
`,
  },
  {
    title: "Service Communication & Resilience",
    slug: "service-communication-resilience",
    summary: "Master synchronous and asynchronous communication, resilience patterns, and observability for production microservices.",
    difficulty_level: "advanced",
    estimated_time: 45,
    order_index: 2,
    key_points: [
      "Synchronous communication (REST, gRPC) is simple but creates temporal coupling between services",
      "Asynchronous communication (message brokers) decouples services and improves resilience",
      "RabbitMQ excels at task distribution; Kafka excels at event streaming and replay",
      "CQRS separates read and write models for optimized query performance at scale",
      "Circuit breaker prevents cascading failures by failing fast when a downstream service is unhealthy",
      "Retry with exponential backoff and jitter prevents thundering herd on recovering services",
      "Bulkhead pattern isolates failures to a subset of resources, preventing total system collapse",
      "Observability (structured logging, metrics, distributed tracing) is essential for debugging in production"
    ],
    content: `# Service Communication & Resilience

## 1. Synchronous vs Asynchronous Communication

| Aspect | Synchronous | Asynchronous |
|---|---|---|
| **Mechanism** | HTTP/gRPC direct call | Message broker (queue/topic) |
| **Coupling** | Temporal — caller waits | Decoupled — fire and forget |
| **Availability** | Both services must be up | Producer works even if consumer is down |
| **Latency** | Adds up (A→B→C = sum of all) | Non-blocking, eventual |
| **Debugging** | Simple request/response traces | Harder — trace through broker |
| **Use case** | Queries, real-time reads | Events, commands, long tasks |
| **Failure mode** | Cascading failures | Messages queue up, retry later |

### When to Use Each

\`\`\`
Synchronous (Request/Response):
  ✅ "Get user profile"    → client needs data NOW
  ✅ "Validate payment"    → must know result immediately
  ✅ "Check inventory"     → real-time stock check

Asynchronous (Event/Message):
  ✅ "Order placed"        → notify inventory, email, analytics
  ✅ "Process payment"     → long-running, retryable
  ✅ "Generate report"     → background job, eventual delivery
  ✅ "Update search index" → eventual consistency is fine
\`\`\`

---

## 2. REST vs gRPC

### REST (Representational State Transfer)

\`\`\`
GET /api/users/123  HTTP/1.1
Accept: application/json

Response:
{ "id": 123, "name": "Alice", "email": "alice@example.com" }
\`\`\`

### gRPC (Google Remote Procedure Call)

\`\`\`protobuf
// user.proto
syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);  // server streaming
}

message GetUserRequest {
  int32 id = 1;
}

message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
}
\`\`\`

### Comparison Table

| Feature | REST | gRPC |
|---|---|---|
| **Protocol** | HTTP/1.1 (text-based) | HTTP/2 (binary framing) |
| **Format** | JSON (human-readable) | Protobuf (binary, compact) |
| **Performance** | Good | 2-10x faster serialization |
| **Streaming** | Limited (SSE, WebSocket) | Native bidirectional streaming |
| **Browser support** | Native | Requires gRPC-Web proxy |
| **Code generation** | Optional (OpenAPI) | Built-in from .proto files |
| **Best for** | Public APIs, web clients | Internal service-to-service |
| **Debugging** | Easy (curl, Postman) | Harder (need gRPC tools) |

> **Interview Tip:** Use REST for public-facing APIs and gRPC for internal service-to-service communication where performance matters. Many companies (Google, Netflix, Uber) use gRPC internally.

---

## 3. Message Brokers: RabbitMQ vs Kafka

### RabbitMQ — Smart Broker, Simple Consumers

\`\`\`
Producer ──► Exchange ──► Queue ──► Consumer
                │
                ├──► Queue A ──► Consumer Group 1
                └──► Queue B ──► Consumer Group 2

Routing strategies:
  • Direct:  route by exact routing key
  • Topic:   route by pattern (order.* , *.created)
  • Fanout:  broadcast to all bound queues
  • Headers: route by message headers
\`\`\`

### Kafka — Dumb Broker, Smart Consumers

\`\`\`
Producer ──► Topic ──► Partition 0: [msg1][msg2][msg3][msg4]
                  ├──► Partition 1: [msg5][msg6][msg7]
                  └──► Partition 2: [msg8][msg9]

Consumer Group A:  Consumer1 reads P0, Consumer2 reads P1+P2
Consumer Group B:  Consumer3 reads ALL partitions (independent)

Key difference: messages are RETAINED (not deleted after consumption)
\`\`\`

### Comparison

| Feature | RabbitMQ | Kafka |
|---|---|---|
| **Model** | Message queue (push) | Event log (pull) |
| **Message retention** | Deleted after ACK | Retained for configured period |
| **Ordering** | Per queue (FIFO) | Per partition |
| **Throughput** | ~50K msg/s | ~1M+ msg/s |
| **Replay** | ❌ Cannot replay consumed messages | ✅ Consumers can seek to any offset |
| **Use case** | Task distribution, work queues, RPC | Event sourcing, stream processing, logs |
| **Routing** | Flexible (exchange types) | Topic + partition key |
| **Delivery** | At-most-once, at-least-once | At-least-once, exactly-once (with txn) |

### When to Choose

- **RabbitMQ**: Background jobs, task queues, email sending, simple pub/sub
- **Kafka**: Event sourcing, audit logs, stream processing, high-throughput analytics, cross-team data sharing

---

## 4. API Composition Pattern

When a query needs data from multiple services, an **API Composer** aggregates responses:

\`\`\`
Client
  │
  ▼
┌─────────────────┐
│  API Composer   │  (could be API Gateway or BFF)
│  /api/dashboard │
└───┬──────┬──────┘
    │      │      │
    ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐
│ User ││Order ││Stats │
│  Svc ││  Svc ││  Svc │
└──────┘└──────┘└──────┘

// Parallel calls with timeout
const [user, orders, stats] = await Promise.allSettled([
  userService.getProfile(userId),     // 50ms
  orderService.getRecent(userId),     // 120ms
  statsService.getSummary(userId),    // 80ms
]);
// Total: ~120ms (parallel) vs ~250ms (sequential)
\`\`\`

### Challenges
- **Increased latency** — must wait for slowest service
- **Partial failures** — what if one service fails? Return partial data or error?
- **Data consistency** — data may be stale across services

---

## 5. CQRS (Command Query Responsibility Segregation)

Separate the **write model** (commands) from the **read model** (queries):

\`\`\`
                    ┌───────────────┐
  Commands ────────►│  WRITE Model  │──► Events ──► Event Store
  (Create, Update)  │  (normalized) │              │
                    └───────────────┘              │
                                                   ▼
                    ┌───────────────┐         ┌─────────────┐
  Queries ─────────►│  READ Model   │◄────────│  Projector  │
  (List, Search)    │(denormalized) │         │(builds views)│
                    └───────────────┘         └─────────────┘
\`\`\`

### Why CQRS?

| Concern | Without CQRS | With CQRS |
|---|---|---|
| **Write model** | Compromised for read performance | Optimized for writes (normalized) |
| **Read model** | Slow JOINs on normalized data | Pre-computed denormalized views |
| **Scaling** | Scale reads and writes together | Scale independently |
| **Complexity** | Lower | Higher (eventual consistency) |

### Example: Order Dashboard

\`\`\`
Write side: OrderService.createOrder(orderData)
  → Stores normalized order in PostgreSQL
  → Publishes "OrderCreated" event

Read side: Event handler listens for "OrderCreated"
  → Builds denormalized view in Redis/Elasticsearch
  → { orderId, customerName, items, totalAmount, status }

Dashboard query: Direct read from denormalized view (fast!)
\`\`\`

> **Interview Tip:** CQRS adds significant complexity. Only use it when read and write loads are drastically different or when you need event sourcing. Most CRUD apps don't need it.

---

## 6. Eventual Consistency

In microservices, **strong consistency** (ACID across services) is impractical. Instead, we accept **eventual consistency**:

\`\`\`
1. User places order (Order Service)
2. Order Service publishes "OrderPlaced" event
3. Payment Service processes payment (may take seconds)
4. Inventory Service reserves stock (may take seconds)
5. Email Service sends confirmation

During steps 3-5, the system is temporarily inconsistent:
  - Order exists but payment not yet processed
  - Stock not yet reserved
  - This is FINE — it converges to consistency
\`\`\`

### Saga Pattern for Distributed Transactions

\`\`\`
Order Saga (Choreography):

  OrderCreated ──► PaymentCharged ──► InventoryReserved ──► OrderConfirmed
       │                │                    │
       │           PaymentFailed        OutOfStock
       │                │                    │
       ▼                ▼                    ▼
  (compensate)    RefundPayment       ReleaseInventory
                                     CancelOrder
\`\`\`

| Saga Style | How It Works | Pros | Cons |
|---|---|---|---|
| **Choreography** | Each service publishes events, others react | Decoupled, simple | Hard to track flow |
| **Orchestration** | Central orchestrator directs the saga | Easy to understand | Orchestrator is a coupling point |

---

## 7. Circuit Breaker Pattern

Prevent cascading failures when a downstream service is unhealthy:

\`\`\`
          ┌──────── CLOSED ────────┐
          │  (normal operation)     │
          │  Passes all requests    │
          │  Tracks failure count   │
          └──────────┬─────────────┘
                     │ failures > threshold
                     ▼
          ┌──────── OPEN ──────────┐
          │  (fail fast)           │
          │  Rejects all requests  │
          │  Returns fallback      │
          └──────────┬─────────────┘
                     │ after timeout period
                     ▼
          ┌──────── HALF-OPEN ─────┐
          │  (testing recovery)    │
          │  Allows ONE request    │
          │  Success → CLOSED      │
          │  Failure → OPEN        │
          └────────────────────────┘
\`\`\`

### Configuration Parameters

| Parameter | Description | Typical Value |
|---|---|---|
| **Failure threshold** | Number of failures before opening | 5 failures |
| **Timeout** | Time circuit stays open before testing | 30 seconds |
| **Success threshold** | Successes needed in half-open to close | 3 successes |
| **Monitored exceptions** | Which errors count as failures | 5xx, timeouts, connection refused |

### Fallback Strategies
- **Cached data** — return last known good response
- **Default value** — return a sensible default
- **Degraded response** — return partial data
- **Queue for later** — save request and process when service recovers

---

## 8. Retry with Exponential Backoff & Jitter

\`\`\`
Without backoff:   [retry][retry][retry][retry]  ← hammers the service
With backoff:      [retry]...[retry]......[retry]............[retry]

Exponential backoff formula:
  delay = baseDelay × 2^attempt

  Attempt 1: 1s
  Attempt 2: 2s
  Attempt 3: 4s
  Attempt 4: 8s
  Attempt 5: 16s (cap at maxDelay)

With jitter (randomization):
  delay = random(0, baseDelay × 2^attempt)
  
  Prevents "thundering herd" when many clients retry at the same time
\`\`\`

### Retry Decision Matrix

| Error Type | Retry? | Reason |
|---|---|---|
| **500 Internal Server Error** | ✅ Yes | Transient failure, may succeed on retry |
| **503 Service Unavailable** | ✅ Yes | Service temporarily overloaded |
| **429 Too Many Requests** | ✅ Yes | Wait for Retry-After header |
| **408 Request Timeout** | ✅ Yes | Network issue, try again |
| **400 Bad Request** | ❌ No | Client error, retrying won't help |
| **401 Unauthorized** | ❌ No | Invalid credentials |
| **404 Not Found** | ❌ No | Resource doesn't exist |
| **409 Conflict** | ⚠️ Maybe | Depends: idempotent operations can retry |

> **Interview Tip:** Always make operations **idempotent** before adding retries. Use idempotency keys to prevent duplicate side effects (e.g., charging a customer twice).

---

## 9. Bulkhead & Timeout Patterns

### Bulkhead Pattern

Inspired by ship bulkheads that prevent a single hull breach from sinking the entire ship:

\`\`\`
Without Bulkhead:
┌─────────────────────────────────────┐
│  Shared Thread Pool (100 threads)   │
│  Service A calls ████████████████   │ ← Service A is slow,
│  Service B calls                    │    starves Service B
│  Service C calls                    │    and Service C
└─────────────────────────────────────┘

With Bulkhead:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Pool A (40)  │ │ Pool B (30)  │ │ Pool C (30)  │
│ ████████████ │ │ ██           │ │ ███          │
│ (saturated)  │ │ (healthy)    │ │ (healthy)    │
└──────────────┘ └──────────────┘ └──────────────┘
Service A is slow but B and C are unaffected
\`\`\`

### Timeout Pattern

\`\`\`
Client ──► Service A ──► Service B ──► Service C
            3s timeout     2s timeout    1s timeout

Rule: Each hop should have a SHORTER timeout than its caller
  - Prevents request pileup
  - Fails fast at the source of the problem

Best practice:
  - Set aggressive timeouts (e.g., P99 latency × 2)
  - Combine with circuit breaker for persistent failures
  - Log all timeouts for capacity planning
\`\`\`

---

## 10. Health Checks

Every microservice should expose health endpoints:

\`\`\`
GET /health/live    → Am I running?      (Kubernetes liveness)
GET /health/ready   → Can I serve traffic? (Kubernetes readiness)

Liveness: { "status": "UP" }
  → If DOWN, container is restarted

Readiness: {
  "status": "UP",
  "checks": {
    "database": "UP",
    "redis":    "UP",
    "kafka":    "UP"
  }
}
  → If DOWN, removed from load balancer (no traffic)
\`\`\`

| Check Type | Purpose | Action on Failure |
|---|---|---|
| **Liveness** | Is the process healthy? | Restart container |
| **Readiness** | Can it serve requests? | Remove from load balancer |
| **Startup** | Has initialization completed? | Wait (don't restart yet) |

---

## 11. Observability: Logging, Metrics, Distributed Tracing

### The Three Pillars of Observability

\`\`\`
┌──────────────────────────────────────────┐
│              OBSERVABILITY               │
├──────────────┬────────────┬──────────────┤
│   LOGGING    │  METRICS   │   TRACING    │
│ (what?)      │ (how much?)│ (where?)     │
│              │            │              │
│ Structured   │ Counters   │ Spans across │
│ JSON logs    │ Gauges     │ services     │
│ Correlation  │ Histograms │ OpenTelemetry│
│ IDs          │ Prometheus │ Jaeger/Zipkin│
│ ELK/Loki    │ Grafana    │              │
└──────────────┴────────────┴──────────────┘
\`\`\`

### Structured Logging

\`\`\`json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "ERROR",
  "service": "order-service",
  "traceId": "abc123def456",
  "spanId": "span789",
  "userId": "user-42",
  "orderId": "order-99",
  "message": "Payment failed",
  "error": "PaymentGatewayTimeout",
  "duration_ms": 5023
}
\`\`\`

### Key Metrics (RED Method)

| Metric | What It Measures | Alert Threshold |
|---|---|---|
| **Rate** | Requests per second | Sudden drop or spike |
| **Errors** | Error rate (%) | > 1% error rate |
| **Duration** | Request latency (P50, P95, P99) | P99 > 500ms |

### Distributed Tracing with OpenTelemetry

\`\`\`
Trace ID: abc-123
│
├── Span: API Gateway (12ms)
│   └── Span: Order Service (45ms)
│       ├── Span: PostgreSQL query (8ms)
│       ├── Span: Payment Service (120ms)  ← bottleneck!
│       │   └── Span: Stripe API (95ms)
│       └── Span: Kafka publish (3ms)
│
Total: 178ms
\`\`\`

> **Interview Tip:** Every log line and every request should include a \`traceId\` that correlates across all services in a request. This is the single most important thing for debugging production issues.

---

## 12. Service Mesh Overview

A **service mesh** is an infrastructure layer that handles service-to-service communication:

\`\`\`
Without Service Mesh:
┌──────────┐        ┌──────────┐
│ Service A│◄──────►│ Service B│   Each service implements:
│ + retry  │        │ + retry  │   - retries, circuit breakers
│ + circuit│        │ + circuit│   - mTLS, auth
│ + tracing│        │ + tracing│   - load balancing
└──────────┘        └──────────┘   Code duplication!

With Service Mesh (Istio/Linkerd):
┌───────────────┐        ┌───────────────┐
│ ┌───────────┐ │        │ ┌───────────┐ │
│ │ Service A │ │        │ │ Service B │ │  Services contain
│ │ (just     │ │        │ │ (just     │ │  ONLY business logic
│ │  business │ │        │ │  business │ │
│ │  logic)   │ │        │ │  logic)   │ │
│ └─────┬─────┘ │        │ └─────┬─────┘ │
│ ┌─────┴─────┐ │        │ ┌─────┴─────┐ │
│ │  Sidecar  │◄├────────├►│  Sidecar  │ │
│ │  Proxy    │ │        │ │  Proxy    │ │  Sidecar handles ALL
│ │ (Envoy)   │ │        │ │ (Envoy)   │ │  networking concerns
│ └───────────┘ │        │ └───────────┘ │
└───────────────┘        └───────────────┘
\`\`\`

### What a Service Mesh Provides

| Feature | Description |
|---|---|
| **Traffic management** | Retries, timeouts, circuit breaking, canary routing |
| **Security** | Mutual TLS (mTLS) between all services automatically |
| **Observability** | Distributed tracing, metrics, access logs — zero code changes |
| **Traffic splitting** | Route 5% to canary, A/B testing |
| **Rate limiting** | Enforce per-service rate limits |

### Popular Service Meshes

| Mesh | Proxy | Best For |
|---|---|---|
| **Istio** | Envoy | Feature-rich, Kubernetes-native |
| **Linkerd** | linkerd2-proxy (Rust) | Lightweight, simple, fast |
| **Consul Connect** | Envoy or built-in | Multi-platform (not just K8s) |

> **Interview Tip:** A service mesh is overkill for fewer than ~10 services. The operational complexity of running the mesh itself must be justified by the networking complexity it eliminates.
`,
  },
];
