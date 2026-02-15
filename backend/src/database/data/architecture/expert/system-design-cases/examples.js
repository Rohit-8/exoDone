// ============================================================================
// System Design Case Studies — Code Examples
// ============================================================================

const examples = {
  'design-url-shortener': [
    {
      title: "URL Shortener API Implementation",
      description: "Core API for creating and resolving short URLs.",
      language: "javascript",
      code: `import { Router } from 'express';
import crypto from 'crypto';
import pool from '../config/database.js';

const router = Router();

// Redis cache
const CACHE_TTL = 86400; // 24 hours

// Generate short code
function generateCode() {
  return crypto.randomBytes(4).toString('base64url').slice(0, 7);
}

// POST /api/shorten
router.post('/shorten', async (req, res, next) => {
  try {
    const { url, customCode, expiresIn } = req.body;

    // Validate URL
    try { new URL(url); } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const shortCode = customCode || generateCode();

    // Check for collision
    const existing = await pool.query(
      'SELECT id FROM urls WHERE short_code = $1', [shortCode]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Code already taken' });
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    const { rows } = await pool.query(
      \`INSERT INTO urls (short_code, original_url, expires_at)
       VALUES ($1, $2, $3) RETURNING short_code, original_url, expires_at\`,
      [shortCode, url, expiresAt]
    );

    // Cache immediately
    await redis.setEx(\`url:\${shortCode}\`, CACHE_TTL, url);

    res.status(201).json({
      shortUrl: \`https://short.ly/\${rows[0].short_code}\`,
      originalUrl: rows[0].original_url,
      expiresAt: rows[0].expires_at,
    });
  } catch (err) { next(err); }
});

// GET /:code — Redirect
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    // 1. Check cache
    let url = await redis.get(\`url:\${code}\`);

    // 2. Cache miss — check database
    if (!url) {
      const { rows } = await pool.query(
        'SELECT original_url, expires_at FROM urls WHERE short_code = $1',
        [code]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      if (rows[0].expires_at && new Date(rows[0].expires_at) < new Date()) {
        return res.status(410).json({ error: 'URL expired' });
      }
      url = rows[0].original_url;
      await redis.setEx(\`url:\${code}\`, CACHE_TTL, url);
    }

    // 3. Track analytics (async — don't block redirect)
    pool.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1',
      [code]
    ).catch(console.error);

    // 4. Redirect (302 for analytics, 301 for permanent)
    res.redirect(302, url);
  } catch (err) { next(err); }
});

export default router;`,
      explanation: "The shortener uses Redis caching for fast redirects. Analytics are tracked asynchronously so they don't slow down the redirect. Uses 302 (temporary) redirect so browsers always hit the server (needed for analytics).",
      order_index: 1,
    },
  ],
  'design-chat-system': [
    {
      title: "Presence Service with Redis",
      description: "Track user online/offline status using Redis with TTL-based heartbeats.",
      language: "javascript",
      code: `class PresenceService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.HEARTBEAT_TTL = 30; // seconds
  }

  async setOnline(userId) {
    await this.redis.setEx(\`presence:\${userId}\`, this.HEARTBEAT_TTL, 'online');
    await this.redis.publish('presence', JSON.stringify({
      userId,
      status: 'online',
      timestamp: Date.now(),
    }));
  }

  async heartbeat(userId) {
    // Refresh TTL — if client stops sending heartbeats, key expires → offline
    await this.redis.expire(\`presence:\${userId}\`, this.HEARTBEAT_TTL);
  }

  async setOffline(userId) {
    await this.redis.del(\`presence:\${userId}\`);
    await this.redis.publish('presence', JSON.stringify({
      userId,
      status: 'offline',
      timestamp: Date.now(),
    }));
  }

  async isOnline(userId) {
    return (await this.redis.exists(\`presence:\${userId}\`)) === 1;
  }

  async getOnlineUsers(userIds) {
    if (userIds.length === 0) return {};

    const pipeline = this.redis.multi();
    userIds.forEach(id => pipeline.exists(\`presence:\${id}\`));
    const results = await pipeline.exec();

    return Object.fromEntries(
      userIds.map((id, i) => [id, results[i] === 1])
    );
  }
}

// Client sends heartbeat every 10 seconds
// If 3 heartbeats are missed (30s TTL), the key expires → user is offline
// No explicit "disconnect" needed — TTL handles it naturally`,
      explanation: "This presence service uses Redis key expiration as a natural offline detector. Clients send heartbeats every 10 seconds. If 30 seconds pass without a heartbeat (3 missed), the Redis key expires and the user is considered offline.",
      order_index: 1,
    },
  ],
};

export default examples;
