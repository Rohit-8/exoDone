// ============================================================================
// System Design Case Studies — Content
// ============================================================================

export const topic = {
  "name": "System Design Case Studies",
  "slug": "system-design-cases",
  "description": "Tackle real-world system design interviews — URL shortener, chat application, news feed, and distributed file storage.",
  "estimated_time": 300,
  "order_index": 8
};

export const lessons = [
  {
    title: "Design a URL Shortener",
    slug: "design-url-shortener",
    summary: "Design a URL shortening service like bit.ly — hashing strategies, redirection, analytics, and scalability.",
    difficulty_level: "expert",
    estimated_time: 45,
    order_index: 1,
    key_points: [
  "Requirements: shorten URL, redirect, analytics, high availability",
  "Use Base62 encoding of an auto-increment ID or a hash for short codes",
  "Read-heavy workload (100:1 read:write) — cache aggressively",
  "Use 301 (permanent) vs 302 (temporary) redirect based on analytics needs",
  "Estimate storage: 100M URLs × 500 bytes = ~50GB — fits on one machine"
],
    content: `# Design a URL Shortener

## Step 1: Requirements

### Functional
- Given a long URL, generate a short URL
- Redirect short URL → original URL
- Custom aliases (optional)
- Expiration (optional)
- Analytics: click count, referrers, geography

### Non-Functional
- Highly available (99.9%)
- Low latency redirection (< 100ms)
- Short codes should not be predictable (security)

## Step 2: Capacity Estimation

| Metric | Value |
|---|---|
| New URLs/day | 1M (write) |
| Redirects/day | 100M (read) → 100:1 read:write |
| URL storage per entry | ~500 bytes |
| Total storage (5 years) | 1M × 365 × 5 × 500B ≈ 900GB |
| Read QPS (peak) | 100M / 86400 ≈ 1,200 QPS |

## Step 3: Short Code Generation

### Approach 1: Base62 Encoding

\`\`\`javascript
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encode(num) {
  let code = '';
  while (num > 0) {
    code = CHARS[num % 62] + code;
    num = Math.floor(num / 62);
  }
  return code.padStart(7, '0');
}

// 7 chars of Base62 = 62^7 = 3.5 trillion possible codes
encode(1);         // "0000001"
encode(1000000);   // "004c92"
\`\`\`

### Approach 2: Hash + Truncate

\`\`\`javascript
import crypto from 'crypto';

function generateShortCode(url) {
  const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
  return hash.slice(0, 7);
}
\`\`\`

## Step 4: High-Level Architecture

\`\`\`
Client → Load Balancer → API Server → Cache (Redis)
                                    → Database (PostgreSQL)

Redirect flow:
1. GET /abc1234
2. Check Redis cache → HIT? → 302 redirect
3. Cache MISS → Query DB → Cache result → 302 redirect
\`\`\`

## Step 5: Database Schema

\`\`\`sql
CREATE TABLE urls (
  id BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  user_id INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  click_count BIGINT DEFAULT 0
);

CREATE INDEX idx_urls_short_code ON urls(short_code);

CREATE TABLE url_analytics (
  id BIGSERIAL,
  url_id BIGINT REFERENCES urls(id),
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2)
) PARTITION BY RANGE (clicked_at);
\`\`\`

## Step 6: Scaling Strategies

- **Cache**: Redis for short_code → URL mapping (90%+ cache hit rate)
- **Read replicas**: Distribute read queries
- **Partitioning**: Shard by short_code hash for horizontal scaling
- **CDN**: Edge-level redirects for popular URLs
- **Rate limiting**: Prevent abuse (max 100 URLs/hour per user)
`,
  },
  {
    title: "Design a Real-Time Chat System",
    slug: "design-chat-system",
    summary: "Design a scalable chat application — WebSockets, message queues, presence, and delivery guarantees.",
    difficulty_level: "expert",
    estimated_time: 50,
    order_index: 2,
    key_points: [
  "WebSockets provide persistent, bidirectional connections for real-time messaging",
  "Use Redis Pub/Sub or Kafka to fan out messages across server instances",
  "Message delivery states: sent → delivered → read (with acknowledgments)",
  "Presence service tracks online/offline status with heartbeats",
  "Store messages in a time-series optimized store with sharding by conversation ID"
],
    content: `# Design a Real-Time Chat System

## Requirements

### Functional
- 1:1 messaging and group chats
- Message delivery: sent → delivered → read receipts
- Online/offline presence indicators
- Message history with infinite scroll
- Push notifications for offline users

### Non-Functional
- Real-time (< 200ms latency for messages)
- Message ordering guarantee within a conversation
- At-least-once delivery
- Support 10M concurrent connections

## High-Level Architecture

\`\`\`
Mobile/Web Client
    │ WebSocket
    ▼
┌─────────────┐
│ WS Gateway  │ (connection management, auth)
│ (multiple)  │
└──────┬──────┘
       │ Redis Pub/Sub
       ▼
┌─────────────┐    ┌──────────────┐
│ Chat Service│───►│ Message Store│
│             │    │ (Cassandra)  │
└──────┬──────┘    └──────────────┘
       │
  ┌────┴────┐
  ▼         ▼
┌──────┐  ┌───────────┐
│Queue │  │ Presence   │
│(Push)│  │ Service    │
└──────┘  │ (Redis)    │
          └───────────┘
\`\`\`

## Connection Management

\`\`\`javascript
// WebSocket Gateway (simplified)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const connections = new Map(); // userId → WebSocket

wss.on('connection', (ws, req) => {
  const userId = authenticateConnection(req);
  connections.set(userId, ws);

  // Update presence
  presenceService.setOnline(userId);

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    handleMessage(userId, message);
  });

  ws.on('close', () => {
    connections.delete(userId);
    presenceService.setOffline(userId);
  });
});

async function handleMessage(senderId, message) {
  switch (message.type) {
    case 'chat':
      await deliverMessage(senderId, message);
      break;
    case 'typing':
      await broadcastTyping(senderId, message.conversationId);
      break;
    case 'read_receipt':
      await markAsRead(senderId, message.messageId);
      break;
  }
}
\`\`\`

## Message Delivery

\`\`\`javascript
async function deliverMessage(senderId, message) {
  // 1. Persist the message
  const savedMessage = await messageStore.save({
    id: generateId(),
    conversationId: message.conversationId,
    senderId,
    content: message.content,
    status: 'sent',
    timestamp: Date.now(),
  });

  // 2. Find recipients
  const recipients = await getConversationMembers(message.conversationId);

  for (const recipientId of recipients) {
    if (recipientId === senderId) continue;

    // 3. Try WebSocket delivery
    const ws = connections.get(recipientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(savedMessage));
      await messageStore.updateStatus(savedMessage.id, 'delivered');
    } else {
      // 4. Queue for push notification
      await pushQueue.enqueue({
        userId: recipientId,
        message: savedMessage,
      });
    }
  }
}
\`\`\`

## Multi-Server Fanout with Redis Pub/Sub

\`\`\`javascript
// With multiple WS servers, a user may be connected to Server A
// while the sender is on Server B.
// Solution: Redis Pub/Sub for cross-server message routing.

import { createClient } from 'redis';

const publisher = createClient();
const subscriber = createClient();

// Each server subscribes to channels for its connected users
async function onUserConnect(userId) {
  await subscriber.subscribe(\`user:\${userId}\`, (message) => {
    const ws = connections.get(userId);
    if (ws) ws.send(message);
  });
}

// When delivering a message, publish to Redis (not direct WS)
async function deliverToUser(userId, message) {
  await publisher.publish(
    \`user:\${userId}\`,
    JSON.stringify(message)
  );
}
\`\`\`

## Database Design

\`\`\`sql
-- Messages (Cassandra-style partitioning for PostgreSQL)
CREATE TABLE messages (
  id BIGSERIAL,
  conversation_id UUID NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(10) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, id)  -- Efficient range queries per conversation
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) CHECK (type IN ('direct', 'group')),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation members
CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id),
  user_id INTEGER REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_message_id BIGINT,
  PRIMARY KEY (conversation_id, user_id)
);
\`\`\`
`,
  },
];
