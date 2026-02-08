import pool from '../config/database.js';

async function seedMicroservices() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Microservices Architecture lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'microservices'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Microservices Architecture', 'microservices-architecture-guide', $2, 'Design, build, and deploy microservices at scale', 'advanced', 65, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Microservices Architecture

## What are Microservices?

**Microservices** is an architectural style where an application is built as a collection of small, independent services that communicate over well-defined APIs.

### Monolith vs Microservices

**Monolithic Application:**
\\\`\\\`\\\`
┌─────────────────────────────────┐
│                                 │
│  UI + Business Logic + Database │
│    All in one application       │
│                                 │
└─────────────────────────────────┘
\\\`\\\`\\\`

**Microservices:**
\\\`\\\`\\\`
┌──────────┐  ┌──────────┐  ┌──────────┐
│  User    │  │  Order   │  │ Payment  │
│ Service  │  │ Service  │  │ Service  │
└──────────┘  └──────────┘  └──────────┘
     ↓             ↓             ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│User  DB  │  │Order DB  │  │Payment DB│
└──────────┘  └──────────┘  └──────────┘
\\\`\\\`\\\`

## Key Characteristics

1. **Independently Deployable**: Each service can be deployed without affecting others
2. **Loosely Coupled**: Services have minimal dependencies
3. **Organized Around Business Capabilities**: User Service, Order Service, Payment Service
4. **Owned by Small Teams**: Each team owns one or more services
5. **Technology Agnostic**: Each service can use different tech stack

## Benefits

### 1. Scalability
Scale individual services independently:

\\\`\\\`\\\`
User Service:    3 instances
Order Service:   10 instances (high traffic!)
Payment Service: 5 instances
\\\`\\\`\\\`

### 2. Independent Deployment
Deploy updates without affecting entire system

### 3. Technology Diversity
\\\`\\\`\\\`
User Service:    Node.js + MongoDB
Order Service:   Java + PostgreSQL
Payment Service: Python + Redis
\\\`\\\`\\\`

### 4. Fault Isolation
One service failure doesn't crash entire system

### 5. Team Autonomy
Teams can work independently

## Challenges

### 1. Complexity
- More moving parts
- Distributed system challenges
- Network latency

### 2. Data Management
- Each service has own database
- No distributed transactions
- Eventual consistency

### 3. Testing
- Integration testing more complex
- Need end-to-end test environments

### 4. Deployment
- More services to deploy
- Need orchestration (Kubernetes)

### 5. Monitoring
- Distributed tracing required
- More logs to aggregate

## Service Communication

### 1. Synchronous (REST/gRPC)

**REST API:**
\\\`\\\`\\\`javascript
// Order Service calls User Service
async function getOrderWithUser(orderId) {
  const order = await db.orders.findById(orderId);
  
  // HTTP call to User Service
  const response = await fetch(\\\`http://user-service/api/users/\\\${order.userId}\\\`);
  const user = await response.json();
  
  return { ...order, user };
}
\\\`\\\`\\\`

**gRPC (faster, binary):**
\\\`\\\`\\\`protobuf
service UserService {
  rpc GetUser(UserRequest) returns (UserResponse);
}
\\\`\\\`\\\`

### 2. Asynchronous (Message Queue)

**Event-Driven:**
\\\`\\\`\\\`javascript
// Order Service publishes event
await messageQueue.publish('order.created', {
  orderId: '123',
  userId: 'user-456',
  total: 99.99
});

// Payment Service subscribes
messageQueue.subscribe('order.created', async (event) => {
  await processPayment(event.orderId, event.total);
});

// Inventory Service subscribes
messageQueue.subscribe('order.created', async (event) => {
  await reserveItems(event.orderId);
});
\\\`\\\`\\\`

## Design Patterns

### 1. API Gateway Pattern

Single entry point for all clients:

\\\`\\\`\\\`
              [Client]
                 ↓
           [API Gateway]
          /      |      \\
         /       |       \\
    [User]  [Order]  [Payment]
   Service  Service   Service
\\\`\\\`\\\`

**Benefits:**
- Single endpoint for clients
- Authentication/authorization in one place
- Request routing and composition
- Rate limiting

**Example (Node.js):**
\\\`\\\`\\\`javascript
const express = require('express');
const app = express();

// Route to User Service
app.use('/api/users', async (req, res) => {
  const response = await fetch(\\\`http://user-service\\\${req.url}\\\`);
  const data = await response.json();
  res.json(data);
});

// Route to Order Service
app.use('/api/orders', async (req, res) => {
  const response = await fetch(\\\`http://order-service\\\${req.url}\\\`);
  const data = await response.json();
  res.json(data);
});

app.listen(3000);
\\\`\\\`\\\`

### 2. Service Discovery

Services find each other dynamically:

\\\`\\\`\\\`
[Service Registry]
    ↑    ↓
   Register & Discover
    ↑    ↓
[Order Service] → Find → [User Service]
\\\`\\\`\\\`

**Tools:**
- Consul
- Eureka
- Kubernetes Service Discovery

### 3. Circuit Breaker

Prevent cascading failures:

\\\`\\\`\\\`javascript
class CircuitBreaker {
  constructor() {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.threshold = 5;
  }

  async call(serviceFunction) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await serviceFunction();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => this.state = 'HALF_OPEN', 60000);
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}

// Usage
const userServiceBreaker = new CircuitBreaker();

async function getUserWithCircuitBreaker(userId) {
  return await userServiceBreaker.call(async () => {
    const response = await fetch(\\\`http://user-service/users/\\\${userId}\\\`);
    return response.json();
  });
}
\\\`\\\`\\\`

### 4. Saga Pattern

Distributed transactions:

\\\`\\\`\\\`javascript
// Choreography-based Saga
class OrderSaga {
  async createOrder(orderData) {
    try {
      // Step 1: Create order
      const order = await orderService.create(orderData);
      await events.publish('order.created', order);

      // Step 2: Reserve inventory (async)
      // Step 3: Process payment (async)
      // Step 4: Schedule shipping (async)

      return order;
    } catch (error) {
      // Compensating transaction
      await this.compensate(order);
      throw error;
    }
  }

  async compensate(order) {
    await events.publish('order.cancelled', order);
    // Inventory Service: Release items
    // Payment Service: Refund
  }
}
\\\`\\\`\\\`

### 5. Database per Service

Each service owns its database:

\\\`\\\`\\\`
User Service → User DB
Order Service → Order DB
Payment Service → Payment DB
\\\`\\\`\\\`

**How to join data?**

**Option 1: API Composition**
\\\`\\\`\\\`javascript
const order = await orderService.getOrder(id);
const user = await userService.getUser(order.userId);
return { ...order, user };
\\\`\\\`\\\`

**Option 2: CQRS (Command Query Responsibility Segregation)**
- Maintain read-optimized database
- Update via events

**Option 3: Event Sourcing**
- Store events, rebuild state

## Deployment

### Docker

**user-service/Dockerfile:**
\\\`\\\`\\\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
\\\`\\\`\\\`

### Kubernetes

**deployment.yaml:**
\\\`\\\`\\\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:1.0
        ports:
        - containerPort: 3001
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3001
\\\`\\\`\\\`

## Monitoring & Observability

### 1. Distributed Tracing

Track request across services:

\\\`\\\`\\\`
Request ID: abc-123
├─ API Gateway (10ms)
│  ├─ User Service (25ms)
│  └─ Order Service (40ms)
│     └─ Payment Service (60ms)
Total: 135ms
\\\`\\\`\\\`

**Tools:**
- Jaeger
- Zipkin
- AWS X-Ray

### 2. Centralized Logging

Aggregate logs from all services:

\\\`\\\`\\\`
Services → Logstash → Elasticsearch → Kibana
\\\`\\\`\\\`

### 3. Health Checks

\\\`\\\`\\\`javascript
app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    database: db.isConnected() ? 'UP' : 'DOWN',
    timestamp: new Date()
  };
  
  const statusCode = health.database === 'UP' ? 200 : 503;
  res.status(statusCode).json(health);
});
\\\`\\\`\\\`

## Best Practices

1. **Start with Monolith**: Don't start with microservices
2. **Define Bounded Contexts**: Use Domain-Driven Design
3. **Automate Everything**: CI/CD, testing, deployment
4. **Design for Failure**: Circuit breakers, retries, timeouts
5. **Monitor Everything**: Logs, metrics, traces
6. **Version APIs**: Use versioning (/v1/users)
7. **Secure Communication**: mTLS, API keys, OAuth
8. **Data Ownership**: Each service owns its data
9. **Event-Driven**: Use async communication when possible
10. **Documentation**: API docs (Swagger/OpenAPI)

## When to Use Microservices

✅ **Good For:**
- Large, complex applications
- Teams > 10 developers
- Need independent scaling
- Different tech stacks needed
- Long-term projects

❌ **Not Good For:**
- Simple applications
- Small teams (< 5 developers)
- Tight deadlines
- Limited DevOps capability
- Learning projects

## Migration Strategy

### Strangler Fig Pattern

Gradually replace monolith:

\\\`\\\`\\\`
Phase 1: [Monolith] → Extract User Service
Phase 2: [Monolith] → Extract Order Service
Phase 3: [Monolith] → Extract Payment Service
Phase 4: Retire Monolith
\\\`\\\`\\\`

## Real-World Example: E-commerce

\\\`\\\`\\\`
- API Gateway: Nginx/Kong
- User Service: Authentication, profiles
- Product Service: Catalog management
- Order Service: Order processing
- Payment Service: Payment processing
- Inventory Service: Stock management
- Notification Service: Emails, SMS
- Recommendation Service: ML-based recommendations
- Search Service: Elasticsearch
\\\`\\\`\\\`

## Key Takeaways

1. Microservices = Independent, focused services
2. Use API Gateway for client communication
3. Implement service discovery
4. Design for failure (circuit breakers)
5. Monitor with distributed tracing
6. Each service owns its database
7. Start simple, evolve gradually`,
      [
        'Microservices are independently deployable services',
        'Use API Gateway pattern for client communication',
        'Implement Circuit Breaker to prevent cascading failures',
        'Each service should own its database and domain'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Simple Microservice', 'Express.js microservice with health check', 'javascript', $2, 'Basic microservice structure with REST API and health endpoint', 1),
      ($1, 'Docker Compose Setup', 'Multi-service setup with Docker Compose', 'yaml', $3, 'Orchestrate multiple microservices locally', 2)
    `, [
      lesson.rows[0].id,
      `const express = require('express');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// User endpoints
app.get('/api/users', async (req, res) => {
  // Get all users from database
  const users = await db.users.findAll();
  res.json(users);
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.users.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await db.users.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\\\`User Service running on port \\\${PORT}\\\`);
});

module.exports = app;`,
      `version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - USER_SERVICE_URL=http://user-service:3001
      - ORDER_SERVICE_URL=http://order-service:3002
      - PAYMENT_SERVICE_URL=http://payment-service:3003
    depends_on:
      - user-service
      - order-service
      - payment-service

  # User Service
  user-service:
    build: ./user-service
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:password@user-db:5432/users
      - NODE_ENV=production
    depends_on:
      - user-db

  user-db:
    image: postgres:15
    environment:
      - POSTGRES_DB=users
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - user-data:/var/lib/postgresql/data

  # Order Service
  order-service:
    build: ./order-service
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://order:password@order-db:5432/orders
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - order-db
      - rabbitmq

  order-db:
    image: postgres:15
    environment:
      - POSTGRES_DB=orders
      - POSTGRES_USER=order
      - POSTGRES_PASSWORD=password
    volumes:
      - order-data:/var/lib/postgresql/data

  # Payment Service
  payment-service:
    build: ./payment-service
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://payment:password@payment-db:5432/payments
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - payment-db
      - rabbitmq

  payment-db:
    image: postgres:15
    environment:
      - POSTGRES_DB=payments
      - POSTGRES_USER=payment
      - POSTGRES_PASSWORD=password
    volumes:
      - payment-data:/var/lib/postgresql/data

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  user-data:
  order-data:
  payment-data:

networks:
  default:
    name: microservices-network`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main benefit of the API Gateway pattern?', 'multiple_choice', $2, 'Single entry point for all clients', 'The API Gateway provides a single entry point for all clients, handling routing, authentication, and request composition in one place.', 'medium', 15, 1),
      ($1, 'What is the Saga pattern used for?', 'multiple_choice', $3, 'Managing distributed transactions', 'The Saga pattern manages distributed transactions across microservices by coordinating a sequence of local transactions with compensating actions for rollback.', 'hard', 20, 2)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Single entry point for all clients', 'Database replication', 'Load balancing', 'Service discovery']),
      JSON.stringify(['Load balancing', 'Managing distributed transactions', 'Service discovery', 'Health monitoring'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Microservices Architecture lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedMicroservices()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
