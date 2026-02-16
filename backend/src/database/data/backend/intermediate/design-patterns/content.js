// ============================================================================
// Design Patterns — Content
// ============================================================================

export const topic = {
  "name": "Design Patterns",
  "slug": "design-patterns",
  "description": "Master essential creational, structural, and behavioral design patterns for writing maintainable, reusable code.",
  "estimated_time": 240,
  "order_index": 3
};

export const lessons = [
  {
    title: "Creational Patterns",
    slug: "creational-patterns",
    summary: "Learn Singleton, Factory Method, Abstract Factory, Builder, and Prototype patterns for flexible, decoupled object creation.",
    difficulty_level: "intermediate",
    estimated_time: 45,
    order_index: 1,
    key_points: [
  "Creational patterns abstract the instantiation process so systems are independent of how objects are created",
  "Singleton ensures only one instance of a class exists and provides a global point of access",
  "Factory Method delegates object creation to subclasses, promoting loose coupling",
  "Abstract Factory creates families of related objects without specifying concrete classes",
  "Builder separates construction of complex objects from their representation using a step-by-step fluent API",
  "Prototype creates new objects by cloning existing ones, avoiding expensive initialization"
],
    content: `# Creational Design Patterns

## What Are Design Patterns?

A **design pattern** is a general, reusable solution to a commonly occurring problem in software design. Patterns are not finished code — they are templates or blueprints that describe *how* to solve a problem in many different situations.

### History — The Gang of Four (GoF)

Design patterns were popularized by the 1994 book *"Design Patterns: Elements of Reusable Object-Oriented Software"* by **Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides** — collectively known as the **Gang of Four (GoF)**. They catalogued 23 patterns split into three categories:

| Category       | Purpose                                                   | Count |
|----------------|-----------------------------------------------------------|-------|
| **Creational** | Deal with object creation mechanisms                      | 5     |
| **Structural** | Deal with object composition and relationships            | 7     |
| **Behavioral** | Deal with communication and responsibility between objects| 11    |

### Why Use Design Patterns?

- **Common vocabulary** — developers can communicate complex ideas with single words ("use a Facade here")
- **Proven solutions** — battle-tested approaches that avoid reinventing the wheel
- **Maintainability** — code organized around patterns is easier to change and extend
- **Interview readiness** — design patterns are one of the most frequently tested topics

---

## What Are Creational Patterns?

Creational patterns **abstract the instantiation process**. They help make a system independent of how its objects are created, composed, and represented. Instead of hard-coding \`new ClassName()\` everywhere, creational patterns provide flexible alternatives that decouple the client from the concrete classes it uses.

### When to Use Creational Patterns

- When a system should be independent of how its products are created
- When you need to enforce constraints on object creation (e.g., only one instance)
- When construction logic is complex and should not live in the client
- When you want to support multiple representations of the same construction process

---

## 1. Singleton Pattern

### Definition

The **Singleton** pattern ensures a class has **exactly one instance** and provides a **global point of access** to that instance.

### When to Use

- Database connection pools
- Application configuration / settings
- Logger instances
- Caching layers
- Thread pools or worker managers

### Implementation

\`\`\`javascript
class DatabaseConnection {
  static #instance = null;

  constructor(config) {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }
    this.config = config;
    this.pool = null;
    this.connectionCount = 0;
    DatabaseConnection.#instance = this;
  }

  static getInstance(config) {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.#instance;
  }

  async connect() {
    if (!this.pool) {
      // Simulate pool creation
      this.pool = { host: this.config.host, maxConnections: 10 };
      this.connectionCount++;
    }
    return this.pool;
  }

  static resetInstance() {
    // Useful for testing
    DatabaseConnection.#instance = null;
  }
}

// Both variables reference the same instance
const db1 = DatabaseConnection.getInstance({ host: 'localhost', port: 5432 });
const db2 = DatabaseConnection.getInstance({ host: 'other-host' });
console.log(db1 === db2); // true — second config is ignored
\`\`\`

### Thread Safety Considerations

In single-threaded JavaScript (Node.js main thread), traditional thread-safety issues don't apply. However, with **Worker Threads** or concurrent async initialization, you should guard against race conditions:

\`\`\`javascript
class SafeSingleton {
  static #instance = null;
  static #initializing = null;

  static async getInstance() {
    if (SafeSingleton.#instance) return SafeSingleton.#instance;

    // Prevent multiple concurrent initializations
    if (!SafeSingleton.#initializing) {
      SafeSingleton.#initializing = SafeSingleton.#init();
    }
    return SafeSingleton.#initializing;
  }

  static async #init() {
    const instance = new SafeSingleton();
    await instance.setup(); // async work
    SafeSingleton.#instance = instance;
    SafeSingleton.#initializing = null;
    return instance;
  }

  async setup() {
    // Simulate expensive async initialization
    return new Promise(resolve => setTimeout(resolve, 100));
  }
}
\`\`\`

### Pros & Cons

| Pros | Cons |
|------|------|
| Controlled access to sole instance | Violates Single Responsibility Principle (manages own lifecycle) |
| Reduced memory footprint | Hard to unit test (global state) |
| Lazy initialization possible | Can hide dependencies |
| Easy global access | Tight coupling if overused |

---

## 2. Factory Method Pattern

### Definition

The **Factory Method** pattern defines an interface for creating an object but lets **subclasses or logic decide which class to instantiate**. It promotes loose coupling by eliminating the need to bind application-specific classes into your code.

### When to Use

- When a class cannot anticipate the class of objects it must create
- When you want to delegate creation responsibility to subclasses
- When you want to centralize complex creation logic

### Implementation

\`\`\`javascript
// Product interface (implicit via duck typing in JS)
class Notification {
  send(message) {
    throw new Error('send() must be implemented');
  }
}

class EmailNotification extends Notification {
  constructor({ to, subject }) {
    super();
    this.to = to;
    this.subject = subject;
  }
  send(message) {
    console.log(\`Email to \${this.to}: [\${this.subject}] \${message}\`);
    return { channel: 'email', status: 'sent', to: this.to };
  }
}

class SMSNotification extends Notification {
  constructor({ phoneNumber }) {
    super();
    this.phoneNumber = phoneNumber;
  }
  send(message) {
    console.log(\`SMS to \${this.phoneNumber}: \${message}\`);
    return { channel: 'sms', status: 'sent', to: this.phoneNumber };
  }
}

class PushNotification extends Notification {
  constructor({ deviceToken }) {
    super();
    this.deviceToken = deviceToken;
  }
  send(message) {
    console.log(\`Push to \${this.deviceToken}: \${message}\`);
    return { channel: 'push', status: 'sent', to: this.deviceToken };
  }
}

// Factory Method
class NotificationFactory {
  static create(type, options) {
    const factories = {
      email: () => new EmailNotification(options),
      sms:   () => new SMSNotification(options),
      push:  () => new PushNotification(options),
    };

    const factory = factories[type];
    if (!factory) {
      throw new Error(\`Unknown notification type: "\${type}". Valid types: \${Object.keys(factories).join(', ')}\`);
    }
    return factory();
  }
}

// Client code — no dependency on concrete classes
const notification = NotificationFactory.create('email', {
  to: 'alice@test.com',
  subject: 'Welcome!',
});
notification.send('Thanks for joining!');
\`\`\`

### Factory Method vs Abstract Factory

| Aspect | Factory Method | Abstract Factory |
|--------|---------------|-----------------|
| **Creates** | One product | Families of related products |
| **Mechanism** | Method in a class/subclass | Object with multiple factory methods |
| **Flexibility** | Add new products by adding cases | Add new families by adding factories |
| **Complexity** | Simpler | More complex |

---

## 3. Abstract Factory Pattern

### Definition

The **Abstract Factory** pattern provides an interface for creating **families of related or dependent objects** without specifying their concrete classes. It ensures that products from the same family are used together.

### When to Use

- When your system needs to work with multiple families of related products
- When you want to enforce that products from the same family are compatible
- When you want to swap families easily (e.g., switching themes, databases, or platforms)

### Implementation

\`\`\`javascript
// ---- Abstract Products (interfaces via duck typing) ----
class Button { render() { throw new Error('Not implemented'); } }
class Input  { render() { throw new Error('Not implemented'); } }
class Card   { render() { throw new Error('Not implemented'); } }

// ---- Dark Theme Family ----
class DarkButton extends Button {
  render() { return '<button class="bg-gray-800 text-white">Click</button>'; }
}
class DarkInput extends Input {
  render() { return '<input class="bg-gray-700 text-white border-gray-600" />'; }
}
class DarkCard extends Card {
  render() { return '<div class="bg-gray-900 text-gray-100 rounded shadow-lg"></div>'; }
}

// ---- Light Theme Family ----
class LightButton extends Button {
  render() { return '<button class="bg-white text-black border border-gray-300">Click</button>'; }
}
class LightInput extends Input {
  render() { return '<input class="bg-gray-50 text-black border border-gray-200" />'; }
}
class LightCard extends Card {
  render() { return '<div class="bg-white text-gray-800 rounded shadow"></div>'; }
}

// ---- Abstract Factory ----
class ThemeFactory {
  static create(theme) {
    const families = {
      dark: {
        button: () => new DarkButton(),
        input:  () => new DarkInput(),
        card:   () => new DarkCard(),
      },
      light: {
        button: () => new LightButton(),
        input:  () => new LightInput(),
        card:   () => new LightCard(),
      },
    };

    const family = families[theme];
    if (!family) throw new Error(\`Unknown theme: \${theme}\`);
    return family;
  }
}

// Client — works with any theme without knowing concrete classes
function renderForm(themeName) {
  const factory = ThemeFactory.create(themeName);
  return [
    factory.card().render(),
    factory.input().render(),
    factory.button().render(),
  ].join('\\n');
}

console.log(renderForm('dark'));
\`\`\`

---

## 4. Builder Pattern

### Definition

The **Builder** pattern separates the **construction of a complex object from its representation**, allowing the same construction process to create different representations. It is especially useful when an object has many optional parameters.

### When to Use

- When an object requires many configuration steps
- When constructor parameter lists are very long ("telescoping constructor" anti-pattern)
- When you want a **fluent API** for object construction
- When the same construction process should create different representations

### Implementation — Fluent API

\`\`\`javascript
class QueryBuilder {
  #table = '';
  #columns = ['*'];
  #conditions = [];
  #params = [];
  #joins = [];
  #orderBy = '';
  #groupBy = '';
  #limit = null;
  #offset = null;

  select(...columns) {
    this.#columns = columns.length ? columns : ['*'];
    return this;
  }

  from(table) {
    this.#table = table;
    return this;
  }

  where(condition, ...params) {
    this.#conditions.push(condition);
    this.#params.push(...params);
    return this;
  }

  join(table, on, type = 'INNER') {
    this.#joins.push(\`\${type} JOIN \${table} ON \${on}\`);
    return this;
  }

  leftJoin(table, on) {
    return this.join(table, on, 'LEFT');
  }

  orderBy(column, direction = 'ASC') {
    this.#orderBy = \`\${column} \${direction}\`;
    return this;
  }

  groupBy(column) {
    this.#groupBy = column;
    return this;
  }

  limit(n) { this.#limit = n; return this; }
  offset(n) { this.#offset = n; return this; }

  build() {
    if (!this.#table) throw new Error('Table is required — call .from()');

    const parts = [\`SELECT \${this.#columns.join(', ')} FROM \${this.#table}\`];

    if (this.#joins.length)      parts.push(this.#joins.join(' '));
    if (this.#conditions.length) parts.push(\`WHERE \${this.#conditions.join(' AND ')}\`);
    if (this.#groupBy)           parts.push(\`GROUP BY \${this.#groupBy}\`);
    if (this.#orderBy)           parts.push(\`ORDER BY \${this.#orderBy}\`);
    if (this.#limit !== null)    parts.push(\`LIMIT \${this.#limit}\`);
    if (this.#offset !== null)   parts.push(\`OFFSET \${this.#offset}\`);

    return { sql: parts.join(' '), params: this.#params };
  }
}

// Fluent usage
const query = new QueryBuilder()
  .select('p.id', 'p.name', 'c.name AS category')
  .from('products p')
  .leftJoin('categories c', 'c.id = p.category_id')
  .where('p.price > $1', 10)
  .where('p.active = $2', true)
  .orderBy('p.price', 'DESC')
  .limit(20)
  .offset(0)
  .build();

console.log(query.sql);
// SELECT p.id, p.name, c.name AS category FROM products p
//   LEFT JOIN categories c ON c.id = p.category_id
//   WHERE p.price > $1 AND p.active = $2
//   ORDER BY p.price DESC LIMIT 20 OFFSET 0
\`\`\`

---

## 5. Prototype Pattern

### Definition

The **Prototype** pattern creates new objects by **cloning an existing object** (the prototype) rather than constructing from scratch. This is useful when object creation is expensive or complex.

### When to Use

- When creating an object is more expensive than cloning (e.g., heavy DB fetch for configuration)
- When you need many objects that share most attributes but differ in a few
- When you want to avoid subclassing for every variation

### Shallow vs Deep Copy

\`\`\`javascript
class GameCharacter {
  constructor(name, stats, inventory) {
    this.name = name;
    this.stats = stats;           // nested object
    this.inventory = inventory;   // array of objects
  }

  // Shallow clone — nested objects are shared references!
  shallowClone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  // Deep clone — fully independent copy
  deepClone() {
    return new GameCharacter(
      this.name,
      { ...this.stats },
      this.inventory.map(item => ({ ...item }))
    );
  }
}

const warrior = new GameCharacter(
  'Warrior',
  { hp: 100, attack: 25, defense: 20 },
  [{ name: 'Sword', damage: 15 }, { name: 'Shield', armor: 10 }]
);

// Shallow clone — modifying stats in clone affects original!
const shallowCopy = warrior.shallowClone();
shallowCopy.stats.hp = 50;
console.log(warrior.stats.hp); // 50 — UNINTENDED MUTATION!

// Deep clone — fully independent
const deepCopy = warrior.deepClone();
deepCopy.stats.hp = 999;
console.log(warrior.stats.hp); // 50 — original is unaffected
\`\`\`

### Using structuredClone (Modern JS)

\`\`\`javascript
const template = {
  type: 'email',
  subject: 'Welcome!',
  body: 'Hello, {{name}}!',
  metadata: { priority: 'high', retries: 3 },
};

const clone = structuredClone(template);
clone.subject = 'Password Reset';
clone.body = 'Reset your password, {{name}}.';
clone.metadata.priority = 'critical';

console.log(template.metadata.priority); // 'high' — original untouched
\`\`\`

---

## Comparison of All Creational Patterns

| Pattern | Intent | Key Mechanism | Use When |
|---------|--------|---------------|----------|
| **Singleton** | One instance only | Private constructor + static access | Shared resources (DB pool, config, logger) |
| **Factory Method** | Delegate creation | Method returns new object by type | Many product types, decoupled construction |
| **Abstract Factory** | Families of objects | Factory object with multiple creation methods | Themed UI, cross-platform components |
| **Builder** | Step-by-step construction | Fluent methods + .build() | Complex objects with many optional fields |
| **Prototype** | Clone existing objects | .clone() / structuredClone | Expensive creation, template-based objects |

---

## Real-World Use Cases

| Pattern | Real-World Example |
|---------|-------------------|
| **Singleton** | Express app instance, Winston logger, Redis client |
| **Factory Method** | Passport.js strategy creation, payment gateway selection |
| **Abstract Factory** | Material UI / Chakra theme providers, cross-DB adapters |
| **Builder** | Knex.js query builder, Joi schema builder, Yup validators |
| **Prototype** | Object.create(), spread operator for config templates, structuredClone() |
`,
  },
  {
    title: "Structural & Behavioral Patterns",
    slug: "structural-behavioral-patterns",
    summary: "Master Adapter, Decorator, Facade, Proxy, Observer, Strategy, Command, Chain of Responsibility, and Iterator patterns for composing flexible, maintainable systems.",
    difficulty_level: "intermediate",
    estimated_time: 50,
    order_index: 2,
    key_points: [
  "Structural patterns compose objects and classes into larger structures while keeping them flexible",
  "Adapter converts one interface to another expected by clients",
  "Decorator adds behavior to objects dynamically without modifying their class",
  "Facade provides a simplified interface to a complex subsystem",
  "Proxy controls access to an object for lazy loading, access control, or logging",
  "Observer establishes a one-to-many dependency for event-driven systems",
  "Strategy defines a family of interchangeable algorithms, promoting Inversion of Control",
  "Command encapsulates a request as an object, enabling undo/redo and queuing",
  "Chain of Responsibility passes requests along a chain of handlers (middleware pattern)",
  "Iterator provides sequential access to elements without exposing underlying structure"
],
    content: `# Structural & Behavioral Patterns

---

# Part 1: Structural Patterns

Structural patterns are concerned with **how classes and objects are composed** to form larger structures. They use inheritance and composition to create flexible, efficient architectures.

### Purpose

- Simplify relationships between entities
- Ensure that changes in one part don't cascade through the system
- Make interfaces compatible that otherwise wouldn't be
- Add capabilities to objects without modifying their source

---

## 1. Adapter Pattern

### Definition

The **Adapter** pattern converts the interface of a class into another interface that clients expect. It lets classes work together that couldn't otherwise because of incompatible interfaces.

### Real-World Analogy

A power adapter lets a US plug work in a European socket. The adapter doesn't change the plug or the socket — it provides a compatible interface between them.

### When to Use

- Integrating a third-party library whose API doesn't match your app's interface
- Wrapping legacy code to work with modern systems
- Creating a unified interface for multiple external services

### Implementation

\`\`\`javascript
// Legacy payment processor — interface we can't change
class LegacyPaymentProcessor {
  makePayment(amountInCents, currencyCode) {
    console.log(\`Legacy: charged \${amountInCents} cents (\${currencyCode})\`);
    return { success: true, transactionId: 'TXN_' + Date.now() };
  }

  refundPayment(transactionId) {
    console.log(\`Legacy: refunded \${transactionId}\`);
    return { success: true };
  }
}

// Our app expects this interface
// { charge({ amount, currency }), refund(transactionId) }

// Adapter
class PaymentAdapter {
  constructor(legacyProcessor) {
    this.legacy = legacyProcessor;
  }

  charge({ amount, currency, metadata }) {
    // Convert dollars to cents for the legacy API
    const cents = Math.round(amount * 100);
    const result = this.legacy.makePayment(cents, currency.toUpperCase());
    return {
      id: result.transactionId,
      amount,
      currency,
      status: result.success ? 'completed' : 'failed',
      metadata,
    };
  }

  refund(transactionId) {
    const result = this.legacy.refundPayment(transactionId);
    return { transactionId, status: result.success ? 'refunded' : 'failed' };
  }
}

// Client code uses the modern interface
const processor = new PaymentAdapter(new LegacyPaymentProcessor());
const charge = processor.charge({ amount: 29.99, currency: 'usd', metadata: { orderId: 42 } });
console.log(charge);
// { id: 'TXN_17...', amount: 29.99, currency: 'usd', status: 'completed', metadata: { orderId: 42 } }
\`\`\`

---

## 2. Decorator Pattern

### Definition

The **Decorator** pattern attaches additional responsibilities to an object **dynamically**. Decorators provide a flexible alternative to subclassing for extending functionality.

### Decorator vs Inheritance

| Aspect | Inheritance | Decorator |
|--------|------------|-----------|
| Timing | Compile-time (static) | Runtime (dynamic) |
| Flexibility | Fixed hierarchy | Composable in any order |
| Explosion | N features = 2^N subclasses | N features = N decorators |
| Open/Closed | Modifies class hierarchy | Extends without modifying |

### Implementation

\`\`\`javascript
// Base component
class HttpClient {
  async request(url, options = {}) {
    console.log(\`HTTP \${options.method || 'GET'} \${url}\`);
    return { status: 200, data: { message: 'ok' } };
  }
}

// Decorator 1: Logging
function withLogging(client) {
  const original = client.request.bind(client);
  client.request = async (url, options = {}) => {
    const start = Date.now();
    console.log(\`[LOG] -> \${options.method || 'GET'} \${url}\`);
    const result = await original(url, options);
    console.log(\`[LOG] <- \${result.status} (\${Date.now() - start}ms)\`);
    return result;
  };
  return client;
}

// Decorator 2: Retry
function withRetry(client, maxRetries = 3) {
  const original = client.request.bind(client);
  client.request = async (url, options = {}) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await original(url, options);
      } catch (err) {
        lastError = err;
        console.log(\`[RETRY] Attempt \${attempt}/\${maxRetries} failed\`);
      }
    }
    throw lastError;
  };
  return client;
}

// Decorator 3: Auth header injection
function withAuth(client, tokenFn) {
  const original = client.request.bind(client);
  client.request = async (url, options = {}) => {
    options.headers = {
      ...options.headers,
      Authorization: \`Bearer \${await tokenFn()}\`,
    };
    return original(url, options);
  };
  return client;
}

// Compose decorators in any order
const client = withAuth(
  withRetry(
    withLogging(new HttpClient()),
    3
  ),
  () => 'my-jwt-token'
);

await client.request('/api/users', { method: 'GET' });
\`\`\`

---

## 3. Facade Pattern

### Definition

The **Facade** pattern provides a **simplified, unified interface** to a complex subsystem. It doesn't add functionality — it hides complexity behind an easy-to-use API.

### When to Use

- When a subsystem has too many entry points and clients shouldn't need to know about them
- When you want to layer your system and define entry points for each level
- When you're wrapping a complex third-party library

### Implementation

\`\`\`javascript
// Complex subsystem classes
class InventoryService {
  check(productId, quantity) {
    console.log(\`Checking inventory for product \${productId}\`);
    return quantity <= 100; // simplified
  }
  reserve(productId, quantity) {
    console.log(\`Reserved \${quantity} of product \${productId}\`);
    return true;
  }
}

class PaymentService {
  charge(userId, amount) {
    console.log(\`Charged user \${userId}: $\${amount}\`);
    return { transactionId: 'PAY_' + Date.now(), status: 'success' };
  }
}

class ShippingService {
  calculateCost(address) {
    return address.country === 'US' ? 5.99 : 19.99;
  }
  schedule(orderId, address) {
    console.log(\`Scheduled shipping for order \${orderId}\`);
    return { trackingNumber: 'TRACK_' + Date.now() };
  }
}

class NotificationService {
  sendEmail(to, subject, body) {
    console.log(\`Email to \${to}: \${subject}\`);
  }
}

// Facade — hides all the subsystem complexity
class OrderFacade {
  constructor() {
    this.inventory    = new InventoryService();
    this.payment      = new PaymentService();
    this.shipping     = new ShippingService();
    this.notification = new NotificationService();
  }

  async placeOrder(userId, email, items, address) {
    // 1. Check and reserve inventory
    for (const item of items) {
      if (!this.inventory.check(item.productId, item.quantity)) {
        throw new Error(\`Product \${item.productId} is out of stock\`);
      }
      this.inventory.reserve(item.productId, item.quantity);
    }

    // 2. Calculate total
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = this.shipping.calculateCost(address);
    const total = subtotal + shippingCost;

    // 3. Charge payment
    const payment = this.payment.charge(userId, total);

    // 4. Schedule shipping
    const orderId = 'ORD_' + Date.now();
    const shipment = this.shipping.schedule(orderId, address);

    // 5. Notify customer
    this.notification.sendEmail(email, 'Order Confirmed', \`Order \${orderId} - Total: $\${total}\`);

    return { orderId, total, payment, shipment };
  }
}

// Client only interacts with the facade
const orderService = new OrderFacade();
const result = await orderService.placeOrder(
  'user_1',
  'alice@test.com',
  [{ productId: 'P1', quantity: 2, price: 49.99 }],
  { country: 'US', city: 'NYC', zip: '10001' }
);
\`\`\`

---

## 4. Proxy Pattern

### Definition

The **Proxy** pattern provides a surrogate or placeholder for another object to **control access** to it. The proxy has the same interface as the real object.

### Types of Proxies

| Type | Purpose | Example |
|------|---------|---------|
| **Virtual Proxy** | Lazy initialization / deferred loading | Load heavy resources only when needed |
| **Protection Proxy** | Access control | Check permissions before allowing operations |
| **Logging Proxy** | Audit / monitoring | Log all method calls for debugging |
| **Caching Proxy** | Performance | Cache expensive operation results |

### Implementation

\`\`\`javascript
// Real service — expensive to call
class UserService {
  async fetchUser(id) {
    console.log(\`[DB] Fetching user \${id} from database...\`);
    // Simulate slow DB query
    await new Promise(r => setTimeout(r, 500));
    return { id, name: 'User_' + id, email: \`user\${id}@test.com\` };
  }
}

// Caching + Logging Proxy
class UserServiceProxy {
  #cache = new Map();
  #service;

  constructor(service) {
    this.#service = service;
  }

  async fetchUser(id) {
    // Caching proxy behavior
    if (this.#cache.has(id)) {
      console.log(\`[CACHE HIT] User \${id}\`);
      return this.#cache.get(id);
    }

    // Logging proxy behavior
    const start = Date.now();
    const user = await this.#service.fetchUser(id);
    console.log(\`[LOG] fetchUser(\${id}) took \${Date.now() - start}ms\`);

    this.#cache.set(id, user);
    return user;
  }

  clearCache() {
    this.#cache.clear();
  }
}

// Protection Proxy
class ProtectedUserService {
  #service;
  #currentUserRole;

  constructor(service, role) {
    this.#service = service;
    this.#currentUserRole = role;
  }

  async fetchUser(id) {
    if (this.#currentUserRole !== 'admin' && this.#currentUserRole !== 'manager') {
      throw new Error('Access denied: insufficient permissions');
    }
    return this.#service.fetchUser(id);
  }
}

// Usage
const real = new UserService();
const proxy = new UserServiceProxy(real);

await proxy.fetchUser(1); // [DB] Fetching... (slow)
await proxy.fetchUser(1); // [CACHE HIT] (instant)
\`\`\`

---

## Structural Patterns Comparison

| Pattern | Intent | Key Benefit |
|---------|--------|-------------|
| **Adapter** | Convert interface A to B | Integrate incompatible systems |
| **Decorator** | Add behavior dynamically | Flexible alternative to subclassing |
| **Facade** | Simplify complex subsystem | Reduce coupling to subsystem internals |
| **Proxy** | Control access to object | Lazy loading, caching, auth, logging |

---

# Part 2: Behavioral Patterns

Behavioral patterns are concerned with **algorithms and the assignment of responsibilities between objects**. They describe not just objects and classes but also the patterns of communication between them.

### Purpose

- Define how objects interact and distribute responsibility
- Increase flexibility in communication
- Reduce tight coupling between sender and receiver

---

## 5. Observer Pattern

### Definition

The **Observer** (or Pub/Sub) pattern defines a **one-to-many dependency** between objects so that when one object changes state, all its dependents are notified automatically.

### When to Use

- Event-driven systems (DOM events, WebSocket messages)
- Reactive state management (Redux, MobX)
- Notifications, webhooks, real-time updates
- Decoupling event producers from consumers

### Implementation

\`\`\`javascript
class EventEmitter {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, callback) {
    const callbacks = this.#listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) this.#listeners.delete(event);
    }
  }

  emit(event, ...args) {
    const callbacks = this.#listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }

  listenerCount(event) {
    return this.#listeners.get(event)?.size || 0;
  }

  removeAllListeners(event) {
    if (event) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
  }
}

// Usage
const bus = new EventEmitter();

// Subscribe
const unsubscribe = bus.on('user:created', (user) => {
  console.log('Send welcome email to', user.email);
});

bus.on('user:created', (user) => {
  console.log('Initialize default settings for', user.name);
});

// One-time listener
bus.once('user:created', (user) => {
  console.log('First-time analytics event for', user.name);
});

// Emit
bus.emit('user:created', { name: 'Alice', email: 'alice@test.com' });
// All three listeners fire

bus.emit('user:created', { name: 'Bob', email: 'bob@test.com' });
// Only first two fire (once listener was removed)

// Unsubscribe
unsubscribe();
console.log(bus.listenerCount('user:created')); // 1
\`\`\`

---

## 6. Strategy Pattern

### Definition

The **Strategy** pattern defines a family of algorithms, encapsulates each one, and makes them **interchangeable**. It lets the algorithm vary independently from clients that use it.

### Inversion of Control (IoC)

Strategy is a key implementation of IoC — the client doesn't decide *how* something is done, it just specifies *which strategy* to use. The actual algorithm is injected from outside.

### Implementation

\`\`\`javascript
// Pricing strategies
const pricingStrategies = {
  regular:  (price) => price,
  member:   (price) => +(price * 0.90).toFixed(2),
  premium:  (price) => +(price * 0.80).toFixed(2),
  employee: (price) => +(price * 0.70).toFixed(2),
  seasonal: (price, season) => {
    const discounts = { summer: 0.85, winter: 0.75, spring: 0.90, fall: 0.95 };
    return +(price * (discounts[season] || 1)).toFixed(2);
  },
};

// Sorting strategies
const sortStrategies = {
  'price-asc':    (items) => [...items].sort((a, b) => a.price - b.price),
  'price-desc':   (items) => [...items].sort((a, b) => b.price - a.price),
  'name-asc':     (items) => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  'newest-first': (items) => [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  'best-selling': (items) => [...items].sort((a, b) => b.salesCount - a.salesCount),
};

// Context class that uses strategies
class ProductCatalog {
  #pricingStrategy;
  #sortStrategy;

  constructor(pricingType = 'regular', sortType = 'name-asc') {
    this.setPricingStrategy(pricingType);
    this.setSortStrategy(sortType);
  }

  setPricingStrategy(type) {
    this.#pricingStrategy = pricingStrategies[type] || pricingStrategies.regular;
  }

  setSortStrategy(type) {
    this.#sortStrategy = sortStrategies[type] || sortStrategies['name-asc'];
  }

  getProducts(products) {
    const priced = products.map(p => ({
      ...p,
      finalPrice: this.#pricingStrategy(p.price),
    }));
    return this.#sortStrategy(priced);
  }
}

const catalog = new ProductCatalog('premium', 'price-asc');
const result = catalog.getProducts([
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 29 },
]);
// [{ name: 'Mouse', price: 29, finalPrice: 23.20 }, { name: 'Laptop', price: 999, finalPrice: 799.20 }]
\`\`\`

---

## 7. Command Pattern

### Definition

The **Command** pattern encapsulates a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support **undo/redo** operations.

### When to Use

- Undo/redo functionality (text editors, graphic tools)
- Macro recording and playback
- Task queues and job scheduling
- Transaction-like operations

### Implementation

\`\`\`javascript
// Command interface
class Command {
  execute() { throw new Error('execute() must be implemented'); }
  undo()    { throw new Error('undo() must be implemented'); }
}

// Concrete commands
class AddItemCommand extends Command {
  constructor(cart, item) {
    super();
    this.cart = cart;
    this.item = item;
  }
  execute() { this.cart.items.push(this.item); }
  undo()    { this.cart.items = this.cart.items.filter(i => i.id !== this.item.id); }
}

class RemoveItemCommand extends Command {
  constructor(cart, itemId) {
    super();
    this.cart = cart;
    this.itemId = itemId;
    this.removedItem = null;
  }
  execute() {
    this.removedItem = this.cart.items.find(i => i.id === this.itemId);
    this.cart.items = this.cart.items.filter(i => i.id !== this.itemId);
  }
  undo() {
    if (this.removedItem) this.cart.items.push(this.removedItem);
  }
}

class ChangeQuantityCommand extends Command {
  constructor(cart, itemId, newQty) {
    super();
    this.cart = cart;
    this.itemId = itemId;
    this.newQty = newQty;
    this.oldQty = null;
  }
  execute() {
    const item = this.cart.items.find(i => i.id === this.itemId);
    this.oldQty = item.quantity;
    item.quantity = this.newQty;
  }
  undo() {
    const item = this.cart.items.find(i => i.id === this.itemId);
    item.quantity = this.oldQty;
  }
}

// Invoker with undo/redo stack
class CommandManager {
  #history = [];
  #redoStack = [];

  execute(command) {
    command.execute();
    this.#history.push(command);
    this.#redoStack = []; // clear redo on new action
  }

  undo() {
    const cmd = this.#history.pop();
    if (cmd) {
      cmd.undo();
      this.#redoStack.push(cmd);
    }
  }

  redo() {
    const cmd = this.#redoStack.pop();
    if (cmd) {
      cmd.execute();
      this.#history.push(cmd);
    }
  }

  get historyLength() { return this.#history.length; }
}

// Usage
const cart = { items: [] };
const manager = new CommandManager();

manager.execute(new AddItemCommand(cart, { id: 1, name: 'Laptop', quantity: 1, price: 999 }));
manager.execute(new AddItemCommand(cart, { id: 2, name: 'Mouse', quantity: 1, price: 29 }));
console.log(cart.items.length); // 2

manager.undo();
console.log(cart.items.length); // 1 — Mouse removed

manager.redo();
console.log(cart.items.length); // 2 — Mouse re-added
\`\`\`

---

## 8. Chain of Responsibility Pattern

### Definition

The **Chain of Responsibility** pattern passes a request along a chain of handlers. Each handler either processes the request or passes it to the next handler in the chain.

### The Middleware Pattern

Express.js middleware is the most well-known real-world example of Chain of Responsibility. Each middleware function decides whether to handle the request, modify it, or pass it along via \`next()\`.

### Implementation

\`\`\`javascript
class MiddlewarePipeline {
  #middlewares = [];

  use(fn) {
    this.#middlewares.push(fn);
    return this; // chainable
  }

  async execute(context) {
    let index = 0;

    const next = async () => {
      if (index >= this.#middlewares.length) return;
      const middleware = this.#middlewares[index++];
      await middleware(context, next);
    };

    await next();
    return context;
  }
}

// Build a validation + auth + logging pipeline
const pipeline = new MiddlewarePipeline();

// Timing middleware
pipeline.use(async (ctx, next) => {
  ctx.startTime = Date.now();
  await next();
  ctx.duration = Date.now() - ctx.startTime;
  console.log(\`Request took \${ctx.duration}ms\`);
});

// Auth middleware
pipeline.use(async (ctx, next) => {
  if (!ctx.headers?.authorization) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return; // stop chain
  }
  ctx.user = { id: 1, role: 'admin' }; // decoded from token
  await next();
});

// Business logic
pipeline.use(async (ctx, next) => {
  ctx.status = 200;
  ctx.body = { message: \`Hello, user \${ctx.user.id}\` };
  // Not calling next() — end of chain
});

const result = await pipeline.execute({
  path: '/api/profile',
  headers: { authorization: 'Bearer token123' },
});
\`\`\`

---

## 9. Iterator Pattern

### Definition

The **Iterator** pattern provides a way to access the elements of a collection **sequentially** without exposing its underlying representation (array, tree, graph, etc.).

### JavaScript Iterators and Generators

JavaScript has **built-in iterator support** via the Iterator Protocol (\`Symbol.iterator\`) and **generators** (\`function*\`).

### Implementation — Custom Iterator

\`\`\`javascript
class PaginatedCollection {
  #items;
  #pageSize;

  constructor(items, pageSize = 10) {
    this.#items = items;
    this.#pageSize = pageSize;
  }

  // Make this iterable with for...of
  [Symbol.iterator]() {
    let page = 0;
    const items = this.#items;
    const pageSize = this.#pageSize;

    return {
      next() {
        const start = page * pageSize;
        if (start >= items.length) {
          return { done: true, value: undefined };
        }
        page++;
        return {
          done: false,
          value: items.slice(start, start + pageSize),
        };
      },
    };
  }

  // Generator-based alternative
  *pages() {
    for (let i = 0; i < this.#items.length; i += this.#pageSize) {
      yield this.#items.slice(i, i + this.#pageSize);
    }
  }
}

const data = Array.from({ length: 25 }, (_, i) => \`Item \${i + 1}\`);
const collection = new PaginatedCollection(data, 10);

// Using for...of (calls Symbol.iterator)
for (const page of collection) {
  console.log(\`Page with \${page.length} items:\`, page[0], '...', page[page.length - 1]);
}
// Page with 10 items: Item 1 ... Item 10
// Page with 10 items: Item 11 ... Item 20
// Page with 5 items:  Item 21 ... Item 25

// Using generator
for (const page of collection.pages()) {
  console.log(page.length);  // 10, 10, 5
}
\`\`\`

---

## Behavioral Patterns Comparison

| Pattern | Intent | Key Mechanism | Use When |
|---------|--------|---------------|----------|
| **Observer** | Notify many dependents | Event emitter / pub-sub | Event-driven systems, reactive state |
| **Strategy** | Swap algorithms | Inject function/object | Multiple interchangeable behaviors |
| **Command** | Encapsulate request as object | execute() / undo() | Undo/redo, queues, macros |
| **Chain of Responsibility** | Pass request along handlers | next() callback chain | Middleware, validation pipelines |
| **Iterator** | Sequential access | Symbol.iterator / generators | Pagination, lazy evaluation, streams |

---

## Combined Quick-Reference Table

| Category | Pattern | One-Liner |
|----------|---------|-----------|
| Structural | **Adapter** | Make incompatible interfaces work together |
| Structural | **Decorator** | Add behavior without changing the class |
| Structural | **Facade** | One simple API for a complex subsystem |
| Structural | **Proxy** | Control access: cache, protect, or log |
| Behavioral | **Observer** | When X happens, notify everyone who cares |
| Behavioral | **Strategy** | Pick the right algorithm at runtime |
| Behavioral | **Command** | Wrap actions as objects for undo/redo |
| Behavioral | **Chain of Responsibility** | Pass through handlers until one handles it |
| Behavioral | **Iterator** | Traverse a collection without exposing internals |
`,
  },
];
