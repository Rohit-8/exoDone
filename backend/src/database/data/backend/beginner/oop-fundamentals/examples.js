// ============================================================================
// OOP Fundamentals — Code Examples
// ============================================================================

const examples = {
  'classes-objects-encapsulation': [
    {
      title: "Encapsulated Shopping Cart",
      description: "A full shopping cart class demonstrating private fields, getters, validation, and controlled access to internal state.",
      language: "javascript",
      code: `class ShoppingCart {
  #items = [];
  #discountCode = null;

  addItem(product, quantity = 1) {
    if (!product || !product.id || !product.price) {
      throw new Error('Product must have id and price');
    }
    if (quantity < 1) throw new Error('Quantity must be at least 1');

    const existing = this.#items.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.#items.push({ product, quantity });
    }
  }

  removeItem(productId) {
    this.#items = this.#items.filter(i => i.product.id !== productId);
  }

  updateQuantity(productId, quantity) {
    const item = this.#items.find(i => i.product.id === productId);
    if (!item) throw new Error('Item not in cart');
    if (quantity <= 0) return this.removeItem(productId);
    item.quantity = quantity;
  }

  applyDiscount(code) {
    const discounts = { SAVE10: 0.10, SAVE20: 0.20, HALF: 0.50 };
    if (!discounts[code]) throw new Error('Invalid discount code');
    this.#discountCode = code;
  }

  get subtotal() {
    return this.#items.reduce(
      (sum, item) => sum + item.product.price * item.quantity, 0
    );
  }

  get discount() {
    const rates = { SAVE10: 0.10, SAVE20: 0.20, HALF: 0.50 };
    return this.#discountCode ? this.subtotal * rates[this.#discountCode] : 0;
  }

  get total() { return this.subtotal - this.discount; }
  get itemCount() { return this.#items.reduce((s, i) => s + i.quantity, 0); }
  get items() { return this.#items.map(i => ({ ...i })); } // Copy!

  clear() { this.#items = []; this.#discountCode = null; }
}

const cart = new ShoppingCart();
cart.addItem({ id: 1, name: 'Laptop', price: 999 });
cart.addItem({ id: 2, name: 'Mouse', price: 29 }, 2);
cart.applyDiscount('SAVE10');
console.log(cart.subtotal);  // 1057
console.log(cart.discount);  // 105.7
console.log(cart.total);     // 951.3
console.log(cart.itemCount); // 3`,
      explanation: "Private fields (#items, #discountCode) prevent direct external modification. Getters return copies or computed values. Validation in addItem and applyDiscount ensures data integrity. The internal state can only be changed through controlled methods.",
      order_index: 1,
    },
    {
      title: "Object Creation Patterns Compared",
      description: "Four ways to create objects in JavaScript — literal, constructor, Object.create, and factory function — with trade-offs explained.",
      language: "javascript",
      code: `// 1. Object Literal — simple, one-off objects
const config = {
  host: 'localhost',
  port: 3000,
  getURL() { return \`http://\${this.host}:\${this.port}\`; }
};

// 2. Class Constructor — blueprint for many similar objects
class User {
  #password;
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this.#password = password;
  }
  checkPassword(attempt) { return attempt === this.#password; }
}
const user = new User('Alice', 'alice@test.com', 'secret');

// 3. Object.create() — prototype-based inheritance without classes
const animal = {
  speak() { return \`\${this.name} says \${this.sound}\`; }
};
const cat = Object.create(animal);
cat.name = 'Whiskers';
cat.sound = 'Meow';
console.log(cat.speak()); // "Whiskers says Meow"

// 4. Factory Function — encapsulation without classes
function createCounter(initial = 0) {
  let count = initial; // Closure — truly private
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    get value() { return count; },
    reset() { count = initial; }
  };
}
const counter = createCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.reset();     // back to 10`,
      explanation: "Object literals are best for configuration or one-off objects. Class constructors are ideal when you need many instances with shared behavior. Object.create() gives fine-grained prototype control. Factory functions use closures for truly private state without the 'this' complexity.",
      order_index: 2,
    },
  ],
  'inheritance-polymorphism': [
    {
      title: "Payment Processor with Polymorphism",
      description: "Different payment methods processed through a common interface — demonstrating runtime polymorphism and the Open-Closed Principle.",
      language: "javascript",
      code: `class PaymentProcessor {
  process(amount) {
    throw new Error('process() must be implemented');
  }

  validate(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
  }
}

class CreditCardProcessor extends PaymentProcessor {
  constructor(cardNumber, cvv) {
    super();
    this.cardNumber = cardNumber;
    this.cvv = cvv;
  }

  process(amount) {
    this.validate(amount); // Reuse parent method
    const last4 = this.cardNumber.slice(-4);
    console.log(\`Charging $\${amount} to card ending in \${last4}\`);
    return { success: true, method: 'credit_card', amount, ref: 'CC-' + Date.now() };
  }
}

class PayPalProcessor extends PaymentProcessor {
  constructor(email) {
    super();
    this.email = email;
  }

  process(amount) {
    this.validate(amount);
    console.log(\`PayPal payment of $\${amount} from \${this.email}\`);
    return { success: true, method: 'paypal', amount, ref: 'PP-' + Date.now() };
  }
}

class CryptoProcessor extends PaymentProcessor {
  constructor(walletAddress) {
    super();
    this.wallet = walletAddress;
  }

  process(amount) {
    this.validate(amount);
    console.log(\`Crypto payment of $\${amount} from wallet \${this.wallet.slice(0,8)}...\`);
    return { success: true, method: 'crypto', amount, ref: 'CR-' + Date.now() };
  }
}

// Polymorphic usage — checkout works with ANY processor
function checkout(processor, amount) {
  return processor.process(amount);
}

const processors = [
  new CreditCardProcessor('4111111111111234', '123'),
  new PayPalProcessor('alice@example.com'),
  new CryptoProcessor('0x1234abcd5678ef90')
];

processors.forEach(p => console.log(checkout(p, 49.99)));
// Adding a new payment type requires ZERO changes to checkout()`,
      explanation: "Each processor implements process() differently (runtime polymorphism). The checkout function accepts any PaymentProcessor subclass — it doesn't need to know the specific type. Adding CryptoProcessor required no changes to existing code (Open-Closed Principle).",
      order_index: 1,
    },
    {
      title: "Composition vs Inheritance — Logger System",
      description: "A practical example showing how composition creates flexible, swappable behavior compared to rigid inheritance hierarchies.",
      language: "javascript",
      code: `// ❌ Inheritance approach — rigid hierarchy
class Logger { log(msg) { console.log(msg); } }
class TimestampLogger extends Logger {
  log(msg) { super.log(\`[\${new Date().toISOString()}] \${msg}\`); }
}
class JsonTimestampLogger extends TimestampLogger {
  log(msg) { /* now what? Can't easily combine features */ }
}

// ✅ Composition approach — mix and match
const withTimestamp = (logger) => ({
  ...logger,
  log: (msg) => logger.log(\`[\${new Date().toISOString()}] \${msg}\`),
});

const withLevel = (logger) => ({
  ...logger,
  info:  (msg) => logger.log(\`[INFO]  \${msg}\`),
  warn:  (msg) => logger.log(\`[WARN]  \${msg}\`),
  error: (msg) => logger.log(\`[ERROR] \${msg}\`),
});

const withJson = (logger) => ({
  ...logger,
  log: (msg) => logger.log(JSON.stringify({ message: msg, time: Date.now() })),
});

// Base logger
const consoleLogger = { log: (msg) => console.log(msg) };

// Compose any combination!
const devLogger = withLevel(withTimestamp(consoleLogger));
devLogger.info('Server started');
// [INFO]  [2024-01-15T10:30:00.000Z] Server started

const prodLogger = withLevel(withJson(consoleLogger));
prodLogger.error('DB connection failed');
// [ERROR] {"message":"DB connection failed","time":1705312200000}`,
      explanation: "With inheritance, adding features requires new classes in the hierarchy (TimestampLogger, JsonLogger, JsonTimestampLogger...). Composition lets you wrap loggers with any combination of features. New features are independent functions, not new subclasses.",
      order_index: 2,
    },
  ],
  'abstraction-solid-intro': [
    {
      title: "Dependency Injection — Testable OrderService",
      description: "A complete example of DIP showing how injecting abstractions makes code testable and swappable.",
      language: "javascript",
      code: `// Abstractions (contracts)
class Logger {
  log(message) { throw new Error('Not implemented'); }
}

class NotificationService {
  send(to, message) { throw new Error('Not implemented'); }
}

class OrderRepository {
  save(order) { throw new Error('Not implemented'); }
  findById(id) { throw new Error('Not implemented'); }
}

// Concrete implementations
class ConsoleLogger extends Logger {
  log(message) { console.log(\`[LOG] \${message}\`); }
}

class EmailNotification extends NotificationService {
  send(to, message) { console.log(\`Email to \${to}: \${message}\`); }
}

class PostgresOrderRepo extends OrderRepository {
  save(order) { console.log(\`Saved order \${order.id} to Postgres\`); }
  findById(id) { return { id, status: 'pending' }; }
}

// Service depends on abstractions (injected)
class OrderService {
  constructor(repo, notifier, logger) {
    this.repo = repo;
    this.notifier = notifier;
    this.logger = logger;
  }

  placeOrder(order) {
    this.repo.save(order);
    this.notifier.send(order.email, 'Your order is confirmed!');
    this.logger.log(\`Order \${order.id} placed successfully\`);
    return { ...order, status: 'confirmed' };
  }
}

// Production wiring
const prodService = new OrderService(
  new PostgresOrderRepo(),
  new EmailNotification(),
  new ConsoleLogger()
);

// Test wiring — inject mocks!
class MockRepo extends OrderRepository {
  orders = [];
  save(order) { this.orders.push(order); }
  findById(id) { return this.orders.find(o => o.id === id); }
}
class MockNotifier extends NotificationService {
  sent = [];
  send(to, msg) { this.sent.push({ to, msg }); }
}
class MockLogger extends Logger {
  logs = [];
  log(msg) { this.logs.push(msg); }
}

const mockRepo = new MockRepo();
const mockNotifier = new MockNotifier();
const testService = new OrderService(mockRepo, mockNotifier, new MockLogger());
testService.placeOrder({ id: 1, email: 'test@test.com' });
console.log(mockRepo.orders);     // [{ id: 1, email: 'test@test.com' }]
console.log(mockNotifier.sent);   // [{ to: 'test@test.com', msg: '...' }]`,
      explanation: "OrderService never directly creates its dependencies. It accepts abstractions via constructor injection. In tests, lightweight mocks replace real implementations — no database, no emails, no network. This makes tests fast, deterministic, and isolated.",
      order_index: 1,
    },
    {
      title: "Strategy Pattern — OCP in Practice",
      description: "The Strategy Pattern lets you swap algorithms at runtime without modifying the context class — a practical application of the Open-Closed Principle.",
      language: "javascript",
      code: `// Strategy interface — each strategy implements calculate()
class ShippingStrategy {
  calculate(weight, distance) {
    throw new Error('calculate() must be implemented');
  }
}

class StandardShipping extends ShippingStrategy {
  calculate(weight, distance) {
    return weight * 0.5 + distance * 0.1;
  }
}

class ExpressShipping extends ShippingStrategy {
  calculate(weight, distance) {
    return (weight * 0.5 + distance * 0.1) * 2.5;
  }
}

class FreeShipping extends ShippingStrategy {
  calculate() { return 0; }
}

class PickupShipping extends ShippingStrategy {
  calculate() { return 0; }
}

// Context class — uses a strategy but doesn't know the details
class Order {
  #items = [];
  #shippingStrategy;

  constructor(strategy = new StandardShipping()) {
    this.#shippingStrategy = strategy;
  }

  setShippingStrategy(strategy) {
    this.#shippingStrategy = strategy; // Swap at runtime!
  }

  addItem(item) { this.#items.push(item); }

  get subtotal() {
    return this.#items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get shippingCost() {
    const weight = this.#items.reduce((w, i) => w + (i.weight || 1) * i.quantity, 0);
    return this.#shippingStrategy.calculate(weight, 100);
  }

  get total() { return this.subtotal + this.shippingCost; }
}

const order = new Order(new ExpressShipping());
order.addItem({ name: 'Book', price: 15, quantity: 2, weight: 0.5 });
console.log(\`Express total: $\${order.total}\`);

order.setShippingStrategy(new FreeShipping());
console.log(\`Free shipping total: $\${order.total}\`);`,
      explanation: "Adding a new shipping method (e.g., DroneShipping) only requires a new class — no changes to Order. The strategy can be swapped at runtime via setShippingStrategy(). This is OCP in action: open for extension (new strategies), closed for modification (Order class unchanged).",
      order_index: 2,
    },
  ],
};

export default examples;
