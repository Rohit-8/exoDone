// ============================================================================
// Security Architecture — Code Examples
// ============================================================================

const examples = {
  'owasp-top-10-secure-coding': [
    {
      title: "Security Middleware Suite",
      description: "A comprehensive set of security middleware for Express.js.",
      language: "javascript",
      code: `import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// 1. Security headers
app.use(helmet());

// 2. CORS configuration
app.use(cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// 3. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
});
app.use('/api', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // 10 login attempts
  message: { error: 'Too many login attempts' },
});
app.use('/api/auth/login', authLimiter);

// 4. Request size limit (prevent large payload attacks)
app.use(express.json({ limit: '10kb' }));

// 5. Input sanitization middleware
function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = value.replace(/<script[^>]*>.*?<\\/script>/gi, '');
      }
    }
  }
  next();
}
app.use(sanitizeInput);

// 6. Security event logging
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('[SECURITY]', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        userAgent: req.get('user-agent'),
      });
    }
  });
  next();
});`,
      explanation: "This comprehensive security setup includes Helmet for headers, strict CORS, rate limiting (with stricter limits on auth), payload size limits, basic XSS sanitization, and security event logging.",
      order_index: 1,
    },
  ],
};

export default examples;
