const examples = {
  "owasp-top-10-secure-coding": [
    {
      title: "SQL Injection Prevention with Parameterized Queries",
      description:
        "Demonstrates the difference between vulnerable string concatenation and secure parameterized queries. Shows how to safely interact with a database using pg (node-postgres) and prevent SQL injection attacks.",
      language: "javascript",
      code: `const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ============================================================
// VULNERABLE: SQL Injection via string concatenation
// ============================================================
// An attacker can submit: email = "' OR '1'='1' --"
// This turns the query into: SELECT * FROM users WHERE email = '' OR '1'='1' --'
// Which returns ALL users from the database.
async function getUserVulnerable(email) {
  const query = "SELECT * FROM users WHERE email = '" + email + "'";
  const result = await pool.query(query);
  return result.rows[0];
}

// ============================================================
// SECURE: Parameterized query prevents injection
// ============================================================
// The database driver treats $1 as a DATA placeholder, not SQL code.
// Even if the attacker submits "' OR '1'='1' --", it is treated as
// a literal string value and will match no rows.
async function getUserSecure(email) {
  const query = 'SELECT id, email, name, role FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

// ============================================================
// SECURE: Using a query builder (Knex.js) for complex queries
// ============================================================
// Query builders and ORMs automatically parameterize values.
const knex = require('knex')({ client: 'pg', connection: process.env.DATABASE_URL });

async function searchUsersSecure(filters) {
  const query = knex('users')
    .select('id', 'email', 'name', 'role')
    .where('active', true);

  if (filters.name) {
    query.where('name', 'ilike', \`%\${filters.name}%\`); // Knex parameterizes this
  }
  if (filters.role) {
    query.where('role', filters.role);
  }
  if (filters.minAge) {
    query.where('age', '>=', filters.minAge);
  }

  return query;
}

// ============================================================
// SECURE: Stored procedure approach for critical operations
// ============================================================
async function transferFunds(fromAccountId, toAccountId, amount) {
  // Use a transaction with parameterized queries
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate amount server-side
    if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
      throw new Error('Invalid transfer amount');
    }

    const debit = await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance',
      [amount, fromAccountId]
    );

    if (debit.rowCount === 0) {
      throw new Error('Insufficient funds or account not found');
    }

    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toAccountId]
    );

    await client.query('COMMIT');
    return { success: true, newBalance: debit.rows[0].balance };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}`,
      explanation:
        "SQL injection remains one of the most dangerous web vulnerabilities. The key defense is to NEVER build SQL queries by concatenating user input. Instead, use parameterized queries (also called prepared statements) where user input is passed as parameters that the database engine treats as data, not executable SQL. This example shows the vulnerable pattern, the secure parameterized approach using pg, a query builder approach with Knex.js, and a transactional pattern for critical operations. In interviews, always emphasize that parameterized queries are the primary defense, and that ORMs/query builders provide this protection automatically.",
      order_index: 1,
    },
    {
      title: "XSS Protection Middleware & Output Encoding",
      description:
        "Implements middleware that protects against Cross-Site Scripting (XSS) attacks through input sanitization, output encoding, and Content Security Policy headers.",
      language: "javascript",
      code: `const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const escapeHtml = require('escape-html');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// ============================================================
// Middleware 1: Sanitize all incoming request body fields
// ============================================================
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = deepSanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = deepSanitize(req.params);
  }
  next();
}

function deepSanitize(obj) {
  if (typeof obj === 'string') {
    // Strip all HTML tags for plain text fields
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }
  return obj;
}

// ============================================================
// Middleware 2: Context-aware output encoding helper
// ============================================================
const outputEncoder = {
  // For inserting into HTML body content
  forHTML(str) {
    return escapeHtml(String(str));
  },

  // For inserting into HTML attribute values
  forAttribute(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  // For inserting into JavaScript string contexts
  forJS(str) {
    return JSON.stringify(String(str));
  },

  // For inserting into URL parameters
  forURL(str) {
    return encodeURIComponent(String(str));
  },

  // For inserting into CSS values
  forCSS(str) {
    return String(str).replace(/[^a-zA-Z0-9]/g, (char) => {
      return '\\\\' + char.charCodeAt(0).toString(16) + ' ';
    });
  },
};

// ============================================================
// Middleware 3: CSP nonce generation for inline scripts
// ============================================================
const crypto = require('crypto');

function cspNonceMiddleware(req, res, next) {
  // Generate a unique nonce per request
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');

  // Set CSP header with the nonce
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      \`script-src 'self' 'nonce-\${res.locals.cspNonce}'\`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  next();
}

// ============================================================
// Usage Example: Secure template rendering
// ============================================================
const express = require('express');
const app = express();

app.use(sanitizeInput);
app.use(cspNonceMiddleware);

// Rendering user-generated content safely
app.get('/profile/:userId', async (req, res) => {
  const user = await getUserById(req.params.userId);

  // All dynamic values are encoded for their context
  const html = \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <h1>\${outputEncoder.forHTML(user.name)}</h1>
      <a href="/users/\${outputEncoder.forURL(user.id)}">Profile Link</a>
      <div class="bio">\${outputEncoder.forHTML(user.bio)}</div>
      <script nonce="\${res.locals.cspNonce}">
        const userData = \${outputEncoder.forJS(user.name)};
      </script>
    </body>
    </html>
  \`;

  res.send(html);
});

module.exports = { sanitizeInput, outputEncoder, cspNonceMiddleware };`,
      explanation:
        "XSS attacks occur when an application includes untrusted data in web pages without proper validation or encoding. This example demonstrates a three-layer defense: (1) Input sanitization middleware that strips HTML tags from all incoming request data using DOMPurify, (2) Context-aware output encoding with dedicated functions for HTML body, attributes, JavaScript, URL, and CSS contexts — because the encoding strategy differs based on WHERE the data is inserted, and (3) Content Security Policy with per-request nonces that prevent execution of injected scripts even if encoding is missed. In interviews, emphasize that output encoding is the primary XSS defense and must be context-specific, while CSP is a defense-in-depth layer.",
      order_index: 2,
    },
    {
      title: "Secure Authentication Implementation",
      description:
        "A complete secure authentication system with Argon2 password hashing, JWT token management with refresh tokens, rate limiting, and account lockout protection.",
      language: "javascript",
      code: `const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// ============================================================
// Password Hashing with Argon2id
// ============================================================
const HASH_OPTIONS = {
  type: argon2.argon2id,  // Hybrid: resistant to side-channel + GPU attacks
  memoryCost: 65536,      // 64 MB of memory
  timeCost: 3,            // 3 iterations
  parallelism: 4,         // 4 parallel threads
};

async function hashPassword(password) {
  return argon2.hash(password, HASH_OPTIONS);
}

async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    // If the hash is in an old format, return false
    return false;
  }
}

// ============================================================
// Token Generation: Short-lived access + long-lived refresh
// ============================================================
function generateTokenPair(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m', issuer: 'myapp', audience: 'myapp-client' }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
      jti: crypto.randomUUID(), // Unique ID for revocation tracking
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d', issuer: 'myapp', audience: 'myapp-client' }
  );

  return { accessToken, refreshToken };
}

// ============================================================
// Rate Limiting: Prevent brute-force attacks
// ============================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 10,                    // Max 10 attempts per window
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    return req.ip + ':' + (req.body.email || 'unknown');
  },
});

// ============================================================
// Account Lockout: Lock after consecutive failed attempts
// ============================================================
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

async function checkAccountLockout(db, email) {
  const result = await db.query(
    'SELECT failed_login_attempts, locked_until FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    // Don't reveal whether the email exists
    return { locked: false, userExists: false };
  }

  const user = result.rows[0];
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { locked: true, userExists: true };
  }

  return { locked: false, userExists: true, failedAttempts: user.failed_login_attempts };
}

async function recordFailedLogin(db, email) {
  const result = await db.query(
    \`UPDATE users
     SET failed_login_attempts = failed_login_attempts + 1,
         last_failed_login = NOW()
     WHERE email = $1
     RETURNING failed_login_attempts\`,
    [email]
  );

  if (result.rows.length > 0 && result.rows[0].failed_login_attempts >= LOCKOUT_THRESHOLD) {
    await db.query(
      'UPDATE users SET locked_until = $1 WHERE email = $2',
      [new Date(Date.now() + LOCKOUT_DURATION_MS), email]
    );
  }
}

async function resetFailedLogins(db, email) {
  await db.query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = $1',
    [email]
  );
}

// ============================================================
// Login Handler: Putting it all together
// ============================================================
async function loginHandler(req, res) {
  const { email, password } = req.body;

  // 1. Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 2. Check lockout status
    const lockout = await checkAccountLockout(req.db, email);
    if (lockout.locked) {
      // Use generic message to avoid enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Fetch user
    const result = await req.db.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    // 4. Verify password (constant-time comparison via argon2)
    if (!user || !(await verifyPassword(user.password_hash, password))) {
      // Record failed attempt (only if user exists, but respond the same)
      if (user) await recordFailedLogin(req.db, email);

      // IMPORTANT: Same response whether user exists or not (prevents enumeration)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 5. Reset failed login counter on success
    await resetFailedLogins(req.db, email);

    // 6. Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // 7. Store refresh token hash in database (not the raw token)
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await req.db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    // 8. Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh',        // Only sent to refresh endpoint
    });

    // 9. Return access token in response body
    res.json({
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// Mount with rate limiting
// app.post('/api/auth/login', loginLimiter, loginHandler);

module.exports = {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  loginLimiter,
  loginHandler,
};`,
      explanation:
        "This example implements a production-grade authentication system addressing multiple OWASP Top 10 concerns. Key security features: (1) Argon2id for password hashing — the recommended algorithm that is resistant to both side-channel and GPU-based attacks, (2) JWT access/refresh token pattern — short-lived access tokens (15 min) limit the damage if stolen, while refresh tokens (7 days) are stored as httpOnly cookies and their hashes are tracked in the database for revocation, (3) Rate limiting per IP+email prevents brute-force attacks, (4) Account lockout after 5 consecutive failures provides an additional layer, (5) Generic error messages prevent user enumeration — the response is identical whether the email exists or not, (6) Refresh tokens are stored as SHA-256 hashes in the database so even a database breach doesn't expose valid tokens. In interviews, discuss the tradeoffs: JWTs are stateless but harder to revoke, session tokens are stateful but simpler to invalidate.",
      order_index: 3,
    },
    {
      title: "Comprehensive Security Headers Middleware",
      description:
        "A complete security headers middleware that hardens HTTP responses against common web attacks including XSS, clickjacking, MIME sniffing, and information leakage.",
      language: "javascript",
      code: `const crypto = require('crypto');

// ============================================================
// Comprehensive Security Headers Middleware
// ============================================================
function securityHeaders(options = {}) {
  const {
    // HSTS: Force HTTPS for 2 years, include subdomains, allow preload list
    hstsMaxAge = 63072000,
    hstsIncludeSubDomains = true,
    hstsPreload = true,

    // CSP directives (customizable)
    cspDirectives = null,

    // Allowed frame ancestors (clickjacking protection)
    frameAncestors = "'none'",

    // Referrer policy
    referrerPolicy = 'strict-origin-when-cross-origin',

    // Permissions policy
    permissionsPolicy = {
      camera: [],
      microphone: [],
      geolocation: [],
      'interest-cohort': [], // Block FLoC tracking
      payment: [],
      usb: [],
    },
  } = options;

  return (req, res, next) => {
    // --------------------------------------------------------
    // 1. Strict-Transport-Security (HSTS)
    //    Forces browsers to only connect via HTTPS.
    //    Prevents SSL stripping attacks (e.g., MITM downgrades).
    // --------------------------------------------------------
    let hstsValue = \`max-age=\${hstsMaxAge}\`;
    if (hstsIncludeSubDomains) hstsValue += '; includeSubDomains';
    if (hstsPreload) hstsValue += '; preload';
    res.setHeader('Strict-Transport-Security', hstsValue);

    // --------------------------------------------------------
    // 2. X-Content-Type-Options
    //    Prevents MIME type sniffing. Browsers will only use
    //    the declared Content-Type, preventing attacks where
    //    a file is served as a different type.
    // --------------------------------------------------------
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // --------------------------------------------------------
    // 3. X-Frame-Options
    //    Prevents clickjacking by controlling whether the page
    //    can be loaded in an iframe. Use 'DENY' or 'SAMEORIGIN'.
    //    Note: CSP frame-ancestors supersedes this but X-Frame-Options
    //    is still needed for older browsers.
    // --------------------------------------------------------
    res.setHeader('X-Frame-Options', 'DENY');

    // --------------------------------------------------------
    // 4. Content-Security-Policy (CSP)
    //    The most powerful header for preventing XSS, data injection,
    //    and other code execution attacks. Each directive controls
    //    what sources are allowed for different content types.
    // --------------------------------------------------------
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    const defaultDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", \`'nonce-\${nonce}'\`],
      'style-src': ["'self'", \`'nonce-\${nonce}'\`],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'frame-ancestors': [frameAncestors],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
    };

    const directives = cspDirectives || defaultDirectives;
    const cspString = Object.entries(directives)
      .map(([key, values]) => {
        if (values.length === 0) return key;
        return \`\${key} \${values.join(' ')}\`;
      })
      .join('; ');

    res.setHeader('Content-Security-Policy', cspString);

    // --------------------------------------------------------
    // 5. Referrer-Policy
    //    Controls how much referrer information is sent with
    //    requests. 'strict-origin-when-cross-origin' sends the
    //    origin for cross-origin requests and full URL for
    //    same-origin requests (only over HTTPS).
    // --------------------------------------------------------
    res.setHeader('Referrer-Policy', referrerPolicy);

    // --------------------------------------------------------
    // 6. Permissions-Policy (formerly Feature-Policy)
    //    Restricts which browser features the page can use.
    //    An empty list () means the feature is disabled entirely.
    // --------------------------------------------------------
    const permPolicyString = Object.entries(permissionsPolicy)
      .map(([feature, allowList]) => {
        if (allowList.length === 0) return \`\${feature}=()\`;
        return \`\${feature}=(\${allowList.join(' ')})\`;
      })
      .join(', ');
    res.setHeader('Permissions-Policy', permPolicyString);

    // --------------------------------------------------------
    // 7. Cache-Control for sensitive responses
    //    Prevents caching of pages that contain sensitive data.
    // --------------------------------------------------------
    if (req.path.startsWith('/api/') || req.path.startsWith('/dashboard')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    // --------------------------------------------------------
    // 8. Remove server identification headers
    //    Attackers use these to identify the tech stack and
    //    find known vulnerabilities for specific versions.
    // --------------------------------------------------------
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // --------------------------------------------------------
    // 9. Cross-Origin headers for isolation
    //    Protects against Spectre-style side-channel attacks
    //    by isolating the browsing context.
    // --------------------------------------------------------
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    next();
  };
}

// ============================================================
// Usage
// ============================================================
const express = require('express');
const app = express();

// Apply to all routes
app.use(securityHeaders());

// Or with custom options for specific needs
app.use(securityHeaders({
  hstsMaxAge: 31536000,
  referrerPolicy: 'no-referrer',
  permissionsPolicy: {
    camera: ["'self'"],               // Allow camera for own domain only
    microphone: [],                   // Block microphone entirely
    geolocation: ["'self'"],          // Allow geolocation for own domain
    'interest-cohort': [],            // Block FLoC
    payment: ["'self'", 'https://payments.example.com'],
    usb: [],
  },
}));

// ============================================================
// Verify headers with a test endpoint
// ============================================================
app.get('/api/security-check', (req, res) => {
  const headers = res.getHeaders();
  res.json({
    message: 'Security headers are configured',
    nonce: res.locals.cspNonce,
    appliedHeaders: Object.keys(headers).filter(h =>
      ['strict-transport-security', 'content-security-policy',
       'x-content-type-options', 'x-frame-options', 'referrer-policy',
       'permissions-policy', 'cross-origin-opener-policy'].includes(h)
    ),
  });
});

module.exports = securityHeaders;`,
      explanation:
        "Security headers are a critical defense-in-depth layer that instructs browsers how to behave when handling your site's content. This middleware configures 9 security header categories: (1) HSTS forces HTTPS and prevents SSL stripping, (2) X-Content-Type-Options prevents MIME sniffing attacks, (3) X-Frame-Options prevents clickjacking, (4) CSP with per-request nonces is the most powerful XSS defense — it whitelists content sources and blocks everything else, (5) Referrer-Policy controls information leakage via the Referer header, (6) Permissions-Policy restricts browser features like camera and geolocation, (7) Cache-Control prevents caching of sensitive API responses, (8) Server header removal prevents tech stack fingerprinting, (9) Cross-Origin isolation headers protect against Spectre-style attacks. In interviews, be able to explain what each header prevents and the tradeoffs of strict vs. permissive policies.",
      order_index: 4,
    },
  ],
};

export default examples;
