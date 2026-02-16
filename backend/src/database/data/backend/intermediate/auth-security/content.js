// ============================================================================
// Authentication & Security — Content
// ============================================================================

export const topic = {
  "name": "Authentication & Security",
  "slug": "auth-security",
  "description": "Master authentication, authorization, password hashing, JWT, OAuth 2.0, and critical web security techniques for building production-grade secure APIs.",
  "estimated_time": 360,
  "order_index": 5
};

export const lessons = [
  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 1 — Authentication vs Authorization
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "Authentication vs Authorization",
    slug: "authentication-vs-authorization",
    summary: "Understand the fundamental difference between verifying identity (authentication) and granting access (authorization), and how both work together to secure applications.",
    difficulty_level: "intermediate",
    estimated_time: 30,
    order_index: 1,
    key_points: [
      "Authentication (AuthN) answers 'Who are you?' — it verifies identity",
      "Authorization (AuthZ) answers 'What can you do?' — it checks permissions",
      "Authentication always happens before authorization",
      "Common AuthN methods: passwords, biometrics, multi-factor, SSO",
      "Common AuthZ models: RBAC, ABAC, ACL, policy-based",
      "A user can be authenticated but still unauthorized for a specific resource"
    ],
    content: `# Authentication vs Authorization

## The Core Distinction

**Authentication (AuthN)** and **Authorization (AuthZ)** are the two pillars of application security, yet they solve very different problems.

| Aspect | Authentication (AuthN) | Authorization (AuthZ) |
|---|---|---|
| Question it answers | *Who are you?* | *What are you allowed to do?* |
| Purpose | Verify identity | Check permissions |
| When it happens | First | After authentication |
| Failure response | 401 Unauthorized | 403 Forbidden |
| Example | Logging in with email/password | Checking if user can delete a post |

### Real-World Analogy

Think of a **hotel**:
- **Authentication** = Showing your ID at the front desk to prove you are the person who booked the room.
- **Authorization** = Your keycard only opens *your* room, not every room in the hotel. The pool area may require a premium-tier keycard.

---

## Authentication Methods

### 1. Knowledge-Based (Something You Know)
\`\`\`
Username + Password
PIN codes
Security questions
\`\`\`

### 2. Possession-Based (Something You Have)
\`\`\`
TOTP codes (Google Authenticator)
SMS one-time passwords
Hardware security keys (YubiKey)
\`\`\`

### 3. Inherence-Based (Something You Are)
\`\`\`
Fingerprint scan
Face recognition
Retina scan
\`\`\`

### 4. Multi-Factor Authentication (MFA)
Combines two or more of the above categories:
\`\`\`
Password + TOTP code  →  knowledge + possession
Password + fingerprint →  knowledge + inherence
\`\`\`

> **Interview Tip:** MFA requires factors from *different* categories. Using two passwords is NOT MFA.

---

## Authorization Models

### Role-Based Access Control (RBAC)

\`\`\`javascript
// Each user is assigned one or more roles
const roles = {
  admin:  ['read', 'write', 'delete', 'manage_users'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

function authorize(requiredPermission) {
  return (req, res, next) => {
    const userPermissions = roles[req.user.role] || [];
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
router.delete('/posts/:id', authenticate, authorize('delete'), deletePost);
\`\`\`

### Attribute-Based Access Control (ABAC)

\`\`\`javascript
// Decisions based on attributes of user, resource, and environment
function canEdit(user, document) {
  return (
    user.department === document.department &&
    user.clearanceLevel >= document.requiredClearance &&
    isBusinessHours()
  );
}
\`\`\`

### Access Control List (ACL)

\`\`\`javascript
// Explicit mapping of user/resource permissions
const acl = {
  'document:42': {
    'user:1': ['read', 'write'],
    'user:2': ['read'],
    'group:editors': ['read', 'write', 'delete'],
  },
};
\`\`\`

---

## Combining AuthN and AuthZ in Express

\`\`\`javascript
import express from 'express';

// Step 1: Authentication middleware — verifies identity
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Step 2: Authorization middleware — checks permissions
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

const app = express();

// Public — no auth needed
app.get('/api/products', listProducts);

// Authenticated — any logged-in user
app.get('/api/profile', authenticate, getProfile);

// Authorized — only admins
app.delete('/api/users/:id', authenticate, requireRole('admin'), deleteUser);
\`\`\`

---

## HTTP Status Codes for Auth

| Code | Name | Meaning |
|---|---|---|
| 200 | OK | Auth succeeded, access granted |
| 401 | Unauthorized | Authentication failed or missing |
| 403 | Forbidden | Authenticated but not authorized |
| 419 | Authentication Timeout | Session/token expired (non-standard) |

> **Common Mistake:** 401 is called "Unauthorized" but it actually means *unauthenticated*. 403 is the true "unauthorized" status.
`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 2 — Password Hashing & Secure Storage
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "Password Hashing & Secure Storage",
    slug: "password-hashing",
    summary: "Learn why and how to hash passwords using bcrypt and argon2, understand salt rounds, and compare hashing algorithms for secure credential storage.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 2,
    key_points: [
      "Never store passwords in plaintext — always hash them",
      "Hashing is a one-way function; encryption is two-way — use hashing for passwords",
      "Bcrypt automatically generates and stores a unique salt per password",
      "Argon2 is the winner of the Password Hashing Competition (2015) and resists GPU attacks",
      "Salt rounds (cost factor) control the computational work — higher is slower but more secure",
      "Timing-safe comparison prevents timing attacks when verifying passwords"
    ],
    content: `# Password Hashing & Secure Storage

## Why Hash Passwords?

If your database is breached, hashed passwords are **useless to attackers** — they cannot be reversed to the original password.

| Storage Method | Security Level | What Attacker Sees |
|---|---|---|
| Plaintext | ❌ None | \`password123\` |
| Encrypted | ⚠️ Reversible | Can decrypt if key is found |
| MD5/SHA | ⚠️ Weak | Rainbow table lookup in seconds |
| Bcrypt | ✅ Strong | Computationally expensive to crack |
| Argon2 | ✅ Strongest | Memory-hard, resists GPU/ASIC attacks |

### Real-World Analogy

Hashing is like a **meat grinder**: you can put beef in and get ground beef out, but you can never reassemble the original cut of beef from the ground meat. Salting is like adding a unique spice blend to each batch — even identical inputs produce different outputs.

---

## How Bcrypt Works

1. Generate a random **salt** (16 bytes)
2. Combine salt + password
3. Run the Blowfish cipher \`2^cost\` times (adaptive cost)
4. Produce a 60-character hash string

\`\`\`
$2b$12$LJ3m4ys3Lg2VHGPsUMfuZe7.HRljSTwitGBh4gNMTysFzmHiKnzHi
 ▲  ▲  ▲────────────────────────▲──────────────────────────────────▲
 │  │  │ 22-char salt            │ 31-char hash
 │  │ cost factor (12 rounds = 2^12 = 4096 iterations)
 │ version
 algorithm identifier
\`\`\`

### Bcrypt in Node.js

\`\`\`javascript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // 2^12 = 4096 iterations

// Hash a password
async function hashPassword(plaintext) {
  const hash = await bcrypt.hash(plaintext, SALT_ROUNDS);
  return hash; // '$2b$12$...' (60 chars)
}

// Verify a password
async function verifyPassword(plaintext, storedHash) {
  const isMatch = await bcrypt.compare(plaintext, storedHash);
  return isMatch; // true or false
}

// Usage
const hash = await hashPassword('mySecretPass');
console.log(hash);
// $2b$12$LJ3m4ys3Lg2VHGPsUMfuZe7.HRljSTwitGBh4gNMTysFzmHiKnzHi

const valid = await verifyPassword('mySecretPass', hash);
console.log(valid); // true

const invalid = await verifyPassword('wrongPassword', hash);
console.log(invalid); // false
\`\`\`

---

## Argon2 — The Modern Standard

Argon2 won the **Password Hashing Competition** in 2015 and has three variants:

| Variant | Resists | Best For |
|---|---|---|
| Argon2d | GPU attacks | Cryptocurrency, non-interactive |
| Argon2i | Side-channel attacks | Login servers |
| Argon2id | Both | ✅ Recommended default |

### Argon2 in Node.js

\`\`\`javascript
import argon2 from 'argon2';

// Hash with argon2id (recommended)
async function hashPassword(plaintext) {
  const hash = await argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536,   // 64 MB
    timeCost: 3,          // 3 iterations
    parallelism: 4,       // 4 threads
  });
  return hash;
}

// Verify
async function verifyPassword(plaintext, storedHash) {
  try {
    return await argon2.verify(storedHash, plaintext);
  } catch {
    return false;
  }
}

// Output example:
// $argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$hash...
\`\`\`

---

## Bcrypt vs Argon2 Comparison

| Feature | Bcrypt | Argon2id |
|---|---|---|
| Year introduced | 1999 | 2015 |
| GPU resistance | Moderate | ✅ Strong (memory-hard) |
| Memory hardness | ❌ No | ✅ Yes (configurable) |
| Parallelism config | ❌ No | ✅ Yes |
| Max password length | 72 bytes | Unlimited |
| Industry adoption | Very high | Growing rapidly |
| OWASP recommended | Yes | Yes (preferred) |

---

## Security Best Practices

\`\`\`javascript
// ❌ NEVER do this
const hash = md5(password);                    // Too fast, rainbow tables
const hash = sha256(password);                  // Still too fast
const hash = sha256(password + 'static_salt');  // Same salt = vulnerable
db.query(\`INSERT INTO users VALUES ('\${password}')\`); // Plaintext!

// ✅ DO this
const hash = await bcrypt.hash(password, 12);   // Adaptive cost, unique salt
const hash = await argon2.hash(password, {       // Memory-hard
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
});
\`\`\`

### Choosing Salt Rounds (Bcrypt)

| Salt Rounds | Time (approx.) | Recommendation |
|---|---|---|
| 10 | ~100ms | Minimum acceptable |
| 12 | ~300ms | ✅ Good default |
| 14 | ~1s | High security |
| 16 | ~4s | May impact UX |

> **Rule of thumb:** Hash should take 250ms–1s on your server hardware.
`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 3 — JWT Deep Dive
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "JWT Authentication Deep Dive",
    slug: "jwt-authentication",
    summary: "Master JSON Web Tokens — understand their structure, signing algorithms, verification flow, access/refresh token patterns, and common security pitfalls.",
    difficulty_level: "intermediate",
    estimated_time: 50,
    order_index: 3,
    key_points: [
      "JWT has three Base64URL-encoded parts: Header.Payload.Signature",
      "JWTs are signed (integrity) but NOT encrypted (anyone can read the payload)",
      "Access tokens should be short-lived (5–15 min); refresh tokens longer (7–30 days)",
      "Use RS256 (asymmetric) for distributed systems, HS256 (symmetric) for monoliths",
      "Store tokens in httpOnly cookies to prevent XSS theft, or in memory for SPAs",
      "Always validate issuer (iss), audience (aud), and expiration (exp) claims"
    ],
    content: `# JWT Authentication Deep Dive

## What is a JWT?

A **JSON Web Token (JWT)** is an open standard (RFC 7519) for securely transmitting information between parties as a signed JSON object. It is compact, URL-safe, and self-contained.

### Real-World Analogy

A JWT is like a **tamper-proof wristband at a concert**:
- The band has your ticket info printed on it (payload)
- It has a holographic seal that proves it's authentic (signature)
- Security can verify it by looking at the seal without calling the ticket office (stateless)
- It expires at the end of the event (exp claim)

---

## JWT Structure

\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.    ← Header (Base64URL)
eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9.    ← Payload (Base64URL)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature
\`\`\`

### 1. Header
\`\`\`json
{
  "alg": "HS256",   // Signing algorithm
  "typ": "JWT"      // Token type
}
\`\`\`

### 2. Payload (Claims)
\`\`\`json
{
  "sub": "1",             // Subject (user ID)
  "email": "user@example.com",
  "role": "admin",
  "iat": 1700000000,      // Issued At
  "exp": 1700000900,      // Expiration (15 min later)
  "iss": "myapp.com",     // Issuer
  "aud": "myapp.com"      // Audience
}
\`\`\`

| Claim | Name | Purpose |
|---|---|---|
| sub | Subject | Identifies the principal (user ID) |
| iat | Issued At | When the token was created |
| exp | Expiration | When the token expires |
| iss | Issuer | Who created the token |
| aud | Audience | Intended recipient |
| jti | JWT ID | Unique identifier (for revocation) |

### 3. Signature
\`\`\`
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
\`\`\`

> ⚠️ **Critical:** JWTs are **signed**, not **encrypted**. Anyone can decode the payload. Never put passwords, credit card numbers, or secrets in a JWT.

---

## Signing Algorithms

| Algorithm | Type | Key | Best For |
|---|---|---|---|
| HS256 | Symmetric | Shared secret | Monoliths, single-server |
| RS256 | Asymmetric | Private/Public key pair | Microservices, distributed |
| ES256 | Asymmetric | Elliptic curve keys | Mobile, performance-sensitive |

\`\`\`javascript
import jwt from 'jsonwebtoken';
import fs from 'fs';

// ── HS256 (Symmetric) ───────────────────────
const token = jwt.sign(
  { userId: 1, role: 'admin' },
  'my-shared-secret',
  { algorithm: 'HS256', expiresIn: '15m' }
);

// ── RS256 (Asymmetric) ──────────────────────
const privateKey = fs.readFileSync('private.pem');
const publicKey = fs.readFileSync('public.pem');

const token2 = jwt.sign(
  { userId: 1, role: 'admin' },
  privateKey,
  { algorithm: 'RS256', expiresIn: '15m' }
);

// Any service with the PUBLIC key can verify
const decoded = jwt.verify(token2, publicKey, { algorithms: ['RS256'] });
\`\`\`

---

## Complete Auth System with Access + Refresh Tokens

\`\`\`javascript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

// ── Token Generation ────────────────────────
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY, issuer: 'myapp.com' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenVersion: user.token_version },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY, issuer: 'myapp.com' }
  );

  return { accessToken, refreshToken };
}

// ── Login Endpoint ──────────────────────────
async function login(req, res) {
  const { email, password } = req.body;

  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const tokens = generateTokens(user);

  // Store refresh token in httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ accessToken: tokens.accessToken });
}

// ── Auth Middleware ─────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, ACCESS_SECRET, {
      issuer: 'myapp.com',
      algorithms: ['HS256'],
    });
    req.user = payload;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: message });
  }
}

// ── Refresh Token Endpoint ──────────────────
async function refresh(req, res) {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await db.query('SELECT * FROM users WHERE id = $1', [payload.userId]);

    if (!user || user.token_version !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    const tokens = generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: tokens.accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// ── Token Revocation (Logout) ───────────────
async function logout(req, res) {
  // Increment token_version to invalidate all existing refresh tokens
  await db.query(
    'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
    [req.user.userId]
  );

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
}
\`\`\`

---

## Token Storage: Where to Keep JWTs

| Location | XSS Safe? | CSRF Safe? | Recommendation |
|---|---|---|---|
| localStorage | ❌ No | ✅ Yes | ⚠️ Avoid for sensitive apps |
| sessionStorage | ❌ No | ✅ Yes | Only for short sessions |
| httpOnly Cookie | ✅ Yes | ❌ Needs CSRF protection | ✅ Best for web apps |
| In-memory variable | ✅ Yes | ✅ Yes | ✅ Best for SPAs (lost on refresh) |

---

## Common JWT Security Pitfalls

| Pitfall | Risk | Prevention |
|---|---|---|
| \`alg: "none"\` | Signature bypass | Always specify allowed algorithms |
| Sensitive data in payload | Data exposure | Never put secrets in JWT |
| Long-lived access tokens | Token theft | Use short expiry + refresh tokens |
| No token revocation | Can't force logout | Use token versioning or blacklist |
| Secret in source code | Key compromise | Use environment variables |
`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 4 — OAuth 2.0 Basics
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "OAuth 2.0 & Social Login",
    slug: "oauth-basics",
    summary: "Learn OAuth 2.0 authorization flows, understand grant types, and implement social login (Google, GitHub) with Passport.js.",
    difficulty_level: "intermediate",
    estimated_time: 45,
    order_index: 4,
    key_points: [
      "OAuth 2.0 is an authorization framework — it grants access, not identity (OpenID Connect adds identity)",
      "The Authorization Code flow is the most secure and recommended for server-side apps",
      "PKCE (Proof Key for Code Exchange) protects public clients like SPAs and mobile apps",
      "Four roles: Resource Owner, Client, Authorization Server, Resource Server",
      "Access tokens grant API access; they should be short-lived and scoped",
      "Never use the Implicit flow — it's deprecated in OAuth 2.1"
    ],
    content: `# OAuth 2.0 & Social Login

## What is OAuth 2.0?

OAuth 2.0 is an **authorization framework** that allows a third-party application to access a user's resources on another service without exposing the user's credentials.

### Real-World Analogy

OAuth is like a **valet parking key**:
- You give the valet a limited key that can only start/drive the car (not open the trunk or glove box)
- The valet doesn't need your master key or know your home address
- You can revoke the valet key without changing your master key

---

## OAuth 2.0 Roles

| Role | Description | Example |
|---|---|---|
| Resource Owner | The user who owns the data | You (the GitHub user) |
| Client | The app requesting access | Your learning platform |
| Authorization Server | Issues tokens after consent | GitHub's auth server |
| Resource Server | Hosts protected resources | GitHub API |

---

## Authorization Code Flow (Most Common)

\`\`\`
┌──────────┐     1. Redirect to Auth Server     ┌────────────────┐
│          │ ──────────────────────────────────> │                │
│  Client  │                                     │  Auth Server   │
│  (Your   │     2. User logs in + consents      │  (Google,      │
│   App)   │                                     │   GitHub)      │
│          │ <── 3. Redirect back with code ──── │                │
│          │                                     └────────────────┘
│          │     4. Exchange code for tokens
│          │ ──────────────────────────────────> │  Auth Server   │
│          │ <── 5. Access + Refresh tokens ──── │                │
│          │                                     └────────────────┘
│          │     6. Use access token for API calls
│          │ ──────────────────────────────────> │ Resource Server│
└──────────┘                                     └────────────────┘
\`\`\`

---

## Grant Types Comparison

| Grant Type | Use Case | Security |
|---|---|---|
| Authorization Code | Server-side web apps | ✅ Most secure |
| Authorization Code + PKCE | SPAs, mobile apps | ✅ Secure for public clients |
| Client Credentials | Machine-to-machine | ✅ No user involved |
| ~~Implicit~~ | ~~SPAs (deprecated)~~ | ❌ Token in URL fragment |
| ~~Password Grant~~ | ~~Trusted first-party~~ | ❌ Client sees password |

---

## Implementing Google OAuth with Passport.js

\`\`\`javascript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    scope: ['profile', 'email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user in our database
      let user = await db.query(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
        ['google', profile.id]
      );

      if (!user) {
        user = await db.query(
          \`INSERT INTO users (name, email, oauth_provider, oauth_id, avatar_url)
           VALUES ($1, $2, $3, $4, $5) RETURNING *\`,
          [profile.displayName, profile.emails[0].value, 'google', profile.id, profile.photos[0].value]
        );
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateJWT(req.user);
    // Redirect to frontend with token
    res.redirect(\`\${process.env.FRONTEND_URL}/auth/callback?token=\${token}\`);
  }
);
\`\`\`

---

## PKCE (Proof Key for Code Exchange)

PKCE adds security for **public clients** (SPAs, mobile apps) that can't safely store a client secret.

\`\`\`javascript
import crypto from 'crypto';

// Step 1: Generate code_verifier (random string)
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// Step 2: Create code_challenge = SHA256(code_verifier)
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Step 3: Send code_challenge with auth request
const authUrl = new URL('https://auth.example.com/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// Step 4: Exchange code with code_verifier
const tokenResponse = await fetch('https://auth.example.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier, // Proves we initiated the request
  }),
});
\`\`\`

---

## OAuth 2.0 vs OpenID Connect (OIDC)

| Feature | OAuth 2.0 | OpenID Connect |
|---|---|---|
| Purpose | Authorization (access) | Authentication (identity) |
| Returns | Access token | Access token + ID token |
| ID Token | ❌ No | ✅ Yes (JWT with user info) |
| UserInfo endpoint | ❌ No | ✅ Yes |
| Use case | "Access my GitHub repos" | "Log in with Google" |

> **Interview Tip:** OAuth 2.0 alone doesn't tell you *who* the user is — that's what OpenID Connect (OIDC) adds on top.
`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 5 — Session-Based vs Token-Based Auth
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "Session-Based vs Token-Based Auth",
    slug: "session-vs-token-auth",
    summary: "Compare session-based and token-based authentication, understand their trade-offs, and learn when to use each approach.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 5,
    key_points: [
      "Session-based auth stores state on the server (in memory, DB, or Redis)",
      "Token-based auth is stateless — the token itself contains all needed data",
      "Sessions use cookies to send a session ID; tokens use Authorization headers or cookies",
      "Sessions are easier to revoke; tokens require extra mechanisms (blacklists, versioning)",
      "Token-based auth scales better horizontally since no shared session store is needed",
      "Modern apps often combine both: JWT for API access + server-side session for web UI"
    ],
    content: `# Session-Based vs Token-Based Authentication

## Overview

These are the two primary strategies for maintaining authenticated state across HTTP requests (which are inherently stateless).

---

## Session-Based Authentication

### How It Works

\`\`\`
1. User sends credentials (POST /login)
2. Server verifies, creates session in store (memory/Redis/DB)
3. Server sends session ID in Set-Cookie header
4. Browser automatically sends cookie with every request
5. Server looks up session ID in store to identify user
\`\`\`

\`\`\`
┌──────────┐   POST /login (credentials)    ┌──────────┐   Session Store
│          │ ─────────────────────────────> │          │   ┌──────────┐
│  Browser │                                │  Server  │──>│ sid:abc  │
│          │ <── Set-Cookie: sid=abc ────── │          │   │ userId:1 │
│          │                                │          │   │ role:adm │
│          │   GET /api/data                │          │   └──────────┘
│          │   Cookie: sid=abc              │          │
│          │ ─────────────────────────────> │  lookup  │
│          │ <── 200 OK {data} ──────────── │  session │
└──────────┘                                └──────────┘
\`\`\`

### Express Session Implementation

\`\`\`javascript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,         // HTTPS only
    httpOnly: true,       // Not accessible via JavaScript
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',   // CSRF protection
  },
}));

// Login
app.post('/login', async (req, res) => {
  const user = await verifyCredentials(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ message: 'Logged in' });
});

// Protected route
app.get('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // req.session.userId is available
  res.json({ userId: req.session.userId });
});

// Logout — destroy session
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});
\`\`\`

---

## Token-Based Authentication

### How It Works

\`\`\`
1. User sends credentials (POST /login)
2. Server verifies, generates a signed JWT
3. Server sends JWT in response body
4. Client stores JWT (memory, cookie, or localStorage)
5. Client sends JWT in Authorization header with each request
6. Server verifies JWT signature — no lookup needed
\`\`\`

\`\`\`
┌──────────┐   POST /login (credentials)    ┌──────────┐
│          │ ─────────────────────────────> │          │
│  Client  │                                │  Server  │  No server-side
│          │ <── { accessToken: "ey..." } ─ │          │  state needed!
│          │                                │          │
│          │   GET /api/data                │          │
│          │   Authorization: Bearer ey...  │          │
│          │ ─────────────────────────────> │  verify  │
│          │ <── 200 OK {data} ──────────── │  JWT sig │
└──────────┘                                └──────────┘
\`\`\`

---

## Head-to-Head Comparison

| Feature | Session-Based | Token-Based (JWT) |
|---|---|---|
| State | Stateful (server stores sessions) | Stateless (token has all data) |
| Storage | Server: Redis/DB, Client: cookie | Client: memory/cookie/localStorage |
| Scalability | Needs shared session store | ✅ Scales horizontally easily |
| Revocation | ✅ Easy — delete from store | ⚠️ Hard — need blacklist or versioning |
| CSRF risk | ⚠️ Yes (cookies sent automatically) | ✅ No (if using Authorization header) |
| XSS risk | ✅ Low (httpOnly cookies) | ⚠️ High if stored in localStorage |
| Mobile support | ⚠️ Cookies awkward on mobile | ✅ Natural fit for mobile APIs |
| Payload size | Small (just session ID) | Larger (claims encoded in token) |
| Server memory | Uses memory/Redis | ✅ No server memory needed |
| Implementation | Simple with express-session | More complex (token rotation, etc.) |

---

## Hybrid Approach

Many production apps combine both strategies:

\`\`\`javascript
// Web application — session-based with CSRF protection
app.use('/web', sessionMiddleware, csrfProtection, webRoutes);

// API endpoints — token-based for mobile/SPA clients
app.use('/api', jwtMiddleware, apiRoutes);
\`\`\`

---

## When to Use Which?

| Scenario | Recommendation |
|---|---|
| Traditional server-rendered app | ✅ Sessions |
| Single Page Application (SPA) | ✅ JWT (in memory) + refresh token (httpOnly cookie) |
| Mobile app | ✅ JWT |
| Microservices | ✅ JWT (stateless verification) |
| Need instant logout/revocation | ✅ Sessions or JWT + blacklist |
| Simple prototype | ✅ Sessions (simpler to implement) |

> **Interview Tip:** There is no universally "better" approach. The right choice depends on your architecture, scale, and security requirements.
`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 6 — Web Security: CORS, CSRF & XSS
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "Web Security: CORS, CSRF & XSS",
    slug: "cors-csrf-xss",
    summary: "Master the three most critical web security concerns: Cross-Origin Resource Sharing (CORS), Cross-Site Request Forgery (CSRF), and Cross-Site Scripting (XSS).",
    difficulty_level: "intermediate",
    estimated_time: 50,
    order_index: 6,
    key_points: [
      "CORS is a browser-enforced policy that restricts cross-origin HTTP requests",
      "CSRF tricks authenticated users into making unwanted requests to your API",
      "XSS injects malicious scripts that execute in other users' browsers",
      "Prevent CSRF with SameSite cookies, CSRF tokens, and checking the Origin header",
      "Prevent XSS by escaping output, using CSP headers, and sanitizing user input",
      "Never use res.setHeader('Access-Control-Allow-Origin', '*') with credentials"
    ],
    content: `# Web Security: CORS, CSRF & XSS

## 1. CORS — Cross-Origin Resource Sharing

### What is an Origin?

An origin is defined by the combination of **protocol + domain + port**:
\`\`\`
https://myapp.com:443     → Origin A
https://myapp.com:3000    → Different origin (different port)
http://myapp.com:443      → Different origin (different protocol)
https://api.myapp.com:443 → Different origin (different subdomain)
\`\`\`

### The Same-Origin Policy

Browsers **block** JavaScript from making requests to a different origin than the page was loaded from. CORS is the mechanism that **relaxes** this restriction in a controlled way.

### How CORS Works

\`\`\`
Browser sends:                      Server responds:
GET /api/data                       Access-Control-Allow-Origin: https://myapp.com
Origin: https://myapp.com           Access-Control-Allow-Methods: GET, POST
                                    Access-Control-Allow-Headers: Content-Type
\`\`\`

**Preflight Request** — For "non-simple" requests (PUT, DELETE, custom headers), the browser first sends an OPTIONS request:

\`\`\`
OPTIONS /api/data HTTP/1.1           HTTP/1.1 204 No Content
Origin: https://myapp.com            Access-Control-Allow-Origin: https://myapp.com
Access-Control-Request-Method: PUT   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Request-Headers:      Access-Control-Allow-Headers: Content-Type, Authorization
  Content-Type, Authorization        Access-Control-Max-Age: 86400
\`\`\`

### Express CORS Configuration

\`\`\`javascript
import cors from 'cors';

// ❌ Too permissive — allows any origin
app.use(cors());

// ✅ Properly configured
app.use(cors({
  origin: ['https://myapp.com', 'https://staging.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,      // Allow cookies
  maxAge: 86400,           // Cache preflight for 24 hours
}));

// ✅ Dynamic origin (check against whitelist)
const allowedOrigins = new Set([
  'https://myapp.com',
  'https://admin.myapp.com',
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
\`\`\`

---

## 2. CSRF — Cross-Site Request Forgery

### How CSRF Attacks Work

\`\`\`
1. User logs into bank.com (session cookie is set)
2. User visits evil.com (while still logged in)
3. evil.com has a hidden form that submits to bank.com/transfer
4. Browser automatically includes the bank.com cookie
5. Bank processes the transfer — it looks legitimate!
\`\`\`

\`\`\`html
<!-- On evil.com — auto-submitting form -->
<form action="https://bank.com/api/transfer" method="POST" id="csrf-form">
  <input type="hidden" name="to" value="attacker-account" />
  <input type="hidden" name="amount" value="10000" />
</form>
<script>document.getElementById('csrf-form').submit();</script>
\`\`\`

### CSRF Prevention Strategies

#### 1. SameSite Cookies (Primary Defense)

\`\`\`javascript
res.cookie('sessionId', sid, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // Cookie not sent on cross-origin requests
});
\`\`\`

| SameSite Value | Cross-site POST | Cross-site GET (link) | Recommendation |
|---|---|---|---|
| strict | ❌ Blocked | ❌ Blocked | ✅ Most secure |
| lax | ❌ Blocked | ✅ Allowed | ✅ Good default |
| none | ✅ Allowed | ✅ Allowed | ⚠️ Requires Secure flag |

#### 2. CSRF Tokens

\`\`\`javascript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

// Render form with CSRF token
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// Validate CSRF token on submission
app.post('/transfer', csrfProtection, (req, res) => {
  // Token is automatically validated
  processTransfer(req.body);
});
\`\`\`

#### 3. Custom Headers

\`\`\`javascript
// Frontend sends custom header
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Triggers preflight
  },
  body: JSON.stringify({ amount: 100 }),
});

// Backend checks for custom header
function csrfCheck(req, res, next) {
  if (req.method !== 'GET' && !req.headers['x-requested-with']) {
    return res.status(403).json({ error: 'CSRF check failed' });
  }
  next();
}
\`\`\`

---

## 3. XSS — Cross-Site Scripting

### Types of XSS

| Type | Where Payload is Stored | Example |
|---|---|---|
| Stored (Persistent) | Database | Malicious comment in a forum |
| Reflected | URL parameter | Link with script in query string |
| DOM-based | Client-side JS | Unsafe use of \`innerHTML\` |

### Stored XSS Example

\`\`\`javascript
// ❌ VULNERABLE — unsanitized user input rendered as HTML
app.get('/comments', async (req, res) => {
  const comments = await db.query('SELECT * FROM comments');
  let html = '<ul>';
  comments.forEach(c => {
    html += \`<li>\${c.text}</li>\`; // If c.text is <script>alert('xss')</script>
  });
  html += '</ul>';
  res.send(html);
});
\`\`\`

### XSS Prevention

\`\`\`javascript
import DOMPurify from 'isomorphic-dompurify';
import { escape } from 'he';

// 1. Escape HTML entities
const safeText = escape(userInput);
// <script> becomes &lt;script&gt;

// 2. Sanitize HTML (if you need to allow some markup)
const safeHtml = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href'],
});

// 3. Content Security Policy header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );
  next();
});

// 4. In React — safe by default!
function Comment({ text }) {
  return <p>{text}</p>;  // ✅ React escapes by default
  // return <p dangerouslySetInnerHTML={{__html: text}} />; // ❌ UNSAFE
}
\`\`\`

---

## Quick Reference: CORS vs CSRF vs XSS

| | CORS | CSRF | XSS |
|---|---|---|---|
| What it is | Browser policy for cross-origin requests | Attack forging requests as user | Attack injecting malicious scripts |
| Attacker's goal | N/A (it's a defense mechanism) | Execute actions as the victim | Steal data / hijack sessions |
| Where it happens | Browser enforcement | Server-side processing | Client-side execution |
| Prevention | Allowlist origins, proper headers | SameSite cookies, CSRF tokens | Escape output, CSP, sanitize input |
`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 7 — SQL Injection & Input Sanitization
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "SQL Injection & Input Sanitization",
    slug: "sql-injection-sanitization",
    summary: "Understand SQL injection attacks, learn how parameterized queries prevent them, and implement comprehensive input sanitization and validation.",
    difficulty_level: "intermediate",
    estimated_time: 40,
    order_index: 7,
    key_points: [
      "SQL injection occurs when user input is concatenated directly into SQL queries",
      "Parameterized queries (prepared statements) are the #1 defense against SQL injection",
      "ORMs like Prisma, Sequelize, and Knex use parameterized queries by default",
      "Input validation checks format and constraints; sanitization cleans dangerous content",
      "Validate on both client and server — client validation is for UX, server validation is for security",
      "Use allowlists over denylists — define what's allowed rather than what's blocked"
    ],
    content: `# SQL Injection & Input Sanitization

## What is SQL Injection?

SQL injection (SQLi) is a code injection technique where an attacker inserts malicious SQL through user input, allowing them to read, modify, or delete data.

### Real-World Analogy

Imagine a form where you write your name on a check. If you write:
\`\`\`
John"; DROP TABLE accounts; --
\`\`\`
And the bank processes this literally, they'd execute the command to delete all accounts. SQL injection works the same way with database queries.

---

## How SQL Injection Works

\`\`\`javascript
// ❌ VULNERABLE — String concatenation
const query = \`SELECT * FROM users WHERE email = '\${email}' AND password = '\${password}'\`;

// Attacker enters:
// email: admin@site.com
// password: ' OR '1'='1

// Result:
// SELECT * FROM users WHERE email = 'admin@site.com' AND password = '' OR '1'='1'
// This returns ALL users because '1'='1' is always true!
\`\`\`

### Types of SQL Injection

| Type | Description | Example Input |
|---|---|---|
| Classic (In-band) | Results visible in response | \`' OR 1=1 --\` |
| Union-based | Uses UNION to extract other tables | \`' UNION SELECT * FROM admins --\` |
| Blind (Boolean) | Infers data from true/false responses | \`' AND 1=1 --\` vs \`' AND 1=2 --\` |
| Time-based Blind | Infers from response delay | \`'; WAITFOR DELAY '0:0:5' --\` |
| Second-order | Stored payload, triggered later | Stored in profile, triggered in report |

---

## Prevention: Parameterized Queries

\`\`\`javascript
// ❌ VULNERABLE — string concatenation
const result = await pool.query(
  \`SELECT * FROM users WHERE email = '\${email}'\`
);

// ❌ STILL VULNERABLE — template literals are NOT parameterization
const result = await pool.query(
  \`SELECT * FROM users WHERE email = '\${sanitize(email)}'\`
);

// ✅ SAFE — parameterized query (pg library)
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [email, 'active']
);

// ✅ SAFE — parameterized query (mysql2)
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE email = ? AND status = ?',
  [email, 'active']
);
\`\`\`

### Why Parameterized Queries Work

The database engine treats parameters as **data, never as SQL code**:
\`\`\`
WITH parameterized query:
  Query:  SELECT * FROM users WHERE email = $1
  Param:  "admin@site.com' OR '1'='1"
  → DB searches for the LITERAL string "admin@site.com' OR '1'='1"
  → No rows found. Attack fails.

WITHOUT parameterization:
  Query:  SELECT * FROM users WHERE email = 'admin@site.com' OR '1'='1'
  → DB executes the OR clause. Attack succeeds!
\`\`\`

---

## ORM Protection

ORMs generate parameterized queries by default, but can still be vulnerable:

\`\`\`javascript
// ✅ SAFE — Prisma (parameterized by default)
const user = await prisma.user.findUnique({
  where: { email: email },
});

// ✅ SAFE — Knex query builder
const user = await knex('users').where({ email }).first();

// ⚠️ VULNERABLE — raw query in Knex
const user = await knex.raw(\`SELECT * FROM users WHERE email = '\${email}'\`);

// ✅ SAFE — raw query with bindings
const user = await knex.raw('SELECT * FROM users WHERE email = ?', [email]);

// ⚠️ VULNERABLE — Sequelize raw query
const users = await sequelize.query(\`SELECT * FROM users WHERE email = '\${email}'\`);

// ✅ SAFE — Sequelize with replacements
const users = await sequelize.query(
  'SELECT * FROM users WHERE email = :email',
  { replacements: { email }, type: QueryTypes.SELECT }
);
\`\`\`

---

## Input Validation & Sanitization

### Validation vs Sanitization

| Concept | Purpose | Action | Example |
|---|---|---|---|
| Validation | Check if input meets rules | Reject if invalid | Email must match pattern |
| Sanitization | Clean dangerous content | Transform input | Strip HTML tags, trim whitespace |

### Using express-validator

\`\`\`javascript
import { body, validationResult } from 'express-validator';

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .escape(),  // HTML entity encoding

  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),  // lowercase, remove dots in gmail

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain lowercase letter')
    .matches(/\\d/).withMessage('Must contain a number')
    .matches(/[@$!%*?&#]/).withMessage('Must contain a special character'),

  body('age')
    .optional()
    .isInt({ min: 13, max: 120 }).withMessage('Age must be 13-120')
    .toInt(),  // Convert to integer
];

app.post('/register', registerValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Input is valid and sanitized — safe to use
  createUser(req.body);
});
\`\`\`

---

## Defense in Depth

\`\`\`
           ┌─────────────────────────────┐
Layer 1:   │  Input Validation            │  Reject bad format
           ├─────────────────────────────┤
Layer 2:   │  Input Sanitization          │  Escape/strip dangerous chars
           ├─────────────────────────────┤
Layer 3:   │  Parameterized Queries       │  Separate code from data
           ├─────────────────────────────┤
Layer 4:   │  Least Privilege DB User     │  DB user can only SELECT/INSERT
           ├─────────────────────────────┤
Layer 5:   │  WAF (Web Application FW)    │  Block known attack patterns
           └─────────────────────────────┘
\`\`\`

> **Interview Tip:** Always mention **parameterized queries** as the primary defense against SQL injection. Sanitization is a secondary layer — never rely on it alone.
`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LESSON 8 — Rate Limiting, Security Headers & HTTPS
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: "Rate Limiting, Security Headers & HTTPS",
    slug: "rate-limiting-headers-https",
    summary: "Protect your API with rate limiting, harden your app with security headers (Helmet), and understand HTTPS/TLS for data in transit.",
    difficulty_level: "intermediate",
    estimated_time: 45,
    order_index: 8,
    key_points: [
      "Rate limiting prevents brute force attacks, DDoS, and API abuse",
      "Use sliding window or token bucket algorithms for production rate limiting",
      "Helmet sets 15+ HTTP security headers with a single middleware call",
      "HTTPS encrypts data in transit using TLS — protects against man-in-the-middle attacks",
      "HSTS (HTTP Strict Transport Security) forces browsers to always use HTTPS",
      "Content-Security-Policy (CSP) prevents XSS by controlling script sources"
    ],
    content: `# Rate Limiting, Security Headers & HTTPS

## 1. Rate Limiting

### Why Rate Limiting?

Without rate limiting, your API is vulnerable to:
- **Brute force attacks** — trying thousands of password combinations
- **DDoS attacks** — overwhelming your server with requests
- **API abuse** — scraping data or hitting expensive endpoints
- **Resource exhaustion** — a single user consuming all server resources

### Real-World Analogy

Rate limiting is like a **bouncer at a club**: they control how many people can enter per hour. Even if someone keeps trying to get in, they have to wait.

---

### Basic Rate Limiting with express-rate-limit

\`\`\`javascript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15-minute window
  max: 100,                     // 100 requests per window
  standardHeaders: true,        // Return rate limit info in headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  keyGenerator: (req) => req.ip, // Rate limit by IP (default)
});

// Strict limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                       // Only 5 login attempts per 15 min
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,  // Don't count successful logins
});

// Apply limits
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
\`\`\`

### Rate Limit Headers

\`\`\`
HTTP/1.1 200 OK
RateLimit-Limit: 100              ← Max requests in window
RateLimit-Remaining: 73           ← Requests remaining
RateLimit-Reset: 1700000900       ← Unix timestamp when window resets

HTTP/1.1 429 Too Many Requests    ← When limit is exceeded
Retry-After: 900                  ← Seconds until next request allowed
\`\`\`

### Redis-Backed Rate Limiting (Production)

\`\`\`javascript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100,          // 100 requests
  duration: 900,         // per 15 minutes
  blockDuration: 900,    // Block for 15 min if exceeded
});

async function rateLimitMiddleware(req, res, next) {
  try {
    const key = req.ip;
    const rateLimitRes = await rateLimiter.consume(key);

    res.set({
      'RateLimit-Limit': 100,
      'RateLimit-Remaining': rateLimitRes.remainingPoints,
      'RateLimit-Reset': new Date(Date.now() + rateLimitRes.msBeforeNext),
    });

    next();
  } catch (rateLimitRes) {
    res.set('Retry-After', Math.ceil(rateLimitRes.msBeforeNext / 1000));
    res.status(429).json({ error: 'Too many requests' });
  }
}
\`\`\`

---

## 2. Security Headers with Helmet

### What Helmet Does

Helmet is middleware that sets **15+ HTTP security headers** to protect against common attacks:

\`\`\`javascript
import helmet from 'helmet';

// ✅ Set all default security headers with one line
app.use(helmet());
\`\`\`

### Headers Set by Helmet

| Header | Purpose | Prevents |
|---|---|---|
| Content-Security-Policy | Controls allowed sources of scripts, styles, images | XSS, data injection |
| X-Content-Type-Options | Prevents MIME type sniffing | MIME confusion attacks |
| X-Frame-Options | Prevents page from being embedded in iframe | Clickjacking |
| Strict-Transport-Security | Forces HTTPS for future requests | Downgrade attacks |
| X-XSS-Protection | Legacy XSS filter (deprecated in modern browsers) | Reflected XSS |
| Referrer-Policy | Controls Referer header | Information leakage |
| X-DNS-Prefetch-Control | Controls DNS prefetching | Privacy leakage |
| X-Permitted-Cross-Domain-Policies | Controls Flash/PDF cross-domain | Cross-domain data theft |

### Custom Helmet Configuration

\`\`\`javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.myapp.com"],
      frameSrc: ["'none'"],          // No iframes allowed
      objectSrc: ["'none'"],         // No plugins
      upgradeInsecureRequests: [],   // Upgrade HTTP to HTTPS
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: {
    maxAge: 31536000,      // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
\`\`\`

---

## 3. HTTPS & TLS

### Why HTTPS?

HTTP transmits data in **plaintext** — anyone on the network can read it.

\`\`\`
HTTP:   Client ──── "password123" ──── Server     ← Readable by anyone
HTTPS:  Client ──── "a7x9#kQ2..." ──── Server     ← Encrypted
\`\`\`

### TLS Handshake (Simplified)

\`\`\`
1. Client Hello      → "I support TLS 1.3, these cipher suites"
2. Server Hello      → "Let's use TLS 1.3 with AES-256-GCM"
3. Certificate       → Server sends its SSL certificate
4. Key Exchange      → Both sides derive a shared secret
5. Encrypted Comms   → All data encrypted with shared key
\`\`\`

### HTTPS in Express (Development)

\`\`\`javascript
import https from 'https';
import fs from 'fs';
import express from 'express';

const app = express();

// Load self-signed certificates (dev only)
const options = {
  key: fs.readFileSync('certs/server.key'),
  cert: fs.readFileSync('certs/server.cert'),
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS server running on port 443');
});
\`\`\`

### Force HTTPS in Production

\`\`\`javascript
// Redirect HTTP to HTTPS
function forceHTTPS(req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, \`https://\${req.hostname}\${req.url}\`);
  }
  next();
}

app.use(forceHTTPS);

// HSTS header — browser remembers to always use HTTPS
app.use(helmet.hsts({
  maxAge: 31536000,         // 1 year in seconds
  includeSubDomains: true,
  preload: true,            // Submit to browser preload list
}));
\`\`\`

---

## Complete Production Security Setup

\`\`\`javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

// 3. Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));

// 4. Body parsing with size limits
app.use(express.json({ limit: '10kb' }));  // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Force HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, \`https://\${req.hostname}\${req.url}\`);
    }
    next();
  });
}

// 6. Remove powered-by header
app.disable('x-powered-by');  // helmet() also does this
\`\`\`

---

## Security Checklist

| Category | Item | Status |
|---|---|---|
| Transport | HTTPS everywhere | ☐ |
| Transport | HSTS header enabled | ☐ |
| Headers | Helmet middleware | ☐ |
| Headers | CSP configured | ☐ |
| Rate Limiting | Auth endpoints (strict) | ☐ |
| Rate Limiting | General API (moderate) | ☐ |
| Input | Body size limits | ☐ |
| Input | Request validation | ☐ |
| CORS | Specific origin allowlist | ☐ |
| Logging | Security events logged | ☐ |
`,
  },
];
