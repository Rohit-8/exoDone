// ============================================================================
// Architecture Fundamentals — Code Examples
// ============================================================================

const examples = {
  'what-is-software-architecture': [
    {
      title: "Layered Architecture Example",
      description: "A simple Express.js app organized in layers.",
      language: "javascript",
      code: `// ─── Data Access Layer ───
class UserRepository {
  constructor(pool) { this.pool = pool; }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id=$1', [id]);
    return rows[0] || null;
  }
}

// ─── Business Logic Layer ───
class UserService {
  constructor(userRepo) { this.userRepo = userRepo; }

  async getUserProfile(id) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error('User not found');
    // Business rule: don't expose password hash
    const { password_hash, ...profile } = user;
    return profile;
  }
}

// ─── Presentation Layer (Controller) ───
class UserController {
  constructor(userService) { this.userService = userService; }

  async getProfile(req, res, next) {
    try {
      const profile = await this.userService.getUserProfile(req.params.id);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
}

// ─── Wiring (Composition Root) ───
import pool from './config/database.js';

const userRepo = new UserRepository(pool);
const userService = new UserService(userRepo);
const userController = new UserController(userService);

router.get('/users/:id', (req, res, next) => userController.getProfile(req, res, next));`,
      explanation: "Each layer has a clear responsibility. The controller handles HTTP, the service enforces business rules, and the repository manages data access. Dependencies flow downward.",
      order_index: 1,
    },
  ],
  'architecture-decision-records': [
    {
      title: "ADR Generator Script",
      description: "CLI script to create new ADR files with a template.",
      language: "javascript",
      code: `import fs from 'fs';
import path from 'path';

function createADR(title) {
  const adrDir = './docs/adr';
  if (!fs.existsSync(adrDir)) fs.mkdirSync(adrDir, { recursive: true });

  // Get next number
  const existing = fs.readdirSync(adrDir).filter(f => f.endsWith('.md'));
  const nextNum = String(existing.length + 1).padStart(3, '0');

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = \`\${nextNum}-\${slug}.md\`;

  const content = \`# ADR-\${nextNum}: \${title}

## Status
Proposed

## Context
<!-- What is the issue that we're seeing that is motivating this decision? -->

## Decision
<!-- What is the change that we're proposing and/or doing? -->

## Consequences

### Positive
<!-- What becomes easier? -->

### Negative
<!-- What becomes harder? -->

### Risks
<!-- What could go wrong? -->
\`;

  const filepath = path.join(adrDir, filename);
  fs.writeFileSync(filepath, content);
  console.log(\`Created: \${filepath}\`);
}

// Usage: node create-adr.js "Use Redis for session storage"
const title = process.argv.slice(2).join(' ');
if (!title) {
  console.error('Usage: node create-adr.js "Decision title"');
  process.exit(1);
}
createADR(title);`,
      explanation: "This script auto-numbers ADRs and creates them from a template. Store ADRs in version control so they evolve with the codebase and are discoverable by the entire team.",
      order_index: 1,
    },
  ],
};

export default examples;
