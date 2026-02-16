export const topic = {
  name: "System Design Case Studies",
  slug: "system-design-cases",
  description:
    "Walk through real system design interview problems — URL shortener, chat system — with step-by-step solutions.",
  estimated_time: 240,
  order_index: 8,
};

export const lessons = [
  {
    title: "Design a URL Shortener",
    slug: "design-url-shortener",
    difficulty_level: "expert",
    estimated_time: 50,
    order_index: 1,
    key_points: [
      "Clarify functional and non-functional requirements before diving into design",
      "Estimate capacity: storage, bandwidth, read/write ratio, and cache memory",
      "Compare URL generation strategies: base62, hashing with collision handling, pre-generated key service, counter-based",
      "Choose between SQL and NoSQL based on access patterns and partitioning needs",
      "Apply caching with LRU eviction and cache-aside pattern for hot URLs",
      "Understand the difference between 301 (permanent) and 302 (temporary) redirects and their analytics implications",
      "Design for scalability using database partitioning, replication, and CDN-based redirects",
      "Incorporate rate limiting, analytics tracking, and custom alias support into the detailed design",
    ],
    content: `# Design a URL Shortener

## Introduction

The URL shortener is one of the most popular system design interview questions. Despite its seemingly simple functionality — converting a long URL into a short one — it touches on many core distributed systems concepts: hashing, database design, caching, scalability, and analytics. In this lesson, we walk through the complete design step by step, following a structured interview framework.

---

## Step 1: Requirements Clarification

### Functional Requirements

1. **URL Shortening** — Given a long URL, generate a unique, short URL (e.g., \`https://short.ly/abc123\`).
2. **URL Redirection** — When a user visits the short URL, redirect them to the original long URL.
3. **Custom Aliases** — Users can optionally choose a custom short URL alias (e.g., \`short.ly/my-brand\`).
4. **Link Expiration** — URLs can have an optional expiration time (TTL).
5. **Analytics** — Track click counts, referrer, geographic location, timestamp for each redirect.
6. **API Access** — Provide REST APIs for programmatic URL creation and management.

### Non-Functional Requirements

1. **Low Latency** — Redirects must happen in < 100ms (p99).
2. **High Availability** — The system must be 99.99% available; reads are critical.
3. **Scale** — Handle 100 million new URLs created per day; read-heavy workload.
4. **Durability** — Once a short URL is created, it must never be lost.
5. **Consistency** — The same long URL should ideally return the same short URL (deduplication).
6. **Security** — Rate limiting to prevent abuse; no enumeration of short URLs.

---

## Step 2: Capacity Estimation

### Traffic Estimates

Assumptions:
- **100M new URLs/day** → ~1,160 URLs/sec (write)
- **Read:Write ratio = 100:1** → ~116,000 redirects/sec (read)
- Average long URL length: **500 bytes**
- Short URL key length: **7 characters**

### Storage Estimates

- Each URL mapping record: ~500 bytes (long URL) + 7 bytes (short key) + metadata (~100 bytes) ≈ **~610 bytes**
- Per day: 100M × 610 bytes ≈ **61 GB/day**
- Over 5 years: 61 GB × 365 × 5 ≈ **111 TB**
- Total URL records over 5 years: **~182 billion records**

### Bandwidth Estimates

- **Incoming (writes):** 1,160 × 610 bytes ≈ **700 KB/s**
- **Outgoing (reads):** 116,000 × 610 bytes ≈ **67 MB/s**

### Memory for Caching (80/20 Rule)

- 20% of URLs generate 80% of traffic.
- Daily read requests: 116,000 × 86,400 ≈ **10 billion/day**
- Cache 20% of daily requests: 10B × 0.2 × 610 bytes ≈ **~1.2 TB of cache memory**
- This can be distributed across multiple cache nodes.

---

## Step 3: High-Level Design

\`\`\`
┌──────────────┐       ┌──────────────────┐       ┌────────────────┐
│   Client     │──────▶│   Load Balancer   │──────▶│   API Gateway  │
│  (Browser/   │       │   (L7 / DNS)      │       │  (Rate Limit,  │
│   Mobile)    │       │                    │       │   Auth, Route) │
└──────────────┘       └──────────────────┘       └───────┬────────┘
                                                           │
                       ┌───────────────────────────────────┼───────────────────┐
                       │                                   │                   │
                       ▼                                   ▼                   ▼
              ┌─────────────────┐              ┌──────────────────┐   ┌──────────────┐
              │  Write Service  │              │  Read Service    │   │  Analytics   │
              │  (Shorten URL)  │              │  (Redirect)      │   │  Service     │
              └────────┬────────┘              └────────┬─────────┘   └──────┬───────┘
                       │                                │                    │
                       ▼                                ▼                    ▼
              ┌─────────────────┐              ┌──────────────────┐   ┌──────────────┐
              │   Key Gen       │              │   Cache (Redis)  │   │  Analytics   │
              │   Service (KGS) │              │   LRU Policy     │   │  DB (OLAP)   │
              └────────┬────────┘              └────────┬─────────┘   └──────────────┘
                       │                                │
                       ▼                                ▼
              ┌──────────────────────────────────────────────────┐
              │              Database (NoSQL / SQL)              │
              │   ┌─────────┐  ┌─────────┐  ┌─────────┐        │
              │   │ Shard 1 │  │ Shard 2 │  │ Shard N │        │
              │   └─────────┘  └─────────┘  └─────────┘        │
              └──────────────────────────────────────────────────┘
\`\`\`

### API Design

\`\`\`
POST /api/v1/urls
  Body: { "long_url": "https://...", "custom_alias": "optional", "expiry": "optional" }
  Response: { "short_url": "https://short.ly/abc123", "expires_at": "..." }

GET /:short_key
  Response: 301/302 Redirect to original URL

GET /api/v1/urls/:short_key/stats
  Response: { "clicks": 12345, "created_at": "...", "top_referrers": [...] }

DELETE /api/v1/urls/:short_key
  Response: 204 No Content
\`\`\`

### Database Schema

\`\`\`sql
CREATE TABLE urls (
    short_key   VARCHAR(7) PRIMARY KEY,
    long_url    TEXT NOT NULL,
    user_id     BIGINT,
    created_at  TIMESTAMP DEFAULT NOW(),
    expires_at  TIMESTAMP,
    click_count BIGINT DEFAULT 0
);

CREATE TABLE analytics (
    id          BIGINT PRIMARY KEY,
    short_key   VARCHAR(7),
    timestamp   TIMESTAMP,
    ip_address  VARCHAR(45),
    referrer    TEXT,
    user_agent  TEXT,
    country     VARCHAR(2)
);
\`\`\`

---

## Step 4: URL Generation Strategies

### Strategy 1: Base62 Encoding

Convert a unique integer (auto-increment ID or distributed counter) to a base62 string using characters \`[a-zA-Z0-9]\`.

- **7 characters** → 62^7 ≈ **3.5 trillion** unique URLs.
- Simple, deterministic, no collisions.
- **Drawback:** Sequential IDs are predictable (enumerable). A malicious user can guess the next URL.
- **Mitigation:** Shuffle the ID before encoding or use a randomized bijective function.

### Strategy 2: MD5/SHA-256 Hashing with Collision Handling

Hash the long URL using MD5 (128-bit) or SHA-256 (256-bit), take the first 7 characters of the base62-encoded hash.

- **Advantage:** Same long URL always produces the same short key (deduplication built-in).
- **Drawback:** Collisions are possible when truncating the hash.
- **Collision handling:** Check the database; if the key exists and the long URL differs, append a counter or salt and rehash.

### Strategy 3: Pre-Generated Key Service (KGS)

A separate service pre-generates unique 7-character keys and stores them in a database. When a shortening request arrives, a key is fetched from the pool.

\`\`\`
┌──────────────────┐        ┌──────────────────┐
│   KGS Service    │───────▶│   Key Pool DB    │
│  (Background)    │        │   ┌───────────┐  │
│  Generates keys  │        │   │ Used Keys │  │
│  ahead of time   │        │   │ Free Keys │  │
│                  │        │   └───────────┘  │
└──────────────────┘        └──────────────────┘
\`\`\`

- **Advantage:** Zero collision risk, fast key retrieval (O(1) from a pre-populated table).
- **Drawback:** Requires coordination to ensure no two servers get the same key. Use atomic operations or batch allocation (each server grabs a block of 1,000 keys).
- **Best for high-throughput systems.**

### Strategy 4: Counter-Based with Zookeeper

Use a distributed coordination service (e.g., Apache Zookeeper) to assign unique counter ranges to each application server.

- Server A gets range [1–1,000,000], Server B gets [1,000,001–2,000,000], etc.
- Each server converts its local counter to base62.
- **Advantage:** No collisions, no central bottleneck for each individual write.
- **Drawback:** Requires Zookeeper infrastructure and range management.

---

## Step 5: Database Choice

### SQL (PostgreSQL, MySQL)

- ✅ ACID guarantees, strong consistency.
- ✅ Rich query support (useful for analytics).
- ❌ Harder to scale horizontally without sharding middleware.

### NoSQL (DynamoDB, Cassandra)

- ✅ Built for horizontal scaling with automatic partitioning.
- ✅ High write throughput.
- ✅ Simple key-value access pattern (perfect for URL lookups).
- ❌ Limited query flexibility; eventual consistency by default.

**Recommendation:** Use **NoSQL (DynamoDB or Cassandra)** for the URL mapping table (key-value access) and a **SQL database or OLAP store** (ClickHouse, Redshift) for analytics data.

### Partitioning Strategy

- **Hash-based partitioning** on the \`short_key\`: Distribute URLs evenly across shards.
- Avoids hotspots since short keys are effectively random.
- Range-based partitioning (by creation date) is useful for analytics but causes write hotspots.

---

## Step 6: Caching

### Cache-Aside Pattern

\`\`\`
Client Request ──▶ Cache (Redis/Memcached)
                      │
                 Hit? ─┤
                 Yes   │  No
                  │    │
                  ▼    ▼
              Return  Query DB ──▶ Store in Cache ──▶ Return
\`\`\`

1. On a read, check the cache first.
2. On a cache miss, query the database and populate the cache.
3. On a write, write to the database and invalidate or update the cache.

### Eviction Policy: LRU (Least Recently Used)

- Evict the least recently accessed URL when the cache is full.
- Works well with the 80/20 rule: most traffic goes to a small set of popular URLs.

### Cache Configuration

- **TTL:** Set a time-to-live (e.g., 24 hours) so stale entries expire.
- **Size:** ~1.2 TB distributed across Redis cluster nodes (e.g., 24 nodes × 50 GB each).

---

## Step 7: Detailed Design

### Write Flow (Create Short URL)

\`\`\`
1. Client sends POST /api/v1/urls { long_url }
2. API Gateway validates request, applies rate limiting
3. Write Service checks if long_url already exists (optional dedup)
4. If not, fetch a unique key from KGS (or generate via base62/hash)
5. Store { short_key, long_url, metadata } in the database
6. Return short_url to client
\`\`\`

### Read Flow (Redirect)

\`\`\`
1. Client sends GET /abc123
2. API Gateway routes to Read Service
3. Read Service checks Redis cache for short_key
4. Cache HIT → return long_url → send 301/302 redirect
5. Cache MISS → query database → populate cache → redirect
6. Asynchronously log analytics event (click) to a message queue → Analytics Service
\`\`\`

### 301 vs 302 Redirects

| Aspect | 301 (Permanent) | 302 (Temporary) |
|--------|-----------------|-----------------|
| Browser caching | Yes — browser caches, fewer requests to server | No — browser always hits server |
| Analytics | Harder — subsequent visits bypass the server | Easier — every visit is tracked |
| SEO | Link equity passes to destination | Link equity stays with short URL |
| **Best for** | Performance-optimized, stable URLs | Analytics-heavy, A/B testing |

**Recommendation:** Use **302 redirects** if analytics tracking is important. Use **301** if you want to minimize server load.

### Rate Limiting

- Apply per-IP and per-user rate limits on the creation endpoint.
- Use a **token bucket** or **sliding window** algorithm.
- Store counters in Redis with TTL.
- Example: Max 100 URL creations per hour per API key.

### Analytics Tracking

- Don't block the redirect on analytics writes.
- Push analytics events to a **message queue (Kafka, SQS)** for async processing.
- A consumer writes to an OLAP database (ClickHouse, BigQuery) for aggregation.
- Dashboard queries the analytics store for click counts, geo distribution, etc.

---

## Step 8: Scalability & Reliability

### Database Scaling

\`\`\`
                    ┌───────────────────────┐
                    │   Consistent Hashing  │
                    │   / Partition Router   │
                    └───────┬───────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Shard 1   │  │  Shard 2   │  │  Shard 3   │
     │  (Primary) │  │  (Primary) │  │  (Primary) │
     │     │      │  │     │      │  │     │      │
     │  Replica   │  │  Replica   │  │  Replica   │
     └────────────┘  └────────────┘  └────────────┘
\`\`\`

- **Sharding:** Hash-based on \`short_key\`. Each shard handles a range of hash values.
- **Replication:** Each shard has 2–3 read replicas for high availability and read throughput.
- **Consistent hashing** to minimize data movement when adding/removing shards.

### CDN for Redirects

- For extremely popular URLs, cache the redirect at the CDN edge (e.g., CloudFront, Cloudflare).
- CDN returns the 301/302 redirect without hitting the origin servers at all.
- Reduces latency to single-digit milliseconds for global users.

### Monitoring & Alerting

- Track key metrics: redirect latency (p50, p95, p99), cache hit ratio, error rates, KGS key pool size.
- Alert when KGS key pool drops below threshold.
- Monitor database replication lag.

---

## Step 9: Summary Architecture

\`\`\`
                         ┌─────────────────────────────────────────────┐
                         │                    CDN                      │
                         │  (Cache 301/302 redirects at the edge)      │
                         └──────────────────┬──────────────────────────┘
                                            │
                         ┌──────────────────▼──────────────────────────┐
                         │            Load Balancer (L7)               │
                         └──────────────────┬──────────────────────────┘
                                            │
                    ┌───────────────────────┬┴──────────────────────────┐
                    ▼                       ▼                           ▼
           ┌────────────────┐    ┌──────────────────┐        ┌──────────────────┐
           │ Write Service  │    │  Read Service     │        │ Analytics Service│
           │ (Create URLs)  │    │  (Redirect)       │        │ (Async Consumer) │
           └───────┬────────┘    └────────┬──────────┘        └───────┬──────────┘
                   │                      │                           │
                   ▼                      ▼                           ▼
           ┌────────────────┐    ┌──────────────────┐        ┌──────────────────┐
           │  KGS (Key Gen) │    │  Redis Cache     │        │  Kafka / SQS     │
           └───────┬────────┘    │  (LRU, TTL)      │        └───────┬──────────┘
                   │             └────────┬──────────┘                │
                   │                      │                           ▼
                   ▼                      ▼                  ┌──────────────────┐
           ┌──────────────────────────────────────────┐      │  ClickHouse /    │
           │       NoSQL Database (DynamoDB)           │      │  BigQuery (OLAP) │
           │   Sharded by short_key, replicated        │      └──────────────────┘
           └──────────────────────────────────────────┘
\`\`\`

---

## Key Takeaways

- **Start with requirements** — clarify scale, latency, and feature scope before designing.
- **KGS is the most robust** URL generation strategy for high-throughput systems.
- **Cache aggressively** — most reads hit a small subset of URLs.
- **Use 302 redirects** when analytics matter; 301 when performance is paramount.
- **Shard by short_key** with consistent hashing for even distribution.
- **Decouple analytics** from the redirect path using async message queues.
- **CDN at the edge** can handle the vast majority of redirect traffic.
`,
  },
  {
    title: "Design a Real-Time Chat System",
    slug: "design-chat-system",
    difficulty_level: "expert",
    estimated_time: 50,
    order_index: 2,
    key_points: [
      "Choose WebSockets for real-time bidirectional communication over long polling or SSE",
      "Design separate services for chat, presence, notifications, and media handling",
      "Use Snowflake IDs for globally unique, time-sortable message ID generation",
      "Understand fan-out strategies: fan-out-on-write for small groups, fan-out-on-read for large groups or celebrity users",
      "Implement heartbeat-based presence detection with configurable intervals and grace periods",
      "Store messages using a write-optimized database (Cassandra, HBase) partitioned by conversation ID",
      "Integrate push notification services (APNs, FCM) for offline users with delivery receipts",
      "Design for end-to-end encryption using public/private key pairs and the Signal Protocol",
    ],
    content: `# Design a Real-Time Chat System

## Introduction

Designing a real-time chat system (like WhatsApp, Slack, or Facebook Messenger) is a challenging and frequently asked system design interview problem. It requires expertise in real-time communication protocols, distributed messaging, presence detection, and notification systems. This lesson walks through the complete design.

---

## Step 1: Requirements Clarification

### Functional Requirements

1. **1-on-1 Chat** — Users can send text messages to each other in real time.
2. **Group Chat** — Support group conversations with up to 500 members.
3. **Online/Offline Status** — Show whether a user is online, offline, or "last seen at X."
4. **Media Sharing** — Users can send images, videos, and files.
5. **Push Notifications** — Notify offline users of new messages.
6. **Message History** — Users can scroll back through conversation history, synced across devices.
7. **Read Receipts** — Show sent, delivered, and read indicators.
8. **Typing Indicators** — Show when another user is typing.

### Non-Functional Requirements

1. **Real-Time Delivery** — Messages delivered within 100ms for online users.
2. **High Availability** — 99.99% uptime.
3. **Consistency** — Messages must never be lost; delivered in order per conversation.
4. **Scale** — 500 million active users, 50 billion messages/day.
5. **Multi-Device** — Support simultaneous connections from phone, tablet, desktop.
6. **Security** — End-to-end encryption for private conversations.
7. **Low Bandwidth** — Efficient protocol for mobile users on slow networks.

---

## Step 2: Capacity Estimation

### Traffic Estimates

- **500M daily active users (DAU)**
- **Average 100 messages sent per user/day** → 50 billion messages/day
- Messages per second: 50B / 86,400 ≈ **~580,000 messages/sec**
- Peak traffic: ~3× average ≈ **~1.74M messages/sec**

### Storage Estimates

- Average message size: ~200 bytes (text + metadata)
- Daily storage: 50B × 200 bytes = **10 TB/day**
- Over 5 years: 10 TB × 365 × 5 ≈ **18.25 PB**
- Media messages (10% of total): additional **50 TB/day** (images ~500 KB average)

### Connection Estimates

- **500M concurrent WebSocket connections** at peak.
- Each connection: ~10 KB memory → **5 TB of memory** for connection state.
- Distributed across thousands of WebSocket server instances.

---

## Step 3: High-Level Design

### Communication Protocol Comparison

| Protocol | Direction | Connection | Latency | Use Case |
|----------|-----------|------------|---------|----------|
| **HTTP Long Polling** | Server → Client | New connection per response | Medium | Fallback |
| **Server-Sent Events (SSE)** | Server → Client only | Persistent | Low | Notifications |
| **WebSocket** | Bidirectional | Persistent | Very Low | **Chat (Best)** |

**Decision: WebSocket** — Provides full-duplex, persistent connections with minimal overhead. The initial HTTP handshake upgrades to WebSocket, and both client and server can push data at any time.

### Architecture Overview

\`\`\`
┌──────────────┐        ┌──────────────────────────────────────────────────────────┐
│   Client     │◀──────▶│                   Load Balancer                          │
│  (Mobile/    │  WS    │              (Sticky Sessions / L4)                      │
│   Desktop)   │        └────────┬──────────────┬──────────────┬───────────────────┘
└──────────────┘                 │              │              │
                                 ▼              ▼              ▼
                        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                        │  Chat Server │ │  Chat Server │ │  Chat Server │
                        │  (WebSocket) │ │  (WebSocket) │ │  (WebSocket) │
                        └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                               │                │                │
                    ┌──────────┴────────────────┴────────────────┴──────────┐
                    │                    Message Queue                       │
                    │                  (Kafka / Redis Pub/Sub)               │
                    └──────────┬────────────────┬────────────────┬──────────┘
                               │                │                │
              ┌────────────────┼────────────────┼────────────────┘
              ▼                ▼                ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │  Message Store │ │  Presence      │ │  Notification  │
     │  (Cassandra)   │ │  Service       │ │  Service       │
     └────────────────┘ │  (Redis)       │ │  (APNs / FCM)  │
                        └────────────────┘ └────────────────┘
\`\`\`

### Core Services

| Service | Responsibility |
|---------|---------------|
| **Chat Server** | Manages WebSocket connections, routes messages |
| **Message Store** | Persists messages durably |
| **Presence Service** | Tracks online/offline status |
| **Notification Service** | Sends push notifications to offline users |
| **Media Service** | Handles file uploads, thumbnail generation, CDN |
| **User Service** | Authentication, user profiles, contacts |
| **Group Service** | Group creation, membership, admin controls |

---

## Step 4: Detailed Message Flow

### 1-on-1 Message Flow

\`\`\`
User A (Sender)                                          User B (Receiver)
    │                                                         │
    │  1. Send message via WebSocket                          │
    │─────────────▶ Chat Server A                             │
    │               │                                         │
    │               │ 2. Validate & assign message ID          │
    │               │                                         │
    │               │ 3. Persist to Message Store              │
    │               │────────────────▶ Cassandra               │
    │               │                                         │
    │               │ 4. ACK to sender (message sent ✓)       │
    │◀──────────────│                                         │
    │               │                                         │
    │               │ 5. Lookup: Is User B online?             │
    │               │────────────────▶ Presence Service        │
    │               │                                         │
    │               │ 6a. ONLINE → Route via Message Queue     │
    │               │────────────────▶ Kafka ────────▶ Chat Server B
    │               │                                    │    │
    │               │                           7. Deliver via WS
    │               │                                    │───▶│
    │               │                                         │
    │               │ 6b. OFFLINE → Push Notification          │
    │               │────────────────▶ Notification Service    │
    │               │                    │                     │
    │               │                    │──▶ APNs/FCM ───────▶│
\`\`\`

### Group Message Flow (Fan-Out)

Two strategies for delivering messages to group members:

#### Fan-Out-on-Write (Push Model)

When a message is sent, the server writes a copy to each recipient's message queue/inbox.

- ✅ Fast reads — each user reads from their own inbox.
- ❌ Expensive writes — a message to a 500-person group creates 500 writes.
- ❌ Celebrity problem — a message from a user in many large groups causes a write storm.
- **Best for:** Small groups (< 100 members).

#### Fan-Out-on-Read (Pull Model)

The message is written once to the conversation's message store. Each recipient pulls messages on demand.

- ✅ Efficient writes — one write per message.
- ❌ Slower reads — each user queries the conversation store on read.
- **Best for:** Large groups (100–500 members) or channels with many subscribers.

#### Hybrid Approach (Recommended)

- **Small groups (< 100):** Fan-out-on-write for instant delivery.
- **Large groups (≥ 100):** Fan-out-on-read; members pull when they open the conversation.

---

## Step 5: Message Storage

### Message Data Model

\`\`\`
Table: messages
─────────────────────────────────────────────────
│ conversation_id  │ message_id (Snowflake) │ ...      │
│ (partition key)  │ (clustering key, DESC) │          │
─────────────────────────────────────────────────
│ conv_123         │ 8371629384710001       │ sender_id: user_a    │
│                  │                        │ content: "Hello!"    │
│                  │                        │ type: text           │
│                  │                        │ created_at: ...      │
│                  │                        │ status: delivered    │
─────────────────────────────────────────────────
\`\`\`

### Database Choice

- **Cassandra** or **HBase**: Write-optimized, wide-column store.
  - Partition key: \`conversation_id\` — all messages in a conversation are co-located.
  - Clustering key: \`message_id\` (descending) — efficient range queries for pagination ("load last 50 messages").
  - Supports high write throughput (580K writes/sec).

### Message ID Generation — Snowflake

Messages must be ordered, and we need globally unique IDs. Twitter's Snowflake ID format:

\`\`\`
┌───────────────────────────────────────────────────────────────┐
│ 0 │  Timestamp (41 bits)  │ DC ID (5) │ Machine (5) │ Seq (12) │
│   │  ~69 years of ms      │  32 DCs   │  32 machines│  4096/ms │
└───────────────────────────────────────────────────────────────┘
                        Total: 64 bits
\`\`\`

- **41 bits for timestamp** — millisecond precision, sortable by time.
- **5 bits for datacenter ID** — supports 32 data centers.
- **5 bits for machine ID** — 32 machines per DC.
- **12 bits for sequence** — 4,096 unique IDs per millisecond per machine.
- Total capacity: **~4 million IDs/sec per machine**.

---

## Step 6: Presence / Online Status

### Heartbeat Mechanism

\`\`\`
Client ──── heartbeat (every 5s) ────▶ Presence Service (Redis)
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ user_id: user_a  │
                                     │ status: online   │
                                     │ last_seen: ts    │
                                     │ TTL: 30 seconds  │
                                     └──────────────────┘
\`\`\`

1. Client sends a heartbeat every **5 seconds** via the WebSocket connection.
2. Presence Service updates the user's entry in Redis with a **30-second TTL**.
3. If no heartbeat is received within 30 seconds, the key expires → user is "offline."
4. When a user comes online or goes offline, publish an event to the **Presence Channel** (Redis Pub/Sub).
5. Friends subscribed to that channel receive the status change.

### Optimization: Lazy Updates

- Don't broadcast presence to all contacts immediately — it's expensive at scale.
- Only fetch presence when a user opens a conversation or views their contact list.
- For group chats, show online status only for recently active members.

### Last Seen

- Store \`last_seen_at\` timestamp in user profile (database).
- Update asynchronously — don't write to DB on every heartbeat (batch updates every 60 seconds).
- Display as "Last seen 5 minutes ago" on the client.

---

## Step 7: Media Handling

### Upload Flow

\`\`\`
1. Client requests a pre-signed upload URL from Media Service
2. Client uploads file directly to Object Storage (S3) using the pre-signed URL
3. Object Storage triggers a Lambda/worker to:
   a. Generate thumbnail (for images/videos)
   b. Compress if needed
   c. Store metadata in database
4. Media Service returns the media URL to the client
5. Client sends a chat message with the media URL as an attachment
\`\`\`

\`\`\`
┌──────────┐   1. Get upload URL   ┌──────────────┐
│  Client  │──────────────────────▶│ Media Service │
│          │◀──────────────────────│              │
│          │   Pre-signed URL      └──────┬───────┘
│          │                              │
│          │   2. Upload directly          │
│          │──────────────────────▶ ┌──────▼───────┐
│          │                       │  S3 / Object  │
│          │                       │  Storage      │──▶ Thumbnail Worker
│          │                       └──────┬───────┘
│          │                              │
│          │   3. Media URL               │
│          │◀─────────────────────────────┘
│          │
│          │   4. Send message with media attachment
│          │──────────────────────▶ Chat Server
└──────────┘
\`\`\`

### CDN for Media Delivery

- All media is served through a **CDN (CloudFront, Akamai)**.
- CDN caches images/videos at edge locations close to users.
- Reduces latency and bandwidth costs for the origin.

---

## Step 8: Push Notifications

### Architecture

\`\`\`
Chat Server ──▶ Notification Service ──┬──▶ APNs (Apple Push Notification Service)
                                        │       └──▶ iOS Devices
                                        │
                                        └──▶ FCM (Firebase Cloud Messaging)
                                                └──▶ Android / Web Devices
\`\`\`

### Flow

1. When a message is sent and the recipient is **offline** (per Presence Service):
2. Chat Server enqueues a notification task to the **Notification Queue**.
3. Notification Service dequeues the task:
   a. Looks up the recipient's device tokens.
   b. Formats the push payload (truncated message preview, badge count).
   c. Sends to **APNs** (iOS) or **FCM** (Android/Web).
4. Handle delivery failures: retry with exponential backoff, remove invalid tokens.

### Considerations

- **Rate limiting:** Don't spam a user with 100 notifications if they have 100 unread messages. Batch or collapse notifications.
- **Mutable notifications:** On iOS, update existing notification content when new messages arrive in the same conversation.
- **End-to-end encryption:** Notification payload should NOT contain the actual message content. Show "You have a new message" instead.
- **Badge count:** Maintain an unread count per user and include it in the push payload.

---

## Step 9: End-to-End Encryption (E2EE)

### Overview (Signal Protocol)

\`\`\`
User A                          Server                         User B
  │                               │                               │
  │  1. Generate key pair         │  1. Generate key pair         │
  │  (public + private)           │  (public + private)           │
  │                               │                               │
  │  2. Upload public key ───────▶│◀─────── Upload public key  2. │
  │                               │                               │
  │  3. Fetch B's public key      │                               │
  │◀──────────────────────────────│                               │
  │                               │                               │
  │  4. Encrypt message with      │                               │
  │     shared secret (DH)        │                               │
  │                               │                               │
  │  5. Send encrypted message ──▶│──── Forward encrypted msg ───▶│
  │                               │                               │
  │                               │       6. Decrypt with         │
  │                               │          private key          │
\`\`\`

- Messages are encrypted on the sender's device and decrypted on the receiver's device.
- The server **never** has access to plaintext messages.
- Uses **Diffie-Hellman key exchange** to establish a shared secret.
- Each message uses a unique **ephemeral key** (Double Ratchet Algorithm) for forward secrecy.

---

## Step 10: Scalability

### WebSocket Server Scaling

\`\`\`
                    ┌──────────────────────────────────────┐
                    │     Service Discovery (Consul/etcd)  │
                    │    ┌──────────────────────────────┐  │
                    │    │  user_a → ws-server-3        │  │
                    │    │  user_b → ws-server-7        │  │
                    │    │  user_c → ws-server-1        │  │
                    │    └──────────────────────────────┘  │
                    └──────────────────────────────────────┘
\`\`\`

- Each WebSocket server handles ~50K–100K concurrent connections.
- 500M users → **~5,000–10,000 WebSocket server instances**.
- Use **Service Discovery** (Consul, etcd) to map \`user_id → server_id\`.
- When User A sends a message to User B:
  1. Look up which server hosts User B's connection.
  2. Route the message via the **message queue** (Kafka) to that server.

### Message Queue (Kafka)

- Topic per user or per conversation for ordered delivery.
- Partitioned by \`conversation_id\` for parallel processing.
- Consumers (Chat Servers) read messages and deliver to connected clients.
- Kafka provides durability, replayability, and decouples producers from consumers.

### Database Sharding

- **Partition key:** \`conversation_id\`.
- All messages in a conversation live on the same shard → efficient range queries.
- Use consistent hashing to distribute conversations across Cassandra nodes.
- Hot conversations (viral groups) can be further split by time-range sub-partitions.

---

## Step 11: Summary Architecture

\`\`\`
┌──────────────┐  WebSocket   ┌────────────────────────────────────────────────┐
│   Mobile /   │◀────────────▶│              Load Balancer (L4)               │
│   Desktop    │              └──────────┬───────────┬───────────┬────────────┘
│   Clients    │                         │           │           │
└──────────────┘                         ▼           ▼           ▼
                               ┌──────────────┐ ┌──────────┐ ┌──────────┐
                               │ Chat Server 1│ │ CS 2     │ │ CS N     │
                               │ (WebSocket)  │ │          │ │          │
                               └──────┬───────┘ └────┬─────┘ └────┬─────┘
                                      │              │            │
                               ┌──────▼──────────────▼────────────▼──────┐
                               │          Kafka Message Broker           │
                               └──┬──────────┬──────────┬───────────┬───┘
                                  │          │          │           │
                                  ▼          ▼          ▼           ▼
                           ┌───────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
                           │ Message   │ │Presence│ │Notif.   │ │ Media    │
                           │ Store     │ │Service │ │Service  │ │ Service  │
                           │(Cassandra)│ │(Redis) │ │(APNs/   │ │(S3+CDN) │
                           │           │ │        │ │ FCM)    │ │          │
                           └───────────┘ └────────┘ └─────────┘ └──────────┘
\`\`\`

---

## Key Takeaways

- **WebSocket** is the right protocol for real-time chat — full-duplex, persistent, low overhead.
- **Snowflake IDs** give you globally unique, time-sortable message identifiers without coordination.
- **Fan-out-on-write** for small groups, **fan-out-on-read** for large groups — hybrid is best.
- **Cassandra** is ideal for message storage: high write throughput, partitioned by conversation.
- **Heartbeat-based presence** with Redis TTL is simple and scalable.
- **Decouple notifications** via a message queue; don't block the chat flow.
- **CDN + pre-signed URLs** for media upload/download keeps the chat servers lean.
- **End-to-end encryption** ensures privacy; the server is a blind relay.
- **Service discovery** maps users to WebSocket servers for efficient message routing.
`,
  },
];
