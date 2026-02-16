// ============================================================================
// Database Integration — Code Examples (Enhanced)
// ============================================================================

const examples = {
  // ===========================================================================
  // Lesson 1: PostgreSQL with Node.js
  // ===========================================================================
  'postgresql-node': [
    {
      title: "Repository Pattern with Full CRUD",
      description: "Encapsulate database queries in a clean repository class with pagination, search, and error handling.",
      language: "javascript",
      code: `import pool from '../config/database.js';

class UserRepository {
  constructor(db = pool) {
    this.db = db;
  }

  // ---------- CREATE ----------
  async create({ name, email, passwordHash, role = 'user' }) {
    const { rows } = await this.db.query(
      \`INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at\`,
      [name, email, passwordHash, role]
    );
    return rows[0];
  }

  // ---------- READ ----------
  async findById(id) {
    const { rows } = await this.db.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email) {
    const { rows } = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  // ---------- UPDATE ----------
  async update(id, fields) {
    const allowed = ['name', 'email', 'role', 'is_active'];
    const filtered = Object.entries(fields)
      .filter(([key]) => allowed.includes(key));

    if (filtered.length === 0) return null;

    const sets = filtered.map(([key], i) => \`\${key} = $\${i + 2}\`);
    const values = filtered.map(([, val]) => val);

    const { rows } = await this.db.query(
      \`UPDATE users SET \${sets.join(', ')}, updated_at = NOW()
       WHERE id = $1 RETURNING *\`,
      [id, ...values]
    );
    return rows[0] || null;
  }

  // ---------- DELETE ----------
  async delete(id) {
    const { rowCount } = await this.db.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  }

  // ---------- LIST with pagination & search ----------
  async findAll({ page = 1, limit = 20, search = '', role } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (search) {
      params.push(\`%\${search}%\`);
      conditions.push(
        \`(name ILIKE $\${params.length} OR email ILIKE $\${params.length})\`
      );
    }

    if (role) {
      params.push(role);
      conditions.push(\`role = $\${params.length}\`);
    }

    const where = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // Count + data in one round-trip using a CTE
    params.push(limit, offset);
    const sql = \`
      WITH filtered AS (
        SELECT * FROM users \${where}
      )
      SELECT
        (SELECT COUNT(*) FROM filtered)::int AS total,
        f.id, f.name, f.email, f.role, f.is_active, f.created_at
      FROM filtered f
      ORDER BY f.created_at DESC
      LIMIT $\${params.length - 1} OFFSET $\${params.length}
    \`;

    const { rows } = await this.db.query(sql, params);
    const total = rows[0]?.total || 0;

    return {
      data: rows.map(({ total: _, ...user }) => user),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}

export default UserRepository;`,
      explanation: "The Repository pattern encapsulates all SQL in a single class, making database operations reusable, testable, and easy to swap (e.g., for a mock in tests). The findAll method demonstrates a common CTE pattern that returns both the total count and paginated data in a single query — avoiding two round-trips to the database.",
      order_index: 1,
    },
    {
      title: "Transaction Helper with Automatic Rollback",
      description: "A reusable transaction wrapper that handles BEGIN, COMMIT, ROLLBACK, and client release automatically.",
      language: "javascript",
      code: `import pool from '../config/database.js';

/**
 * Execute a callback inside a database transaction.
 * Automatically handles BEGIN, COMMIT, ROLLBACK, and client.release().
 *
 * @param {Function} callback - async (client) => result
 * @returns {Promise<any>} - result from the callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Usage: Transfer funds between accounts ──
async function transferFunds(fromId, toId, amount) {
  return withTransaction(async (client) => {
    // Debit sender
    const { rows: [sender] } = await client.query(
      \`UPDATE accounts SET balance = balance - $1
       WHERE id = $2 AND balance >= $1
       RETURNING id, balance\`,
      [amount, fromId]
    );
    if (!sender) throw new Error('Insufficient funds');

    // Credit receiver
    const { rows: [receiver] } = await client.query(
      \`UPDATE accounts SET balance = balance + $1
       WHERE id = $2
       RETURNING id, balance\`,
      [amount, toId]
    );
    if (!receiver) throw new Error('Recipient not found');

    // Log the transfer
    await client.query(
      \`INSERT INTO transfers (from_id, to_id, amount)
       VALUES ($1, $2, $3)\`,
      [fromId, toId, amount]
    );

    return { sender, receiver };
  });
}

// ── Usage: Create order with items (all-or-nothing) ──
async function createOrder(userId, items) {
  return withTransaction(async (client) => {
    // Create the order
    const { rows: [order] } = await client.query(
      \`INSERT INTO orders (user_id, status, total)
       VALUES ($1, 'pending', $2) RETURNING *\`,
      [userId, items.reduce((sum, i) => sum + i.price * i.qty, 0)]
    );

    // Insert each line item
    for (const item of items) {
      await client.query(
        \`INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)\`,
        [order.id, item.productId, item.qty, item.price]
      );

      // Decrement stock
      const { rowCount } = await client.query(
        \`UPDATE products SET stock = stock - $1
         WHERE id = $2 AND stock >= $1\`,
        [item.qty, item.productId]
      );
      if (rowCount === 0) {
        throw new Error(\`Insufficient stock for product \${item.productId}\`);
      }
    }

    return order;
  });
}

export { withTransaction, transferFunds, createOrder };`,
      explanation: "The withTransaction helper is a production-grade pattern. It extracts the boilerplate of BEGIN/COMMIT/ROLLBACK/release into a single function. Any error inside the callback triggers a ROLLBACK, and the connection is always released back to the pool. The createOrder example shows how transactions protect data integrity when multiple tables are involved — if any item is out of stock, the entire order is rolled back.",
      order_index: 2,
    },
    {
      title: "Batch Operations and Bulk Upsert",
      description: "Efficient patterns for inserting/upserting many records at once without N individual queries.",
      language: "javascript",
      code: `import pool from '../config/database.js';

/**
 * Bulk insert rows into a table.
 * Generates a single INSERT with multiple VALUES tuples.
 */
async function bulkInsert(table, columns, rows) {
  if (rows.length === 0) return [];

  const colCount = columns.length;
  const valueTuples = rows.map((_, rowIdx) => {
    const placeholders = columns.map(
      (_, colIdx) => \`$\${rowIdx * colCount + colIdx + 1}\`
    );
    return \`(\${placeholders.join(', ')})\`;
  });

  const params = rows.flatMap(row => columns.map(col => row[col]));

  const sql = \`
    INSERT INTO \${table} (\${columns.join(', ')})
    VALUES \${valueTuples.join(', ')}
    RETURNING *
  \`;

  const { rows: inserted } = await pool.query(sql, params);
  return inserted;
}

/**
 * Bulk upsert — insert or update on conflict.
 * @param {string} table - Table name
 * @param {string[]} columns - Column names
 * @param {Object[]} rows - Array of row objects
 * @param {string} conflictColumn - Column with UNIQUE constraint
 * @param {string[]} updateColumns - Columns to update on conflict
 */
async function bulkUpsert(table, columns, rows, conflictColumn, updateColumns) {
  if (rows.length === 0) return [];

  const colCount = columns.length;
  const valueTuples = rows.map((_, rowIdx) => {
    const placeholders = columns.map(
      (_, colIdx) => \`$\${rowIdx * colCount + colIdx + 1}\`
    );
    return \`(\${placeholders.join(', ')})\`;
  });

  const params = rows.flatMap(row => columns.map(col => row[col]));

  const updateSets = updateColumns
    .map(col => \`\${col} = EXCLUDED.\${col}\`)
    .join(', ');

  const sql = \`
    INSERT INTO \${table} (\${columns.join(', ')})
    VALUES \${valueTuples.join(', ')}
    ON CONFLICT (\${conflictColumn})
    DO UPDATE SET \${updateSets}, updated_at = NOW()
    RETURNING *
  \`;

  const { rows: upserted } = await pool.query(sql, params);
  return upserted;
}

// ── Usage ──
async function main() {
  // Bulk insert users
  const newUsers = await bulkInsert(
    'users',
    ['name', 'email', 'password_hash'],
    [
      { name: 'Alice', email: 'alice@co.com', password_hash: 'hash1' },
      { name: 'Bob', email: 'bob@co.com', password_hash: 'hash2' },
      { name: 'Carol', email: 'carol@co.com', password_hash: 'hash3' },
    ]
  );
  console.log(\`Inserted \${newUsers.length} users\`);

  // Bulk upsert products (update price/stock on conflict)
  const products = await bulkUpsert(
    'products',
    ['sku', 'name', 'price', 'stock'],
    [
      { sku: 'WIDGET-001', name: 'Widget', price: 9.99, stock: 100 },
      { sku: 'GADGET-002', name: 'Gadget', price: 19.99, stock: 50 },
    ],
    'sku',               // conflict column (UNIQUE)
    ['price', 'stock']   // columns to update on conflict
  );
  console.log(\`Upserted \${products.length} products\`);
}

export { bulkInsert, bulkUpsert };`,
      explanation: "Batch operations dramatically reduce the number of database round-trips. Instead of 100 individual INSERTs (100 round-trips), a single bulk INSERT achieves the same in one round-trip. The bulkUpsert function uses PostgreSQL's ON CONFLICT clause with the EXCLUDED pseudo-table to update existing rows. This pattern is essential for data synchronization, imports, and any scenario where you receive arrays of data to persist.",
      order_index: 3,
    },
    {
      title: "Database Health Check and Graceful Shutdown",
      description: "Production-grade patterns for monitoring pool health and shutting down cleanly.",
      language: "javascript",
      code: `import pool from '../config/database.js';

// ── Health Check Endpoint ──
async function checkDatabaseHealth() {
  const start = Date.now();
  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time');
    const latencyMs = Date.now() - start;

    return {
      status: 'healthy',
      latencyMs,
      serverTime: rows[0].server_time,
      pool: {
        total: pool.totalCount,       // All connections
        idle: pool.idleCount,         // Available connections
        waiting: pool.waitingCount,   // Queued requests
      },
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      latencyMs: Date.now() - start,
    };
  }
}

// ── Graceful Shutdown ──
function setupGracefulShutdown(server) {
  const signals = ['SIGTERM', 'SIGINT'];

  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(\`\\n[\${signal}] Shutting down gracefully...\`);

      // 1. Stop accepting new HTTP requests
      server.close(() => {
        console.log('HTTP server closed');
      });

      // 2. Wait for in-flight queries to finish (timeout 10s)
      const timeout = setTimeout(() => {
        console.error('Forced shutdown — pool drain timeout');
        process.exit(1);
      }, 10000);

      try {
        await pool.end(); // Waits for active queries, then closes all connections
        clearTimeout(timeout);
        console.log('Database pool closed');
        process.exit(0);
      } catch (err) {
        console.error('Error closing pool:', err);
        clearTimeout(timeout);
        process.exit(1);
      }
    });
  }
}

// ── Usage in server.js ──
// import express from 'express';
// const app = express();
//
// app.get('/health', async (req, res) => {
//   const health = await checkDatabaseHealth();
//   const status = health.status === 'healthy' ? 200 : 503;
//   res.status(status).json(health);
// });
//
// const server = app.listen(3000, () => {
//   console.log('Server running on :3000');
//   setupGracefulShutdown(server);
// });

export { checkDatabaseHealth, setupGracefulShutdown };`,
      explanation: "Health checks expose pool statistics (total, idle, waiting connections) and measure query latency — essential for Kubernetes liveness/readiness probes and load balancer health checks. Graceful shutdown ensures that on SIGTERM (sent by container orchestrators), the server stops accepting new requests, waits for in-flight queries, and closes the pool cleanly — preventing connection leaks and interrupted transactions.",
      order_index: 4,
    },
  ],

  // ===========================================================================
  // Lesson 2: Database Migrations & Schema Management
  // ===========================================================================
  'migrations-schema': [
    {
      title: "Custom Migration Runner with UP/DOWN Support",
      description: "A lightweight migration system with bidirectional support — apply new migrations or roll back the last one.",
      language: "javascript",
      code: `import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

class MigrationRunner {
  constructor(db, migrationsDir) {
    this.db = db;
    this.dir = migrationsDir;
  }

  async init() {
    await this.db.query(\`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    \`);
  }

  async getApplied() {
    const { rows } = await this.db.query(
      'SELECT name FROM _migrations ORDER BY id'
    );
    return rows.map(r => r.name);
  }

  async getAllFiles() {
    const files = await fs.readdir(this.dir);
    return files.filter(f => f.endsWith('.js')).sort();
  }

  async up() {
    await this.init();
    const applied = new Set(await this.getApplied());
    const files = await this.getAllFiles();
    let count = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(\`  ✓ \${file} (already applied)\`);
        continue;
      }

      const migration = await import(path.resolve(this.dir, file));
      const client = await this.db.connect();

      try {
        await client.query('BEGIN');
        await migration.up(client);
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1)', [file]
        );
        await client.query('COMMIT');
        console.log(\`  ↑ \${file} applied\`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(\`  ✗ \${file} FAILED:\`, err.message);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log(\`\\n\${count} migration(s) applied.\`);
  }

  async down() {
    await this.init();
    const applied = await this.getApplied();
    if (applied.length === 0) {
      console.log('No migrations to roll back.');
      return;
    }

    const lastFile = applied[applied.length - 1];
    const migration = await import(path.resolve(this.dir, lastFile));
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');
      await migration.down(client);
      await client.query(
        'DELETE FROM _migrations WHERE name = $1', [lastFile]
      );
      await client.query('COMMIT');
      console.log(\`  ↓ \${lastFile} rolled back\`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(\`  ✗ Rollback FAILED:\`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  async status() {
    await this.init();
    const applied = new Set(await this.getApplied());
    const files = await this.getAllFiles();

    console.log('\\nMigration Status:');
    for (const file of files) {
      const mark = applied.has(file) ? '✓' : '○';
      console.log(\`  \${mark} \${file}\`);
    }
  }
}

// ── CLI usage ──
const runner = new MigrationRunner(pool, './migrations');
const command = process.argv[2]; // up, down, status

if (command === 'up') await runner.up();
else if (command === 'down') await runner.down();
else if (command === 'status') await runner.status();
else console.log('Usage: node migrate.js [up|down|status]');

await pool.end();`,
      explanation: "This migration runner demonstrates the core concepts behind tools like node-pg-migrate and Knex. Each migration runs inside a transaction — if the migration fails, the schema change is rolled back and the migration is not recorded. The 'down' command rolls back only the most recent migration, which is the safest pattern. The 'status' command shows which migrations are applied and which are pending.",
      order_index: 1,
    },
    {
      title: "Complete Migration File Set — Users, Posts, and Comments",
      description: "Three production-grade migration files demonstrating tables, indexes, constraints, and triggers.",
      language: "javascript",
      code: `// ── migrations/001_create_users.js ──
export const up = async (client) => {
  await client.query(\`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin', 'moderator')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role ON users(role);

    -- Auto-update updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_users_updated
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  \`);
};

export const down = async (client) => {
  await client.query(\`
    DROP TRIGGER IF EXISTS trg_users_updated ON users;
    DROP TABLE IF EXISTS users;
  \`);
};


// ── migrations/002_create_posts.js ──
export const up = async (client) => {
  await client.query(\`
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
    CREATE INDEX idx_posts_author ON posts(author_id);
    CREATE INDEX idx_posts_status ON posts(status) WHERE status = 'published';
    CREATE INDEX idx_posts_slug ON posts(slug);
    CREATE INDEX idx_posts_published ON posts(published_at DESC)
      WHERE status = 'published';

    CREATE TRIGGER trg_posts_updated
      BEFORE UPDATE ON posts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  \`);
};

export const down = async (client) => {
  await client.query(\`
    DROP TRIGGER IF EXISTS trg_posts_updated ON posts;
    DROP TABLE IF EXISTS posts;
  \`);
};


// ── migrations/003_create_comments.js ──
export const up = async (client) => {
  await client.query(\`
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      body TEXT NOT NULL CHECK (char_length(body) > 0),
      is_edited BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_comments_post ON comments(post_id);
    CREATE INDEX idx_comments_user ON comments(user_id);
    CREATE INDEX idx_comments_parent ON comments(parent_id)
      WHERE parent_id IS NOT NULL;

    CREATE TRIGGER trg_comments_updated
      BEFORE UPDATE ON comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  \`);
};

export const down = async (client) => {
  await client.query(\`
    DROP TRIGGER IF EXISTS trg_comments_updated ON comments;
    DROP TABLE IF EXISTS comments;
  \`);
};`,
      explanation: "This set of migration files demonstrates real-world schema design: UUID primary keys, foreign keys with ON DELETE CASCADE, CHECK constraints for enums, partial indexes (only index published posts), a reusable trigger function for updated_at, and self-referencing foreign keys for threaded comments (parent_id). Notice how each migration's DOWN function drops in reverse dependency order.",
      order_index: 2,
    },
    {
      title: "Database Seeder with Faker and Relationships",
      description: "A seed script that creates realistic test data with proper relationships between tables.",
      language: "javascript",
      code: `import pool from '../config/database.js';
import bcrypt from 'bcrypt';

// Simple deterministic data (no external dependency)
const NAMES = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'Dave Brown', 'Eve Davis'];
const ROLES = ['user', 'user', 'user', 'moderator', 'admin'];
const POST_TITLES = [
  'Getting Started with Node.js',
  'Understanding Async/Await',
  'Database Design Best Practices',
  'REST API Architecture',
  'Testing Strategies for Backend',
  'Docker for Node.js Developers',
  'Security Best Practices',
  'Performance Optimization Tips',
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear tables in reverse dependency order
    await client.query('DELETE FROM comments');
    await client.query('DELETE FROM posts');
    await client.query('DELETE FROM users');

    console.log('Tables cleared.');

    // ── Seed Users ──
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userIds = [];

    for (let i = 0; i < NAMES.length; i++) {
      const email = NAMES[i].toLowerCase().replace(' ', '.') + '@example.com';
      const { rows } = await client.query(
        \`INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4) RETURNING id\`,
        [NAMES[i], email, hashedPassword, ROLES[i]]
      );
      userIds.push(rows[0].id);
    }
    console.log(\`Seeded \${userIds.length} users.\`);

    // ── Seed Posts ──
    const postIds = [];
    for (let i = 0; i < POST_TITLES.length; i++) {
      const authorId = userIds[i % userIds.length];
      const status = i < 6 ? 'published' : 'draft';
      const publishedAt = status === 'published' ? 'NOW()' : null;

      const { rows } = await client.query(
        \`INSERT INTO posts (author_id, title, slug, content, status, published_at)
         VALUES ($1, $2, $3, $4, $5, \${publishedAt ? 'NOW()' : 'NULL'})
         RETURNING id\`,
        [
          authorId,
          POST_TITLES[i],
          slugify(POST_TITLES[i]),
          \`This is the full content of "\${POST_TITLES[i]}". It covers important concepts...\`,
          status,
        ]
      );
      postIds.push(rows[0].id);
    }
    console.log(\`Seeded \${postIds.length} posts.\`);

    // ── Seed Comments ──
    const commentTexts = [
      'Great article! Very helpful.',
      'Thanks for sharing this knowledge.',
      'I have a question about the third point...',
      'This helped me solve a bug in my project!',
      'Could you elaborate on the performance section?',
    ];
    let commentCount = 0;

    for (const postId of postIds.slice(0, 5)) {
      for (let i = 0; i < 3; i++) {
        const userId = userIds[(i + 1) % userIds.length];
        await client.query(
          \`INSERT INTO comments (post_id, user_id, body)
           VALUES ($1, $2, $3)\`,
          [postId, userId, commentTexts[i % commentTexts.length]]
        );
        commentCount++;
      }
    }
    console.log(\`Seeded \${commentCount} comments.\`);

    await client.query('COMMIT');
    console.log('\\nSeeding complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .catch(() => pool.end());`,
      explanation: "This seed script creates realistic test data with proper relationships: users → posts → comments. It runs inside a transaction so either all seed data is inserted or none. Notice how tables are cleared in reverse dependency order (comments first) to avoid foreign key violations. The deterministic data (no randomness) ensures consistent test environments.",
      order_index: 3,
    },
  ],

  // ===========================================================================
  // Lesson 3: ORM Integration with Sequelize & Prisma
  // ===========================================================================
  'orm-integration': [
    {
      title: "Sequelize Model with Associations and Scopes",
      description: "Define Sequelize models with validations, hooks, associations, and reusable query scopes.",
      language: "javascript",
      code: `import { Sequelize, DataTypes, Model, Op } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
});

// ── User Model ──
class User extends Model {
  // Instance method: check password
  async checkPassword(plainText) {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(plainText, this.passwordHash);
  }

  // Instance method: sanitized JSON (hide password)
  toSafeJSON() {
    const { passwordHash, ...safe } = this.toJSON();
    return safe;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name cannot be empty' },
      len: { args: [1, 255], msg: 'Name must be 1-255 characters' },
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: { msg: 'Email already registered' },
    validate: { isEmail: { msg: 'Must be a valid email' } },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash',
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
  underscored: true,
  timestamps: true,
  paranoid: true,       // Soft deletes (adds deleted_at)
  defaultScope: {
    attributes: { exclude: ['passwordHash'] },  // Hide password by default
  },
  scopes: {
    withPassword: {
      attributes: {},   // Include all fields
    },
    active: {
      where: { isActive: true },
    },
    admins: {
      where: { role: 'admin' },
    },
    search(term) {
      return {
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: \`%\${term}%\` } },
            { email: { [Op.iLike]: \`%\${term}%\` } },
          ],
        },
      };
    },
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.changed('passwordHash')) {
        const bcrypt = await import('bcrypt');
        user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
      }
    },
  },
});

// ── Post Model ──
class Post extends Model {}

Post.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(500), allowNull: false },
  slug: { type: DataTypes.STRING(500), unique: true, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
  },
}, {
  sequelize,
  modelName: 'Post',
  tableName: 'posts',
  underscored: true,
  timestamps: true,
});

// ── Associations ──
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// ── Usage Examples ──
// User.scope('active').findAll()
// User.scope('search', 'alice').findAll()
// User.scope('withPassword').findOne({ where: { email } })
// Post.findAll({ include: [{ model: User, as: 'author' }] })

export { sequelize, User, Post };`,
      explanation: "This example shows advanced Sequelize patterns: scopes create reusable named queries (User.scope('active')); hooks run logic before/after model operations (auto-hashing passwords); the defaultScope hides sensitive fields; custom setter methods normalize data (lowercasing emails); paranoid mode adds soft deletes. The toSafeJSON method prevents accidental password exposure in API responses.",
      order_index: 1,
    },
    {
      title: "Prisma Schema and Client Usage",
      description: "Complete Prisma setup with schema, client wrapper, and CRUD operations including transactions and raw queries.",
      language: "javascript",
      code: `// ── prisma/schema.prisma (for reference) ──
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }
// generator client {
//   provider = "prisma-client-js"
// }
// model User { ... }
// model Post { ... }

// ── lib/prisma.js — Singleton client ──
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development (hot reload)
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;


// ── services/userService.js — Using the Prisma client ──
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

class UserService {
  async register(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }

  async getProfile(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, title: true, slug: true, createdAt: true },
        },
        _count: { select: { posts: true } },
      },
    });
  }

  async listUsers({ page = 1, limit = 20, search, role }) {
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // Transaction example: transfer "credits" between users
  async transferCredits(fromId, toId, amount) {
    return prisma.$transaction(async (tx) => {
      const sender = await tx.user.update({
        where: { id: fromId },
        data: { credits: { decrement: amount } },
      });

      if (sender.credits < 0) {
        throw new Error('Insufficient credits');
      }

      const receiver = await tx.user.update({
        where: { id: toId },
        data: { credits: { increment: amount } },
      });

      await tx.transfer.create({
        data: { fromId, toId, amount },
      });

      return { sender, receiver };
    });
  }

  // Raw SQL for complex queries
  async getTopAuthors(limit = 10) {
    return prisma.$queryRaw\`
      SELECT u.id, u.name, COUNT(p.id)::int AS post_count,
             COALESCE(SUM(p.view_count), 0)::int AS total_views
      FROM users u
      LEFT JOIN posts p ON p.author_id = u.id AND p.status = 'published'
      GROUP BY u.id, u.name
      HAVING COUNT(p.id) > 0
      ORDER BY total_views DESC
      LIMIT \${limit}
    \`;
  }
}

export default new UserService();`,
      explanation: "This example demonstrates production Prisma patterns: a singleton client (prevents connection exhaustion during hot reload), select/include for controlling returned fields, $transaction for atomic operations (both batch and interactive modes), $queryRaw for complex SQL that would be awkward with the Prisma query API, and the _count virtual field for efficient counting. The UserService class follows the service layer pattern, keeping business logic separate from route handlers.",
      order_index: 2,
    },
    {
      title: "N+1 Problem Detection and Solutions",
      description: "Demonstrates the N+1 query problem and three different solutions: eager loading, DataLoader, and raw SQL JOIN.",
      language: "javascript",
      code: `import pool from '../config/database.js';

// ═══════════════════════════════════════════════
// THE PROBLEM: N+1 Queries
// ═══════════════════════════════════════════════

async function getPostsWithAuthorsBAD() {
  // Query 1: Get all posts
  const { rows: posts } = await pool.query(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT 20'
  );

  // Queries 2..N+1: Get author for EACH post (20 extra queries!)
  for (const post of posts) {
    const { rows } = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [post.author_id]
    );
    post.author = rows[0];
  }

  return posts;
  // Total: 21 queries for 20 posts! Scales linearly with data.
}


// ═══════════════════════════════════════════════
// SOLUTION 1: JOIN (single query)
// ═══════════════════════════════════════════════

async function getPostsWithAuthorsJOIN() {
  const { rows } = await pool.query(\`
    SELECT
      p.id, p.title, p.slug, p.status, p.created_at,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email
      ) AS author
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC
    LIMIT 20
  \`);

  return rows;
  // Total: 1 query! But duplicates author data if same author has many posts.
}


// ═══════════════════════════════════════════════
// SOLUTION 2: Two queries + in-memory join
// ═══════════════════════════════════════════════

async function getPostsWithAuthorsTwoQueries() {
  // Query 1: Get posts
  const { rows: posts } = await pool.query(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT 20'
  );

  // Collect unique author IDs
  const authorIds = [...new Set(posts.map(p => p.author_id))];

  if (authorIds.length === 0) return posts;

  // Query 2: Get all needed authors in one query
  const placeholders = authorIds.map((_, i) => \`$\${i + 1}\`).join(', ');
  const { rows: authors } = await pool.query(
    \`SELECT id, name, email FROM users WHERE id IN (\${placeholders})\`,
    authorIds
  );

  // In-memory join
  const authorMap = new Map(authors.map(a => [a.id, a]));
  for (const post of posts) {
    post.author = authorMap.get(post.author_id) || null;
  }

  return posts;
  // Total: 2 queries regardless of post count!
}


// ═══════════════════════════════════════════════
// SOLUTION 3: DataLoader pattern (batch + cache)
// ═══════════════════════════════════════════════

class DataLoader {
  constructor(batchFn) {
    this.batchFn = batchFn;
    this.cache = new Map();
    this.queue = [];
    this.scheduled = false;
  }

  async load(key) {
    if (this.cache.has(key)) return this.cache.get(key);

    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (!this.scheduled) {
        this.scheduled = true;
        // Process queue on next tick (batches all load() calls in same tick)
        process.nextTick(() => this._dispatch());
      }
    });
  }

  async _dispatch() {
    const batch = this.queue;
    this.queue = [];
    this.scheduled = false;

    const keys = batch.map(b => b.key);
    try {
      const results = await this.batchFn(keys);
      batch.forEach((b, i) => {
        this.cache.set(b.key, results[i]);
        b.resolve(results[i]);
      });
    } catch (err) {
      batch.forEach(b => b.reject(err));
    }
  }
}

// Usage: Create a loader per request
function createUserLoader() {
  return new DataLoader(async (ids) => {
    const placeholders = ids.map((_, i) => \`$\${i + 1}\`).join(', ');
    const { rows } = await pool.query(
      \`SELECT * FROM users WHERE id IN (\${placeholders})\`,
      ids
    );
    // Return in same order as input ids
    const map = new Map(rows.map(r => [r.id, r]));
    return ids.map(id => map.get(id) || null);
  });
}

// const userLoader = createUserLoader();
// const author1 = await userLoader.load(post1.author_id);
// const author2 = await userLoader.load(post2.author_id);
// Both calls batched into a single SQL query!

export {
  getPostsWithAuthorsBAD,
  getPostsWithAuthorsJOIN,
  getPostsWithAuthorsTwoQueries,
  createUserLoader,
};`,
      explanation: "The N+1 problem is the #1 performance issue in database-backed applications. This example shows the problem clearly (21 queries for 20 posts) and three progressively sophisticated solutions: (1) SQL JOIN — simplest, best for simple cases; (2) Two-query batch — avoids data duplication, good for REST APIs; (3) DataLoader — the industry-standard solution (used by Facebook's GraphQL), automatically batches and caches loads within a single request cycle. In interviews, being able to explain all three approaches demonstrates strong database knowledge.",
      order_index: 3,
    },
  ],

  // ===========================================================================
  // Lesson 4: Query Optimization & Indexing
  // ===========================================================================
  'query-optimization': [
    {
      title: "EXPLAIN ANALYZE Wrapper for Development",
      description: "A utility that wraps queries with EXPLAIN ANALYZE and logs performance insights during development.",
      language: "javascript",
      code: `import pool from '../config/database.js';

/**
 * Run a query with EXPLAIN ANALYZE and log performance insights.
 * Only use in development — adds overhead.
 */
async function explainQuery(sql, params = []) {
  const explainSql = \`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) \${sql}\`;
  const { rows } = await pool.query(explainSql, params);
  const plan = rows[0]['QUERY PLAN'][0];

  const insights = analyzeQueryPlan(plan);

  console.log('\\n┌─── Query Analysis ───────────────────────');
  console.log(\`│ SQL: \${sql.substring(0, 80)}...\`);
  console.log(\`│ Planning Time: \${plan['Planning Time']} ms\`);
  console.log(\`│ Execution Time: \${plan['Execution Time']} ms\`);
  console.log(\`│ Total Time: \${(plan['Planning Time'] + plan['Execution Time']).toFixed(3)} ms\`);

  if (insights.length > 0) {
    console.log('│');
    console.log('│ ⚠ Potential Issues:');
    insights.forEach(i => console.log(\`│   • \${i}\`));
  } else {
    console.log('│ ✓ No obvious issues detected');
  }

  console.log('└──────────────────────────────────────────\\n');

  return { plan, insights };
}

function analyzeQueryPlan(plan, issues = [], depth = 0) {
  const node = plan.Plan || plan;

  // Check for sequential scans on large tables
  if (node['Node Type'] === 'Seq Scan' && (node['Actual Rows'] || 0) > 1000) {
    issues.push(
      \`Sequential scan on "\${node['Relation Name']}" (\${node['Actual Rows']} rows). Consider adding an index.\`
    );
  }

  // Check for high filter removals
  if (node['Rows Removed by Filter'] > node['Actual Rows'] * 10) {
    issues.push(
      \`\${node['Rows Removed by Filter']} rows removed by filter vs \${node['Actual Rows']} returned. Index may be missing or not selective.\`
    );
  }

  // Check for sorts without index
  if (node['Node Type'] === 'Sort' && node['Sort Method']?.includes('external')) {
    issues.push(
      \`External disk sort detected (\${node['Sort Space Used']}kB). Consider an index to avoid sorting.\`
    );
  }

  // Check for nested loops with seq scans
  if (node['Node Type'] === 'Nested Loop' && depth > 0) {
    issues.push(
      'Nested Loop join detected — ensure inner side has an index on the join column.'
    );
  }

  // Recurse into child plans
  if (node.Plans) {
    node.Plans.forEach(child => analyzeQueryPlan(child, issues, depth + 1));
  }

  return issues;
}

// ── Usage ──
// await explainQuery(
//   'SELECT * FROM users WHERE email = $1',
//   ['alice@example.com']
// );

export { explainQuery };`,
      explanation: "This utility wraps any query with EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) and automatically detects common performance issues: sequential scans on large tables (missing index), excessive filtered rows (index not selective enough), disk sorts (missing sort index), and nested loop joins. In development, you can swap pool.query with explainQuery to audit slow endpoints. The JSON format makes it easy to parse programmatically, unlike the default text format.",
      order_index: 1,
    },
    {
      title: "Index Strategy Implementation",
      description: "Creating and managing different index types for real-world query patterns: B-tree, partial, composite, expression, and covering indexes.",
      language: "sql",
      code: `-- ═══════════════════════════════════════════════════
-- Index Strategy for a Blog Platform
-- ═══════════════════════════════════════════════════

-- ── 1. B-tree Indexes (default, most common) ──

-- Simple: speed up lookups by email
CREATE INDEX idx_users_email ON users(email);

-- Composite: speed up queries filtering by user AND status
-- Follows leftmost prefix rule: also speeds up queries on user_id alone
CREATE INDEX idx_posts_author_status ON posts(author_id, status);

-- Descending: for "latest first" queries
CREATE INDEX idx_posts_created_desc ON posts(created_at DESC);


-- ── 2. Partial Indexes (smaller, faster) ──

-- Only index published posts (80% of queries filter by published)
CREATE INDEX idx_posts_published_date
  ON posts(published_at DESC)
  WHERE status = 'published';

-- Only index active users
CREATE INDEX idx_users_active_email
  ON users(email)
  WHERE is_active = true;

-- Size comparison:
-- Full index on posts(published_at):    ~2.4 MB
-- Partial index (WHERE published):     ~0.8 MB  (67% smaller!)


-- ── 3. Expression Indexes (computed values) ──

-- Case-insensitive email search
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
-- Now this query uses the index:
-- SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- Month-based analytics
CREATE INDEX idx_orders_month ON orders(DATE_TRUNC('month', created_at));
-- Now this query uses the index:
-- SELECT COUNT(*) FROM orders WHERE DATE_TRUNC('month', created_at) = '2025-01-01';


-- ── 4. Covering Indexes (avoid table lookups) ──

-- The INCLUDE columns are stored in the index leaf pages
-- Allows "Index Only Scan" — no need to read the table
CREATE INDEX idx_users_email_cover
  ON users(email)
  INCLUDE (name, role, is_active);

-- This query reads ONLY the index:
-- SELECT name, role FROM users WHERE email = 'alice@example.com';


-- ── 5. GIN Indexes (JSONB, arrays, full-text) ──

-- JSONB containment queries
CREATE INDEX idx_products_attrs ON products USING gin(attributes);
-- SELECT * FROM products WHERE attributes @> '{"color": "red"}';

-- Full-text search
CREATE INDEX idx_posts_fts ON posts
  USING gin(to_tsvector('english', title || ' ' || content));
-- SELECT * FROM posts
--   WHERE to_tsvector('english', title || ' ' || content)
--          @@ to_tsquery('database & optimization');

-- Array containment
CREATE INDEX idx_posts_tags ON posts USING gin(tags);
-- SELECT * FROM posts WHERE tags @> ARRAY['javascript'];


-- ── 6. Unique Indexes with multiple columns ──

-- Ensure a user can only like a post once
CREATE UNIQUE INDEX idx_likes_unique
  ON likes(user_id, post_id);


-- ── Index Maintenance ──

-- Check index sizes
SELECT
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  idx_scan AS times_used
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find unused indexes (candidates for removal)
SELECT
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'   -- Keep primary keys
  AND indexrelname NOT LIKE '%_unique' -- Keep unique constraints
ORDER BY pg_relation_size(indexrelid) DESC;

-- Reindex after bulk data changes
REINDEX INDEX idx_posts_published_date;`,
      explanation: "This example provides a complete index strategy for a real application. Key takeaways: (1) Partial indexes dramatically reduce size for filtered queries. (2) Expression indexes are required when your WHERE clause uses functions like LOWER(). (3) Covering indexes with INCLUDE eliminate table lookups entirely. (4) GIN indexes are essential for JSONB, arrays, and full-text search. (5) Always monitor index usage — unused indexes waste space and slow down writes. The maintenance queries at the end help identify bloated or unused indexes.",
      order_index: 2,
    },
    {
      title: "Redis Caching Layer with Cache-Aside Pattern",
      description: "A production-grade caching service using Redis with TTL, invalidation, and cache stampede protection.",
      language: "javascript",
      code: `import Redis from 'ioredis';
import pool from '../config/database.js';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 200,
});

class CacheService {
  constructor(redisClient, defaultTTL = 300) {
    this.redis = redisClient;
    this.defaultTTL = defaultTTL; // 5 minutes
  }

  // ── Core Methods ──

  async get(key) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key) {
    await this.redis.del(key);
  }

  async delPattern(pattern) {
    // Delete all keys matching a pattern (e.g., "user:*")
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    return keys.length;
  }

  // ── Cache-Aside Pattern ──

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    // 1. Try cache first
    const cached = await this.get(key);
    if (cached !== null) return cached;

    // 2. Cache miss — fetch from database
    const data = await fetchFn();

    // 3. Store in cache (don't cache null/undefined)
    if (data != null) {
      await this.set(key, data, ttl);
    }

    return data;
  }

  // ── Cache Stampede Protection ──
  // When cache expires, prevent 100 concurrent requests from
  // all hitting the database at the same time.

  async getOrSetWithLock(key, fetchFn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    const lockKey = \`lock:\${key}\`;
    // Try to acquire lock (NX = only if not exists, EX = 10s expiry)
    const acquired = await this.redis.set(lockKey, '1', 'NX', 'EX', 10);

    if (acquired) {
      try {
        // We won the lock — fetch and cache
        const data = await fetchFn();
        if (data != null) await this.set(key, data, ttl);
        return data;
      } finally {
        await this.redis.del(lockKey);
      }
    } else {
      // Another process is fetching — wait and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getOrSetWithLock(key, fetchFn, ttl);
    }
  }
}

const cache = new CacheService(redis);

// ═══════════════════════════════════════════════
// Usage Examples
// ═══════════════════════════════════════════════

// ── Get user with caching ──
async function getUser(id) {
  return cache.getOrSet(
    \`user:\${id}\`,
    async () => {
      const { rows } = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [id]
      );
      return rows[0] || null;
    },
    600 // Cache for 10 minutes
  );
}

// ── Update user and invalidate cache ──
async function updateUser(id, data) {
  const { rows } = await pool.query(
    'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [data.name, id]
  );

  // Invalidate this user's cache
  await cache.del(\`user:\${id}\`);

  // Also invalidate any list caches that include this user
  await cache.delPattern('users:list:*');

  return rows[0];
}

// ── Cached paginated list ──
async function listUsers(page = 1, limit = 20) {
  return cache.getOrSet(
    \`users:list:\${page}:\${limit}\`,
    async () => {
      const offset = (page - 1) * limit;
      const { rows } = await pool.query(
        'SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return rows;
    },
    120 // Shorter TTL for lists (2 minutes)
  );
}

export { cache, getUser, updateUser, listUsers };`,
      explanation: "This caching service implements the Cache-Aside pattern (also called Lazy Loading): check cache first, on miss fetch from database and populate cache. The getOrSetWithLock method prevents cache stampedes — when a popular cached item expires, hundreds of concurrent requests could all hit the database simultaneously. The lock ensures only one request fetches from the database while others wait. The delPattern method handles cache invalidation for list queries that are affected by individual record updates.",
      order_index: 3,
    },
    {
      title: "Query Performance Monitoring Middleware",
      description: "An Express middleware that logs slow database queries and tracks query statistics over time.",
      language: "javascript",
      code: `import pool from '../config/database.js';

// ── Instrumented Pool ──
// Wraps pool.query to measure execution time

class InstrumentedPool {
  constructor(originalPool, slowThresholdMs = 100) {
    this.pool = originalPool;
    this.slowThreshold = slowThresholdMs;
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      errors: 0,
      totalTimeMs: 0,
    };
  }

  async query(text, params) {
    const start = process.hrtime.bigint();
    this.stats.totalQueries++;

    try {
      const result = await this.pool.query(text, params);
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      this.stats.totalTimeMs += durationMs;

      if (durationMs > this.slowThreshold) {
        this.stats.slowQueries++;
        console.warn(
          \`[SLOW QUERY] \${durationMs.toFixed(1)}ms | \${text.substring(0, 120)}\`,
          params ? \`| params: \${JSON.stringify(params).substring(0, 100)}\` : ''
        );
      }

      return result;
    } catch (err) {
      this.stats.errors++;
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      console.error(
        \`[QUERY ERROR] \${durationMs.toFixed(1)}ms | \${text.substring(0, 120)}\\n\`,
        err.message
      );
      throw err;
    }
  }

  getStats() {
    return {
      ...this.stats,
      avgTimeMs: this.stats.totalQueries > 0
        ? (this.stats.totalTimeMs / this.stats.totalQueries).toFixed(2)
        : 0,
      slowPercentage: this.stats.totalQueries > 0
        ? ((this.stats.slowQueries / this.stats.totalQueries) * 100).toFixed(1)
        : 0,
      pool: {
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount,
      },
    };
  }

  resetStats() {
    this.stats = { totalQueries: 0, slowQueries: 0, errors: 0, totalTimeMs: 0 };
  }
}

const db = new InstrumentedPool(pool, 100); // Log queries > 100ms

// ── Express Middleware: attach request-level timing ──
function queryTimingMiddleware(req, res, next) {
  const requestQueries = [];
  const originalQuery = db.query.bind(db);

  // Monkey-patch for this request only
  req.db = {
    async query(text, params) {
      const start = Date.now();
      const result = await originalQuery(text, params);
      requestQueries.push({
        sql: text.substring(0, 200),
        durationMs: Date.now() - start,
      });
      return result;
    },
  };

  // Log query summary on response finish
  res.on('finish', () => {
    if (requestQueries.length > 0) {
      const totalMs = requestQueries.reduce((sum, q) => sum + q.durationMs, 0);
      if (totalMs > 200 || requestQueries.length > 5) {
        console.warn(
          \`[REQUEST DB]\`,
          \`\${req.method} \${req.originalUrl}\`,
          \`| \${requestQueries.length} queries\`,
          \`| \${totalMs}ms total\`
        );
      }
    }
  });

  next();
}

// ── Stats Endpoint ──
function queryStatsHandler(req, res) {
  res.json(db.getStats());
}

export { db, queryTimingMiddleware, queryStatsHandler };`,
      explanation: "This monitoring layer provides three levels of visibility: (1) Individual slow query logging — any query over 100ms is logged with its SQL and parameters; (2) Per-request tracking via middleware — flags requests with too many queries or high total DB time (catches N+1 problems in production); (3) Aggregate statistics endpoint — total queries, slow percentage, average time, and pool utilization. This is the kind of observability code that separates production-ready applications from prototypes.",
      order_index: 4,
    },
  ],
};

export default examples;
