import pool from '../config/database.js';

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await client.query('TRUNCATE users, categories, topics, lessons, code_examples, quiz_questions, user_progress, quiz_attempts RESTART IDENTITY CASCADE');
    
    // Insert Categories
    console.log('📂 Inserting categories...');
    const categoriesResult = await client.query(`
      INSERT INTO categories (name, slug, description, icon, order_index) VALUES
      ('Software Architecture', 'architecture', 'Master system design from simple applications to complex distributed systems', '🏗️', 1),
      ('Backend Development', 'backend', 'Learn OOP, design patterns, and backend development in C#, Java, Python, or Node.js', '💻', 2),
      ('Frontend Development', 'frontend', 'Build modern user interfaces with React, hooks, and advanced patterns', '🎨', 3)
      RETURNING id, slug
    `);

    const categories = {};
    categoriesResult.rows.forEach(row => {
      categories[row.slug] = row.id;
    });

    // Insert Architecture Topics
    console.log('📚 Inserting architecture topics...');
    const archTopicsResult = await client.query(`
      INSERT INTO topics (category_id, name, slug, description, difficulty_level, estimated_time, order_index) VALUES
      ($1, 'Basic Architecture Concepts', 'basic-architecture', 'Understanding fundamental software architecture principles', 'beginner', 180, 1),
      ($2, 'Scalability & Performance', 'scalability-performance', 'Learn how to scale applications and optimize performance', 'intermediate', 240, 2),
      ($3, 'Microservices Architecture', 'microservices', 'Deep dive into microservices patterns and practices', 'advanced', 300, 3),
      ($4, 'System Design Case Studies', 'system-design-cases', 'Real-world system design interview questions', 'expert', 360, 4)
      RETURNING id, slug
    `, [categories.architecture, categories.architecture, categories.architecture, categories.architecture]);

    // Insert Backend Topics
    console.log('📚 Inserting backend topics...');
    const backendTopicsResult = await client.query(`
      INSERT INTO topics (category_id, name, slug, description, difficulty_level, estimated_time, order_index) VALUES
      ($1, 'OOP Fundamentals', 'oop-fundamentals', 'Master Object-Oriented Programming concepts', 'beginner', 200, 1),
      ($2, 'Design Patterns', 'design-patterns', 'Learn the Gang of Four design patterns', 'intermediate', 280, 2),
      ($3, 'Clean Architecture', 'clean-architecture', 'Build maintainable and testable applications', 'advanced', 320, 3),
      ($4, 'Distributed Systems', 'distributed-systems', 'Master distributed computing patterns', 'expert', 400, 4)
      RETURNING id, slug
    `, [categories.backend, categories.backend, categories.backend, categories.backend]);

    // Insert Frontend Topics
    console.log('📚 Inserting frontend topics...');
    const frontendTopicsResult = await client.query(`
      INSERT INTO topics (category_id, name, slug, description, difficulty_level, estimated_time, order_index) VALUES
      ($1, 'React Basics', 'react-basics', 'Get started with React and JSX', 'beginner', 150, 1),
      ($2, 'React Hooks', 'react-hooks', 'Master useState, useEffect, and custom hooks', 'intermediate', 200, 2),
      ($3, 'Advanced React Patterns', 'advanced-react', 'Learn compound components, render props, and more', 'advanced', 250, 3),
      ($4, 'React Performance', 'react-performance', 'Optimize React applications for production', 'expert', 300, 4)
      RETURNING id, slug
    `, [categories.frontend, categories.frontend, categories.frontend, categories.frontend]);

    const topics = {};
    [...archTopicsResult.rows, ...backendTopicsResult.rows, ...frontendTopicsResult.rows].forEach(row => {
      topics[row.slug] = row.id;
    });

    // Insert Sample Lessons for OOP Fundamentals
    console.log('📝 Inserting lessons...');
    
    // OOP Lesson 1: Classes and Objects
    const lesson1Result = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Classes and Objects in C#', 'classes-objects-csharp', $2, 'Learn the fundamental building blocks of object-oriented programming', 'beginner', 30, 1, $3)
      RETURNING id
    `, [
      topics['oop-fundamentals'],
      `# Classes and Objects in C#

## What are Classes?

A **class** is a blueprint or template that defines the structure and behavior of objects. It encapsulates data (fields) and operations (methods) that can be performed on that data.

## What are Objects?

An **object** is an instance of a class. When you create an object, you're creating a specific realization of the class with its own set of data.

## Basic Syntax

\`\`\`csharp
public class Person
{
    // Fields (data)
    private string name;
    private int age;

    // Constructor
    public Person(string name, int age)
    {
        this.name = name;
        this.age = age;
    }

    // Methods (behavior)
    public void Introduce()
    {
        Console.WriteLine($"Hi, I'm {name} and I'm {age} years old.");
    }

    // Properties
    public string Name
    {
        get { return name; }
        set { name = value; }
    }

    public int Age
    {
        get { return age; }
        set { age = value; }
    }
}
\`\`\`

## Creating and Using Objects

\`\`\`csharp
// Creating an object
Person person1 = new Person("Alice", 25);
Person person2 = new Person("Bob", 30);

// Using the object
person1.Introduce(); // Output: Hi, I'm Alice and I'm 25 years old.
person2.Introduce(); // Output: Hi, I'm Bob and I'm 30 years old.

// Accessing properties
Console.WriteLine(person1.Name); // Output: Alice
person1.Age = 26; // Modifying through property
\`\`\`

## Key Concepts

### Encapsulation
Classes encapsulate data and methods together. Private fields protect data from direct external access.

### Instance vs Class
Each object has its own copy of instance variables, but all objects share the class definition.

### Constructor
A special method called when creating an object to initialize its state.

## Real-World Analogy

Think of a class as a cookie cutter and objects as the actual cookies. The cookie cutter (class) defines the shape, but each cookie (object) is a separate entity that can have different decorations (property values).

## Best Practices

1. **Encapsulate data**: Use private fields with public properties
2. **Meaningful names**: Choose clear, descriptive class and member names
3. **Single Responsibility**: Each class should have one clear purpose
4. **Initialize properly**: Use constructors to ensure objects start in a valid state

## Common Mistakes to Avoid

- Forgetting to instantiate objects (using the class directly)
- Not initializing fields in the constructor
- Making everything public (breaks encapsulation)
- Creating "god classes" that do too much`,
      [
        'A class is a blueprint, an object is an instance of that blueprint',
        'Use private fields with public properties for encapsulation',
        'Constructors initialize object state',
        'Each object maintains its own data'
      ]
    ]);

    // Add code examples for lesson 1
    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Simple Person Class', 'A basic class with fields, constructor, and methods', 'csharp', $2, 'This example demonstrates a complete class with private fields, a constructor, and public methods.', 1),
      ($1, 'Creating Multiple Objects', 'Creating and using multiple instances', 'csharp', $3, 'Shows how each object maintains its own state independently.', 2)
    `, [
      lesson1Result.rows[0].id,
      `public class Person
{
    private string name;
    private int age;

    public Person(string name, int age)
    {
        this.name = name;
        this.age = age;
    }

    public void Introduce()
    {
        Console.WriteLine($"Hi, I'm {name} and I'm {age} years old.");
    }
}`,
      `Person alice = new Person("Alice", 25);
Person bob = new Person("Bob", 30);

alice.Introduce(); // Hi, I'm Alice and I'm 25 years old.
bob.Introduce();   // Hi, I'm Bob and I'm 30 years old.

// Each object has its own data
alice.Age = 26; // Only affects alice, not bob`
    ]);

    // Add quiz questions for lesson 1
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is a class in object-oriented programming?', 'multiple_choice', $2, 'A blueprint or template for creating objects', 'A class is a blueprint that defines the structure and behavior of objects. It''s not the object itself, but rather the definition of what objects of that type should look like.', 'easy', 10, 1),
      ($1, 'What is the purpose of a constructor?', 'multiple_choice', $3, 'To initialize the object when it is created', 'Constructors are special methods that run when an object is created, allowing you to set initial values and ensure the object starts in a valid state.', 'easy', 10, 2),
      ($1, 'Can multiple objects of the same class have different values for their fields?', 'multiple_choice', $4, 'Yes, each object has its own copy of instance variables', 'Each object instance maintains its own separate set of field values. Changing one object''s fields doesn''t affect other objects of the same class.', 'medium', 15, 3)
    `, [
      lesson1Result.rows[0].id,
      JSON.stringify([
        'A blueprint or template for creating objects',
        'An instance of a method',
        'A type of variable',
        'A programming language feature'
      ]),
      JSON.stringify([
        'To destroy the object',
        'To initialize the object when it is created',
        'To copy objects',
        'To compare objects'
      ]),
      JSON.stringify([
        'No, all objects share the same values',
        'Yes, each object has its own copy of instance variables',
        'Only if they are in different namespaces',
        'It depends on the access modifier'
      ])
    ]);

    // React Basics Lesson
    const lesson2Result = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Introduction to JSX', 'intro-jsx', $2, 'Understanding JSX syntax and how to use it in React', 'beginner', 25, 1, $3)
      RETURNING id
    `, [
      topics['react-basics'],
      `# Introduction to JSX

## What is JSX?

JSX (JavaScript XML) is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files. It's one of the defining features of React.

## Why JSX?

JSX makes it easier to write and visualize the UI structure in your React components. It looks like HTML but has the full power of JavaScript.

## Basic Syntax

\`\`\`jsx
// Simple JSX element
const element = <h1>Hello, World!</h1>;

// JSX with JavaScript expressions
const name = "Alice";
const greeting = <h1>Hello, {name}!</h1>;

// JSX with attributes
const link = <a href="https://example.com" target="_blank">Click me</a>;
\`\`\`

## JSX is Not HTML

While JSX looks like HTML, there are important differences:

### className instead of class
\`\`\`jsx
// Correct
<div className="container">Content</div>

// Wrong (class is a JavaScript keyword)
<div class="container">Content</div>
\`\`\`

### camelCase for attributes
\`\`\`jsx
<button onClick={handleClick}>Click me</button>
<input onChange={handleChange} />
\`\`\`

### Self-closing tags must have /
\`\`\`jsx
<img src="image.jpg" />
<input type="text" />
<br />
\`\`\`

## Embedding Expressions

You can embed any JavaScript expression in JSX using curly braces:

\`\`\`jsx
const user = {
  firstName: 'John',
  lastName: 'Doe'
};

const element = (
  <div>
    <h1>Welcome, {user.firstName} {user.lastName}</h1>
    <p>Current time: {new Date().toLocaleTimeString()}</p>
    <p>2 + 2 = {2 + 2}</p>
  </div>
);
\`\`\`

## JSX Represents Objects

JSX is compiled to \`React.createElement()\` calls:

\`\`\`jsx
// This JSX:
const element = <h1 className="greeting">Hello, world!</h1>;

// Is compiled to:
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, world!'
);
\`\`\`

## Conditional Rendering

\`\`\`jsx
// Using ternary operator
const greeting = isLoggedIn ? <h1>Welcome back!</h1> : <h1>Please sign in</h1>;

// Using && operator
{isLoggedIn && <button>Logout</button>}

// Using if-else (outside JSX)
let message;
if (isLoggedIn) {
  message = <h1>Welcome back!</h1>;
} else {
  message = <h1>Please sign in</h1>;
}
\`\`\`

## Lists and Keys

\`\`\`jsx
const numbers = [1, 2, 3, 4, 5];
const listItems = numbers.map((number) => 
  <li key={number}>{number}</li>
);

return <ul>{listItems}</ul>;
\`\`\`

## Best Practices

1. **Use parentheses** for multi-line JSX
2. **Always provide keys** when rendering lists
3. **Keep JSX readable** - break complex JSX into smaller components
4. **Use fragments** (\`<></>\`) to group elements without adding extra DOM nodes

## Common Pitfalls

- Forgetting to wrap multi-line JSX in parentheses
- Using \`class\` instead of \`className\`
- Not closing self-closing tags
- Forgetting curly braces for JavaScript expressions`,
      [
        'JSX is a syntax extension that looks like HTML but is actually JavaScript',
        'Use className instead of class, and camelCase for event handlers',
        'Embed JavaScript expressions using curly braces {}',
        'JSX is compiled to React.createElement() calls'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Basic JSX Component', 'A simple React component using JSX', 'javascript', $2, 'Shows how to create a functional component with JSX', 1),
      ($1, 'JSX with Expressions', 'Embedding JavaScript in JSX', 'javascript', $3, 'Demonstrates using JavaScript expressions within JSX', 2)
    `, [
      lesson2Result.rows[0].id,
      `function Welcome() {
  return (
    <div className="welcome-container">
      <h1>Welcome to React!</h1>
      <p>Let's learn JSX together.</p>
    </div>
  );
}`,
      `function Greeting({ name, age }) {
  const isAdult = age >= 18;
  
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old.</p>
      {isAdult && <p>You are an adult.</p>}
    </div>
  );
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What does JSX stand for?', 'multiple_choice', $2, 'JavaScript XML', 'JSX stands for JavaScript XML. It''s a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files.', 'easy', 10, 1),
      ($1, 'Which is the correct way to add a CSS class in JSX?', 'multiple_choice', $3, 'className', 'In JSX, you must use className instead of class because class is a reserved keyword in JavaScript.', 'easy', 10, 2)
    `, [
      lesson2Result.rows[0].id,
      JSON.stringify(['JavaScript XML', 'Java Syntax Extension', 'JavaScript Syntax', 'JSON XML']),
      JSON.stringify(['class', 'className', 'cssClass', 'style'])
    ]);

    // Architecture Lesson
    const lesson3Result = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Monolithic vs Microservices', 'monolithic-vs-microservices', $2, 'Understanding different architectural patterns and when to use them', 'intermediate', 40, 1, $3)
      RETURNING id
    `, [
      topics['basic-architecture'],
      `# Monolithic vs Microservices Architecture

## Introduction

Choosing the right architecture is crucial for your application's success. Let's explore two fundamental architectural patterns: Monolithic and Microservices.

## Monolithic Architecture

### What is it?

A monolithic application is built as a single, unified unit. All components (UI, business logic, data access) are part of one codebase and deployed together.

### Characteristics

- **Single codebase**: All code in one repository
- **Single deployment**: Deploy entire application at once
- **Shared database**: One database for all features
- **Tightly coupled**: Components depend on each other

### Advantages

✅ **Simple to develop**: Easier to get started
✅ **Simple to test**: All code in one place
✅ **Simple to deploy**: One deployment unit
✅ **Simple to scale**: Scale entire application
✅ **Better performance**: No network calls between components

### Disadvantages

❌ **Large codebase**: Becomes hard to maintain
❌ **Slow deployment**: Must redeploy everything for small changes
❌ **Technology lock-in**: Hard to use different technologies
❌ **Scaling inefficiency**: Must scale entire app even if only one part needs it
❌ **Single point of failure**: If one part fails, entire app fails

## Microservices Architecture

### What is it?

Microservices break an application into small, independent services. Each service handles a specific business capability and can be developed, deployed, and scaled independently.

### Characteristics

- **Multiple services**: Each service is independent
- **Separate databases**: Each service has its own database
- **Independent deployment**: Deploy services separately
- **Loosely coupled**: Services communicate via APIs

### Advantages

✅ **Independent scaling**: Scale only what you need
✅ **Technology flexibility**: Use different technologies per service
✅ **Faster deployment**: Deploy services independently
✅ **Better fault isolation**: One service failure doesn't crash everything
✅ **Team autonomy**: Different teams can work on different services

### Disadvantages

❌ **Complexity**: More moving parts to manage
❌ **Network latency**: Services communicate over network
❌ **Data consistency**: Harder to maintain consistency across services
❌ **Testing challenges**: Integration testing is complex
❌ **Deployment complexity**: Need orchestration tools

## When to Use Each

### Use Monolithic When:

- Starting a new project with a small team
- MVP or proof of concept
- Application domain is well understood and unlikely to change
- Team has limited microservices experience
- Budget/resources are limited

### Use Microservices When:

- Application is large and complex
- Different parts need to scale independently
- Multiple teams working on different features
- Need technology flexibility
- Rapid, independent deployments are crucial

## Real-World Examples

### Monolithic Examples
- WordPress
- Early versions of Twitter, Netflix, Amazon
- Many enterprise applications

### Microservices Examples
- Netflix (current architecture)
- Amazon (current architecture)
- Uber
- Spotify

## The Middle Ground: Modular Monolith

A modular monolith organizes code into well-defined modules within a monolithic architecture. It provides some benefits of microservices while remaining simpler to manage.

## Migration Strategy

If moving from monolithic to microservices:

1. **Start with the monolith**: Don't over-engineer early
2. **Identify boundaries**: Find natural service boundaries
3. **Extract one service**: Start with one microservice
4. **Learn and iterate**: Apply lessons to next service
5. **Use Strangler Pattern**: Gradually replace parts of the monolith

## Key Takeaways

- There's no one-size-fits-all solution
- Start simple, evolve as needed
- Consider your team's skills and resources
- Focus on business value, not just technology trends`,
      [
        'Monolithic apps are simpler but become hard to maintain as they grow',
        'Microservices offer flexibility and scalability but add complexity',
        'Choose based on team size, budget, and requirements',
        'You can start with a monolith and evolve to microservices later'
      ]
    ]);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  - 3 Categories');
    console.log('  - 12 Topics');
    console.log('  - 3 Sample Lessons');
    console.log('  - Code examples and quizzes included');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(error => {
  console.error('Seed failed:', error);
  process.exit(1);
});
