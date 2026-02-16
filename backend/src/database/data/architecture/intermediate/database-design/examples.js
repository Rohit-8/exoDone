// ============================================================================
// Database Design — Code Examples (ENHANCED)
// ============================================================================

const examples = {
  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 1: Normalization & Schema Design (3 examples)
  // ─────────────────────────────────────────────────────────────────────────
  'normalization-schema-design': [
    {
      title: "Production E-Commerce Schema with Full Constraint Design",
      description: "A fully normalized e-commerce database schema demonstrating ER relationships (1:1, 1:N, M:N), all constraint types (PK, FK, UNIQUE, CHECK, NOT NULL), junction tables, soft deletes, audit columns, and proper PostgreSQL data type choices.",
      language: "sql",
      code: `-- ═══════════════════════════════════════════════════════════════
-- E-Commerce Schema — Fully Normalized with Constraints
-- ═══════════════════════════════════════════════════════════════

-- ── Users & Auth ────────────────────────────────────────────
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,       -- soft delete
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1:1 relationship — user profile
CREATE TABLE user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id)
    ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE CHECK (date_of_birth < CURRENT_DATE),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC'
);

-- ── Addresses (1:N with users) ──────────────────────────────
CREATE TABLE addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'home'
    CHECK (label IN ('home', 'work', 'shipping', 'billing', 'other')),
  street_line1 VARCHAR(255) NOT NULL,
  street_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country CHAR(2) NOT NULL DEFAULT 'US',         -- ISO 3166-1 alpha-2
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ── Categories (self-referencing hierarchy) ─────────────────
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ── Products ────────────────────────────────────────────────
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,  -- external ID
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= 0),
  cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku VARCHAR(100) UNIQUE,
  weight_grams INTEGER CHECK (weight_grams > 0),
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1                -- optimistic locking
);

-- Partial index: only active, non-deleted products
CREATE INDEX idx_products_active ON products(category_id, price)
  WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_tags ON products USING gin(tags);
CREATE INDEX idx_products_metadata ON products USING gin(metadata);

-- ── Product ↔ Category (M:N via junction table) ────────────
CREATE TABLE product_categories (
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, category_id)
);

-- ── Orders ──────────────────────────────────────────────────
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'confirmed', 'processing',
      'shipped', 'delivered', 'cancelled', 'refunded'
    )),
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  shipping_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL,
  notes TEXT,
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
-- Partial index for active orders dashboard
CREATE INDEX idx_orders_pending ON orders(created_at DESC)
  WHERE status IN ('pending', 'confirmed', 'processing');

-- ── Order Items (1:N with orders) ───────────────────────────
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(500) NOT NULL,     -- denormalized snapshot
  product_price DECIMAL(10,2) NOT NULL,   -- price at time of purchase
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total DECIMAL(12,2) NOT NULL,
  UNIQUE(order_id, product_id)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ── Reviews (with unique constraint: 1 review per user per product)
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  body TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)   -- one review per user per product
);

CREATE INDEX idx_reviews_product ON reviews(product_id)
  WHERE is_deleted = false;

-- ── Triggers: auto-update updated_at ────────────────────────
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
      explanation: "This schema demonstrates every concept from the lesson: 1:1 (users ↔ profiles), 1:N (users → addresses, orders → order_items), M:N (products ↔ categories via junction table), self-referencing FK (categories.parent_id), all constraint types (PK, FK with ON DELETE behaviors, UNIQUE, CHECK, NOT NULL), soft deletes (is_deleted + deleted_at), audit columns (created_at, updated_at with trigger), UUIDs for external IDs (public_id) with BIGSERIAL for internal PKs, proper data types (DECIMAL for money, TIMESTAMPTZ, JSONB, TEXT[]), and partial indexes for performance.",
      order_index: 1,
    },
    {
      title: "Normalization Step-by-Step: From Denormalized Spreadsheet to 3NF",
      description: "Walk through normalizing a messy flat table (like a spreadsheet) into proper 1NF → 2NF → 3NF, showing exactly what anomalies each step eliminates.",
      language: "sql",
      code: `-- ═══════════════════════════════════════════════════════════════
-- Starting Point: Denormalized "Spreadsheet" Table
-- ═══════════════════════════════════════════════════════════════

-- This is what you get when someone dumps a spreadsheet into SQL:
CREATE TABLE student_registrations_BAD (
  student_id INT,
  student_name TEXT,
  student_email TEXT,
  course_id INT,
  course_name TEXT,
  instructor_name TEXT,
  instructor_email TEXT,
  department TEXT,
  grade VARCHAR(2),
  semester TEXT
);

-- Problems with this table:
-- 1. UPDATE ANOMALY: If instructor "Dr. Smith" changes email,
--    you must update EVERY row where she appears
-- 2. INSERT ANOMALY: Can't add a new course until a student enrolls
-- 3. DELETE ANOMALY: If the last student drops a course, you lose
--    the course and instructor info entirely

-- ═══════════════════════════════════════════════════════════════
-- Step 1: Convert to 1NF — Atomic Values, Unique Rows
-- ═══════════════════════════════════════════════════════════════

-- Already atomic values ✅ (no comma-separated lists)
-- Add a proper composite primary key:
ALTER TABLE student_registrations_BAD
  ADD PRIMARY KEY (student_id, course_id, semester);

-- ═══════════════════════════════════════════════════════════════
-- Step 2: Convert to 2NF — Eliminate Partial Dependencies
-- ═══════════════════════════════════════════════════════════════

-- Composite key: (student_id, course_id, semester)
-- Partial dependencies found:
--   student_name, student_email → depend on student_id ALONE
--   course_name, instructor_*, department → depend on course_id ALONE
--   grade → depends on the FULL key ✅

-- Extract entities that depend on PART of the key:

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  instructor_name VARCHAR(100) NOT NULL,
  instructor_email VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL
);

CREATE TABLE enrollments_2NF (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  semester VARCHAR(20) NOT NULL,
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id, semester)
);

-- ═══════════════════════════════════════════════════════════════
-- Step 3: Convert to 3NF — Eliminate Transitive Dependencies
-- ═══════════════════════════════════════════════════════════════

-- In the courses table:
--   course_id → instructor_name → instructor_email
--   instructor_email depends on instructor_name, NOT on course_id
--   This is a TRANSITIVE dependency: course → instructor → email

-- Also: instructor_name → department (transitive)

-- Extract instructors into their own table:

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department_id INT NOT NULL REFERENCES departments(id)
);

CREATE TABLE courses_3NF (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  instructor_id INT NOT NULL REFERENCES instructors(id),
  -- No more instructor_email or department here!
  credits SMALLINT NOT NULL DEFAULT 3 CHECK (credits > 0)
);

CREATE TABLE enrollments_3NF (
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses_3NF(id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL
    CHECK (semester ~ '^(Fall|Spring|Summer) \\d{4}$'),
  grade VARCHAR(2) CHECK (grade IN ('A+','A','A-','B+','B','B-',
                                     'C+','C','C-','D','F','W','I')),
  PRIMARY KEY (student_id, course_id, semester)
);

CREATE INDEX idx_enrollments_student ON enrollments_3NF(student_id);
CREATE INDEX idx_enrollments_course ON enrollments_3NF(course_id);
CREATE INDEX idx_enrollments_semester ON enrollments_3NF(semester);

-- ═══════════════════════════════════════════════════════════════
-- Result: 5 tables, zero redundancy, no anomalies
-- ═══════════════════════════════════════════════════════════════

-- Querying is still easy with JOINs:
SELECT
  s.name AS student,
  c.name AS course,
  i.name AS instructor,
  d.name AS department,
  e.grade,
  e.semester
FROM enrollments_3NF e
JOIN students s ON s.id = e.student_id
JOIN courses_3NF c ON c.id = e.course_id
JOIN instructors i ON i.id = c.instructor_id
JOIN departments d ON d.id = i.department_id
WHERE e.semester = 'Fall 2025'
ORDER BY s.name, c.name;`,
      explanation: "This example walks through normalization step by step: the original flat table has update/insert/delete anomalies. 1NF ensures atomic values and a primary key. 2NF extracts columns that depend on only part of the composite key (student_name depends only on student_id, not on the full student_id + course_id key). 3NF removes transitive dependencies (instructor_email depends on instructor_name, which depends on course_id — a chain). The final 5-table design has zero redundancy, proper foreign keys, CHECK constraints, and indexes.",
      order_index: 2,
    },
    {
      title: "Inheritance Patterns and SQL vs NoSQL Modeling Comparison",
      description: "Three table inheritance strategies (single table, class table, concrete table) side by side, plus SQL normalized vs MongoDB embedded document modeling for the same domain.",
      language: "sql",
      code: `-- ═══════════════════════════════════════════════════════════════
-- Pattern 1: Single Table Inheritance (STI)
-- All types in ONE table, discriminated by 'type' column
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE notifications_sti (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,

  -- Email-specific (NULL for other types)
  email_to VARCHAR(255),
  email_subject VARCHAR(500),
  email_html TEXT,

  -- SMS-specific
  phone_number VARCHAR(20),

  -- Push-specific
  device_token TEXT,
  badge_count INTEGER,

  -- In-app-specific
  action_url TEXT,
  icon VARCHAR(50),

  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRO:  Simple queries, no JOINs needed, easy to query across all types
-- CON:  Many NULL columns, wasted space, no per-type NOT NULL constraints

-- Query: all unread for a user (simple!)
SELECT * FROM notifications_sti
WHERE user_id = 42 AND is_read = false
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- Pattern 2: Class Table Inheritance
-- Shared columns in base table, type-specific in child tables
-- ═══════════════════════════════════════════════════════════════

-- Base table
CREATE TABLE notifications_base (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Child tables (per-type columns with NOT NULL enforced properly)
CREATE TABLE notification_emails (
  notification_id BIGINT PRIMARY KEY REFERENCES notifications_base(id) ON DELETE CASCADE,
  email_to VARCHAR(255) NOT NULL,        -- can be NOT NULL here!
  email_subject VARCHAR(500) NOT NULL,
  email_html TEXT NOT NULL
);

CREATE TABLE notification_sms (
  notification_id BIGINT PRIMARY KEY REFERENCES notifications_base(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL
);

CREATE TABLE notification_push (
  notification_id BIGINT PRIMARY KEY REFERENCES notifications_base(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  badge_count INTEGER DEFAULT 0
);

-- PRO:  No NULL waste, proper constraints, clean separation
-- CON:  Requires JOIN to get full notification data

-- Query: get full email notification (requires JOIN)
SELECT nb.*, ne.email_to, ne.email_subject, ne.email_html
FROM notifications_base nb
JOIN notification_emails ne ON ne.notification_id = nb.id
WHERE nb.user_id = 42 AND nb.type = 'email';

-- Query: all unread (no JOIN needed — base table has shared columns)
SELECT * FROM notifications_base
WHERE user_id = 42 AND is_read = false
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- Pattern 3: Concrete Table Inheritance
-- Each type is a completely independent table
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE email_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  email_to VARCHAR(255) NOT NULL,
  email_subject VARCHAR(500) NOT NULL,
  email_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  phone_number VARCHAR(20) NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRO:  No JOINs, no NULLs, each table is self-contained, fast per-type queries
-- CON:  Can't query "all notifications" without UNION ALL, schema duplication

-- Query across types: requires UNION ALL
SELECT id, 'email' AS type, title, is_read, created_at FROM email_notifications
WHERE user_id = 42
UNION ALL
SELECT id, 'sms' AS type, title, is_read, created_at FROM sms_notifications
WHERE user_id = 42
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- Comparison: SQL (Normalized) vs NoSQL (MongoDB) Modeling
-- ═══════════════════════════════════════════════════════════════

-- SQL: 5 normalized tables for a blog platform
-- posts, users, tags, post_tags (junction), comments

-- PostgreSQL normalized schema:
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  author_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id),
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,  -- nested
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equivalent query (3 JOINs):
SELECT p.title, u.name AS author,
  ARRAY_AGG(DISTINCT t.name) AS tags,
  COUNT(DISTINCT c.id) AS comment_count
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN post_tags pt ON pt.post_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
LEFT JOIN comments c ON c.post_id = p.id
WHERE p.status = 'published'
GROUP BY p.id, p.title, u.name
ORDER BY p.published_at DESC
LIMIT 20;`,
      explanation: "This example compares three SQL inheritance strategies side by side: STI (simple but wastes space with NULLs), Class Table (clean separation with JOINs), and Concrete Table (fast per-type queries but requires UNION ALL across types). It also shows how the same blog domain modeled in SQL (normalized with 5 tables and JOINs) contrasts with a MongoDB approach where you'd embed tags and comments directly in the post document. In an interview, explain the trade-offs: STI for few types with few unique fields, Class Table for moderate hierarchies, Concrete Table when per-type query performance is critical.",
      order_index: 3,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 2: Indexing & Query Optimization (3 examples)
  // ─────────────────────────────────────────────────────────────────────────
  'indexing-query-optimization': [
    {
      title: "Index Strategy Workshop: B-Tree, Partial, Covering, and Expression Indexes",
      description: "Comprehensive index creation examples for a production database — demonstrates when and how to use each index type, with EXPLAIN ANALYZE output showing the performance impact.",
      language: "sql",
      code: `-- ═══════════════════════════════════════════════════════════════
-- Setup: A products table with 2 million rows
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  brand VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 1. B-Tree Indexes (Default) ────────────────────────────

-- Foreign key index (PostgreSQL does NOT auto-create these!)
CREATE INDEX idx_products_category ON products(category_id);

-- Sort index for listing pages
CREATE INDEX idx_products_created ON products(created_at DESC);

-- ── 2. Composite Index (column order matters!) ─────────────

-- Query: products in a category, sorted by price
-- WHERE category_id = ? ORDER BY price ASC LIMIT 20
CREATE INDEX idx_products_cat_price ON products(category_id, price);

-- This index supports:
-- ✅ WHERE category_id = 5                       (uses first column)
-- ✅ WHERE category_id = 5 ORDER BY price        (uses both columns)
-- ✅ WHERE category_id = 5 AND price < 100       (equality + range)
-- ❌ WHERE price < 100                           (skips first column!)
-- ❌ ORDER BY price WHERE category_id IS NULL     (NULL handling)

-- ── 3. Covering Index (Index-Only Scan) ────────────────────

-- API query: GET /api/products?category=5&page=1
-- Only needs: id, name, price, slug, rating
CREATE INDEX idx_products_listing ON products(category_id, price)
  INCLUDE (id, name, slug, rating)
  WHERE is_active = true AND is_deleted = false;

-- EXPLAIN ANALYZE shows "Index Only Scan" — never touches table heap!
EXPLAIN ANALYZE
SELECT id, name, slug, price, rating
FROM products
WHERE category_id = 5 AND is_active = true AND is_deleted = false
ORDER BY price ASC
LIMIT 20;
-- → Index Only Scan using idx_products_listing
-- → Execution time: 0.08ms (vs 45ms with Seq Scan)

-- ── 4. Partial Index (index only what you query) ───────────

-- Only 2% of products are featured, but you query them all the time
CREATE INDEX idx_products_featured ON products(created_at DESC)
  WHERE is_active = true AND is_deleted = false
    AND (metadata->>'featured')::boolean = true;

-- Only pending orders (5% of all orders)
CREATE INDEX idx_orders_pending ON orders(created_at DESC)
  WHERE status = 'pending';

-- Size comparison:
-- Full index on 2M rows:   ~45 MB
-- Partial index (2% rows): ~0.9 MB  (50x smaller!)

-- ── 5. Expression Index ────────────────────────────────────

-- Case-insensitive email search
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- Query MUST use the same expression:
SELECT * FROM users WHERE LOWER(email) = 'alice@test.com';  -- ✅ uses index
SELECT * FROM users WHERE email = 'Alice@Test.com';         -- ❌ seq scan!

-- JSONB field extraction
CREATE INDEX idx_products_brand ON products((metadata->>'brand'));
SELECT * FROM products WHERE metadata->>'brand' = 'Apple';

-- Date truncation for monthly aggregations
CREATE INDEX idx_orders_month ON orders(DATE_TRUNC('month', created_at));
SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)
FROM orders
GROUP BY DATE_TRUNC('month', created_at);

-- ── 6. GIN Index (arrays, JSONB, full-text) ────────────────

-- Array column: find products by tags
CREATE INDEX idx_products_tags ON products USING gin(tags);
SELECT * FROM products WHERE tags @> ARRAY['wireless', 'bluetooth'];

-- JSONB containment: find by nested JSON values
CREATE INDEX idx_products_meta ON products USING gin(metadata jsonb_path_ops);
SELECT * FROM products WHERE metadata @> '{"color": "red", "size": "XL"}';

-- Full-text search
ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
  ) STORED;
CREATE INDEX idx_products_search ON products USING gin(search_vector);

SELECT id, name, ts_rank(search_vector, query) AS rank
FROM products, to_tsquery('english', 'wireless & bluetooth') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;

-- ── 7. Check Your Indexes ──────────────────────────────────

-- Unused indexes (wasting write performance and storage)
SELECT
  schemaname, relname AS table, indexrelname AS index,
  idx_scan, idx_tup_read,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE 'pg_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Duplicate/overlapping indexes
SELECT
  a.indexrelid::regclass AS index_a,
  b.indexrelid::regclass AS index_b,
  pg_size_pretty(pg_relation_size(a.indexrelid)) AS size_a
FROM pg_index a
JOIN pg_index b ON a.indrelid = b.indrelid
  AND a.indexrelid <> b.indexrelid
  AND a.indkey::text = LEFT(b.indkey::text, LENGTH(a.indkey::text));`,
      explanation: "This example is an index strategy workshop covering every index type: B-tree (default, for equality and range), composite (column order matters — leftmost prefix rule), covering with INCLUDE (enables index-only scans that skip the heap), partial (index only the rows you actually query — 50x smaller), expression (index function results like LOWER(email)), and GIN (for JSONB, arrays, full-text search). It also shows how to find unused and duplicate indexes that waste write performance.",
      order_index: 1,
    },
    {
      title: "EXPLAIN ANALYZE Deep Dive and Query Optimization Techniques",
      description: "Learn to read EXPLAIN ANALYZE output, identify bottlenecks (Seq Scans, bad estimates, nested loops), and apply optimization techniques: proper JOINs, EXISTS vs IN, subquery elimination, and avoiding SELECT *.",
      language: "sql",
      code: `-- ═══════════════════════════════════════════════════════════════
-- Reading EXPLAIN ANALYZE — What Each Node Means
-- ═══════════════════════════════════════════════════════════════

-- Always use these flags for full insight:
EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT TEXT)
SELECT u.name, COUNT(o.id) AS order_count, SUM(o.total) AS lifetime_value
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
  AND o.status = 'delivered'
GROUP BY u.id, u.name
HAVING SUM(o.total) > 1000
ORDER BY lifetime_value DESC
LIMIT 10;

/*
Expected output (annotated):

Limit (cost=850..850 rows=10 width=48)
      (actual time=15.2..15.3 rows=10 loops=1)
  -> Sort (cost=850..855 rows=200 width=48)
          (actual time=15.2..15.2 rows=10 loops=1)
     Sort Key: (sum(o.total)) DESC
     Sort Method: top-N heapsort  Memory: 26kB
     -> HashAggregate (cost=780..800 rows=200 width=48)
             (actual time=14.5..14.8 rows=156 loops=1)
        Group Key: u.id
        Filter: (sum(o.total) > 1000)
        Rows Removed by Filter: 344
        -> Hash Join (cost=120..700 rows=5000 width=36)
                (actual time=1.5..12.0 rows=5000 loops=1)
             Hash Cond: (o.user_id = u.id)
             -> Seq Scan on orders o  ← ⚠️ PROBLEM!
                  (cost=0..450 rows=20000 width=20)
                  (actual time=0.01..5.0 rows=20000 loops=1)
                  Filter: (status = 'delivered')
                  Rows Removed by Filter: 30000
                  Buffers: shared hit=200 read=150  ← 150 disk reads!
             -> Hash (cost=100..100 rows=500 width=24)
                  (actual time=0.8..0.8 rows=500 loops=1)
                  -> Index Scan using idx_users_created on users u
                       (cost=0..100 rows=500 width=24)
                       (actual time=0.02..0.5 rows=500 loops=1)

Planning Time: 0.3ms
Execution Time: 15.5ms
*/

-- ═══════════════════════════════════════════════════════════════
-- Key things to look for:
-- ═══════════════════════════════════════════════════════════════

-- 1. Seq Scan on large tables → needs an index
-- Fix: CREATE INDEX idx_orders_status ON orders(status);
-- Better: CREATE INDEX idx_orders_status_delivered ON orders(user_id, total)
--         WHERE status = 'delivered';

-- 2. Estimated vs actual rows
-- "rows=500" (estimated) vs "rows=50000" (actual) → stale statistics
-- Fix: ANALYZE users;

-- 3. High "loops" count → N+1 query pattern in the planner
-- "loops=10000" on a Nested Loop → consider Hash Join

-- 4. "Buffers: read=N" → disk I/O (cold cache)
-- High read count suggests more shared_buffers might help

-- 5. "Rows Removed by Filter" → index not selective enough
-- The DB fetched rows then threw them away

-- ═══════════════════════════════════════════════════════════════
-- Optimization 1: EXISTS vs IN vs JOIN for existence checks
-- ═══════════════════════════════════════════════════════════════

-- ❌ SLOW: JOIN + DISTINCT (joins ALL matching rows then deduplicates)
SELECT DISTINCT u.id, u.name, u.email
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'delivered';
-- If each user has 50 orders → creates 50x intermediate rows per user

-- ✅ FAST: EXISTS (stops at first match per user)
SELECT u.id, u.name, u.email
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.status = 'delivered'
);
-- Checks each user once, exits early on first matching order

-- ⚡ IN with small subquery (fine for small result sets)
SELECT * FROM products
WHERE category_id IN (SELECT id FROM categories WHERE parent_id = 5);
-- OK when subquery returns < 1000 rows

-- ═══════════════════════════════════════════════════════════════
-- Optimization 2: Eliminate Correlated Subqueries
-- ═══════════════════════════════════════════════════════════════

-- ❌ Correlated subquery: runs once PER outer row
SELECT
  p.name,
  p.price,
  (SELECT AVG(price) FROM products p2
   WHERE p2.category_id = p.category_id) AS avg_category_price
FROM products p;
-- If 50K products in 100 categories → runs AVG query 50,000 times!

-- ✅ JOIN with pre-aggregated CTE: runs AVG once per category
WITH category_avgs AS (
  SELECT category_id, AVG(price) AS avg_price
  FROM products
  GROUP BY category_id
)
SELECT p.name, p.price, ca.avg_price AS avg_category_price
FROM products p
JOIN category_avgs ca ON ca.category_id = p.category_id;
-- Aggregation runs once, then a simple hash join

-- ═══════════════════════════════════════════════════════════════
-- Optimization 3: Avoid SELECT *
-- ═══════════════════════════════════════════════════════════════

-- ❌ SELECT * fetches all columns (including 10KB description TEXT)
-- Prevents index-only scans, wastes network bandwidth
SELECT * FROM products WHERE category_id = 5;

-- ✅ Select only needed columns → enables index-only scan
SELECT id, name, price, slug FROM products WHERE category_id = 5;
-- With covering index: CREATE INDEX ... ON products(category_id)
-- INCLUDE (id, name, price, slug) → Index Only Scan

-- ═══════════════════════════════════════════════════════════════
-- Optimization 4: Batch Operations (Avoid N+1)
-- ═══════════════════════════════════════════════════════════════

-- ❌ N+1: one query per order to get items (in application code)
-- SELECT * FROM orders WHERE user_id = 42;               -- 1 query
-- SELECT * FROM order_items WHERE order_id = 101;         -- N queries
-- SELECT * FROM order_items WHERE order_id = 102;
-- SELECT * FROM order_items WHERE order_id = 103;
-- ... (100 orders = 101 queries!)

-- ✅ Single query with JOIN
SELECT o.id AS order_id, o.total, o.status,
  oi.product_name, oi.quantity, oi.unit_price
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.user_id = 42
ORDER BY o.created_at DESC;
-- 1 query regardless of how many orders

-- ✅ Batch with ANY (when you need separate result sets)
SELECT * FROM order_items
WHERE order_id = ANY(ARRAY[101, 102, 103, 104, 105]);
-- 1 query for all items

-- ═══════════════════════════════════════════════════════════════
-- Optimization 5: Efficient Pagination
-- ═══════════════════════════════════════════════════════════════

-- ❌ OFFSET pagination: gets slower as offset increases
SELECT * FROM products ORDER BY created_at DESC
LIMIT 20 OFFSET 10000;
-- PostgreSQL must scan and discard 10,000 rows first!

-- ✅ Keyset (cursor) pagination: constant performance
SELECT * FROM products
WHERE created_at < '2025-06-01T10:00:00Z'  -- cursor from previous page
ORDER BY created_at DESC
LIMIT 20;
-- Uses index, skips nothing — same speed for page 1 and page 1000

-- For compound sort (created_at + id for tie-breaking):
SELECT * FROM products
WHERE (created_at, id) < ('2025-06-01T10:00:00Z', 12345)
ORDER BY created_at DESC, id DESC
LIMIT 20;`,
      explanation: "This example teaches how to read EXPLAIN ANALYZE output with annotated commentary: identifying Seq Scans (need indexes), bad row estimates (need ANALYZE), high loop counts (consider Hash Join), and buffer reads (disk I/O). Then it shows five key optimization techniques: EXISTS vs IN vs JOIN for existence checks, eliminating correlated subqueries with CTEs, avoiding SELECT *, batching N+1 queries, and keyset pagination (constant performance vs OFFSET which degrades on later pages).",
      order_index: 2,
    },
    {
      title: "N+1 Query Solution, Connection Pooling, and Materialized Views in Node.js",
      description: "Production Node.js code showing the N+1 problem and three solutions, proper connection pooling configuration, and materialized view management for expensive aggregations.",
      language: "javascript",
      code: `import pg from 'pg';

// ═══════════════════════════════════════════════════════════════
// 1. Connection Pool — Production Configuration
// ═══════════════════════════════════════════════════════════════

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Pool sizing: (CPU cores * 2) + number of disks
  // For a 4-core machine with SSD: (4 * 2) + 1 = 9 → round to 10
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  min: 2,                         // keep 2 idle connections warm

  // Timeouts
  idleTimeoutMillis: 30000,       // close idle connection after 30s
  connectionTimeoutMillis: 5000,  // fail fast if pool is exhausted
  statement_timeout: 30000,       // kill queries running > 30s

  // SSL in production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,
});

// Monitor pool health
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

pool.on('connect', () => {
  console.log(\`Pool connection created (total: \${pool.totalCount})\`);
});

// Health check endpoint
async function checkDatabaseHealth() {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return {
      status: 'healthy',
      latencyMs: Date.now() - start,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. The N+1 Problem — Before and After
// ═══════════════════════════════════════════════════════════════

// ❌ N+1: 1 query for users + 100 queries for their latest orders
async function getUsersWithOrdersBad() {
  const { rows: users } = await pool.query(
    'SELECT id, name, email FROM users WHERE is_active = true LIMIT 100'
  );

  // This fires 100 separate queries — one per user!
  for (const user of users) {
    const { rows } = await pool.query(
      'SELECT id, total, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [user.id]
    );
    user.recentOrders = rows;
  }

  return users;
  // Total: 101 queries, ~500ms
}

// ✅ Fix 1: Single JOIN query
async function getUsersWithOrdersJoin() {
  const { rows } = await pool.query(\`
    SELECT
      u.id AS user_id, u.name, u.email,
      o.id AS order_id, o.total, o.status, o.created_at AS order_date
    FROM users u
    LEFT JOIN LATERAL (
      SELECT id, total, status, created_at
      FROM orders
      WHERE user_id = u.id
      ORDER BY created_at DESC
      LIMIT 5
    ) o ON true
    WHERE u.is_active = true
    LIMIT 100
  \`);

  // Group results by user
  const usersMap = new Map();
  for (const row of rows) {
    if (!usersMap.has(row.user_id)) {
      usersMap.set(row.user_id, {
        id: row.user_id,
        name: row.name,
        email: row.email,
        recentOrders: [],
      });
    }
    if (row.order_id) {
      usersMap.get(row.user_id).recentOrders.push({
        id: row.order_id,
        total: row.total,
        status: row.status,
        date: row.order_date,
      });
    }
  }

  return [...usersMap.values()];
  // Total: 1 query, ~15ms
}

// ✅ Fix 2: Two-query batch approach
async function getUsersWithOrdersBatch() {
  // Query 1: get users
  const { rows: users } = await pool.query(
    'SELECT id, name, email FROM users WHERE is_active = true LIMIT 100'
  );

  if (users.length === 0) return [];

  // Query 2: get ALL orders for these users in ONE query
  const userIds = users.map(u => u.id);
  const { rows: orders } = await pool.query(\`
    SELECT DISTINCT ON (user_id, rn)
      user_id, id, total, status, created_at,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
    FROM orders
    WHERE user_id = ANY($1)
    ORDER BY user_id, rn
  \`, [userIds]);

  // Group orders by user_id
  const ordersByUser = new Map();
  for (const order of orders) {
    if (order.rn <= 5) {
      if (!ordersByUser.has(order.user_id)) {
        ordersByUser.set(order.user_id, []);
      }
      ordersByUser.get(order.user_id).push(order);
    }
  }

  // Attach orders to users
  return users.map(user => ({
    ...user,
    recentOrders: ordersByUser.get(user.id) || [],
  }));
  // Total: 2 queries, ~20ms
}

// ═══════════════════════════════════════════════════════════════
// 3. Materialized View Management
// ═══════════════════════════════════════════════════════════════

class MaterializedViewManager {
  constructor(pool) {
    this.pool = pool;
  }

  // Create the materialized view for product analytics
  async createProductStatsView() {
    await this.pool.query(\`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_stats AS
      SELECT
        p.id AS product_id,
        p.name,
        p.category_id,
        COUNT(DISTINCT oi.order_id) AS total_orders,
        COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(DISTINCT r.id) AS review_count,
        MAX(o.created_at) AS last_ordered_at
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'delivered'
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_deleted = false
      WHERE p.is_deleted = false
      GROUP BY p.id, p.name, p.category_id
      WITH DATA
    \`);

    // Create indexes on the materialized view
    await this.pool.query(\`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_stats_id
        ON mv_product_stats(product_id);
      CREATE INDEX IF NOT EXISTS idx_mv_product_stats_category
        ON mv_product_stats(category_id);
      CREATE INDEX IF NOT EXISTS idx_mv_product_stats_revenue
        ON mv_product_stats(total_revenue DESC);
    \`);
  }

  // Refresh without blocking reads (requires UNIQUE index)
  async refreshConcurrently() {
    const start = Date.now();
    await this.pool.query(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats'
    );
    const duration = Date.now() - start;
    console.log(\`Materialized view refreshed in \${duration}ms\`);
    return duration;
  }

  // Query the materialized view (instant, pre-computed)
  async getTopProducts(categoryId, limit = 20) {
    const { rows } = await this.pool.query(\`
      SELECT product_id, name, total_orders, total_units_sold,
             total_revenue, avg_rating, review_count
      FROM mv_product_stats
      WHERE category_id = $1 AND total_orders > 0
      ORDER BY total_revenue DESC
      LIMIT $2
    \`, [categoryId, limit]);
    return rows;
  }

  // Schedule refresh every 15 minutes (call from app startup)
  startAutoRefresh(intervalMinutes = 15) {
    this.refreshInterval = setInterval(
      () => this.refreshConcurrently().catch(console.error),
      intervalMinutes * 60 * 1000
    );
    console.log(\`Auto-refresh scheduled every \${intervalMinutes} minutes\`);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Usage
const viewManager = new MaterializedViewManager(pool);
await viewManager.createProductStatsView();
viewManager.startAutoRefresh(15);

// API endpoint: GET /api/products/top?category=5
const topProducts = await viewManager.getTopProducts(5, 20);
// Returns instantly from pre-computed materialized view
// vs the raw query which takes 2-5 seconds on large datasets

export { pool, checkDatabaseHealth, MaterializedViewManager };`,
      explanation: "This example covers three critical performance topics in production Node.js: (1) Connection pooling with proper sizing (cores × 2 + disks), timeouts, SSL, and health monitoring. (2) The N+1 problem shown clearly — 101 queries reduced to 1 (LATERAL JOIN) or 2 (batch with ANY($1)), with a 25-33x speed improvement. (3) Materialized view management — creating views for expensive aggregations, indexing them, refreshing concurrently (no read blocking), and auto-scheduling refreshes. The materialized view turns a 2-5 second aggregation query into a sub-millisecond lookup.",
      order_index: 3,
    },
  ],
};

export default examples;
