// ============================================================================
// Database Integration — Content (Enhanced)
// ============================================================================

export const topic = {
  "name": "Database Integration",
  "slug": "database-integration",
  "description": "Master SQL databases with Node.js — PostgreSQL queries, connection pooling, migrations, ORMs, and query optimization for production-grade applications.",
  "estimated_time": 360,
  "order_index": 4
};

export const lessons = [
  // ---------------------------------------------------------------------------
  // Lesson 1 — PostgreSQL with Node.js
  // ---------------------------------------------------------------------------
  {
    title: "PostgreSQL with Node.js",
    slug: "postgresql-node",
    summary: "Connect to PostgreSQL using the pg library, run parameterized queries, manage connection pools, and handle transactions safely.",
    difficulty_level: "intermediate",
    estimated_time: 50,
    order_index: 1,
    key_points: [
      "Use the pg library (node-postgres) for PostgreSQL connections",
      "Connection pools manage multiple connections efficiently",
      "Always use parameterized queries ($1, $2) to prevent SQL injection",
      "Transactions ensure atomicity for multi-step operations",
      "Use RETURNING * to get inserted/updated rows back",
      "Handle pool errors and connection timeouts gracefully",
      "Use the Repository pattern to abstract database access"
    ],
    content: `# PostgreSQL with Node.js

## What Is PostgreSQL?

**PostgreSQL** (often called "Postgres") is a powerful, open-source **object-relational database system** with over 35 years of active development. It is renowned for reliability, feature richness, and performance.

> **Real-world analogy:** Think of PostgreSQL as a highly organized filing cabinet. Each drawer is a **table**, each folder is a **row**, and each label on a folder is a **column**. The filing cabinet clerk (the database engine) can find, add, remove, or rearrange folders incredibly fast — even when thousands of people are asking at the same time.

### Why PostgreSQL for Node.js?

| Feature | PostgreSQL | MySQL | SQLite |
|---------|-----------|-------|--------|
| ACID compliance | Full | Full (InnoDB) | Full |
| JSON support | Native JSONB | JSON type | Text only |
| Full-text search | Built-in | Built-in | Extension |
| Concurrent writes | MVCC | Lock-based | File-lock |
| Best for | Web apps, analytics | Web apps, CMS | Embedded, dev |
| Node.js library | pg | mysql2 | better-sqlite3 |

---

## The pg Library (node-postgres)

The **pg** library is the standard PostgreSQL client for Node.js. It provides:

- **Pool** — a connection pool for efficient multi-request handling
- **Client** — a single connection for transactional work
- **Parameterized queries** — protection against SQL injection
- **Notification/listen** — real-time event support via LISTEN/NOTIFY

### Installation

\`\`\`bash
npm install pg
\`\`\`

---

## Setting Up a Connection Pool

A **connection pool** pre-creates a set of database connections and reuses them across requests. Without pooling, every HTTP request would open and close a connection — extremely wasteful.

> **Real-world analogy:** A connection pool is like a taxi stand at an airport. Instead of calling a new taxi for every passenger (opening a new connection), a fleet of taxis waits at the stand and passengers (requests) hop into the next available one. When the ride is done, the taxi returns to the stand — not scrapped.

### Pool Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| \`max\` | 10 | Maximum number of connections in the pool |
| \`min\` | 0 | Minimum idle connections to keep open |
| \`idleTimeoutMillis\` | 10000 | How long a connection can sit idle before being closed |
| \`connectionTimeoutMillis\` | 0 | Max time to wait for a connection (0 = no timeout) |
| \`allowExitOnIdle\` | false | Allow the Node process to exit when pool is idle |

\`\`\`javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'myapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  max: 20,                        // max connections in pool
  min: 2,                         // keep at least 2 idle connections
  idleTimeoutMillis: 30000,       // close idle connections after 30s
  connectionTimeoutMillis: 5000,  // fail if no connection within 5s
  allowExitOnIdle: true,          // let process exit when idle
});

// Always handle pool-level errors
pool.on('error', (err, client) => {
  console.error('Unexpected idle client error:', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing pool...');
  await pool.end();
  process.exit(0);
});

export default pool;
\`\`\`

### When to Use Pool vs Client

| Use Case | Use |
|----------|-----|
| Simple queries in request handlers | \`pool.query()\` |
| Transactions (multi-step operations) | \`pool.connect()\` → \`client\` |
| Long-running admin scripts | Dedicated \`new Client()\` |
| Background workers | Separate pool with lower \`max\` |

---

## Parameterized Queries

Parameterized queries separate SQL code from user-supplied data. The database treats parameters as **data only**, never as executable SQL.

### Why Parameterized Queries Matter

\`\`\`javascript
// ✅ SAFE — parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1 AND active = $2',
  [email, true]
);
console.log(result.rows); // Array of matching rows

// ❌ NEVER do this — SQL injection vulnerability!
const result = await pool.query(
  \\\`SELECT * FROM users WHERE email = '\${email}'\\\`
);
// If email = "'; DROP TABLE users; --" the table is GONE
\`\`\`

### Query Result Object

The \`result\` object returned by \`pool.query()\` contains:

| Property | Type | Description |
|----------|------|-------------|
| \`rows\` | Array | The returned rows |
| \`rowCount\` | Number | Number of affected rows (INSERT/UPDATE/DELETE) |
| \`fields\` | Array | Column metadata (name, dataTypeID, etc.) |
| \`command\` | String | The SQL command executed (SELECT, INSERT, etc.) |

---

## Transactions

A **transaction** groups multiple SQL statements into a single atomic unit. Either **all succeed** (COMMIT) or **all fail** (ROLLBACK).

### ACID Properties

| Property | Meaning | Example |
|----------|---------|---------|
| **Atomicity** | All or nothing | Transfer debits AND credits, or neither |
| **Consistency** | Data stays valid | Balance never goes negative if constrained |
| **Isolation** | Concurrent txns don't interfere | Two transfers don't see partial state |
| **Durability** | Committed data survives crashes | Power loss after COMMIT — data safe |

> **Real-world analogy:** A transaction is like a bank wire transfer. The money leaves your account AND arrives in the recipient's account — or neither happens. You'd never want the money to leave but not arrive.

\`\`\`javascript
async function transferFunds(fromId, toId, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Step 1: Debit sender (with balance check)
    const debit = await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING *',
      [amount, fromId]
    );
    if (debit.rows.length === 0) {
      throw new Error('Insufficient funds or account not found');
    }

    // Step 2: Credit receiver
    const credit = await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2 RETURNING *',
      [amount, toId]
    );
    if (credit.rows.length === 0) {
      throw new Error('Recipient account not found');
    }

    // Step 3: Log the transaction
    await client.query(
      'INSERT INTO transfers (from_id, to_id, amount, transferred_at) VALUES ($1, $2, $3, NOW())',
      [fromId, toId, amount]
    );

    await client.query('COMMIT');
    return { success: true, from: debit.rows[0], to: credit.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release(); // ALWAYS release back to pool
  }
}
\`\`\`

### Transaction Isolation Levels

PostgreSQL supports four isolation levels (set with \`SET TRANSACTION ISOLATION LEVEL\`):

| Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads | Use Case |
|-------|-------------|---------------------|---------------|----------|
| READ UNCOMMITTED | Possible* | Possible | Possible | Almost never used |
| READ COMMITTED (default) | No | Possible | Possible | Most web apps |
| REPEATABLE READ | No | No | Possible | Financial reports |
| SERIALIZABLE | No | No | No | Critical financial ops |

*PostgreSQL treats READ UNCOMMITTED as READ COMMITTED.

---

## Common Query Patterns

### Upsert (INSERT ... ON CONFLICT)

\`\`\`javascript
// Insert or update if the key already exists
await pool.query(\\\`
  INSERT INTO settings (user_id, key, value)
  VALUES ($1, $2, $3)
  ON CONFLICT (user_id, key)
  DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
\\\`, [userId, key, value]);
\`\`\`

### Batch Insert

\`\`\`javascript
// Insert multiple rows efficiently
const users = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Carol', email: 'carol@example.com' },
];

const values = users.map((_, i) => \\\`($\${i * 2 + 1}, $\${i * 2 + 2})\\\`).join(', ');
const params = users.flatMap(u => [u.name, u.email]);

const { rows } = await pool.query(
  \\\`INSERT INTO users (name, email) VALUES \${values} RETURNING *\\\`,
  params
);
\`\`\`

### Pagination with Total Count

\`\`\`javascript
async function getUsers({ page = 1, limit = 20, search = '' }) {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = '';

  if (search) {
    params.push(\\\`%\${search}%\\\`);
    whereClause = \\\`WHERE name ILIKE $\${params.length} OR email ILIKE $\${params.length}\\\`;
  }

  // Get total count and page data in one round-trip
  params.push(limit, offset);
  const query = \\\`
    WITH filtered AS (
      SELECT * FROM users \${whereClause}
    )
    SELECT
      (SELECT COUNT(*) FROM filtered) AS total_count,
      f.*
    FROM filtered f
    ORDER BY created_at DESC
    LIMIT $\${params.length - 1} OFFSET $\${params.length}
  \\\`;

  const { rows } = await pool.query(query, params);
  const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

  return {
    data: rows.map(({ total_count, ...user }) => user),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    },
  };
}
\`\`\`

---

## Best Practices

1. **Always use parameterized queries** — never concatenate user input into SQL strings
2. **Always release clients** — use \`finally { client.release() }\` after transactions
3. **Set connection timeouts** — prevent hanging connections from crashing your app
4. **Handle pool errors** — attach a listener to \`pool.on('error')\`
5. **Use RETURNING** — avoid a second SELECT after INSERT/UPDATE
6. **Limit pool size** — typical production value is 10–25; too many connections hurt performance
7. **Use environment variables** — never hard-code credentials

## Common Pitfalls

- **Forgetting to release clients** → pool is exhausted, app hangs
- **String interpolation in queries** → SQL injection vulnerability
- **No error handling on pool** → unhandled exceptions crash the process
- **Opening too many connections** → exceeds PostgreSQL \`max_connections\` (default 100)
- **Not using transactions** for multi-step writes → inconsistent data on failure
`,
  },

  // ---------------------------------------------------------------------------
  // Lesson 2 — Database Migrations & Schema Management
  // ---------------------------------------------------------------------------
  {
    title: "Database Migrations & Schema Management",
    slug: "migrations-schema",
    summary: "Version-control your database schema with migrations, design robust schemas, and keep all environments in sync.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 2,
    key_points: [
      "Migrations are versioned scripts that evolve the database schema",
      "Each migration has an UP (apply) and DOWN (revert) function",
      "Never modify production schema directly — always use migrations",
      "Tools like knex, node-pg-migrate, or Prisma automate migrations",
      "Seed scripts populate initial or test data",
      "Schema design decisions have long-term performance implications",
      "Use UUIDs for public-facing IDs, sequential integers for internal FKs"
    ],
    content: `# Database Migrations & Schema Management

## What Are Migrations?

**Database migrations** are versioned scripts that incrementally change your database schema (tables, columns, indexes, constraints). They serve as **version control for your database** — just like Git tracks changes to code, migrations track changes to structure.

> **Real-world analogy:** Imagine a building under construction. Each migration is a **blueprint revision**. Revision 001 lays the foundation (creates tables). Revision 002 adds a second floor (adds columns). Revision 003 installs plumbing (adds indexes). You can replay every revision to rebuild the building from scratch, or roll back the last revision to undo it.

### Why Not Just Edit the Schema Manually?

| Approach | Dev | Staging | Production | Collaboration |
|----------|-----|---------|------------|---------------|
| Manual SQL edits | Works | Error-prone | Dangerous | Conflicts |
| Migrations | Works | Automated | Safe & auditable | Merge-friendly |

---

## Migration Anatomy: UP and DOWN

Every migration has two functions:

- **UP** — applies the change (create table, add column, create index)
- **DOWN** — reverses the change (drop table, remove column, drop index)

\`\`\`javascript
// migrations/001_create_users.js
export const up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(50)', notNull: true, default: "'user'" },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');
};

export const down = (pgm) => {
  pgm.dropTable('users');
};
\`\`\`

### Migration File Naming Conventions

| Convention | Example | Pro | Con |
|-----------|---------|-----|-----|
| Sequential numbers | 001_create_users.js | Simple ordering | Merge conflicts on number |
| Timestamps | 20260215120000_create_users.js | No conflicts | Long names |
| Date + description | 2026-02-15_create-users.js | Readable | Needs strict format |

---

## Migration Tools Comparison

| Tool | Type | Pros | Cons |
|------|------|------|------|
| **node-pg-migrate** | SQL/JS migrations | Lightweight, PostgreSQL-native | PG only |
| **Knex.js** | Query builder + migrations | Multi-DB, fluent API | Adds abstraction layer |
| **Prisma Migrate** | ORM-integrated | Type-safe, auto-generates | Opinionated, heavier |
| **Flyway** | SQL-only | Language-agnostic | Java-based runner |
| **TypeORM** | ORM-integrated | Decorator-based | Complex configuration |

### When to Use Each

- **node-pg-migrate**: Pure PostgreSQL projects, maximum control
- **Knex.js**: Projects that might switch databases, prefer JS over SQL
- **Prisma Migrate**: TypeScript projects using Prisma ORM
- **Raw SQL files**: Simple projects, full control, no dependencies

---

## Migration Best Practices

### DO ✅

1. **One change per migration** — don't combine unrelated changes
2. **Make migrations idempotent** — use \`IF NOT EXISTS\`, \`IF EXISTS\`
3. **Always write DOWN migrations** — you'll need rollbacks
4. **Test migrations** on a copy of production data before deploying
5. **Run migrations in CI/CD** — automate schema changes in your pipeline
6. **Use transactions** — wrap DDL in BEGIN/COMMIT (PostgreSQL supports transactional DDL)

### DON'T ❌

1. **Never edit an already-applied migration** — create a new migration instead
2. **Never delete migration files** — they're your schema history
3. **Never run raw DDL on production** — always go through migrations
4. **Avoid destructive changes** without a plan — dropping columns loses data
5. **Don't skip environments** — always run on dev → staging → production

---

## Schema Design Best Practices

### Data Types — Choose Wisely

| Need | Best Type | Avoid |
|------|-----------|-------|
| Primary key (internal) | SERIAL / BIGSERIAL | UUID (slower joins) |
| Primary key (public) | UUID | SERIAL (guessable) |
| Short text (name, email) | VARCHAR(n) | TEXT (no length check) |
| Long text (body, bio) | TEXT | VARCHAR(10000) |
| Money | NUMERIC(12,2) | FLOAT (rounding errors!) |
| Boolean | BOOLEAN | INTEGER 0/1 |
| Timestamps | TIMESTAMPTZ | TIMESTAMP (no timezone!) |
| Structured data | JSONB | JSON (no indexing) |

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case plural | \`user_profiles\` |
| Columns | snake_case | \`created_at\` |
| Primary keys | \`id\` | \`id\` |
| Foreign keys | \`<table_singular>_id\` | \`user_id\` |
| Indexes | \`idx_<table>_<columns>\` | \`idx_users_email\` |
| Constraints | \`chk_<table>_<rule>\` | \`chk_orders_positive_total\` |

### Well-Structured Schema Example

\`\`\`sql
-- Users table with proper types and constraints
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'moderator')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts table with foreign key and constraints
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status) WHERE status = 'published';
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC)
  WHERE status = 'published';

-- Auto-update updated_at with a trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
\`\`\`

---

## Seed Scripts

**Seeds** populate tables with initial or test data. They're separate from migrations.

\`\`\`javascript
// seeds/001_seed_users.js
export async function seed(pool) {
  await pool.query('DELETE FROM users'); // Clear existing test data

  const users = [
    { name: 'Admin', email: 'admin@example.com', role: 'admin' },
    { name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
    { name: 'Bob Smith', email: 'bob@example.com', role: 'moderator' },
  ];

  for (const u of users) {
    await pool.query(
      \\\`INSERT INTO users (name, email, role, password_hash)
       VALUES ($1, $2, $3, $4)\\\`,
      [u.name, u.email, u.role, '$2b$10$hashedplaceholder']
    );
  }

  console.log(\\\`Seeded \${users.length} users\\\`);
}
\`\`\`

### Seeds vs Migrations

| Aspect | Migrations | Seeds |
|--------|-----------|-------|
| Purpose | Schema changes | Test / initial data |
| Idempotent? | Must be | Should be |
| Run in production? | Always | Rarely (only for reference data) |
| Reversible? | Yes (DOWN) | Usually not |

---

## Common Pitfalls

- **Not using TIMESTAMPTZ** — \`TIMESTAMP\` stores no timezone info; use \`TIMESTAMPTZ\` always
- **FLOAT for money** — use \`NUMERIC(12,2)\` to avoid rounding errors
- **Missing indexes on foreign keys** — PostgreSQL doesn't auto-index FK columns
- **Overly wide VARCHAR** — \`VARCHAR(10000)\` is wasteful; use \`TEXT\` for unbounded strings
- **Editing old migrations** — downstream environments won't pick up the change; create a new migration
`,
  },

  // ---------------------------------------------------------------------------
  // Lesson 3 — ORM Integration (Sequelize & Prisma)
  // ---------------------------------------------------------------------------
  {
    title: "ORM Integration with Sequelize & Prisma",
    slug: "orm-integration",
    summary: "Understand Object-Relational Mappers, compare raw SQL vs query builders vs ORMs, and use Sequelize and Prisma in Node.js projects.",
    difficulty_level: "intermediate",
    estimated_time: 50,
    order_index: 3,
    key_points: [
      "ORMs map database tables to JavaScript/TypeScript objects",
      "Sequelize is a mature, callback/promise-based ORM for Node.js",
      "Prisma uses a schema-first approach with auto-generated type-safe client",
      "ORMs trade performance for developer productivity",
      "The N+1 problem is the most common ORM performance issue",
      "Use raw SQL for complex queries even when using an ORM",
      "Choose the right abstraction level for your project complexity"
    ],
    content: `# ORM Integration with Sequelize & Prisma

## What Is an ORM?

An **Object-Relational Mapper (ORM)** bridges the gap between relational databases (tables, rows, SQL) and object-oriented programming (classes, instances, methods). Instead of writing SQL, you interact with database records as JavaScript objects.

> **Real-world analogy:** An ORM is like a **translator** between two people who speak different languages. Your JavaScript code "speaks" objects and methods. The database "speaks" SQL. The ORM translates between them so each side understands the other — but sometimes subtlety is lost in translation.

---

## Database Access Abstraction Levels

| Level | Tool | Example | Control | Productivity |
|-------|------|---------|---------|-------------|
| **Raw SQL** | pg, mysql2 | \`SELECT * FROM users WHERE id = $1\` | Maximum | Low |
| **Query Builder** | Knex.js | \`knex('users').where({ id })\` | High | Medium |
| **ORM** | Sequelize, TypeORM | \`User.findByPk(id)\` | Medium | High |
| **Schema-First ORM** | Prisma | \`prisma.user.findUnique({ where: { id } })\` | Medium | Very High |

### When to Use Each

| Scenario | Best Choice | Why |
|----------|------------|-----|
| Simple CRUD app | ORM (Prisma/Sequelize) | Fast development, less boilerplate |
| Complex reporting queries | Raw SQL | Full control over joins, CTEs, window functions |
| Multi-database project | Query Builder (Knex) | Abstracts dialect differences |
| High-performance critical path | Raw SQL | No ORM overhead |
| TypeScript project | Prisma | Best type-safety and DX |
| Legacy project with existing DB | Sequelize | Good introspection, flexible |
| Microservice with few tables | Raw SQL or Knex | ORM is overkill |

---

## Sequelize

**Sequelize** is a promise-based ORM for Node.js supporting PostgreSQL, MySQL, MariaDB, SQLite, and MS SQL Server.

### Setup

\`\`\`javascript
import { Sequelize, DataTypes, Model } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  }
);
\`\`\`

### Defining Models

\`\`\`javascript
class User extends Model {}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash', // Maps JS camelCase to DB snake_case
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  underscored: true,   // auto snake_case for all fields
  timestamps: true,     // adds created_at, updated_at
  paranoid: true,       // adds deleted_at for soft deletes
});
\`\`\`

### Associations

\`\`\`javascript
// One-to-Many: User has many Posts
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Many-to-Many: Posts have Tags through PostTags
Post.belongsToMany(Tag, { through: 'post_tags', as: 'tags' });
Tag.belongsToMany(Post, { through: 'post_tags', as: 'posts' });
\`\`\`

### CRUD Operations

\`\`\`javascript
// CREATE
const user = await User.create({
  name: 'Alice',
  email: 'alice@example.com',
  passwordHash: hashedPassword,
});

// READ (with association)
const userWithPosts = await User.findByPk(userId, {
  include: [{ model: Post, as: 'posts', limit: 10 }],
});

// UPDATE
await User.update(
  { name: 'Alice Updated' },
  { where: { id: userId } }
);

// DELETE (soft delete with paranoid: true)
await User.destroy({ where: { id: userId } });

// QUERY with conditions
const admins = await User.findAll({
  where: {
    role: 'admin',
    isActive: true,
  },
  order: [['createdAt', 'DESC']],
  limit: 20,
  offset: 0,
});
\`\`\`

---

## Prisma

**Prisma** is a next-generation ORM that takes a schema-first approach. You define your schema in a \`.prisma\` file, and Prisma generates a type-safe client.

### Schema Definition (schema.prisma)

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         Role     @default(USER)
  isActive     Boolean  @default(true) @map("is_active")
  posts        Post[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Post {
  id          String     @id @default(uuid())
  title       String
  slug        String     @unique
  content     String
  status      PostStatus @default(DRAFT)
  author      User       @relation(fields: [authorId], references: [id])
  authorId    String     @map("author_id")
  publishedAt DateTime?  @map("published_at")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  @@index([authorId])
  @@index([status])
  @@map("posts")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
\`\`\`

### CRUD Operations with Prisma Client

\`\`\`javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// CREATE
const user = await prisma.user.create({
  data: {
    name: 'Alice',
    email: 'alice@example.com',
    passwordHash: hashedPassword,
  },
});

// READ with relations
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: { take: 10, orderBy: { createdAt: 'desc' } } },
});

// UPDATE
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'Alice Updated' },
});

// DELETE
await prisma.user.delete({ where: { id: userId } });

// Complex query
const publishedPosts = await prisma.post.findMany({
  where: {
    status: 'PUBLISHED',
    author: { role: 'ADMIN' },
  },
  include: { author: { select: { name: true, email: true } } },
  orderBy: { publishedAt: 'desc' },
  take: 20,
  skip: 0,
});
\`\`\`

---

## Sequelize vs Prisma Comparison

| Feature | Sequelize | Prisma |
|---------|-----------|--------|
| Schema definition | JavaScript code | .prisma file |
| Type safety | Manual / TS decorators | Auto-generated types |
| Migrations | CLI-generated | CLI-generated |
| Raw SQL | \`sequelize.query()\` | \`prisma.$queryRaw\` |
| Transactions | \`sequelize.transaction()\` | \`prisma.$transaction()\` |
| Relations | Defined in JS | Defined in schema |
| Learning curve | Moderate | Lower |
| Maturity | 10+ years | 5+ years |
| Multi-DB support | 5 databases | PostgreSQL, MySQL, SQLite, MongoDB, SQL Server |

---

## The N+1 Problem

The most common ORM performance issue. It occurs when you fetch a list of records, then make a separate query for each record's association.

\`\`\`javascript
// ❌ N+1 problem — 1 query for posts + N queries for authors
const posts = await Post.findAll();
for (const post of posts) {
  const author = await User.findByPk(post.authorId); // N queries!
  console.log(post.title, author.name);
}

// ✅ Eager loading — 2 queries total (1 for posts, 1 for authors)
const posts = await Post.findAll({
  include: [{ model: User, as: 'author' }],
});
posts.forEach(p => console.log(p.title, p.author.name));

// ✅ Prisma — also eager loads
const posts = await prisma.post.findMany({
  include: { author: true },
});
\`\`\`

---

## When NOT to Use an ORM

- **Complex analytical queries** — CTEs, window functions, recursive queries
- **Bulk data operations** — COPY, large batch inserts
- **Database-specific features** — PostgreSQL arrays, full-text search, LISTEN/NOTIFY
- **Performance-critical paths** — the ORM adds ~5-15% overhead per query
- **Very simple projects** — an ORM adds complexity for 2-3 tables

---

## Best Practices

1. **Enable query logging in development** — see the actual SQL being generated
2. **Use eager loading** to prevent N+1 queries
3. **Use raw SQL for complex queries** — don't fight the ORM
4. **Define indexes in your schema** — ORMs often don't auto-index FK columns
5. **Use transactions** for multi-step mutations
6. **Validate at the model level** — catch bad data before it hits the database
7. **Use connection pooling** — both Sequelize and Prisma support pool configuration

## Common Pitfalls

- **Over-fetching** — selecting all columns when you only need 2-3
- **N+1 queries** — forgetting \`include\` / eager loading
- **Trusting ORM migrations blindly** — always review generated SQL
- **Not indexing foreign keys** — ORMs create FKs but not always indexes
- **Ignoring generated SQL** — the ORM might generate inefficient queries
`,
  },

  // ---------------------------------------------------------------------------
  // Lesson 4 — Query Optimization & Indexing
  // ---------------------------------------------------------------------------
  {
    title: "Query Optimization & Indexing",
    slug: "query-optimization",
    summary: "Learn to analyze query performance with EXPLAIN, choose the right index types, avoid common anti-patterns, and implement caching strategies.",
    difficulty_level: "intermediate",
    estimated_time: 45,
    order_index: 4,
    key_points: [
      "EXPLAIN ANALYZE reveals how PostgreSQL executes a query",
      "B-tree indexes are the default and work for most cases",
      "Composite indexes must match the query's column order (leftmost prefix rule)",
      "Partial indexes reduce index size by filtering rows",
      "Covering indexes include all needed columns to avoid table lookups",
      "Over-indexing slows down writes — every INSERT/UPDATE must update all indexes",
      "Connection pooling and caching are essential for production performance"
    ],
    content: `# Query Optimization & Indexing

## Why Query Optimization Matters

A single slow query can bring down an entire application. As data grows from thousands to millions of rows, unoptimized queries go from "fast enough" to "app is down."

> **Real-world analogy:** Imagine a library with 1 million books. Without a catalog (index), finding a specific book means checking every single shelf — a **full table scan**. With a catalog organized by author and title (a composite index), you go straight to the right shelf. But maintaining catalogs has a cost — every time a new book arrives, all catalogs must be updated.

---

## EXPLAIN ANALYZE

The most important tool for understanding query performance. It shows the **query plan** — how PostgreSQL will (or did) execute a query.

\`\`\`sql
-- Plan only (estimate)
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';

-- Plan + actual execution (run the query)
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';

-- With all details
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM users WHERE email = 'alice@example.com';
\`\`\`

### Reading EXPLAIN Output

\`\`\`
Seq Scan on users  (cost=0.00..35.50 rows=1 width=540) (actual time=0.250..0.350 rows=1 loops=1)
  Filter: (email = 'alice@example.com'::text)
  Rows Removed by Filter: 999
Planning Time: 0.080 ms
Execution Time: 0.420 ms
\`\`\`

| Term | Meaning |
|------|---------|
| **Seq Scan** | Full table scan (reads every row) — usually bad for large tables |
| **Index Scan** | Uses an index to find rows — efficient |
| **Index Only Scan** | Reads data directly from the index — fastest |
| **Bitmap Index Scan** | Uses index to build a bitmap, then scans matching pages — good for many matches |
| **cost** | Estimated relative cost (startup..total) |
| **rows** | Estimated number of rows returned |
| **actual time** | Real wall-clock time in milliseconds |
| **Rows Removed by Filter** | Rows read but discarded — indicates missing index |

### Key Indicators of Problems

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Seq Scan on large table | Missing index | Add appropriate index |
| High "Rows Removed by Filter" | Index not selective enough | Better index or partial index |
| Nested Loop with Seq Scan inside | Missing join index | Add index on join column |
| Sort with high cost | Missing index for ORDER BY | Add index matching sort order |
| Hash Join with high memory | Large join without index | Add index or restructure query |

---

## Index Types in PostgreSQL

### B-tree (Default)

The workhorse index. Works for equality (\`=\`), range (\`<\`, \`>\`, \`BETWEEN\`), sorting (\`ORDER BY\`), and prefix matching (\`LIKE 'abc%'\`).

\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
\`\`\`

### Hash

Only for equality comparisons. Slightly faster than B-tree for \`=\` but doesn't support range or sorting.

\`\`\`sql
CREATE INDEX idx_sessions_token ON sessions USING hash(token);
\`\`\`

### GIN (Generalized Inverted Index)

For multi-valued columns: arrays, JSONB, full-text search.

\`\`\`sql
-- JSONB indexing
CREATE INDEX idx_products_metadata ON products USING gin(metadata);

-- Full-text search
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));

-- Array containment
CREATE INDEX idx_posts_tags ON posts USING gin(tags);
\`\`\`

### GiST (Generalized Search Tree)

For geometric data, ranges, nearest-neighbor searches.

\`\`\`sql
-- Range types
CREATE INDEX idx_reservations_dates ON reservations USING gist(date_range);

-- PostGIS geometric data
CREATE INDEX idx_locations_coords ON locations USING gist(coordinates);
\`\`\`

### Index Type Comparison

| Index Type | Equality | Range | Sort | Multi-value | Size |
|-----------|----------|-------|------|------------|------|
| B-tree | ✅ | ✅ | ✅ | ❌ | Medium |
| Hash | ✅ | ❌ | ❌ | ❌ | Small |
| GIN | ✅ | ❌ | ❌ | ✅ | Large |
| GiST | ✅ | ✅ | ❌ | ✅ | Medium |

---

## Composite Indexes & the Leftmost Prefix Rule

A composite index covers **multiple columns**. PostgreSQL can use the index for any **leftmost prefix** of the indexed columns.

\`\`\`sql
CREATE INDEX idx_orders_user_status_date ON orders(user_id, status, created_at);
\`\`\`

This single index serves queries on:

| Query Filter | Uses Index? | Why |
|-------------|-------------|-----|
| \`WHERE user_id = 1\` | ✅ | Leftmost column |
| \`WHERE user_id = 1 AND status = 'active'\` | ✅ | First two columns |
| \`WHERE user_id = 1 AND status = 'active' AND created_at > '2025-01-01'\` | ✅ | All three columns |
| \`WHERE status = 'active'\` | ❌ | Skips leftmost column |
| \`WHERE created_at > '2025-01-01'\` | ❌ | Skips first two columns |

**Rule of thumb:** Put the most selective (fewest matching rows) column first, then equality columns before range columns.

---

## Partial Indexes

A partial index only indexes rows matching a condition. Smaller index = faster lookups + less storage.

\`\`\`sql
-- Only index active users (most queries filter by active = true)
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = true;

-- Only index published posts
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE status = 'published';

-- Only index non-null values
CREATE INDEX idx_users_last_login ON users(last_login_at) WHERE last_login_at IS NOT NULL;
\`\`\`

---

## Covering Indexes (INCLUDE)

A covering index includes additional columns so PostgreSQL can answer the query **entirely from the index** without reading the table (Index Only Scan).

\`\`\`sql
-- The query needs email, name, and role
-- INCLUDE stores name and role in the index leaf pages
CREATE INDEX idx_users_email_covering ON users(email) INCLUDE (name, role);

-- Now this query uses Index Only Scan (no table access):
SELECT email, name, role FROM users WHERE email = 'alice@example.com';
\`\`\`

---

## Common Query Anti-Patterns

### 1. Functions on Indexed Columns

\`\`\`sql
-- ❌ Index on email is NOT used (function wraps the column)
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- ✅ Fix: create an expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
-- Or fix in application: always store lowercase emails
\`\`\`

### 2. Implicit Type Casting

\`\`\`sql
-- ❌ If user_id is INTEGER, this forces a cast — no index used
SELECT * FROM orders WHERE user_id = '123';

-- ✅ Use the correct type
SELECT * FROM orders WHERE user_id = 123;
\`\`\`

### 3. LIKE with Leading Wildcard

\`\`\`sql
-- ❌ No index can help with leading wildcard
SELECT * FROM products WHERE name LIKE '%widget%';

-- ✅ Use full-text search instead
SELECT * FROM products WHERE to_tsvector('english', name) @@ to_tsquery('widget');
\`\`\`

### 4. SELECT *

\`\`\`sql
-- ❌ Fetches all columns — prevents Index Only Scan, wastes bandwidth
SELECT * FROM users WHERE id = $1;

-- ✅ Select only what you need
SELECT id, name, email, role FROM users WHERE id = $1;
\`\`\`

### 5. Missing LIMIT

\`\`\`sql
-- ❌ Could return millions of rows
SELECT * FROM logs WHERE level = 'error';

-- ✅ Always limit result sets
SELECT * FROM logs WHERE level = 'error' ORDER BY created_at DESC LIMIT 100;
\`\`\`

---

## Connection Pooling Strategies

### Application-Level Pooling (pg Pool)

Built into the pg library. Each Node.js process manages its own pool.

\`\`\`javascript
const pool = new Pool({ max: 20 }); // 20 connections per process
\`\`\`

### External Pooling (PgBouncer)

A lightweight connection pooler that sits between the app and PostgreSQL. Essential for serverless or high-concurrency environments.

| Mode | Description | Best For |
|------|-------------|----------|
| Session | One server connection per client session | Long transactions |
| Transaction | Connection returned after each transaction | Most web apps |
| Statement | Connection returned after each statement | Simple queries |

### Sizing Guidelines

| Factor | Guideline |
|--------|-----------|
| Pool max per process | 10-25 connections |
| Total across all processes | < PostgreSQL \`max_connections\` (default 100) |
| Serverless (Lambda, etc.) | Use PgBouncer or RDS Proxy |
| Formula | max = (core_count * 2) + effective_spindle_count |

---

## Caching Strategies

### Application-Level Cache (Redis / In-Memory)

\`\`\`javascript
import Redis from 'ioredis';
const redis = new Redis();

async function getUserCached(id) {
  const cacheKey = \\\`user:\${id}\\\`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss — query database
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  const user = rows[0];

  if (user) {
    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
  }

  return user;
}

// Invalidate on update
async function updateUser(id, data) {
  await pool.query('UPDATE users SET name = $1 WHERE id = $2', [data.name, id]);
  await redis.del(\\\`user:\${id}\\\`); // Invalidate cache
}
\`\`\`

### Cache Invalidation Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| **TTL (Time to Live)** | Expires after N seconds | Read-heavy, eventual consistency OK |
| **Write-through** | Update cache on every write | Strong consistency needed |
| **Write-behind** | Batch cache updates | High write throughput |
| **Cache-aside** | App manages cache manually | Most common pattern |

---

## Best Practices

1. **Measure before optimizing** — use EXPLAIN ANALYZE, don't guess
2. **Index columns in WHERE, JOIN, ORDER BY** — but don't over-index
3. **Use partial indexes** for frequently filtered subsets
4. **Prefer covering indexes** for hot queries
5. **Monitor slow queries** — enable \`log_min_duration_statement\` in PostgreSQL
6. **Use connection pooling** — PgBouncer for high concurrency
7. **Cache hot data** — Redis for frequently accessed, rarely changing data
8. **Avoid SELECT *** — fetch only the columns you need

## Common Pitfalls

- **Over-indexing** — every index slows down INSERT/UPDATE and uses storage
- **Ignoring EXPLAIN output** — the planner knows things you don't
- **Caching without invalidation** — stale data causes subtle bugs
- **Premature optimization** — profile first, optimize second
- **Not vacuuming** — PostgreSQL needs VACUUM to reclaim dead row space
`,
  },
];
