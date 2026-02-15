// ============================================================================
// Database Integration — Code Examples
// ============================================================================

const examples = {
  'postgresql-node': [
    {
      title: "Repository Pattern",
      description: "Encapsulate database queries in a repository class.",
      language: "javascript",
      code: `class UserRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE id = $1', [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    return rows[0] || null;
  }

  async create({ name, email, passwordHash }) {
    const { rows } = await this.pool.query(
      \`INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING *\`,
      [name, email, passwordHash]
    );
    return rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const sets = keys.map((k, i) => \`\${k} = $\${i + 2}\`).join(', ');
    const { rows } = await this.pool.query(
      \`UPDATE users SET \${sets}, updated_at = NOW() WHERE id = $1 RETURNING *\`,
      [id, ...Object.values(fields)]
    );
    return rows[0];
  }

  async delete(id) {
    const { rowCount } = await this.pool.query(
      'DELETE FROM users WHERE id = $1', [id]
    );
    return rowCount > 0;
  }

  async findAll({ page = 1, limit = 20, search = '' } = {}) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM users';
    const params = [];

    if (search) {
      params.push(\`%\${search}%\`);
      query += \` WHERE name ILIKE $\${params.length} OR email ILIKE $\${params.length}\`;
    }

    query += ' ORDER BY created_at DESC';
    params.push(limit, offset);
    query += \` LIMIT $\${params.length - 1} OFFSET $\${params.length}\`;

    const { rows } = await this.pool.query(query, params);
    return rows;
  }
}

export default UserRepository;`,
      explanation: "The Repository pattern abstracts away raw SQL, making database operations reusable and testable. Controllers interact with the repository, not the database directly.",
      order_index: 1,
    },
  ],
  'migrations-schema': [
    {
      title: "Simple Migration Runner",
      description: "A basic migration system for learning purposes.",
      language: "javascript",
      code: `import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

async function runMigrations(migrationsDir) {
  // Create migrations tracking table
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  \`);

  // Get already-applied migrations
  const { rows: applied } = await pool.query('SELECT name FROM migrations ORDER BY id');
  const appliedNames = new Set(applied.map(r => r.name));

  // Read migration files
  const files = (await fs.readdir(migrationsDir))
    .filter(f => f.endsWith('.js'))
    .sort(); // Alphabetical = chronological with numbering

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(\`  ✓ \${file} (already applied)\`);
      continue;
    }

    const migration = await import(path.join(migrationsDir, file));
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await migration.up(client);
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(\`  ↑ \${file} applied\`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(\`  ✗ \${file} FAILED:\`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }
}

runMigrations('./migrations').then(() => process.exit(0));`,
      explanation: "This runner tracks which migrations have been applied, runs them in order inside transactions, and records each one. Production systems like Prisma or Knex do the same with added features.",
      order_index: 1,
    },
  ],
};

export default examples;
