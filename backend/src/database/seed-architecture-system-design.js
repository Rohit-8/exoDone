import pool from '../config/database.js';

async function seedSystemDesign() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding System Design Case Studies lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'system-design-cases'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'System Design: Real-World Case Studies', 'system-design-case-studies', $2, 'Learn how to design scalable systems like URL shortener, social media, and more', 'advanced', 70, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# System Design: Real-World Case Studies

## Case Study 1: URL Shortener (like Bit.ly)

### Requirements

**Functional:**
- Given long URL, generate short URL
- Short URL redirects to original URL
- Custom short URLs (optional)
- Analytics (clicks, geography, etc.)

**Non-Functional:**
- High availability
- Low latency redirection
- Handle billions of URLs
- 100:1 read/write ratio

### Capacity Estimation

\\\`\\\`\\\`
Assumptions:
- 500M new URLs per month
- 100:1 read/write ratio
- 50B redirections per month

Storage:
- 500M URLs/month × 12 months × 5 years = 30B URLs
- Average URL: 500 bytes
- 30B × 500 bytes = 15 TB

Bandwidth:
- Write: 500M URLs/month = ~200 URLs/sec
- Read: 200 × 100 = 20,000 redirects/sec
\\\`\\\`\\\`

### API Design

\\\`\\\`\\\`
POST /api/shorten
Body: { "longUrl": "https://example.com/very/long/url" }
Response: { "shortUrl": "https://short.ly/abc123" }

GET /:shortCode
Response: 302 Redirect to original URL

GET /api/analytics/:shortCode
Response: { "clicks": 1234, "locations": {...} }
\\\`\\\`\\\`

### Database Schema

\\\`\\\`\\\`sql
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    INDEX idx_short_code (short_code)
);

CREATE TABLE analytics (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) NOT NULL,
    clicked_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    country VARCHAR(2),
    referrer TEXT,
    INDEX idx_short_code (short_code),
    INDEX idx_clicked_at (clicked_at)
);
\\\`\\\`\\\`

### Short Code Generation

**Option 1: Base62 Encoding**
\\\`\\\`\\\`javascript
function generateShortCode(id) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let shortCode = '';
  
  while (id > 0) {
    shortCode = chars[id % 62] + shortCode;
    id = Math.floor(id / 62);
  }
  
  return shortCode.padStart(7, '0');
}

// Example: ID 123456789 → "8M0kX"
\\\`\\\`\\\`

**Option 2: Random + Collision Check**
\\\`\\\`\\\`javascript
async function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortCode;
  let exists = true;
  
  while (exists) {
    shortCode = '';
    for (let i = 0; i < 7; i++) {
      shortCode += chars[Math.floor(Math.random() * 62)];
    }
    
    exists = await db.query('SELECT 1 FROM urls WHERE short_code = $1', [shortCode]);
  }
  
  return shortCode;
}
\\\`\\\`\\\`

### Architecture

\\\`\\\`\\\`
┌──────────┐
│  Client  │
└────┬─────┘
     │
     ▼
┌────────────┐
│   CDN      │  ← Static content
└────┬───────┘
     │
     ▼
┌────────────┐
│Load Balancer│
└────┬───────┘
     │
     ├──────┬──────┬──────┐
     ▼      ▼      ▼      ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│App 1│ │App 2│ │App 3│ │App 4│
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │       │       │       │
   └───────┴───┬───┴───────┘
               │
          ┌────▼────┐
          │  Redis  │  ← Cache
          │ (Cache) │
          └────┬────┘
               │
          ┌────▼────┐
          │Database │
          │(Postgres)│
          └─────────┘
\\\`\\\`\\\`

### Caching Strategy

\\\`\\\`\\\`javascript
async function redirect(shortCode) {
  // 1. Check cache
  let longUrl = await redis.get(\\\`url:\\\${shortCode}\\\`);
  
  if (longUrl) {
    // Cache hit
    await trackAnalytics(shortCode); // Async
    return longUrl;
  }
  
  // 2. Cache miss - query database
  const result = await db.query(
    'SELECT long_url FROM urls WHERE short_code = $1',
    [shortCode]
  );
  
  if (result.rows.length === 0) {
    throw new Error('URL not found');
  }
  
  longUrl = result.rows[0].long_url;
  
  // 3. Store in cache (24 hour TTL)
  await redis.setex(\\\`url:\\\${shortCode}\\\`, 86400, longUrl);
  
  await trackAnalytics(shortCode);
  
  return longUrl;
}
\\\`\\\`\\\`

## Case Study 2: Twitter Feed

### Requirements

**Functional:**
- Post tweets (280 characters)
- Follow/unfollow users
- View home timeline (tweets from followed users)
- View user timeline (specific user's tweets)

**Non-Functional:**
- 200M active users
- Average user follows 200 people
- 100M tweets per day
- Home timeline: < 200ms latency

### Capacity Estimation

\\\`\\\`\\\`
Storage:
- 100M tweets/day × 280 bytes = 28 GB/day
- 28 GB × 365 days × 5 years = 51 TB

Timeline Generation:
- 200M users × 2 timeline views/day = 400M timeline requests/day
- 400M / 86400 = ~4,630 requests/sec
\\\`\\\`\\\`

### Database Schema

\\\`\\\`\\\`sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    created_at TIMESTAMP
);

CREATE TABLE tweets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    content TEXT,
    created_at TIMESTAMP,
    INDEX idx_user_created (user_id, created_at DESC)
);

CREATE TABLE follows (
    follower_id BIGINT REFERENCES users(id),
    followee_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id),
    INDEX idx_follower (follower_id)
);
\\\`\\\`\\\`

### Timeline Generation

**Option 1: Fan-out on Read (Pull Model)**

Generate timeline when user requests it:

\\\`\\\`\\\`javascript
async function getHomeTimeline(userId, limit = 50) {
  // 1. Get list of followed users
  const follows = await db.query(
    'SELECT followee_id FROM follows WHERE follower_id = $1',
    [userId]
  );
  
  const followeeIds = follows.rows.map(r => r.followee_id);
  followeeIds.push(userId); // Include own tweets
  
  // 2. Get recent tweets from all followed users
  const tweets = await db.query(\\\`
    SELECT * FROM tweets 
    WHERE user_id = ANY($1)
    ORDER BY created_at DESC
    LIMIT $2
  \\\`, [followeeIds, limit]);
  
  return tweets.rows;
}
\\\`\\\`\\\`

**Pros:** Simple, consistent
**Cons:** Slow for users following many people

**Option 2: Fan-out on Write (Push Model)**

Pre-compute timelines when tweet is posted:

\\\`\\\`\\\`javascript
async function postTweet(userId, content) {
  // 1. Save tweet
  const tweet = await db.query(
    'INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING *',
    [userId, content]
  );
  
  // 2. Get all followers
  const followers = await db.query(
    'SELECT follower_id FROM follows WHERE followee_id = $1',
    [userId]
  );
  
  // 3. Push tweet to all followers' timelines (async)
  for (const follower of followers.rows) {
    await redis.lpush(\\\`timeline:\\\${follower.follower_id}\\\`, tweet.id);
    await redis.ltrim(\\\`timeline:\\\${follower.follower_id}\\\`, 0, 999); // Keep last 1000
  }
  
  return tweet;
}

async function getHomeTimeline(userId, limit = 50) {
  // Simply read from pre-computed timeline
  const tweetIds = await redis.lrange(\\\`timeline:\\\${userId}\\\`, 0, limit - 1);
  
  // Fetch tweet details (could be cached too)
  const tweets = await db.query(
    'SELECT * FROM tweets WHERE id = ANY($1) ORDER BY created_at DESC',
    [tweetIds]
  );
  
  return tweets.rows;
}
\\\`\\\`\\\`

**Pros:** Fast reads
**Cons:** Slow writes for celebrities (millions of followers)

**Option 3: Hybrid Approach** (Twitter's actual approach)

- **Regular users**: Fan-out on write
- **Celebrities**: Fan-out on read
- Mix results at read time

### Architecture

\\\`\\\`\\\`
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      ▼
┌─────────────┐
│ Load Balancer│
└─────┬───────┘
      │
      ├────────┬────────┬────────┐
      ▼        ▼        ▼        ▼
  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
  │Web1 │  │Web2 │  │Web3 │  │Web4 │
  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
     │        │        │        │
     └────────┴────┬───┴────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌──────────┐
│  Redis  │  │Cassandra│  │PostgreSQL│
│(Timeline)│  │(Tweets) │  │  (Users) │
└─────────┘  └─────────┘  └──────────┘
\\\`\\\`\\\`

## Case Study 3: Instagram

### Requirements

**Functional:**
- Upload photos/videos
- Follow users
- View feed
- Like/comment
- Stories (24h expiry)

**Non-Functional:**
- 1B active users
- 95M photos/videos per day
- Average file size: 500KB
- Feed latency: < 300ms

### Storage

\\\`\\\`\\\`
Daily: 95M × 500KB = 47.5 TB/day
Yearly: 47.5 TB × 365 = 17.3 PB/year

Solution: Object storage (AWS S3, Azure Blob Storage)
\\\`\\\`\\\`

### Image Processing Pipeline

\\\`\\\`\\\`javascript
async function uploadPhoto(file, userId) {
  // 1. Upload original to S3
  const originalUrl = await s3.upload(\\\`originals/\\\${userId}/\\\${Date.now()}.jpg\\\`, file);
  
  // 2. Queue image processing job
  await queue.publish('image.process', {
    originalUrl,
    userId,
    sizes: ['thumbnail', 'medium', 'large']
  });
  
  // 3. Save to database
  const photo = await db.query(\\\`
    INSERT INTO photos (user_id, original_url, status)
    VALUES ($1, $2, 'processing')
    RETURNING *
  \\\`, [userId, originalUrl]);
  
  return photo;
}

// Worker process
queue.subscribe('image.process', async (job) => {
  const { originalUrl, userId, sizes } = job;
  
  // Download original
  const image = await downloadImage(originalUrl);
  
  // Generate multiple sizes
  for (const size of sizes) {
    const resized = await resizeImage(image, size);
    const url = await s3.upload(\\\`processed/\\\${userId}/\\\${size}.jpg\\\`, resized);
    
    await db.query(\\\`
      UPDATE photos
      SET \\\${size}_url = $1, status = 'completed'
      WHERE original_url = $2
    \\\`, [url, originalUrl]);
  }
});
\\\`\\\`\\\`

### CDN Strategy

\\\`\\\`\\\`
User Request → CDN (CloudFlare/Cloudfront)
                ↓ (cache miss)
              Origin Server (S3)
                ↓
            Cache at CDN
                ↓
          Serve from CDN (cache hit)
\\\`\\\`\\\`

## System Design Tips

### 1. Clarify Requirements

Ask:
- Functional vs non-functional requirements
- Scale (users, requests/sec, data size)
- Read/write ratio
- Latency requirements
- Consistency vs availability

### 2. Capacity Estimation

Calculate:
- Storage needs
- Bandwidth requirements
- QPS (queries per second)
- Memory for caching

### 3. API Design

Define:
- Endpoints
- Request/response formats
- Authentication
- Rate limiting

### 4. Database Design

Choose:
- SQL vs NoSQL
- Sharding strategy
- Replication
- Indexes

### 5. High-Level Design

Draw:
- Clients
- Load balancers
- Application servers
- Caches
- Databases
- Message queues
- CDN

### 6. Deep Dive

Discuss:
- Bottlenecks
- Scaling approaches
- Monitoring
- Security

### 7. Trade-offs

Explain:
- Why you chose specific technologies
- Alternative approaches
- Pros and cons

## Common Patterns

- **Caching**: Redis, Memcached
- **Load Balancing**: Nginx, HAProxy
- **Message Queue**: RabbitMQ, Kafka
- **Object Storage**: S3, Azure Blob
- **CDN**: CloudFlare, CloudFront
- **Database**: PostgreSQL, MongoDB, Cassandra
- **Search**: Elasticsearch
- **Monitoring**: Prometheus, Grafana

## Key Takeaways

1. Start with requirements clarification
2. Estimate capacity needs
3. Design API before architecture
4. Choose right database for use case
5. Use caching aggressively
6. Design for scalability from day 1
7. Monitor everything
8. Always discuss trade-offs`,
      [
        'Start by clarifying functional and non-functional requirements',
        'Estimate capacity needs (storage, bandwidth, QPS)',
        'Choose appropriate databases and caching strategies',
        'Always discuss trade-offs and alternative approaches'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'URL Shortener Service', 'Complete URL shortener implementation', 'javascript', $2, 'Production-ready URL shortener with caching and analytics', 1)
    `, [
      lesson.rows[0].id,
      `const express = require('express');
const redis = require('redis');
const { Pool } = require('pg');

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const cache = redis.createClient({ url: process.env.REDIS_URL });

app.use(express.json());

// Generate short code using base62
function generateShortCode(id) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  
  while (id > 0) {
    code = chars[id % 62] + code;
    id = Math.floor(id / 62);
  }
  
  return code.padStart(6, '0');
}

// Shorten URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl, customCode } = req.body;
    
    if (!longUrl || !isValidUrl(longUrl)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    
    let shortCode = customCode;
    
    if (customCode) {
      // Check if custom code available
      const exists = await db.query(
        'SELECT 1 FROM urls WHERE short_code = $1',
        [customCode]
      );
      
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: 'Custom code already taken' });
      }
    } else {
      // Generate short code
      const result = await db.query(\\\`
        INSERT INTO urls (long_url)
        VALUES ($1)
        RETURNING id
      \\\`, [longUrl]);
      
      shortCode = generateShortCode(result.rows[0].id);
      
      await db.query(
        'UPDATE urls SET short_code = $1 WHERE id = $2',
        [shortCode, result.rows[0].id]
      );
    }
    
    // Cache it
    await cache.setEx(\\\`url:\\\${shortCode}\\\`, 86400, longUrl);
    
    res.json({
      shortUrl: \\\`https://short.ly/\\\${shortCode}\\\`,
      shortCode,
      longUrl
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // 1. Check cache
    let longUrl = await cache.get(\\\`url:\\\${shortCode}\\\`);
    
    if (!longUrl) {
      // 2. Query database
      const result = await db.query(
        'SELECT long_url FROM urls WHERE short_code = $1',
        [shortCode]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).send('URL not found');
      }
      
      longUrl = result.rows[0].long_url;
      
      // Cache it
      await cache.setEx(\\\`url:\\\${shortCode}\\\`, 86400, longUrl);
    }
    
    // 3. Track analytics (async, don't wait)
    trackClick(shortCode, req);
    
    // 4. Redirect
    res.redirect(301, longUrl);
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Track click (non-blocking)
async function trackClick(shortCode, req) {
  try {
    await db.query(\\\`
      INSERT INTO analytics (short_code, ip_address, referrer, user_agent)
      VALUES ($1, $2, $3, $4)
    \\\`, [
      shortCode,
      req.ip,
      req.get('Referer'),
      req.get('User-Agent')
    ]);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

// Get analytics
app.get('/api/analytics/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const result = await db.query(\\\`
      SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_clicks,
        DATE(clicked_at) as date,
        COUNT(*) as clicks
      FROM analytics
      WHERE short_code = $1
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
      LIMIT 30
    \\\`, [shortCode]);
    
    res.json({
      shortCode,
      analytics: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

app.listen(3000, () => console.log('URL Shortener running on port 3000'));`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'In a URL shortener system, what is the main benefit of using Redis cache?', 'multiple_choice', $2, 'Faster redirects and reduced database load', 'Redis caching provides sub-millisecond latency for URL lookups, dramatically speeding up redirects and reducing load on the primary database. With a 100:1 read/write ratio, caching is essential.', 'medium', 15, 1),
      ($1, 'For Twitter feed generation, what is the hybrid approach?', 'multiple_choice', $3, 'Fan-out on write for regular users, fan-out on read for celebrities', 'The hybrid approach uses fan-out on write (pre-computed timelines) for regular users for fast reads, but fan-out on read for celebrities to avoid the overhead of updating millions of timelines on each tweet.', 'hard', 20, 2)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Store URLs permanently', 'Faster redirects and reduced database load', 'Backup storage', 'Analytics tracking']),
      JSON.stringify(['Always fan-out on write', 'Always fan-out on read', 'Fan-out on write for regular users, fan-out on read for celebrities', 'Store everything in cache'])
    ]);

    await client.query('COMMIT');
    console.log('✅ System Design Case Studies lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedSystemDesign()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
