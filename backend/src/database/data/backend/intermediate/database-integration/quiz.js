// ============================================================================
// Database Integration — Quiz Questions (Enhanced)
// ============================================================================

const quiz = {
  // ===========================================================================
  // Lesson 1: PostgreSQL with Node.js
  // ===========================================================================
  'postgresql-node': [
    {
      question_text: "Why should you use parameterized queries ($1, $2) instead of string interpolation when building SQL queries?",
      question_type: "multiple_choice",
      options: [
        "They are faster because PostgreSQL can cache the query plan",
        "They prevent SQL injection attacks by treating parameters as data, not code",
        "They are required by the pg library and regular queries won't work",
        "They automatically validate the data types of the parameters"
      ],
      correct_answer: "They prevent SQL injection attacks by treating parameters as data, not code",
      explanation: "Parameterized queries ensure that user input is always treated as data values, never as executable SQL code. Even if a user submits malicious input like `'; DROP TABLE users; --`, it's treated as a literal string value, not SQL commands. While query plan caching is a secondary benefit, the primary reason is security.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What does ROLLBACK do in a PostgreSQL transaction?",
      question_type: "multiple_choice",
      options: [
        "Saves the transaction permanently to disk",
        "Undoes all changes made since the last BEGIN statement",
        "Retries the failed query automatically",
        "Creates a savepoint to return to later"
      ],
      correct_answer: "Undoes all changes made since the last BEGIN statement",
      explanation: "ROLLBACK reverts ALL changes made within the current transaction (since BEGIN). This is essential for maintaining data consistency — if any step in a multi-step operation fails, ROLLBACK ensures the database returns to its previous consistent state. This is the 'Atomicity' property of ACID transactions.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "What happens if you forget to call `client.release()` after using `pool.connect()` in a transaction?",
      question_type: "multiple_choice",
      options: [
        "The transaction is automatically rolled back",
        "The connection is returned to the pool after 30 seconds",
        "The connection is leaked, eventually exhausting the pool and hanging the application",
        "PostgreSQL automatically closes the connection"
      ],
      correct_answer: "The connection is leaked, eventually exhausting the pool and hanging the application",
      explanation: "When you call pool.connect(), a connection is checked out from the pool. If you never call client.release(), that connection is never returned. As more connections leak, the pool runs out, and new pool.connect() calls hang forever waiting for an available connection. Always use a try/finally block to ensure release() is called.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "Which PostgreSQL transaction isolation level is the DEFAULT and suitable for most web applications?",
      question_type: "multiple_choice",
      options: [
        "READ UNCOMMITTED",
        "READ COMMITTED",
        "REPEATABLE READ",
        "SERIALIZABLE"
      ],
      correct_answer: "READ COMMITTED",
      explanation: "READ COMMITTED is PostgreSQL's default isolation level. Each statement within the transaction sees only data committed before that statement began. It prevents dirty reads while allowing good concurrency. REPEATABLE READ and SERIALIZABLE offer stronger guarantees but with higher performance costs. PostgreSQL treats READ UNCOMMITTED the same as READ COMMITTED.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "In the `pg` library, what is the difference between `pool.query()` and using `pool.connect()` to get a client?",
      question_type: "multiple_choice",
      options: [
        "pool.query() is for SELECT only; pool.connect() is for INSERT/UPDATE/DELETE",
        "pool.query() automatically checks out a connection, runs the query, and releases it; pool.connect() gives you a dedicated connection for transaction control",
        "pool.connect() is faster because it skips the connection pool",
        "There is no difference — they are interchangeable"
      ],
      correct_answer: "pool.query() automatically checks out a connection, runs the query, and releases it; pool.connect() gives you a dedicated connection for transaction control",
      explanation: "pool.query() is a convenience method that internally calls connect(), runs your query, and then releases the connection back to the pool. pool.connect() gives you a dedicated client that you control — essential for transactions where multiple queries must run on the SAME connection (BEGIN → queries → COMMIT/ROLLBACK). Forgetting to release a connected client leaks connections.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text: "What does the `RETURNING *` clause do in a PostgreSQL INSERT or UPDATE statement?",
      question_type: "multiple_choice",
      options: [
        "Returns all rows in the table after the modification",
        "Returns the inserted or updated rows, including auto-generated values like id and timestamps",
        "Returns the rows that existed before the modification",
        "Returns a count of how many rows were affected"
      ],
      correct_answer: "Returns the inserted or updated rows, including auto-generated values like id and timestamps",
      explanation: "RETURNING * makes INSERT/UPDATE/DELETE return the affected rows as if you ran a SELECT. This is extremely useful because you get auto-generated values (like UUID primary keys, default timestamps, sequences) without a second query. You can also use RETURNING with specific columns: `RETURNING id, created_at`.",
      difficulty: "easy",
      order_index: 6,
    },
    {
      question_text: "You have a connection pool with `max: 20`. Your Express server handles 100 concurrent requests, each needing a database query. What happens?",
      question_type: "multiple_choice",
      options: [
        "80 requests immediately get an error",
        "The pool creates 100 connections, ignoring the max setting",
        "80 requests wait in a queue until a connection becomes available",
        "PostgreSQL rejects all connections because it's overloaded"
      ],
      correct_answer: "80 requests wait in a queue until a connection becomes available",
      explanation: "The connection pool queues requests when all connections are in use. As connections are released (queries finish), queued requests get the next available connection. If `connectionTimeoutMillis` is set and a request waits longer than that threshold, it receives a timeout error. This queueing behavior is why appropriate pool sizing matters — too small causes latency spikes, too large wastes PostgreSQL resources.",
      difficulty: "hard",
      order_index: 7,
    },
  ],

  // ===========================================================================
  // Lesson 2: Database Migrations & Schema Management
  // ===========================================================================
  'migrations-schema': [
    {
      question_text: "What is the primary purpose of database migrations?",
      question_type: "multiple_choice",
      options: [
        "To back up the database before making changes",
        "To version-control schema changes and keep all environments in sync",
        "To copy data from one database server to another",
        "To optimize query performance by rebuilding tables"
      ],
      correct_answer: "To version-control schema changes and keep all environments in sync",
      explanation: "Migrations track incremental schema changes in code files, providing a history of how the database structure evolved. When a new developer joins or you deploy to staging/production, running migrations brings the schema up to date automatically. Without migrations, schema changes are error-prone manual processes.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "Why should every migration have both an UP and a DOWN function?",
      question_type: "multiple_choice",
      options: [
        "The DOWN function improves query performance",
        "PostgreSQL requires both functions to apply changes",
        "The DOWN function allows you to reverse the migration if something goes wrong",
        "The DOWN function runs automatically after UP completes"
      ],
      correct_answer: "The DOWN function allows you to reverse the migration if something goes wrong",
      explanation: "The DOWN function is the inverse of UP — if UP creates a table, DOWN drops it; if UP adds a column, DOWN removes it. This reversibility is crucial for recovering from bad deployments. Without DOWN, rolling back a problematic migration requires manual SQL surgery on production, which is risky and error-prone.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "Why should you use NUMERIC(12,2) instead of FLOAT for storing monetary values in PostgreSQL?",
      question_type: "multiple_choice",
      options: [
        "NUMERIC is faster than FLOAT for arithmetic operations",
        "FLOAT cannot store decimal values",
        "FLOAT uses binary representation which causes rounding errors (e.g., 0.1 + 0.2 ≠ 0.3)",
        "NUMERIC supports larger numbers than FLOAT"
      ],
      correct_answer: "FLOAT uses binary representation which causes rounding errors (e.g., 0.1 + 0.2 ≠ 0.3)",
      explanation: "FLOAT (and DOUBLE PRECISION) use IEEE 754 binary floating-point representation, which cannot exactly represent many decimal fractions. This leads to rounding errors: 0.1 + 0.2 = 0.30000000000000004. For financial data, even tiny rounding errors accumulate into real money discrepancies. NUMERIC (also called DECIMAL) stores exact decimal values with fixed precision.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "You deployed migration 015 to production and discovered it has a bug. What's the correct approach?",
      question_type: "multiple_choice",
      options: [
        "Edit migration 015 to fix the bug and re-run it",
        "Delete migration 015 and create a new file with the corrected code",
        "Run the DOWN migration to roll back 015, then create migration 016 with the fix",
        "Manually run SQL on the production database to fix the issue"
      ],
      correct_answer: "Run the DOWN migration to roll back 015, then create migration 016 with the fix",
      explanation: "Never edit or delete an already-applied migration — other environments (dev machines, staging, CI) have already recorded it as applied. The correct approach is: (1) Roll back migration 015 using its DOWN function, (2) Create a new migration 016 with the corrected schema change. This preserves the migration history and ensures all environments stay consistent.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text: "What is the difference between TIMESTAMP and TIMESTAMPTZ in PostgreSQL?",
      question_type: "multiple_choice",
      options: [
        "TIMESTAMPTZ stores the timezone name alongside the timestamp",
        "TIMESTAMP is more accurate than TIMESTAMPTZ",
        "TIMESTAMPTZ converts to UTC for storage and adjusts to the session timezone on retrieval; TIMESTAMP ignores timezone entirely",
        "They are identical — TIMESTAMPTZ is just an alias"
      ],
      correct_answer: "TIMESTAMPTZ converts to UTC for storage and adjusts to the session timezone on retrieval; TIMESTAMP ignores timezone entirely",
      explanation: "TIMESTAMPTZ (timestamp with time zone) stores the value in UTC internally and converts it to the client's session timezone on retrieval. TIMESTAMP (without time zone) stores the value as-is with no timezone awareness. In global applications with users in different timezones, TIMESTAMP can lead to incorrect time displays. Best practice: always use TIMESTAMPTZ.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text: "What does ON DELETE CASCADE do on a foreign key constraint?",
      question_type: "multiple_choice",
      options: [
        "Prevents the parent row from being deleted if child rows exist",
        "Automatically deletes all child rows when the parent row is deleted",
        "Sets the foreign key column to NULL when the parent is deleted",
        "Logs a warning but allows the deletion to proceed without affecting child rows"
      ],
      correct_answer: "Automatically deletes all child rows when the parent row is deleted",
      explanation: "ON DELETE CASCADE means: when a parent row is deleted, all child rows referencing it are automatically deleted too. For example, if a user is deleted and posts have `REFERENCES users(id) ON DELETE CASCADE`, all of that user's posts are also deleted. Other options include ON DELETE SET NULL (sets FK to NULL), ON DELETE RESTRICT (prevents deletion), and ON DELETE SET DEFAULT.",
      difficulty: "easy",
      order_index: 6,
    },
    {
      question_text: "Which naming convention is considered best practice for PostgreSQL database objects?",
      question_type: "multiple_choice",
      options: [
        "camelCase for tables and columns (userProfiles, createdAt)",
        "PascalCase for tables, camelCase for columns (UserProfiles, createdAt)",
        "snake_case for tables and columns (user_profiles, created_at)",
        "UPPER_CASE for tables, lower_case for columns (USER_PROFILES, created_at)"
      ],
      correct_answer: "snake_case for tables and columns (user_profiles, created_at)",
      explanation: "PostgreSQL automatically lowercases unquoted identifiers, making snake_case the natural and universally recommended convention. Tables should be plural (users, posts), columns and foreign keys should use snake_case (created_at, user_id), and indexes should follow idx_table_column (idx_users_email). Using camelCase requires quoting identifiers everywhere, which is error-prone.",
      difficulty: "easy",
      order_index: 7,
    },
  ],

  // ===========================================================================
  // Lesson 3: ORM Integration with Sequelize & Prisma
  // ===========================================================================
  'orm-integration': [
    {
      question_text: "What is an ORM (Object-Relational Mapper)?",
      question_type: "multiple_choice",
      options: [
        "A tool that converts JavaScript objects to JSON for API responses",
        "A library that maps database tables to programming language objects, translating between SQL and code",
        "A database management system that replaces PostgreSQL",
        "A caching layer that sits between the application and the database"
      ],
      correct_answer: "A library that maps database tables to programming language objects, translating between SQL and code",
      explanation: "An ORM bridges the 'impedance mismatch' between relational databases (tables, rows, SQL) and object-oriented programming (classes, instances, methods). Instead of writing SQL directly, developers interact with database records as objects — User.findByPk(1) instead of SELECT * FROM users WHERE id = 1. The ORM generates and executes the SQL behind the scenes.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is the N+1 query problem, and why is it the most common ORM performance issue?",
      question_type: "multiple_choice",
      options: [
        "When the ORM creates N+1 database connections instead of using a pool",
        "When fetching a list of N records triggers 1 query for the list + N additional queries for each record's associations",
        "When N+1 users try to access the database simultaneously",
        "When the ORM runs N+1 validation checks before each query"
      ],
      correct_answer: "When fetching a list of N records triggers 1 query for the list + N additional queries for each record's associations",
      explanation: "The N+1 problem occurs when you fetch a list (1 query) and then access each item's related data individually (N queries). For example: fetching 100 posts (1 query) and then loading each post's author separately (100 queries) = 101 total queries. The fix is eager loading (include/join) which fetches everything in 1-2 queries. This is the most common performance issue because ORMs make lazy loading the default behavior.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "In Sequelize, what does the `paranoid: true` option do on a model?",
      question_type: "multiple_choice",
      options: [
        "Encrypts all data before storing it in the database",
        "Prevents any delete operations — records can only be archived",
        "Enables soft deletes — adds a `deleted_at` column and filters deleted records from queries",
        "Adds extra validation checks before every database operation"
      ],
      correct_answer: "Enables soft deletes — adds a `deleted_at` column and filters deleted records from queries",
      explanation: "With paranoid: true, calling Model.destroy() sets the deleted_at timestamp instead of actually deleting the row. All subsequent queries (findAll, findOne, etc.) automatically filter out rows where deleted_at is not null. You can still query deleted records using { paranoid: false }. This is valuable for audit trails, undo functionality, and regulatory compliance.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "What is the key difference between Sequelize's and Prisma's approach to schema definition?",
      question_type: "multiple_choice",
      options: [
        "Sequelize defines models in JavaScript/TypeScript code; Prisma uses a dedicated .prisma schema file that generates a type-safe client",
        "Sequelize uses YAML configuration files; Prisma uses JSON",
        "Sequelize requires manual SQL scripts; Prisma auto-detects the schema from the database",
        "There is no difference — both use JavaScript decorators"
      ],
      correct_answer: "Sequelize defines models in JavaScript/TypeScript code; Prisma uses a dedicated .prisma schema file that generates a type-safe client",
      explanation: "Sequelize follows a code-first approach — models are defined as JavaScript classes with Model.init(). Prisma uses a schema-first approach — you write a .prisma schema file with a custom DSL, then run `prisma generate` to create a type-safe client with full autocompletion. Prisma's approach provides better TypeScript integration because types are generated from the schema.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "When should you prefer raw SQL over using an ORM?",
      question_type: "multiple_choice",
      options: [
        "Always — ORMs are always slower and should never be used",
        "For simple CRUD operations on a single table",
        "For complex queries involving CTEs, window functions, recursive queries, or performance-critical paths",
        "Only when the ORM doesn't support the target database"
      ],
      correct_answer: "For complex queries involving CTEs, window functions, recursive queries, or performance-critical paths",
      explanation: "ORMs excel at simple CRUD operations but struggle with complex SQL features like Common Table Expressions (WITH), window functions (RANK, ROW_NUMBER), recursive queries, complex aggregations, and database-specific features (PostgreSQL arrays, full-text search). For these cases, raw SQL gives you full control. For performance-critical paths, the ORM's overhead (object hydration, query building) can also be significant. Most production applications use a mix of ORM for CRUD and raw SQL for complex queries.",
      difficulty: "hard",
      order_index: 5,
    },
    {
      question_text: "In Prisma, what does `prisma.$transaction()` do?",
      question_type: "multiple_choice",
      options: [
        "Logs all database queries to a transaction log file",
        "Executes multiple database operations atomically — all succeed or all are rolled back",
        "Creates a read-only snapshot of the database",
        "Batches queries to reduce network round-trips without atomicity guarantees"
      ],
      correct_answer: "Executes multiple database operations atomically — all succeed or all are rolled back",
      explanation: "prisma.$transaction() wraps multiple operations in a database transaction. It supports two modes: (1) Batch mode — pass an array of Prisma promises: prisma.$transaction([query1, query2]); (2) Interactive mode — pass an async function: prisma.$transaction(async (tx) => { ... }). In interactive mode, if any operation throws, all changes are rolled back. This is essential for operations like transferring funds or creating orders with line items.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text: "Which database access abstraction level provides the best balance of type safety, developer productivity, and auto-generated types in a TypeScript project?",
      question_type: "multiple_choice",
      options: [
        "Raw SQL with the pg library",
        "Knex.js query builder",
        "Sequelize ORM",
        "Prisma (schema-first ORM)"
      ],
      correct_answer: "Prisma (schema-first ORM)",
      explanation: "Prisma generates a fully type-safe client from its .prisma schema file. Every query has complete TypeScript autocompletion, including nested relations, filters, and return types. Sequelize can work with TypeScript but requires manual type definitions. Knex has basic types but doesn't auto-generate them from the schema. Raw SQL has no type safety at all (result is `any`). For TypeScript projects, Prisma provides the best developer experience.",
      difficulty: "medium",
      order_index: 7,
    },
  ],

  // ===========================================================================
  // Lesson 4: Query Optimization & Indexing
  // ===========================================================================
  'query-optimization': [
    {
      question_text: "What does a 'Seq Scan' in PostgreSQL's EXPLAIN output indicate?",
      question_type: "multiple_choice",
      options: [
        "The query uses a sequence (auto-increment) to generate IDs",
        "PostgreSQL is reading every row in the table sequentially (full table scan)",
        "The query results are returned in sequential order",
        "The query uses a sequential index for fast lookups"
      ],
      correct_answer: "PostgreSQL is reading every row in the table sequentially (full table scan)",
      explanation: "A Sequential Scan (Seq Scan) means PostgreSQL reads every row in the table to find matching records. For small tables (<1000 rows), this is fine. For large tables, it's usually a sign of a missing index. However, if a query returns most of the table's rows (e.g., >10-20%), PostgreSQL may choose a Seq Scan over an index scan because reading sequentially from disk is faster than random index lookups.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "You have an index on `users(email)`. Why does this query NOT use the index? `SELECT * FROM users WHERE LOWER(email) = 'alice@example.com'`",
      question_type: "multiple_choice",
      options: [
        "The LOWER() function converts the query to a full-text search",
        "The index is on the raw column, but the query applies a function to it — the index cannot match transformed values",
        "PostgreSQL indexes don't support string comparisons",
        "The index is automatically used, but EXPLAIN doesn't show it"
      ],
      correct_answer: "The index is on the raw column, but the query applies a function to it — the index cannot match transformed values",
      explanation: "When you apply a function to an indexed column in a WHERE clause, PostgreSQL can't use the regular index because the index stores original values, not the function's output. The fix is to create an expression index: CREATE INDEX idx_users_email_lower ON users(LOWER(email)). Alternatively, normalize data at write time (always store lowercase emails) so you can use the regular index.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "What is the 'leftmost prefix rule' for composite indexes?",
      question_type: "multiple_choice",
      options: [
        "PostgreSQL reads the leftmost column of the index first because it's the most important",
        "A composite index on (A, B, C) can serve queries on A, (A, B), or (A, B, C) — but NOT queries on B alone or C alone",
        "You must always use the leftmost column in your SELECT list",
        "The leftmost column in a composite index must be the primary key"
      ],
      correct_answer: "A composite index on (A, B, C) can serve queries on A, (A, B), or (A, B, C) — but NOT queries on B alone or C alone",
      explanation: "A composite (multi-column) index is organized as a tree with the leftmost column as the primary sort key. PostgreSQL can use the index for any query that uses a leftmost prefix of the indexed columns: (A), (A, B), or (A, B, C). But it cannot efficiently use the index for (B), (C), or (B, C) because those skip the first level of the tree. This is why column order in composite indexes matters enormously.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text: "What is a partial index, and when should you use one?",
      question_type: "multiple_choice",
      options: [
        "An index that only includes some columns of the table",
        "An index with a WHERE clause that only indexes rows matching a condition, reducing index size",
        "An index that is partially built and completed in the background",
        "An index on a partial string match (first N characters only)"
      ],
      correct_answer: "An index with a WHERE clause that only indexes rows matching a condition, reducing index size",
      explanation: "A partial index includes only rows that match a specified condition. For example: CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE status = 'published'. If only 20% of posts are published, this index is ~80% smaller than a full index. Use partial indexes when most queries filter on a specific condition, significantly reducing storage, write overhead, and lookup time.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "What is the purpose of a covering index (using the INCLUDE clause)?",
      question_type: "multiple_choice",
      options: [
        "To cover all possible query patterns for a table",
        "To include additional columns in the index so PostgreSQL can answer the query entirely from the index without reading the table (Index Only Scan)",
        "To create a backup copy of the indexed columns",
        "To include NULL values in the index, which are normally excluded"
      ],
      correct_answer: "To include additional columns in the index so PostgreSQL can answer the query entirely from the index without reading the table (Index Only Scan)",
      explanation: "A covering index stores extra columns in the index's leaf pages using the INCLUDE clause. When a query only needs the indexed + included columns, PostgreSQL performs an 'Index Only Scan' — it reads the answer directly from the index without touching the table at all. This is significantly faster for hot queries. Example: CREATE INDEX idx_users_email ON users(email) INCLUDE (name, role); enables an Index Only Scan for: SELECT name, role FROM users WHERE email = $1.",
      difficulty: "hard",
      order_index: 5,
    },
    {
      question_text: "Why is over-indexing harmful to database performance?",
      question_type: "multiple_choice",
      options: [
        "Too many indexes cause PostgreSQL to crash",
        "Indexes only help SELECT queries — each index must be updated on every INSERT, UPDATE, and DELETE, slowing down write operations",
        "PostgreSQL can only use one index per query, so extra indexes are wasted",
        "Indexes consume all available RAM and prevent query caching"
      ],
      correct_answer: "Indexes only help SELECT queries — each index must be updated on every INSERT, UPDATE, and DELETE, slowing down write operations",
      explanation: "Every index is a separate data structure that must be maintained. When you INSERT a row, every index on that table must be updated. When you UPDATE a column, every index containing that column must be updated. With 10 indexes on a table, a single INSERT triggers 10 additional writes. Additionally, indexes consume disk space and memory. The goal is to have exactly the indexes your queries need — no more, no fewer.",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text: "In a Cache-Aside pattern, what happens on a cache miss?",
      question_type: "multiple_choice",
      options: [
        "The application returns an error to the user",
        "The cache automatically queries the database and populates itself",
        "The application queries the database, returns the result, and stores it in the cache for future requests",
        "The request is redirected to a secondary database replica"
      ],
      correct_answer: "The application queries the database, returns the result, and stores it in the cache for future requests",
      explanation: "In the Cache-Aside (Lazy Loading) pattern: (1) Application checks the cache first; (2) On a cache hit, return cached data; (3) On a cache miss, query the database; (4) Store the result in cache with a TTL; (5) Return the result. The application manages the cache explicitly — unlike Write-Through where the cache is populated on writes. Cache-Aside is the most common caching pattern because it's simple, only caches data that's actually requested, and handles cache failures gracefully (falls back to database).",
      difficulty: "medium",
      order_index: 7,
    },
    {
      question_text: "What is a 'cache stampede' and how can you prevent it?",
      question_type: "multiple_choice",
      options: [
        "When the cache grows too large and starts evicting entries — prevented by increasing cache memory",
        "When a popular cached item expires and hundreds of concurrent requests all query the database simultaneously — prevented by using a lock so only one request fetches the data",
        "When cache keys collide due to poor hashing — prevented by using longer key names",
        "When the cache server crashes under load — prevented by using a cluster"
      ],
      correct_answer: "When a popular cached item expires and hundreds of concurrent requests all query the database simultaneously — prevented by using a lock so only one request fetches the data",
      explanation: "A cache stampede (also called 'thundering herd') occurs when a hot cache key expires and many concurrent requests simultaneously discover the cache miss, all querying the database for the same data. This can overwhelm the database. Prevention strategies include: (1) Locking — only one request fetches while others wait; (2) Probabilistic early expiration — randomly refresh before actual expiry; (3) 'Never expire' + background refresh — a background job refreshes the cache periodically.",
      difficulty: "hard",
      order_index: 8,
    },
  ],
};

export default quiz;
