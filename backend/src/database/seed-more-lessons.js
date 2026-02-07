import pool from '../config/database.js';

async function seedMoreLessons() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding more lessons...');

    // Get topic IDs
    const topicsResult = await client.query('SELECT id, slug FROM topics');
    const topics = {};
    topicsResult.rows.forEach(row => {
      topics[row.slug] = row.id;
    });

    // OOP Fundamentals - Lesson 2: Inheritance
    const inheritanceLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Inheritance in C#', 'inheritance-csharp', $2, 'Learn how to reuse code and create hierarchies with inheritance', 'beginner', 35, 2, $3)
      RETURNING id
    `, [
      topics['oop-fundamentals'],
      `# Inheritance in C#

## What is Inheritance?

**Inheritance** is a fundamental OOP concept that allows a class to inherit properties and methods from another class. It enables code reuse and establishes an "is-a" relationship between classes.

## Key Terms

- **Base Class (Parent)**: The class being inherited from
- **Derived Class (Child)**: The class that inherits from the base class
- **Protected**: Access modifier allowing access in derived classes

## Basic Syntax

\`\`\`csharp
// Base class
public class Animal
{
    public string Name { get; set; }
    protected int age;

    public virtual void MakeSound()
    {
        Console.WriteLine("Some generic sound");
    }
}

// Derived class
public class Dog : Animal
{
    public string Breed { get; set; }

    // Override base method
    public override void MakeSound()
    {
        Console.WriteLine("Woof! Woof!");
    }

    public void Fetch()
    {
        Console.WriteLine($"{Name} is fetching!");
    }
}
\`\`\`

## Types of Inheritance in C#

1. **Single Inheritance**: One derived class from one base class
2. **Multilevel Inheritance**: Chain of inheritance (C# supports this)
3. **Multiple Inheritance**: NOT supported directly (use interfaces instead)

## The \`virtual\` and \`override\` Keywords

- **virtual**: Marks a method in the base class as overridable
- **override**: Provides a new implementation in the derived class
- **sealed**: Prevents further overriding

## The \`base\` Keyword

Used to call base class constructors or methods:

\`\`\`csharp
public class Employee : Person
{
    public string EmployeeId { get; set; }

    public Employee(string name, int age, string empId) 
        : base(name, age)  // Call base constructor
    {
        EmployeeId = empId;
    }

    public override void Introduce()
    {
        base.Introduce();  // Call base method
        Console.WriteLine($"Employee ID: {EmployeeId}");
    }
}
\`\`\`

## Best Practices

1. **Favor Composition Over Inheritance**: Don't inherit just to reuse code
2. **Liskov Substitution Principle**: Derived classes should be substitutable for base classes
3. **Keep Hierarchies Shallow**: Avoid deep inheritance chains
4. **Use \`sealed\` When Appropriate**: Prevent unwanted extension

## Common Mistakes

- Creating "is-a" relationships when "has-a" (composition) would be better
- Overusing inheritance leading to rigid designs
- Forgetting to call base constructors
- Breaking the contract of base class methods`,
      [
        'Inheritance enables code reuse through "is-a" relationships',
        'Use virtual/override for polymorphic behavior',
        'The base keyword accesses parent class members',
        'Favor composition over inheritance for flexibility'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Simple Inheritance', 'Basic inheritance with method overriding', 'csharp', $2, 'Shows how Dog inherits from Animal and overrides MakeSound()', 1),
      ($1, 'Using base Keyword', 'Calling base class constructor and methods', 'csharp', $3, 'Demonstrates how to use base keyword for constructors and methods', 2)
    `, [
      inheritanceLesson.rows[0].id,
      `public class Animal
{
    public string Name { get; set; }

    public virtual void MakeSound()
    {
        Console.WriteLine("Generic sound");
    }
}

public class Dog : Animal
{
    public override void MakeSound()
    {
        Console.WriteLine("Woof!");
    }
}

// Usage
Dog myDog = new Dog { Name = "Rex" };
myDog.MakeSound();  // Output: Woof!`,
      `public class Person
{
    public string Name { get; set; }

    public Person(string name)
    {
        Name = name;
    }

    public virtual void Introduce()
    {
        Console.WriteLine($"Hi, I'm {Name}");
    }
}

public class Student : Person
{
    public string StudentId { get; set; }

    public Student(string name, string id) : base(name)
    {
        StudentId = id;
    }

    public override void Introduce()
    {
        base.Introduce();
        Console.WriteLine($"Student ID: {StudentId}");
    }
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What keyword is used to inherit from a class in C#?', 'multiple_choice', $2, ':', 'The colon (:) is used in C# to indicate inheritance. For example: class Dog : Animal', 'easy', 10, 1),
      ($1, 'Can a derived class access protected members of the base class?', 'multiple_choice', $3, 'Yes, protected members are accessible in derived classes', 'Protected members are specifically designed to be accessible in derived classes while remaining hidden from external code.', 'easy', 10, 2)
    `, [
      inheritanceLesson.rows[0].id,
      JSON.stringify([':', 'extends', 'inherits', 'implements']),
      JSON.stringify(['No, only public members are accessible', 'Yes, protected members are accessible in derived classes', 'Only with the base keyword', 'Only in sealed classes'])
    ]);

    // OOP Fundamentals - Lesson 3: Polymorphism
    const polymorphismLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Polymorphism in C#', 'polymorphism-csharp', $2, 'Understand how polymorphism enables flexible and extensible code', 'intermediate', 40, 3, $3)
      RETURNING id
    `, [
      topics['oop-fundamentals'],
      `# Polymorphism in C#

## What is Polymorphism?

**Polymorphism** means "many forms" and is the ability of objects of different types to be accessed through the same interface. It allows you to write more flexible and maintainable code.

## Types of Polymorphism

### 1. Compile-Time Polymorphism (Method Overloading)

Same method name, different parameters:

\`\`\`csharp
public class Calculator
{
    public int Add(int a, int b)
    {
        return a + b;
    }

    public double Add(double a, double b)
    {
        return a + b;
    }

    public int Add(int a, int b, int c)
    {
        return a + b + c;
    }
}
\`\`\`

### 2. Runtime Polymorphism (Method Overriding)

Derived classes provide specific implementations:

\`\`\`csharp
public abstract class Shape
{
    public abstract double CalculateArea();
}

public class Circle : Shape
{
    public double Radius { get; set; }

    public override double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }
}

public class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }

    public override double CalculateArea()
    {
        return Width * Height;
    }
}
\`\`\`

## Abstract Classes vs Interfaces

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Methods | Can have implementation | Only signatures (C# 8+ allows default) |
| Fields | Can have fields | Cannot have fields |
| Inheritance | Single only | Multiple allowed |
| Access Modifiers | Any modifier | Public only |

## Interface Example

\`\`\`csharp
public interface IPlayable
{
    void Play();
    void Pause();
    void Stop();
}

public class AudioPlayer : IPlayable
{
    public void Play() => Console.WriteLine("Playing audio");
    public void Pause() => Console.WriteLine("Paused");
    public void Stop() => Console.WriteLine("Stopped");
}

public class VideoPlayer : IPlayable
{
    public void Play() => Console.WriteLine("Playing video");
    public void Pause() => Console.WriteLine("Paused");
    public void Stop() => Console.WriteLine("Stopped");
}
\`\`\`

## Benefits of Polymorphism

1. **Code Reusability**: Write generic code that works with multiple types
2. **Flexibility**: Easy to add new types without changing existing code
3. **Maintainability**: Changes are localized to specific implementations
4. **Testability**: Easy to mock and test different implementations

## Real-World Example: Payment Processing

\`\`\`csharp
public interface IPaymentProcessor
{
    bool ProcessPayment(decimal amount);
}

public class CreditCardProcessor : IPaymentProcessor
{
    public bool ProcessPayment(decimal amount)
    {
        // Credit card specific logic
        Console.WriteLine(\\\`Processing $\\\${amount} via Credit Card\\\`);
        return true;
    }
}

public class PayPalProcessor : IPaymentProcessor
{
    public bool ProcessPayment(decimal amount)
    {
        // PayPal specific logic
        Console.WriteLine(\\\`Processing $\\\${amount} via PayPal\\\`);
        return true;
    }
}

// Client code
public class PaymentService
{
    public void ProcessOrder(IPaymentProcessor processor, decimal amount)
    {
        if (processor.ProcessPayment(amount))
        {
            Console.WriteLine("Payment successful!");
        }
    }
}
\`\`\`

## Best Practices

1. **Program to Interfaces**: Depend on abstractions, not concrete classes
2. **Open/Closed Principle**: Open for extension, closed for modification
3. **Interface Segregation**: Many specific interfaces better than one general
4. **Use Abstract Classes for Shared Behavior**: Interfaces for contracts

## Common Mistakes

- Overusing inheritance when composition would be better
- Creating interfaces with too many methods
- Forgetting to mark methods as virtual/abstract when needed
- Not using interfaces for dependency injection`,
      [
        'Polymorphism allows treating different types uniformly',
        'Method overloading is compile-time polymorphism',
        'Method overriding enables runtime polymorphism',
        'Interfaces define contracts, abstract classes provide shared behavior'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Method Overloading', 'Compile-time polymorphism example', 'csharp', $2, 'Shows how the same method name can have different signatures', 1),
      ($1, 'Runtime Polymorphism', 'Using abstract classes and overriding', 'csharp', $3, 'Demonstrates how different shapes calculate area differently', 2)
    `, [
      polymorphismLesson.rows[0].id,
      `public class Printer
{
    public void Print(string text)
    {
        Console.WriteLine(text);
    }

    public void Print(int number)
    {
        Console.WriteLine(number.ToString());
    }

    public void Print(string text, bool uppercase)
    {
        Console.WriteLine(uppercase ? text.ToUpper() : text);
    }
}

// Usage
Printer p = new Printer();
p.Print("Hello");          // Calls first method
p.Print(42);               // Calls second method
p.Print("hello", true);    // Calls third method - prints HELLO`,
      `public abstract class Shape
{
    public abstract double CalculateArea();
}

public class Circle : Shape
{
    public double Radius { get; set; }
    public override double CalculateArea() => Math.PI * Radius * Radius;
}

public class Square : Shape
{
    public double Side { get; set; }
    public override double CalculateArea() => Side * Side;
}

// Polymorphic usage
List<Shape> shapes = new List<Shape>
{
    new Circle { Radius = 5 },
    new Square { Side = 4 }
};

foreach (Shape shape in shapes)
{
    Console.WriteLine($"Area: {shape.CalculateArea()}");
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What type of polymorphism is method overloading?', 'multiple_choice', $2, 'Compile-time polymorphism', 'Method overloading is resolved at compile time based on method signatures, making it compile-time (static) polymorphism.', 'medium', 15, 1),
      ($1, 'Can a class implement multiple interfaces in C#?', 'multiple_choice', $3, 'Yes', 'C# allows a class to implement multiple interfaces, which is one way to achieve multiple inheritance of behavior.', 'easy', 10, 2)
    `, [
      polymorphismLesson.rows[0].id,
      JSON.stringify(['Compile-time polymorphism', 'Runtime polymorphism', 'Dynamic polymorphism', 'Static polymorphism']),
      JSON.stringify(['Yes', 'No', 'Only if they are related', 'Only abstract interfaces'])
    ]);

    // React Fundamentals - Lesson 2: Components and Props
    const componentsLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'React Components and Props', 'react-components-props', $2, 'Master component composition and data flow with props', 'beginner', 45, 2, $3)
      RETURNING id
    `, [
      topics['react-fundamentals'],
      `# React Components and Props

## What are Components?

Components are the building blocks of React applications. They let you split the UI into independent, reusable pieces.

## Types of Components

### 1. Function Components (Modern Approach)

\`\`\`javascript
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Arrow function style
const Welcome = (props) => {
  return <h1>Hello, {props.name}!</h1>;
};

// Implicit return for simple components
const Welcome = (props) => <h1>Hello, {props.name}!</h1>;
\`\`\`

### 2. Class Components (Legacy)

\`\`\`javascript
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
\`\`\`

**Note**: Function components are now preferred in modern React.

## Props (Properties)

Props are how you pass data from parent to child components. They are **read-only** and flow downward.

### Basic Props Usage

\`\`\`javascript
function UserCard({ name, email, age }) {
  return (
    <div className="card">
      <h2>{name}</h2>
      <p>Email: {email}</p>
      <p>Age: {age}</p>
    </div>
  );
}

// Usage
<UserCard name="Alice" email="alice@example.com" age={25} />
\`\`\`

### Props Destructuring

\`\`\`javascript
// Without destructuring
function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}

// With destructuring (preferred)
function Button({ onClick, label }) {
  return <button onClick={onClick}>{label}</button>;
}

// With default values
function Button({ onClick, label = "Click me", disabled = false }) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
\`\`\`

## Children Prop

The special \`children\` prop represents content between component tags:

\`\`\`javascript
function Card({ children, title }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

// Usage
<Card title="My Card">
  <p>This is the card content</p>
  <button>Click me</button>
</Card>
\`\`\`

## Prop Types and Validation

While TypeScript is preferred, you can use PropTypes for runtime validation:

\`\`\`javascript
import PropTypes from 'prop-types';

function UserProfile({ name, age, email }) {
  // component code
}

UserProfile.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  email: PropTypes.string.isRequired
};

UserProfile.defaultProps = {
  age: 0
};
\`\`\`

## Component Composition

Build complex UIs by composing simpler components:

\`\`\`javascript
function Avatar({ src, alt }) {
  return <img src={src} alt={alt} className="avatar" />;
}

function UserInfo({ name, email }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

function UserCard({ user }) {
  return (
    <div className="user-card">
      <Avatar src={user.avatar} alt={user.name} />
      <UserInfo name={user.name} email={user.email} />
    </div>
  );
}
\`\`\`

## Spreading Props

Pass all props to a child component:

\`\`\`javascript
function Button(props) {
  return <button {...props} className="custom-button" />;
}

// Usage - all attributes are passed through
<Button onClick={handleClick} disabled={false} type="submit">
  Submit
</Button>
\`\`\`

## Best Practices

1. **Keep Components Small**: Each component should have a single responsibility
2. **Use Destructuring**: Makes props explicit and code cleaner
3. **Provide Default Props**: Prevent undefined errors
4. **Don't Modify Props**: Props are immutable
5. **Use Descriptive Names**: Component and prop names should be clear
6. **Composition Over Conditionals**: Use multiple components instead of complex conditionals

## Common Mistakes

- Mutating props (props are read-only!)
- Using too many props (maybe you need composition?)
- Not destructuring props (harder to read)
- Forgetting to pass required props
- Not using key prop when rendering lists`,
      [
        'Components are reusable UI building blocks',
        'Props pass data from parent to child (one-way flow)',
        'Props are read-only and should never be mutated',
        'Component composition builds complex UIs from simple pieces'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Functional Component with Props', 'Modern React component with destructured props', 'javascript', $2, 'Shows how to create a reusable component with props', 1),
      ($1, 'Component Composition', 'Building complex UI from smaller components', 'javascript', $3, 'Demonstrates composing multiple components together', 2)
    `, [
      componentsLesson.rows[0].id,
      `function ProductCard({ name, price, image, onBuy }) {
  return (
    <div className="product-card">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p className="price">\\\${price}</p>
      <button onClick={() => onBuy(name)}>
        Add to Cart
      </button>
    </div>
  );
}

// Usage
function App() {
  const handleBuy = (productName) => {
    alert(\\\`Added \\\${productName} to cart!\\\`);
  };
  };

  return (
    <ProductCard
      name="Wireless Mouse"
      price={29.99}
      image="/mouse.jpg"
      onBuy={handleBuy}
    />
  );
}`,
      `function Avatar({ src, size = 50 }) {
  return (
    <img 
      src={src} 
      style={{ width: size, height: size, borderRadius: '50%' }}
      alt="avatar"
    />
  );
}

function UserInfo({ name, role }) {
  return (
    <div>
      <h4>{name}</h4>
      <span className="role">{role}</span>
    </div>
  );
}

function UserCard({ user }) {
  return (
    <div className="user-card">
      <Avatar src={user.avatar} size={60} />
      <UserInfo name={user.name} role={user.role} />
    </div>
  );
}

// Usage
const user = {
  name: "John Doe",
  role: "Developer",
  avatar: "/avatar.jpg"
};

<UserCard user={user} />`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'Are props mutable or immutable?', 'multiple_choice', $2, 'Immutable', 'Props are read-only and should never be modified by the child component. They represent data flowing down from parent to child.', 'easy', 10, 1),
      ($1, 'What is the special prop used for content between component tags?', 'multiple_choice', $3, 'children', 'The children prop contains whatever is placed between the opening and closing tags of a component.', 'easy', 10, 2)
    `, [
      componentsLesson.rows[0].id,
      JSON.stringify(['Mutable', 'Immutable', 'Depends on the component', 'Only in class components']),
      JSON.stringify(['content', 'children', 'inner', 'body'])
    ]);

    // Architecture - Lesson 2: Layered Architecture
    const layeredArchLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Layered Architecture Pattern', 'layered-architecture', $2, 'Understand how to organize code into logical layers', 'beginner', 50, 2, $3)
      RETURNING id
    `, [
      topics['basic-architecture'],
      `# Layered Architecture Pattern

## What is Layered Architecture?

Layered architecture is one of the most common architectural patterns. It organizes code into horizontal layers, each with a specific role and responsibility.

## Common Layers

### 1. Presentation Layer (UI Layer)
- Handles user interaction
- Displays information to users
- Captures user input
- Technologies: HTML, CSS, JavaScript, React, Angular

### 2. Business Logic Layer (Application Layer)
- Contains business rules and logic
- Processes user requests
- Coordinates application workflow
- Technologies: Node.js, .NET, Java, Python

### 3. Data Access Layer (Persistence Layer)
- Manages data storage and retrieval
- Abstracts database operations
- Handles queries and transactions
- Technologies: Entity Framework, Sequelize, Mongoose

### 4. Database Layer
- Actual data storage
- Technologies: PostgreSQL, MongoDB, MySQL, SQL Server

## Visual Structure

\`\`\`
┌─────────────────────────────────┐
│   Presentation Layer (UI)       │  ← User Interface
├─────────────────────────────────┤
│   Business Logic Layer          │  ← Business Rules
├─────────────────────────────────┤
│   Data Access Layer             │  ← Database Operations
├─────────────────────────────────┤
│   Database                      │  ← Data Storage
└─────────────────────────────────┘
\`\`\`

## Example: E-Commerce Application

### Presentation Layer
\`\`\`javascript
// React Component
function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Call business layer
    ProductService.getAllProducts()
      .then(setProducts);
  }, []);

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
\`\`\`

### Business Logic Layer
\`\`\`javascript
// Service Layer
class ProductService {
  static async getAllProducts() {
    // Business logic: maybe filter, sort, validate
    const products = await ProductRepository.findAll();
    
    // Apply discount logic
    return products.map(p => ({
      ...p,
      finalPrice: this.calculateDiscount(p)
    }));
  }

  static calculateDiscount(product) {
    if (product.category === 'electronics') {
      return product.price * 0.9; // 10% off
    }
    return product.price;
  }

  static async createProduct(productData) {
    // Validation
    if (!productData.name || !productData.price) {
      throw new Error('Invalid product data');
    }

    // Business rule: minimum price
    if (productData.price < 0.01) {
      throw new Error('Price too low');
    }

    return await ProductRepository.create(productData);
  }
}
\`\`\`

### Data Access Layer
\\\`\\\`\\\`javascript
// Repository Pattern
class ProductRepository {
  static async findAll() {
    const query = 'SELECT * FROM products WHERE active = true';
    return await database.query(query);
  }

  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    return await database.query(query, [id]);
  }

  static async create(product) {
    const query = \\\`
      INSERT INTO products (name, price, category)
      VALUES ($1, $2, $3)
      RETURNING *
    \\\`;
    return await database.query(query, [
      product.name,
      product.price,
      product.category
    ]);
  }

  static async update(id, product) {
    const query = \\\`
      UPDATE products
      SET name = $1, price = $2, category = $3
      WHERE id = $4
      RETURNING *
    \\\`;
    return await database.query(query, [
      product.name,
      product.price,
      product.category,
      id
    ]);
  }
}
\`\`\`

## Benefits

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Maintainability**: Changes in one layer don't affect others
3. **Testability**: Easy to test layers independently
4. **Reusability**: Business logic can be reused across different UIs
5. **Team Organization**: Different teams can work on different layers

## Rules and Best Practices

### Layer Dependencies
- Each layer should only depend on the layer directly below it
- Layers should be loosely coupled
- Use interfaces/abstractions between layers

### Don'ts
❌ Presentation layer directly accessing database
❌ Database queries in UI components
❌ Business logic in repositories
❌ UI concerns in business logic

### Do's
✅ Keep layers focused on their responsibility
✅ Use DTOs (Data Transfer Objects) between layers
✅ Implement proper error handling at each layer
✅ Use dependency injection for flexibility

## When to Use Layered Architecture

**Good For:**
- Traditional web applications
- CRUD applications
- Applications with clear separation of concerns
- Teams new to software architecture

**Not Ideal For:**
- Microservices (too monolithic)
- High-performance systems (layers add overhead)
- Simple applications (over-engineering)

## Common Variations

### Three-Tier Architecture
- Presentation Tier (Client)
- Application Tier (Server)
- Data Tier (Database)
- Physical separation (different servers)

### N-Tier Architecture
- More than three tiers
- Additional layers for specific needs
- Example: Authentication layer, Caching layer, Integration layer

## Modern Alternatives

- **Clean Architecture**: Dependency rule pointing inward
- **Hexagonal Architecture**: Ports and adapters pattern
- **Microservices**: Distributed services instead of layers
- **Event-Driven Architecture**: Asynchronous communication

## Real-World Example: Banking Application

\`\`\`
Presentation Layer:
  - Web UI (React)
  - Mobile App (React Native)
  - Admin Portal (React)

Business Logic Layer:
  - Account Management Service
  - Transaction Service
  - Authentication Service
  - Notification Service

Data Access Layer:
  - Account Repository
  - Transaction Repository
  - User Repository

Database Layer:
  - PostgreSQL (Transactional data)
  - Redis (Caching)
  - MongoDB (Logs)
\`\`\`

## Testing Strategy

- **Unit Tests**: Test each layer independently
- **Integration Tests**: Test layer interactions
- **End-to-End Tests**: Test complete flow through all layers

## Conclusion

Layered architecture provides a solid foundation for organizing code. While it may not be the best fit for every scenario, it's an excellent starting point that's easy to understand and maintain.`,
      [
        'Layered architecture organizes code into horizontal layers',
        'Each layer has a specific responsibility',
        'Layers depend on layers below them',
        'Provides separation of concerns and maintainability'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Three-Layer Example', 'Complete example showing all three layers', 'javascript', $2, 'Shows how a user registration flows through all layers', 1)
    `, [
      layeredArchLesson.rows[0].id,
      `// PRESENTATION LAYER (React Component)
function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await UserService.register({ email, password });
      alert('Registration successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Register</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

// BUSINESS LOGIC LAYER (Service)
class UserService {
  static async register(userData) {
    // Validation (business rule)
    if (!userData.email.includes('@')) {
      throw new Error('Invalid email');
    }
    
    if (userData.password.length < 8) {
      throw new Error('Password too short');
    }

    // Check if user exists (business logic)
    const existing = await UserRepository.findByEmail(userData.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password (business logic)
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    return await UserRepository.create({
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date()
    });
  }
}

// DATA ACCESS LAYER (Repository)
class UserRepository {
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async create(user) {
    const query = \`
      INSERT INTO users (email, password, created_at)
      VALUES ($1, $2, $3)
      RETURNING id, email, created_at
    \`;
    const result = await db.query(query, [
      user.email,
      user.password,
      user.createdAt
    ]);
    return result.rows[0];
  }
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'Which layer should contain business rules and validation?', 'multiple_choice', $2, 'Business Logic Layer', 'The Business Logic Layer (or Application Layer) is responsible for implementing business rules, validation, and application workflow.', 'easy', 10, 1),
      ($1, 'Should the Presentation Layer directly access the Database Layer?', 'multiple_choice', $3, 'No, it should go through Business and Data Access layers', 'In layered architecture, each layer should only communicate with the layer directly below it. The Presentation Layer should call the Business Logic Layer, which then uses the Data Access Layer.', 'medium', 15, 2)
    `, [
      layeredArchLesson.rows[0].id,
      JSON.stringify(['Presentation Layer', 'Business Logic Layer', 'Data Access Layer', 'Database Layer']),
      JSON.stringify(['Yes, for better performance', 'No, it should go through Business and Data Access layers', 'Only for read operations', 'Yes, if using an ORM'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Additional lessons added successfully!');
    
    console.log('\n📊 Added:');
    console.log('  - 3 OOP lessons (Inheritance, Polymorphism)');
    console.log('  - 1 React lesson (Components & Props)');
    console.log('  - 1 Architecture lesson (Layered Architecture)');
    console.log('  - Total: 5 new lessons with code examples and quizzes');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding additional lessons:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedMoreLessons()
  .then(() => {
    console.log('\\n✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
