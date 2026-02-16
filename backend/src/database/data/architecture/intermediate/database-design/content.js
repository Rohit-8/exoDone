// ============================================================================
// Database Design — Content (ENHANCED)
// ============================================================================

export const topic = {
  "name": "Database Design",
  "slug": "database-design",
  "description": "Design efficient database schemas, master normalization, and optimize queries with proper indexing strategies.",
  "estimated_time": 200,
  "order_index": 4
};

export const lessons = [
  {
    title: "Normalization & Schema Design",
    slug: "normalization-schema-design",
    summary: "Master ER modeling, normalization forms (1NF–BCNF), denormalization trade-offs, constraint design, inheritance patterns, and SQL vs NoSQL data modeling.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "ER modeling defines entities, attributes, and relationships (one-to-one, one-to-many, many-to-many) with cardinality constraints before writing any SQL",
  "1NF requires atomic values and no repeating groups — every cell holds a single value, every row is unique",
  "2NF eliminates partial dependencies — every non-key column depends on the entire composite primary key, not just part of it",
  "3NF removes transitive dependencies — non-key columns depend only on the primary key, never on other non-key columns",
  "BCNF (Boyce-Codd) strengthens 3NF by requiring every determinant to be a candidate key — catches edge cases 3NF misses",
  "Denormalize selectively for read-heavy workloads — duplicate data into summary tables or materialized views, but accept write complexity and staleness risk",
  "Junction tables with composite keys model M:N relationships; add extra columns (role, joined_at) to capture relationship metadata",
  "Choose UUIDs for distributed systems (no coordination needed) and serial/BIGSERIAL for single-database systems (smaller, faster joins, sortable)"
],
    content: `# Normalization & Schema Design

## Entity-Relationship (ER) Modeling

Before writing SQL, model your domain with entities, attributes, and relationships. ER diagrams are the blueprint for your database.

### Entities and Attributes

An entity is a real-world object (User, Product, Order). Each entity has attributes (columns):

\`\`\`
Entity: User
├── id (PK)
├── email (UNIQUE, NOT NULL)
├── name (NOT NULL)
├── password_hash (NOT NULL)
├── role (DEFAULT 'user')
├── created_at (DEFAULT NOW())
└── updated_at (DEFAULT NOW())
\`\`\`

### Relationships and Cardinality

\`\`\`
One-to-One (1:1)    User ──── Profile         (each user has exactly one profile)
One-to-Many (1:N)   User ──<  Orders          (one user has many orders)
Many-to-Many (M:N)  Student >──< Courses       (many students in many courses)
\`\`\`

Cardinality defines how many instances on each side:

\`\`\`sql
-- 1:1 — FK with UNIQUE constraint
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  timezone VARCHAR(50) DEFAULT 'UTC'
);

-- 1:N — FK on the "many" side
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- M:N — Junction table
CREATE TABLE student_courses (
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id)
);
\`\`\`

## Normalization Forms

Normalization eliminates redundancy and prevents anomalies (update, insert, delete).

### 1NF — Atomic Values, No Repeating Groups

Every cell holds a single value. No arrays, no comma-separated lists, no repeating column groups.

\`\`\`sql
-- ❌ NOT 1NF: multi-valued column
CREATE TABLE orders_bad (
  id INT,
  customer TEXT,
  items TEXT  -- "Laptop, Mouse, Keyboard"
);

-- ❌ NOT 1NF: repeating column groups
CREATE TABLE survey_bad (
  id INT,
  answer_1 TEXT, answer_2 TEXT, answer_3 TEXT  -- What about answer_4?
);

-- ✅ 1NF: one fact per cell, separate table for multi-valued data
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL
);
\`\`\`

### 2NF — No Partial Dependencies

Every non-key column must depend on the **entire** primary key. Only relevant for composite keys.

\`\`\`sql
-- ❌ NOT 2NF: student_name depends only on student_id, not on (student_id, course_id)
CREATE TABLE enrollments_bad (
  student_id INT,
  course_id INT,
  student_name TEXT,   -- partial dependency on student_id alone
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id)
);

-- ✅ 2NF: move student_name to its own table
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id)
);
\`\`\`

### 3NF — No Transitive Dependencies

Non-key columns must depend only on the primary key, not on other non-key columns.

\`\`\`sql
-- ❌ NOT 3NF: city and state depend on zip_code, not on user id
CREATE TABLE users_bad (
  id SERIAL PRIMARY KEY,
  name TEXT,
  zip_code VARCHAR(10),
  city TEXT,        -- depends on zip_code, not on id
  state TEXT        -- depends on zip_code, not on id
);

-- ✅ 3NF: extract the transitive dependency
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address_id INTEGER REFERENCES addresses(id)
);

CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  street TEXT,
  zip_code VARCHAR(10) NOT NULL,
  city TEXT NOT NULL,
  state VARCHAR(2) NOT NULL
);
\`\`\`

### BCNF (Boyce-Codd Normal Form)

Strengthens 3NF: every determinant must be a candidate key. Catches edge cases where 3NF allows anomalies.

\`\`\`sql
-- Example: A teacher teaches only one subject, but a subject can be taught by many teachers
-- Composite key: (student, subject) → teacher
-- Problem: teacher → subject (teacher determines subject, but teacher isn't a candidate key)

-- ❌ 3NF but NOT BCNF
CREATE TABLE class_assignments_bad (
  student_id INT,
  subject VARCHAR(50),
  teacher VARCHAR(50),
  PRIMARY KEY (student_id, subject)
  -- teacher → subject is a functional dependency where teacher is not a candidate key
);

-- ✅ BCNF: decompose
CREATE TABLE teacher_subjects (
  teacher_id INT PRIMARY KEY,
  subject VARCHAR(50) NOT NULL
);

CREATE TABLE student_teachers (
  student_id INT,
  teacher_id INT REFERENCES teacher_subjects(teacher_id),
  PRIMARY KEY (student_id, teacher_id)
);
\`\`\`

## Denormalization — When and How

Normalization optimizes for writes; denormalization optimizes for reads. Choose based on your access pattern.

| Normalize | Denormalize |
|---|---|
| Data integrity is critical | Read performance is critical |
| Write-heavy workload | Read-heavy (>10:1 read:write ratio) |
| Data changes frequently | Data rarely changes |
| Storage is a concern | Acceptable data duplication |

\`\`\`sql
-- Denormalized order summary for fast dashboard queries
CREATE TABLE order_summaries (
  order_id INTEGER PRIMARY KEY REFERENCES orders(id),
  customer_name TEXT NOT NULL,           -- duplicated from customers table
  customer_email TEXT NOT NULL,          -- duplicated
  item_count INTEGER NOT NULL,           -- computed from order_items
  total_amount DECIMAL(12,2) NOT NULL,   -- computed
  last_item_name TEXT,                   -- duplicated from products table
  created_at TIMESTAMPTZ NOT NULL
);

-- Keep it in sync with a trigger
CREATE OR REPLACE FUNCTION update_order_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_summaries (order_id, customer_name, customer_email,
    item_count, total_amount, last_item_name, created_at)
  SELECT o.id, c.name, c.email, COUNT(oi.id), SUM(oi.unit_price * oi.quantity),
    (SELECT p.name FROM products p JOIN order_items oi2 ON p.id = oi2.product_id
     WHERE oi2.order_id = o.id ORDER BY oi2.id DESC LIMIT 1),
    o.created_at
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.id = NEW.order_id
  GROUP BY o.id, c.name, c.email, o.created_at
  ON CONFLICT (order_id) DO UPDATE SET
    item_count = EXCLUDED.item_count,
    total_amount = EXCLUDED.total_amount,
    last_item_name = EXCLUDED.last_item_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

## SQL vs NoSQL Data Modeling

| Aspect | SQL (PostgreSQL) | NoSQL (MongoDB) |
|---|---|---|
| Schema | Fixed schema, enforced by DB | Flexible, schema-on-read |
| Relationships | JOINs via foreign keys | Embedded documents or references |
| Normalization | 3NF is default best practice | Embed related data (denormalized) |
| Transactions | Full ACID | Limited (multi-doc transactions in newer versions) |
| Best for | Complex queries, data integrity | High write throughput, flexible schemas |

\`\`\`javascript
// SQL: normalized, separate tables
// users table + orders table + order_items table + products table
// Query with JOINs

// NoSQL (MongoDB): embed related data
const order = {
  _id: ObjectId("..."),
  customer: {                      // embedded (denormalized)
    name: "Alice",
    email: "alice@example.com"
  },
  items: [                         // embedded array
    { product: "Laptop", price: 999.99, qty: 1 },
    { product: "Mouse", price: 29.99, qty: 2 }
  ],
  total: 1059.97,
  status: "shipped",
  created_at: ISODate("2025-06-15")
};
\`\`\`

## PostgreSQL Data Types — Choosing Wisely

| Use Case | Type | Why |
|---|---|---|
| IDs (single DB) | \`SERIAL\` / \`BIGSERIAL\` | Auto-incrementing, small, fast JOINs |
| IDs (distributed) | \`UUID\` | No coordination, globally unique |
| Money | \`DECIMAL(12,2)\` or \`NUMERIC\` | Exact precision — never use FLOAT for money |
| Short text | \`VARCHAR(n)\` | Enforces max length (emails, slugs) |
| Long text | \`TEXT\` | No length limit (descriptions, content) |
| Boolean | \`BOOLEAN\` | true/false, NOT NULL |
| Timestamps | \`TIMESTAMPTZ\` | Always use WITH TIME ZONE |
| JSON data | \`JSONB\` | Binary JSON — indexable, queryable |
| Enums | \`VARCHAR\` + CHECK | More flexible than CREATE TYPE enum |
| IP addresses | \`INET\` | Built-in validation and operators |
| Tags / arrays | \`TEXT[]\` | Native array type with GIN indexing |

\`\`\`sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
\`\`\`

## Constraints — Your Data's Safety Net

\`\`\`sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,                                    -- PK: unique + not null
  email VARCHAR(255) UNIQUE NOT NULL,                       -- UNIQUE: no duplicates
  name VARCHAR(100) NOT NULL,                               -- NOT NULL: required
  department_id INT NOT NULL REFERENCES departments(id)     -- FK: referential integrity
    ON DELETE RESTRICT                                       -- prevent deleting dept with employees
    ON UPDATE CASCADE,                                       -- update FK if dept id changes
  salary DECIMAL(10,2) CHECK (salary > 0),                  -- CHECK: business rule
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'on_leave', 'terminated')), -- CHECK: enum-like
  manager_id INT REFERENCES employees(id),                  -- self-referencing FK
  CONSTRAINT unique_name_per_dept UNIQUE (name, department_id) -- composite unique
);

-- ON DELETE behaviors:
-- CASCADE:   delete child rows when parent is deleted
-- RESTRICT:  prevent deletion if children exist
-- SET NULL:  set FK to NULL when parent is deleted
-- SET DEFAULT: set FK to its DEFAULT when parent is deleted
-- NO ACTION:  like RESTRICT but checked at end of transaction
\`\`\`

## Junction Tables for M:N Relationships

\`\`\`sql
-- Simple M:N: users and roles
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Rich M:N with metadata: project members
CREATE TABLE project_members (
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by INTEGER REFERENCES users(id),
  PRIMARY KEY (project_id, user_id)
);

-- Self-referencing M:N: followers
CREATE TABLE follows (
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)  -- can't follow yourself
);
\`\`\`

## Inheritance Patterns

### Single Table Inheritance (STI)

All types in one table, discriminated by a \`type\` column. Simple but wastes space with NULLs.

\`\`\`sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push')),
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  -- email-specific (NULL for sms/push)
  email_subject TEXT,
  email_from TEXT,
  -- sms-specific (NULL for email/push)
  phone_number VARCHAR(20),
  -- push-specific (NULL for email/sms)
  device_token TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Class Table Inheritance

Shared columns in base table, type-specific columns in child tables.

\`\`\`sql
-- Base table: shared columns
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child tables: type-specific columns
CREATE TABLE credit_card_payments (
  payment_id INTEGER PRIMARY KEY REFERENCES payments(id) ON DELETE CASCADE,
  card_last_four CHAR(4) NOT NULL,
  card_brand VARCHAR(20) NOT NULL,
  authorization_code TEXT
);

CREATE TABLE bank_transfer_payments (
  payment_id INTEGER PRIMARY KEY REFERENCES payments(id) ON DELETE CASCADE,
  bank_name VARCHAR(100) NOT NULL,
  account_last_four CHAR(4),
  transfer_reference TEXT UNIQUE
);
\`\`\`

### Concrete Table Inheritance

Each type gets its own complete table. No JOINs needed, but hard to query across types.

\`\`\`sql
CREATE TABLE email_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  email_subject TEXT NOT NULL,
  email_from TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sms_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Querying all notifications requires UNION ALL
\`\`\`

## Soft Deletes and Audit Columns

\`\`\`sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1   -- optimistic locking
);

-- Always filter out soft-deleted rows
CREATE VIEW active_articles AS
  SELECT * FROM articles WHERE is_deleted = false;

-- Partial index: only index non-deleted rows
CREATE INDEX idx_articles_author ON articles(author_id) WHERE is_deleted = false;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_updated
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
\`\`\`

## UUIDs vs Serial IDs

| Aspect | SERIAL / BIGSERIAL | UUID |
|---|---|---|
| Size | 4 / 8 bytes | 16 bytes |
| Sortable | Yes (insertion order) | No (random) |
| JOIN performance | Faster (smaller) | Slower (larger) |
| Distributed safe | No (sequence conflicts) | Yes (globally unique) |
| Predictable | Yes (id=1, 2, 3…) | No (security benefit) |
| Index fragmentation | Minimal (sequential) | Higher (random inserts) |

\`\`\`sql
-- Serial: simple, fast, single-database
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

-- UUID: distributed-safe, non-guessable
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hybrid: serial PK internally, UUID for external exposure
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,             -- fast JOINs internally
  public_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,  -- exposed to API
  user_id INTEGER NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL
);
\`\`\`

## Interview Checklist

1. **ER modeling**: draw entities, define relationships and cardinality before coding
2. **Normalization**: 3NF by default, denormalize only with measured evidence
3. **Constraints**: PK, FK, UNIQUE, CHECK, NOT NULL — let the database enforce rules
4. **Junction tables**: composite PK for M:N, add metadata columns as needed
5. **Inheritance**: STI for few types, class table for moderate, concrete for performance
6. **Soft deletes**: \`is_deleted\` + \`deleted_at\` with partial indexes to exclude deleted rows
7. **IDs**: SERIAL for single-DB, UUID for distributed or external-facing
8. **Timestamps**: always \`TIMESTAMPTZ\` (with time zone), include created_at and updated_at
`,
  },
  {
    title: "Indexing & Query Optimization",
    slug: "indexing-query-optimization",
    summary: "Understand how indexes work internally, choose the right index types, read EXPLAIN ANALYZE output, and apply query optimization techniques for high-performance databases.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 2,
    key_points: [
  "B-tree indexes store keys in a balanced tree for O(log n) lookups — the default and most versatile index type in PostgreSQL",
  "Hash indexes are faster for exact equality but cannot handle range queries, ordering, or partial matching",
  "GIN (Generalized Inverted Index) indexes power full-text search, JSONB containment queries, and array operations",
  "Composite indexes must match query column order (leftmost prefix rule) — put equality columns first, range/sort columns last",
  "Covering indexes (INCLUDE) store extra columns in the index to enable index-only scans without touching the heap table",
  "EXPLAIN ANALYZE shows actual execution time, row estimates vs actuals, and which scan type (Seq Scan, Index Scan, Bitmap Scan) the planner chose",
  "The N+1 query problem fires one query per row instead of batching — solve with JOINs, subqueries, or WHERE id IN (...) batches",
  "Materialized views pre-compute expensive queries; partitioning splits huge tables into smaller physical segments for faster scans"
],
    content: `# Indexing & Query Optimization

## How Indexes Work Internally

### B-Tree Index (Default)

B-tree (Balanced Tree) is PostgreSQL's default index. Keys are stored in sorted order in a tree structure where every leaf is at the same depth.

\`\`\`
                    [50]                    ← Root (1 disk read)
                   /    \\
            [20, 35]    [70, 85]           ← Branch (1 disk read)
           /   |   \\    /   |   \\
        [10] [25] [40] [60] [75] [90]      ← Leaf nodes (1 disk read)
                                            = 3 disk reads for any lookup
\`\`\`

\`\`\`sql
-- B-tree: equality AND range queries
CREATE INDEX idx_users_email ON users(email);
-- Supports: = , < , > , <= , >= , BETWEEN, IN, IS NULL
-- Also supports: ORDER BY, MIN(), MAX()

SELECT * FROM users WHERE email = 'alice@test.com';    -- Index Scan
SELECT * FROM users WHERE email LIKE 'alice%';         -- Index Scan (prefix match)
SELECT * FROM users WHERE email LIKE '%alice';         -- Seq Scan! (leading wildcard)
\`\`\`

**Complexity:** O(log n) — in a table with 10 million rows, a B-tree lookup takes ~23 comparisons (log₂ 10M).

### Hash Index

Only supports exact equality (=). Smaller and slightly faster than B-tree for equality-only workloads.

\`\`\`sql
CREATE INDEX idx_sessions_token ON sessions USING hash (session_token);
-- Fast: WHERE session_token = 'abc123'
-- Cannot: WHERE session_token > 'abc' (no range support)
-- Cannot: ORDER BY session_token (no ordering)
\`\`\`

### GIN (Generalized Inverted Index)

Indexes composite values (arrays, JSONB, full-text). Maps each element to the rows containing it.

\`\`\`sql
-- Full-text search
CREATE INDEX idx_articles_search ON articles
  USING gin(to_tsvector('english', title || ' ' || body));

SELECT * FROM articles
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('database & design');

-- JSONB containment
CREATE INDEX idx_products_metadata ON products USING gin(metadata);

SELECT * FROM products WHERE metadata @> '{"color": "red"}';
SELECT * FROM products WHERE metadata ? 'warranty';

-- Array contains
CREATE INDEX idx_posts_tags ON posts USING gin(tags);
SELECT * FROM posts WHERE tags @> ARRAY['postgresql', 'performance'];
\`\`\`

### GiST (Generalized Search Tree)

For geometric data, range types, and nearest-neighbor searches.

\`\`\`sql
-- Range types
CREATE INDEX idx_events_during ON events USING gist(date_range);
SELECT * FROM events WHERE date_range && '[2025-01-01, 2025-01-31]'::daterange;

-- PostGIS geospatial
CREATE INDEX idx_stores_location ON stores USING gist(location);
SELECT * FROM stores WHERE ST_DWithin(location, ST_MakePoint(-73.98, 40.75), 1000);
\`\`\`

## When to Create Indexes

**Index these columns:**
- Primary keys (automatic)
- Foreign keys (NOT automatic in PostgreSQL — always add manually!)
- Columns in WHERE clauses (especially with high selectivity)
- Columns in JOIN ON conditions
- Columns in ORDER BY / GROUP BY
- Columns with UNIQUE constraints (automatic)

**Don't index:**
- Tiny tables (< 1000 rows) — sequential scan is faster
- Low-selectivity columns (boolean with 50/50 distribution)
- Columns that are rarely queried
- Tables with heavy write load and few reads

\`\`\`sql
-- ✅ Always index foreign keys!
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
\`\`\`

## Composite Indexes and Column Order

Column order in a composite index is critical. PostgreSQL uses the **leftmost prefix rule** — the index is usable only if the query filters on a left prefix of the indexed columns.

\`\`\`sql
CREATE INDEX idx_orders_user_status_date
ON orders(user_id, status, created_at DESC);

-- ✅ Uses index (leftmost prefix matches)
SELECT * FROM orders WHERE user_id = 42;
SELECT * FROM orders WHERE user_id = 42 AND status = 'shipped';
SELECT * FROM orders WHERE user_id = 42 AND status = 'shipped'
  ORDER BY created_at DESC;

-- ❌ Cannot use this index (skips user_id)
SELECT * FROM orders WHERE status = 'shipped';
SELECT * FROM orders WHERE created_at > '2025-01-01';
\`\`\`

**Rule of thumb:** put equality columns first, then range/sort columns last.

\`\`\`sql
-- Query: WHERE user_id = ? AND created_at BETWEEN ? AND ? ORDER BY created_at
-- Best index:
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
-- user_id (equality) first, created_at (range + sort) second
\`\`\`

## Covering Indexes (INCLUDE)

A covering index stores extra columns in the leaf nodes so PostgreSQL can answer the query from the index alone — an **index-only scan** that never touches the table heap.

\`\`\`sql
-- Without INCLUDE: index scan + heap fetch for name and email
CREATE INDEX idx_users_role ON users(role);
SELECT name, email FROM users WHERE role = 'admin';
-- Index Scan on idx_users_role → then fetch name, email from heap

-- With INCLUDE: index-only scan — no heap access
CREATE INDEX idx_users_role_covering ON users(role) INCLUDE (name, email);
SELECT name, email FROM users WHERE role = 'admin';
-- Index Only Scan — 2x faster for wide tables
\`\`\`

## Partial Indexes

Index only the rows you actually query. Smaller index = faster lookups + less storage.

\`\`\`sql
-- Only 5% of orders are 'pending', but you query them constantly
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- Only active products
CREATE INDEX idx_products_active ON products(category_id, price)
WHERE is_active = true AND is_deleted = false;

-- Only non-null values
CREATE INDEX idx_users_phone ON users(phone)
WHERE phone IS NOT NULL;
\`\`\`

## Expression Indexes

Index the result of an expression or function, not the raw column.

\`\`\`sql
-- Case-insensitive email lookup
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'alice@test.com';  -- Uses the index

-- Date extraction
CREATE INDEX idx_orders_month ON orders(DATE_TRUNC('month', created_at));
SELECT COUNT(*) FROM orders WHERE DATE_TRUNC('month', created_at) = '2025-06-01';

-- JSONB field
CREATE INDEX idx_products_brand ON products((metadata->>'brand'));
SELECT * FROM products WHERE metadata->>'brand' = 'Apple';
\`\`\`

## Reading EXPLAIN ANALYZE

\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2025-01-01'
GROUP BY u.name
ORDER BY order_count DESC
LIMIT 10;
\`\`\`

Key things to look for in the output:

\`\`\`
Sort (cost=500..501 rows=10) (actual time=12.5..12.5 rows=10 loops=1)
  Sort Key: (count(o.id)) DESC
  Sort Method: top-N heapsort  Memory: 25kB
  -> HashAggregate (cost=450..460 rows=500) (actual time=11.0..11.5 rows=500)
       Group Key: u.name
       -> Hash Join (cost=100..400 rows=5000) (actual time=1.2..8.5 rows=5000)
            Hash Cond: (o.user_id = u.id)
            -> Seq Scan on orders o (cost=0..250 rows=10000) (actual time=0.01..3.0 rows=10000)
            -> Hash (cost=80..80 rows=500) (actual time=0.8..0.8 rows=500)
                 -> Index Scan on users u (cost=0..80 rows=500) (actual time=0.02..0.5 rows=500)
                       Filter: (created_at > '2025-01-01')
\`\`\`

| What to Check | Meaning |
|---|---|
| \`Seq Scan\` | Full table scan — probably needs an index |
| \`Index Scan\` | Using an index — efficient |
| \`Index Only Scan\` | Answered entirely from index — fastest |
| \`Bitmap Index Scan\` | Combines multiple index results — good for OR/low selectivity |
| \`rows=5000\` vs \`actual rows=50000\` | Bad estimate — run ANALYZE to update statistics |
| \`Buffers: shared hit=100 read=500\` | 500 blocks from disk — may need more \`shared_buffers\` |
| \`loops=1000\` | Nested loop ran 1000 times — consider Hash Join |

## Query Optimization Techniques

### Avoid SELECT *

\`\`\`sql
-- ❌ Fetches all columns, prevents index-only scans
SELECT * FROM users WHERE role = 'admin';

-- ✅ Only the columns you need
SELECT id, name, email FROM users WHERE role = 'admin';
\`\`\`

### JOINs: Choose the Right Type

\`\`\`sql
-- INNER JOIN: only matching rows (most common)
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON o.user_id = u.id;

-- LEFT JOIN: all users, even without orders
SELECT u.name, COALESCE(SUM(o.total), 0) AS lifetime_value
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name;

-- Don't JOIN when you only need existence check — use EXISTS
-- ❌ Slow: JOINs all matching rows then deduplicates
SELECT DISTINCT u.name FROM users u
JOIN orders o ON o.user_id = u.id;

-- ✅ Fast: stops at first match
SELECT u.name FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
\`\`\`

### EXISTS vs IN

\`\`\`sql
-- EXISTS: stops at first match (efficient for large subqueries)
SELECT * FROM products p
WHERE EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.product_id = p.id
);

-- IN: materializes the entire subquery result set
SELECT * FROM products
WHERE id IN (SELECT product_id FROM order_items);

-- Rule of thumb:
-- EXISTS is better when the subquery returns many rows
-- IN is fine when the subquery returns a small, known set
-- Modern PostgreSQL often optimizes both to the same plan
\`\`\`

### Subquery vs JOIN

\`\`\`sql
-- Correlated subquery: runs once per outer row (can be slow)
SELECT u.name,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;

-- Equivalent JOIN (usually faster — one pass)
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name;
\`\`\`

## The N+1 Query Problem

\`\`\`javascript
// ❌ N+1: 1 query for users + N queries for orders
const users = await db.query('SELECT * FROM users LIMIT 100');
for (const user of users.rows) {
  const orders = await db.query(
    'SELECT * FROM orders WHERE user_id = $1', [user.id]
  );
  // 101 total queries!
}

// ✅ Fix 1: JOIN in one query
const result = await db.query(\`
  SELECT u.id, u.name, o.id AS order_id, o.total
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  LIMIT 100
\`);

// ✅ Fix 2: batch with IN
const users = await db.query('SELECT * FROM users LIMIT 100');
const userIds = users.rows.map(u => u.id);
const orders = await db.query(
  'SELECT * FROM orders WHERE user_id = ANY($1)', [userIds]
);
// 2 total queries!
\`\`\`

## Connection Pooling

\`\`\`javascript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  max: 20,                     // max connections in pool
  min: 5,                      // keep 5 idle connections ready
  idleTimeoutMillis: 30000,    // close idle connections after 30s
  connectionTimeoutMillis: 5000, // fail if no connection in 5s
  statement_timeout: 30000,    // kill queries running > 30s
});

// Connections are borrowed and automatically returned
const result = await pool.query('SELECT * FROM users WHERE id = $1', [123]);

// For transactions, acquire a dedicated client
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 1]);
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 2]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release(); // Return connection to pool
}
\`\`\`

## Query Planning and Statistics

PostgreSQL's query planner uses statistics (row counts, value distribution, correlation) to choose the best execution plan.

\`\`\`sql
-- Update statistics after bulk data changes
ANALYZE users;
ANALYZE orders;

-- Check statistics for a table
SELECT attname, n_distinct, most_common_vals, correlation
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'status';

-- Increase statistics target for columns with skewed distribution
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;

-- autovacuum keeps statistics fresh automatically
-- but after bulk loads, run ANALYZE manually
\`\`\`

## Materialized Views

Pre-compute expensive queries and store the result. Fast reads, but data is stale until refreshed.

\`\`\`sql
CREATE MATERIALIZED VIEW mv_product_stats AS
SELECT
  p.id,
  p.name,
  p.category_id,
  COUNT(oi.id) AS times_ordered,
  SUM(oi.quantity) AS total_units_sold,
  AVG(oi.unit_price) AS avg_selling_price,
  MAX(o.created_at) AS last_ordered_at
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id
GROUP BY p.id, p.name, p.category_id;

-- Index the materialized view for fast queries
CREATE UNIQUE INDEX idx_mv_product_stats_id ON mv_product_stats(id);
CREATE INDEX idx_mv_product_stats_category ON mv_product_stats(category_id);

-- Refresh (blocks reads during refresh)
REFRESH MATERIALIZED VIEW mv_product_stats;

-- Refresh concurrently (no read blocking, requires unique index)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats;

-- Automate with pg_cron
SELECT cron.schedule('refresh-product-stats', '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats');
\`\`\`

## Partitioning Strategies

Split huge tables into smaller physical segments. Queries touching only one partition skip the rest entirely.

### Range Partitioning

\`\`\`sql
CREATE TABLE events (
  id BIGSERIAL,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2025_q1 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE events_2025_q2 PARTITION OF events
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE events_2025_q3 PARTITION OF events
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE events_2025_q4 PARTITION OF events
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Query only hits the relevant partition
SELECT * FROM events WHERE created_at BETWEEN '2025-04-01' AND '2025-06-30';
-- Only scans events_2025_q2
\`\`\`

### List Partitioning

\`\`\`sql
CREATE TABLE logs (
  id BIGSERIAL,
  level VARCHAR(10) NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY LIST (level);

CREATE TABLE logs_error PARTITION OF logs FOR VALUES IN ('ERROR', 'FATAL');
CREATE TABLE logs_warn PARTITION OF logs FOR VALUES IN ('WARN');
CREATE TABLE logs_info PARTITION OF logs FOR VALUES IN ('INFO', 'DEBUG');
\`\`\`

### Hash Partitioning

\`\`\`sql
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL,
  data JSONB,
  expires_at TIMESTAMPTZ
) PARTITION BY HASH (id);

CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_p2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_p3 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);
\`\`\`

## Interview Checklist

1. **Index types**: B-tree (default), Hash (equality), GIN (JSONB/arrays/full-text), GiST (spatial/ranges)
2. **Composite indexes**: column order matters — equality first, range/sort last, leftmost prefix rule
3. **Covering indexes**: INCLUDE extra columns for index-only scans
4. **Partial indexes**: index only the rows you query (WHERE clause on CREATE INDEX)
5. **EXPLAIN ANALYZE**: look for Seq Scans, bad row estimates, high loop counts
6. **N+1 problem**: batch with JOIN or WHERE id = ANY($1)
7. **Materialized views**: pre-compute expensive aggregations, refresh on schedule
8. **Partitioning**: range (time-series), list (categories), hash (even distribution)
`,
  },
];
