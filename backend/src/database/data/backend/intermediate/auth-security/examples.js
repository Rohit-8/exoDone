// ============================================================================
// Authentication & Security — Code Examples
// ============================================================================

const examples = {
  'jwt-authentication': [
    {
      title: "Complete Login & Registration",
      description: "Full auth endpoints with password hashing and JWT.",
      language: "javascript",
      code: `import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();
const SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const user = rows[0];
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' });

    res.status(201).json({ user, token });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '24h' });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) { next(err); }
});

export default router;`,
      explanation: "Registration hashes the password with bcrypt before storing. Login verifies the hash. Both return a JWT token. Error messages are generic to prevent user enumeration.",
      order_index: 1,
    },
  ],
};

export default examples;
