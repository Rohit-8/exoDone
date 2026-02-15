// ============================================================================
// API Design Principles — Code Examples
// ============================================================================

const examples = {
  'restful-api-design': [
    {
      title: "Well-Designed API Router",
      description: "Express.js router following REST conventions.",
      language: "javascript",
      code: `import { Router } from 'express';

const router = Router();

// Standard response helpers
function ok(res, data, meta = {}) {
  res.json({ data, ...meta });
}

function created(res, data, location) {
  res.status(201).location(location).json({ data });
}

function paginated(res, data, { page, limit, total }) {
  res.json({
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

function error(res, status, code, message, details = []) {
  res.status(status).json({
    error: { code, message, details },
  });
}

// GET /api/v1/products?category=x&sort=-price&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const { category, minPrice, sort = 'name', page = 1, limit = 20 } = req.query;
    // ... build query with filters ...
    const { data, total } = await productService.list({ category, minPrice, sort, page, limit });
    paginated(res, data, { page, limit, total });
  } catch (err) { next(err); }
});

// GET /api/v1/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product) return error(res, 404, 'NOT_FOUND', 'Product not found');
    ok(res, product);
  } catch (err) { next(err); }
});

// POST /api/v1/products
router.post('/', async (req, res, next) => {
  try {
    const product = await productService.create(req.body);
    created(res, product, \`/api/v1/products/\${product.id}\`);
  } catch (err) { next(err); }
});

export default router;`,
      explanation: "Helper functions enforce consistent response formats. Every endpoint uses proper HTTP methods and status codes. The collection endpoint supports filtering, sorting, and pagination.",
      order_index: 1,
    },
  ],
};

export default examples;
