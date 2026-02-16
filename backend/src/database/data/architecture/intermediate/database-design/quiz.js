// ============================================================================
// Database Design — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  'normalization-schema-design': [
    {
      question_text: "What are the three types of anomalies that normalization prevents?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Syntax errors, runtime errors, and logic errors",
        "Update anomalies, insertion anomalies, and deletion anomalies",
        "Read anomalies, write anomalies, and connection anomalies",
        "Index anomalies, constraint anomalies, and trigger anomalies"
      ]),
      correct_answer: "Update anomalies, insertion anomalies, and deletion anomalies",
      explanation: "Without normalization, redundant data causes: update anomalies (changing a value requires updating multiple rows), insertion anomalies (can't insert data without unrelated data present), and deletion anomalies (deleting one fact accidentally removes unrelated data).",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "A table has a composite primary key (student_id, course_id). The column 'student_name' depends only on student_id. Which normal form does this violate?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "1NF — because student_name is not atomic",
        "2NF — because student_name has a partial dependency on the composite key",
        "3NF — because student_name has a transitive dependency",
        "BCNF — because student_id is not a candidate key"
      ]),
      correct_answer: "2NF — because student_name has a partial dependency on the composite key",
      explanation: "2NF requires that every non-key column depends on the ENTIRE composite primary key. Since student_name depends only on student_id (part of the key), it's a partial dependency. Fix: move student_name to a separate students table with student_id as its primary key.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "Given a table: users(id, name, zip_code, city, state) — where city and state are determined by zip_code — which normal form is violated and why?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "1NF — city and state are not atomic values",
        "2NF — city and state partially depend on the primary key",
        "3NF — city and state transitively depend on id through zip_code (id → zip_code → city/state)",
        "The table is fully normalized — no violation"
      ]),
      correct_answer: "3NF — city and state transitively depend on id through zip_code (id → zip_code → city/state)",
      explanation: "3NF forbids transitive dependencies: non-key columns must depend directly on the primary key, not on other non-key columns. Here, city and state depend on zip_code (a non-key column), which depends on id. Fix: extract addresses(zip_code PK, city, state) and reference it from users.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "When is denormalization an appropriate design choice?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Always — normalized schemas are too slow for any real application",
        "When read performance is critical, reads vastly outnumber writes, and data rarely changes",
        "Never — denormalization always leads to data inconsistency and should be avoided",
        "Only when using NoSQL databases, never with PostgreSQL"
      ]),
      correct_answer: "When read performance is critical, reads vastly outnumber writes, and data rarely changes",
      explanation: "Denormalization trades write complexity (and potential inconsistency) for read speed by duplicating data. It's appropriate when reads outnumber writes by 10:1 or more, the duplicated data rarely changes, and the performance gain is measured and significant. Common patterns: summary tables, materialized views, and caching computed values.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "How do you model a many-to-many (M:N) relationship between 'users' and 'roles' in a relational database?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Add a 'roles' TEXT column to the users table with comma-separated values",
        "Add a user_id column to the roles table",
        "Create a junction table user_roles(user_id, role_id) with a composite primary key and foreign keys to both tables",
        "Store roles as a JSON array in the users table"
      ]),
      correct_answer: "Create a junction table user_roles(user_id, role_id) with a composite primary key and foreign keys to both tables",
      explanation: "M:N relationships require a junction (bridge/join) table with foreign keys to both related tables and a composite primary key. This maintains 1NF (no multi-valued columns), enables referential integrity via constraints, and allows adding relationship metadata (e.g., granted_at, granted_by) as extra columns on the junction table.",
      difficulty: "easy",
      order_index: 5,
    },
    {
      question_text: "What is the key difference between Single Table Inheritance (STI) and Class Table Inheritance?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "STI puts all types in one table with a discriminator column (many NULLs); Class Table uses a base table + child tables per type (requires JOINs but no NULLs)",
        "STI is only for NoSQL; Class Table is only for SQL databases",
        "STI uses inheritance in application code; Class Table uses database triggers",
        "There is no difference — they are two names for the same pattern"
      ]),
      correct_answer: "STI puts all types in one table with a discriminator column (many NULLs); Class Table uses a base table + child tables per type (requires JOINs but no NULLs)",
      explanation: "STI stores all types in a single table with a 'type' discriminator column. Type-specific columns are NULL for other types — simple queries but wastes space. Class Table Inheritance puts shared columns in a base table and type-specific columns in separate child tables linked by FK — cleaner constraints (NOT NULL per type), but requires JOINs to get full data.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text: "When should you choose UUIDs over auto-incrementing SERIAL IDs as primary keys?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Always — UUIDs are superior in every way",
        "When building distributed systems where multiple databases generate IDs independently, or when IDs are exposed in URLs and should not be guessable",
        "Only for NoSQL databases — UUIDs don't work in PostgreSQL",
        "When the table has fewer than 1000 rows"
      ]),
      correct_answer: "When building distributed systems where multiple databases generate IDs independently, or when IDs are exposed in URLs and should not be guessable",
      explanation: "UUIDs are globally unique without coordination — essential for distributed systems, multi-region databases, and client-side ID generation. They're also non-sequential, so users can't guess other resource IDs from URLs. Trade-offs: UUIDs are 16 bytes (vs 4-8 for serial), cause index fragmentation due to random ordering, and are slower for JOINs. A hybrid approach uses BIGSERIAL internally and UUID as a public_id for external exposure.",
      difficulty: "medium",
      order_index: 7,
    },
    {
      question_text: "What is the purpose of soft deletes, and how are they typically implemented in PostgreSQL?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Soft deletes temporarily lock rows for concurrent access using SELECT FOR UPDATE",
        "Soft deletes mark rows as deleted (is_deleted BOOLEAN + deleted_at timestamp) instead of physically removing them, allowing recovery and audit trails",
        "Soft deletes automatically move rows to an archive table using triggers",
        "Soft deletes are a PostgreSQL-specific feature using the DELETE SOFT SQL command"
      ]),
      correct_answer: "Soft deletes mark rows as deleted (is_deleted BOOLEAN + deleted_at timestamp) instead of physically removing them, allowing recovery and audit trails",
      explanation: "Soft deletes add is_deleted (BOOLEAN DEFAULT false) and deleted_at (TIMESTAMPTZ) columns. Instead of DELETE, you UPDATE SET is_deleted = true, deleted_at = NOW(). Benefits: data recovery, audit trails, referential integrity preserved. Use partial indexes (WHERE is_deleted = false) and views to exclude deleted rows from normal queries while keeping the data accessible for admin/audit purposes.",
      difficulty: "easy",
      order_index: 8,
    },
    {
      question_text: "Which PostgreSQL data type should you use for storing monetary values, and why?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "FLOAT or DOUBLE PRECISION — they handle decimals and are fast for calculations",
        "TEXT — store as formatted strings like '$19.99' for easy display",
        "DECIMAL(10,2) or NUMERIC — exact precision with no floating-point rounding errors",
        "INTEGER — store cents (1999 instead of 19.99) to avoid all decimal issues"
      ]),
      correct_answer: "DECIMAL(10,2) or NUMERIC — exact precision with no floating-point rounding errors",
      explanation: "FLOAT and DOUBLE use binary floating-point representation, which cannot exactly represent many decimal fractions (0.1 + 0.2 = 0.30000000000000004). DECIMAL/NUMERIC uses exact decimal arithmetic — critical for financial calculations where rounding errors accumulate. Storing cents as INTEGER is also valid but requires careful conversion. Never use FLOAT for money.",
      difficulty: "easy",
      order_index: 9,
    },
    {
      question_text: "What does ON DELETE CASCADE do on a foreign key constraint?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It prevents deletion of the parent row if child rows exist",
        "It sets the foreign key column to NULL in child rows when the parent is deleted",
        "It automatically deletes all child rows when the referenced parent row is deleted",
        "It logs the deletion event for auditing purposes"
      ]),
      correct_answer: "It automatically deletes all child rows when the referenced parent row is deleted",
      explanation: "ON DELETE CASCADE propagates deletion: when a parent row is deleted, all rows in child tables that reference it are automatically deleted too. Use it for dependent data (order_items when an order is deleted). Use RESTRICT to prevent deletion, SET NULL to keep the child but clear the reference, and SET DEFAULT to reset to a default value.",
      difficulty: "easy",
      order_index: 10,
    },
  ],
  'indexing-query-optimization': [
    {
      question_text: "How does a B-tree index find a row in a table with 10 million rows?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It scans every row sequentially until it finds a match — O(n)",
        "It uses a hash function to compute the exact disk location — O(1)",
        "It traverses a balanced tree structure with sorted keys, requiring about 23 comparisons (log₂ 10M) — O(log n)",
        "It loads the entire table into memory and uses binary search"
      ]),
      correct_answer: "It traverses a balanced tree structure with sorted keys, requiring about 23 comparisons (log₂ 10M) — O(log n)",
      explanation: "B-tree indexes store keys in a balanced tree where all leaf nodes are at the same depth. Starting at the root, each comparison eliminates half the remaining keys, navigating root → branch → leaf in O(log n) time. For 10 million rows, that's about 23 comparisons instead of scanning all 10 million. B-trees support equality, range queries, and sorting.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Given the composite index CREATE INDEX idx ON orders(user_id, status, created_at), which query can use this index?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "SELECT * FROM orders WHERE status = 'shipped'",
        "SELECT * FROM orders WHERE created_at > '2025-01-01'",
        "SELECT * FROM orders WHERE user_id = 42 AND status = 'shipped' ORDER BY created_at",
        "SELECT * FROM orders WHERE status = 'shipped' AND created_at > '2025-01-01'"
      ]),
      correct_answer: "SELECT * FROM orders WHERE user_id = 42 AND status = 'shipped' ORDER BY created_at",
      explanation: "Composite indexes follow the leftmost prefix rule — the index is only usable when the query filters on columns from left to right without gaps. The index (user_id, status, created_at) supports queries that filter on: user_id alone; user_id + status; or user_id + status + created_at. Skipping user_id (filtering only on status or created_at) cannot use this index.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "What is a covering index, and what performance benefit does it provide?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "An index that automatically updates when the table data changes",
        "An index that includes all queried columns via INCLUDE, enabling index-only scans that skip the table heap entirely",
        "An index that covers multiple tables in a JOIN operation",
        "An index that is automatically created by PostgreSQL when you define a foreign key"
      ]),
      correct_answer: "An index that includes all queried columns via INCLUDE, enabling index-only scans that skip the table heap entirely",
      explanation: "A covering index stores additional columns in its leaf nodes using the INCLUDE clause. When all columns needed by a query are in the index, PostgreSQL performs an 'Index Only Scan' — it reads only the index without accessing the table heap. This eliminates random I/O to the table, often providing 2-5x speedup. Example: CREATE INDEX idx ON users(role) INCLUDE (name, email).",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "You see this in EXPLAIN ANALYZE output:\n\n```\nSeq Scan on orders (actual rows=20000)\n  Filter: (status = 'delivered')\n  Rows Removed by Filter: 80000\n```\n\nWhat does this tell you?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The query is well-optimized — sequential scans are always the fastest option",
        "PostgreSQL scanned all 100,000 rows, kept only 20,000, and discarded 80,000 — the status column likely needs an index",
        "The query returned too many rows and should use LIMIT",
        "The table has corrupt data and needs to be rebuilt with VACUUM FULL"
      ]),
      correct_answer: "PostgreSQL scanned all 100,000 rows, kept only 20,000, and discarded 80,000 — the status column likely needs an index",
      explanation: "A Seq Scan with 'Rows Removed by Filter: 80,000' means PostgreSQL read every row in the table and threw away 80% of them. This is a clear sign that an index on the status column would help: CREATE INDEX idx_orders_status ON orders(status). A partial index (WHERE status = 'delivered') would be even better if you only query this one status value.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "What is the N+1 query problem, and how do you fix it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A query that returns N+1 duplicate rows — fixed by adding DISTINCT",
        "Firing 1 query to get a list, then N separate queries (one per item) to get related data — fixed by using JOINs or batching with WHERE id = ANY($1)",
        "A query that uses N+1 indexes simultaneously — fixed by dropping unused indexes",
        "An off-by-one error in LIMIT/OFFSET pagination — fixed by using keyset pagination"
      ]),
      correct_answer: "Firing 1 query to get a list, then N separate queries (one per item) to get related data — fixed by using JOINs or batching with WHERE id = ANY($1)",
      explanation: "The N+1 problem occurs when you fetch a list (1 query) and then loop through results, firing a separate query for each item (N queries). For 100 users with their orders, that's 101 queries. Fix: use a JOIN to get everything in 1 query, or batch with WHERE user_id = ANY($1) for 2 queries total. The performance difference is dramatic — 101 queries at 5ms each = 505ms vs 1 query at 15ms.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text: "Why should you avoid using SELECT * in production queries?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "SELECT * is not valid SQL syntax in PostgreSQL",
        "It fetches all columns (including large TEXT/JSONB), wastes bandwidth, prevents index-only scans, and breaks if columns are added or reordered",
        "It is slower because PostgreSQL must look up column names before executing",
        "It locks the entire table instead of just the requested rows"
      ]),
      correct_answer: "It fetches all columns (including large TEXT/JSONB), wastes bandwidth, prevents index-only scans, and breaks if columns are added or reordered",
      explanation: "SELECT * sends unnecessary data over the network (including large TEXT or JSONB columns you don't need), prevents PostgreSQL from using index-only scans (which skip the heap table), and makes code fragile — adding a column to the table changes the query result shape. Always select only the columns you need: SELECT id, name, price FROM products.",
      difficulty: "easy",
      order_index: 6,
    },
    {
      question_text: "When should you use EXISTS instead of IN for subqueries?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Never — IN is always faster than EXISTS",
        "When the subquery returns a large result set, because EXISTS stops at the first match while IN materializes all results",
        "Only when using PostgreSQL — EXISTS doesn't work in MySQL",
        "When the subquery contains aggregate functions like COUNT or SUM"
      ]),
      correct_answer: "When the subquery returns a large result set, because EXISTS stops at the first match while IN materializes all results",
      explanation: "EXISTS is a semi-join that stops scanning as soon as it finds the first matching row — efficient when the subquery would return many matches. IN materializes the entire subquery result set into memory first. For 'find users who have at least one order,' EXISTS checks each user and stops at the first order found, while IN would first build a list of all user_ids from orders. Modern PostgreSQL often optimizes both to the same plan, but EXISTS is generally preferred for large subqueries.",
      difficulty: "medium",
      order_index: 7,
    },
    {
      question_text: "What is a materialized view, and when should you use one?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A virtual table that runs its query every time it's accessed — like a regular view",
        "A pre-computed query result stored on disk that must be manually refreshed — ideal for expensive aggregations that don't need real-time data",
        "A temporary table that is automatically dropped at the end of a transaction",
        "A view that materializes JOINs at index creation time for faster lookups"
      ]),
      correct_answer: "A pre-computed query result stored on disk that must be manually refreshed — ideal for expensive aggregations that don't need real-time data",
      explanation: "A materialized view stores the query result physically on disk, making reads instant but data stale until refreshed. Use REFRESH MATERIALIZED VIEW CONCURRENTLY to update without blocking reads (requires a UNIQUE index). Ideal for dashboards, analytics, and reporting queries that aggregate millions of rows but tolerate data being 5-15 minutes old.",
      difficulty: "medium",
      order_index: 8,
    },
    {
      question_text: "What is the purpose of a partial index in PostgreSQL?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "An index that only indexes some columns of a table",
        "An index with a WHERE clause that only indexes rows matching a condition — smaller, faster, and more efficient for targeted queries",
        "An incomplete index that is still being built in the background",
        "An index on a partitioned table that only covers one partition"
      ]),
      correct_answer: "An index with a WHERE clause that only indexes rows matching a condition — smaller, faster, and more efficient for targeted queries",
      explanation: "A partial index includes a WHERE clause: CREATE INDEX idx ON orders(created_at) WHERE status = 'pending'. If only 5% of orders are pending, this index is 20x smaller than a full index, uses 20x less storage, and is faster to scan and maintain. Queries must include the matching WHERE condition to use the partial index.",
      difficulty: "medium",
      order_index: 9,
    },
    {
      question_text: "Which partitioning strategy is best for time-series data like event logs?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Hash partitioning by event_id for even distribution",
        "List partitioning by event_type for categorical separation",
        "Range partitioning by timestamp — queries for specific time periods only scan relevant partitions, and old partitions can be dropped efficiently",
        "No partitioning — a single table with proper indexes is always sufficient"
      ]),
      correct_answer: "Range partitioning by timestamp — queries for specific time periods only scan relevant partitions, and old partitions can be dropped efficiently",
      explanation: "Range partitioning by timestamp (e.g., monthly or quarterly partitions) is ideal for time-series data because: (1) queries filtering by date range only scan relevant partitions (partition pruning), (2) old data can be dropped instantly by detaching/dropping a partition instead of slow DELETE operations, and (3) VACUUM and maintenance run on smaller individual partitions. Hash partitioning is for even data distribution; list partitioning is for categorical data.",
      difficulty: "medium",
      order_index: 10,
    },
  ],
};

export default quiz;
