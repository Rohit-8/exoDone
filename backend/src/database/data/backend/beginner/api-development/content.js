// ============================================================================
// REST API Development — Content
// ============================================================================

export const topic = {
  "name": "REST API Development",
  "slug": "api-development",
  "description": "Build RESTful APIs with Express.js — REST constraints, HTTP methods, routing, middleware, validation, error handling, and production best practices.",
  "estimated_time": 220,
  "order_index": 2
};

export const lessons = [
  {
    title: "REST Principles & Express.js Setup",
    slug: "rest-principles-express",
    summary: "Understand the six REST constraints, HTTP method semantics (idempotency & safety), status codes, and build a well-structured Express.js server.",
    difficulty_level: "beginner",
    estimated_time: 45,
    order_index: 1,
    key_points: [
      "REST is an architectural style with 6 constraints: Client-Server, Stateless, Cacheable, Uniform Interface, Layered System, Code on Demand (optional)",
      "Resources are identified by URIs — use nouns, not verbs (/users, not /getUsers)",
      "HTTP methods map to CRUD: GET=Read, POST=Create, PUT=Replace, PATCH=Partial Update, DELETE=Remove",
      "GET and PUT are idempotent (same result on repeated calls); POST is not",
      "GET, HEAD, OPTIONS are safe (no side effects); POST, PUT, PATCH, DELETE are unsafe",
      "Express.js is a minimal, unopinionated Node.js web framework",
      "Use express.json() to parse JSON bodies; express.urlencoded() for form data",
      "Organize routes by resource using express.Router() for modularity",
      "Always return appropriate HTTP status codes (2xx success, 4xx client error, 5xx server error)"
    ],
    content: `# REST Principles & Express.js Setup

## What is REST?

**REST (Representational State Transfer)** is an architectural style for designing networked applications. It was defined by Roy Fielding in his 2000 doctoral dissertation. REST is NOT a protocol — it is a set of **constraints** that, when followed, create scalable, maintainable web services.

### The 6 REST Constraints

| Constraint | Description |
|---|---|
| **1. Client-Server** | Separate the user interface (client) from data storage (server). They evolve independently. |
| **2. Stateless** | Each request contains ALL information needed to process it. The server stores NO client session state between requests. |
| **3. Cacheable** | Responses must indicate if they are cacheable. Clients and intermediaries can cache responses to improve performance. |
| **4. Uniform Interface** | A consistent, standardized way to communicate: resource identification via URIs, manipulation through representations, self-descriptive messages, HATEOAS. |
| **5. Layered System** | The client cannot tell if it's connected directly to the server or through intermediaries (load balancers, proxies, CDNs). |
| **6. Code on Demand** (optional) | The server can send executable code to the client (e.g., JavaScript). |

---

## Resources & URIs

In REST, everything is a **resource** — an entity that can be identified, named, and manipulated. Resources are identified by **URIs (Uniform Resource Identifiers)**.

### URI Design Best Practices

| Do ✅ | Don't ❌ | Why |
|---|---|---|
| \`/api/users\` | \`/api/getUsers\` | Use nouns, not verbs |
| \`/api/users/42\` | \`/api/user?id=42\` | Use path params for identity |
| \`/api/users/42/orders\` | \`/api/getUserOrders\` | Nest related resources |
| \`/api/users?role=admin\` | \`/api/adminUsers\` | Use query params for filtering |
| \`/api/users\` (lowercase) | \`/api/Users\` | Always lowercase |
| \`/api/blog-posts\` | \`/api/blog_posts\` | Use hyphens, not underscores |

---

## HTTP Methods

| Method | Action | Idempotent? | Safe? | Request Body | Response Body |
|---|---|---|---|---|---|
| **GET** | Read resource(s) | ✅ Yes | ✅ Yes | No | Resource data |
| **POST** | Create a resource | ❌ No | ❌ No | Resource data | Created resource |
| **PUT** | Replace entire resource | ✅ Yes | ❌ No | Full resource | Updated resource |
| **PATCH** | Partial update | ❌ No* | ❌ No | Partial data | Updated resource |
| **DELETE** | Remove a resource | ✅ Yes | ❌ No | Usually no | Empty or confirmation |
| **HEAD** | GET without body | ✅ Yes | ✅ Yes | No | Headers only |
| **OPTIONS** | Discover allowed methods | ✅ Yes | ✅ Yes | No | Allowed methods |

> **Idempotent** = calling it N times has the same effect as calling it once. PUT /users/42 with the same data always results in the same state. POST /users creates a NEW user each time.

\`\`\`
GET  /api/users          →  List all users
GET  /api/users/42       →  Get user with id 42
POST /api/users          →  Create a new user
PUT  /api/users/42       →  Replace all fields of user 42
PATCH /api/users/42      →  Update some fields of user 42
DELETE /api/users/42     →  Delete user 42
\`\`\`

---

## Express.js Setup

\`\`\`bash
npm init -y
npm install express cors helmet morgan dotenv
\`\`\`

\`\`\`javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// --- Middleware Stack ---
app.use(helmet());                    // Security headers (XSS, CSP, etc.)
app.use(cors());                      // Cross-Origin Resource Sharing
app.use(morgan('dev'));               // HTTP request logging
app.use(express.json({ limit: '10mb' }));  // Parse JSON bodies (with size limit)
app.use(express.urlencoded({ extended: true }));  // Parse form data

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// --- Mount Routes ---
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: \`Route \\\${req.method} \\\${req.url} not found\` });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \\\${PORT}\`));
\`\`\`

---

## Route Organization with express.Router()

Keep routes modular — one file per resource:

\`\`\`javascript
// routes/users.js
import { Router } from 'express';
const router = Router();

// GET /api/users — list with pagination & filtering
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const users = await pool.query(
      \`SELECT id, name, email, created_at FROM users ORDER BY \\\${sort} \\\${order} LIMIT $1 OFFSET $2\`,
      [limit, offset]
    );

    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM users');

    res.json({
      data: users.rows,
      pagination: {
        page: +page, limit: +limit,
        total: +count, pages: Math.ceil(count / limit)
      }
    });
  } catch (err) { next(err); }
});

// GET /api/users/:id — single user
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/users — create
router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/users/:id — full replace
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, email, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
\`\`\`

---

## HTTP Status Codes Reference

### Success (2xx)
| Code | Name | When to Use |
|---|---|---|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST — resource created |
| 204 | No Content | Successful DELETE — no body returned |

### Client Errors (4xx)
| Code | Name | When to Use |
|---|---|---|
| 400 | Bad Request | Invalid or missing input data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 422 | Unprocessable Entity | Valid syntax but semantic errors |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Errors (5xx)
| Code | Name | When to Use |
|---|---|---|
| 500 | Internal Server Error | Unhandled exception |
| 502 | Bad Gateway | Upstream server error |
| 503 | Service Unavailable | Server overloaded or in maintenance |

---

## JSON Response Formats

\`\`\`javascript
// Success — single resource
{ "data": { "id": 1, "name": "Alice" } }

// Success — collection with pagination
{
  "data": [{ "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" }],
  "pagination": { "page": 1, "limit": 20, "total": 42, "pages": 3 }
}

// Error
{ "error": "User not found", "code": "NOT_FOUND" }

// Validation errors
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Must be a valid email address" },
    { "field": "password", "message": "Must be at least 8 characters" }
  ]
}
\`\`\`
`,
  },
  {
    title: "Middleware, Validation & Error Handling",
    slug: "middleware-validation-errors",
    summary: "Understand the middleware pipeline, build custom middleware (auth, logging, rate limiting), validate input with express-validator, and implement centralized error handling.",
    difficulty_level: "beginner",
    estimated_time: 45,
    order_index: 2,
    key_points: [
      "Middleware functions receive (req, res, next) and execute in order of registration",
      "Call next() to pass control to the next middleware; call next(err) to skip to error handler",
      "Types: application-level, router-level, error-handling, built-in, third-party",
      "Use express-validator for declarative input validation with chainable rules",
      "Always validate and sanitize user input — never trust the client",
      "Centralized error handlers use 4 parameters: (err, req, res, next)",
      "Create custom AppError classes to distinguish operational vs programming errors",
      "Async handlers must catch errors — use try/catch or a wrapper function",
      "The error handler must be registered LAST, after all routes"
    ],
    content: `# Middleware, Validation & Error Handling

## What is Middleware?

**Middleware** functions are functions that have access to the **request object (req)**, the **response object (res)**, and the **next function (next)** in the application's request-response cycle. They can:

1. Execute any code
2. Modify the request or response objects
3. End the request-response cycle (by sending a response)
4. Call \`next()\` to pass control to the next middleware

\`\`\`
Request → [Middleware 1] → [Middleware 2] → [Route Handler] → Response
          (helmet)         (cors)           (your code)
\`\`\`

### Types of Middleware

| Type | Applied With | Example |
|---|---|---|
| **Application-level** | \`app.use()\` or \`app.get()\` | Logging, auth |
| **Router-level** | \`router.use()\` | Route-specific auth |
| **Error-handling** | 4-param signature \`(err, req, res, next)\` | Centralized error handler |
| **Built-in** | Comes with Express | \`express.json()\`, \`express.static()\` |
| **Third-party** | npm packages | \`cors\`, \`helmet\`, \`morgan\` |

---

## Building Custom Middleware

### Request Logger

\`\`\`javascript
function requestLogger(req, res, next) {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`\\\${req.method} \\\${req.originalUrl} → \\\${res.statusCode} (\\\${duration}ms)\`);
  });

  next();
}

app.use(requestLogger);
\`\`\`

### Authentication Middleware

\`\`\`javascript
import jwt from 'jsonwebtoken';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;  // Attach user to request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Selective use
router.get('/profile', authenticate, getProfile);       // Protected
router.get('/public-info', getPublicInfo);               // Open
\`\`\`

### Authorization Middleware

\`\`\`javascript
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient permissions' });
    }
    next();
  };
}

// Only admins can delete users
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

// Both admin and editor can update articles
router.put('/articles/:id', authenticate, authorize('admin', 'editor'), updateArticle);
\`\`\`

### Rate Limiting Middleware

\`\`\`javascript
function rateLimiter({ windowMs = 60000, max = 100 } = {}) {
  const requests = new Map();

  // Clean up expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests) {
      if (now > record.resetAt) requests.delete(key);
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const record = requests.get(key);
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
      return next();
    }

    if (record.count >= max) {
      res.set('Retry-After', Math.ceil((record.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }

    record.count++;
    next();
  };
}

app.use('/api', rateLimiter({ windowMs: 60000, max: 100 }));
\`\`\`

---

## Input Validation

Never trust client input. Validate **type**, **format**, **length**, and **business rules** before processing.

### Using express-validator

\`\`\`javascript
import { body, param, query, validationResult } from 'express-validator';

// Define validation rules
const validateCreateUser = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 }).withMessage('Age must be 13–120'),
];

const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
];

// Reusable validation result handler
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// Apply to routes
router.post('/users', validateCreateUser, handleValidationErrors, createUser);
router.get('/users/:id', validateIdParam, handleValidationErrors, getUser);
router.get('/users', validatePagination, handleValidationErrors, listUsers);
\`\`\`

---

## Centralized Error Handling

### Custom Error Class

\`\`\`javascript
class AppError extends Error {
  constructor(message, statusCode, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) { return new AppError(message, 400, 'BAD_REQUEST'); }
  static unauthorized(message = 'Unauthorized') { return new AppError(message, 401, 'UNAUTHORIZED'); }
  static forbidden(message = 'Forbidden') { return new AppError(message, 403, 'FORBIDDEN'); }
  static notFound(resource = 'Resource') { return new AppError(\`\\\${resource} not found\`, 404, 'NOT_FOUND'); }
  static conflict(message) { return new AppError(message, 409, 'CONFLICT'); }
}

// Usage in route handlers
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) throw AppError.notFound('User');
    res.json(user);
  } catch (err) { next(err); }  // Pass to error handler
});
\`\`\`

### Global Error Handler

\`\`\`javascript
function errorHandler(err, req, res, next) {
  // Log the error
  console.error(\`[\\\${new Date().toISOString()}] \\\${err.name}: \\\${err.message}\`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  // Handle known operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // Handle specific database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({ error: 'Resource already exists', code: 'DUPLICATE' });
  }
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ error: 'Referenced resource not found', code: 'FK_VIOLATION' });
  }

  // Unknown/programming errors — don't leak details
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { debug: err.message, stack: err.stack })
  });
}

// MUST be registered LAST
app.use(errorHandler);
\`\`\`

### Async Handler Wrapper

\`\`\`javascript
// Eliminates try/catch in every route handler
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Clean route handlers — no try/catch needed
router.get('/users', asyncHandler(async (req, res) => {
  const users = await pool.query('SELECT * FROM users');
  res.json(users.rows);
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) throw AppError.notFound('User');
  res.json(user);
}));
\`\`\`
`,
  },
];
