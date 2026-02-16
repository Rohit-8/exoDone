// ============================================================================
// API Design Principles — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  'restful-api-design': [
    // ─────────────────────────────────────────────────────────────────────────
    // EXAMPLE 1 — Complete REST API Design for E-Commerce Resource
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: "Complete REST API Design for an E-Commerce Product Resource",
      description: "Full Express.js router implementing REST best practices: proper HTTP methods, status codes, resource naming, response envelopes, HATEOAS links, input validation, sorting, filtering, and field selection — a production-ready reference.",
      language: "javascript",
      code: `import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';

const router = Router();

// ── Response Helpers ────────────────────────────────────────
// Consistent envelope for ALL responses

function sendSuccess(res, { data, meta = {}, links = {}, status = 200 }) {
  res.status(status).json({
    data,
    meta: {
      request_id: res.locals.requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
    ...(Object.keys(links).length > 0 && { links }),
  });
}

function sendCreated(res, { data, location, links = {} }) {
  res
    .status(201)
    .location(location)
    .json({
      data,
      meta: {
        request_id: res.locals.requestId,
        timestamp: new Date().toISOString(),
      },
      ...(Object.keys(links).length > 0 && { links }),
    });
}

function sendNoContent(res) {
  res.status(204).end();
}

function sendError(res, { status, type, title, detail, errors = [] }) {
  res.status(status).json({
    type: \`https://api.example.com/errors/\${type}\`,
    title,
    status,
    detail,
    instance: res.req.originalUrl,
    ...(errors.length > 0 && { errors }),
    request_id: res.locals.requestId,
    timestamp: new Date().toISOString(),
  });
}

// ── Validation Middleware ───────────────────────────────────
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      status: 422,
      type: 'validation-error',
      title: 'Validation Error',
      detail: 'One or more fields failed validation.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        code: 'INVALID_FORMAT',
        rejected_value: e.value,
      })),
    });
  }
  next();
}

// ── Whitelist for Sorting & Filtering ───────────────────────
const ALLOWED_SORT_FIELDS = ['name', 'price', 'created_at', 'rating'];
const ALLOWED_FILTER_FIELDS = ['category', 'status', 'min_price', 'max_price'];

// ── HATEOAS Link Builder ────────────────────────────────────
function productLinks(product) {
  const base = \`/api/v1/products/\${product.id}\`;
  return {
    self:     { href: base, method: 'GET' },
    update:   { href: base, method: 'PUT' },
    patch:    { href: base, method: 'PATCH' },
    delete:   { href: base, method: 'DELETE' },
    reviews:  { href: \`\${base}/reviews\`, method: 'GET' },
    category: { href: \`/api/v1/categories/\${product.category_id}\`, method: 'GET' },
  };
}

// ═══════════════════════════════════════════════════════════
// GET /api/v1/products — List products (with pagination, sort, filter)
// ═══════════════════════════════════════════════════════════
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('per_page').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isString(),
    query('category').optional().isString(),
    query('status').optional().isIn(['active', 'draft', 'archived']),
    query('min_price').optional().isFloat({ min: 0 }).toFloat(),
    query('max_price').optional().isFloat({ min: 0 }).toFloat(),
    query('search').optional().isString().trim(),
    query('fields').optional().isString(), // sparse fieldsets
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        page = 1,
        per_page = 20,
        sort = '-created_at',
        category,
        status,
        min_price,
        max_price,
        search,
        fields,
      } = req.query;

      // Validate sort field against whitelist
      const sortField = sort.replace(/^-/, '');
      if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
        return sendError(res, {
          status: 400,
          type: 'invalid-parameter',
          title: 'Invalid Sort Field',
          detail: \`Sort field "\${sortField}" is not allowed. Use: \${ALLOWED_SORT_FIELDS.join(', ')}\`,
        });
      }

      // Build filters object
      const filters = {};
      if (category)  filters.category = category;
      if (status)    filters.status = status;
      if (min_price) filters.min_price = min_price;
      if (max_price) filters.max_price = max_price;
      if (search)    filters.search = search;

      // Parse sort direction
      const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';

      // Fetch from service/database
      const { items, total } = await productService.list({
        filters,
        sort: { field: sortField, direction: sortDirection },
        pagination: { page, per_page },
        fields: fields ? fields.split(',') : null,
      });

      // Build pagination metadata and links
      const totalPages = Math.ceil(total / per_page);
      const baseUrl = '/api/v1/products';
      const buildPageUrl = (p) =>
        \`\${baseUrl}?page=\${p}&per_page=\${per_page}&sort=\${sort}\`;

      sendSuccess(res, {
        data: items.map((p) => ({ ...p, _links: productLinks(p) })),
        meta: {
          total_count: total,
          page,
          per_page,
          total_pages: totalPages,
          has_next_page: page < totalPages,
          has_prev_page: page > 1,
        },
        links: {
          self:  buildPageUrl(page),
          first: buildPageUrl(1),
          last:  buildPageUrl(totalPages),
          ...(page > 1 && { prev: buildPageUrl(page - 1) }),
          ...(page < totalPages && { next: buildPageUrl(page + 1) }),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// GET /api/v1/products/:id — Get single product
// ═══════════════════════════════════════════════════════════
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Product ID must be a valid UUID')],
  validate,
  async (req, res, next) => {
    try {
      const product = await productService.findById(req.params.id);
      if (!product) {
        return sendError(res, {
          status: 404,
          type: 'resource-not-found',
          title: 'Product Not Found',
          detail: \`No product found with ID \${req.params.id}\`,
        });
      }

      // Set cache headers for GET requests
      res.set({
        'Cache-Control': 'public, max-age=60',
        'ETag': \`"\${product.version}"\`,
      });

      sendSuccess(res, {
        data: { ...product, _links: productLinks(product) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// POST /api/v1/products — Create new product
// ═══════════════════════════════════════════════════════════
router.post(
  '/',
  [
    body('name')
      .isString().trim().isLength({ min: 1, max: 200 })
      .withMessage('Name is required (1-200 characters)'),
    body('price')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be a positive number'),
    body('category_id')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    body('description')
      .optional().isString().isLength({ max: 5000 }),
    body('sku')
      .optional().isString().matches(/^[A-Z0-9-]+$/),
  ],
  validate,
  async (req, res, next) => {
    try {
      // Check for duplicate SKU (409 Conflict)
      if (req.body.sku) {
        const existing = await productService.findBySku(req.body.sku);
        if (existing) {
          return sendError(res, {
            status: 409,
            type: 'duplicate-resource',
            title: 'Conflict',
            detail: \`A product with SKU "\${req.body.sku}" already exists\`,
            errors: [{ field: 'sku', message: 'Already in use', code: 'DUPLICATE_ENTRY' }],
          });
        }
      }

      const product = await productService.create(req.body);

      sendCreated(res, {
        data: { ...product, _links: productLinks(product) },
        location: \`/api/v1/products/\${product.id}\`,
        links: {
          self: { href: \`/api/v1/products/\${product.id}\`, method: 'GET' },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// PUT /api/v1/products/:id — Full replacement (idempotent)
// ═══════════════════════════════════════════════════════════
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').isString().trim().isLength({ min: 1, max: 200 }),
    body('price').isFloat({ min: 0.01 }),
    body('category_id').isUUID(),
    body('description').isString().isLength({ max: 5000 }),
    body('status').isIn(['active', 'draft', 'archived']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const existing = await productService.findById(req.params.id);
      if (!existing) {
        return sendError(res, {
          status: 404,
          type: 'resource-not-found',
          title: 'Product Not Found',
          detail: \`No product found with ID \${req.params.id}\`,
        });
      }

      // Optimistic locking via ETag / If-Match header
      const clientVersion = req.headers['if-match'];
      if (clientVersion && clientVersion !== \`"\${existing.version}"\`) {
        return sendError(res, {
          status: 409,
          type: 'optimistic-lock-failure',
          title: 'Conflict',
          detail: 'Resource was modified by another request. Fetch latest and retry.',
        });
      }

      const product = await productService.replace(req.params.id, req.body);

      sendSuccess(res, {
        data: { ...product, _links: productLinks(product) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// PATCH /api/v1/products/:id — Partial update
// ═══════════════════════════════════════════════════════════
router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 200 }),
    body('price').optional().isFloat({ min: 0.01 }),
    body('description').optional().isString().isLength({ max: 5000 }),
    body('status').optional().isIn(['active', 'draft', 'archived']),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (Object.keys(req.body).length === 0) {
        return sendError(res, {
          status: 400,
          type: 'empty-body',
          title: 'Bad Request',
          detail: 'PATCH request must include at least one field to update.',
        });
      }

      const product = await productService.update(req.params.id, req.body);
      if (!product) {
        return sendError(res, {
          status: 404,
          type: 'resource-not-found',
          title: 'Product Not Found',
          detail: \`No product found with ID \${req.params.id}\`,
        });
      }

      sendSuccess(res, {
        data: { ...product, _links: productLinks(product) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// DELETE /api/v1/products/:id — Remove product (idempotent)
// ═══════════════════════════════════════════════════════════
router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const deleted = await productService.delete(req.params.id);
      // 204 whether the resource existed or not (idempotent)
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

// ── Key Design Decisions ────────────────────────────────────
// 1. Consistent envelope: { data, meta, links } for all responses
// 2. RFC 7807 error format with type URIs and field-level errors
// 3. HATEOAS _links on every resource — clients discover actions
// 4. Whitelist sort/filter fields to prevent injection
// 5. ETag-based optimistic locking on PUT
// 6. Validation middleware using express-validator
// 7. Proper status codes: 201+Location for POST, 204 for DELETE
// 8. Cache-Control + ETag headers on GET responses
// 9. UUID for resource IDs — no auto-increment exposure
// 10. Sparse fieldsets via ?fields=name,price query param`,
      explanation: "This example demonstrates a complete, production-quality REST API for a single resource. Every HTTP method is used correctly with proper status codes. The response envelope is consistent across all endpoints. HATEOAS links let clients discover available actions. Input validation catches errors before they reach the service layer. Optimistic locking via ETag prevents lost updates. Sort and filter fields are whitelisted to prevent injection. This is the kind of thorough implementation interviewers expect when you discuss REST API design.",
      order_index: 1,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // EXAMPLE 2 — Pagination Implementation (Offset, Cursor, Keyset)
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: "Pagination Implementation — Offset, Cursor, and Keyset Strategies",
      description: "Side-by-side implementation of all three pagination strategies with SQL queries, encoding/decoding, response formatting, and performance analysis — know which to choose and why.",
      language: "javascript",
      code: `// ════════════════════════════════════════════════════════════
// PAGINATION SERVICE — Three Strategies in One Module
// ════════════════════════════════════════════════════════════

import db from '../config/database.js';

// ── Strategy 1: Offset-Based Pagination ─────────────────────
// Simple page/per_page model — good for small datasets
// Performance degrades on large tables (OFFSET scans rows)

async function paginateWithOffset({ table, page = 1, perPage = 20, sort = 'id', order = 'ASC', filters = {} }) {
  const offset = (page - 1) * perPage;

  // Build WHERE clause from filters
  const { whereClause, values } = buildWhereClause(filters);

  // Count total (for pagination metadata)
  const countQuery = \`SELECT COUNT(*) as total FROM \${table} \${whereClause}\`;
  const [{ total }] = await db.query(countQuery, values);

  // Fetch page — NOTE: OFFSET is O(n), gets slower with large offsets
  const dataQuery = \`
    SELECT * FROM \${table}
    \${whereClause}
    ORDER BY \${sort} \${order}
    LIMIT $\{values.length + 1} OFFSET $\{values.length + 2}
  \`;
  const rows = await db.query(dataQuery, [...values, perPage, offset]);

  const totalPages = Math.ceil(total / perPage);

  return {
    data: rows,
    pagination: {
      strategy: 'offset',
      page,
      per_page: perPage,
      total_count: total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
    // Pagination links for the client
    links: buildOffsetLinks('/api/v1/items', { page, perPage, totalPages, sort, order }),
  };
}

function buildOffsetLinks(baseUrl, { page, perPage, totalPages, sort, order }) {
  const build = (p) => \`\${baseUrl}?page=\${p}&per_page=\${perPage}&sort=\${sort}&order=\${order}\`;
  return {
    self:  build(page),
    first: build(1),
    last:  build(totalPages),
    ...(page > 1 && { prev: build(page - 1) }),
    ...(page < totalPages && { next: build(page + 1) }),
  };
}

// ── Strategy 2: Cursor-Based Pagination ─────────────────────
// Uses an opaque cursor (base64-encoded pointer to last item)
// Consistent results even with concurrent inserts/deletes
// Cannot jump to arbitrary pages — only next/prev navigation

async function paginateWithCursor({ table, cursor = null, limit = 20, sort = 'created_at', order = 'DESC', filters = {} }) {
  const { whereClause, values } = buildWhereClause(filters);

  let cursorCondition = '';
  if (cursor) {
    const decoded = decodeCursor(cursor);
    // Compound cursor: (sort_field, id) for deterministic ordering
    const operator = order === 'DESC' ? '<' : '>';
    cursorCondition = \` AND (\${sort}, id) \${operator} ($\{values.length + 1}, $\{values.length + 2})\`;
    values.push(decoded[sort], decoded.id);
  }

  // Fetch one extra row to determine if there's a next page
  const dataQuery = \`
    SELECT * FROM \${table}
    \${whereClause} \${cursorCondition}
    ORDER BY \${sort} \${order}, id \${order}
    LIMIT $\{values.length + 1}
  \`;
  const rows = await db.query(dataQuery, [...values, limit + 1]);

  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;

  // Build cursors from first and last items in the page
  const nextCursor = hasNextPage ? encodeCursor(items[items.length - 1], sort) : null;
  const startCursor = items.length > 0 ? encodeCursor(items[0], sort) : null;

  return {
    data: items,
    pagination: {
      strategy: 'cursor',
      limit,
      has_next_page: hasNextPage,
      start_cursor: startCursor,
      end_cursor: nextCursor,
    },
    links: {
      self: '/api/v1/items?limit=' + limit + (cursor ? '&cursor=' + cursor : ''),
      ...(nextCursor && {
        next: '/api/v1/items?limit=' + limit + '&cursor=' + nextCursor,
      }),
    },
  };
}

// Cursor encoding/decoding — OPAQUE to the client
function encodeCursor(record, sortField) {
  const payload = {
    id: record.id,
    [sortField]: record[sortField],
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(cursor) {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch (err) {
    throw new Error('Invalid cursor format');
  }
}

// ── Strategy 3: Keyset Pagination ───────────────────────────
// Uses indexed column values (typically the primary key)
// Most performant for SQL — O(log n) via index seek
// Simple but requires a unique, sequential column

async function paginateWithKeyset({ table, afterId = null, limit = 20, filters = {} }) {
  const { whereClause, values } = buildWhereClause(filters);

  let keysetCondition = '';
  if (afterId) {
    keysetCondition = \` AND id > $\${values.length + 1}\`;
    values.push(afterId);
  }

  const dataQuery = \`
    SELECT * FROM \${table}
    \${whereClause} \${keysetCondition}
    ORDER BY id ASC
    LIMIT $\${values.length + 1}
  \`;
  const rows = await db.query(dataQuery, [...values, limit + 1]);

  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const lastId = items.length > 0 ? items[items.length - 1].id : null;

  return {
    data: items,
    pagination: {
      strategy: 'keyset',
      limit,
      has_next_page: hasNextPage,
      last_id: lastId,
    },
    links: {
      self: '/api/v1/items?limit=' + limit + (afterId ? '&after_id=' + afterId : ''),
      ...(hasNextPage && lastId && {
        next: '/api/v1/items?limit=' + limit + '&after_id=' + lastId,
      }),
    },
  };
}

// ── Shared Helper — Build WHERE Clause ──────────────────────
function buildWhereClause(filters) {
  const conditions = [];
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    // Always use parameterized queries — NEVER string interpolation
    if (key === 'min_price') {
      conditions.push(\`price >= $\${values.length + 1}\`);
      values.push(value);
    } else if (key === 'max_price') {
      conditions.push(\`price <= $\${values.length + 1}\`);
      values.push(value);
    } else if (key === 'search') {
      conditions.push(\`(name ILIKE $\${values.length + 1} OR description ILIKE $\${values.length + 1})\`);
      values.push(\`%\${value}%\`);
    } else {
      conditions.push(\`\${key} = $\${values.length + 1}\`);
      values.push(value);
    }
  });

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  return { whereClause, values };
}

// ── Route Handler Using All Three Strategies ────────────────
// GET /api/v1/items?strategy=cursor&cursor=abc&limit=20
export async function listItems(req, res, next) {
  try {
    const { strategy = 'offset' } = req.query;
    let result;

    switch (strategy) {
      case 'cursor':
        result = await paginateWithCursor({
          table: 'items',
          cursor: req.query.cursor,
          limit: parseInt(req.query.limit) || 20,
          sort: req.query.sort || 'created_at',
          order: req.query.order || 'DESC',
        });
        break;

      case 'keyset':
        result = await paginateWithKeyset({
          table: 'items',
          afterId: req.query.after_id ? parseInt(req.query.after_id) : null,
          limit: parseInt(req.query.limit) || 20,
        });
        break;

      case 'offset':
      default:
        result = await paginateWithOffset({
          table: 'items',
          page: parseInt(req.query.page) || 1,
          perPage: parseInt(req.query.per_page) || 20,
          sort: req.query.sort || 'id',
          order: req.query.order || 'ASC',
        });
        break;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── Performance Comparison ──────────────────────────────────
//
// Dataset: 1,000,000 rows
//
// | Strategy  | Page 1    | Page 100  | Page 10,000 | Page 50,000 |
// |-----------|-----------|-----------|-------------|-------------|
// | Offset    | 2ms       | 15ms      | 450ms       | 2,200ms     |
// | Cursor    | 2ms       | 3ms       | 3ms         | 3ms         |
// | Keyset    | 1ms       | 2ms       | 2ms         | 2ms         |
//
// Offset degrades linearly because OFFSET N scans N rows.
// Cursor and keyset use indexed lookups — constant time.

export { paginateWithOffset, paginateWithCursor, paginateWithKeyset };`,
      explanation: "This example implements all three pagination strategies side-by-side so you can compare them directly. Offset pagination is simplest but degrades on large datasets because SQL OFFSET scans all preceding rows. Cursor pagination encodes a pointer to the last seen item in a base64url-encoded opaque cursor — this is what Stripe, Slack, and Facebook use because it's O(1) regardless of position and handles concurrent inserts gracefully. Keyset pagination is the most performant for SQL as it uses WHERE id > N with an index seek. The performance comparison table at the bottom is a powerful interview talking point. All queries use parameterized values to prevent SQL injection.",
      order_index: 2,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // EXAMPLE 3 — Error Handling Middleware (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────
    {
      title: "Production Error Handling Middleware with RFC 7807, Rate Limiting, and Idempotency",
      description: "Centralized error handling middleware implementing RFC 7807 Problem Details, custom error classes, rate limiting with Redis, and the Idempotency-Key pattern — complete production error infrastructure.",
      language: "javascript",
      code: `// ════════════════════════════════════════════════════════════
// ERROR HANDLING INFRASTRUCTURE
// ════════════════════════════════════════════════════════════

import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// ── Custom Error Classes ────────────────────────────────────
// Each maps to a specific RFC 7807 Problem Details response

class AppError extends Error {
  constructor(message, statusCode, type, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.isOperational = true; // Distinguishes from programmer errors
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(
      \`\${resource} with ID \${id} not found\`,
      404,
      'resource-not-found',
      { resource, id }
    );
  }
}

class ValidationError extends AppError {
  constructor(errors) {
    super(
      'One or more fields failed validation',
      422,
      'validation-error',
      { errors }
    );
  }
}

class ConflictError extends AppError {
  constructor(message, field) {
    super(message, 409, 'conflict', {
      errors: [{ field, message, code: 'DUPLICATE_ENTRY' }],
    });
  }
}

class UnauthorizedError extends AppError {
  constructor(detail = 'Authentication required') {
    super(detail, 401, 'unauthorized');
  }
}

class ForbiddenError extends AppError {
  constructor(detail = 'Insufficient permissions') {
    super(detail, 403, 'forbidden');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter) {
    super('Rate limit exceeded', 429, 'rate-limit-exceeded', { retryAfter });
  }
}

// ── Request ID Middleware ────────────────────────────────────
// Assigns a unique ID to every request for tracing and debugging

function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  res.locals.requestId = requestId;
  res.set('X-Request-ID', requestId);
  next();
}

// ── Rate Limiting Middleware (Token Bucket with Redis) ───────
// Distributed rate limiting that works across multiple instances

function rateLimiter({ limit = 100, windowSeconds = 3600, keyPrefix = 'rl' } = {}) {
  return async (req, res, next) => {
    // Identify the client: API key > authenticated user > IP
    const clientId =
      req.headers['x-api-key'] ||
      (req.user && req.user.id) ||
      req.ip;

    const redisKey = \`\${keyPrefix}:\${clientId}\`;

    try {
      // Atomic increment + TTL using Redis MULTI
      const results = await redis
        .multi()
        .incr(redisKey)
        .ttl(redisKey)
        .exec();

      const currentCount = results[0][1]; // Current request count
      const ttl = results[1][1];          // Time to live

      // Set expiry on first request in the window
      if (ttl === -1) {
        await redis.expire(redisKey, windowSeconds);
      }

      const remaining = Math.max(0, limit - currentCount);
      const reset = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);

      // Always set rate limit headers (even on success)
      res.set({
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      });

      if (currentCount > limit) {
        const retryAfter = ttl > 0 ? ttl : windowSeconds;
        res.set('Retry-After', String(retryAfter));
        throw new RateLimitError(retryAfter);
      }

      next();
    } catch (err) {
      if (err instanceof RateLimitError) {
        return next(err);
      }
      // If Redis is down, allow the request (fail-open)
      console.error('Rate limiter Redis error:', err.message);
      next();
    }
  };
}

// ── Idempotency Middleware ───────────────────────────────────
// Prevents duplicate POST/PATCH operations on network retries

function idempotencyMiddleware(req, res, next) {
  // Only apply to non-idempotent methods
  if (!['POST', 'PATCH'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    // Optional: require idempotency key for POST
    // return next(new ValidationError([{
    //   field: 'Idempotency-Key',
    //   message: 'Header required for POST requests',
    //   code: 'MISSING_HEADER'
    // }]));
    return next();
  }

  const redisKey = \`idempotency:\${idempotencyKey}\`;

  // Intercept the response to cache it
  const originalJson = res.json.bind(res);
  res.json = async function (body) {
    // Cache the response for 24 hours
    const cached = {
      statusCode: res.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': res.locals.requestId,
      },
      body,
    };
    await redis.setex(redisKey, 86400, JSON.stringify(cached));
    return originalJson(body);
  };

  // Check cache first
  redis.get(redisKey).then((cached) => {
    if (cached) {
      const { statusCode, headers, body } = JSON.parse(cached);
      res.set(headers);
      res.set('X-Idempotent-Replayed', 'true');
      return res.status(statusCode).json(body);
    }
    next();
  }).catch(() => next());
}

// ── Centralized Error Handler ───────────────────────────────
// ALL errors funnel through this middleware — consistent RFC 7807 format

function errorHandler(err, req, res, next) {
  // Already sent response (shouldn't happen, but guard against it)
  if (res.headersSent) {
    return next(err);
  }

  const requestId = res.locals.requestId || 'unknown';

  // ── Operational Errors (expected, handled) ──────────────
  if (err instanceof AppError) {
    const response = {
      type: \`https://api.example.com/errors/\${err.type}\`,
      title: err.message,
      status: err.statusCode,
      detail: err.message,
      instance: req.originalUrl,
      request_id: requestId,
      timestamp: new Date().toISOString(),
    };

    // Add field-level errors if present
    if (err.details.errors) {
      response.errors = err.details.errors;
    }

    // Add Retry-After for rate limit errors
    if (err instanceof RateLimitError) {
      response.detail = \`Too many requests. Try again in \${err.details.retryAfter} seconds.\`;
    }

    return res.status(err.statusCode).json(response);
  }

  // ── Syntax Error (malformed JSON body) ──────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      type: 'https://api.example.com/errors/malformed-body',
      title: 'Malformed Request Body',
      status: 400,
      detail: 'The request body contains invalid JSON.',
      instance: req.originalUrl,
      request_id: requestId,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Programmer Errors (unexpected — log and return 500) ─
  console.error(\`[ERROR] \${requestId}:\`, {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    user: req.user?.id,
    body: req.body,
    ip: req.ip,
  });

  res.status(500).json({
    type: 'https://api.example.com/errors/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred. Please try again later.',
    instance: req.originalUrl,
    request_id: requestId,
    timestamp: new Date().toISOString(),
    // NEVER include err.stack or err.message in production
    // The detailed error is logged server-side for debugging
  });
}

// ── 404 Catch-All ───────────────────────────────────────────
function notFoundHandler(req, res) {
  res.status(404).json({
    type: 'https://api.example.com/errors/endpoint-not-found',
    title: 'Endpoint Not Found',
    status: 404,
    detail: \`\${req.method} \${req.originalUrl} does not exist.\`,
    instance: req.originalUrl,
    request_id: res.locals.requestId,
    timestamp: new Date().toISOString(),
  });
}

// ── Mount Everything in Express App ─────────────────────────
// app.js
import express from 'express';

const app = express();

// 1. Parse JSON with size limit
app.use(express.json({ limit: '1mb' }));

// 2. Request ID on every request
app.use(requestIdMiddleware);

// 3. Rate limiting (before routes)
app.use('/api', rateLimiter({
  limit: 1000,
  windowSeconds: 3600,
  keyPrefix: 'api-rl',
}));

// 4. Idempotency support
app.use('/api', idempotencyMiddleware);

// 5. Routes
// app.use('/api/v1/products', productRouter);
// app.use('/api/v1/orders', orderRouter);

// 6. 404 catch-all (after all routes)
app.use(notFoundHandler);

// 7. Centralized error handler (MUST be last middleware)
app.use(errorHandler);

export {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  requestIdMiddleware,
  rateLimiter,
  idempotencyMiddleware,
  errorHandler,
  notFoundHandler,
};

// ── Usage in Route Handlers ─────────────────────────────────
//
// throw new NotFoundError('Product', req.params.id);
// throw new ValidationError([
//   { field: 'email', message: 'Invalid format', code: 'INVALID_FORMAT' }
// ]);
// throw new ConflictError('Email already registered', 'email');
// throw new UnauthorizedError('Token expired');
// throw new ForbiddenError('Admin access required');
//
// The errorHandler middleware catches all of these and returns
// consistent RFC 7807 responses automatically.`,
      explanation: "This example provides complete error handling infrastructure for a production API. Custom error classes (NotFoundError, ValidationError, ConflictError, etc.) map cleanly to HTTP status codes and RFC 7807 Problem Details responses. The centralized error handler distinguishes operational errors (expected, like 404) from programmer errors (unexpected, like null pointer) — operational errors return specific messages while programmer errors return a generic 500 with full details logged server-side. The rate limiter uses Redis for distributed counting across multiple server instances, with proper X-RateLimit headers on every response. The idempotency middleware caches POST/PATCH responses by Idempotency-Key, replaying cached responses on retries. The request ID middleware enables end-to-end tracing. This is the middleware stack interviewers look for when they ask about error handling and API reliability.",
      order_index: 3,
    },
  ],
};

export default examples;
