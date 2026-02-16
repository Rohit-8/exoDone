// ============================================================================
// Scalability & Performance — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 1: Caching Strategies (5 questions)
  // ─────────────────────────────────────────────────────────────────────────
  "caching-strategies": [
    {
      question_text:
        "A service uses cache-aside (lazy loading) to cache user profiles in Redis with a 1-hour TTL. After a user updates their profile, other users still see the old data for up to an hour. What is the best fix, and why is TTL alone insufficient?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Add event-based invalidation — when the profile is updated in the database, explicitly delete the cache key (e.g., redis.del('user:123')); this ensures the next read triggers a cache miss and fetches the fresh data from the database; TTL alone is insufficient because it only guarantees staleness is bounded (up to 1 hour), not eliminated; combining TTL as a safety net with event-based invalidation as the primary mechanism gives both freshness and protection against missed invalidation events",
        "Reduce the TTL to 1 second so stale data is never visible — shorter TTLs eliminate staleness entirely with no downsides; the only reason to use longer TTLs is laziness; a 1-second TTL means users always see fresh data because the cache refreshes every second from the database automatically",
        "Switch from cache-aside to write-behind — write-behind caches always contain the latest data because writes go to the cache first; this completely eliminates staleness because the database is updated asynchronously and the cache is the source of truth; TTL is unnecessary with write-behind",
        "Use a read-through cache instead — read-through caches never serve stale data because they always check the database on every request; the 'read-through' pattern means the cache passes the read through to the database every time, using the cached value only if the database is unavailable",
      ]),
      correct_answer:
        "Add event-based invalidation — when the profile is updated in the database, explicitly delete the cache key (e.g., redis.del('user:123')); this ensures the next read triggers a cache miss and fetches the fresh data from the database; TTL alone is insufficient because it only guarantees staleness is bounded (up to 1 hour), not eliminated; combining TTL as a safety net with event-based invalidation as the primary mechanism gives both freshness and protection against missed invalidation events",
      explanation:
        "TTL provides an upper bound on staleness but doesn't prevent it. Event-based invalidation deletes the cache key the moment data changes, so the next read fetches fresh data. In production, you combine both: event-based invalidation for immediate freshness plus TTL as a safety net in case an invalidation event is lost (network issue, bug). In interviews, mention that write-through (not write-behind) updates the cache on write, but still doesn't solve the problem of other related cache keys (e.g., listing caches) — you need explicit invalidation for those.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "A popular e-commerce site caches its homepage product list in Redis with a 5-minute TTL. At exactly the TTL boundary, hundreds of simultaneous requests find the cache empty and all hit the database at once, causing a brief outage. What is this problem called, and what are two effective solutions?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "This is the cache stampede (thundering herd) problem — Solution 1: Mutex locking — use Redis SET with NX (set-if-not-exists) to let only one request fetch from the database while others wait and retry; the winner populates the cache and all subsequent requests get the cached value; Solution 2: Probabilistic early expiration — randomly refresh the cache before the TTL expires so that expiration is staggered across time; for example, when remaining TTL drops below 10%, each request has a 20% chance of proactively refreshing the cache, spreading the refresh load across multiple requests instead of all at once",
        "This is the cache avalanche problem — the only solution is to set different TTLs for every cache key by adding a random jitter (e.g., 5 minutes ± 30 seconds); this prevents all keys from expiring simultaneously; mutex locking doesn't work because Redis doesn't support atomic operations needed for locking",
        "This is the cache penetration problem — it happens when users request data that doesn't exist, bypassing the cache entirely; the solution is to cache null values (negative caching) with a short TTL so that repeated requests for non-existent data are served from cache; bloom filters can also help by rejecting requests for keys that definitely don't exist",
        "This is the cold start problem — it only happens when the application first starts and the cache is empty; the solution is to pre-warm the cache on application startup by loading all data from the database into Redis before accepting traffic; once warmed, this problem never recurs because TTL-based expiration refreshes keys individually",
      ]),
      correct_answer:
        "This is the cache stampede (thundering herd) problem — Solution 1: Mutex locking — use Redis SET with NX (set-if-not-exists) to let only one request fetch from the database while others wait and retry; the winner populates the cache and all subsequent requests get the cached value; Solution 2: Probabilistic early expiration — randomly refresh the cache before the TTL expires so that expiration is staggered across time; for example, when remaining TTL drops below 10%, each request has a 20% chance of proactively refreshing the cache, spreading the refresh load across multiple requests instead of all at once",
      explanation:
        "Cache stampede occurs when a hot key expires and many concurrent requests simultaneously try to regenerate it, overwhelming the database. Mutex locking (using Redis SETNX) is the most common solution — only one process regenerates while others wait. Probabilistic early expiration is more elegant — requests proactively refresh the cache before TTL expires, so there's never a moment when the key is absent. Note: cache avalanche is a related but different problem where many different keys expire at the same time; the jitter solution applies to avalanche specifically. Cache penetration is about non-existent keys bypassing cache.",
      difficulty: "hard",
      order_index: 2,
    },
    {
      question_text:
        "You're designing the caching layer for an API. Static product images should be cached for 1 year, the product listing API should be cached by CDNs for 5 minutes and browsers for 1 minute, and user-specific cart data should never be cached by CDNs. What Cache-Control headers would you set for each?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Product images: 'public, max-age=31536000, immutable' — cached by browsers and CDNs for 1 year, 'immutable' tells browsers not to revalidate even on reload (use content-hash filenames for cache busting); Product listing: 'public, max-age=60, s-maxage=300, stale-while-revalidate=30' — browsers cache 1 min, CDNs cache 5 min, CDNs can serve stale for 30s while fetching fresh in background; Cart data: 'private, no-cache' — 'private' prevents CDNs from caching, 'no-cache' means browsers must revalidate with the origin before using cached data",
        "Product images: 'no-store' — images should never be cached because they might change; use versioned URLs instead of caching; Product listing: 'public, max-age=300' — both browsers and CDNs cache for 5 minutes; there's no way to set different durations for browsers vs CDNs; Cart data: 'public, max-age=0' — setting max-age=0 prevents caching entirely",
        "Product images: 'public, max-age=86400' — cache for 1 day, not 1 year, because browsers have a maximum cache duration of 24 hours; Product listing: 'private, max-age=300' — use 'private' for all API responses because APIs return dynamic data; Cart data: 'no-store, no-cache, must-revalidate' — you need all three directives because each one alone is insufficient",
        "Product images: 'public, s-maxage=31536000' — use s-maxage instead of max-age for static assets because max-age only works for dynamic content; Product listing: 'public, max-age=300' — CDNs automatically use a shorter cache time than specified in max-age; Cart data: 'public, max-age=0, must-revalidate' — 'public' is fine for cart data because max-age=0 means it's always revalidated anyway",
      ]),
      correct_answer:
        "Product images: 'public, max-age=31536000, immutable' — cached by browsers and CDNs for 1 year, 'immutable' tells browsers not to revalidate even on reload (use content-hash filenames for cache busting); Product listing: 'public, max-age=60, s-maxage=300, stale-while-revalidate=30' — browsers cache 1 min, CDNs cache 5 min, CDNs can serve stale for 30s while fetching fresh in background; Cart data: 'private, no-cache' — 'private' prevents CDNs from caching, 'no-cache' means browsers must revalidate with the origin before using cached data",
      explanation:
        "Understanding Cache-Control nuances is essential. 'immutable' tells browsers never to revalidate (not even on manual reload) — perfect for fingerprinted assets like main.a3b2c1.js. The difference between max-age (for all caches including browsers) and s-maxage (for shared caches like CDNs only) lets you set different durations per cache layer. 'stale-while-revalidate' serves a stale response while fetching fresh data in the background — users never see loading. 'private' prevents CDNs and proxies from storing the response. 'no-cache' doesn't mean 'don't cache' — it means 'always revalidate before using cached data.'",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text:
        "Your Redis instance is configured with 2GB maxmemory and the 'allkeys-lru' eviction policy. A team member suggests switching to 'volatile-lru'. What is the difference, and when would you choose each?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "'allkeys-lru' evicts the least-recently-used key from ALL keys when memory is full, regardless of whether they have a TTL set; 'volatile-lru' only evicts keys that have a TTL (expire) set, leaving keys without expiration untouched; choose 'allkeys-lru' when Redis is used purely as a cache (all data is re-fetchable from the database); choose 'volatile-lru' when Redis stores a mix of cache data (with TTL) and persistent data (without TTL, like configuration or session data) that should never be evicted",
        "'allkeys-lru' and 'volatile-lru' behave identically — both evict the least-recently-used keys; the 'volatile' prefix just means eviction happens more aggressively (more frequently) to keep memory usage lower; choose 'volatile-lru' for better performance and 'allkeys-lru' for higher memory utilization",
        "'allkeys-lru' evicts keys based on when they were created (oldest first), while 'volatile-lru' evicts keys based on when they were last accessed (least recently used); 'allkeys' refers to FIFO ordering and 'volatile' refers to LRU ordering; always use volatile-lru because LRU is strictly better than FIFO",
        "'volatile-lru' uses less CPU because it only scans keys with TTL, making it always faster; 'allkeys-lru' causes Redis to pause while scanning all keys for eviction candidates; choose 'volatile-lru' for production and 'allkeys-lru' only for development where performance doesn't matter",
      ]),
      correct_answer:
        "'allkeys-lru' evicts the least-recently-used key from ALL keys when memory is full, regardless of whether they have a TTL set; 'volatile-lru' only evicts keys that have a TTL (expire) set, leaving keys without expiration untouched; choose 'allkeys-lru' when Redis is used purely as a cache (all data is re-fetchable from the database); choose 'volatile-lru' when Redis stores a mix of cache data (with TTL) and persistent data (without TTL, like configuration or session data) that should never be evicted",
      explanation:
        "The key distinction is which keys are candidates for eviction. 'allkeys-lru' considers every key — perfect when Redis is a pure cache and everything can be regenerated. 'volatile-lru' only touches keys with an expiration set, so persistent keys (counters, locks, config) are safe. A common mistake is using 'volatile-lru' when no keys have TTLs set — Redis will return errors instead of evicting anything! In production, if you use Redis as a cache only, 'allkeys-lru' is almost always the right choice. Redis also supports LFU variants (allkeys-lfu, volatile-lfu) for workloads where frequency matters more than recency.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "An application has 4 cache layers: browser, CDN, application (in-process Map), and Redis. A request for product data flows through all layers. In what order are they checked, and what happens at each layer on a full cache miss?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Order: Browser (0ms) → CDN (2-10ms) → App in-process cache (0ms) → Redis (1-5ms) → Database (5-50ms); on full miss: browser has no cached response, CDN edge has no cached response, in-process Map returns null, Redis returns null, database query executes and returns data; data then flows back: stored in Redis with TTL, stored in in-process Map with short TTL (5-10s), CDN caches per Cache-Control headers, browser caches per Cache-Control headers; subsequent requests hit the closest layer that has the data, avoiding the database entirely",
        "Order: Redis → CDN → Browser → App cache → Database; Redis is always checked first because it's the most reliable cache; if Redis misses, the CDN is checked; if the CDN misses, the browser cache is checked; the app cache is checked last before hitting the database; this order ensures the most persistent cache is checked first",
        "Order: Database → Redis → App cache → CDN → Browser; the database is always queried first to get the freshest data; each layer caches the response as it flows outward; on subsequent requests, the outermost layer (browser) that has data serves it; caches are populated bottom-up, checked top-down, but only after an initial database query",
        "Order: CDN → Redis → Browser → Database → App cache; CDNs are always the first layer because they're geographically closest; if the CDN misses, Redis is checked before the browser because Redis is shared across users; the app cache is populated last because it's the least useful layer",
      ]),
      correct_answer:
        "Order: Browser (0ms) → CDN (2-10ms) → App in-process cache (0ms) → Redis (1-5ms) → Database (5-50ms); on full miss: browser has no cached response, CDN edge has no cached response, in-process Map returns null, Redis returns null, database query executes and returns data; data then flows back: stored in Redis with TTL, stored in in-process Map with short TTL (5-10s), CDN caches per Cache-Control headers, browser caches per Cache-Control headers; subsequent requests hit the closest layer that has the data, avoiding the database entirely",
      explanation:
        "Multi-layer caching checks the cheapest, closest layer first and falls back to progressively more expensive layers. Browser cache (zero network cost) → CDN edge (nearest geographic PoP, 2-10ms) → in-process memory (no network, but only this server instance) → Redis (network hop, but shared across all instances) → database (most expensive). Each layer has different TTLs: browser might cache 60s, CDN 5 min, in-process 5-10s (to avoid stale data across instances), Redis 1 hour. The in-process cache has the shortest TTL because it's not shared — different instances could serve different data if the TTL is too long.",
      difficulty: "easy",
      order_index: 5,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 2: Load Balancing & Horizontal Scaling (5 questions)
  // ─────────────────────────────────────────────────────────────────────────
  "load-balancing-horizontal-scaling": [
    {
      question_text:
        "Your system uses 3 cache servers with modular hashing (key.hashCode() % 3) to distribute cache keys. When you add a 4th server, nearly all cached data becomes inaccessible, causing a massive spike in database load. What went wrong, and what hashing strategy prevents this?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Modular hashing redistributes almost all keys when the number of servers changes — a key that mapped to server (hash % 3 = 1) now maps to (hash % 4 = 2), causing a near-total cache miss; consistent hashing solves this by placing servers on a hash ring and mapping each key to the next server clockwise; when a 4th server is added, only ~25% of keys (1/N) are redistributed to the new server while the rest stay on their original servers; virtual nodes (100-200 per server) ensure even key distribution across the ring",
        "The problem is that cache servers don't share data — when a new server is added, you need to manually copy all existing cache entries to it using Redis MIGRATE; modular hashing is fine as long as you pre-warm the new server before adding it to the rotation; consistent hashing is an alternative but is only useful for databases, not caches",
        "Modular hashing failed because the hash function produces collisions when the modulus changes — using a better hash function like SHA-256 instead of hashCode() would distribute keys evenly across any number of servers; consistent hashing and modular hashing produce identical distributions; the real solution is to use a hash function with fewer collisions",
        "This is the split-brain problem — the 4 servers disagree on which server owns which key; the solution is to use a consensus protocol like Raft or Paxos to agree on key ownership; consistent hashing doesn't solve this because it's vulnerable to the same split-brain issues",
      ]),
      correct_answer:
        "Modular hashing redistributes almost all keys when the number of servers changes — a key that mapped to server (hash % 3 = 1) now maps to (hash % 4 = 2), causing a near-total cache miss; consistent hashing solves this by placing servers on a hash ring and mapping each key to the next server clockwise; when a 4th server is added, only ~25% of keys (1/N) are redistributed to the new server while the rest stay on their original servers; virtual nodes (100-200 per server) ensure even key distribution across the ring",
      explanation:
        "With modular hashing and N servers, changing N causes O(K) key migrations where K is the total number of keys — almost everything moves. With consistent hashing, only K/N keys move (the keys between the new server and its predecessor on the ring). Virtual nodes solve the uneven distribution problem — without them, servers might own wildly different portions of the ring. This is used in production by Redis Cluster, Amazon DynamoDB, Apache Cassandra, and Akamai CDN. In interviews, draw the hash ring and show how only the arc between the new node and its predecessor is affected.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text:
        "A team deploys their Node.js API across 5 identical servers behind a round-robin load balancer. Users report that their shopping cart randomly appears empty. What is the root cause, and how should the team fix it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The API is stateful — shopping cart data is stored in each server's memory (e.g., req.session with in-memory store); round-robin sends subsequent requests to different servers, which don't have that user's session; Fix: make the service stateless by moving session data to a shared external store (Redis via connect-redis, or a database); then any server can handle any request because session data is accessible from all instances; avoid sticky sessions as they create uneven load and single points of failure",
        "Round-robin is the wrong algorithm — it should use IP hash so the same user always reaches the same server; this prevents the cart from appearing empty because the user's requests always go to the server that has their data; there's no need to change the application code; IP hash is the standard solution for stateful applications",
        "The database is losing cart data due to race conditions — when two requests from the same user hit different servers simultaneously, they overwrite each other's database writes; the fix is to add database-level locking (SELECT ... FOR UPDATE) on the cart table; this is not a load balancing issue",
        "The load balancer is dropping connections — round-robin sometimes fails to route requests correctly, causing the API to return empty responses; the fix is to switch to least-connections, which maintains connection state and ensures continuity; round-robin is only suitable for static content",
      ]),
      correct_answer:
        "The API is stateful — shopping cart data is stored in each server's memory (e.g., req.session with in-memory store); round-robin sends subsequent requests to different servers, which don't have that user's session; Fix: make the service stateless by moving session data to a shared external store (Redis via connect-redis, or a database); then any server can handle any request because session data is accessible from all instances; avoid sticky sessions as they create uneven load and single points of failure",
      explanation:
        "This is the classic stateful-service-behind-load-balancer bug. When session data lives in server memory, it's only available on that specific instance. Round-robin (and least-connections) will route the user's next request to a different instance that has no knowledge of their session. While sticky sessions (IP hash) are a quick fix, they defeat the purpose of horizontal scaling: load becomes uneven, and if a sticky server goes down, all its sessions are lost. The correct architectural solution is stateless services + external session store. In production, use Redis-backed sessions or JWT tokens.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text:
        "You need to choose a load balancing algorithm for an API gateway that routes to backend microservices. Some endpoints (image processing) take 5 seconds, while others (health checks) take 5 milliseconds. Which algorithm is best, and why are the alternatives worse?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Least connections is the best choice — it routes each request to the server with the fewest active connections, naturally adapting to variable processing times; servers handling slow image processing requests accumulate connections and get fewer new requests, while servers finishing fast health checks free up connections and get more traffic; Round-robin would perform poorly here because it sends equal traffic to all servers regardless of how busy they are — a server stuck processing 10 image requests gets the same new traffic as an idle server; IP hash would pin users to specific servers, potentially overloading one server with all image processing requests",
        "Weighted round-robin is the best choice — assign higher weights to servers that handle image processing and lower weights to health check servers; this ensures the slow servers get fewer requests proportional to their processing time; least connections doesn't work because it doesn't account for the difference in request types",
        "IP hash is the best choice — by routing the same client to the same server, you ensure that all of a user's image processing requests are handled by a server that has already warmed up its image processing cache; least connections would constantly shuffle users between servers, losing cached processing context and making image processing even slower",
        "Random selection is the best choice for variable-duration workloads — statistical randomness naturally distributes load evenly over time regardless of processing duration; least connections has high overhead because it must track every connection in real-time, which adds latency to every request; random selection is O(1) while least connections is O(n)",
      ]),
      correct_answer:
        "Least connections is the best choice — it routes each request to the server with the fewest active connections, naturally adapting to variable processing times; servers handling slow image processing requests accumulate connections and get fewer new requests, while servers finishing fast health checks free up connections and get more traffic; Round-robin would perform poorly here because it sends equal traffic to all servers regardless of how busy they are — a server stuck processing 10 image requests gets the same new traffic as an idle server; IP hash would pin users to specific servers, potentially overloading one server with all image processing requests",
      explanation:
        "Least connections is the adaptive algorithm — it responds to real-time server load without needing to know anything about request types or durations. Nginx supports this with the 'least_conn' directive. For even better results, use weighted least connections (score = connections / weight) so that more powerful servers attract proportionally more traffic. In interviews, note that round-robin works well only when all requests have roughly equal processing time (e.g., simple CRUD APIs). For mixed workloads, least connections prevents the convoy effect where slow requests queue up on overloaded servers.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "Your PostgreSQL primary database handles 10,000 reads/second and 500 writes/second. Reads are becoming slow. You add two read replicas, but a developer reports that users sometimes see stale data immediately after updating their profile. What causes this, and what is the best solution?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Asynchronous replication lag — the primary acknowledges the write immediately, but the data hasn't replicated to the read replicas yet; when the user's next request reads from a replica, the old data is returned; Solution: implement 'read-your-own-writes' consistency — after a write, force the next read for that user to hit the primary (e.g., set a short-lived flag in the session); subsequent reads can go back to replicas once enough time has passed for replication; this gives strong consistency for the writing user while keeping the read load distributed",
        "Read replicas contain a separate copy of the data that must be manually synchronized — you need to write to all replicas simultaneously (synchronous replication) to prevent stale reads; set 'synchronous_commit = on' and 'synchronous_standby_names = *' in postgresql.conf; this ensures all replicas have the data before the write is acknowledged to the client",
        "The replicas are returning cached query results from their internal query cache — PostgreSQL caches query results and serves stale data from this cache; the solution is to disable query caching on replicas by setting 'shared_buffers = 0'; this forces every read to fetch data from disk, which will always be up-to-date",
        "The load balancer is sending write queries to the replicas — replicas in PostgreSQL are read-only by default, but some load balancers incorrectly route write traffic to them; the fix is to configure the load balancer with separate upstream blocks for reads and writes, using different ports; stale data is caused by failed writes silently being ignored",
      ]),
      correct_answer:
        "Asynchronous replication lag — the primary acknowledges the write immediately, but the data hasn't replicated to the read replicas yet; when the user's next request reads from a replica, the old data is returned; Solution: implement 'read-your-own-writes' consistency — after a write, force the next read for that user to hit the primary (e.g., set a short-lived flag in the session); subsequent reads can go back to replicas once enough time has passed for replication; this gives strong consistency for the writing user while keeping the read load distributed",
      explanation:
        "Replication lag is the fundamental trade-off of read replicas. Async replication (the default) gives high throughput but eventual consistency; sync replication gives strong consistency but every write must wait for all replicas to acknowledge, drastically reducing write throughput. 'Read-your-own-writes' is the practical middle ground: the user who just wrote gets strong consistency by reading from the primary, while all other users read from replicas. In PostgreSQL, you can monitor replication lag with pg_stat_replication and pg_wal_lsn_diff. Replication lag is typically milliseconds but can spike during heavy write loads.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text:
        "Your Kubernetes deployment runs 3 pods of an API server. The Horizontal Pod Autoscaler (HPA) is configured to scale based on CPU utilization with a target of 70%. Traffic surges at 9 AM, but by the time new pods are ready (90 seconds), the existing pods are already overwhelmed. How do you prevent this?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Use a combination of proactive strategies: (1) Scheduled scaling — pre-scale to more replicas before 9 AM using a CronJob or KEDA scheduled scaler since the traffic pattern is predictable; (2) Custom metrics — scale on request queue depth or p99 latency instead of (or in addition to) CPU, which is a lagging indicator; (3) Set a higher minReplicas baseline that can absorb the initial spike without autoscaling; (4) Optimize pod startup time by using smaller container images, readiness probes with appropriate initialDelaySeconds, and pre-pulling images onto nodes; these strategies together ensure capacity is available before or very quickly after traffic arrives",
        "Increase the HPA maxReplicas from 20 to 100 — the pods are overwhelmed because there aren't enough of them; setting a very high maximum ensures Kubernetes can create as many pods as needed instantly; the 90-second startup time is irrelevant because Kubernetes pre-creates pods in anticipation of traffic spikes using its built-in predictive scaling",
        "Switch from HPA to Vertical Pod Autoscaler (VPA) — instead of adding more pods, make existing pods bigger by automatically increasing their CPU and memory limits; VPA responds instantly because it doesn't need to start new pods; it just gives the existing 3 pods more resources from the node's available capacity without any downtime",
        "Reduce the CPU target from 70% to 10% — this makes the autoscaler much more sensitive, triggering scale-up at very low CPU usage; by the time traffic actually arrives, new pods will already be running because the autoscaler reacted to the first few requests; the downside is slight over-provisioning, but Kubernetes automatically scales down when idle",
      ]),
      correct_answer:
        "Use a combination of proactive strategies: (1) Scheduled scaling — pre-scale to more replicas before 9 AM using a CronJob or KEDA scheduled scaler since the traffic pattern is predictable; (2) Custom metrics — scale on request queue depth or p99 latency instead of (or in addition to) CPU, which is a lagging indicator; (3) Set a higher minReplicas baseline that can absorb the initial spike without autoscaling; (4) Optimize pod startup time by using smaller container images, readiness probes with appropriate initialDelaySeconds, and pre-pulling images onto nodes; these strategies together ensure capacity is available before or very quickly after traffic arrives",
      explanation:
        "Reactive autoscaling alone can't handle sudden traffic spikes because scaling takes time: metrics must be observed (15-30s), the HPA must decide to scale (15s check interval), new pods must be scheduled, pulled, and started (30-90s). For predictable patterns like 9 AM traffic, scheduled scaling is essential — you pre-provision capacity before the spike. Custom metrics like request queue depth or p99 latency are leading indicators (they rise before CPU does), giving the autoscaler more reaction time. In interviews, also mention pod disruption budgets (PDB), cluster autoscaler (for node-level scaling), and the difference between HPA (pod count) and VPA (pod resources).",
      difficulty: "hard",
      order_index: 5,
    },
  ],
};

export default quiz;
