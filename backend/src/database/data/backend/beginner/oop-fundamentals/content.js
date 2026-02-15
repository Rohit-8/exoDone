// ============================================================================
// OOP Fundamentals — Content
// ============================================================================

export const topic = {
  "name": "OOP Fundamentals",
  "slug": "oop-fundamentals",
  "description": "Master the four pillars of Object-Oriented Programming — encapsulation, inheritance, polymorphism, and abstraction.",
  "estimated_time": 200,
  "order_index": 1
};

export const lessons = [
  {
    title: "Classes, Objects & Encapsulation",
    slug: "classes-objects-encapsulation",
    summary: "Understand classes as blueprints, objects as instances, and encapsulation to protect internal state.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 1,
    key_points: [
  "A class is a blueprint; an object is an instance of that blueprint",
  "Encapsulation hides internal state and exposes a controlled interface",
  "Access modifiers (public, private, protected) enforce encapsulation",
  "Getters and setters provide controlled access to private fields",
  "Constructor functions initialize object state at creation time"
],
    content: `# Classes, Objects & Encapsulation

## What is a Class?

A **class** is a blueprint that defines the structure (data) and behavior (methods) of objects.

\`\`\`javascript
class BankAccount {
  #balance;  // Private field (encapsulation)

  constructor(owner, initialBalance = 0) {
    this.owner = owner;
    this.#balance = initialBalance;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Deposit must be positive');
    this.#balance += amount;
    return this.#balance;
  }

  withdraw(amount) {
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.#balance -= amount;
    return this.#balance;
  }

  get balance() {
    return this.#balance;
  }
}

const account = new BankAccount('Alice', 1000);
account.deposit(500);   // 1500
account.withdraw(200);  // 1300
// account.#balance;    // SyntaxError — private!
\`\`\`

## Encapsulation

Encapsulation bundles data and methods together, hiding internal state from the outside world:

| Access Level | Visible To | JavaScript | C# / Java |
|---|---|---|---|
| Public | Everyone | Default | \`public\` |
| Private | Class only | \`#field\` | \`private\` |
| Protected | Class + subclasses | Convention \`_field\` | \`protected\` |

### Why Encapsulate?

1. **Data integrity** — prevent invalid state
2. **Flexibility** — change implementation without breaking consumers
3. **Simplicity** — expose only what's necessary

\`\`\`csharp
// C# example
public class Temperature {
    private double _celsius;

    public double Celsius {
        get => _celsius;
        set {
            if (value < -273.15)
                throw new ArgumentException("Below absolute zero!");
            _celsius = value;
        }
    }

    public double Fahrenheit => _celsius * 9.0 / 5.0 + 32;
}
\`\`\`

## Constructor Patterns

\`\`\`javascript
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }

  // Static factory method
  static fromJSON(json) {
    const data = JSON.parse(json);
    return new User(data.name, data.email);
  }
}

const user = User.fromJSON('{"name":"Alice","email":"alice@test.com"}');
\`\`\`
`,
  },
  {
    title: "Inheritance & Polymorphism",
    slug: "inheritance-polymorphism",
    summary: "Extend classes through inheritance and use polymorphism to write flexible, interchangeable code.",
    difficulty_level: "beginner",
    estimated_time: 35,
    order_index: 2,
    key_points: [
  "Inheritance creates an \"is-a\" relationship between classes",
  "The extends keyword creates a subclass in JavaScript/TypeScript",
  "super() calls the parent constructor; super.method() calls parent methods",
  "Polymorphism allows different classes to be used through a common interface",
  "Prefer composition over inheritance for flexibility"
],
    content: `# Inheritance & Polymorphism

## Inheritance

Inheritance lets a class (subclass) reuse and extend the behavior of another class (superclass):

\`\`\`javascript
class Shape {
  constructor(color = 'black') {
    this.color = color;
  }

  area() {
    throw new Error('area() must be implemented by subclass');
  }

  describe() {
    return \`A \${this.color} shape with area \${this.area().toFixed(2)}\`;
  }
}

class Circle extends Shape {
  constructor(radius, color) {
    super(color);  // Call parent constructor
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(width, height, color) {
    super(color);
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }
}
\`\`\`

## Polymorphism

**Polymorphism** means "many forms" — the same interface can be used with different underlying types:

\`\`\`javascript
const shapes = [
  new Circle(5, 'red'),
  new Rectangle(4, 6, 'blue'),
  new Circle(3, 'green'),
];

// Polymorphic — each shape calculates area differently
shapes.forEach(shape => {
  console.log(shape.describe());
});

// Calculate total area — works regardless of shape type
const totalArea = shapes.reduce((sum, s) => sum + s.area(), 0);
\`\`\`

## Composition Over Inheritance

\`\`\`javascript
// Instead of deep inheritance hierarchies…
class FlyingSwimmingAnimal extends FlyingAnimal { /* messy */ }

// …compose behaviors:
const canFly = (state) => ({
  fly: () => console.log(\`\${state.name} is flying\`),
});

const canSwim = (state) => ({
  swim: () => console.log(\`\${state.name} is swimming\`),
});

function createDuck(name) {
  const state = { name };
  return { ...state, ...canFly(state), ...canSwim(state) };
}

const duck = createDuck('Donald');
duck.fly();  // "Donald is flying"
duck.swim(); // "Donald is swimming"
\`\`\`

> **Rule of thumb:** Use inheritance for genuine "is-a" relationships. Use composition for "has-a" or "can-do" relationships.
`,
  },
  {
    title: "Abstraction & SOLID Introduction",
    slug: "abstraction-solid-intro",
    summary: "Use abstraction to simplify complexity and learn the SOLID principles that guide good OOP design.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 3,
    key_points: [
  "Abstraction hides complexity and exposes only essential features",
  "Abstract classes define a contract that subclasses must fulfill",
  "Interfaces describe WHAT a class can do, not HOW",
  "SOLID: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion",
  "Following SOLID leads to maintainable, testable, flexible code"
],
    content: `# Abstraction & SOLID Principles

## Abstraction

Abstraction hides implementation complexity behind a simple interface:

\`\`\`typescript
// Abstract class — cannot be instantiated directly
abstract class Database {
  abstract connect(): Promise<void>;
  abstract query(sql: string, params?: any[]): Promise<any[]>;
  abstract disconnect(): Promise<void>;

  // Concrete method — shared by all subclasses
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

class PostgresDatabase extends Database {
  async connect() { /* pg-specific */ }
  async query(sql, params) { /* pg-specific */ }
  async disconnect() { /* pg-specific */ }
}

class MongoDatabase extends Database {
  async connect() { /* mongo-specific */ }
  async query(sql, params) { /* mongo-specific */ }
  async disconnect() { /* mongo-specific */ }
}
\`\`\`

## SOLID Principles

### S — Single Responsibility Principle (SRP)
A class should have only ONE reason to change.

\`\`\`javascript
// ❌ Too many responsibilities
class User {
  save() { /* database logic */ }
  sendEmail() { /* email logic */ }
  generateReport() { /* reporting logic */ }
}

// ✅ Separated concerns
class User { /* just user data */ }
class UserRepository { save(user) { /* database */ } }
class EmailService { sendWelcome(user) { /* email */ } }
class UserReport { generate(user) { /* report */ } }
\`\`\`

### O — Open-Closed Principle (OCP)
Open for extension, closed for modification.

### L — Liskov Substitution Principle (LSP)
Subclasses should be substitutable for their base classes.

### I — Interface Segregation Principle (ISP)
Don't force classes to implement interfaces they don't use.

### D — Dependency Inversion Principle (DIP)
Depend on abstractions, not concrete implementations.

\`\`\`javascript
// ❌ Depends on concrete implementation
class OrderService {
  constructor() {
    this.db = new PostgresDatabase();
  }
}

// ✅ Depends on abstraction (injected)
class OrderService {
  constructor(database) {
    this.db = database; // Any Database subclass works
  }
}
\`\`\`
`,
  },
];
