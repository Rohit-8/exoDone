// ============================================================================
// Database Design & Modeling — Code Examples
// ============================================================================

const examples = {
  'normalization-schema-design': [
    {
      title: "Well-Designed E-Commerce Schema",
      description: "A normalized e-commerce database schema with proper relationships.",
      language: "sql",
      code: `-- Categories with self-referencing hierarchy
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders (normalized)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total DECIMAL(10,2) NOT NULL,
  shipping_address_id INTEGER REFERENCES addresses(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  UNIQUE(order_id, product_id)
);

-- Indexes for common queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);`,
      explanation: "This schema follows 3NF with separate tables for orders and items. Foreign keys maintain referential integrity. Partial indexes (WHERE is_active) optimize common queries. CHECK constraints prevent invalid data.",
      order_index: 1,
    },
  ],
  'indexing-query-optimization': [
    {
      title: "Query Performance Monitoring",
      description: "Log slow queries and identify missing indexes.",
      language: "javascript",
      code: `// Middleware to log slow database queries
function createQueryLogger(pool, threshold = 100) {
  const originalQuery = pool.query.bind(pool);

  pool.query = async function (...args) {
    const start = Date.now();
    const result = await originalQuery(...args);
    const duration = Date.now() - start;

    if (duration > threshold) {
      console.warn(\`[SLOW QUERY] \${duration}ms\`, {
        query: typeof args[0] === 'string' ? args[0].slice(0, 200) : args[0].text?.slice(0, 200),
        params: args[1]?.length || 0,
        rows: result.rowCount,
      });
    }

    return result;
  };

  return pool;
}

// Finding missing indexes via pg_stat_user_tables
async function findMissingIndexes(pool) {
  const { rows } = await pool.query(\`
    SELECT relname AS table,
           seq_scan,
           idx_scan,
           n_live_tup AS row_count,
           CASE WHEN seq_scan > 0
                THEN round(seq_scan::numeric / (seq_scan + idx_scan) * 100, 1)
                ELSE 0
           END AS seq_scan_pct
    FROM pg_stat_user_tables
    WHERE n_live_tup > 1000
    ORDER BY seq_scan DESC
    LIMIT 10
  \`);

  console.table(rows);
  // Tables with high seq_scan_pct probably need indexes
}`,
      explanation: "The query logger flags queries exceeding a threshold. findMissingIndexes checks PostgreSQL statistics to find tables that are being sequentially scanned despite having many rows — a clear sign of missing indexes.",
      order_index: 1,
    },
  ],
};

export default examples;
