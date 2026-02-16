// ============================================================================
// REST API Development — Code Examples
// ============================================================================

const examples = {
  'rest-principles-express': [
    {
      title: "Complete CRUD Router with Pagination & Filtering",
      description: "A production-ready Express.js router with all CRUD operations, pagination, sorting, and search filtering.",
      language: "javascript",
      code: `import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// GET /api/products — list with pagination, sorting, search
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      sort = 'created_at', order = 'DESC',
      search = ''
    } = req.query;
    const offset = (page - 1) * limit;

    // Whitelist allowed sort columns to prevent SQL injection
    const allowedSorts = ['name', 'price', 'created_at'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.query(
      \`SELECT * FROM products
       WHERE name ILIKE $1
       ORDER BY \${sortCol} \${sortDir}
       LIMIT $2 OFFSET $3\`,
      [\`%\${search}%\`, limit, offset]
    );

    const { rows: [{ count }] } = await pool.query(
      'SELECT COUNT(*) FROM products WHERE name ILIKE $1',
      [\`%\${search}%\`]
    );

    res.json({
      data: result.rows,
      pagination: {
        page: +page, limit: +limit,
        total: +count, pages: Math.ceil(count / limit)
      }
    });
  } catch (err) { next(err); }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE id = $1', [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/products — create
router.post('/', async (req, res, next) => {
  try {
    const { name, price, description, category_id } = req.body;
    const { rows } = await pool.query(
      \`INSERT INTO products (name, price, description, category_id)
       VALUES ($1, $2, $3, $4) RETURNING *\`,
      [name, price, description, category_id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/products/:id — full update
router.put('/:id', async (req, res, next) => {
  try {
    const { name, price, description, category_id } = req.body;
    const { rows } = await pool.query(
      \`UPDATE products SET name=$1, price=$2, description=$3,
       category_id=$4, updated_at=NOW() WHERE id=$5 RETURNING *\`,
      [name, price, description, category_id, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
});

// PATCH /api/products/:id — partial update
router.patch('/:id', async (req, res, next) => {
  try {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    const setClause = fields.map((f, i) => \`\${f} = $\${i + 1}\`).join(', ');

    const { rows } = await pool.query(
      \`UPDATE products SET \${setClause}, updated_at=NOW()
       WHERE id = $\${fields.length + 1} RETURNING *\`,
      [...values, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE id=$1', [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;`,
      explanation: "Covers all 6 HTTP methods (GET list, GET single, POST, PUT, PATCH, DELETE). Sort columns are whitelisted to prevent SQL injection. Pagination includes total count and page count. PATCH only updates the fields sent in the body.",
      order_index: 1,
    },
    {
      title: "Express.js App Structure with Middleware Stack",
      description: "A well-organized Express.js application showing the proper middleware registration order and route mounting.",
      language: "javascript",
      code: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

const app = express();

// === 1. Security Middleware (first!) ===
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

// === 2. Request Parsing ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression()); // gzip responses

// === 3. Logging ===
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// === 4. Custom Middleware ===
app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

// === 5. API Routes ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// === 6. 404 Handler ===
app.use((req, res) => {
  res.status(404).json({
    error: \`Route \${req.method} \${req.url} not found\`
  });
});

// === 7. Error Handler (LAST!) ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.isOperational ? err.message : 'Internal server error'
  });
});

export default app;`,
      explanation: "Middleware order matters! Security (helmet/cors) runs first, then parsing, then logging, then custom middleware, then routes. The 404 handler catches unmatched routes. The error handler (4 params) is registered LAST and catches all errors passed via next(err).",
      order_index: 2,
    },
  ],
  'middleware-validation-errors': [
    {
      title: "Rate Limiting Middleware with Cleanup",
      description: "An in-memory rate limiter with automatic entry cleanup and Retry-After header.",
      language: "javascript",
      code: `const requestCounts = new Map();

function rateLimiter({ windowMs = 60000, max = 100 } = {}) {
  // Clean up expired entries periodically
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts) {
      if (now > record.resetAt) requestCounts.delete(key);
    }
  }, windowMs);
  cleanup.unref(); // Don't prevent process exit

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const record = requestCounts.get(key);

    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
      return next();
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter
      });
    }

    record.count++;
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(max - record.count));
    next();
  };
}

// Apply: max 100 requests per minute per IP
app.use('/api', rateLimiter({ windowMs: 60000, max: 100 }));

// Stricter limit for auth routes
app.use('/api/auth', rateLimiter({ windowMs: 900000, max: 10 }));`,
      explanation: "Tracks requests per IP in a Map with automatic cleanup to prevent memory leaks. Sets standard rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After). Different routes can have different limits — auth routes get stricter limits to prevent brute force.",
      order_index: 1,
    },
    {
      title: "Async Handler Wrapper + Custom AppError",
      description: "Eliminates repetitive try/catch blocks in route handlers and provides a factory for common HTTP errors.",
      language: "javascript",
      code: `// Custom error class with factory methods
class AppError extends Error {
  constructor(message, statusCode, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg) { return new AppError(msg, 400, 'BAD_REQUEST'); }
  static unauthorized(msg = 'Unauthorized') { return new AppError(msg, 401, 'UNAUTHORIZED'); }
  static forbidden(msg = 'Forbidden') { return new AppError(msg, 403, 'FORBIDDEN'); }
  static notFound(resource = 'Resource') { return new AppError(\`\${resource} not found\`, 404, 'NOT_FOUND'); }
  static conflict(msg) { return new AppError(msg, 409, 'CONFLICT'); }
}

// Wrap async handlers — no try/catch needed!
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Clean route handlers:
router.get('/users', asyncHandler(async (req, res) => {
  const users = await db.findAll('users');
  res.json({ data: users });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.findById('users', req.params.id);
  if (!user) throw AppError.notFound('User');
  res.json({ data: user });
}));

router.post('/users', asyncHandler(async (req, res) => {
  const existing = await db.findByEmail(req.body.email);
  if (existing) throw AppError.conflict('Email already registered');
  const user = await db.create('users', req.body);
  res.status(201).json({ data: user });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw AppError.forbidden();
  await db.delete('users', req.params.id);
  res.status(204).send();
}));`,
      explanation: "asyncHandler wraps each route in a try/catch automatically — any thrown error (sync or async) is forwarded to the error handler via next(err). AppError factory methods make creating standard HTTP errors clean and readable: throw AppError.notFound('User') instead of manual status codes.",
      order_index: 2,
    },
  ],
};

export default examples;
