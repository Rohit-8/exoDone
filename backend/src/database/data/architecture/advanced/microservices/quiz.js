// ============================================================================
// Microservices Architecture — Quiz Questions
// ============================================================================

const quiz = {
  'microservices-fundamentals': [
    {
      question_text: "What is the primary reason for the 'database-per-service' pattern in microservices?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It is cheaper to run multiple small databases",
        "It ensures loose coupling — services can evolve their schemas independently without breaking others",
        "It improves query performance with JOINs across services",
        "It is required by Docker and Kubernetes"
      ]),
      correct_answer: "It ensures loose coupling — services can evolve their schemas independently without breaking others",
      explanation: "Database-per-service ensures loose coupling between services. Each service owns its data and can change its schema, switch database technologies (PostgreSQL → MongoDB), or scale independently. Other services access data through APIs, never through direct database queries. The trade-off is that cross-service queries become harder (requiring API composition or CQRS).",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "When should you NOT use microservices?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "When your team has 200+ engineers working on the same product",
        "When different parts of the system have very different scaling needs",
        "When you're building a new product with unclear domain boundaries and a small team",
        "When you need independent deployment of different features"
      ]),
      correct_answer: "When you're building a new product with unclear domain boundaries and a small team",
      explanation: "Microservices add significant operational complexity (CI/CD, monitoring, distributed tracing, networking). For a small team building a new product, the domain boundaries are often unclear. Starting with a well-structured monolith lets you discover the right boundaries first, then extract services when the organizational pain of coordinating deployments justifies the infrastructure complexity. This is Martin Fowler's 'Monolith First' approach.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "In Domain-Driven Design, what is a Bounded Context?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A security boundary that limits API access",
        "A boundary within which a particular domain model applies — the same term can mean different things in different contexts",
        "A geographic region where a service is deployed",
        "A Docker container that isolates a service's runtime"
      ]),
      correct_answer: "A boundary within which a particular domain model applies — the same term can mean different things in different contexts",
      explanation: "A Bounded Context defines the boundary where a domain model is valid. For example, 'Product' means {name, description, price, images} in the Catalog context, but {sku, warehouseId, stockLevel} in the Inventory context. Bounded Contexts map naturally to microservice boundaries. The Anti-Corruption Layer pattern prevents one context's model from leaking into another.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text: "What is the BFF (Backend for Frontend) pattern?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A frontend framework that replaces React",
        "A separate backend service tailored to each client type (web, mobile, IoT) — aggregating and shaping data for that client's specific needs",
        "A database that stores frontend component state",
        "A CDN that caches frontend assets"
      ]),
      correct_answer: "A separate backend service tailored to each client type (web, mobile, IoT) — aggregating and shaping data for that client's specific needs",
      explanation: "BFF (Backend for Frontend) creates a dedicated backend for each client type. The Web BFF might return rich, detailed responses with high-res images, while the Mobile BFF returns minimal payloads optimized for bandwidth and battery. Each frontend team owns their BFF and can evolve it independently without affecting other clients. This prevents 'one-size-fits-all' API bloat.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "What is the key difference between blue-green and canary deployment strategies?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Blue-green uses Docker but canary uses Kubernetes",
        "Blue-green switches 100% of traffic at once to the new version, while canary gradually shifts traffic (5% → 25% → 50% → 100%) with monitoring at each stage",
        "Blue-green is for frontend and canary is for backend",
        "There is no difference — they are the same strategy with different names"
      ]),
      correct_answer: "Blue-green switches 100% of traffic at once to the new version, while canary gradually shifts traffic (5% → 25% → 50% → 100%) with monitoring at each stage",
      explanation: "Blue-green deploys the new version alongside the old one and switches all traffic at once (instant rollback by switching back). Canary gradually routes a small percentage of traffic to the new version, monitoring error rates and latency at each stage. Canary has lower risk (only a fraction of users see bugs) but is slower to fully roll out. Blue-green costs more (two full environments) but gives instant rollback.",
      difficulty: "medium",
      order_index: 5,
    },
  ],

  'service-communication-resilience': [
    {
      question_text: "Why is asynchronous communication preferred over synchronous for event-driven workflows?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Asynchronous is always faster than synchronous",
        "Asynchronous decouples services temporally — the producer works even if the consumer is down, and messages queue up for later processing",
        "Asynchronous uses less memory than synchronous",
        "Synchronous communication is deprecated in modern architectures"
      ]),
      correct_answer: "Asynchronous decouples services temporally — the producer works even if the consumer is down, and messages queue up for later processing",
      explanation: "Asynchronous communication via message brokers (RabbitMQ, Kafka) decouples services temporally: the Order Service publishes 'OrderCreated' and moves on — it doesn't wait for Payment or Inventory to process. If Payment Service is temporarily down, messages queue up and are processed when it recovers. This prevents cascading failures where one slow/down service blocks the entire request chain.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What is the main difference between RabbitMQ and Apache Kafka?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "RabbitMQ is open source but Kafka is proprietary",
        "RabbitMQ is a message queue (messages deleted after acknowledgment) while Kafka is an event log (messages retained for a configurable period, enabling replay)",
        "RabbitMQ only supports Java but Kafka supports all languages",
        "They are interchangeable — the difference is only in the API syntax"
      ]),
      correct_answer: "RabbitMQ is a message queue (messages deleted after acknowledgment) while Kafka is an event log (messages retained for a configurable period, enabling replay)",
      explanation: "RabbitMQ acts as a smart broker: it routes messages to queues using exchanges and deletes them once acknowledged. Kafka acts as a distributed commit log: messages are retained for a configurable period (days/weeks) and consumers track their position (offset). This means Kafka supports message replay (e.g., reprocessing last week's events after a bug fix), event sourcing, and stream processing. RabbitMQ is simpler and better for task distribution and work queues.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text: "What are the three states of a circuit breaker, and what does each do?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Open (accepts all), Closed (rejects all), Locked (maintenance mode)",
        "Closed (passes requests, tracks failures), Open (rejects requests immediately, returns fallback), Half-Open (allows one test request to check if the service has recovered)",
        "Green (healthy), Yellow (degraded), Red (critical)",
        "Active (processing), Idle (waiting), Terminated (shut down)"
      ]),
      correct_answer: "Closed (passes requests, tracks failures), Open (rejects requests immediately, returns fallback), Half-Open (allows one test request to check if the service has recovered)",
      explanation: "The circuit breaker pattern has three states: CLOSED (normal — requests pass through, failures are counted), OPEN (fail-fast — all requests are immediately rejected without making the network call, returning a fallback), and HALF-OPEN (recovery test — after a timeout, one request is allowed through; if it succeeds, the circuit closes; if it fails, it re-opens). This prevents cascading failures by stopping wasteful calls to a service that's known to be unhealthy.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "Why should retry logic include exponential backoff WITH jitter?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Jitter makes the code more readable and easier to test",
        "Exponential backoff gives the failing service time to recover, and jitter (randomization) prevents the 'thundering herd' problem where thousands of clients retry at the exact same time",
        "Jitter is required by the HTTP specification for all retry implementations",
        "Backoff reduces memory usage and jitter reduces CPU usage"
      ]),
      correct_answer: "Exponential backoff gives the failing service time to recover, and jitter (randomization) prevents the 'thundering herd' problem where thousands of clients retry at the exact same time",
      explanation: "Exponential backoff (1s, 2s, 4s, 8s...) gives a failing service progressively more time to recover. But without jitter, if 1000 clients all experienced the same failure, they would all retry at exactly the same intervals (1s, 2s, 4s...), creating synchronized traffic spikes that overwhelm the recovering service. Jitter adds randomization (e.g., random(0, 4s) instead of exactly 4s) to spread out retries. Also: only retry on transient errors (5xx, timeouts), never on client errors (4xx), and always ensure operations are idempotent before adding retries.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text: "What does the bulkhead pattern protect against, and how does it work?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It protects against SQL injection by sanitizing all database queries",
        "It isolates service calls into separate resource pools so one slow downstream service cannot exhaust all resources and starve calls to other healthy services",
        "It encrypts all communication between microservices using mutual TLS",
        "It compresses HTTP responses to reduce bandwidth usage between services"
      ]),
      correct_answer: "It isolates service calls into separate resource pools so one slow downstream service cannot exhaust all resources and starve calls to other healthy services",
      explanation: "Named after ship bulkheads (watertight compartments that prevent a single hull breach from sinking the entire ship), the bulkhead pattern assigns each downstream service its own dedicated pool of connections/threads. If the Payment Service is slow and consumes all 20 of its allocated connections, the Inventory Service pool (15 connections) and Email Service pool (10 connections) are completely unaffected. Without bulkheads, a single slow service can consume all shared threads/connections, causing the entire system to become unresponsive.",
      difficulty: "hard",
      order_index: 5,
    },
  ],
};

export default quiz;
