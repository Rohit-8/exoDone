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
    summary: "Learn Singleton, Factory, Builder, and Abstract Factory patterns for flexible object creation.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "Creational patterns abstract the instantiation process",
  "Singleton ensures only one instance of a class exists",
  "Factory Method delegates object creation to subclasses",
  "Builder separates construction of complex objects from their representation",
  "Abstract Factory creates families of related objects without specifying concrete classes"
],
    content: `# Creational Design Patterns

## Singleton

Ensures a class has only one instance and provides a global point of access to it.

\`\`\`javascript
class DatabaseConnection {
  static #instance = null;

  constructor(config) {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }
    this.config = config;
    this.pool = null;
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
      this.pool = new Pool(this.config);
    }
    return this.pool;
  }
}

// Both variables reference the same instance
const db1 = DatabaseConnection.getInstance({ host: 'localhost' });
const db2 = DatabaseConnection.getInstance({ host: 'other' });
console.log(db1 === db2); // true
\`\`\`

## Factory Method

\`\`\`javascript
class NotificationFactory {
  static create(type, options) {
    switch (type) {
      case 'email':
        return new EmailNotification(options);
      case 'sms':
        return new SMSNotification(options);
      case 'push':
        return new PushNotification(options);
      default:
        throw new Error(\`Unknown type: \${type}\`);
    }
  }
}

const notification = NotificationFactory.create('email', {
  to: 'alice@test.com',
  subject: 'Welcome!',
});
notification.send();
\`\`\`

## Builder Pattern

\`\`\`javascript
class QueryBuilder {
  #table = '';
  #conditions = [];
  #orderBy = '';
  #limit = null;
  #offset = null;

  from(table) { this.#table = table; return this; }
  where(condition, ...params) {
    this.#conditions.push({ condition, params });
    return this;
  }
  orderBy(column, direction = 'ASC') {
    this.#orderBy = \`\${column} \${direction}\`;
    return this;
  }
  limit(n) { this.#limit = n; return this; }
  offset(n) { this.#offset = n; return this; }

  build() {
    let sql = \`SELECT * FROM \${this.#table}\`;
    const params = [];
    if (this.#conditions.length) {
      const clauses = this.#conditions.map((c, i) => {
        params.push(...c.params);
        return c.condition;
      });
      sql += \` WHERE \${clauses.join(' AND ')}\`;
    }
    if (this.#orderBy) sql += \` ORDER BY \${this.#orderBy}\`;
    if (this.#limit) { params.push(this.#limit); sql += \` LIMIT $\${params.length}\`; }
    if (this.#offset) { params.push(this.#offset); sql += \` OFFSET $\${params.length}\`; }
    return { sql, params };
  }
}

const query = new QueryBuilder()
  .from('products')
  .where('price > $1', 10)
  .where('category = $2', 'electronics')
  .orderBy('price', 'DESC')
  .limit(20)
  .build();
\`\`\`
`,
  },
  {
    title: "Structural & Behavioral Patterns",
    slug: "structural-behavioral-patterns",
    summary: "Learn Adapter, Decorator, Observer, Strategy, and other essential patterns for composing flexible systems.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 2,
    key_points: [
  "Adapter converts one interface to another expected by clients",
  "Decorator adds behavior to objects dynamically without changing their class",
  "Observer establishes a one-to-many dependency for event-driven systems",
  "Strategy defines a family of interchangeable algorithms",
  "Middleware chains are a real-world application of the Chain of Responsibility pattern"
],
    content: `# Structural & Behavioral Patterns

## Adapter Pattern

Converts one interface to another. Useful when integrating third-party libraries.

\`\`\`javascript
// Old payment gateway interface
class OldPaymentGateway {
  makePayment(amount, currency) { /* ... */ }
}

// New standard interface your app expects
class PaymentAdapter {
  constructor(oldGateway) {
    this.gateway = oldGateway;
  }

  processPayment({ amount, currency, metadata }) {
    return this.gateway.makePayment(amount, currency);
  }
}
\`\`\`

## Decorator Pattern

\`\`\`javascript
class Coffee {
  cost() { return 5; }
  description() { return 'Plain coffee'; }
}

function withMilk(coffee) {
  const original = coffee.cost.bind(coffee);
  coffee.cost = () => original() + 1.5;
  coffee.description = () => \`\${coffee.description()}, milk\`;
  return coffee;
}

function withSugar(coffee) {
  const original = coffee.cost.bind(coffee);
  coffee.cost = () => original() + 0.5;
  return coffee;
}

const order = withSugar(withMilk(new Coffee()));
console.log(order.cost()); // 7
\`\`\`

## Observer Pattern

\`\`\`javascript
class EventEmitter {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(callback);
    return () => this.off(event, callback); // unsubscribe function
  }

  off(event, callback) {
    const cbs = this.#listeners.get(event) || [];
    this.#listeners.set(event, cbs.filter(cb => cb !== callback));
  }

  emit(event, data) {
    (this.#listeners.get(event) || []).forEach(cb => cb(data));
  }
}

const bus = new EventEmitter();
const unsub = bus.on('user:created', user => console.log('New user:', user.name));

bus.emit('user:created', { name: 'Alice' }); // logs
unsub(); // unsubscribe
\`\`\`

## Strategy Pattern

\`\`\`javascript
const pricingStrategies = {
  regular: (price) => price,
  member: (price) => price * 0.9,
  premium: (price) => price * 0.8,
  employee: (price) => price * 0.7,
};

function calculatePrice(basePrice, customerType) {
  const strategy = pricingStrategies[customerType] || pricingStrategies.regular;
  return strategy(basePrice);
}

calculatePrice(100, 'premium'); // 80
\`\`\`
`,
  },
];
