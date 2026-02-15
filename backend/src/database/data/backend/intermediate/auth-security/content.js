// ============================================================================
// Authentication & Security — Content
// ============================================================================

export const topic = {
  "name": "Authentication & Security",
  "slug": "auth-security",
  "description": "Implement secure authentication with JWT, OAuth 2.0, password hashing, and API security best practices.",
  "estimated_time": 220,
  "order_index": 5
};

export const lessons = [
  {
    title: "JWT Authentication",
    slug: "jwt-authentication",
    summary: "Build a complete JWT-based authentication system with access tokens, refresh tokens, and middleware protection.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "JWT (JSON Web Token) encodes claims in a signed, verifiable token",
  "A JWT has three parts: header, payload, and signature",
  "Access tokens are short-lived (15m); refresh tokens are long-lived (7d)",
  "Never store sensitive data (passwords) in JWTs — they are NOT encrypted",
  "Use bcrypt to hash passwords — never store plaintext passwords"
],
    content: `# JWT Authentication

## How JWT Works

1. User logs in with credentials
2. Server verifies credentials, creates a signed JWT
3. Client stores JWT (httpOnly cookie or memory)
4. Client sends JWT with requests via \`Authorization: Bearer <token>\`
5. Server verifies the JWT signature on protected routes

## JWT Structure

\`\`\`
header.payload.signature
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.signature
\`\`\`

| Part | Contains |
|---|---|
| Header | Algorithm, token type |
| Payload | Claims (userId, email, exp, iat) |
| Signature | HMAC-SHA256(header + payload, secret) |

## Implementation

\`\`\`javascript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Password hashing
async function hashPassword(password) {
  return bcrypt.hash(password, 12);  // 12 salt rounds
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Token generation
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}
\`\`\`

## Auth Middleware

\`\`\`javascript
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;   // { userId, email }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protect routes
router.get('/profile', authenticate, getProfile);
router.put('/settings', authenticate, updateSettings);
\`\`\`

## Refresh Token Flow

\`\`\`javascript
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await UserRepository.findById(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});
\`\`\`
`,
  },
];
