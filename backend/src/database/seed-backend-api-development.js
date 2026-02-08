import pool from '../config/database.js';

async function seedAPIDevBackend() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding API Development lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'api-development'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Building RESTful APIs', 'building-restful-apis', $2, 'Learn to build production-ready REST APIs with best practices', 'beginner', 45, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Building RESTful APIs

## What is a REST API?

**REST** (Representational State Transfer) is an architectural style for designing networked applications. REST APIs use HTTP requests to perform CRUD operations.

## HTTP Methods

| Method | Purpose | Idempotent? | Safe? |
|--------|---------|-------------|-------|
| GET | Retrieve data | ✅ Yes | ✅ Yes |
| POST | Create new resource | ❌ No | ❌ No |
| PUT | Update/Replace entire resource | ✅ Yes | ❌ No |
| PATCH | Partial update | ❌ No | ❌ No |
| DELETE | Remove resource | ✅ Yes | ❌ No |

## HTTP Status Codes

### 2xx Success
- **200 OK**: Request succeeded
- **201 Created**: New resource created
- **204 No Content**: Success but no content to return

### 4xx Client Errors
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Conflict with current state
- **422 Unprocessable Entity**: Validation failed

### 5xx Server Errors
- **500 Internal Server Error**: Generic server error
- **503 Service Unavailable**: Server overloaded/down

## RESTful API Design

### Resource Naming

✅ **Good**:
\\\`\\\`\\\`
GET    /users          // Get all users
GET    /users/123      // Get specific user
POST   /users          // Create user
PUT    /users/123      // Update user
DELETE /users/123      // Delete user
GET    /users/123/posts // Get user's posts
\\\`\\\`\\\`

❌ **Bad**:
\\\`\\\`\\\`
GET /getAllUsers
GET /getUserById/123
POST /createUser
GET /user-posts/123
\\\`\\\`\\\`

### Use Nouns, Not Verbs
- ✅ \`/users\` (noun)
- ❌ \`/getUsers\` (verb)

### Use Plural for Collections
- ✅ \`/users\`
- ❌ \`/user\`

### Hierarchical Structure
\\\`\\\`\\\`
/users/123/posts/456/comments
\\\`\\\`\\\`

## Building a Simple API (Node.js/Express)

### Setup

\\\`\\\`\\\`javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

// In-memory data store (use database in production)
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];
let nextId = 3;

// Routes will go here...

const PORT = 3000;
app.listen(PORT, () => {
  console.log(\\\`Server running on port \\\${PORT}\\\`);
});
\\\`\\\`\\\`

### GET - Retrieve All Users

\\\`\\\`\\\`javascript
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    count: users.length
  });
});
\\\`\\\`\\\`

### GET - Retrieve Single User

\\\`\\\`\\\`javascript
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});
\\\`\\\`\\\`

### POST - Create User

\\\`\\\`\\\`javascript
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;

  // Validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }

  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      error: 'Email already exists'
    });
  }

  const newUser = {
    id: nextId++,
    name,
    email
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    data: newUser
  });
});
\\\`\\\`\\\`

### PUT - Update User

\\\`\\\`\\\`javascript
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email } = req.body;

  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }

  // Update user
  users[userIndex] = {
    id: userId,
    name,
    email
  };

  res.json({
    success: true,
    data: users[userIndex]
  });
});
\\\`\\\`\\\`

### DELETE - Remove User

\\\`\\\`\\\`javascript
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  users.splice(userIndex, 1);

  res.status(204).send(); // No content
});
\\\`\\\`\\\`

## Input Validation

### Using Joi

\\\`\\\`\\\`javascript
const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120)
});

app.post('/api/users', (req, res) => {
  // Validate request body
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Create user with validated data
  const newUser = {
    id: nextId++,
    ...value
  };

  users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
});
\\\`\\\`\\\`

## Error Handling

### Global Error Handler

\\\`\\\`\\\`javascript
// Error handling middleware (put at the end)
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});
\\\`\\\`\\\`

### Custom Error Class

\\\`\\\`\\\`javascript
class APIError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

// Usage
app.get('/api/users/:id', (req, res, next) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return next(new APIError('User not found', 404));
  }

  res.json({ success: true, data: user });
});
\\\`\\\`\\\`

## Query Parameters

### Filtering, Sorting, Pagination

\\\`\\\`\\\`javascript
app.get('/api/users', (req, res) => {
  let result = [...users];

  // Filter by name
  if (req.query.name) {
    result = result.filter(u => 
      u.name.toLowerCase().includes(req.query.name.toLowerCase())
    );
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort;
    result.sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedResult = result.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedResult,
    pagination: {
      page,
      limit,
      total: result.length,
      pages: Math.ceil(result.length / limit)
    }
  });
});
\\\`\\\`\\\`

## API Documentation

### Swagger/OpenAPI

\\\`\\\`\\\`javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'A simple user management API'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Success
 */
\\\`\\\`\\\`

## Best Practices

1. **Versioning**: \`/api/v1/users\`
2. **Use HTTPS**: Always in production
3. **Rate Limiting**: Prevent abuse
4. **CORS**: Configure properly
5. **Consistent Response Format**: Always same structure
6. **Descriptive Error Messages**: Help developers debug
7. **Authentication**: Protect sensitive endpoints
8. **Logging**: Log all requests
9. **Testing**: Write tests for all endpoints
10. **Documentation**: Keep API docs updated

## Complete Example

\\\`\\\`\\\`javascript
const express = require('express');
const helmet = require('helmet'); // Security headers
const cors = require('cors');
const morgan = require('morgan'); // Logging
const rateLimit = require('express-rate-limit');

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/posts', require('./routes/posts'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message
  });
});

module.exports = app;
\\\`\\\`\\\``,
      [
        'Use proper HTTP methods and status codes',
        'Design resource-oriented URLs with nouns, not verbs',
        'Validate input data and handle errors gracefully',
        'Document your API with Swagger/OpenAPI'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Complete CRUD API', 'Full user management API', 'javascript', $2, 'Production-ready REST API with validation and error handling', 1)
    `, [
      lesson.rows[0].id,
      `const express = require('express');
const Joi = require('joi');
const app = express();

app.use(express.json());

// Data store
let users = [];
let nextId = 1;

// Validation schema
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120).optional()
});

// GET all users with filtering and pagination
app.get('/api/users', (req, res) => {
  let result = [...users];

  // Filter
  if (req.query.name) {
    result = result.filter(u => 
      u.name.toLowerCase().includes(req.query.name.toLowerCase())
    );
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  res.json({
    success: true,
    data: result.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: result.length,
      pages: Math.ceil(result.length / limit)
    }
  });
});

// GET single user
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({ success: true, data: user });
});

// POST create user
app.post('/api/users', (req, res) => {
  // Validate
  const { error, value } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check duplicate email
  if (users.some(u => u.email === value.email)) {
    return res.status(409).json({
      success: false,
      error: 'Email already exists'
    });
  }

  // Create user
  const newUser = { id: nextId++, ...value };
  users.push(newUser);

  res.status(201).json({
    success: true,
    data: newUser
  });
});

// PUT update user
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Validate
  const { error, value } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Update
  users[userIndex] = { id: userId, ...value };

  res.json({
    success: true,
    data: users[userIndex]
  });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  users.splice(userIndex, 1);
  res.status(204).send();
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'Which HTTP method should be used to create a new resource?', 'multiple_choice', $2, 'POST', 'POST is used to create new resources. It is not idempotent, meaning multiple identical requests will create multiple resources.', 'easy', 10, 1),
      ($1, 'What HTTP status code should be returned when a resource is successfully created?', 'multiple_choice', $3, '201 Created', '201 Created is the appropriate status code for successful resource creation. It indicates that the request has been fulfilled and a new resource has been created.', 'easy', 10, 2)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['GET', 'POST', 'PUT', 'DELETE']),
      JSON.stringify(['200 OK', '201 Created', '204 No Content', '202 Accepted'])
    ]);

    await client.query('COMMIT');
    console.log('✅ API Development lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedAPIDevBackend()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
