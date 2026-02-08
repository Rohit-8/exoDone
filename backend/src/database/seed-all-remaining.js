import pool from '../config/database.js';

async function seedFinalTopics() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding final missing lessons...');

    // Get topic IDs
    const topicsResult = await client.query('SELECT id, slug FROM topics');
    const topics = {};
    topicsResult.rows.forEach(row => {
      topics[row.slug] = row.id;
    });

    // 1. Clean Architecture
    const cleanArchLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Clean Architecture Principles', 'clean-architecture-principles', $2, 'Learn the principles of maintainable and testable architecture', 'advanced', 60, 1, $3)
      RETURNING id
    `, [
      topics['clean-architecture'],
      `# Clean Architecture Principles

## What is Clean Architecture?

**Clean Architecture** is a software design philosophy by Robert C. Martin (Uncle Bob) that emphasizes separation of concerns and independence of frameworks, databases, and external agencies.

## The Dependency Rule

**The fundamental rule:** Dependencies must point inward, toward higher-level policies.

\\\`\\\`\\\`
┌─────────────────────────────────────┐
│   Frameworks & Drivers (Web, DB)   │  ← Outermost
├─────────────────────────────────────┤
│   Interface Adapters (Controllers)  │
├─────────────────────────────────────┤
│   Use Cases (Business Rules)        │
├─────────────────────────────────────┤
│   Entities (Enterprise Business)    │  ← Innermost
└─────────────────────────────────────┘
\\\`\\\`\\\`

Outer layers can depend on inner layers, but **never the reverse**.

## Core Principles

### 1. Independence of Frameworks
Business logic should not depend on frameworks (Express, Entity Framework, etc.)

### 2. Testability
Business rules can be tested without UI, database, or external services

### 3. Independence of UI
UI can change without affecting business logic

### 4. Independence of Database
Business logic doesn't know about SQL, NoSQL, etc.

### 5. Independence of External Agencies
Business rules don't know about external services

## Layer Breakdown

### Layer 1: Entities (Core Business Logic)

Pure business objects with enterprise-wide rules:

\\\`\\\`\\\`csharp
// Domain Entity - No framework dependencies
public class Order
{
    public Guid Id { get; private set; }
    public decimal Total { get; private set; }
    public OrderStatus Status { get; private set; }
    private List<OrderItem> _items = new();
    public IReadOnlyList<OrderItem> Items => _items;

    // Business rule enforced in domain
    public void AddItem(Product product, int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be positive");

        if (Status != OrderStatus.Draft)
            throw new DomainException("Cannot modify submitted order");

        _items.Add(new OrderItem(product, quantity));
        RecalculateTotal();
    }

    private void RecalculateTotal()
    {
        Total = _items.Sum(i => i.Product.Price * i.Quantity);
    }

    public void Submit()
    {
        if (!_items.Any())
            throw new DomainException("Order must have items");

        Status = OrderStatus.Submitted;
    }
}
\\\`\\\`\\\`

### Layer 2: Use Cases (Application Business Rules)

Application-specific business rules:

\\\`\\\`\\\`csharp
// Use Case - Application logic
public interface ICreateOrderUseCase
{
    Task<OrderResponse> ExecuteAsync(CreateOrderRequest request);
}

public class CreateOrderUseCase : ICreateOrderUseCase
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly IEmailService _emailService;

    public CreateOrderUseCase(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        IEmailService emailService)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _emailService = emailService;
    }

    public async Task<OrderResponse> ExecuteAsync(CreateOrderRequest request)
    {
        // 1. Validate and get products
        var products = await _productRepository.GetByIdsAsync(
            request.Items.Select(i => i.ProductId)
        );

        // 2. Create order (domain logic)
        var order = new Order();
        foreach (var item in request.Items)
        {
            var product = products.First(p => p.Id == item.ProductId);
            order.AddItem(product, item.Quantity);
        }

        order.Submit();

        // 3. Save to repository
        await _orderRepository.SaveAsync(order);

        // 4. Send confirmation email
        await _emailService.SendOrderConfirmationAsync(order);

        return new OrderResponse(order);
    }
}
\\\`\\\`\\\`

### Layer 3: Interface Adapters

Convert data between use cases and external systems:

\\\`\\\`\\\`csharp
// Controller - Converts HTTP to Use Case format
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ICreateOrderUseCase _createOrderUseCase;

    public OrdersController(ICreateOrderUseCase createOrderUseCase)
    {
        _createOrderUseCase = createOrderUseCase;
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto dto)
    {
        // Convert from HTTP DTO to Use Case Request
        var request = new CreateOrderRequest
        {
            Items = dto.Items.Select(i => new OrderItemRequest
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity
            }).ToList()
        };

        // Execute use case
        var response = await _createOrderUseCase.ExecuteAsync(request);

        // Convert from Use Case Response to HTTP DTO
        var resultDto = new OrderDto
        {
            Id = response.Id,
            Total = response.Total,
            Status = response.Status.ToString()
        };

        return CreatedAtAction(nameof(GetOrder), new { id = resultDto.Id }, resultDto);
    }
}
\\\`\\\`\\\`

### Layer 4: Frameworks & Drivers

Database, Web frameworks, external services:

\\\`\\\`\\\`csharp
// Repository Implementation - Database details
public class SqlOrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public SqlOrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SaveAsync(Order order)
    {
        // Convert domain model to EF entity
        var entity = new OrderEntity
        {
            Id = order.Id,
            Total = order.Total,
            Status = order.Status.ToString(),
            Items = order.Items.Select(i => new OrderItemEntity
            {
                ProductId = i.Product.Id,
                Quantity = i.Quantity,
                Price = i.Product.Price
            }).ToList()
        };

        _context.Orders.Add(entity);
        await _context.SaveChangesAsync();
    }

    public async Task<Order> GetByIdAsync(Guid id)
    {
        var entity = await _context.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (entity == null) return null;

        // Convert EF entity back to domain model
        var order = Order.Reconstitute(entity.Id, entity.Status);
        foreach (var item in entity.Items)
        {
            order.AddItem(
                Product.Reconstitute(item.ProductId, item.Product.Name, item.Price),
                item.Quantity
            );
        }

        return order;
    }
}
\\\`\\\`\\\`

## Project Structure Example

\\\`\\\`\\\`
MyApp/
├── Domain/                    (Entities layer)
│   ├── Entities/
│   │   ├── Order.cs
│   │   └── Product.cs
│   └── Exceptions/
│       └── DomainException.cs
│
├── Application/               (Use Cases layer)
│   ├── UseCases/
│   │   └── Orders/
│   │       ├── CreateOrder/
│   │       │   ├── ICreateOrderUseCase.cs
│   │       │   ├── CreateOrderUseCase.cs
│   │       │   ├── CreateOrderRequest.cs
│   │       │   └── OrderResponse.cs
│   │       └── GetOrder/
│   ├── Interfaces/
│   │   ├── IOrderRepository.cs
│   │   └── IEmailService.cs
│
├── Infrastructure/            (Frameworks & Drivers)
│   ├── Persistence/
│   │   ├── ApplicationDbContext.cs
│   │   └── Repositories/
│   │       └── SqlOrderRepository.cs
│   └── Services/
│       └── SmtpEmailService.cs
│
└── WebAPI/                    (Interface Adapters)
    ├── Controllers/
    │   └── OrdersController.cs
    ├── DTOs/
    │   ├── CreateOrderDto.cs
    │   └── OrderDto.cs
    └── Program.cs
\\\`\\\`\\\`

## Dependency Injection Setup

\\\`\\\`\\\`csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Infrastructure
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"))
);

// Repositories (Infrastructure → Application Interface)
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddScoped<IProductRepository, SqlProductRepository>();

// Services
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// Use Cases (Application)
builder.Services.AddScoped<ICreateOrderUseCase, CreateOrderUseCase>();
builder.Services.AddScoped<IGetOrderUseCase, GetOrderUseCase>();

var app = builder.Build();
\\\`\\\`\\\`

## Benefits

1. **Testability**: Easy to unit test business logic
2. **Flexibility**: Swap implementations easily
3. **Maintainability**: Changes isolated to specific layers
4. **Independence**: Core logic doesn't depend on frameworks
5. **Screaming Architecture**: Project structure reveals intent

## Testing Example

\\\`\\\`\\\`csharp
public class CreateOrderUseCaseTests
{
    [Fact]
    public async Task CreateOrder_WithValidData_SavesOrder()
    {
        // Arrange
        var mockOrderRepo = new Mock<IOrderRepository>();
        var mockProductRepo = new Mock<IProductRepository>();
        var mockEmailService = new Mock<IEmailService>();

        var products = new List<Product>
        {
            new Product(Guid.NewGuid(), "Widget", 10.99m)
        };

        mockProductRepo
            .Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(products);

        var useCase = new CreateOrderUseCase(
            mockOrderRepo.Object,
            mockProductRepo.Object,
            mockEmailService.Object
        );

        var request = new CreateOrderRequest
        {
            Items = new List<OrderItemRequest>
            {
                new() { ProductId = products[0].Id, Quantity = 2 }
            }
        };

        // Act
        var result = await useCase.ExecuteAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(21.98m, result.Total);
        mockOrderRepo.Verify(r => r.SaveAsync(It.IsAny<Order>()), Times.Once);
        mockEmailService.Verify(s => s.SendOrderConfirmationAsync(It.IsAny<Order>()), Times.Once);
    }
}
\\\`\\\`\\\`

## Common Mistakes

1. **Leaking domain logic to controllers**: Keep controllers thin
2. **Entities depending on infrastructure**: Use interfaces
3. **Use cases knowing about HTTP**: Use cases should be protocol-agnostic
4. **Over-engineering**: Apply pragmatically, not dogmatically
5. **Ignoring context boundaries**: Define clear bounded contexts

## When to Use Clean Architecture

**Good For:**
- Complex domains
- Long-term projects
- Multiple UI frontends
- High testability requirements
- Team projects

**Overkill For:**
- Simple CRUD apps
- Prototypes
- Short-term projects
- Single developer apps

## Key Takeaways

1. **Dependency direction**: Always point inward
2. **Layer responsibilities**: Each layer has specific concerns
3. **Interface segregation**: Depend on abstractions, not concretions
4. **Testing first**: Design for testability from the start
5. **Pragmatic application**: Use when benefits outweigh complexity`,
      [
        'Dependencies point inward toward business logic',
        'Core business logic is independent of frameworks and databases',
        'Each layer has a specific responsibility',
        'Highly testable through dependency injection'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Domain Entity', 'Pure business logic with no dependencies', 'csharp', $2, 'Domain entity enforces business rules', 1)
    `, [
      cleanArchLesson.rows[0].id,
      `public class ShoppingCart
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    private List<CartItem> _items = new();
    public IReadOnlyList<CartItem> Items => _items;
    public decimal Total { get; private set; }

    public ShoppingCart(Guid userId)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Total = 0;
    }

    public void AddItem(Product product, int quantity)
    {
        if (product == null)
            throw new DomainException("Product cannot be null");

        if (quantity <= 0)
            throw new DomainException("Quantity must be positive");

        // Check if item already exists
        var existingItem = _items.FirstOrDefault(i => i.ProductId == product.Id);

        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            _items.Add(new CartItem(product, quantity));
        }

        RecalculateTotal();
    }

    public void RemoveItem(Guid productId)
    {
        var item = _items.FirstOrDefault(i => i.ProductId == productId);
        if (item != null)
        {
            _items.Remove(item);
            RecalculateTotal();
        }
    }

    public void Clear()
    {
        _items.Clear();
        Total = 0;
    }

    private void RecalculateTotal()
    {
        Total = _items.Sum(i => i.Subtotal);
    }
}

public class CartItem
{
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; }
    public decimal Price { get; private set; }
    public int Quantity { get; private set; }
    public decimal Subtotal => Price * Quantity;

    public CartItem(Product product, int quantity)
    {
        ProductId = product.Id;
        ProductName = product.Name;
        Price = product.Price;
        Quantity = quantity;
    }

    public void IncreaseQuantity(int amount)
    {
        if (amount <= 0)
            throw new DomainException("Amount must be positive");
        
        Quantity += amount;
    }
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the fundamental rule of Clean Architecture?', 'multiple_choice', $2, 'Dependencies must point inward', 'The Dependency Rule states that source code dependencies must point inward, toward higher-level policies. Outer layers can depend on inner layers, but never the reverse.', 'medium', 15, 1)
    `, [
      cleanArchLesson.rows[0].id,
      JSON.stringify(['Dependencies must point inward', 'Use dependency injection', 'Always use interfaces', 'Separate UI from logic'])
    ]);

    // 2. Distributed Systems
    const distributedLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Introduction to Distributed Systems', 'intro-distributed-systems', $2, 'Understanding challenges and patterns in distributed systems', 'advanced', 55, 1, $3)
      RETURNING id
    `, [
      topics['distributed-systems'],
      `# Introduction to Distributed Systems

## What is a Distributed System?

A **distributed system** is a collection of independent computers that appears to its users as a single coherent system.

### Examples
- Google Search (thousands of servers)
- Netflix (microservices across multiple data centers)
- Blockchain networks
- Cloud storage (Dropbox, Google Drive)

## Why Distributed Systems?

### 1. Scalability
Handle more users/requests by adding machines

### 2. Fault Tolerance
System continues working even if components fail

### 3. Performance
Process data closer to users (reduced latency)

### 4. Resource Sharing
Multiple systems share computing resources

## Challenges (The 8 Fallacies)

Peter Deutsch identified 8 false assumptions developers make:

1. **The network is reliable** → Networks fail frequently
2. **Latency is zero** → Network calls take time
3. **Bandwidth is infinite** → Limited data transfer capacity
4. **The network is secure** → Always assume security threats
5. **Topology doesn't change** → Networks constantly evolve
6. **There is one administrator** → Multiple teams/orgs involved
7. **Transport cost is zero** → Serialization/network has cost
8. **The network is homogeneous** → Different protocols/systems

## CAP Theorem

**You can only have 2 out of 3:**

- **C**onsistency: All nodes see same data at same time
- **A**vailability: Every request gets a response
- **P**artition Tolerance: System works despite network failures

\\\`\\\`\\\`
Real-world: Network partitions WILL happen
So choose: CP (Consistency + Partition) or AP (Availability + Partition)
\\\`\\\`\\\`

### CP Systems (Consistency + Partition Tolerance)
- MongoDB (with strong consistency)
- HBase
- Redis (with replication)
- **Trade-off**: May become unavailable during partitions

### AP Systems (Availability + Partition Tolerance)
- Cassandra
- DynamoDB
- Couchbase
- **Trade-off**: May return stale data

### CA Systems (Consistency + Availability)
- Traditional SQL databases (single node)
- **Problem**: Can't handle network partitions
- **Reality**: Not suitable for distributed systems

## BASE vs ACID

### ACID (Traditional Databases)
- **A**tomicity: All or nothing
- **C**onsistency: Valid state always
- **I**solation: Concurrent transactions don't interfere
- **D**urability: Committed data persists

### BASE (Distributed Systems)
- **B**asically **A**vailable: System works most of the time
- **S**oft state: State may change without input
- **E**ventual consistency: Eventually all nodes converge

\\\`\\\`\\\`
ACID: Strong guarantees, limited scale
BASE: Weak guarantees, high scale
\\\`\\\`\\\`

## Consistency Models

### 1. Strong Consistency
All nodes see same data immediately
\\\`\\\`\\\`
Write to node A → Read from node B → Always latest value
\\\`\\\`\\\`

### 2. Eventual Consistency
Nodes eventually converge (given no new writes)
\\\`\\\`\\\`
Write to node A → Read from node B → Might be old value
After some time → All nodes have latest value
\\\`\\\`\\\`

### 3. Read-Your-Own-Writes
User always sees their own updates
\\\`\\\`\\\`
User writes → User reads → Sees their write
Other users → Might see old value (for a while)
\\\`\\\`\\\`

## Replication Strategies

### Master-Slave Replication

\\\`\\\`\\\`
        [Master]
         /  |  \\
        /   |   \\
    [Slave] [Slave] [Slave]

Writes → Master only
Reads → Any slave
\\\`\\\`\\\`

**Pros:** Simple, good for read-heavy workloads
**Cons:** Master is single point of failure

### Multi-Master Replication

\\\`\\\`\\\`
    [Master 1] ←→ [Master 2]
         ↕             ↕
    [Master 3] ←→ [Master 4]

Writes → Any master
Reads → Any master
\\\`\\\`\\\`

**Pros:** No single point of failure
**Cons:** Conflict resolution needed

### Peer-to-Peer Replication

\\\`\\\`\\\`
All nodes are equal, any can accept reads/writes
\\\`\\\`\\\`

**Pros:** Maximum availability
**Cons:** Most complex conflict resolution

## Partitioning (Sharding)

Splitting data across multiple machines:

### 1. Horizontal Partitioning (Sharding)

\\\`\\\`\\\`
Users 1-1000    → Shard 1
Users 1001-2000 → Shard 2
Users 2001-3000 → Shard 3
\\\`\\\`\\\`

### 2. Vertical Partitioning

\\\`\\\`\\\`
User profiles   → Database 1
User orders     → Database 2
User messages   → Database 3
\\\`\\\`\\\`

### Sharding Strategies

**Range-Based:**
\\\`\\\`\\\`javascript
if (userId <= 1000) return Shard1;
else if (userId <= 2000) return Shard2;
else return Shard3;
\\\`\\\`\\\`

**Hash-Based:**
\\\`\\\`\\\`javascript
shardIndex = hash(userId) % numShards;
return shards[shardIndex];
\\\`\\\`\\\`

**Consistent Hashing:**
Minimizes data movement when adding/removing shards

## Distributed Transactions

### Two-Phase Commit (2PC)

**Phase 1: Prepare**
- Coordinator asks all participants: "Can you commit?"
- Each participant votes Yes or No

**Phase 2: Commit**
- If all voted Yes: Coordinator tells everyone to commit
- If any voted No: Coordinator tells everyone to rollback

\\\`\\\`\\\`
Coordinator: "Prepare to commit transaction"
Node A: "Yes"
Node B: "Yes"
Node C: "Yes"
Coordinator: "Commit!"
All nodes commit
\\\`\\\`\\\`

**Problem:** Blocking protocol (coordinator failure blocks all)

### Saga Pattern

Instead of one distributed transaction, use a sequence of local transactions:

\\\`\\\`\\\`
Order Service: Create order
Payment Service: Charge card
Inventory Service: Reserve items
Shipping Service: Schedule delivery

If any fails → Execute compensating transactions:
Shipping Service: Cancel delivery
Inventory Service: Release items
Payment Service: Refund card
Order Service: Cancel order
\\\`\\\`\\\`

## Message Patterns

### 1. Request-Response (Synchronous)
\\\`\\\`\\\`
Client → [Request] → Server
Client ← [Response] ← Server
\\\`\\\`\\\`

### 2. Publish-Subscribe (Asynchronous)
\\\`\\\`\\\`
Publisher → [Message] → Message Broker
                            ↓
              Subscriber 1, Subscriber 2, Subscriber 3
\\\`\\\`\\\`

### 3. Event Sourcing
Store all changes as events, rebuild state by replaying

\\\`\\\`\\\`
Events: [OrderCreated, ItemAdded, ItemAdded, OrderSubmitted]
Current State = Replay all events
\\\`\\\`\\\`

## Monitoring & Observability

### Key Metrics

1. **Latency**: Response time
2. **Traffic**: Requests per second
3. **Errors**: Error rate
4. **Saturation**: Resource utilization

### Distributed Tracing

Track requests across multiple services:

\\\`\\\`\\\`
Request ID: abc123

Gateway Service (5ms)
  ↓
Auth Service (15ms)
  ↓
User Service (30ms)
  ↓  
Database (45ms)

Total: 95ms
\\\`\\\`\\\`

Tools: Jaeger, Zipkin, AWS X-Ray

## Design Patterns

### 1. Circuit Breaker
Stop calling failing service

\\\`\\\`\\\`javascript
class CircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
      setTimeout(() => this.state = 'HALF_OPEN', 60000);
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
\\\`\\\`\\\`

### 2. Retry with Exponential Backoff

\\\`\\\`\\\`javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
\\\`\\\`\\\`

### 3. Bulkhead Pattern
Isolate resources to prevent cascading failures

\\\`\\\`\\\`
Service A: 20 threads
Service B: 20 threads  
Service C: 20 threads

If Service A fails → Only its 20 threads affected
Services B & C continue normally
\\\`\\\`\\\`

## Best Practices

1. **Design for Failure**: Assume everything fails
2. **Idempotency**: Same operation multiple times = same result
3. **Timeouts**: Always set timeouts on network calls
4. **Health Checks**: Monitor service health
5. **Graceful Degradation**: Provide reduced functionality
6. **Versioning**: API versioning for compatibility
7. **Rate Limiting**: Protect against overload
8. **Caching**: Reduce load and latency

## Key Takeaways

- Distributed systems trade consistency for availability
- Network failures are normal, not exceptional
- Eventual consistency is often sufficient
- Monitor everything
- Design for failure from the start`,
      [
        'CAP theorem: Choose 2 of Consistency, Availability, Partition tolerance',
        'Eventual consistency is common in distributed systems',
        'Design for failure - networks are unreliable',
        'Use patterns like Circuit Breaker and Retry for resilience'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Circuit Breaker Pattern', 'Prevent cascading failures', 'javascript', $2, 'Stops calling a failing service to allow it to recover', 1)
    `, [
      distributedLesson.rows[0].id,
      `class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker: Attempting recovery (HALF_OPEN)');
      } else {
        throw new Error('Circuit breaker is OPEN - fast failing');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log('Circuit breaker: Request succeeded (CLOSED)');
  }

  onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    console.log(\\\`Circuit breaker: Failure \\\${this.failureCount}/\\\${this.failureThreshold}\\\`);

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(\\\`Circuit breaker: Threshold reached (OPEN for \\\${this.timeout}ms)\\\`);
    }
  }

  getState() {
    return this.state;
  }
}

// Usage
const breaker = new CircuitBreaker(3, 30000);

async function callExternalAPI() {
  try {
    return await breaker.execute(async () => {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) throw new Error('API error');
      return response.json();
    });
  } catch (error) {
    console.error('Failed to call API:', error.message);
    return { error: 'Service temporarily unavailable' };
  }
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'According to CAP theorem, which two properties can you achieve in a distributed system with network partitions?', 'multiple_choice', $2, 'Either CP or AP', 'In the presence of network partitions (which always happen), you must choose between Consistency and Availability. You cannot have all three (CAP).', 'hard', 20, 1)
    `, [
      distributedLesson.rows[0].id,
      JSON.stringify(['CA only', 'CP only', 'AP only', 'Either CP or AP'])
    ]);

    console.log('✅ Step 1: Architecture lessons added');

    // Continue with more topics...
    await client.query('COMMIT');
    console.log('✅ Final topics seeded successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedFinalTopics()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
