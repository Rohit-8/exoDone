// ============================================================================
// Database Design & Modeling — Content
// ============================================================================

export const topic = {
  "name": "Database Design & Modeling",
  "slug": "database-design",
  "description": "Design robust databases — normalization, indexing, partitioning, and choosing between SQL and NoSQL.",
  "estimated_time": 200,
  "order_index": 4
};

export const lessons = [
  {
    title: "Normalization & Schema Design",
    slug: "normalization-schema-design",
    summary: "Design well-structured database schemas using normalization rules and know when to denormalize for performance.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "Normal forms (1NF–3NF) eliminate data redundancy and anomalies",
  "1NF: atomic values, no repeating groups",
  "2NF: no partial dependencies (every non-key depends on the full key)",
  "3NF: no transitive dependencies (non-key fields don't depend on other non-key fields)",
  "Denormalize selectively for read performance — but accept write complexity"
],
    content: `# Normalization & Schema Design

## Why Normalize?

Without normalization you get:
- **Update anomalies**: changing a value requires updating multiple rows
- **Insertion anomalies**: can't insert data without unrelated data
- **Deletion anomalies**: deleting a row loses unrelated information

## Normal Forms

### 1NF — Atomic Values

\`\`\`sql
-- ❌ Not 1NF (repeating group / multi-valued)
CREATE TABLE orders (
  id INT, customer TEXT, items TEXT  -- "Laptop, Mouse, Keyboard"
);

-- ✅ 1NF
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT);
CREATE TABLE order_items (
  order_id INT REFERENCES orders(id),
  product_id INT,
  quantity INT
);
\`\`\`

### 2NF — No Partial Dependencies

Every non-key column must depend on the **entire** primary key (relevant for composite keys).

### 3NF — No Transitive Dependencies

Non-key columns must not depend on other non-key columns.

\`\`\`sql
-- ❌ Not 3NF: city depends on zip_code, not directly on user_id
CREATE TABLE users (id, name, zip_code, city, state);

-- ✅ 3NF: separate address data
CREATE TABLE users (id, name, address_id REFERENCES addresses);
CREATE TABLE addresses (id, zip_code, city, state);
\`\`\`

## When to Denormalize

| Normalize When | Denormalize When |
|---|---|
| Data integrity is critical | Read performance is critical |
| Write-heavy workload | Read-heavy workload (10:1 read:write) |
| Data changes frequently | Data rarely changes |
| Small-medium dataset | Large dataset with complex joins |

\`\`\`sql
-- Denormalized: redundant data for fast reads
CREATE TABLE order_summary (
  order_id INT PRIMARY KEY,
  customer_name TEXT,     -- redundant: also in customers table
  total_amount DECIMAL,   -- computed: sum of items
  item_count INT,         -- computed
  created_at TIMESTAMP
);
\`\`\`

## Schema Design Checklist

1. ✅ Every table has a PRIMARY KEY
2. ✅ Use appropriate data types (VARCHAR(255), not TEXT for emails)
3. ✅ Add NOT NULL constraints where applicable
4. ✅ Define FOREIGN KEY relationships with ON DELETE behavior
5. ✅ Add CHECK constraints for valid values
6. ✅ Include created_at and updated_at timestamps
7. ✅ Create indexes on frequently queried columns
8. ✅ Use UNIQUE constraints where appropriate
`,
  },
  {
    title: "Indexing & Query Optimization",
    slug: "indexing-query-optimization",
    summary: "Make databases fast with proper indexing strategies, EXPLAIN plans, and query optimization techniques.",
    difficulty_level: "intermediate",
    estimated_time: 30,
    order_index: 2,
    key_points: [
  "B-tree indexes speed up equality and range queries dramatically",
  "Use EXPLAIN ANALYZE to see how PostgreSQL executes your queries",
  "Index columns used in WHERE, JOIN ON, ORDER BY, and GROUP BY",
  "Composite indexes: column order matters — most selective first",
  "Don't over-index — each index slows down writes and uses storage"
],
    content: `# Indexing & Query Optimization

## How Indexes Work

Without an index, PostgreSQL performs a **sequential scan** (reads every row). With an index, it performs an **index scan** (jumps directly to matching rows).

\`\`\`sql
-- Without index: Sequential Scan — O(n)
SELECT * FROM users WHERE email = 'alice@test.com';
-- Scans all 10M rows!

-- With index: Index Scan — O(log n)
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'alice@test.com';
-- Finds it in ~23 lookups (log2 of 10M)
\`\`\`

## Index Types

| Type | Best For | PostgreSQL Syntax |
|---|---|---|
| B-tree | Equality, range, sorting | Default |
| Hash | Exact equality only | \`USING hash\` |
| GIN | Full-text search, JSONB, arrays | \`USING gin\` |
| GiST | Geometric, range types | \`USING gist\` |

## EXPLAIN ANALYZE

\`\`\`sql
EXPLAIN ANALYZE
SELECT p.name, c.name AS category
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.price > 100
ORDER BY p.price DESC
LIMIT 20;

-- Output:
-- Limit (cost=150.23..150.28 rows=20 width=52) (actual time=0.5..0.52 rows=20)
--   -> Sort (cost=150.23..155.23 rows=2000 width=52)
--     -> Nested Loop (cost=0.42..100.00 rows=2000 width=52)
--       -> Index Scan on products using idx_products_price (cost=0.29..50 rows=2000)
--             Filter: (price > 100)
\`\`\`

## Composite Index Strategy

\`\`\`sql
-- This query:
SELECT * FROM orders WHERE user_id = 42 AND status = 'shipped' ORDER BY created_at DESC;

-- Best composite index for this query:
CREATE INDEX idx_orders_user_status_created
ON orders(user_id, status, created_at DESC);

-- Column order matters! Most selective first, ORDER BY last.
\`\`\`

## Anti-Patterns

\`\`\`sql
-- ❌ Function on indexed column — can't use index
SELECT * FROM users WHERE LOWER(email) = 'alice@test.com';
-- ✅ Use expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- ❌ LIKE with leading wildcard — can't use index
SELECT * FROM users WHERE name LIKE '%alice%';
-- ✅ Use full-text search
SELECT * FROM users WHERE to_tsvector('english', name) @@ to_tsquery('alice');
\`\`\`
`,
  },
];
