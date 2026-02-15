// ============================================================================
// Security Architecture — Content
// ============================================================================

export const topic = {
  "name": "Security Architecture",
  "slug": "security-architecture",
  "description": "Design secure systems — threat modeling, OWASP Top 10, zero trust, encryption, and defense in depth.",
  "estimated_time": 230,
  "order_index": 7
};

export const lessons = [
  {
    title: "OWASP Top 10 & Secure Coding",
    slug: "owasp-top-10-secure-coding",
    summary: "Understand the most critical web application security risks and how to defend against them.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "OWASP Top 10: the most critical web application security risks",
  "Injection (SQL, XSS, Command): always validate and sanitize input",
  "Broken Authentication: use strong password hashing, MFA, and session management",
  "Security Misconfiguration: disable defaults, patch dependencies, use security headers",
  "Defense in Depth: multiple layers of security — not just one"
],
    content: `# OWASP Top 10 & Secure Coding

## OWASP Top 10 (2021)

| # | Risk | Defense |
|---|---|---|
| A01 | Broken Access Control | Deny by default, validate ownership |
| A02 | Cryptographic Failures | Use strong encryption, no sensitive data in URLs |
| A03 | Injection (SQL, XSS, LDAP) | Parameterized queries, CSP, input validation |
| A04 | Insecure Design | Threat modeling, secure design patterns |
| A05 | Security Misconfiguration | Harden defaults, automated config checks |
| A06 | Vulnerable Components | SCA tools, dependency updates |
| A07 | Auth Failures | MFA, rate limiting, strong passwords |
| A08 | Data Integrity Failures | Verify downloads, CI/CD security |
| A09 | Logging Failures | Log security events, monitor alerts |
| A10 | SSRF | Validate/sanitize URLs, network segmentation |

## SQL Injection Prevention

\`\`\`javascript
// ❌ Vulnerable to SQL Injection
app.get('/users', async (req, res) => {
  const result = await pool.query(
    \`SELECT * FROM users WHERE name = '\${req.query.name}'\`
  );
  // Attacker sends: ?name=' OR '1'='1
  // Executed: SELECT * FROM users WHERE name = '' OR '1'='1'
});

// ✅ Parameterized query — safe!
app.get('/users', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE name = $1',
    [req.query.name]
  );
});
\`\`\`

## Cross-Site Scripting (XSS) Prevention

\`\`\`javascript
// ✅ Content Security Policy header
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],        // No inline scripts!
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// ✅ Sanitize user-generated HTML
import DOMPurify from 'isomorphic-dompurify';
const cleanHTML = DOMPurify.sanitize(userInput);
\`\`\`

## Security Headers

\`\`\`javascript
import helmet from 'helmet';

app.use(helmet());  // Sets these headers:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 0  (CSP is better)
// Strict-Transport-Security: max-age=15552000
// Content-Security-Policy: default-src 'self'
// Referrer-Policy: no-referrer
\`\`\`

## Defense in Depth

\`\`\`
┌──────────────────────────────────────┐
│ Layer 1: Network (Firewall, WAF)     │
│ ┌──────────────────────────────────┐ │
│ │ Layer 2: Application (Auth, CSP) │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ Layer 3: Data (Encryption)   │ │ │
│ │ │ ┌────────────────────────┐   │ │ │
│ │ │ │ Layer 4: Monitoring    │   │ │ │
│ │ │ └────────────────────────┘   │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
\`\`\`
`,
  },
];
