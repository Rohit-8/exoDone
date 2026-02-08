import pool from '../config/database.js';

async function seedDomainDrivenDesign() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Domain-Driven Design lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'domain-driven-design'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Domain-Driven Design Fundamentals', 'ddd-fundamentals', $2, 'Learn DDD concepts including bounded contexts, aggregates, entities, value objects, and domain events', 'intermediate', 60, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Domain-Driven Design (DDD)

## What is Domain-Driven Design?

**Domain-Driven Design (DDD)** is an approach to software development that emphasizes collaboration between technical and domain experts to create a shared understanding of the business domain. DDD provides patterns and practices for modeling complex business logic.

### Key Principles

✅ **Ubiquitous Language**: Shared vocabulary between developers and domain experts
✅ **Bounded Contexts**: Clear boundaries around different parts of the domain
✅ **Focus on Core Domain**: Invest most effort in what matters most
✅ **Model-Driven Design**: Code reflects the domain model
✅ **Iterative Learning**: Continuously refine understanding

### When to Use DDD?

**Good Fit**:
- Complex business logic and rules
- Long-lived projects
- Need for scalability
- Multiple teams working on different areas

**Not Necessary**:
- Simple CRUD applications
- Short-term projects
- Well-understood technical problems
- Small teams with simple domains

## Building Blocks of DDD

### Entities

**Entities** are objects with a unique identity that persists over time. Two entities with the same attributes but different identities are different objects.

\\\`\\\`\\\`typescript
// Entity: User has unique identity (ID)
class User {
  constructor(
    private readonly id: string,
    private name: string,
    private email: string
  ) {}

  getId(): string {
    return this.id;
  }

  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.name = newName;
  }

  changeEmail(newEmail: string): void {
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email format');
    }
    this.email = newEmail;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }

  equals(other: User): boolean {
    return this.id === other.id;
  }
}

// Even if all attributes are the same, different IDs mean different entities
const user1 = new User('1', 'John Doe', 'john@example.com');
const user2 = new User('2', 'John Doe', 'john@example.com');
console.log(user1.equals(user2)); // false - different identities
\\\`\\\`\\\`

### Value Objects

**Value Objects** are immutable objects defined by their attributes, not identity. Two value objects with the same attributes are considered equal.

\\\`\\\`\\\`typescript
// Value Object: Money
class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Invalid currency code');
    }
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return \\\`\\\${this.amount} \\\${this.currency}\\\`;
  }
}

// Value objects with same attributes are equal
const price1 = new Money(100, 'USD');
const price2 = new Money(100, 'USD');
console.log(price1.equals(price2)); // true

// Value objects are immutable
const total = price1.add(new Money(50, 'USD'));
console.log(price1.getAmount()); // Still 100
console.log(total.getAmount()); // 150
\\\`\\\`\\\`

### More Value Object Examples

\\\`\\\`\\\`typescript
// Email Value Object
class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
  }

  private isValid(email: string): boolean {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

// Address Value Object
class Address {
  constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly zipCode: string,
    private readonly country: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.street || !this.city || !this.zipCode || !this.country) {
      throw new Error('All address fields are required');
    }
  }

  getFullAddress(): string {
    return \\\`\\\${this.street}, \\\${this.city}, \\\${this.zipCode}, \\\${this.country}\\\`;
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.zipCode === other.zipCode &&
      this.country === other.country
    );
  }
}
\\\`\\\`\\\`

## Aggregates

**Aggregates** are clusters of domain objects (entities and value objects) treated as a single unit. Each aggregate has a root entity (Aggregate Root) that controls access to other objects.

### Aggregate Rules

1. **External objects can only reference the aggregate root**
2. **Aggregate root enforces invariants** (business rules)
3. **Transactions should not span multiple aggregates**
4. **Aggregates should be as small as possible**

\\\`\\\`\\\`typescript
// Order Aggregate
class OrderLine {
  constructor(
    private readonly productId: string,
    private readonly productName: string,
    private quantity: number,
    private readonly price: Money
  ) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
  }

  getQuantity(): number {
    return this.quantity;
  }

  getTotal(): Money {
    return this.price.multiply(this.quantity);
  }

  changeQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.quantity = newQuantity;
  }
}

// Aggregate Root: Order
class Order {
  private status: OrderStatus;
  private lines: OrderLine[] = [];

  constructor(
    private readonly id: string,
    private readonly customerId: string,
    private readonly createdAt: Date
  ) {
    this.status = OrderStatus.PENDING;
  }

  // Public method to add items (enforces business rules)
  addLine(productId: string, productName: string, quantity: number, price: Money): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Cannot modify order that is not pending');
    }

    // Check if product already exists
    const existingLine = this.lines.find(line => line['productId'] === productId);
    if (existingLine) {
      existingLine.changeQuantity(existingLine.getQuantity() + quantity);
    } else {
      this.lines.push(new OrderLine(productId, productName, quantity, price));
    }
  }

  removeLine(productId: string): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Cannot modify order that is not pending');
    }

    this.lines = this.lines.filter(line => line['productId'] !== productId);
  }

  getTotal(): Money {
    if (this.lines.length === 0) {
      return new Money(0, 'USD');
    }

    return this.lines
      .map(line => line.getTotal())
      .reduce((sum, total) => sum.add(total));
  }

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Order already processed');
    }

    if (this.lines.length === 0) {
      throw new Error('Cannot confirm empty order');
    }

    this.status = OrderStatus.CONFIRMED;
  }

  cancel(): void {
    if (this.status === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel delivered order');
    }

    this.status = OrderStatus.CANCELLED;
  }

  getStatus(): OrderStatus {
    return this.status;
  }
}

enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}
\\\`\\\`\\\`

## Repositories

**Repositories** provide an abstraction for retrieving and storing aggregates. They act like in-memory collections.

\\\`\\\`\\\`typescript
// Repository Interface
interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implementation with Prisma
class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const orderData = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!orderData) {
      return null;
    }

    return this.toDomain(orderData);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { lines: true },
    });

    return orders.map(order => this.toDomain(order));
  }

  async save(order: Order): Promise<void> {
    const data = this.toPersistence(order);

    await this.prisma.order.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }

  private toDomain(data: any): Order {
    // Convert database model to domain model
    const order = new Order(
      data.id,
      data.customerId,
      data.createdAt
    );

    // Reconstitute order lines
    for (const line of data.lines) {
      order.addLine(
        line.productId,
        line.productName,
        line.quantity,
        new Money(line.priceAmount, line.priceCurrency)
      );
    }

    return order;
  }

  private toPersistence(order: Order): any {
    // Convert domain model to database model
    return {
      id: order['id'],
      customerId: order['customerId'],
      status: order.getStatus(),
      createdAt: order['createdAt'],
      lines: order['lines'].map(line => ({
        productId: line['productId'],
        productName: line['productName'],
        quantity: line.getQuantity(),
        priceAmount: line['price'].getAmount(),
        priceCurrency: line['price'].getCurrency(),
      })),
    };
  }
}
\\\`\\\`\\\`

## Domain Services

**Domain Services** contain business logic that does not naturally fit within an entity or value object. They are stateless and operate on domain objects.

\\\`\\\`\\\`typescript
// Domain Service: Pricing Service
class PricingService {
  calculateDiscount(order: Order, customer: Customer): Money {
    const total = order.getTotal();
    
    // VIP customers get 20% discount
    if (customer.isVIP()) {
      return total.multiply(0.2);
    }
    
    // Regular customers get 10% if order > $100
    if (total.getAmount() > 100) {
      return total.multiply(0.1);
    }
    
    return new Money(0, total.getCurrency());
  }

  applyDiscount(order: Order, discount: Money): Money {
    return order.getTotal().subtract(discount);
  }
}

// Domain Service: Transfer Service
class TransferService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: Money
  ): Promise<void> {
    const fromAccount = await this.accountRepository.findById(fromAccountId);
    const toAccount = await this.accountRepository.findById(toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }

    // Domain logic
    fromAccount.withdraw(amount);
    toAccount.deposit(amount);

    // Save both accounts
    await this.accountRepository.save(fromAccount);
    await this.accountRepository.save(toAccount);
  }
}
\\\`\\\`\\\`

## Domain Events

**Domain Events** represent something significant that happened in the domain. They are immutable facts about past occurrences.

\\\`\\\`\\\`typescript
// Domain Event
interface DomainEvent {
  occurredAt: Date;
  eventType: string;
}

class OrderConfirmedEvent implements DomainEvent {
  readonly occurredAt: Date;
  readonly eventType = 'OrderConfirmed';

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number
  ) {
    this.occurredAt = new Date();
  }
}

class OrderCancelledEvent implements DomainEvent {
  readonly occurredAt: Date;
  readonly eventType = 'OrderCancelled';

  constructor(
    public readonly orderId: string,
    public readonly reason: string
  ) {
    this.occurredAt = new Date();
  }
}

// Aggregate with Events
class Order {
  private domainEvents: DomainEvent[] = [];

  // ... other properties and methods

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Order already processed');
    }

    if (this.lines.length === 0) {
      throw new Error('Cannot confirm empty order');
    }

    this.status = OrderStatus.CONFIRMED;

    // Raise domain event
    this.addDomainEvent(
      new OrderConfirmedEvent(
        this.id,
        this.customerId,
        this.getTotal().getAmount()
      )
    );
  }

  cancel(reason: string): void {
    if (this.status === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel delivered order');
    }

    this.status = OrderStatus.CANCELLED;

    // Raise domain event
    this.addDomainEvent(
      new OrderCancelledEvent(this.id, reason)
    );
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

// Event Handler
class OrderConfirmedEventHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly inventoryService: InventoryService
  ) {}

  async handle(event: OrderConfirmedEvent): Promise<void> {
    // Send confirmation email
    await this.emailService.sendOrderConfirmation(event.customerId, event.orderId);

    // Reserve inventory
    await this.inventoryService.reserve(event.orderId);

    console.log(\\\`Order \\\${event.orderId} confirmed at \\\${event.occurredAt}\\\`);
  }
}
\\\`\\\`\\\`

## Bounded Contexts

**Bounded Contexts** define explicit boundaries where a particular domain model applies. Different contexts can have different models for the same concept.

\\\`\\\`\\\`typescript
// Sales Context - Customer is focused on purchasing
namespace SalesContext {
  export class Customer {
    constructor(
      private readonly id: string,
      private name: string,
      private creditLimit: Money,
      private orders: Order[]
    ) {}

    canPlaceOrder(orderAmount: Money): boolean {
      const totalOwed = this.orders
        .filter(o => o.getStatus() === OrderStatus.PENDING)
        .reduce((sum, o) => sum.add(o.getTotal()), new Money(0, 'USD'));

      return totalOwed.add(orderAmount).getAmount() <= this.creditLimit.getAmount();
    }
  }
}

// Support Context - Same customer, different concerns
namespace SupportContext {
  export class Customer {
    constructor(
      private readonly id: string,
      private name: string,
      private email: Email,
      private supportTier: SupportTier,
      private tickets: Ticket[]
    ) {}

    canCreatePriorityTicket(): boolean {
      return this.supportTier === SupportTier.PREMIUM;
    }

    getOpenTicketsCount(): number {
      return this.tickets.filter(t => t.isOpen()).length;
    }
  }

  enum SupportTier {
    BASIC = 'BASIC',
    PREMIUM = 'PREMIUM',
    ENTERPRISE = 'ENTERPRISE'
  }
}
\\\`\\\`\\\`

## Application Services (Use Cases)

**Application Services** orchestrate domain objects to fulfill use cases. They are the entry point to the domain layer.

\\\`\\\`\\\`typescript
// Use Case: Place Order
class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly productRepository: IProductRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // Fetch customer
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create order
    const order = new Order(
      this.generateId(),
      command.customerId,
      new Date()
    );

    // Add order lines
    for (const item of command.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(\\\`Product \\\${item.productId} not found\\\`);
      }

      order.addLine(
        product.getId(),
        product.getName(),
        item.quantity,
        product.getPrice()
      );
    }

    // Check customer credit limit
    if (!customer.canPlaceOrder(order.getTotal())) {
      throw new Error('Order exceeds credit limit');
    }

    // Confirm order
    order.confirm();

    // Save order
    await this.orderRepository.save(order);

    // Publish domain events
    const events = order.getDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    order.clearDomainEvents();

    return {
      orderId: order['id'],
      total: order.getTotal(),
      status: order.getStatus(),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

interface PlaceOrderCommand {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface PlaceOrderResult {
  orderId: string;
  total: Money;
  status: OrderStatus;
}
\\\`\\\`\\\`

## DDD Best Practices

1. **Start with the domain, not the database**: Focus on business logic first
2. **Use ubiquitous language**: Same terms in code and conversations
3. **Make invalid states unrepresentable**: Use types to enforce rules
4. **Keep aggregates small**: Easier to maintain and scale
5. **Be explicit about boundaries**: Define bounded contexts clearly
6. **Protect invariants**: Aggregate roots enforce business rules
7. **Use domain events**: Decouple components and track what happened
8. **Separate domain from infrastructure**: Domain should not depend on database
9. **Test domain logic extensively**: Business rules are critical
10. **Iterate and refine**: Domain understanding evolves over time`,
      [
        'Entities have unique identity, value objects are defined by attributes',
        'Aggregates group related objects and enforce business rules through the root',
        'Repositories abstract data access and work with aggregates',
        'Domain events capture significant occurrences in the domain',
        'Bounded contexts define clear boundaries where models apply'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Entity vs Value Object', 'Understanding the difference', 'typescript', $2, 'Shows how entities have unique identity while value objects are defined by their attributes and are immutable', 1),
      ($1, 'Aggregate Pattern', 'Order aggregate with business rules', 'typescript', $3, 'Demonstrates how aggregates group related objects and enforce invariants through the aggregate root', 2),
      ($1, 'Repository Pattern', 'Data access abstraction', 'typescript', $4, 'Shows how repositories provide collection-like interface for aggregates while handling persistence', 3),
      ($1, 'Domain Events', 'Event-driven domain model', 'typescript', $5, 'Demonstrates how to raise and handle domain events to track significant occurrences', 4)
    `, [
      lesson.rows[0].id,
      `// Entity: User (has identity)
class User {
  constructor(
    private readonly id: string,
    private name: string,
    private email: string
  ) {}

  getId(): string {
    return this.id;
  }

  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.name = newName;
  }

  equals(other: User): boolean {
    return this.id === other.id;
  }
}

// Value Object: Money (defined by attributes)
class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && 
           this.currency === other.currency;
  }
}

// Entities: Different even with same attributes
const user1 = new User('1', 'John', 'john@example.com');
const user2 = new User('2', 'John', 'john@example.com');
console.log(user1.equals(user2)); // false

// Value Objects: Same if attributes match
const price1 = new Money(100, 'USD');
const price2 = new Money(100, 'USD');
console.log(price1.equals(price2)); // true

// Value Objects are immutable
const total = price1.add(new Money(50, 'USD'));
console.log(price1.getAmount()); // Still 100`,
      `enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

class OrderLine {
  constructor(
    private readonly productId: string,
    private quantity: number,
    private readonly price: Money
  ) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
  }

  getTotal(): Money {
    return this.price.multiply(this.quantity);
  }

  changeQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.quantity = newQuantity;
  }
}

// Aggregate Root
class Order {
  private status: OrderStatus;
  private lines: OrderLine[] = [];

  constructor(
    private readonly id: string,
    private readonly customerId: string
  ) {
    this.status = OrderStatus.PENDING;
  }

  // Enforce business rules
  addLine(productId: string, quantity: number, price: Money): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Cannot modify confirmed order');
    }

    this.lines.push(new OrderLine(productId, quantity, price));
  }

  confirm(): void {
    if (this.lines.length === 0) {
      throw new Error('Cannot confirm empty order');
    }

    this.status = OrderStatus.CONFIRMED;
  }

  getTotal(): Money {
    return this.lines
      .map(line => line.getTotal())
      .reduce((sum, total) => sum.add(total));
  }
}`,
      `interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
}

class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!data) return null;

    return this.toDomain(data);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { lines: true },
    });

    return orders.map(order => this.toDomain(order));
  }

  async save(order: Order): Promise<void> {
    const data = this.toPersistence(order);

    await this.prisma.order.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  private toDomain(data: any): Order {
    const order = new Order(data.id, data.customerId);
    
    for (const line of data.lines) {
      order.addLine(
        line.productId,
        line.quantity,
        new Money(line.priceAmount, line.priceCurrency)
      );
    }

    return order;
  }

  private toPersistence(order: Order): any {
    return {
      id: order['id'],
      customerId: order['customerId'],
      status: order.getStatus(),
      lines: order['lines'].map(line => ({
        productId: line['productId'],
        quantity: line['quantity'],
        priceAmount: line['price'].getAmount(),
        priceCurrency: line['price'].getCurrency(),
      })),
    };
  }
}`,
      `interface DomainEvent {
  occurredAt: Date;
  eventType: string;
}

class OrderConfirmedEvent implements DomainEvent {
  readonly occurredAt: Date = new Date();
  readonly eventType = 'OrderConfirmed';

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number
  ) {}
}

class Order {
  private domainEvents: DomainEvent[] = [];

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Order already processed');
    }

    this.status = OrderStatus.CONFIRMED;

    // Raise event
    this.addDomainEvent(
      new OrderConfirmedEvent(
        this.id,
        this.customerId,
        this.getTotal().getAmount()
      )
    );
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

// Event Handler
class OrderConfirmedHandler {
  async handle(event: OrderConfirmedEvent): Promise<void> {
    console.log(\`Order confirmed: \${event.orderId}\`);
    // Send email, reserve inventory, etc.
  }
}

// Usage in application service
const order = new Order('123', 'customer-1');
order.confirm();

const events = order.getDomainEvents();
for (const event of events) {
  await eventBus.publish(event);
}
order.clearDomainEvents();`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main difference between entities and value objects?', 'multiple_choice', $2, 'Entities have unique identity, value objects are defined by their attributes', 'Entities are defined by their unique identity (ID) and can change over time, while value objects are immutable and defined solely by their attributes.', 'easy', 10, 1),
      ($1, 'What is the role of an aggregate root in DDD?', 'multiple_choice', $3, 'To enforce business rules and control access to objects within the aggregate', 'The aggregate root is the entry point to the aggregate. It enforces invariants and ensures all business rules are maintained across the objects in the aggregate.', 'medium', 15, 2),
      ($1, 'Why should value objects be immutable?', 'multiple_choice', $4, 'To ensure thread safety and prevent unexpected side effects', 'Immutable value objects cannot be modified after creation, which prevents bugs from unexpected changes, ensures thread safety, and makes code easier to reason about.', 'medium', 15, 3),
      ($1, 'What is a bounded context in DDD?', 'multiple_choice', $5, 'A boundary where a particular domain model and ubiquitous language apply', 'Bounded contexts define explicit boundaries where a specific domain model is valid. Different contexts can have different models for the same concept.', 'medium', 15, 4),
      ($1, 'When should you use domain events?', 'multiple_choice', $6, 'To capture significant occurrences in the domain and decouple components', 'Domain events represent facts about what happened in the domain. They help decouple different parts of the system and provide an audit trail of important changes.', 'easy', 10, 5)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Entities are immutable, value objects are mutable', 'Entities have unique identity, value objects are defined by their attributes', 'Entities are simple, value objects are complex', 'There is no difference']),
      JSON.stringify(['To store data in the database', 'To enforce business rules and control access to objects within the aggregate', 'To provide REST API endpoints', 'To handle user authentication']),
      JSON.stringify(['To save memory', 'To make code shorter', 'To ensure thread safety and prevent unexpected side effects', 'To improve performance']),
      JSON.stringify(['A microservice boundary', 'A boundary where a particular domain model and ubiquitous language apply', 'A database schema', 'A network security boundary']),
      JSON.stringify(['For all database operations', 'Only for errors and exceptions', 'To capture significant occurrences in the domain and decouple components', 'To replace REST APIs'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Domain-Driven Design lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedDomainDrivenDesign()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
