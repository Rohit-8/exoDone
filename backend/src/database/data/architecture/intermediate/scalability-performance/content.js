// ============================================================================
// Scalability & Performance — Content
// ============================================================================

export const topic = {
  "name": "Scalability & Performance",
  "slug": "scalability-performance",
  "description": "Scale systems to handle millions of users — caching, load balancing, CDNs, horizontal scaling, and performance optimization.",
  "estimated_time": 220,
  "order_index": 3
};

export const lessons = [
  {
    title: "Caching Strategies",
    slug: "caching-strategies",
    summary: "Implement multi-layer caching with Redis, CDNs, and in-memory caches to dramatically reduce latency.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "Caching reduces latency by storing frequently accessed data closer to the consumer",
  "Cache layers: Browser → CDN → API Gateway → Application → Database",
  "Cache-aside (lazy loading): check cache first, load from DB on miss",
  "Write-through: write to cache AND database simultaneously",
  "Cache invalidation is the hardest problem — TTL, event-based, versioned keys"
],
    content: `# Caching Strategies

## The Caching Pyramid

\`\`\`
  Browser Cache        ← fastest (0ms)
  CDN Cache            ← edge servers (~10ms)
  API Gateway Cache    ← aggregate cache
  Application Cache    ← Redis/Memcached (~1ms)
  Database Cache       ← query result cache
  Database Disk        ← slowest (~10ms)
\`\`\`

## Cache-Aside (Lazy Loading)

\`\`\`javascript
async function getUser(userId) {
  // 1. Check cache
  const cached = await redis.get(\`user:\${userId}\`);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — load from database
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

  // 3. Populate cache with TTL
  await redis.setEx(\`user:\${userId}\`, 3600, JSON.stringify(user));

  return user;
}
\`\`\`

## Write-Through

\`\`\`javascript
async function updateUser(userId, data) {
  // 1. Update database
  const user = await db.query(
    'UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *',
    [data.name, data.email, userId]
  );

  // 2. Update cache simultaneously
  await redis.setEx(\`user:\${userId}\`, 3600, JSON.stringify(user));

  return user;
}
\`\`\`

## Cache Invalidation Patterns

| Pattern | How | When |
|---|---|---|
| TTL (Time-to-Live) | Key auto-expires | Data can be slightly stale |
| Event-based | Invalidate on write events | Need real-time consistency |
| Versioned keys | \`user:42:v3\` | When data changes rarely |
| Tag-based | Group keys by tag, flush tag | Related data changes together |

## CDN Caching

\`\`\`javascript
// Set Cache-Control headers for static assets
app.use('/static', express.static('public', {
  maxAge: '1y',               // Cache for 1 year
  immutable: true,             // Won't change (use versioned filenames)
}));

// API responses with short cache
app.get('/api/products', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
  res.json(products);
});
\`\`\`

## When NOT to Cache

- **User-specific data with high write frequency** — cache misses dominate
- **Real-time data** (stock prices, live scores) — stale data is unacceptable
- **Low-traffic endpoints** — caching overhead exceeds benefit
`,
  },
  {
    title: "Load Balancing & Horizontal Scaling",
    slug: "load-balancing-horizontal-scaling",
    summary: "Distribute traffic across multiple server instances with load balancers and design for horizontal scalability.",
    difficulty_level: "intermediate",
    estimated_time: 30,
    order_index: 2,
    key_points: [
  "Vertical scaling (bigger machine) has limits; horizontal scaling (more machines) is the path to millions of users",
  "Load balancers distribute requests across multiple server instances",
  "Algorithms: Round Robin, Least Connections, IP Hash, Weighted",
  "Stateless servers are critical — no session data on the server",
  "Store shared state in Redis/database, not in server memory"
],
    content: `# Load Balancing & Horizontal Scaling

## Vertical vs Horizontal Scaling

| | Vertical (Scale Up) | Horizontal (Scale Out) |
|---|---|---|
| How | Bigger machine (more CPU/RAM) | More machines |
| Limit | Hardware ceiling | Nearly unlimited |
| Downtime | Often requires restart | Zero-downtime adds |
| Cost | Exponential at high end | Linear |

## Load Balancer

\`\`\`
                     ┌──────────────┐
     Client ────────►│ Load Balancer│
                     └──────┬───────┘
                     ┌──────┼───────┐
                     ▼      ▼       ▼
                  Server  Server  Server
                    #1      #2      #3
\`\`\`

### Algorithms

| Algorithm | How | Best For |
|---|---|---|
| Round Robin | Sequential rotation | Equal servers, simple |
| Least Connections | Routes to least busy | Varying request durations |
| IP Hash | Same client → same server | Session affinity (avoid if possible) |
| Weighted | Higher weight = more traffic | Mixed hardware capabilities |

## Stateless Server Design

\`\`\`javascript
// ❌ Stateful — breaks with multiple servers!
const sessions = {};  // In-memory
app.post('/login', (req, res) => {
  sessions[req.sessionId] = { userId: 42 };
});

// ✅ Stateless — works with any number of servers
// Store sessions in Redis (shared across all instances)
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
\`\`\`

## Nginx Load Balancer Config

\`\`\`nginx
upstream api_servers {
    least_conn;
    server 10.0.0.1:5000 weight=3;
    server 10.0.0.2:5000 weight=2;
    server 10.0.0.3:5000 weight=1;
}

server {
    listen 80;

    location /api/ {
        proxy_pass http://api_servers;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
\`\`\`
`,
  },
];
