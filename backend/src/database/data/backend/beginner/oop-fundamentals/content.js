// ============================================================================
// OOP Fundamentals — Content
// ============================================================================

export const topic = {
  "name": "OOP Fundamentals",
  "slug": "oop-fundamentals",
  "description": "Master the four pillars of Object-Oriented Programming — encapsulation, inheritance, polymorphism, and abstraction — with complete definitions, real-world examples, and best practices.",
  "estimated_time": 240,
  "order_index": 1
};

export const lessons = [
  {
    title: "Classes, Objects & Encapsulation",
    slug: "classes-objects-encapsulation",
    summary: "Understand classes as blueprints, objects as instances, the 'this' keyword, static members, and encapsulation to protect internal state.",
    difficulty_level: "beginner",
    estimated_time: 45,
    order_index: 1,
    key_points: [
      "A class is a blueprint that defines properties (data) and methods (behavior)",
      "An object is a concrete instance of a class created with the 'new' keyword",
      "Objects have identity (unique reference), state (data), and behavior (methods)",
      "Encapsulation bundles data and methods together while hiding internal state",
      "Access modifiers (public, private, protected) enforce encapsulation boundaries",
      "Getters and setters provide controlled, validated access to private fields",
      "The 'this' keyword refers to the current object instance",
      "Static members belong to the class itself, not to instances",
      "Constructor functions initialize object state at creation time"
    ],
    content: `# Classes, Objects & Encapsulation

## What is a Class?

A **class** is a blueprint or template that defines the **structure** (properties/data) and **behavior** (methods/functions) that its objects will have. A class itself does not hold any data — it only describes what data each object will carry and what operations it can perform.

**Key characteristics of a class:**
- Defines property names and types (the "shape" of data)
- Defines methods (functions attached to the object)
- Can include a **constructor** — a special method called when creating an object
- Can include **static** members that belong to the class itself rather than instances

\`\`\`javascript
class BankAccount {
  #balance;        // Private field (encapsulation)
  #transactions;   // Private transaction log

  constructor(owner, initialBalance = 0) {
    this.owner = owner;                  // Public property
    this.#balance = initialBalance;
    this.#transactions = [];
    this.createdAt = new Date();
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Deposit must be positive');
    this.#balance += amount;
    this.#transactions.push({ type: 'deposit', amount, date: new Date() });
    return this.#balance;
  }

  withdraw(amount) {
    if (amount <= 0) throw new Error('Withdrawal must be positive');
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.#balance -= amount;
    this.#transactions.push({ type: 'withdrawal', amount, date: new Date() });
    return this.#balance;
  }

  get balance() {
    return this.#balance;
  }

  get transactionHistory() {
    return [...this.#transactions]; // Return a copy, not the original
  }
}
\`\`\`

---

## What is an Object?

An **object** is a **concrete instance** of a class — it is a self-contained entity that holds actual data and can perform actions defined by its class. When you create an object using the \`new\` keyword, memory is allocated and the constructor is called to initialize its state.

**Every object has three fundamental aspects:**

| Aspect | Description | Example |
|---|---|---|
| **Identity** | A unique reference that distinguishes it from other objects (its memory address) | \`account1 !== account2\` even if they hold the same data |
| **State** | The current values of its properties/fields | \`balance = 1000\`, \`owner = 'Alice'\` |
| **Behavior** | The methods it can execute | \`deposit()\`, \`withdraw()\`, \`getBalance()\` |

\`\`\`javascript
// Creating objects (instances) from the BankAccount class
const account1 = new BankAccount('Alice', 1000);
const account2 = new BankAccount('Bob', 500);

// Each object has its OWN state
account1.deposit(200);
console.log(account1.balance); // 1200
console.log(account2.balance); // 500 (unaffected)

// Identity — even identical data doesn't make objects equal
const a = new BankAccount('Alice', 1000);
const b = new BankAccount('Alice', 1000);
console.log(a === b); // false — different objects in memory
\`\`\`

### Types of Objects in JavaScript

| Type | How Created | Example |
|---|---|---|
| **Object Literal** | \`{}\` syntax | \`const dog = { name: 'Rex', bark() {} }\` |
| **Constructed Object** | \`new ClassName()\` | \`const acc = new BankAccount('Alice')\` |
| **Object.create()** | From a prototype | \`const child = Object.create(parent)\` |
| **Factory Function** | A function that returns an object | \`function createUser(n) { return { name: n } }\` |

\`\`\`javascript
// 1. Object Literal — quick, simple objects
const config = { host: 'localhost', port: 3000, debug: true };

// 2. Constructed Object — from a class blueprint
const account = new BankAccount('Alice', 500);

// 3. Object.create() — prototype-based inheritance
const animal = { speak() { return \`\${this.name} makes a sound\`; } };
const dog = Object.create(animal);
dog.name = 'Rex';
dog.speak(); // "Rex makes a sound"

// 4. Factory Function — no 'new' keyword needed
function createUser(name, role) {
  return {
    name,
    role,
    greet() { return \`Hi, I'm \${name} (\${role})\`; }
  };
}
const user = createUser('Alice', 'admin');
\`\`\`

---

## The \`this\` Keyword

The \`this\` keyword refers to the **current object instance** — the object that is calling the method. It allows methods to access and modify the object's own properties.

\`\`\`javascript
class Car {
  constructor(make, model) {
    this.make = make;    // 'this' refers to the new Car being created
    this.model = model;
    this.speed = 0;
  }

  accelerate(amount) {
    this.speed += amount;            // 'this' = the car calling the method
    return this;                      // Return 'this' for method chaining
  }

  brake(amount) {
    this.speed = Math.max(0, this.speed - amount);
    return this;
  }

  toString() {
    return \`\${this.make} \${this.model} going \${this.speed} km/h\`;
  }
}

const car = new Car('Toyota', 'Camry');
car.accelerate(60).accelerate(20).brake(10); // Method chaining via 'this'
console.log(car.toString()); // "Toyota Camry going 70 km/h"
\`\`\`

> **Caution:** Arrow functions do NOT have their own \`this\`. They inherit \`this\` from the enclosing scope, which is useful in callbacks but problematic as class methods.

---

## Static vs Instance Members

| Feature | Instance Members | Static Members |
|---|---|---|
| Belongs to | Each object instance | The class itself |
| Access | \`obj.method()\` | \`ClassName.method()\` |
| Can access \`this\`? | Yes (refers to the instance) | No (no instance context) |
| Use case | Object-specific behavior | Utility functions, factories, constants |

\`\`\`javascript
class MathUtils {
  // Static method — called on the class, not an instance
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(a, b, t) {
    return a + (b - a) * t;
  }
}

MathUtils.clamp(15, 0, 10); // 10 — no need to create an instance

class User {
  static #count = 0;  // Static private field

  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.id = ++User.#count;  // Auto-incrementing ID
  }

  // Static factory method
  static fromJSON(json) {
    const data = JSON.parse(json);
    return new User(data.name, data.email);
  }

  static get totalUsers() {
    return User.#count;
  }
}

const u1 = new User('Alice', 'alice@test.com');
const u2 = User.fromJSON('{"name":"Bob","email":"bob@test.com"}');
console.log(User.totalUsers); // 2
\`\`\`

---

## Encapsulation

**Encapsulation** is the practice of **bundling data (properties) and the methods that operate on that data into a single unit (class)**, while **restricting direct access** to some of the object's internals. It is one of the four pillars of OOP.

### Why Encapsulate?

1. **Data integrity** — Prevent invalid state by validating through setters
2. **Flexibility** — Change internal implementation without breaking external code
3. **Simplicity** — Hide complex internal logic, expose a clean API
4. **Security** — Sensitive data cannot be accessed or modified directly

### Access Levels

| Access Level | Visible To | JavaScript | TypeScript | C# / Java |
|---|---|---|---|---|
| **Public** | Everyone | Default (no prefix) | \`public\` | \`public\` |
| **Private** | Class only | \`#field\` | \`private\` | \`private\` |
| **Protected** | Class + subclasses | Convention \`_field\` | \`protected\` | \`protected\` |
| **Read-only** | Everyone (read) | \`get\` without \`set\` | \`readonly\` | \`readonly\` / \`final\` |

\`\`\`javascript
class Temperature {
  #celsius;

  constructor(celsius) {
    this.celsius = celsius;  // Uses the setter (validates!)
  }

  // Getter — public read access
  get celsius() {
    return this.#celsius;
  }

  // Setter — validates before setting
  set celsius(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('Temperature must be a number');
    }
    if (value < -273.15) {
      throw new RangeError('Temperature cannot be below absolute zero (-273.15°C)');
    }
    this.#celsius = value;
  }

  // Computed property — derived from internal state
  get fahrenheit() {
    return this.#celsius * 9 / 5 + 32;
  }

  get kelvin() {
    return this.#celsius + 273.15;
  }

  toString() {
    return \`\${this.#celsius.toFixed(1)}°C / \${this.fahrenheit.toFixed(1)}°F / \${this.kelvin.toFixed(1)}K\`;
  }
}

const temp = new Temperature(100);
console.log(temp.toString());    // "100.0°C / 212.0°F / 373.1K"
// temp.celsius = -300;          // RangeError!
\`\`\`

---

## Constructor Patterns

\`\`\`javascript
// 1. Standard constructor
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }
}

// 2. Options object pattern — great when there are many parameters
class HttpClient {
  constructor({ baseURL, timeout = 5000, headers = {} } = {}) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.headers = { 'Content-Type': 'application/json', ...headers };
  }
}
const client = new HttpClient({ baseURL: 'https://api.example.com', timeout: 10000 });

// 3. Builder pattern — for complex object construction
class QueryBuilder {
  #table; #conditions = []; #orderBy; #limit;

  from(table) { this.#table = table; return this; }
  where(condition) { this.#conditions.push(condition); return this; }
  order(field) { this.#orderBy = field; return this; }
  take(n) { this.#limit = n; return this; }

  build() {
    let sql = \`SELECT * FROM \${this.#table}\`;
    if (this.#conditions.length) sql += \` WHERE \${this.#conditions.join(' AND ')}\`;
    if (this.#orderBy) sql += \` ORDER BY \${this.#orderBy}\`;
    if (this.#limit) sql += \` LIMIT \${this.#limit}\`;
    return sql;
  }
}

const query = new QueryBuilder()
  .from('users')
  .where('age > 18')
  .where('active = true')
  .order('name')
  .take(10)
  .build();
// "SELECT * FROM users WHERE age > 18 AND active = true ORDER BY name LIMIT 10"
\`\`\`
`,
  },
  {
    title: "Inheritance & Polymorphism",
    slug: "inheritance-polymorphism",
    summary: "Extend classes through inheritance, understand the prototype chain, method overriding, types of polymorphism, and when to prefer composition.",
    difficulty_level: "beginner",
    estimated_time: 45,
    order_index: 2,
    key_points: [
      "Inheritance creates an 'is-a' relationship between a parent (superclass) and child (subclass)",
      "extends keyword creates a subclass; super() calls the parent constructor",
      "Method overriding lets a subclass replace or extend a parent method",
      "JavaScript uses a prototype chain for inheritance under the hood",
      "Polymorphism means 'many forms' — same interface, different implementations",
      "Compile-time (method overloading) vs runtime (method overriding) polymorphism",
      "The instanceof operator checks an object's class hierarchy",
      "Prefer composition over inheritance for flexibility and to avoid tight coupling"
    ],
    content: `# Inheritance & Polymorphism

## What is Inheritance?

**Inheritance** is a mechanism where a new class (**subclass** or **child**) derives properties and methods from an existing class (**superclass** or **parent**). It models an **"is-a"** relationship — a Circle IS-A Shape, a Dog IS-A Animal.

### Types of Inheritance

| Type | Description | Example |
|---|---|---|
| **Single** | One child extends one parent | \`Dog extends Animal\` |
| **Multilevel** | Chain of inheritance | \`Puppy extends Dog extends Animal\` |
| **Hierarchical** | Multiple children from one parent | \`Dog extends Animal\`, \`Cat extends Animal\` |
| **Multiple** | One child from multiple parents | Not supported in JS/Java (use mixins/interfaces) |

\`\`\`javascript
class Shape {
  constructor(color = 'black') {
    if (new.target === Shape) {
      throw new Error('Shape is abstract — cannot be instantiated directly');
    }
    this.color = color;
  }

  area() {
    throw new Error('area() must be implemented by subclass');
  }

  perimeter() {
    throw new Error('perimeter() must be implemented by subclass');
  }

  describe() {
    return \`A \${this.color} \${this.constructor.name} — area: \${this.area().toFixed(2)}, perimeter: \${this.perimeter().toFixed(2)}\`;
  }
}

// Single inheritance
class Circle extends Shape {
  constructor(radius, color) {
    super(color);              // Call parent constructor FIRST
    this.radius = radius;
  }

  area() { return Math.PI * this.radius ** 2; }
  perimeter() { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  constructor(width, height, color) {
    super(color);
    this.width = width;
    this.height = height;
  }

  area() { return this.width * this.height; }
  perimeter() { return 2 * (this.width + this.height); }
}

// Multilevel inheritance
class Square extends Rectangle {
  constructor(side, color) {
    super(side, side, color);  // A square is a rectangle with equal sides
  }
}
\`\`\`

---

## Method Overriding

A subclass can **override** a parent method to provide its own implementation. Use \`super.method()\` to call the parent version when you want to extend (not fully replace) the behavior.

\`\`\`javascript
class Animal {
  constructor(name) { this.name = name; }

  speak() {
    return \`\${this.name} makes a generic sound\`;
  }

  toString() {
    return \`Animal(\${this.name})\`;
  }
}

class Dog extends Animal {
  speak() {
    return \`\${this.name} barks: Woof!\`;   // Full override
  }
}

class ServiceDog extends Dog {
  constructor(name, task) {
    super(name);
    this.task = task;
  }

  speak() {
    // Extend parent — call super then add more
    return \`\${super.speak()} (but stays calm — trained for \${this.task})\`;
  }
}

const rex = new Dog('Rex');
console.log(rex.speak());   // "Rex barks: Woof!"

const buddy = new ServiceDog('Buddy', 'guide');
console.log(buddy.speak()); // "Buddy barks: Woof! (but stays calm — trained for guide)"
\`\`\`

---

## The Prototype Chain

In JavaScript, classes are syntactic sugar over **prototype-based inheritance**. Every object has an internal \`[[Prototype]]\` link forming a chain:

\`\`\`
myDog → Dog.prototype → Animal.prototype → Object.prototype → null
\`\`\`

\`\`\`javascript
const myDog = new Dog('Rex');

// The prototype chain
console.log(myDog instanceof Dog);     // true
console.log(myDog instanceof Animal);  // true
console.log(myDog instanceof Object);  // true

// Where methods live
console.log(myDog.hasOwnProperty('name'));       // true (own property)
console.log(myDog.hasOwnProperty('speak'));      // false (on Dog.prototype)

// Walking the chain manually
console.log(Object.getPrototypeOf(myDog) === Dog.prototype);        // true
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype); // true
\`\`\`

---

## Polymorphism

**Polymorphism** (Greek: "many forms") means that **objects of different classes can be used interchangeably** through a shared interface. Each class provides its own implementation of the interface's methods.

### Types of Polymorphism

| Type | Also Called | How It Works | Example |
|---|---|---|---|
| **Runtime** | Method Overriding / Dynamic Dispatch | Subclass provides its own implementation of a parent method; resolved at runtime | \`shape.area()\` calls the correct area() based on actual object type |
| **Compile-time** | Method Overloading / Static | Same method name with different parameter types/counts; resolved at compile time | Not available in JS; supported in TypeScript, Java, C# |
| **Ad-hoc** | Operator Overloading | Same operator behaves differently with different types | \`+\` does addition for numbers, concatenation for strings |

\`\`\`javascript
// Runtime polymorphism in action
const shapes = [
  new Circle(5, 'red'),
  new Rectangle(4, 6, 'blue'),
  new Square(3, 'green'),
];

// Each shape calculates area() differently — polymorphic dispatch
shapes.forEach(shape => console.log(shape.describe()));

// Works with any Shape subclass — even ones not yet written
function printReport(shapes) {
  const totalArea = shapes.reduce((sum, s) => sum + s.area(), 0);
  const totalPerimeter = shapes.reduce((sum, s) => sum + s.perimeter(), 0);
  console.log(\`Total area: \${totalArea.toFixed(2)}\`);
  console.log(\`Total perimeter: \${totalPerimeter.toFixed(2)}\`);
}

printReport(shapes);
\`\`\`

---

## The \`instanceof\` Operator

\`instanceof\` checks whether an object is an instance of a specific class (or its ancestors):

\`\`\`javascript
const circle = new Circle(5, 'red');

console.log(circle instanceof Circle);    // true
console.log(circle instanceof Shape);     // true
console.log(circle instanceof Rectangle); // false
console.log(circle instanceof Object);    // true (everything is an Object)

// Useful for type checking before specific operations
function getShapeInfo(shape) {
  if (shape instanceof Circle) {
    return \`Circle with radius \${shape.radius}\`;
  } else if (shape instanceof Rectangle) {
    return \`Rectangle \${shape.width}×\${shape.height}\`;
  }
  return 'Unknown shape';
}
\`\`\`

---

## Composition Over Inheritance

Deep inheritance hierarchies lead to **fragile, tightly-coupled code**. Composition offers more flexibility by assembling behavior from smaller, reusable pieces.

| Factor | Inheritance | Composition |
|---|---|---|
| Relationship | "is-a" | "has-a" or "can-do" |
| Coupling | Tight (child depends on parent) | Loose (delegate to independent objects) |
| Flexibility | Fixed at design time | Can change at runtime |
| Complexity | Deep hierarchies become hard to follow | Flat, modular, easy to test |

\`\`\`javascript
// ❌ Inheritance explosion
// FlyingSwimmingElectricAnimal extends FlyingSwimmingAnimal extends FlyingAnimal extends Animal

// ✅ Composition — mix and match behaviors
const canFly = (state) => ({
  fly: () => console.log(\`\${state.name} is flying at \${state.speed || 'normal'} speed\`),
});

const canSwim = (state) => ({
  swim: () => console.log(\`\${state.name} is swimming\`),
});

const canRun = (state) => ({
  run: () => console.log(\`\${state.name} is running\`),
});

function createDuck(name) {
  const state = { name, speed: 'slow' };
  return { ...state, ...canFly(state), ...canSwim(state), ...canRun(state) };
}

function createPenguin(name) {
  const state = { name };
  return { ...state, ...canSwim(state), ...canRun(state) }; // No flying!
}

const duck = createDuck('Donald');
duck.fly();  // "Donald is flying at slow speed"
duck.swim(); // "Donald is swimming"

const penguin = createPenguin('Tux');
penguin.swim(); // "Tux is swimming"
penguin.run();  // "Tux is running"
// penguin.fly  → undefined — penguins can't fly!
\`\`\`

> **Rule of thumb:** Use inheritance for genuine "is-a" relationships (Circle is-a Shape). Use composition for "has-a" or "can-do" relationships (Duck can-fly, can-swim).
`,
  },
  {
    title: "Abstraction & SOLID Introduction",
    slug: "abstraction-solid-intro",
    summary: "Use abstraction to hide complexity, understand the difference between abstraction and encapsulation, and learn all five SOLID principles with code examples.",
    difficulty_level: "beginner",
    estimated_time: 45,
    order_index: 3,
    key_points: [
      "Abstraction hides 'how' something works and exposes 'what' it does",
      "Abstract classes provide a mix of concrete and abstract methods",
      "Interfaces define a contract — what methods a class MUST implement",
      "Abstraction ≠ Encapsulation: abstraction hides complexity, encapsulation hides data",
      "SRP: A class should have only one reason to change",
      "OCP: Open for extension, closed for modification — use polymorphism to add behavior",
      "LSP: Subtypes must be substitutable for their base types without breaking the program",
      "ISP: Prefer many small interfaces over one large interface",
      "DIP: High-level modules should depend on abstractions, not concrete implementations"
    ],
    content: `# Abstraction & SOLID Principles

## What is Abstraction?

**Abstraction** is the process of **hiding implementation complexity** and exposing only the **essential features** of an object. It answers the question: *"WHAT does this thing do?"* — without revealing *"HOW does it do it?"*

**Real-world analogy:** When you drive a car, you use the steering wheel, pedals, and gear shift (the *abstraction*). You don't need to know how the engine combustion, fuel injection, or transmission mechanisms work internally.

### Abstraction vs Encapsulation

| | Abstraction | Encapsulation |
|---|---|---|
| **Purpose** | Hide complexity | Hide data |
| **Focus** | What an object does | How an object stores data |
| **Mechanism** | Abstract classes, interfaces | Access modifiers (private, protected) |
| **Level** | Design level (architecture) | Implementation level (code) |
| **Example** | A \`Database\` interface with \`query()\` | A \`#balance\` private field with \`getBalance()\` |

### Abstract Classes

An **abstract class** is a class that **cannot be instantiated directly** — it serves as a base class that defines a contract (abstract methods) and shared behavior (concrete methods).

\`\`\`typescript
// Abstract class — defines WHAT subclasses must do
abstract class Database {
  abstract connect(): Promise<void>;
  abstract query(sql: string, params?: any[]): Promise<any[]>;
  abstract disconnect(): Promise<void>;

  // Concrete method — shared implementation for all subclasses
  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    } finally {
      await this.disconnect();
    }
  }

  async transaction(callback: (db: Database) => Promise<void>): Promise<void> {
    await this.query('BEGIN');
    try {
      await callback(this);
      await this.query('COMMIT');
    } catch (err) {
      await this.query('ROLLBACK');
      throw err;
    }
  }
}

// Concrete implementations — define HOW things work
class PostgresDatabase extends Database {
  async connect()    { /* pg Pool.connect()     */ }
  async query(sql, params) { /* pg client.query() */ }
  async disconnect() { /* pg client.release()   */ }
}

class MongoDatabase extends Database {
  async connect()    { /* MongoClient.connect()  */ }
  async query(sql, params) { /* collection.find() */ }
  async disconnect() { /* client.close()         */ }
}
\`\`\`

### Interfaces (TypeScript)

An **interface** defines a pure contract — it has no implementation, only method signatures. A class can implement multiple interfaces (unlike single inheritance).

\`\`\`typescript
interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

interface Cacheable {
  getCacheKey(): string;
  ttl(): number; // seconds
}

// A class can implement multiple interfaces
class UserProfile implements Serializable, Cacheable {
  constructor(public id: number, public name: string) {}

  serialize(): string {
    return JSON.stringify({ id: this.id, name: this.name });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.id = parsed.id;
    this.name = parsed.name;
  }

  getCacheKey(): string { return \`user:\${this.id}\`; }
  ttl(): number { return 3600; }
}
\`\`\`

---

## SOLID Principles

The **SOLID** principles are five design guidelines that lead to **maintainable, scalable, and testable** object-oriented code.

### S — Single Responsibility Principle (SRP)

> *"A class should have only ONE reason to change."*

Each class should do ONE thing and do it well. If a class has multiple responsibilities, changes to one responsibility may break the others.

\`\`\`javascript
// ❌ BAD: User class has 3 reasons to change
class User {
  save()           { /* database logic — changes if DB changes   */ }
  sendEmail()      { /* email logic — changes if email provider changes */ }
  generateReport() { /* report logic — changes if report format changes */ }
}

// ✅ GOOD: Each class has one responsibility
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}

class UserRepository {
  save(user)   { /* database logic  */ }
  findById(id) { /* database logic  */ }
  delete(id)   { /* database logic  */ }
}

class EmailService {
  sendWelcome(user) { /* email logic */ }
  sendReset(user)   { /* email logic */ }
}

class UserReport {
  generate(user)     { /* report logic */ }
  exportAsPDF(user)  { /* report logic */ }
}
\`\`\`

---

### O — Open-Closed Principle (OCP)

> *"Software entities should be open for extension, but closed for modification."*

You should be able to **add new behavior** without **changing existing code**. Use polymorphism, strategy pattern, or plugins.

\`\`\`javascript
// ❌ BAD: Must MODIFY this function to add new discount types
function calculateDiscount(type, amount) {
  if (type === 'percentage') return amount * 0.1;
  if (type === 'flat') return 10;
  if (type === 'bogo') return amount / 2;
  // Every new type means modifying this function!
}

// ✅ GOOD: Open for extension, closed for modification
class DiscountStrategy {
  calculate(amount) { throw new Error('Not implemented'); }
}

class PercentageDiscount extends DiscountStrategy {
  constructor(percent) { super(); this.percent = percent; }
  calculate(amount) { return amount * (this.percent / 100); }
}

class FlatDiscount extends DiscountStrategy {
  constructor(flat) { super(); this.flat = flat; }
  calculate(amount) { return Math.min(this.flat, amount); }
}

class BogoDiscount extends DiscountStrategy {
  calculate(amount) { return amount / 2; }
}

// Adding a NEW discount type requires NO modification to existing code:
class LoyaltyDiscount extends DiscountStrategy {
  constructor(years) { super(); this.years = years; }
  calculate(amount) { return amount * Math.min(this.years * 0.02, 0.2); }
}

function applyDiscount(strategy, amount) {
  return amount - strategy.calculate(amount);
}

applyDiscount(new PercentageDiscount(15), 100); // 85
applyDiscount(new LoyaltyDiscount(5), 100);     // 90
\`\`\`

---

### L — Liskov Substitution Principle (LSP)

> *"Subtypes must be substitutable for their base types without altering program correctness."*

If you replace a parent class with any of its subclasses, the program should still work correctly. A subclass must honor the parent's contract.

\`\`\`javascript
// ❌ BAD: Square violates Rectangle's contract
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  setWidth(w)  { this.width = w; }
  setHeight(h) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w)  { this.width = w; this.height = w; } // Surprises callers!
  setHeight(h) { this.width = h; this.height = h; }
}

// This function works for Rectangle but BREAKS for Square
function testRectangle(rect) {
  rect.setWidth(5);
  rect.setHeight(4);
  console.assert(rect.area() === 20); // FAILS for Square! area = 16
}

// ✅ GOOD: Separate types that genuinely differ
class Shape {
  area() { throw new Error('Not implemented'); }
}
class RectangleShape extends Shape {
  constructor(w, h) { super(); this.width = w; this.height = h; }
  area() { return this.width * this.height; }
}
class SquareShape extends Shape {
  constructor(side) { super(); this.side = side; }
  area() { return this.side ** 2; }
}
\`\`\`

---

### I — Interface Segregation Principle (ISP)

> *"No client should be forced to depend on methods it does not use."*

Split large interfaces into smaller, focused ones. This prevents classes from implementing methods that are irrelevant to them.

\`\`\`typescript
// ❌ BAD: One fat interface forces all implementations to handle everything
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
}

// A Robot worker doesn't eat or sleep!
class Robot implements Worker {
  work() { /* OK */ }
  eat()  { throw new Error("Robots don't eat!"); }   // Forced to implement
  sleep() { throw new Error("Robots don't sleep!"); } // Forced to implement
  attendMeeting() { /* OK */ }
}

// ✅ GOOD: Small, focused interfaces
interface Workable {
  work(): void;
}

interface Feedable {
  eat(): void;
  sleep(): void;
}

interface Meetable {
  attendMeeting(): void;
}

class HumanWorker implements Workable, Feedable, Meetable {
  work() { /* ... */ }
  eat()  { /* ... */ }
  sleep() { /* ... */ }
  attendMeeting() { /* ... */ }
}

class RobotWorker implements Workable, Meetable {
  work() { /* ... */ }
  attendMeeting() { /* ... */ }
  // No need to fake eat() or sleep()!
}
\`\`\`

---

### D — Dependency Inversion Principle (DIP)

> *"High-level modules should not depend on low-level modules. Both should depend on abstractions."*

Instead of creating dependencies directly (\`new PostgresDB()\`), **inject** abstractions so code is testable and swappable.

\`\`\`javascript
// ❌ BAD: High-level OrderService directly creates low-level PostgresDB
class OrderService {
  constructor() {
    this.db = new PostgresDatabase();   // Tight coupling!
    this.mailer = new SendGridMailer(); // Tight coupling!
  }

  placeOrder(order) {
    this.db.save(order);
    this.mailer.send(order.email, 'Order confirmed');
  }
}

// ✅ GOOD: Depends on abstractions (injected)
class OrderService {
  constructor(database, mailer, logger) {
    this.db = database;    // Any Database implementation
    this.mailer = mailer;  // Any Mailer implementation
    this.logger = logger;  // Any Logger implementation
  }

  placeOrder(order) {
    this.db.save(order);
    this.mailer.send(order.email, 'Order confirmed');
    this.logger.log(\`Order \${order.id} placed\`);
  }
}

// Production
const service = new OrderService(
  new PostgresDatabase(),
  new SendGridMailer(),
  new ConsoleLogger()
);

// Testing — inject mocks!
const testService = new OrderService(
  new InMemoryDatabase(),
  new MockMailer(),
  new NullLogger()
);
\`\`\`

---

## Summary: The Four Pillars + SOLID

| Pillar | Purpose | Key Mechanism |
|---|---|---|
| **Encapsulation** | Hide internal data | Private fields, getters/setters |
| **Inheritance** | Reuse and extend behavior | \`extends\`, \`super()\` |
| **Polymorphism** | Same interface, different behavior | Method overriding, dynamic dispatch |
| **Abstraction** | Hide complexity | Abstract classes, interfaces |

SOLID builds on these pillars to create code that is **easy to maintain, extend, test, and understand**.
`,
  },
];
