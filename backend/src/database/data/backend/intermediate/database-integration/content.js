// ============================================================================
// Database Integration — Content
// ============================================================================

export const topic = {
  "name": "Database Integration",
  "slug": "database-integration",
  "description": "Master SQL databases with Node.js — PostgreSQL queries, connection pooling, migrations, and ORMs.",
  "estimated_time": 200,
  "order_index": 4
};

export const lessons = [
  {
    title: "PostgreSQL with Node.js",
    slug: "postgresql-node",
    summary: "Connect to PostgreSQL using the pg library, run parameterized queries, and manage connection pools.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "Use the pg library (node-postgres) for PostgreSQL connections",
  "Connection pools manage multiple connections efficiently",
  "Always use parameterized queries ($1, $2) to prevent SQL injection",
  "Transactions ensure atomicity for multi-step operations",
  "Use RETURNING * to get inserted/updated rows back"
],
    content: `# PostgreSQL with Node.js

## Setting Up a Connection Pool

\`\`\`javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'myapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  max: 20,            // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

export default pool;
\`\`\`

## Parameterized Queries

\`\`\`javascript
// ✅ Safe — parameterized
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1 AND active = $2',
  [email, true]
);

// ❌ NEVER do this — SQL injection!
const result = await pool.query(
  \`SELECT * FROM users WHERE email = '\${email}'\`
);
\`\`\`

## Transactions

\`\`\`javascript
async function transferFunds(fromId, toId, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const debit = await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING *',
      [amount, fromId]
    );

    if (debit.rows.length === 0) {
      throw new Error('Insufficient funds');
    }

    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );

    await client.query(
      'INSERT INTO transactions (from_id, to_id, amount) VALUES ($1, $2, $3)',
      [fromId, toId, amount]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();  // Return connection to pool
  }
}
\`\`\`

## Common Query Patterns

\`\`\`javascript
// Upsert (INSERT or UPDATE)
await pool.query(\`
  INSERT INTO settings (key, value)
  VALUES ($1, $2)
  ON CONFLICT (key) DO UPDATE SET value = $2
\`, [key, value]);

// Batch insert
const values = users.map((u, i) => \`($\${i*2+1}, $\${i*2+2})\`).join(', ');
const params = users.flatMap(u => [u.name, u.email]);
await pool.query(\`INSERT INTO users (name, email) VALUES \${values}\`, params);
\`\`\`
`,
  },
  {
    title: "Database Migrations & Schema Management",
    slug: "migrations-schema",
    summary: "Version-control your database schema with migrations and keep development, staging, and production in sync.",
    difficulty_level: "intermediate",
    estimated_time: 25,
    order_index: 2,
    key_points: [
  "Migrations are versioned scripts that evolve the database schema",
  "Each migration has an UP (apply) and DOWN (revert) function",
  "Never modify production data directly — always use migrations",
  "Tools like knex, node-pg-migrate, or Prisma automate migrations",
  "Seed scripts populate initial or test data"
],
    content: `# Database Migrations

## Why Migrations?

- **Version control** for your schema
- **Reproducible** across environments (dev, staging, prod)
- **Reversible** — each migration can be rolled back
- **Team-friendly** — developers apply the same changes in order

## Migration Example (node-pg-migrate)

\`\`\`javascript
// migrations/001_create_users.js
export const up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',  // serial primary key
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('users', 'email');
};

export const down = (pgm) => {
  pgm.dropTable('users');
};
\`\`\`

## Schema Design Best Practices

1. **Use UUIDs** for public-facing IDs (not sequential integers)
2. **Add timestamps** — \`created_at\`, \`updated_at\` on every table
3. **Use foreign keys** with appropriate ON DELETE behavior
4. **Create indexes** on columns used in WHERE, JOIN, ORDER BY
5. **Normalize** first, then denormalize for read performance when needed

\`\`\`sql
-- Example: well-structured schema
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
\`\`\`
`,
  },
];
