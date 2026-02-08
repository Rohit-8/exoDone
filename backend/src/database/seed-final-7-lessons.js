import pool from '../config/database.js';

async function seed7Lessons() {
  const client = await pool.connect();
  let created = 0;
  
  try {
    // Get all topic IDs
    const topicsResult = await client.query(`
      SELECT id, slug FROM topics 
      WHERE slug IN ('typescript-react', 'testing-react', 'nextjs-ssr', 'api-design', 'caching-strategies', 'cloud-architecture', 'database-design')
    `);
    
    const topics = {};
    topicsResult.rows.forEach(row => topics[row.slug] = row.id);
    
    console.log('🌱 Starting to seed 7 lessons...\n');

    // 1. TypeScript with React
    try {
      await client.query('BEGIN');
      const lesson1 = await client.query(`
        INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        topics['typescript-react'],
        'TypeScript with React - Complete Guide',
        'typescript-with-react-guide',
        '# TypeScript with React\n\n## Introduction\n\nTypeScript brings static typing to React, helping catch errors at compile time and improving code quality.\n\n## Typing Components\n\n### Functional Components\n\n```typescript\ninterface Props {\n  name: string;\n  age: number;\n  onSubmit: (data: string) => void;\n}\n\nconst UserCard: React.FC<Props> = ({ name, age, onSubmit }) => {\n  return <div onClick={() => onSubmit(name)}>{name} - {age}</div>;\n};\n```\n\n## Hooks with TypeScript\n\n### useState\n\n```typescript\nconst [count, setCount] = useState<number>(0);\nconst [user, setUser] = useState<User | null>(null);\n```\n\n### useEffect\n\n```typescript\nuseEffect(() => {\n  const fetchData = async () => {\n    const data = await api.getUser();\n    setUser(data);\n  };\n  fetchData();\n}, []);\n```\n\n## Event Handlers\n\n```typescript\nconst handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {\n  console.log(e.currentTarget);\n};\n\nconst handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n  console.log(e.target.value);\n};\n```\n\n## Generic Components\n\n```typescript\ninterface ListProps<T> {\n  items: T[];\n  renderItem: (item: T) => React.ReactNode;\n}\n\nfunction List<T>({ items, renderItem }: ListProps<T>) {\n  return <ul>{items.map(renderItem)}</ul>;\n}\n```',
        'Master TypeScript with React: type components, props, hooks, and build type-safe applications',
        'intermediate',
        55,
        1,
        ['Typing functional components and props', 'Using TypeScript with hooks', 'Event handler types', 'Generic components']
      ]);
      
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lesson1.rows[0].id,
        'TypeScript Component Example',
        'Complete typed React component',
        'typescript',
        'interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\ninterface UserListProps {\n  users: User[];\n  onUserClick: (user: User) => void;\n}\n\nconst UserList: React.FC<UserListProps> = ({ users, onUserClick }) => {\n  return (\n    <div>\n      {users.map(user => (\n        <div key={user.id} onClick={() => onUserClick(user)}>\n          {user.name} - {user.email}\n        </div>\n      ))}\n    </div>\n  );\n};',
        'Demonstrates TypeScript interfaces and component typing',
        1
      ]);
      
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        lesson1.rows[0].id,
        'How do you type a functional component in TypeScript?',
        'multiple_choice',
        '["component: Component", "React.FC<Props>", "FunctionComponent", "ReactComponent<Props>"]',
        'React.FC<Props>',
        'React.FC is the type for functional components, and Props define the component props',
        'easy',
        10,
        1,
        lesson1.rows[0].id,
        'What is the correct way to type useState with an object?',
        'multiple_choice',
        '["useState({})", "useState<User>(null)", "useState: User", "useState as User"]',
        'useState<User>(null)',
        'Use angle brackets with the type and provide initial value',
        'medium',
        15,
        2
      ]);
      
      await client.query('COMMIT');
      console.log('✅ 1/7 TypeScript with React');
      created++;
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code !== '23505') console.error('Error:', e.message);
    }

    // 2. Testing React Apps
    try {
      await client.query('BEGIN');
      const lesson2 = await client.query(`
        INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        topics['testing-react'],
        'Testing React Applications',
        'testing-react-applications',
        '# Testing React Applications\n\n## Introduction\n\nTesting ensures your React components work correctly and prevents bugs.\n\n## React Testing Library\n\n### Setup\n\n```bash\nnpm install --save-dev @testing-library/react @testing-library/jest-dom\n```\n\n### Basic Test\n\n```javascript\nimport { render, screen } from "@testing-library/react";\nimport userEvent from "@testing-library/user-event";\nimport Counter from "./Counter";\n\ntest("increments counter", async () => {\n  render(<Counter />);\n  const button = screen.getByRole("button", { name: /increment/i });\n  await userEvent.click(button);\n  expect(screen.getByText("Count: 1")).toBeInTheDocument();\n});\n```\n\n## Testing Patterns\n\n### Testing Props\n\n```javascript\ntest("renders user name", () => {\n  render(<UserCard name="John" />);\n  expect(screen.getByText("John")).toBeInTheDocument();\n});\n```\n\n### Testing Events\n\n```javascript\ntest("calls onClick when clicked", async () => {\n  const handleClick = jest.fn();\n  render(<Button onClick={handleClick} />);\n  await userEvent.click(screen.getByRole("button"));\n  expect(handleClick).toHaveBeenCalledTimes(1);\n});\n```\n\n## Mocking\n\n### Mock API Calls\n\n```javascript\njest.mock("./api");\n\ntest("loads data", async () => {\n  api.fetchUsers.mockResolvedValue([{ id: 1, name: "John" }]);\n  render(<UserList />);\n  expect(await screen.findByText("John")).toBeInTheDocument();\n});\n```',
        'Learn to test React components with Jest and React Testing Library',
        'intermediate',
        60,
        1,
        ['React Testing Library fundamentals', 'Testing user interactions', 'Mocking API calls', 'Component testing patterns']
      ]);
      
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lesson2.rows[0].id,
        'Component Test Example',
        'Testing a form component',
        'javascript',
        'import { render, screen } from "@testing-library/react";\nimport userEvent from "@testing-library/user-event";\nimport LoginForm from "./LoginForm";\n\ntest("submits form with credentials", async () => {\n  const onSubmit = jest.fn();\n  render(<LoginForm onSubmit={onSubmit} />);\n  \n  await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");\n  await userEvent.type(screen.getByLabelText(/password/i), "password123");\n  await userEvent.click(screen.getByRole("button", { name: /submit/i }));\n  \n  expect(onSubmit).toHaveBeenCalledWith({\n    email: "user@example.com",\n    password: "password123"\n  });\n});',
        'Shows how to test form interactions and submissions',
        1
      ]);
      
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        lesson2.rows[0].id,
        'What is the recommended library for testing React components?',
        'multiple_choice',
        '["Enzyme", "React Testing Library", "Mocha", "Jasmine"]',
        'React Testing Library',
        'React Testing Library is the modern standard for testing React components',
        'easy',
        10,
        1,
        lesson2.rows[0].id,
        'How do you simulate user interactions in tests?',
        'multiple_choice',
        '["jest.simulate()", "userEvent from @testing-library/user-event", "fireEvent only", "react-test-renderer"]',
        'userEvent from @testing-library/user-event',
        'userEvent provides realistic user interaction simulation',
        'medium',
        15,
        2
      ]);
      
      await client.query('COMMIT');
      console.log('✅ 2/7 Testing React Apps');
      created++;
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code !== '23505') console.error('Error:', e.message);
    }

    // 3. Next.js & SSR
    try {
      await client.query('BEGIN');
      const lesson3 = await client.query(`
        INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        topics['nextjs-ssr'],
        'Next.js and Server-Side Rendering',
        'nextjs-ssr-complete',
        '# Next.js and Server-Side Rendering\n\n## Introduction\n\nNext.js is a React framework for production with built-in SSR, SSG, and routing.\n\n## Rendering Strategies\n\n### SSR (Server-Side Rendering)\n\nPage is rendered on each request:\n\n```javascript\nexport async function getServerSideProps(context) {\n  const data = await fetchData();\n  return { props: { data } };\n}\n\nexport default function Page({ data }) {\n  return <div>{data.title}</div>;\n}\n```\n\n### SSG (Static Site Generation)\n\nPage is pre-rendered at build time:\n\n```javascript\nexport async function getStaticProps() {\n  const data = await fetchData();\n  return { props: { data }, revalidate: 60 };\n}\n```\n\n### ISR (Incremental Static Regeneration)\n\nCombines SSG with on-demand revalidation:\n\n```javascript\nexport async function getStaticProps() {\n  return {\n    props: { data },\n    revalidate: 10 // Revalidate every 10 seconds\n  };\n}\n```\n\n## App Router (Next.js 13+)\n\n### Server Components\n\n```javascript\n// app/page.js (Server Component by default)\nasync function getData() {\n  const res = await fetch("https://api.example.com/data");\n  return res.json();\n}\n\nexport default async function Page() {\n  const data = await getData();\n  return <div>{data.title}</div>;\n}\n```\n\n### Client Components\n\n```javascript\n"use client";\n\nimport { useState } from "react";\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n```\n\n## Routing\n\n```\napp/\n  page.js          → /\n  about/page.js    → /about\n  blog/[slug]/page.js → /blog/:slug\n```',
        'Build production apps with Next.js: SSR, SSG, App Router, and data fetching',
        'advanced',
        60,
        1,
        ['SSR vs SSG vs ISR differences', 'Next.js App Router patterns', 'Server and Client Components', 'Data fetching strategies']
      ]);
      
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lesson3.rows[0].id,
        'Next.js Server Component',
        'Fetching data in Server Component',
        'javascript',
        '// app/users/page.js\nasync function getUsers() {\n  const res = await fetch("https://api.example.com/users", {\n    cache: "no-store" // Always fetch fresh data\n  });\n  return res.json();\n}\n\nexport default async function UsersPage() {\n  const users = await getUsers();\n  \n  return (\n    <div>\n      <h1>Users</h1>\n      <ul>\n        {users.map(user => (\n          <li key={user.id}>{user.name}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}',
        'Server Components can directly fetch data without useEffect',
        1
      ]);
      
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        lesson3.rows[0].id,
        'What is the main difference between SSR and SSG?',
        'multiple_choice',
        '["SSR renders on each request, SSG renders at build time", "SSR is faster than SSG", "SSG cannot use dynamic data", "SSR does not support routing"]',
        'SSR renders on each request, SSG renders at build time',
        'SSR generates HTML on every request, SSG pre-renders at build time',
        'easy',
        10,
        1,
        lesson3.rows[0].id,
        'How do you mark a component as a Client Component in Next.js 13+?',
        'multiple_choice',
        '["Add client prop", "Use use client directive", "Import from next/client", "Set isClient = true"]',
        'Use use client directive',
        'Add "use client" at the top of the file to make it a Client Component',
        'medium',
        15,
        2
      ]);
      
      await client.query('COMMIT');
      console.log('✅ 3/7 Next.js & SSR');
      created++;
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code !== '23505') console.error('Error:', e.message);
    }

    // 4. API Design
    try {
      await client.query('BEGIN');
      const lesson4 = await client.query(`
        INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        topics['api-design'],
        'API Design and Best Practices',
        'api-design-best-practices',
        '# API Design and Best Practices\n\n## RESTful API Design\n\n### Resource Naming\n\n```\nGood:\n  GET /api/users\n  GET /api/users/123\n  POST /api/users\n  PUT /api/users/123\n  DELETE /api/users/123\n\nBad:\n  GET /api/getUsers\n  POST /api/createUser\n```\n\n### HTTP Methods\n\n- **GET**: Retrieve data (idempotent)\n- **POST**: Create new resource\n- **PUT**: Update entire resource (idempotent)\n- **PATCH**: Partial update\n- **DELETE**: Remove resource (idempotent)\n\n### Status Codes\n\n- **200 OK**: Success\n- **201 Created**: Resource created\n- **400 Bad Request**: Invalid input\n- **401 Unauthorized**: No auth\n- **404 Not Found**: Resource not found\n- **500 Internal Server Error**: Server error\n\n## Versioning\n\n### URL Versioning\n\n```\n/api/v1/users\n/api/v2/users\n```\n\n### Header Versioning\n\n```\nAccept: application/vnd.api+json; version=1\n```\n\n## Pagination\n\n```javascript\nGET /api/users?page=1&limit=20\n\nResponse:\n{\n  "data": [...],\n  "pagination": {\n    "page": 1,\n    "limit": 20,\n    "total": 100,\n    "pages": 5\n  }\n}\n```\n\n## Filtering and Sorting\n\n```\nGET /api/users?role=admin&sort=-createdAt\nGET /api/products?price[gte]=100&price[lte]=500\n```\n\n## Error Responses\n\n```json\n{\n  "success": false,\n  "error": {\n    "code": "VALIDATION_ERROR",\n    "message": "Invalid email address",\n    "details": [\n      {\n        "field": "email",\n        "message": "Must be a valid email"\n      }\n    ]\n  }\n}\n```\n\n## GraphQL vs REST\n\n### REST\n✅ Simple, widely understood\n✅ HTTP caching\n❌ Over-fetching/under-fetching\n❌ Multiple round trips\n\n### GraphQL\n✅ Fetch exactly what you need\n✅ Single request\n❌ More complex\n❌ Caching is harder',
        'Design robust, scalable APIs following REST principles and industry best practices',
        'intermediate',
        55,
        1,
        ['RESTful API design principles', 'API versioning strategies', 'Pagination and filtering', 'Error handling patterns']
      ]);
      
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lesson4.rows[0].id,
        'RESTful API Example',
        'Complete API with best practices',
        'javascript',
        'const express = require("express");\nconst router = express.Router();\n\n// GET /api/v1/users?page=1&limit=10&role=admin\nrouter.get("/users", async (req, res) => {\n  const { page = 1, limit = 10, role } = req.query;\n  \n  const query = {};\n  if (role) query.role = role;\n  \n  const users = await User.find(query)\n    .limit(limit * 1)\n    .skip((page - 1) * limit);\n  \n  const count = await User.countDocuments(query);\n  \n  res.json({\n    success: true,\n    data: users,\n    pagination: {\n      page: parseInt(page),\n      limit: parseInt(limit),\n      total: count,\n      pages: Math.ceil(count / limit)\n    }\n  });\n});\n\n// POST /api/v1/users\nrouter.post("/users", async (req, res) => {\n  try {\n    const user = await User.create(req.body);\n    res.status(201).json({\n      success: true,\n      data: user\n    });\n  } catch (error) {\n    res.status(400).json({\n      success: false,\n      error: {\n        code: "VALIDATION_ERROR",\n        message: error.message\n      }\n    });\n  }\n});',
        'Demonstrates pagination, filtering, and error handling',
        1
      ]);
      
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        lesson4.rows[0].id,
        'Which HTTP method should be used to create a new resource?',
        'multiple_choice',
        '["GET", "POST", "PUT", "PATCH"]',
        'POST',
        'POST is the standard HTTP method for creating new resources',
        'easy',
        10,
        1,
        lesson4.rows[0].id,
        'What status code should be returned when a resource is successfully created?',
        'multiple_choice',
        '["200 OK", "201 Created", "204 No Content", "202 Accepted"]',
        '201 Created',
        '201 Created indicates a resource was successfully created',
        'medium',
        15,
        2
      ]);
      
      await client.query('COMMIT');
      console.log('✅ 4/7 API Design');
      created++;
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code !== '23505') console.error('Error:', e.message);
    }

    // 5. Caching Strategies
    try {
      await client.query('BEGIN');
      const lesson5 = await client.query(`
        INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        topics['caching-strategies'],
        'Caching Strategies and Patterns',
        'caching-strategies-patterns',
        '# Caching Strategies and Patterns\n\n## Introduction\n\nCaching improves performance by storing frequently accessed data in fast storage.\n\n## Cache Levels\n\n1. **Browser Cache**: HTML, CSS, JS, images\n2. **CDN Cache**: Static assets, API responses\n3. **Application Cache**: Redis, Memcached\n4. **Database Cache**: Query results, indexes\n\n## Redis Caching\n\n### Setup\n\n```javascript\nconst redis = require("redis");\nconst client = redis.createClient();\n\nawait client.connect();\n```\n\n### Basic Operations\n\n```javascript\n// Set with expiration\nawait client.setEx("user:123", 3600, JSON.stringify(user));\n\n// Get\nconst cached = await client.get("user:123");\nif (cached) {\n  return JSON.parse(cached);\n}\n\n// Delete\nawait client.del("user:123");\n```\n\n## Cache Patterns\n\n### Cache-Aside (Lazy Loading)\n\n```javascript\nasync function getUser(id) {\n  // Try cache first\n  const cached = await redis.get(`user:${id}`);\n  if (cached) return JSON.parse(cached);\n  \n  // Load from database\n  const user = await db.users.findById(id);\n  \n  // Store in cache\n  await redis.setEx(`user:${id}`, 3600, JSON.stringify(user));\n  \n  return user;\n}\n```\n\n### Write-Through\n\nWrite to cache and database simultaneously:\n\n```javascript\nasync function updateUser(id, data) {\n  // Update database\n  const user = await db.users.update(id, data);\n  \n  // Update cache\n  await redis.setEx(`user:${id}`, 3600, JSON.stringify(user));\n  \n  return user;\n}\n```\n\n### Write-Behind\n\nWrite to cache immediately, database later:\n\n```javascript\nasync function updateUser(id, data) {\n  // Update cache immediately\n  await redis.setEx(`user:${id}`, 3600, JSON.stringify(data));\n  \n  // Queue database write\n  await queue.add("update-user", { id, data });\n}\n```\n\n## Cache Invalidation\n\n### Time-Based (TTL)\n\n```javascript\nawait redis.setEx("key", 3600, value); // Expires in 1 hour\n```\n\n### Event-Based\n\n```javascript\n// Invalidate on update\nawait db.users.update(id, data);\nawait redis.del(`user:${id}`);\n```\n\n### Cache Tags\n\n```javascript\nawait redis.sAdd("tag:users", "user:1", "user:2");\n\n// Invalidate all users\nconst keys = await redis.sMembers("tag:users");\nawait redis.del(keys);\n```\n\n## CDN Caching\n\n### Cache-Control Headers\n\n```javascript\nres.setHeader("Cache-Control", "public, max-age=3600");\nres.setHeader("ETag", generateETag(content));\n```',
        'Implement effective caching with Redis, CDN, and various cache patterns',
        'advanced',
        55,
        1,
        ['Redis caching patterns', 'Cache-aside vs write-through', 'Cache invalidation strategies', 'CDN caching']
      ]);
      
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lesson5.rows[0].id,
        'Redis Cache-Aside Pattern',
        'Implementing cache-aside pattern',
        'javascript',
        'const redis = require("redis");\nconst client = redis.createClient();\n\nclass UserService {\n  async getUser(id) {\n    const cacheKey = `user:${id}`;\n    \n    // Try cache first\n    const cached = await client.get(cacheKey);\n    if (cached) {\n      console.log("Cache hit");\n      return JSON.parse(cached);\n    }\n    \n    console.log("Cache miss");\n    \n    // Load from database\n    const user = await db.users.findById(id);\n    \n    if (!user) {\n      throw new Error("User not found");\n    }\n    \n    // Store in cache for 1 hour\n    await client.setEx(\n      cacheKey,\n      3600,\n      JSON.stringify(user)\n    );\n    \n    return user;\n  }\n  \n  async updateUser(id, data) {\n    // Update database\n    const user = await db.users.update(id, data);\n    \n    // Invalidate cache\n    await client.del(`user:${id}`);\n    \n    return user;\n  }\n}',
        'Complete cache-aside implementation with invalidation',
        1
      ]);
      
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        lesson5.rows[0].id,
        'What is the cache-aside pattern?',
        'multiple_choice',
        '["Writing to cache then database", "Reading from cache, loading from DB on miss", "Always updating cache and DB together", "Using CDN for caching"]',
        'Reading from cache, loading from DB on miss',
        'Cache-aside checks cache first, loads from database on miss, then stores in cache',
        'easy',
        10,
        1,
        lesson5.rows[0].id,
        'What is a common cache invalidation strategy?',
        'multiple_choice',
        '["Never invalidate", "Time-based expiration (TTL)", "Manual deletion only", "Random eviction"]',
        'Time-based expiration (TTL)',
        'TTL automatically expires cached data after a specified time period',
        'medium',
        15,
        2
      ]);
      
      await client.query('COMMIT');
      console.log('✅ 5/7 Caching Strategies');
      created++;
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code !== '23505') console.error('Error:', e.message);
    }

    // 6. Cloud Architecture
    try {
      await client.query('BEGIN');
      const lesson6 = await client.query(`
        INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        topics['cloud-architecture'],
        'Cloud Architecture Fundamentals',
        'cloud-architecture-fundamentals',
        '# Cloud Architecture Fundamentals\n\n## Cloud Providers\n\n### Major Providers\n\n- **AWS**: Most comprehensive, mature\n- **Azure**: Microsoft ecosystem integration\n- **Google Cloud**: AI/ML, analytics\n- **DigitalOcean**: Simple, developer-friendly\n\n## Serverless Architecture\n\n### AWS Lambda\n\n```javascript\nexports.handler = async (event) => {\n  const { name } = JSON.parse(event.body);\n  \n  return {\n    statusCode: 200,\n    body: JSON.stringify({\n      message: `Hello ${name}`\n    })\n  };\n};\n```\n\n### Benefits\n\n✅ No server management\n✅ Auto-scaling\n✅ Pay per execution\n✅ Built-in high availability\n\n### Limitations\n\n❌ Cold start latency\n❌ Execution time limits\n❌ Stateless\n\n## Container Orchestration\n\n### Kubernetes Basics\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: myapp\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: myapp\n  template:\n    metadata:\n      labels:\n        app: myapp\n    spec:\n      containers:\n      - name: myapp\n        image: myapp:latest\n        ports:\n        - containerPort: 3000\n```\n\n### Service\n\n```yaml\napiVersion: v1\nkind: Service\nmetadata:\n  name: myapp-service\nspec:\n  type: LoadBalancer\n  ports:\n  - port: 80\n    targetPort: 3000\n  selector:\n    app: myapp\n```\n\n## Cloud-Native Patterns\n\n### 12-Factor App\n\n1. **Codebase**: One codebase in version control\n2. **Dependencies**: Explicitly declare dependencies\n3. **Config**: Store config in environment\n4. **Backing Services**: Treat as attached resources\n5. **Build, Release, Run**: Strict separation\n6. **Processes**: Execute as stateless processes\n7. **Port Binding**: Export services via port binding\n8. **Concurrency**: Scale out via process model\n9. **Disposability**: Fast startup and shutdown\n10. **Dev/Prod Parity**: Keep environments similar\n11. **Logs**: Treat logs as event streams\n12. **Admin Processes**: Run as one-off processes\n\n## Infrastructure as Code\n\n### Terraform Example\n\n```hcl\nresource "aws_instance" "web" {\n  ami           = "ami-0c55b159cbfafe1f0"\n  instance_type = "t2.micro"\n  \n  tags = {\n    Name = "WebServer"\n  }\n}\n```',
        'Architect scalable cloud applications with AWS, serverless, and Kubernetes',
        'advanced',
        60,
        1,
        ['Cloud providers comparison', 'Serverless architectures', 'Kubernetes fundamentals', 'Cloud-native patterns']
      ]);
      
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lesson6.rows[0].id,
        'Serverless API with AWS Lambda',
        'Complete serverless function',
        'javascript',
        'const AWS = require("aws-sdk");\nconst dynamodb = new AWS.DynamoDB.DocumentClient();\n\nexports.handler = async (event) => {\n  const { httpMethod, pathParameters, body } = event;\n  \n  try {\n    switch (httpMethod) {\n      case "GET":\n        const result = await dynamodb.get({\n          TableName: "Users",\n          Key: { id: pathParameters.id }\n        }).promise();\n        \n        return {\n          statusCode: 200,\n          body: JSON.stringify(result.Item)\n        };\n        \n      case "POST":\n        const data = JSON.parse(body);\n        \n        await dynamodb.put({\n          TableName: "Users",\n          Item: data\n        }).promise();\n        \n        return {\n          statusCode: 201,\n          body: JSON.stringify({ success: true })\n        };\n        \n      default:\n        return {\n          statusCode: 405,\n          body: JSON.stringify({ error: "Method not allowed" })\n        };\n    }\n  } catch (error) {\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ error: error.message })\n    };\n  }\n};',
        'AWS Lambda function with DynamoDB integration',
        1
      ]);
      
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        lesson6.rows[0].id,
        'What is a main benefit of serverless architecture?',
        'multiple_choice',
        '["Faster execution", "No server management and auto-scaling", "Cheaper always", "Better security"]',
        'No server management and auto-scaling',
        'Serverless eliminates server management and automatically scales with demand',
        'easy',
        10,
        1,
        lesson6.rows[0].id,
        'What is Kubernetes used for?',
        'multiple_choice',
        '["Database management", "Container orchestration", "Code deployment only", "Serverless functions"]',
        'Container orchestration',
        'Kubernetes orchestrates and manages containerized applications at scale',
        'medium',
        15,
        2
      ]);
      
      await client.query('COMMIT');
      console.log('✅ 6/7 Cloud Architecture');
      created++;
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code !== '23505') console.error('Error:', e.message);
    }

    // 7. Database Design
    try {
      await client.query('BEGIN');
      const lesson7 = await client.query(`
        INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        topics['database-design'],
        'Database Design and Optimization',
        'database-design-optimization',
        '# Database Design and Optimization\n\n## SQL vs NoSQL\n\n### When to Use SQL\n\n✅ Complex queries and joins\n✅ ACID transactions required\n✅ Structured data with clear schema\n✅ Strong consistency needed\n\n**Examples**: PostgreSQL, MySQL, SQL Server\n\n### When to Use NoSQL\n\n✅ Flexible schema\n✅ Horizontal scaling\n✅ High write throughput\n✅ Document or key-value data\n\n**Examples**: MongoDB, Cassandra, Redis\n\n## Normalization\n\n### 1NF (First Normal Form)\n\n- Atomic values (no arrays)\n- Each column has unique name\n- No duplicate rows\n\n### 2NF (Second Normal Form)\n\n- Meets 1NF\n- No partial dependencies\n\n### 3NF (Third Normal Form)\n\n- Meets 2NF\n- No transitive dependencies\n\n### Example\n\n```sql\n-- Bad (Not normalized)\nCREATE TABLE orders (\n  id INT PRIMARY KEY,\n  customer_name VARCHAR(100),\n  customer_email VARCHAR(100),\n  product_name VARCHAR(100),\n  product_price DECIMAL(10,2)\n);\n\n-- Good (Normalized)\nCREATE TABLE customers (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(100) UNIQUE\n);\n\nCREATE TABLE products (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  price DECIMAL(10,2)\n);\n\nCREATE TABLE orders (\n  id INT PRIMARY KEY,\n  customer_id INT REFERENCES customers(id),\n  product_id INT REFERENCES products(id),\n  created_at TIMESTAMP\n);\n```\n\n## Indexing\n\n### Index Types\n\n```sql\n-- B-Tree Index (default)\nCREATE INDEX idx_email ON users(email);\n\n-- Composite Index\nCREATE INDEX idx_name_city ON users(last_name, city);\n\n-- Unique Index\nCREATE UNIQUE INDEX idx_username ON users(username);\n\n-- Partial Index\nCREATE INDEX idx_active_users ON users(email) WHERE active = true;\n```\n\n### When to Index\n\n✅ Columns in WHERE clauses\n✅ Foreign keys\n✅ Columns in ORDER BY\n✅ Columns in JOIN conditions\n\n❌ Small tables\n❌ Frequently updated columns\n❌ Columns with low cardinality\n\n## Query Optimization\n\n### Use EXPLAIN\n\n```sql\nEXPLAIN ANALYZE\nSELECT * FROM users WHERE email = "user@example.com";\n```\n\n### Avoid SELECT *\n\n```sql\n-- Bad\nSELECT * FROM users;\n\n-- Good\nSELECT id, name, email FROM users;\n```\n\n### Use JOINs Efficiently\n\n```sql\n-- Use INNER JOIN when possible\nSELECT u.name, o.total\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE o.status = "completed";\n```\n\n## Scaling Strategies\n\n### Vertical Scaling\n\nAdd more resources to single server\n\n✅ Simple\n❌ Limited\n❌ Single point of failure\n\n### Horizontal Scaling\n\n#### Read Replicas\n\n```\nMaster (Write) → Replica 1 (Read)\n                → Replica 2 (Read)\n                → Replica 3 (Read)\n```\n\n#### Sharding\n\nPartition data across multiple databases:\n\n```\nUsers 1-1000 → Shard 1\nUsers 1001-2000 → Shard 2\nUsers 2001-3000 → Shard 3\n```',
        'Design efficient databases with proper normalization, indexing, and scaling strategies',
        'intermediate',
        55,
        1,
        ['SQL vs NoSQL decision criteria', 'Normalization principles', 'Index design and optimization', 'Scaling with replicas and sharding']
      ]);
      
      await client.query(`
        INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lesson7.rows[0].id,
        'Optimized Database Schema',
        'Normalized schema with indexes',
        'sql',
        '-- Users table\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  username VARCHAR(50) UNIQUE NOT NULL,\n  email VARCHAR(100) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_users_username ON users(username);\n\n-- Posts table\nCREATE TABLE posts (\n  id SERIAL PRIMARY KEY,\n  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  title VARCHAR(200) NOT NULL,\n  content TEXT,\n  status VARCHAR(20) DEFAULT "draft",\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_posts_user_id ON posts(user_id);\nCREATE INDEX idx_posts_status ON posts(status);\nCREATE INDEX idx_posts_created_at ON posts(created_at DESC);\n\n-- Comments table\nCREATE TABLE comments (\n  id SERIAL PRIMARY KEY,\n  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,\n  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  content TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_comments_post_id ON comments(post_id);\nCREATE INDEX idx_comments_user_id ON comments(user_id);',
        'Well-designed schema with proper relationships and indexes',
        1
      ]);
      
      await client.query(`
        INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        lesson7.rows[0].id,
        'What is the main purpose of database normalization?',
        'multiple_choice',
        '["Improve query speed", "Reduce data redundancy and improve integrity", "Increase storage space", "Simplify queries"]',
        'Reduce data redundancy and improve integrity',
        'Normalization eliminates redundant data and ensures data integrity',
        'easy',
        10,
        1,
        lesson7.rows[0].id,
        'When should you create an index on a database column?',
        'multiple_choice',
        '["On every column", "On columns frequently used in WHERE clauses", "Only on primary keys", "Never, they slow down queries"]',
        'On columns frequently used in WHERE clauses',
        'Indexes speed up queries that filter by those columns',
        'medium',
        15,
        2
      ]);
      
      await client.query('COMMIT');
      console.log('✅ 7/7 Database Design');
      created++;
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code !== '23505') console.error('Error:', e.message);
    }

    console.log(`\n✅ Successfully created ${created}/7 lessons!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed7Lessons();
