const quiz = {
  "design-url-shortener": [
    {
      question_text:
        "You need to generate 100 million unique short URLs per day with zero collisions and minimal latency per write. Which URL generation strategy is most appropriate?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "MD5 hashing with collision detection and retry",
        "Pre-Generated Key Service (KGS) with batch allocation to application servers",
        "Auto-incrementing database sequence with base62 encoding",
        "Random string generation with uniqueness check against the database",
      ]),
      correct_answer:
        "Pre-Generated Key Service (KGS) with batch allocation to application servers",
      explanation:
        "KGS is the best strategy for high-throughput URL shorteners. Keys are pre-generated in bulk by a background process, so there are zero collisions by design. Batch allocation gives each application server a local pool of keys, making each write O(1) with no database lookup or coordination. MD5 hashing requires collision detection (extra DB reads). Auto-increment sequences create a single-point bottleneck. Random generation with uniqueness checks adds latency to every write.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text:
        "Your URL shortener uses 302 (Temporary) redirects instead of 301 (Permanent) redirects. A product manager asks why this increases server load. What is the correct explanation?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "302 redirects require the server to re-validate the URL with the database on every request, while 301 redirects skip validation",
        "302 redirects are not cached by the browser, so every click hits the server; 301 redirects are cached by the browser so subsequent clicks never reach the server",
        "302 redirects require HTTPS while 301 redirects work with HTTP, reducing TLS overhead",
        "302 redirects transfer more data in the response body compared to 301 redirects",
      ]),
      correct_answer:
        "302 redirects are not cached by the browser, so every click hits the server; 301 redirects are cached by the browser so subsequent clicks never reach the server",
      explanation:
        "A 301 (Permanent) redirect tells the browser to cache the mapping. On subsequent visits, the browser redirects directly to the destination without contacting the server at all. A 302 (Temporary) redirect indicates the mapping may change, so the browser always contacts the server for each visit. This means 302 generates more server traffic but enables accurate click analytics since every visit is observed. For URL shorteners that need analytics tracking, 302 is the correct choice despite the higher load.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "Your URL shortener handles 116,000 read requests per second. You implement a Redis cache with LRU eviction. After analysis, you find that 20% of URLs account for 80% of traffic. How much cache memory do you need to achieve an ~80% hit rate?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Cache all URLs in memory (~111 TB) for a near-100% hit rate",
        "Cache 20% of daily unique URLs (~1.2 TB distributed across Redis cluster nodes)",
        "Cache only the last 1 hour of URLs (~250 GB) since recent URLs get the most traffic",
        "Use a 100 GB cache with aggressive TTLs of 60 seconds to keep only the hottest URLs",
      ]),
      correct_answer:
        "Cache 20% of daily unique URLs (~1.2 TB distributed across Redis cluster nodes)",
      explanation:
        "Following the 80/20 rule (Pareto principle): 20% of URLs generate 80% of reads. Caching this 20% gives approximately 80% cache hit rate. With ~10 billion daily reads and ~610 bytes per URL record, caching 20% of daily requests requires ~1.2 TB. This is distributed across a Redis cluster (e.g., 24 nodes × 50 GB each). Caching all URLs (111 TB) is wasteful. A 100 GB cache is too small given the working set size. Hour-based caching misses popular URLs that were created days or weeks ago.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "You're designing the database partitioning strategy for a URL shortener storing 182 billion URL records across multiple shards. Which partitioning approach minimizes hotspots and supports efficient single-key lookups?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Range-based partitioning on the creation timestamp for easy time-range queries",
        "Hash-based partitioning on the short_key using consistent hashing",
        "Range-based partitioning on the first character of the short_key (a-z, A-Z, 0-9)",
        "Geographic partitioning based on the user's region to reduce cross-region latency",
      ]),
      correct_answer:
        "Hash-based partitioning on the short_key using consistent hashing",
      explanation:
        "Hash-based partitioning on the short_key distributes URLs uniformly across shards since the short keys are effectively random (base62 encoded or pre-generated). Consistent hashing ensures minimal data movement when adding or removing shards. This perfectly suits the primary access pattern: looking up a URL by its short_key. Range-based partitioning on timestamp creates write hotspots (all new URLs go to the latest partition). Partitioning on the first character creates uneven distribution if certain characters appear more frequently. Geographic partitioning doesn't match the access pattern since any user anywhere can access any short URL.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "Your URL shortener's KGS (Key Generation Service) pre-generates keys in a database with two tables: 'free_keys' and 'used_keys'. During a deployment, an application server crashes before using all its allocated keys. What should happen to the allocated but unused keys?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The keys are permanently lost — generate new keys to replace them",
        "The KGS detects the server crash via health checks and recycles the unused keys back to the free_keys table",
        "The keys remain in a 'pending' state and are automatically reassigned after a timeout",
        "Each key has a TTL and expires back to the free pool after 24 hours",
      ]),
      correct_answer:
        "The KGS detects the server crash via health checks and recycles the unused keys back to the free_keys table",
      explanation:
        "When a server crashes, its allocated but unused keys must be recycled to avoid key exhaustion. The KGS tracks which keys were allocated to which server (batch allocation records). When a health check detects a server crash or decommission, the KGS identifies unused keys from that server's batch and moves them back to the free_keys table. Simply generating new keys wastes the pre-generated pool. TTL-based expiration could work but adds complexity and delays key reuse. A 'pending' state adds unnecessary complexity compared to proactive recycling.",
      difficulty: "hard",
      order_index: 5,
    },
  ],
  "design-chat-system": [
    {
      question_text:
        "You're designing a chat system that must support 500 million concurrent users with real-time message delivery under 100ms. Which communication protocol should you choose for the primary chat connection?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "HTTP Long Polling — the server holds the connection open until a message is available, then the client reconnects",
        "Server-Sent Events (SSE) — the server pushes events over a persistent HTTP connection",
        "WebSocket — full-duplex, persistent connection that allows both client and server to push data at any time",
        "HTTP/2 Server Push — the server proactively sends resources to the client over HTTP/2",
      ]),
      correct_answer:
        "WebSocket — full-duplex, persistent connection that allows both client and server to push data at any time",
      explanation:
        "WebSocket is the correct choice for real-time chat. It provides full-duplex communication over a single persistent TCP connection, allowing both the client and server to send data at any time with minimal overhead (just 2-byte frame headers vs. HTTP headers on every request). HTTP Long Polling works but creates a new connection for each response, adding latency and server overhead. SSE is server-to-client only — the client can't push messages back over the same connection. HTTP/2 Server Push is designed for preloading web resources, not real-time messaging.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text:
        "In your chat system, a user sends a message to a group with 300 members. Using fan-out-on-write, this creates 299 write operations. Your system architect proposes a hybrid approach. What is the recommended strategy?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Always use fan-out-on-write for all groups regardless of size for consistent behavior",
        "Always use fan-out-on-read for all groups to minimize write amplification",
        "Use fan-out-on-write for small groups (< 100 members) and fan-out-on-read for large groups (≥ 100 members)",
        "Use fan-out-on-read for 1-on-1 chats and fan-out-on-write for all group chats",
      ]),
      correct_answer:
        "Use fan-out-on-write for small groups (< 100 members) and fan-out-on-read for large groups (≥ 100 members)",
      explanation:
        "The hybrid approach optimizes for both read and write performance. For small groups (< 100 members), fan-out-on-write is efficient — the write amplification is bounded, and recipients get instant delivery via their personal inbox (fast reads). For large groups (≥ 100 members), fan-out-on-write becomes prohibitively expensive — a single message would create hundreds of writes. Fan-out-on-read writes the message once and lets members pull it when they open the conversation. Always using one strategy creates either read bottlenecks (fan-out-on-read for 1-on-1 chats) or write storms (fan-out-on-write for large groups).",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "Your chat system uses a heartbeat-based presence service. A user's phone loses network connectivity abruptly (no graceful disconnect). How does the system detect that the user is offline?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The WebSocket 'close' event fires immediately when the TCP connection drops, triggering an offline status update",
        "The client sends a 'going offline' message before disconnecting, and the server updates the status",
        "The presence service uses Redis keys with TTL — if no heartbeat refreshes the TTL within the timeout window (e.g., 30 seconds), the key expires and the user is considered offline",
        "The server pings the client over HTTP every second and marks the user offline after a single failed ping",
      ]),
      correct_answer:
        "The presence service uses Redis keys with TTL — if no heartbeat refreshes the TTL within the timeout window (e.g., 30 seconds), the key expires and the user is considered offline",
      explanation:
        "When a network connection drops abruptly (phone loses signal, battery dies), there is no graceful WebSocket close event — the TCP connection simply goes silent. The heartbeat mechanism handles this: the client sends a ping every 5 seconds, which refreshes a Redis key with a 30-second TTL. If the client stops sending heartbeats (due to network loss), the Redis key expires after 30 seconds, and the presence service marks the user as offline. The TCP 'close' event is unreliable for ungraceful disconnects — it may take minutes for the OS to detect a dead connection. HTTP pinging every second is wasteful and doesn't solve the problem differently.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "Your chat system needs to generate message IDs that are globally unique, time-sortable, and can be generated independently by thousands of servers without coordination. Which approach is best?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "UUID v4 — 128-bit random identifiers that are globally unique",
        "Auto-incrementing database sequence shared across all servers",
        "Snowflake IDs — 64-bit IDs composed of timestamp (41 bits), datacenter ID (5 bits), machine ID (5 bits), and sequence number (12 bits)",
        "Unix timestamp in milliseconds concatenated with the server hostname",
      ]),
      correct_answer:
        "Snowflake IDs — 64-bit IDs composed of timestamp (41 bits), datacenter ID (5 bits), machine ID (5 bits), and sequence number (12 bits)",
      explanation:
        "Snowflake IDs are ideal for chat message IDs because they satisfy all three requirements: (1) Globally unique — the combination of timestamp + datacenter + machine + sequence guarantees uniqueness without coordination. (2) Time-sortable — the timestamp is in the most significant bits, so IDs sort chronologically (critical for chat message ordering). (3) Decentralized — each server generates IDs independently using its assigned datacenter and machine IDs. UUID v4 is random and not time-sortable, making pagination and ordering expensive. Auto-incrementing sequences require a central coordinator, creating a bottleneck. Timestamp + hostname is not granular enough and could collide.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "Your chat system supports end-to-end encryption (E2EE). A user reports that push notifications show 'You have a new message' instead of the actual message preview. The PM asks you to show message previews in notifications. What is your response?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Decrypt the message on the notification server and include the preview in the push payload",
        "Store a plaintext copy of the last message on the server specifically for notification previews",
        "Explain that with E2EE, the server cannot read message content — previews are only possible if the client decrypts locally after receiving the notification",
        "Disable E2EE for messages that trigger push notifications so the server can include previews",
      ]),
      correct_answer:
        "Explain that with E2EE, the server cannot read message content — previews are only possible if the client decrypts locally after receiving the notification",
      explanation:
        "End-to-end encryption means the server acts as a blind relay — it never has access to plaintext message content. The server cannot decrypt messages to include previews in push notifications because it doesn't have the private key. The correct approach is: (1) Send a 'silent' push notification that wakes up the client app, (2) The client app fetches and decrypts the message locally, (3) The client displays a local notification with the decrypted preview. This is how Signal and WhatsApp handle it. Decrypting on the server, storing plaintext copies, or disabling E2EE all violate the security model and defeat the purpose of end-to-end encryption.",
      difficulty: "hard",
      order_index: 5,
    },
  ],
};

export default quiz;
