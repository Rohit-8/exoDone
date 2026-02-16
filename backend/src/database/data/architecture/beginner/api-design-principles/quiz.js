// ============================================================================
// API Design Principles — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 1: RESTful API Design (8 questions)
  // ─────────────────────────────────────────────────────────────────────────
  "restful-api-design": [
    {
      question_text:
        "Which of the six REST constraints is violated when a server stores user session data in memory (e.g., an in-memory cart object), and what is the practical consequence?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The Stateless constraint is violated — each request must contain all information needed to process it (authentication token, user context, etc.); storing session state in server memory means requests must be routed to the same server instance (sticky sessions), which breaks horizontal scaling because adding more servers doesn't distribute load evenly, and if that server crashes, the session is lost entirely; the fix is to store state in an external store (database, Redis) that all instances can access",
        "The Client-Server constraint is violated — storing data on the server means the client and server are not properly separated; the client should always store all its own data locally and never rely on the server for state management; this is why localStorage was invented",
        "The Cacheable constraint is violated — storing session data prevents the response from being cached by intermediaries; every session-dependent response must include Cache-Control: no-store, which eliminates all caching benefits and forces every request to hit the origin server",
        "The Layered System constraint is violated — session storage creates a direct dependency between the client and a specific server instance, which means CDNs and load balancers cannot be used; the solution is to use a message queue between the client and server to decouple them",
      ]),
      correct_answer:
        "The Stateless constraint is violated — each request must contain all information needed to process it (authentication token, user context, etc.); storing session state in server memory means requests must be routed to the same server instance (sticky sessions), which breaks horizontal scaling because adding more servers doesn't distribute load evenly, and if that server crashes, the session is lost entirely; the fix is to store state in an external store (database, Redis) that all instances can access",
      explanation:
        "Statelessness is perhaps the most important REST constraint for scalability. When every request is self-contained (carrying its own auth token, user ID, etc.), any server instance can handle any request. This enables true horizontal scaling — just add more instances behind a load balancer. Sticky sessions are a band-aid that creates a single point of failure. In interviews, mention that JWTs are a common stateless authentication mechanism: the token itself contains the claims, so no server-side session lookup is needed.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text:
        "A client sends `PUT /api/v1/users/123` with `{ \"name\": \"Alice\", \"email\": \"alice@example.com\" }`, but the user resource also has `role`, `avatar_url`, and `bio` fields. What happens to the omitted fields, and how does this differ from PATCH?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "PUT performs a full replacement — the omitted fields (role, avatar_url, bio) are set to their default values or null, because PUT semantics mean 'this is the complete new state of the resource'; PATCH only updates the specified fields, leaving omitted fields unchanged; this is why PUT is idempotent (sending the same PUT twice yields the same state) while PATCH idempotency depends on the patch format used (JSON Merge Patch vs JSON Patch)",
        "PUT and PATCH behave identically — both only update the fields that are provided in the request body and leave other fields unchanged; the only difference is naming convention — PUT is used for creating resources while PATCH is used for updating them; omitted fields are never affected by either method",
        "PUT fails with a 422 Unprocessable Entity error because all fields are required for a PUT request — you cannot omit any fields; PATCH allows partial updates but also requires you to explicitly list which fields you want to keep unchanged using a special '__keep' prefix",
        "PUT updates only the provided fields like PATCH, but it also validates that all required fields are present in the request — if a required field is omitted, it returns 400 Bad Request; PATCH skips validation entirely and directly updates the database with whatever fields are provided",
      ]),
      correct_answer:
        "PUT performs a full replacement — the omitted fields (role, avatar_url, bio) are set to their default values or null, because PUT semantics mean 'this is the complete new state of the resource'; PATCH only updates the specified fields, leaving omitted fields unchanged; this is why PUT is idempotent (sending the same PUT twice yields the same state) while PATCH idempotency depends on the patch format used (JSON Merge Patch vs JSON Patch)",
      explanation:
        "This is one of the most commonly misunderstood distinctions in REST. PUT says 'replace the entire resource with this representation' — if a field isn't in the payload, it's effectively being set to null/default. PATCH says 'modify only these specific fields.' Many APIs incorrectly implement PUT with PATCH semantics (only updating provided fields). In an interview, you can mention that JSON Merge Patch (RFC 7396) is idempotent because applying the same merge patch twice yields the same result, while JSON Patch (RFC 6902) operations like 'add to array' are not idempotent because they append each time.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text:
        "An API returns `403 Forbidden` when a regular user tries to access `GET /api/v1/admin/reports`. A colleague argues it should return `404 Not Found` instead. Who is correct, and why?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Both approaches are valid, but 404 is generally preferred for sensitive resources — returning 403 confirms the endpoint exists, which leaks information to potential attackers (they now know there IS an admin reports endpoint); returning 404 hides the endpoint's existence entirely and is a security best practice called 'security through obscurity as defense-in-depth'; however, 403 is appropriate when the resource existence is already known (e.g., a user trying to edit another user's profile)",
        "403 is always correct and 404 should never be used for authorization failures — security relies on proper access controls, not hiding endpoints; using 404 for authorization failures violates the HTTP specification which clearly states that 404 means 'resource does not exist' and using it for any other purpose is incorrect",
        "404 is always correct for any request that the server won't fulfill, regardless of the reason — this simplifies error handling on the client side because the client only needs to handle one 'access denied' status code; 403 should only be used when the server literally cannot process the request due to a firewall rule",
        "The colleague is wrong because 403 and 404 serve completely different purposes and should never be interchanged — 403 means the server understood the request but refuses it, while 404 means the URL doesn't match any route; mixing them would confuse API consumers and break client-side error handling",
      ]),
      correct_answer:
        "Both approaches are valid, but 404 is generally preferred for sensitive resources — returning 403 confirms the endpoint exists, which leaks information to potential attackers (they now know there IS an admin reports endpoint); returning 404 hides the endpoint's existence entirely and is a security best practice called 'security through obscurity as defense-in-depth'; however, 403 is appropriate when the resource existence is already known (e.g., a user trying to edit another user's profile)",
      explanation:
        "This is a nuanced security question that interviewers love. GitHub uses this exact pattern: requesting a private repository you don't have access to returns 404, not 403, because returning 403 would confirm the repository exists. The general rule: use 403 when the resource existence is not sensitive (user profile, public page). Use 404 when the resource existence itself is sensitive (admin endpoints, other users' private data). This is defense-in-depth — it doesn't replace proper authorization, but it adds an extra layer.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "Your API's product listing endpoint uses offset-based pagination (`?page=500&per_page=20`). Users report that deep pages (page 500+) load extremely slowly on a table with 2 million rows. What is the root cause, and what pagination strategy would you recommend instead?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The root cause is that SQL OFFSET scans and discards all preceding rows — for page 500 with per_page=20, the database must scan 9,980 rows before returning the 20 requested rows (OFFSET is O(n) where n is the offset value); the fix is cursor-based pagination: encode a pointer to the last seen item (e.g., base64-encoded {id, created_at}) and use WHERE (created_at, id) < ($cursor_date, $cursor_id) which leverages indexes for O(log n) performance regardless of position; keyset pagination (WHERE id > $last_id) is even simpler if ordering by a sequential column",
        "The root cause is that the database doesn't have enough memory to cache all 2 million rows — adding more RAM or using a larger database instance would solve the problem; pagination strategy doesn't affect performance because the database always has to read the entire table regardless of the LIMIT/OFFSET values used",
        "The root cause is network latency — transferring page metadata (total_count, total_pages) requires the database to scan the entire table for COUNT(*); removing the total count from the response would fix the slowness; the pagination strategy itself (offset vs cursor) doesn't matter because the SQL query execution time is the same",
        "The root cause is that the application server is creating too many JavaScript objects to serialize — 2 million rows means the JSON serializer is running out of memory; the fix is to use streaming JSON serialization or to reduce the per_page size to 5 items; cursor-based pagination has the same performance because it still queries the same table",
      ]),
      correct_answer:
        "The root cause is that SQL OFFSET scans and discards all preceding rows — for page 500 with per_page=20, the database must scan 9,980 rows before returning the 20 requested rows (OFFSET is O(n) where n is the offset value); the fix is cursor-based pagination: encode a pointer to the last seen item (e.g., base64-encoded {id, created_at}) and use WHERE (created_at, id) < ($cursor_date, $cursor_id) which leverages indexes for O(log n) performance regardless of position; keyset pagination (WHERE id > $last_id) is even simpler if ordering by a sequential column",
      explanation:
        "This is a classic performance question. SQL's OFFSET clause doesn't 'skip' rows — it reads and discards them. So OFFSET 10000 reads 10,000 rows then throws them away. Cursor-based pagination avoids this by using a WHERE clause that directly seeks to the right position via an index. The cursor should be opaque to the client (base64-encoded) so you can change the underlying fields without breaking clients. Keyset pagination (WHERE id > N) is the simplest variant but requires a unique sequential column. In interviews, mention that Stripe, Slack, and Facebook all use cursor-based pagination for exactly this reason.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "A payment API receives a `POST /api/v1/charges` request. The server successfully creates the charge and debits the customer's card, but the response is lost due to a network timeout. The client retries the exact same request. Without any idempotency mechanism, what happens, and how do you prevent it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Without idempotency protection, the customer is charged TWICE — POST is not naturally idempotent, so the server treats the retry as a new request and creates a second charge; the solution is the Idempotency-Key pattern: the client sends a unique key in the header (Idempotency-Key: idem_abc123), and the server stores the response in Redis with this key; on retry, the server detects the duplicate key and returns the cached original response instead of processing again; Stripe, PayPal, and all payment APIs require this header for POST requests",
        "Nothing bad happens — modern payment processors automatically detect duplicate charges by comparing the amount, currency, and card number within a 5-minute window; the POST endpoint doesn't need any special handling because the payment gateway handles deduplication; Idempotency-Key headers are optional convenience features for logging purposes",
        "The server returns a 409 Conflict response on the retry because it detects that a charge with the same amount and customer already exists in the database; POST endpoints automatically handle duplicates by checking all unique constraints; no additional mechanism is needed because SQL UNIQUE constraints prevent double-inserts",
        "The retry fails with 401 Unauthorized because the original authentication token was consumed by the first request — each POST request requires a fresh one-time-use token; this is how payment APIs prevent double charges; the client must re-authenticate before each new POST request",
      ]),
      correct_answer:
        "Without idempotency protection, the customer is charged TWICE — POST is not naturally idempotent, so the server treats the retry as a new request and creates a second charge; the solution is the Idempotency-Key pattern: the client sends a unique key in the header (Idempotency-Key: idem_abc123), and the server stores the response in Redis with this key; on retry, the server detects the duplicate key and returns the cached original response instead of processing again; Stripe, PayPal, and all payment APIs require this header for POST requests",
      explanation:
        "Idempotency is critical for financial operations and any mutation where duplicates cause harm. GET, PUT, and DELETE are naturally idempotent by design, but POST is not — calling it twice creates two resources. The Idempotency-Key pattern works like this: (1) Client generates a UUID and sends it as a header, (2) Server checks Redis for this key before processing, (3) If found, return the cached response, (4) If not found, process the request and cache the response with a TTL (typically 24 hours). This ensures the operation happens exactly once even with network retries. In an interview, emphasize that this is a solved problem — Stripe's API documentation is the gold standard reference.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text:
        "Your API currently returns flat product data. A colleague proposes adding HATEOAS links to the response like `{ _links: { self: '/products/123', reviews: '/products/123/reviews', category: '/categories/5' } }`. Another colleague argues this is unnecessary complexity. When does HATEOAS provide real value, and when is it overkill?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "HATEOAS provides real value when: (1) the API must evolve without breaking clients — new capabilities are added as new links, and URL structures can change freely because clients follow links rather than constructing URLs; (2) available actions depend on resource state — a 'pending' order shows a 'cancel' link but a 'shipped' order does not, which encodes business rules in the API surface; (3) multiple client teams consume the API independently; it's overkill for: internal APIs with one tightly-coupled client, simple CRUD apps, or teams where client and server are updated together",
        "HATEOAS is always required for any API to be considered RESTful — without it, the API is not REST at all, just an HTTP API; it should be implemented for every API regardless of size or complexity because it's part of the REST specification; the complexity argument is invalid because HATEOAS is simple to implement and adds no overhead",
        "HATEOAS is always unnecessary overhead — clients always know the URL structure from the API documentation, so encoding URLs in responses is redundant information; no major production API uses HATEOAS because it doubles the response size and adds latency; the REST community has largely abandoned this constraint",
        "HATEOAS is only useful for APIs that serve HTML browsers — the hypermedia concept comes from web browsers following links in HTML pages; for JSON APIs consumed by mobile apps or JavaScript frontends, HATEOAS links are meaningless because these clients don't have a built-in concept of 'following links'",
      ]),
      correct_answer:
        "HATEOAS provides real value when: (1) the API must evolve without breaking clients — new capabilities are added as new links, and URL structures can change freely because clients follow links rather than constructing URLs; (2) available actions depend on resource state — a 'pending' order shows a 'cancel' link but a 'shipped' order does not, which encodes business rules in the API surface; (3) multiple client teams consume the API independently; it's overkill for: internal APIs with one tightly-coupled client, simple CRUD apps, or teams where client and server are updated together",
      explanation:
        "HATEOAS is the most debated REST constraint. The pragmatic view (which interviewers appreciate) is that it's valuable when it solves real problems: API evolvability for public APIs, state-dependent actions for complex workflows, and discoverability for multiple client teams. The state-dependent actions pattern is particularly powerful — instead of the client checking 'if status === pending, show cancel button', the server simply includes or omits the 'cancel' link. This centralizes business logic on the server. However, for a small team building a SPA with one backend, the overhead isn't justified. Show nuance by acknowledging both sides.",
      difficulty: "hard",
      order_index: 6,
    },
    {
      question_text:
        "You're designing a new API for a startup building a mobile app and a web dashboard. The mobile app needs only 3 fields from the User resource (name, avatar, last_seen), while the web dashboard needs 15+ fields including full activity history. A team member suggests GraphQL. Another prefers REST with sparse fieldsets. What are the trade-offs?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "GraphQL solves the over-fetching/under-fetching problem perfectly: the mobile client requests `{ user { name avatar lastSeen } }` while the dashboard requests all 15+ fields in a single query including nested activity data; however, GraphQL adds complexity: custom caching (no HTTP caching), N+1 query problems without DataLoader, a learning curve for the team, and 'always 200' responses make monitoring harder; REST with sparse fieldsets (`?fields=name,avatar,last_seen`) and compound documents (`?include=activity`) can solve the same problem with less complexity if the client shapes are predictable — choose GraphQL when client data needs are diverse and unpredictable, REST when they're well-defined",
        "GraphQL is always superior to REST for any application with multiple client types — it completely eliminates the need for API versioning, has better performance than REST due to query batching, and is simpler to implement because you define a single schema instead of multiple endpoints; REST with sparse fieldsets is a deprecated pattern that no modern API should use",
        "REST is always superior because HTTP caching is essential for performance — GraphQL responses cannot be cached at all because every query is unique; the mobile app should simply ignore the extra fields from the REST response since JSON parsing overhead is negligible; sparse fieldsets are unnecessary complexity because mobile network bandwidth is no longer a concern with 5G",
        "The decision should be based solely on team familiarity — if the team knows REST, use REST; if they know GraphQL, use GraphQL; the technical trade-offs are irrelevant because both can solve any API problem; the real concern is development speed, not architectural characteristics like caching or query flexibility",
      ]),
      correct_answer:
        "GraphQL solves the over-fetching/under-fetching problem perfectly: the mobile client requests `{ user { name avatar lastSeen } }` while the dashboard requests all 15+ fields in a single query including nested activity data; however, GraphQL adds complexity: custom caching (no HTTP caching), N+1 query problems without DataLoader, a learning curve for the team, and 'always 200' responses make monitoring harder; REST with sparse fieldsets (`?fields=name,avatar,last_seen`) and compound documents (`?include=activity`) can solve the same problem with less complexity if the client shapes are predictable — choose GraphQL when client data needs are diverse and unpredictable, REST when they're well-defined",
      explanation:
        "This question tests whether you can make nuanced architecture decisions rather than dogmatically choosing one technology. GraphQL's strength is query flexibility — each client gets exactly the data it needs in one round trip. But it comes with real costs: HTTP caching doesn't work (every query is a POST with a unique body), N+1 database queries require DataLoader batching, error monitoring is harder because every response is HTTP 200, and the schema/resolver pattern has a learning curve. REST with sparse fieldsets (?fields=...) handles the same scenario with less complexity if you have predictable client shapes. The best answer acknowledges both approaches and explains when each is appropriate.",
      difficulty: "hard",
      order_index: 7,
    },
    {
      question_text:
        "Your API returns the following error for an invalid registration request:\n\n```json\n{ \"error\": \"Something went wrong\" }\n```\n\nWhat are ALL the problems with this error response, and what should it look like according to RFC 7807?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Problems: (1) no HTTP status code in the body (client can't programmatically distinguish error types), (2) no machine-readable error code/type (clients must parse the human-readable string), (3) no field-level details (client doesn't know WHICH field is invalid), (4) generic message gives no actionable guidance, (5) no request_id for debugging, (6) no timestamp; RFC 7807 format: { type: 'https://api.example.com/errors/validation-error', title: 'Validation Error', status: 422, detail: 'One or more fields failed validation', instance: '/api/v1/users/register', errors: [{ field: 'email', message: 'Invalid format', code: 'INVALID_FORMAT' }, { field: 'password', message: 'Min 8 characters', code: 'TOO_SHORT' }], request_id: 'req_abc', timestamp: '2025-01-15T10:30:00Z' }",
        "The only problem is that the message is too vague — replacing it with 'Validation failed for email field' would be sufficient; the error response doesn't need a type URI, status code, or field-level details because the HTTP status code in the response header already communicates the error type; RFC 7807 is an optional standard that adds unnecessary verbosity",
        "The problem is that the error uses a string instead of an error code number — the fix is to return { errorCode: 1001, error: 'Something went wrong' } where 1001 maps to a validation error in the documentation; RFC 7807 is only for XML APIs and doesn't apply to JSON APIs; most modern APIs use numeric error codes instead",
        "The response is fine for development but needs a stack trace added for production debugging — the ideal format is { error: 'Something went wrong', stack: 'Error at validator.js:42...', sql: 'SELECT * FROM users WHERE...' } so that frontend developers can debug issues without checking server logs; RFC 7807 is too restrictive because it doesn't allow stack traces",
      ]),
      correct_answer:
        "Problems: (1) no HTTP status code in the body (client can't programmatically distinguish error types), (2) no machine-readable error code/type (clients must parse the human-readable string), (3) no field-level details (client doesn't know WHICH field is invalid), (4) generic message gives no actionable guidance, (5) no request_id for debugging, (6) no timestamp; RFC 7807 format: { type: 'https://api.example.com/errors/validation-error', title: 'Validation Error', status: 422, detail: 'One or more fields failed validation', instance: '/api/v1/users/register', errors: [{ field: 'email', message: 'Invalid format', code: 'INVALID_FORMAT' }, { field: 'password', message: 'Min 8 characters', code: 'TOO_SHORT' }], request_id: 'req_abc', timestamp: '2025-01-15T10:30:00Z' }",
      explanation:
        "Error response design is a critical API skill. RFC 7807 (Problem Details for HTTP APIs) provides a standard structure: 'type' is a URI identifying the error category, 'title' is a short human-readable summary, 'status' mirrors the HTTP status code, 'detail' provides a specific explanation, and 'instance' identifies the specific request URL. The field-level 'errors' array is essential for form validation UIs — without it, the client can't highlight which field is wrong. The 'request_id' enables support workflows: a user reports 'I got an error', support looks up the request_id in logs to find the full context. Never expose stack traces, SQL queries, or internal file paths in production — these are security vulnerabilities (information disclosure).",
      difficulty: "medium",
      order_index: 8,
    },
  ],
};

export default quiz;
