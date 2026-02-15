// ============================================================================
// REST API Development — Content
// ============================================================================

export const topic = {
  "name": "REST API Development",
  "slug": "api-development",
  "description": "Build RESTful APIs with Express.js — routing, middleware, error handling, and best practices.",
  "estimated_time": 180,
  "order_index": 2
};

export const lessons = [
  {
    title: "REST Principles & Express.js Setup",
    slug: "rest-principles-express",
    summary: "Understand RESTful design principles and build your first Express.js server with proper routing.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 1,
    key_points: [
  "REST is an architectural style — resources are identified by URLs",
  "HTTP methods map to CRUD: GET=Read, POST=Create, PUT=Update, DELETE=Delete",
  "Express.js is a minimal Node.js web framework for building APIs",
  "Use express.json() middleware to parse JSON request bodies",
  "Organize routes by resource using express.Router()"
],
    content: `# REST Principles & Express.js Setup

## REST (Representational State Transfer)

REST APIs are built around **resources** identified by URLs:

| HTTP Method | URL | Action | Body |
|---|---|---|---|
| GET | /api/users | List all users | – |
| GET | /api/users/42 | Get user 42 | – |
| POST | /api/users | Create a user | User data |
| PUT | /api/users/42 | Update user 42 | Updated data |
| DELETE | /api/users/42 | Delete user 42 | – |

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

// Middleware
app.use(helmet());                    // Security headers
app.use(cors());                      // Cross-origin support
app.use(morgan('dev'));               // Request logging
app.use(express.json());             // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
\`\`\`

## Route Organization

\`\`\`javascript
// routes/users.js
import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/', async (req, res) => {
  const { name, email } = req.body;
  const result = await db.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  res.status(201).json(result);
});

export default router;

// server.js
import userRoutes from './routes/users.js';
app.use('/api/users', userRoutes);
\`\`\`

## Status Codes

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unhandled exception |
`,
  },
  {
    title: "Middleware, Validation & Error Handling",
    slug: "middleware-validation-errors",
    summary: "Build custom middleware, validate request input, and implement centralized error handling.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 2,
    key_points: [
  "Middleware functions have access to req, res, and next()",
  "Middleware executes in order — call next() to pass control",
  "Use express-validator or Joi for input validation",
  "Centralized error handlers catch all errors in one place",
  "Always validate user input — never trust the client"
],
    content: `# Middleware, Validation & Error Handling

## Middleware Basics

Middleware functions execute in the order they are defined. Each function can modify the request/response or end the cycle.

\`\`\`javascript
// Custom logging middleware
function requestLogger(req, res, next) {
  console.log(\`\${req.method} \${req.url} — \${new Date().toISOString()}\`);
  next();  // Pass to next middleware
}

app.use(requestLogger);
\`\`\`

## Input Validation

\`\`\`javascript
import { body, param, validationResult } from 'express-validator';

const validateUser = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be 8+ characters'),
];

// Validation middleware
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.post('/users', validateUser, handleValidationErrors, createUser);
\`\`\`

## Centralized Error Handling

\`\`\`javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Error handler middleware (4 arguments!)
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  console.error(err.stack);

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// Must be the LAST middleware
app.use(errorHandler);
\`\`\`
`,
  },
];
