import pool from '../config/database.js';

async function seedRemainingTopics() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding lessons for remaining topics...');

    // Get topic IDs
    const topicsResult = await client.query('SELECT id, slug FROM topics');
    const topics = {};
    topicsResult.rows.forEach(row => {
      topics[row.slug] = row.id;
    });

    // ============= ARCHITECTURE TOPICS =============

    // 1. Scalability & Performance
    const scalabilityLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Understanding Scalability', 'understanding-scalability', $2, 'Learn how to scale applications to handle millions of users', 'intermediate', 45, 1, $3)
      RETURNING id
    `, [
      topics['scalability-performance'],
      `# Understanding Scalability

## What is Scalability?

**Scalability** is the ability of a system to handle increased load by adding resources. A scalable application can grow to meet demand without performance degradation.

## Types of Scaling

### 1. Vertical Scaling (Scale Up)
Adding more power to existing machines:

**Pros:**
- Simpler to implement
- No code changes needed
- Data consistency easier

**Cons:**
- Hardware limits (can't add infinite RAM/CPU)
- Single point of failure
- Downtime during upgrades
- Expensive at high levels

**Example:** Upgrading server from 8GB to 32GB RAM

### 2. Horizontal Scaling (Scale Out)
Adding more machines to your pool:

**Pros:**
- No theoretical limit
- Better fault tolerance
- More cost-effective
- Linear growth possible

**Cons:**
- More complex architecture
- Need load balancing
- Data synchronization challenges
- State management issues

**Example:** Adding 5 more servers to handle traffic

## Load Balancing

Distributes incoming requests across multiple servers:

\\\`\\\`\\\`
         [Load Balancer]
              |
     ---------|----------
     |        |         |
  [Server1] [Server2] [Server3]
\\\`\\\`\\\`

### Load Balancing Algorithms

1. **Round Robin**: Distribute sequentially
2. **Least Connections**: Send to server with fewest active connections
3. **IP Hash**: Same client always goes to same server
4. **Weighted**: Assign more requests to more powerful servers

### Popular Load Balancers
- Nginx
- HAProxy
- AWS Elastic Load Balancer
- Azure Load Balancer

## Caching Strategies

Cache frequently accessed data to reduce database load:

### 1. Cache-Aside (Lazy Loading)
\\\`\\\`\\\`javascript
async function getData(key) {
  // Try cache first
  let data = await cache.get(key);
  
  if (!data) {
    // Cache miss - fetch from database
    data = await database.query(key);
    // Store in cache for next time
    await cache.set(key, data, ttl: 3600);
  }
  
  return data;
}
\\\`\\\`\\\`

### 2. Write-Through Cache
Write to cache and database simultaneously

### 3. Write-Behind Cache
Write to cache immediately, database asynchronously

### 4. Refresh-Ahead
Automatically refresh cache before expiration

## Database Scaling Techniques

### 1. Database Indexing
Create indexes on frequently queried columns:

\\\`\\\`\\\`sql
-- Dramatically speeds up queries
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_date ON orders(created_at);
\\\`\\\`\\\`

### 2. Database Replication

**Master-Slave:**
- Master handles writes
- Slaves handle reads
- Reduces load on master

**Master-Master:**
- Both handle reads and writes
- More complex conflict resolution

### 3. Database Sharding

Split data across multiple databases:

\\\`\\\`\\\`
Users 1-1000    → Shard 1
Users 1001-2000 → Shard 2
Users 2001-3000 → Shard 3
\\\`\\\`\\\`

**Sharding Strategies:**
- Range-based: user_id ranges
- Hash-based: hash(user_id) % num_shards
- Geographic: by location

## Content Delivery Network (CDN)

Distribute static assets globally:

\\\`\\\`\\\`
User in USA → CDN Edge Server (New York)
User in Europe → CDN Edge Server (London)
User in Asia → CDN Edge Server (Singapore)
\\\`\\\`\\\`

**Benefits:**
- Reduced latency
- Lower bandwidth costs
- DDoS protection
- Automatic caching

**Popular CDNs:**
- Cloudflare
- AWS CloudFront
- Akamai
- Fastly

## Asynchronous Processing

Offload heavy tasks to background workers:

\\\`\\\`\\\`javascript
// Instead of this (blocking):
app.post('/send-email', async (req, res) => {
  await sendEmail(req.body);  // Takes 3 seconds!
  res.json({ success: true });
});

// Do this (non-blocking):
app.post('/send-email', async (req, res) => {
  await queue.add('email', req.body);
  res.json({ success: true, message: 'Email queued' });
});

// Worker process handles actual sending
worker.process('email', async (job) => {
  await sendEmail(job.data);
});
\\\`\\\`\\\`

## Performance Monitoring

### Key Metrics to Track

1. **Response Time**: How long requests take
2. **Throughput**: Requests per second
3. **Error Rate**: Percentage of failed requests
4. **Resource Usage**: CPU, Memory, Disk I/O
5. **Database Query Time**: Slow query identification

### Tools
- New Relic
- Datadog
- Prometheus + Grafana
- Application Insights

## Best Practices

1. **Profile Before Optimizing**: Measure to find bottlenecks
2. **Cache Aggressively**: But with proper invalidation
3. **Use CDN for Static Assets**: Images, CSS, JS
4. **Optimize Database Queries**: Use EXPLAIN, add indexes
5. **Implement Rate Limiting**: Prevent abuse
6. **Use Connection Pooling**: Reuse database connections
7. **Compress Responses**: Gzip/Brotli compression
8. **Lazy Load Resources**: Load what's needed when needed

## Common Bottlenecks

1. **Database**: Most common bottleneck
2. **Network I/O**: External API calls
3. **CPU-bound operations**: Complex calculations
4. **Memory leaks**: Gradual performance degradation
5. **Single-threaded operations**: No parallelization

## Real-World Example: Scaling Instagram

1. **Started**: Single server, monolithic app
2. **Phase 1**: Vertical scaling (bigger servers)
3. **Phase 2**: Horizontal scaling (multiple app servers)
4. **Phase 3**: Database sharding by user ID
5. **Phase 4**: CDN for photos
6. **Phase 5**: Cassandra for timeline storage
7. **Current**: Thousands of servers, multiple data centers`,
      [
        'Vertical scaling adds power, horizontal scaling adds machines',
        'Load balancing distributes traffic across servers',
        'Caching reduces database load dramatically',
        'Monitor and measure before optimizing'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Simple Cache Implementation', 'Cache-aside pattern in Node.js', 'javascript', $2, 'Shows how to implement basic caching with fallback to database', 1),
      ($1, 'Load Balancer Configuration', 'Nginx load balancer setup', 'nginx', $3, 'Basic round-robin load balancing configuration', 2)
    `, [
      scalabilityLesson.rows[0].id,
      `const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function getUserProfile(userId) {
  const cacheKey = \\\`user:\\\${userId}\\\`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    console.log('Cache hit');
    return cached.data;
  }
  
  // Cache miss - fetch from database
  console.log('Cache miss - fetching from DB');
  const user = await db.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  
  // Store in cache
  cache.set(cacheKey, {
    data: user,
    expires: Date.now() + CACHE_TTL
  });
  
  return user;
}`,
      `upstream backend {
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
    server 192.168.1.12:3000;
}

server {
    listen 80;
    server_name myapp.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main advantage of horizontal scaling?', 'multiple_choice', $2, 'No theoretical limit to scaling', 'Horizontal scaling allows you to add more machines indefinitely, unlike vertical scaling which is limited by hardware capabilities.', 'medium', 15, 1),
      ($1, 'Which caching strategy writes to cache immediately but database asynchronously?', 'multiple_choice', $3, 'Write-Behind', 'Write-Behind (or Write-Back) caching writes to cache immediately for fast response, then writes to database asynchronously in the background.', 'medium', 15, 2)
    `, [
      scalabilityLesson.rows[0].id,
      JSON.stringify(['Cheaper than vertical scaling', 'No theoretical limit to scaling', 'Easier to implement', 'No code changes needed']),
      JSON.stringify(['Cache-Aside', 'Write-Through', 'Write-Behind', 'Refresh-Ahead'])
    ]);

    // 2. React Hooks - useState and useEffect
    const hooksLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'React Hooks - useState & useEffect', 'react-hooks-basics', $2, 'Master the fundamental hooks for state and side effects', 'beginner', 50, 1, $3)
      RETURNING id
    `, [
      topics['react-hooks'],
      `# React Hooks - useState & useEffect

## What are Hooks?

Hooks are functions that let you "hook into" React features from function components. They were introduced in React 16.8 to enable state and lifecycle features without writing classes.

## Why Hooks?

**Before Hooks (Class Components):**
\\\`\\\`\\\`javascript
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  render() {
    return (
      <button onClick={() => this.setState({ count: this.state.count + 1 })}>
        Count: {this.state.count}
      </button>
    );
  }
}
\\\`\\\`\\\`

**With Hooks (Function Components):**
\\\`\\\`\\\`javascript
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\\\`\\\`\\\`

## useState Hook

Adds state to function components:

### Basic Usage
\\\`\\\`\\\`javascript
import { useState } from 'react';

function Example() {
  // Declare a state variable
  const [count, setCount] = useState(0);
  //     [value, setter]      initial value
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\\\`\\\`\\\`

### Multiple State Variables
\\\`\\\`\\\`javascript
function UserProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(0);
  
  return (
    <form>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Name"
      />
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email"
      />
      <input 
        type="number"
        value={age} 
        onChange={(e) => setAge(Number(e.target.value))} 
        placeholder="Age"
      />
    </form>
  );
}
\\\`\\\`\\\`

### State with Objects
\\\`\\\`\\\`javascript
function UserForm() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    age: 0
  });
  
  const handleChange = (field, value) => {
    setUser(prevUser => ({
      ...prevUser,      // Keep other fields
      [field]: value    // Update specific field
    }));
  };
  
  return (
    <form>
      <input 
        value={user.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <input 
        value={user.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
    </form>
  );
}
\\\`\\\`\\\`

### State with Arrays
\\\`\\\`\\\`javascript
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  
  const addTodo = () => {
    setTodos([...todos, { id: Date.now(), text: input }]);
    setInput('');
  };
  
  const removeTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  return (
    <div>
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={addTodo}>Add</button>
      
      {todos.map(todo => (
        <div key={todo.id}>
          {todo.text}
          <button onClick={() => removeTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
\\\`\\\`\\\`

### Lazy Initial State

For expensive computations:
\\\`\\\`\\\`javascript
// ❌ Bad - runs on every render
const [data, setData] = useState(expensiveComputation());

// ✅ Good - runs only once
const [data, setData] = useState(() => expensiveComputation());
\\\`\\\`\\\`

## useEffect Hook

Performs side effects in function components:

### Basic Syntax
\\\`\\\`\\\`javascript
useEffect(() => {
  // Effect code here
  
  return () => {
    // Cleanup code (optional)
  };
}, [dependencies]);
\\\`\\\`\\\`

### Running Once (Component Mount)
\\\`\\\`\\\`javascript
useEffect(() => {
  console.log('Component mounted');
  
  // Fetch data, set up subscriptions, etc.
  fetchUserData();
}, []); // Empty array = run once
\\\`\\\`\\\`

### Running on Every Render
\\\`\\\`\\\`javascript
useEffect(() => {
  console.log('Component rendered');
}); // No dependency array
\\\`\\\`\\\`

### Running When Dependencies Change
\\\`\\\`\\\`javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // Runs when userId changes
  
  return <div>{user?.name}</div>;
}
\\\`\\\`\\\`

### Cleanup Function

Important for preventing memory leaks:
\\\`\\\`\\\`javascript
useEffect(() => {
  // Subscribe to something
  const subscription = api.subscribe(data => {
    console.log(data);
  });
  
  // Cleanup when component unmounts
  return () => {
    subscription.unsubscribe();
  };
}, []);
\\\`\\\`\\\`

### Real Example: Fetching Data
\\\`\\\`\\\`javascript
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
\\\`\\\`\\\`

### Timer Example
\\\`\\\`\\\`javascript
function Clock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    // Cleanup: clear interval when component unmounts
    return () => clearInterval(timer);
  }, []);
  
  return <div>{time.toLocaleTimeString()}</div>;
}
\\\`\\\`\\\`

## Common Patterns

### 1. Debouncing with useEffect
\\\`\\\`\\\`javascript
function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    // Delay search by 500ms
    const timer = setTimeout(() => {
      if (query) {
        searchAPI(query).then(setResults);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  return (
    <input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
\\\`\\\`\\\`

### 2. Document Title
\\\`\\\`\\\`javascript
function PageTitle({ title }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  
  return <h1>{title}</h1>;
}
\\\`\\\`\\\`

### 3. Local Storage Sync
\\\`\\\`\\\`javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}

// Usage
function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
\\\`\\\`\\\`

## Rules of Hooks

1. **Only call hooks at the top level**: Don't call hooks inside loops, conditions, or nested functions
2. **Only call hooks from React functions**: Function components or custom hooks

\\\`\\\`\\\`javascript
// ❌ Wrong
function Component() {
  if (condition) {
    const [state, setState] = useState(0); // Conditional hook!
  }
}

// ✅ Correct
function Component() {
  const [state, setState] = useState(0);
  
  if (condition) {
    // Use the state here
  }
}
\\\`\\\`\\\`

## Best Practices

1. **Separate concerns**: Multiple useEffect for different purposes
2. **Specify dependencies correctly**: Include all values from component scope
3. **Use functional updates**: When new state depends on old state
4. **Clean up effects**: Prevent memory leaks
5. **Extract custom hooks**: Reuse stateful logic

## Common Mistakes

1. **Missing dependencies**: Leads to stale closures
2. **Infinite loops**: Effect that updates dependency
3. **Not cleaning up**: Memory leaks with subscriptions
4. **Mutating state directly**: Always use setter function`,
      [
        'useState adds state to function components',
        'useEffect handles side effects and lifecycle',
        'Always specify effect dependencies correctly',
        'Clean up effects to prevent memory leaks'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Counter with useState', 'Simple counter demonstrating state', 'javascript', $2, 'Basic example of useState for managing a counter', 1),
      ($1, 'Data Fetching with useEffect', 'Fetching and displaying API data', 'javascript', $3, 'Complete example of fetching data with loading and error states', 2)
    `, [
      hooksLesson.rows[0].id,
      `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const increment = () => setCount(count + step);
  const decrement = () => setCount(count - step);
  const reset = () => setCount(0);

  return (
    <div>
      <h2>Count: {count}</h2>
      
      <div>
        <button onClick={decrement}>-</button>
        <button onClick={increment}>+</button>
        <button onClick={reset}>Reset</button>
      </div>

      <div>
        <label>
          Step: 
          <input 
            type="number" 
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}`,
      `import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('https://api.example.com/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        
        const data = await response.json();
        
        if (!cancelled) {
          setUsers(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUsers();

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, []); // Empty deps = run once on mount

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  );
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What does useState return?', 'multiple_choice', $2, 'An array with current state and setter function', 'useState returns an array with two elements: [currentValue, setterFunction]. We use array destructuring to access them.', 'easy', 10, 1),
      ($1, 'What does an empty dependency array [] in useEffect mean?', 'multiple_choice', $3, 'Run only once on mount', 'An empty dependency array means the effect has no dependencies, so it runs once when the component mounts and the cleanup runs when it unmounts.', 'easy', 10, 2)
    `, [
      hooksLesson.rows[0].id,
      JSON.stringify(['A single value', 'An array with current state and setter function', 'An object with state properties', 'A function']),
      JSON.stringify(['Run on every render', 'Never run', 'Run only once on mount', 'Run only on unmount'])
    ]);

    // 3. Design Patterns - Singleton & Factory
    const patternsLesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Creational Design Patterns', 'creational-patterns', $2, 'Master Singleton, Factory, and Builder patterns', 'intermediate', 55, 1, $3)
      RETURNING id
    `, [
      topics['design-patterns'],
      `# Creational Design Patterns

## What are Design Patterns?

Design patterns are reusable solutions to common software design problems. They represent best practices evolved over time by experienced developers.

## Gang of Four (GoF)

The classic book "Design Patterns: Elements of Reusable Object-Oriented Software" by Gang of Four introduced 23 design patterns in three categories:

1. **Creational**: Object creation mechanisms
2. **Structural**: Object composition
3. **Behavioral**: Object interaction and responsibility

## Singleton Pattern

Ensures a class has only one instance and provides global access to it.

### When to Use
- Database connections
- Configuration managers
- Logging services
- Cache managers

### C# Implementation
\\\`\\\`\\\`csharp
public sealed class DatabaseConnection
{
    private static DatabaseConnection _instance = null;
    private static readonly object _lock = new object();
    
    // Private constructor prevents instantiation
    private DatabaseConnection()
    {
        Console.WriteLine("Database connection initialized");
    }
    
    public static DatabaseConnection Instance
    {
        get
        {
            // Thread-safe lazy initialization
            if (_instance == null)
            {
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = new DatabaseConnection();
                    }
                }
            }
            return _instance;
        }
    }
    
    public void Query(string sql)
    {
        Console.WriteLine(\\\`Executing: \\\${sql}\\\`);
    }
}

// Usage
var db1 = DatabaseConnection.Instance;
var db2 = DatabaseConnection.Instance;
// db1 and db2 are the same instance
\\\`\\\`\\\`

### Modern C# with Lazy<T>
\\\`\\\`\\\`csharp
public sealed class Logger
{
    private static readonly Lazy<Logger> _instance = 
        new Lazy<Logger>(() => new Logger());
    
    private Logger() { }
    
    public static Logger Instance => _instance.Value;
    
    public void Log(string message)
    {
        Console.WriteLine(\\\`[LOG] \\\${message}\\\`);
    }
}
\\\`\\\`\\\`

### JavaScript/Node.js Implementation
\\\`\\\`\\\`javascript
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    
    this.connection = null;
    DatabaseConnection.instance = this;
  }
  
  connect() {
    if (!this.connection) {
      this.connection = 'Connected to DB';
      console.log(this.connection);
    }
  }
  
  query(sql) {
    console.log(\\\`Executing: \\\${sql}\\\`);
  }
}

// Usage
const db1 = new DatabaseConnection();
const db2 = new DatabaseConnection();
console.log(db1 === db2); // true
\\\`\\\`\\\`

### ⚠️ Singleton Drawbacks

1. **Global State**: Can lead to hidden dependencies
2. **Testing Difficulty**: Hard to mock
3. **Thread Safety**: Requires careful implementation
4. **Violates Single Responsibility**: Manages own creation

**Alternative**: Dependency Injection

## Factory Pattern

Creates objects without specifying exact class.

### When to Use
- Complex object creation logic
- Multiple similar objects
- Hide creation complexity
- Runtime object type determination

### Simple Factory
\\\`\\\`\\\`csharp
// Product interface
public interface INotification
{
    void Send(string message);
}

// Concrete products
public class EmailNotification : INotification
{
    public void Send(string message)
    {
        Console.WriteLine(\\\`Email: \\\${message}\\\`);
    }
}

public class SMSNotification : INotification
{
    public void Send(string message)
    {
        Console.WriteLine(\\\`SMS: \\\${message}\\\`);
    }
}

public class PushNotification : INotification
{
    public void Send(string message)
    {
        Console.WriteLine(\\\`Push: \\\${message}\\\`);
    }
}

// Factory
public class NotificationFactory
{
    public static INotification Create(string type)
    {
        return type.ToLower() switch
        {
            "email" => new EmailNotification(),
            "sms" => new SMSNotification(),
            "push" => new PushNotification(),
            _ => throw new ArgumentException("Invalid type")
        };
    }
}

// Usage
var notification = NotificationFactory.Create("email");
notification.Send("Hello World");
\\\`\\\`\\\`

### Factory Method Pattern
\\\`\\\`\\\`csharp
// Creator abstract class
public abstract class DocumentCreator
{
    public abstract IDocument CreateDocument();
    
    public void OpenDocument()
    {
        var doc = CreateDocument();
        doc.Open();
    }
}

// Concrete creators
public class PDFCreator : DocumentCreator
{
    public override IDocument CreateDocument()
    {
        return new PDFDocument();
    }
}

public class WordCreator : DocumentCreator
{
    public override IDocument CreateDocument()
    {
        return new WordDocument();
    }
}

// Product interface
public interface IDocument
{
    void Open();
}

// Concrete products
public class PDFDocument : IDocument
{
    public void Open() => Console.WriteLine("Opening PDF");
}

public class WordDocument : IDocument
{
    public void Open() => Console.WriteLine("Opening Word");
}
\\\`\\\`\\\`

### Abstract Factory Pattern
\\\`\\\`\\\`csharp
// Abstract factory
public interface IUIFactory
{
    IButton CreateButton();
    ICheckbox CreateCheckbox();
}

// Concrete factories
public class WindowsFactory : IUIFactory
{
    public IButton CreateButton() => new WindowsButton();
    public ICheckbox CreateCheckbox() => new WindowsCheckbox();
}

public class MacFactory : IUIFactory
{
    public IButton CreateButton() => new MacButton();
    public ICheckbox CreateCheckbox() => new MacCheckbox();
}

// Products
public interface IButton { void Click(); }
public interface ICheckbox { void Check(); }

public class WindowsButton : IButton
{
    public void Click() => Console.WriteLine("Windows button clicked");
}

public class MacButton : IButton
{
    public void Click() => Console.WriteLine("Mac button clicked");
}

// Usage
IUIFactory factory = GetFactory(); // Returns Windows or Mac factory
IButton button = factory.CreateButton();
button.Click();
\\\`\\\`\\\`

## Builder Pattern

Constructs complex objects step by step.

### When to Use
- Many constructor parameters
- Optional parameters
- Immutable objects
- Step-by-step construction

### Implementation
\\\`\\\`\\\`csharp
public class Pizza
{
    public string Size { get; set; }
    public bool Cheese { get; set; }
    public bool Pepperoni { get; set; }
    public bool Bacon { get; set; }
    public string Crust { get; set; }
}

public class PizzaBuilder
{
    private Pizza _pizza = new Pizza();
    
    public PizzaBuilder SetSize(string size)
    {
        _pizza.Size = size;
        return this;
    }
    
    public PizzaBuilder AddCheese()
    {
        _pizza.Cheese = true;
        return this;
    }
    
    public PizzaBuilder AddPepperoni()
    {
        _pizza.Pepperoni = true;
        return this;
    }
    
    public PizzaBuilder AddBacon()
    {
        _pizza.Bacon = true;
        return this;
    }
    
    public PizzaBuilder SetCrust(string crust)
    {
        _pizza.Crust = crust;
        return this;
    }
    
    public Pizza Build()
    {
        return _pizza;
    }
}

// Usage - fluent interface
var pizza = new PizzaBuilder()
    .SetSize("Large")
    .AddCheese()
    .AddPepperoni()
    .SetCrust("Thin")
    .Build();
\\\`\\\`\\\`

## Prototype Pattern

Creates objects by cloning existing ones.

\\\`\\\`\\\`csharp
public interface ICloneable<T>
{
    T Clone();
}

public class ShapePrototype : ICloneable<ShapePrototype>
{
    public string Type { get; set; }
    public string Color { get; set; }
    
    public ShapePrototype Clone()
    {
        return new ShapePrototype
        {
            Type = this.Type,
            Color = this.Color
        };
    }
}

// Usage
var original = new ShapePrototype { Type = "Circle", Color = "Red" };
var clone = original.Clone();
clone.Color = "Blue"; // Doesn't affect original
\\\`\\\`\\\`

## Best Practices

1. **Don't overuse patterns**: Use when appropriate
2. **Understand trade-offs**: Each pattern has pros/cons
3. **Keep it simple**: Don't add unnecessary complexity
4. **Combine patterns**: Patterns work together
5. **Focus on intent**: Why you're using the pattern

## Common Mistakes

1. Using Singleton for everything (anti-pattern)
2. Over-engineering with patterns
3. Not considering alternatives (dependency injection vs singleton)
4. Ignoring modern language features (C# 9+ records, init properties)`,
      [
        'Singleton ensures single instance globally',
        'Factory creates objects without specifying exact class',
        'Builder constructs complex objects step-by-step',
        'Use patterns when they solve real problems, not just for the sake of it'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Thread-Safe Singleton', 'Production-ready singleton implementation', 'csharp', $2, 'Uses Lazy<T> for thread-safe lazy initialization', 1),
      ($1, 'Factory with Strategy', 'Factory pattern creating payment processors', 'csharp', $3, 'Real-world factory pattern for payment processing', 2)
    `, [
      patternsLesson.rows[0].id,
      `using System;

public sealed class ConfigurationManager
{
    private static readonly Lazy<ConfigurationManager> _instance =
        new Lazy<ConfigurationManager>(() => new ConfigurationManager());

    private Dictionary<string, string> _settings;

    private ConfigurationManager()
    {
        // Load configuration
        _settings = new Dictionary<string, string>
        {
            { "AppName", "MyApp" },
            { "Version", "1.0.0" },
            { "Environment", "Production" }
        };
    }

    public static ConfigurationManager Instance => _instance.Value;

    public string GetSetting(string key)
    {
        return _settings.TryGetValue(key, out var value) ? value : null;
    }

    public void SetSetting(string key, string value)
    {
        _settings[key] = value;
    }
}

// Usage
var config = ConfigurationManager.Instance;
Console.WriteLine(config.GetSetting("AppName")); // MyApp`,
      `public interface IPaymentProcessor
{
    bool ProcessPayment(decimal amount);
}

public class CreditCardProcessor : IPaymentProcessor
{
    public bool ProcessPayment(decimal amount)
    {
        Console.WriteLine(\\\`Processing $\\\${amount} via Credit Card\\\`);
        // Credit card processing logic
        return true;
    }
}

public class PayPalProcessor : IPaymentProcessor
{
    public bool ProcessPayment(decimal amount)
    {
        Console.WriteLine(\\\`Processing $\\\${amount} via PayPal\\\`);
        // PayPal API integration
        return true;
    }
}

public class CryptoProcessor : IPaymentProcessor
{
    public bool ProcessPayment(decimal amount)
    {
        Console.WriteLine(\\\`Processing $\\\${amount} via Cryptocurrency\\\`);
        // Crypto processing logic
        return true;
    }
}

public class PaymentProcessorFactory
{
    public static IPaymentProcessor Create(string paymentMethod)
    {
        return paymentMethod.ToLower() switch
        {
            "creditcard" => new CreditCardProcessor(),
            "paypal" => new PayPalProcessor(),
            "crypto" => new CryptoProcessor(),
            _ => throw new ArgumentException(\\\`Unknown payment method: \\\${paymentMethod}\\\`)
        };
    }
}

// Usage
var processor = PaymentProcessorFactory.Create("paypal");
bool success = processor.ProcessPayment(99.99m);`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main purpose of the Singleton pattern?', 'multiple_choice', $2, 'Ensure a class has only one instance', 'The Singleton pattern ensures that a class has only one instance throughout the application lifetime and provides a global point of access to it.', 'easy', 10, 1),
      ($1, 'Which pattern is best for creating objects with many optional parameters?', 'multiple_choice', $3, 'Builder', 'The Builder pattern is ideal for constructing complex objects with many optional parameters. It provides a fluent interface for step-by-step construction.', 'medium', 15, 2)
    `, [
      patternsLesson.rows[0].id,
      JSON.stringify(['Ensure a class has only one instance', 'Create objects without specifying class', 'Define object interfaces', 'Separate object construction']),
      JSON.stringify(['Singleton', 'Factory', 'Builder', 'Prototype'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Remaining topic lessons added successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  - Scalability & Performance (Architecture)');
    console.log('  - React Hooks (Frontend)');
    console.log('  - Design Patterns (Backend)');
    console.log('  - Total: 3 comprehensive new lessons');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding lessons:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedRemainingTopics()
  .then(() => {
    console.log('\n✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
