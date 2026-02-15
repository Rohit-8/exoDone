// ============================================================================
// REST API Development — Code Examples
// ============================================================================

const examples = {
  'rest-principles-express': [
    {
      title: "Complete CRUD Router",
      description: "A full Express.js router with all CRUD operations.",
      language: "javascript",
      code: `import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'name' } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      \`SELECT * FROM products ORDER BY \${sort} LIMIT $1 OFFSET $2\`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM products');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    const { name, price, description } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *',
      [name, price, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, price, description } = req.body;
    const result = await pool.query(
      'UPDATE products SET name=$1, price=$2, description=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, price, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;`,
      explanation: "Every handler uses try/catch with next(err) for centralized error handling. Pagination is built into the GET endpoint. Status codes follow REST conventions.",
      order_index: 1,
    },
  ],
  'middleware-validation-errors': [
    {
      title: "Rate Limiting Middleware",
      description: "Simple in-memory rate limiter.",
      language: "javascript",
      code: `const requestCounts = new Map();

function rateLimiter({ windowMs = 60000, max = 100 } = {}) {
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
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    record.count++;
    next();
  };
}

// Apply: max 100 requests per minute
app.use('/api', rateLimiter({ windowMs: 60000, max: 100 }));`,
      explanation: "This middleware tracks requests per IP in a Map. In production, use Redis-backed rate limiting (express-rate-limit + rate-limit-redis).",
      order_index: 1,
    },
  ],
};

export default examples;
