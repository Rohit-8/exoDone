import pool from '../config/database.js';

async function seedAuthSecurity() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Authentication & Security lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'auth-security'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Authentication & Authorization Security', 'auth-security-fundamentals', $2, 'Master JWT authentication, OAuth, session management, RBAC, and security best practices', 'intermediate', 55, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Authentication & Authorization

## Authentication vs Authorization

**Authentication**: Verifying who you are (identity)
**Authorization**: Verifying what you can do (permissions)

### Example
- **Authentication**: User logs in with username and password
- **Authorization**: User can view their own orders but not others

## Authentication Methods

### 1. Session-Based Authentication

Traditional approach where server stores session data.

\\\`\\\`\\\`typescript
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict', // CSRF protection
  },
}));

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user in database
  const user = await db.user.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Store user in session
  req.session.userId = user.id;
  req.session.email = user.email;

  res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
});

// Protected route
app.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await db.user.findByPk(req.session.userId);
  res.json({ user });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});
\\\`\\\`\\\`

### 2. JWT (JSON Web Token) Authentication

Stateless authentication using signed tokens.

\\\`\\\`\\\`typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const JWT_EXPIRES_IN = '24h';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate JWT
function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'your-app',
    audience: 'your-app-users',
  });
}

// Verify JWT
function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.user.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

// Authentication middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Protected route
app.get('/profile', authenticate, async (req: any, res) => {
  const user = await db.user.findByPk(req.user.userId);
  res.json({ user });
});
\\\`\\\`\\\`

### 3. Refresh Tokens

Long-lived tokens for obtaining new access tokens.

\\\`\\\`\\\`typescript
import { v4 as uuidv4 } from 'uuid';

interface RefreshToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

const refreshTokens = new Map<string, RefreshToken>(); // Use Redis in production

// Generate refresh token
function generateRefreshToken(userId: string): string {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  refreshTokens.set(token, { token, userId, expiresAt });

  return token;
}

// Login with refresh token
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.user.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken(user.id);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email },
  });
});

// Refresh access token
app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const storedToken = refreshTokens.get(refreshToken);

  if (!storedToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  if (new Date() > storedToken.expiresAt) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  const user = await db.user.findByPk(storedToken.userId);

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const accessToken = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({ accessToken });
});
\\\`\\\`\\\`

## OAuth 2.0

OAuth is an authorization framework for delegated access.

### OAuth Flow (Authorization Code)

\\\`\\\`\\\`typescript
import axios from 'axios';

// OAuth Configuration
const OAUTH_CONFIG = {
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/callback',
  authorizationUrl: 'https://provider.com/oauth/authorize',
  tokenUrl: 'https://provider.com/oauth/token',
  userInfoUrl: 'https://provider.com/oauth/userinfo',
};

// Step 1: Redirect to OAuth provider
app.get('/auth/login', (req, res) => {
  const authUrl = \\\`\\\${OAUTH_CONFIG.authorizationUrl}?\\\` +
    \\\`client_id=\\\${OAUTH_CONFIG.clientId}&\\\` +
    \\\`redirect_uri=\\\${encodeURIComponent(OAUTH_CONFIG.redirectUri)}&\\\` +
    \\\`response_type=code&\\\` +
    \\\`scope=profile email\\\`;

  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(OAUTH_CONFIG.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(OAUTH_CONFIG.userInfoUrl, {
      headers: {
        Authorization: \\\`Bearer \\\${access_token}\\\`,
      },
    });

    const oauthUser = userResponse.data;

    // Find or create user in database
    let user = await db.user.findOne({ where: { email: oauthUser.email } });

    if (!user) {
      user = await db.user.create({
        email: oauthUser.email,
        name: oauthUser.name,
        oauthProvider: 'google',
        oauthId: oauthUser.id,
      });
    }

    // Create session or JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({ token, user });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
\\\`\\\`\\\`

## Authorization & Access Control

### Role-Based Access Control (RBAC)

\\\`\\\`\\\`typescript
enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

enum Permission {
  CREATE_POST = 'create:post',
  READ_POST = 'read:post',
  UPDATE_POST = 'update:post',
  DELETE_POST = 'delete:post',
  MANAGE_USERS = 'manage:users',
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.CREATE_POST,
    Permission.READ_POST,
    Permission.UPDATE_POST,
    Permission.DELETE_POST,
    Permission.MANAGE_USERS,
  ],
  [Role.EDITOR]: [
    Permission.CREATE_POST,
    Permission.READ_POST,
    Permission.UPDATE_POST,
  ],
  [Role.USER]: [
    Permission.READ_POST,
  ],
};

// Authorization middleware
function authorize(...requiredPermissions: Permission[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role as Role;
    const userPermissions = rolePermissions[userRole] || [];

    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage
app.post('/posts',
  authenticate,
  authorize(Permission.CREATE_POST),
  async (req, res) => {
    // Create post
  }
);

app.delete('/posts/:id',
  authenticate,
  authorize(Permission.DELETE_POST),
  async (req, res) => {
    // Delete post
  }
);

app.get('/users',
  authenticate,
  authorize(Permission.MANAGE_USERS),
  async (req, res) => {
    // Get all users
  }
);
\\\`\\\`\\\`

### Resource-Based Authorization

\\\`\\\`\\\`typescript
// Check if user owns the resource
async function authorizeResourceOwner(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const postId = req.params.id;
  const post = await db.post.findByPk(postId);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Allow if user is owner or admin
  if (post.authorId !== req.user.userId && req.user.role !== Role.ADMIN) {
    return res.status(403).json({ error: 'Not authorized to modify this post' });
  }

  req.post = post;
  next();
}

// Usage
app.put('/posts/:id',
  authenticate,
  authorizeResourceOwner,
  async (req: any, res) => {
    const post = req.post;
    post.title = req.body.title;
    post.content = req.body.content;
    await post.save();
    res.json({ post });
  }
);
\\\`\\\`\\\`

## Security Best Practices

### Password Hashing

\\\`\\\`\\\`typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hash password
async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(password)) {
    throw new Error('Password must contain uppercase, lowercase, and number');
  }

  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Registration
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      email,
      name,
      passwordHash,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
\\\`\\\`\\\`

### Rate Limiting

\\\`\\\`\\\`typescript
import rateLimit from 'express-rate-limit';

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
});

app.use('/api/', generalLimiter);
app.post('/login', authLimiter, async (req, res) => {
  // Login logic
});
\\\`\\\`\\\`

### Input Validation

\\\`\\\`\\\`typescript
import { body, validationResult } from 'express-validator';

// Validation middleware
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
];

// Apply validation
app.post('/register', validateRegistration, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Registration logic
});
\\\`\\\`\\\`

### CSRF Protection

\\\`\\\`\\\`typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());

const csrfProtection = csrf({ cookie: true });

// Send CSRF token
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protect forms
app.post('/submit-form', csrfProtection, (req, res) => {
  // Form processing
});
\\\`\\\`\\\`

### Content Security Policy

\\\`\\\`\\\`typescript
import helmet from 'helmet';

app.use(helmet());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));
\\\`\\\`\\\`

## Security Checklist

### Authentication
✅ Hash passwords with bcrypt (never store plaintext)
✅ Use HTTPS in production
✅ Implement rate limiting on auth endpoints
✅ Use secure session configuration
✅ Implement account lockout after failed attempts
✅ Support two-factor authentication (2FA)
✅ Use strong JWT secrets
✅ Set appropriate token expiration times

### Authorization
✅ Implement principle of least privilege
✅ Validate user permissions on every request
✅ Check resource ownership
✅ Use role-based access control
✅ Log authorization failures
✅ Never trust client-side checks

### General Security
✅ Validate and sanitize all input
✅ Use parameterized queries (prevent SQL injection)
✅ Enable CORS with specific origins
✅ Use security headers (helmet.js)
✅ Implement CSRF protection
✅ Keep dependencies updated
✅ Log security events
✅ Regular security audits`,
      [
        'JWT provides stateless authentication while sessions are stateful',
        'OAuth 2.0 enables secure delegated authorization to third-party services',
        'RBAC uses roles and permissions to control access to resources',
        'Always hash passwords with bcrypt and never store plaintext',
        'Implement rate limiting, input validation, and security headers'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'JWT Authentication', 'Complete JWT implementation', 'typescript', $2, 'Shows how to implement JWT-based authentication with token generation and verification', 1),
      ($1, 'RBAC Authorization', 'Role-based access control', 'typescript', $3, 'Demonstrates how to implement role-based authorization with permissions', 2),
      ($1, 'OAuth 2.0 Flow', 'OAuth authorization code flow', 'typescript', $4, 'Shows how to implement OAuth 2.0 for third-party authentication', 3),
      ($1, 'Security Best Practices', 'Password hashing and validation', 'typescript', $5, 'Demonstrates security best practices including password hashing and input validation', 4)
    `, [
      lesson.rows[0].id,
      `import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '24h';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'your-app',
  });
}

function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.user.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({ token, user: { id: user.id, email: user.email } });
});

function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const token = authHeader.substring(7);
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/profile', authenticate, async (req: any, res) => {
  const user = await db.user.findByPk(req.user.userId);
  res.json({ user });
});`,
      `enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

enum Permission {
  CREATE_POST = 'create:post',
  READ_POST = 'read:post',
  UPDATE_POST = 'update:post',
  DELETE_POST = 'delete:post',
  MANAGE_USERS = 'manage:users',
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.CREATE_POST,
    Permission.READ_POST,
    Permission.UPDATE_POST,
    Permission.DELETE_POST,
    Permission.MANAGE_USERS,
  ],
  [Role.EDITOR]: [
    Permission.CREATE_POST,
    Permission.READ_POST,
    Permission.UPDATE_POST,
  ],
  [Role.USER]: [Permission.READ_POST],
};

function authorize(...requiredPermissions: Permission[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role as Role;
    const userPermissions = rolePermissions[userRole] || [];

    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

app.post('/posts',
  authenticate,
  authorize(Permission.CREATE_POST),
  async (req, res) => {
    // Create post
  }
);

app.delete('/posts/:id',
  authenticate,
  authorize(Permission.DELETE_POST),
  async (req, res) => {
    // Delete post
  }
);`,
      `import axios from 'axios';

const OAUTH_CONFIG = {
  clientId: process.env.OAUTH_CLIENT_ID!,
  clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/callback',
  authorizationUrl: 'https://provider.com/oauth/authorize',
  tokenUrl: 'https://provider.com/oauth/token',
  userInfoUrl: 'https://provider.com/oauth/userinfo',
};

app.get('/auth/login', (req, res) => {
  const authUrl = \`\${OAUTH_CONFIG.authorizationUrl}?\` +
    \`client_id=\${OAUTH_CONFIG.clientId}&\` +
    \`redirect_uri=\${encodeURIComponent(OAUTH_CONFIG.redirectUri)}&\` +
    \`response_type=code&\` +
    \`scope=profile email\`;

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Code missing' });
  }

  try {
    const tokenResponse = await axios.post(OAUTH_CONFIG.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get(OAUTH_CONFIG.userInfoUrl, {
      headers: { Authorization: \`Bearer \${access_token}\` },
    });

    const oauthUser = userResponse.data;

    let user = await db.user.findOne({ where: { email: oauthUser.email } });

    if (!user) {
      user = await db.user.create({
        email: oauthUser.email,
        name: oauthUser.name,
        oauthProvider: 'google',
        oauthId: oauthUser.id,
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Auth failed' });
  }
});`,
      `import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(password)) {
    throw new Error('Password must contain uppercase, lowercase, and number');
  }

  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
];

app.post('/register', validateRegistration, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, name } = req.body;
    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      email,
      name,
      passwordHash,
    });

    res.status(201).json({
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main difference between authentication and authorization?', 'multiple_choice', $2, 'Authentication verifies identity, authorization verifies permissions', 'Authentication is about proving who you are (identity), while authorization is about determining what you are allowed to do (permissions).', 'easy', 10, 1),
      ($1, 'Why should you use bcrypt to hash passwords?', 'multiple_choice', $3, 'It is designed to be slow and includes automatic salting', 'Bcrypt is specifically designed for password hashing. It is intentionally slow to prevent brute-force attacks and automatically handles salting.', 'medium', 15, 2),
      ($1, 'What is the purpose of a refresh token in JWT authentication?', 'multiple_choice', $4, 'To obtain new access tokens without requiring re-authentication', 'Refresh tokens are long-lived tokens used to get new short-lived access tokens without forcing users to log in again, improving security and user experience.', 'medium', 15, 3),
      ($1, 'What does RBAC stand for and what is its primary benefit?', 'multiple_choice', $5, 'Role-Based Access Control - simplifies permission management by grouping permissions into roles', 'RBAC groups permissions into roles, making it easier to manage access control. Users are assigned roles rather than individual permissions.', 'easy', 10, 4),
      ($1, 'Why is rate limiting important for authentication endpoints?', 'multiple_choice', $6, 'To prevent brute-force attacks on user credentials', 'Rate limiting restricts the number of login attempts, making brute-force password attacks impractical and protecting user accounts from unauthorized access.', 'medium', 15, 5)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Authentication verifies identity, authorization verifies permissions', 'Authentication is for APIs, authorization is for web apps', 'They are the same thing', 'Authorization happens before authentication']),
      JSON.stringify(['It is faster than other algorithms', 'It is designed to be slow and includes automatic salting', 'It produces shorter hashes', 'It works on all platforms']),
      JSON.stringify(['To store user preferences', 'To encrypt data', 'To obtain new access tokens without requiring re-authentication', 'To invalidate existing sessions']),
      JSON.stringify(['Role-Based Access Control - simplifies permission management by grouping permissions into roles', 'Resource-Based Access Control - controls access to files', 'Request-Based Access Control - limits API requests', 'Route-Based Access Control - protects URL endpoints']),
      JSON.stringify(['To improve performance', 'To prevent brute-force attacks on user credentials', 'To save bandwidth', 'To comply with regulations'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Authentication & Security lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedAuthSecurity()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
