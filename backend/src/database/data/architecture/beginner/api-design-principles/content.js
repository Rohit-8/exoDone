// ============================================================================
// API Design Principles — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "API Design Principles",
  slug: "api-design-principles",
  description:
    "Design clean, consistent, and developer-friendly APIs following RESTful conventions and industry best practices.",
  estimated_time: 160,
  order_index: 2,
};

export const lessons = [
  // ─────────────────────────────────────────────────────────────────────────
  // LESSON 1 — RESTful API Design
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "RESTful API Design",
    slug: "restful-api-design",
    summary:
      "Master RESTful API design from first principles — HTTP methods, resource naming, status codes, pagination, versioning, error handling, rate limiting, HATEOAS, idempotency, security, and when to choose REST vs GraphQL.",
    difficulty_level: "beginner",
    estimated_time: 40,
    order_index: 1,
    key_points: [
      "REST (Representational State Transfer) is an architectural style defined by six constraints: client-server separation, statelessness (each request contains all information needed — no server-side session), cacheability (responses declare themselves cacheable or not), uniform interface (resource identification via URIs, manipulation through representations, self-descriptive messages, HATEOAS), layered system (client cannot tell if it's connected directly to the server or through intermediaries like CDNs/load balancers), and optional code-on-demand; violating statelessness is the #1 mistake — storing user state in server memory breaks horizontal scaling because requests may hit different instances",
      "HTTP methods map to CRUD with precise semantics: GET (read, safe, idempotent, cacheable — never use for mutations), POST (create, unsafe, NOT idempotent — calling twice creates two resources), PUT (full replace, idempotent — sending the same PUT twice yields the same state), PATCH (partial update, may or may not be idempotent depending on the patch format — JSON Merge Patch is idempotent, JSON Patch may not be), DELETE (remove, idempotent — deleting an already-deleted resource returns 204 or 404, both are valid); HEAD and OPTIONS are often forgotten but critical for CORS preflight and cache validation",
      "Resource naming conventions: use nouns not verbs (/users not /getUsers), always plural (/users/123 not /user/123), hierarchical for relationships (/users/123/orders/456), lowercase with hyphens for multi-word resources (/order-items not /orderItems), avoid deeply nested URLs beyond 2-3 levels (use query parameters or resource links instead), never expose implementation details in URLs (/users not /db/tables/users), use query parameters for filtering/sorting/pagination (/users?role=admin&sort=-created_at&page=2)",
      "Status codes communicate intent precisely: 200 OK (successful GET/PUT/PATCH), 201 Created (successful POST — include Location header with URI of new resource), 204 No Content (successful DELETE or PUT with no response body), 400 Bad Request (malformed syntax, missing required field), 401 Unauthorized (actually means 'unauthenticated' — no valid credentials provided), 403 Forbidden (authenticated but lacks permission), 404 Not Found (resource doesn't exist — also use to hide existence from unauthorized users), 409 Conflict (e.g., duplicate email, optimistic locking failure), 422 Unprocessable Entity (syntactically correct but semantically invalid — e.g., email format wrong), 429 Too Many Requests (rate limit exceeded — include Retry-After header), 500 Internal Server Error (unexpected server failure), 503 Service Unavailable (planned downtime or overload — include Retry-After header)",
      "Pagination strategies: offset-based (page=2&limit=20 — simple but skips or duplicates items when data changes between pages, poor performance on large datasets because SQL OFFSET scans all preceding rows), cursor-based (cursor=eyJpZCI6MTAwfQ&limit=20 — encoded pointer to last item seen, consistent results despite concurrent inserts/deletes, works with any backing store, the cursor should be opaque to clients), keyset pagination (after_id=100&limit=20 — uses indexed column values, most performant for SQL because it uses WHERE id > 100 ORDER BY id LIMIT 20 which leverages indexes); always include pagination metadata: total_count, has_next_page, next_cursor/next_page; sorting uses field-based params (?sort=created_at&order=desc or ?sort=-created_at); filtering uses field=value params (?status=active&role=admin)",
      "API versioning strategies: URL path versioning (/api/v1/users — most visible, easy to route, but pollutes URL space and makes it hard to evolve; used by GitHub, Stripe, Twitter), header versioning (Accept: application/vnd.myapi.v2+json — clean URLs but harder to test in browser, invisible in access logs), query parameter versioning (/api/users?version=2 — compromise between URL and header, easy to test but optional params can be forgotten); best practice is URL path versioning for public APIs (clarity > purity), header versioning for internal APIs; never version every endpoint — version the entire API; support N-1 at minimum (current version + previous); deprecation should be communicated via Sunset and Deprecation headers with a timeline",
      "Error response format should be consistent and machine-parseable across all endpoints — RFC 7807 (Problem Details) is the standard: { type: 'https://api.example.com/errors/validation', title: 'Validation Error', status: 422, detail: 'The email field must be a valid email address', instance: '/users/signup', errors: [{ field: 'email', message: 'Invalid format', code: 'INVALID_EMAIL' }] }; always include a machine-readable error code (not just HTTP status), a human-readable message, and field-level errors for validation failures; never expose stack traces, SQL queries, or internal paths in production error responses; rate limiting uses three standard headers: X-RateLimit-Limit (max requests per window), X-RateLimit-Remaining (requests left), X-RateLimit-Reset (Unix timestamp when the window resets)",
      "HATEOAS (Hypermedia As The Engine Of Application State) means API responses include links to related actions and resources — the client discovers capabilities dynamically instead of hardcoding URLs; example: a GET /orders/123 response includes { _links: { self: '/orders/123', cancel: '/orders/123/cancel', payment: '/orders/123/payment', customer: '/users/456' } }; this enables API evolution without breaking clients (add new links freely, deprecate old ones with warnings); idempotency is critical for reliability — POST is not naturally idempotent, so implement Idempotency-Key headers (client sends a unique key, server stores and deduplicates: if the same key is sent again, return the cached response instead of creating a duplicate); API security layers: HTTPS everywhere, OAuth 2.0 / JWT for authentication, scope-based authorization, input validation and sanitization on every field, CORS configuration (whitelist specific origins, never use Access-Control-Allow-Origin: * with credentials), request size limits, and parameterized queries to prevent injection",
    ],
    content: `
# RESTful API Design

## What is REST?

REST (Representational State Transfer) is an **architectural style** defined by Roy Fielding in his 2000 doctoral dissertation. It is not a protocol or a standard — it's a set of constraints that, when applied to a web service, yield desirable properties like scalability, simplicity, and loose coupling.

### The Six REST Constraints

| Constraint           | Description                                                                                     | Violation Example                                      |
|----------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| **Client-Server**    | UI concerns separated from data storage concerns                                                | Server rendering templates with embedded business logic |
| **Stateless**        | Each request contains **all** information needed; no server-side session                        | Storing user cart in server memory (use DB/Redis instead)|
| **Cacheable**        | Responses must declare themselves cacheable or not via Cache-Control, ETag, Last-Modified        | Forgetting cache headers — clients always re-fetch     |
| **Uniform Interface**| Resource-based URIs, standard methods, self-descriptive messages, HATEOAS                       | Custom verbs in URLs like \`/getUser\` or \`/deleteOrder\`   |
| **Layered System**   | Client can't tell if connected to server directly or via CDN/proxy/load balancer                | Tight coupling to a specific server instance           |
| **Code on Demand**   | *(Optional)* Server can send executable code (e.g., JavaScript) to extend the client            | Rarely used in modern REST APIs                        |

### Interview Insight

> *"What makes an API truly RESTful?"*
> A: Most APIs called "RESTful" actually only implement **Level 2** of the Richardson Maturity Model (resources + HTTP verbs). True REST (Level 3) also requires HATEOAS — hypermedia-driven navigation. In practice, Level 2 is the pragmatic standard for most teams.

### Richardson Maturity Model

\`\`\`
Level 0 — The Swamp of POX
  Single endpoint, single method (POST /api), action in body
  Example: SOAP, XML-RPC

Level 1 — Resources
  Multiple endpoints (/users, /orders), but still only POST
  Each resource has a URI, but HTTP methods are misused

Level 2 — HTTP Verbs (Most "REST" APIs)
  Resources + proper HTTP methods (GET, POST, PUT, DELETE)
  Correct status codes — this is where most APIs stop

Level 3 — Hypermedia Controls (HATEOAS)
  Responses include links to related actions/resources
  Client navigates the API by following links, not hardcoding URLs
  True REST — but rarely fully implemented in practice
\`\`\`

---

## HTTP Methods — Precise Semantics

Understanding HTTP method semantics is fundamental. Each method has specific **safety**, **idempotency**, and **cacheability** properties:

| Method    | Operation      | Safe? | Idempotent? | Cacheable? | Request Body? | Response Body? |
|-----------|----------------|-------|-------------|------------|---------------|----------------|
| **GET**   | Read           | Yes   | Yes         | Yes        | No (ignored)  | Yes            |
| **POST**  | Create         | No    | No          | No         | Yes           | Yes            |
| **PUT**   | Full replace   | No    | Yes         | No         | Yes           | Optional       |
| **PATCH** | Partial update | No    | Depends*    | No         | Yes           | Yes            |
| **DELETE**| Remove         | No    | Yes         | No         | Optional      | Optional       |
| **HEAD**  | Read (headers) | Yes   | Yes         | Yes        | No            | No             |
| **OPTIONS**| Capabilities  | Yes   | Yes         | No         | No            | Yes            |

> **Safe** = does not modify server state. **Idempotent** = calling N times produces the same result as calling once. GET is both safe AND idempotent. DELETE is idempotent but NOT safe.

### *PATCH Idempotency Nuance

\`\`\`javascript
// JSON Merge Patch (RFC 7396) — IS idempotent
// Sending this twice results in the same state
// PATCH /users/123
// Content-Type: application/merge-patch+json
{ "name": "Alice Updated" }

// JSON Patch (RFC 6902) — may NOT be idempotent
// "add" to an array appends each time — different state
// PATCH /users/123
// Content-Type: application/json-patch+json
[{ "op": "add", "path": "/tags/-", "value": "vip" }]
\`\`\`

### Method Usage Examples

\`\`\`javascript
// ── GET — Read resource(s) ──────────────────────────────────
// GET /api/v1/users              → List users (collection)
// GET /api/v1/users/123          → Get single user (document)
// GET /api/v1/users/123/orders   → Get user's orders (sub-collection)

// ── POST — Create new resource ──────────────────────────────
// POST /api/v1/users
// Content-Type: application/json
// {
//   "name": "Alice",
//   "email": "alice@example.com"
// }
// Response: 201 Created
// Location: /api/v1/users/124

// ── PUT — Full replacement ──────────────────────────────────
// PUT /api/v1/users/123
// Content-Type: application/json
// {
//   "name": "Alice Updated",
//   "email": "alice@example.com",
//   "role": "admin"            ← ALL fields required; missing → nulled
// }
// Response: 200 OK

// ── PATCH — Partial update ──────────────────────────────────
// PATCH /api/v1/users/123
// Content-Type: application/merge-patch+json
// { "name": "Alice Renamed" }  ← Only the changed fields
// Response: 200 OK

// ── DELETE — Remove ─────────────────────────────────────────
// DELETE /api/v1/users/123
// Response: 204 No Content
\`\`\`

### Interview Tip: PUT vs PATCH

\`\`\`
PUT replaces the ENTIRE resource:
  PUT /users/123  { name: "Alice", email: "a@b.com", role: "admin" }
  → If you omit "role", it becomes null/default

PATCH updates ONLY the specified fields:
  PATCH /users/123  { role: "admin" }
  → Only "role" changes; name and email remain unchanged

Key insight: PUT is idempotent by design (same input → same state).
PATCH idempotency depends on the patch format used.
\`\`\`

---

## Resource Naming Conventions

### Golden Rules

1. **Use nouns, not verbs** — the HTTP method IS the verb
2. **Always use plural** — consistency between collection and document
3. **Hierarchical for relationships** — but limit nesting depth
4. **Lowercase with hyphens** — for multi-word resources
5. **Never expose implementation** — hide database/internal details

\`\`\`
GOOD                                 BAD
GET  /users                          GET  /getUsers
POST /users                          POST /createUser
GET  /users/123                      GET  /user/123 (inconsistent singular)
GET  /users/123/orders               GET  /getUserOrders?userId=123
GET  /order-items                    GET  /orderItems (camelCase in URL)
GET  /users?role=admin               GET  /getAdminUsers (verb in URL)
DELETE /users/123                    POST /deleteUser/123 (wrong method)
PUT /users/123                       POST /updateUser (verb, wrong method)
\`\`\`

### Nesting Depth — When to Stop

\`\`\`
OK — 2 levels deep:
GET /users/123/orders/456

Questionable — 3 levels:
GET /users/123/orders/456/items/789

Too deep — 4+ levels:
GET /users/123/orders/456/items/789/reviews

Better — flatten with query parameters or direct resource access:
GET /order-items/789
GET /reviews?order_item_id=789
\`\`\`

### Actions on Resources

Sometimes you need non-CRUD actions. Use sub-resources:

\`\`\`
POST /users/123/activate          (action on a user)
POST /orders/456/cancel           (action on an order)
POST /payments/789/refund         (action on a payment)

NOT: POST /activateUser/123       (verb as resource — anti-pattern)
NOT: PATCH /users/123 { active: true }  (debatable — but less explicit)
\`\`\`

---

## HTTP Status Codes — Complete Reference

### 2xx — Success

| Code | Name           | When to Use                                                          |
|------|----------------|----------------------------------------------------------------------|
| 200  | OK             | Successful GET, PUT, PATCH; body contains the result                 |
| 201  | Created        | Successful POST; include \`Location\` header with new resource URI     |
| 202  | Accepted       | Request accepted for async processing (long-running task)            |
| 204  | No Content     | Successful DELETE, or PUT/PATCH with no response body needed         |

### 4xx — Client Errors

| Code | Name                  | When to Use                                                              |
|------|-----------------------|--------------------------------------------------------------------------|
| 400  | Bad Request           | Malformed JSON, missing required headers, unparseable request body       |
| 401  | Unauthorized          | Not authenticated — no token, or token expired/invalid                   |
| 403  | Forbidden             | Authenticated but lacks permission for this resource/action              |
| 404  | Not Found             | Resource doesn't exist; also used to **hide existence** from unauthorized users |
| 405  | Method Not Allowed    | Valid resource URL but wrong HTTP method (e.g., DELETE on read-only)      |
| 409  | Conflict              | Duplicate entry, optimistic locking failure, state conflict              |
| 422  | Unprocessable Entity  | Syntactically correct JSON but semantically invalid (validation errors)  |
| 429  | Too Many Requests     | Rate limit exceeded; include \`Retry-After\` header                       |

### 5xx — Server Errors

| Code | Name                  | When to Use                                                              |
|------|-----------------------|--------------------------------------------------------------------------|
| 500  | Internal Server Error | Unexpected server failure — catch-all for unhandled exceptions           |
| 502  | Bad Gateway           | Upstream server returned an invalid response (proxy/load balancer issue) |
| 503  | Service Unavailable   | Planned maintenance or server overload; include \`Retry-After\` header     |
| 504  | Gateway Timeout       | Upstream server didn't respond in time                                   |

### Interview Tip: 401 vs 403

\`\`\`
401 Unauthorized → "I don't know who you are" (unauthenticated)
  → Client should retry with valid credentials (e.g., login first)

403 Forbidden    → "I know who you are, but you can't do this" (unauthorized)
  → Client should NOT retry — different permission level required

Security note: For sensitive resources, some APIs return 404 instead of 403
to avoid revealing that the resource exists at all (e.g., GitHub private repos).
\`\`\`

### When to Use 400 vs 422

\`\`\`
400 Bad Request:
  → Malformed JSON: { "name": "Alice"   ← missing closing brace
  → Wrong Content-Type header
  → Missing required header

422 Unprocessable Entity:
  → Valid JSON, but: { "email": "not-an-email" }  ← semantic error
  → Business rule violation: { "age": -5 }
  → Reference to non-existent resource: { "category_id": 999 }
\`\`\`

---

## Request/Response Design

### JSON Response Envelope

\`\`\`javascript
// ── Single resource ─────────────────────────────────────────
{
  "data": {
    "id": "usr_abc123",
    "type": "user",
    "attributes": {
      "name": "Alice Chen",
      "email": "alice@example.com",
      "role": "admin",
      "created_at": "2025-01-15T10:30:00Z"
    },
    "relationships": {
      "orders": { "href": "/api/v1/users/usr_abc123/orders" }
    }
  },
  "meta": {
    "request_id": "req_xyz789"
  }
}

// ── Collection ──────────────────────────────────────────────
{
  "data": [
    { "id": "usr_abc123", "type": "user", "attributes": { "..." : "..." } },
    { "id": "usr_def456", "type": "user", "attributes": { "..." : "..." } }
  ],
  "meta": {
    "total_count": 142,
    "page": 2,
    "per_page": 20,
    "has_next_page": true,
    "request_id": "req_xyz790"
  },
  "links": {
    "self":  "/api/v1/users?page=2&per_page=20",
    "first": "/api/v1/users?page=1&per_page=20",
    "prev":  "/api/v1/users?page=1&per_page=20",
    "next":  "/api/v1/users?page=3&per_page=20",
    "last":  "/api/v1/users?page=8&per_page=20"
  }
}
\`\`\`

### Date/Time Format

Always use **ISO 8601** in UTC:
\`\`\`
"created_at": "2025-01-15T10:30:00Z"      ← UTC (Z suffix)
"updated_at": "2025-01-15T10:30:00.123Z"  ← With milliseconds
\`\`\`

Never use Unix timestamps in responses (unreadable). Accept both ISO 8601 and Unix timestamps as input if needed.

### Consistent Field Naming

\`\`\`
Convention: snake_case for JSON response fields

GOOD: { "created_at", "order_id", "first_name", "is_active" }
BAD:  { "createdAt", "OrderId", "FirstName", "isactive" }

Why snake_case?
  → Most public APIs use it (GitHub, Stripe, Slack, Twitter)
  → More readable than camelCase for multi-word fields
  → Convention, not a rule — pick one and be consistent
\`\`\`

---

## Pagination — Three Strategies

### 1. Offset-Based Pagination

\`\`\`
GET /api/v1/users?page=3&per_page=20

Pros: Simple, clients can jump to any page
Cons: Skips/duplicates rows when data changes between pages
      SQL OFFSET is O(n) — OFFSET 10000 scans 10,000 rows to skip them
\`\`\`

\`\`\`sql
-- SQL behind the scenes — gets slower as offset grows
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;  -- Page 3: skip 40 rows, take 20
\`\`\`

### 2. Cursor-Based Pagination

\`\`\`
GET /api/v1/users?cursor=eyJpZCI6MTAwfQ&limit=20

Pros: Consistent results even with concurrent inserts/deletes
      Opaque cursor hides implementation details
Cons: Can't jump to arbitrary pages, slightly more complex
Used by: Slack, Facebook Graph API, Stripe
\`\`\`

\`\`\`javascript
// Server-side cursor encoding/decoding
const encodeCursor = (record) =>
  Buffer.from(JSON.stringify({
    id: record.id,
    created_at: record.created_at
  })).toString('base64url');

const decodeCursor = (cursor) =>
  JSON.parse(Buffer.from(cursor, 'base64url').toString());

// SQL with cursor — always efficient regardless of position
// WHERE (created_at, id) < ($cursorDate, $cursorId)
// ORDER BY created_at DESC, id DESC
// LIMIT 20
\`\`\`

### 3. Keyset Pagination

\`\`\`
GET /api/v1/users?after_id=100&limit=20

Pros: Most performant for SQL (uses WHERE + index, O(log n))
Cons: Requires a unique, sequential column; can't jump pages
\`\`\`

\`\`\`sql
-- Leverages the primary key index — O(log n) always
SELECT * FROM users
WHERE id > 100
ORDER BY id ASC
LIMIT 20;
\`\`\`

### Pagination Response Metadata

\`\`\`javascript
{
  "data": [ /* ... */ ],
  "pagination": {
    "total_count": 1542,
    "has_next_page": true,
    "has_prev_page": true,
    "next_cursor": "eyJpZCI6MTIwfQ",
    "prev_cursor": "eyJpZCI6MTAxfQ"
  }
}
\`\`\`

### Which Pagination Strategy to Use?

\`\`\`
Offset-based:
  → Small datasets (< 10,000 records)
  → UIs that need "page 5 of 12" display
  → Admin dashboards, simple CRUD apps

Cursor-based:
  → Large datasets with frequent writes
  → Infinite scroll / "Load more" UIs
  → Public APIs (Slack, Stripe pattern)

Keyset:
  → Very large datasets with a natural ordering column
  → Internal APIs where simplicity > flexibility
  → Data exports, background job processing
\`\`\`

---

## Sorting & Filtering

\`\`\`
// ── Sorting ─────────────────────────────────────────────────
GET /api/v1/users?sort=-created_at          // Descending (- prefix)
GET /api/v1/users?sort=name                 // Ascending (default)
GET /api/v1/users?sort=-created_at,name     // Multi-field sort

// ── Filtering ───────────────────────────────────────────────
GET /api/v1/users?status=active                    // Exact match
GET /api/v1/users?role=admin,editor                // IN (comma values)
GET /api/v1/users?created_after=2025-01-01         // Range filter
GET /api/v1/users?search=alice                     // Full-text search
GET /api/v1/users?min_age=18&max_age=30            // Range with bounds

// ── Combined (real-world query) ─────────────────────────────
GET /api/v1/users?role=admin&status=active&sort=-created_at&page=1&per_page=25
\`\`\`

### Security: Always Whitelist Sortable/Filterable Fields

\`\`\`javascript
const ALLOWED_SORT_FIELDS = ['name', 'email', 'created_at', 'updated_at'];
const ALLOWED_FILTER_FIELDS = ['status', 'role', 'created_after'];

function validateSort(sortParam) {
  const field = sortParam.replace(/^-/, ''); // Remove - prefix
  if (!ALLOWED_SORT_FIELDS.includes(field)) {
    throw new ValidationError('Invalid sort field: ' + field);
  }
  return sortParam;
}

// WHY: Prevents SQL injection via ORDER BY
//      Prevents exposing internal column names (password_hash, etc.)
\`\`\`

---

## API Versioning Strategies

| Strategy            | Format                                   | Pros                                             | Cons                                                  | Used By                |
|---------------------|------------------------------------------|--------------------------------------------------|-------------------------------------------------------|------------------------|
| **URL Path**        | \`/api/v1/users\`                          | Obvious, easy to route, works in browser         | Pollutes URL space, hard to evolve single endpoints   | GitHub, Stripe, Twitter|
| **Header**          | \`Accept: application/vnd.api.v2+json\`    | Clean URLs, content negotiation                  | Invisible in browser/logs, harder to test             | GitHub (alternative)   |
| **Query Param**     | \`/api/users?version=2\`                   | Easy to test, visible                            | Optional param risk (forgetting = default version)    | Google, Amazon         |

### Versioning Best Practices

\`\`\`
1. Version the ENTIRE API, not individual endpoints
2. Support at minimum N-1 (current + previous version)
3. Communicate deprecation with headers:
   Sunset: Sat, 01 Jan 2027 00:00:00 GMT
   Deprecation: true
   Link: <https://api.example.com/docs/migration-v2>; rel="successor-version"

4. URL path versioning = recommended for PUBLIC APIs (clarity > purity)
5. Header versioning = recommended for INTERNAL APIs (clean URLs)
6. NEVER make breaking changes without a version bump:
   Breaking: removing a field, renaming a field, changing a type
   Non-breaking: adding a field, adding an endpoint, adding optional param
\`\`\`

### What Counts as a Breaking Change?

\`\`\`
BREAKING (requires new version):
  → Removing a response field
  → Renaming a response field (first_name → firstName)
  → Changing a field type (string → number)
  → Adding a new required request parameter
  → Changing response status codes for existing behavior
  → Removing an endpoint

NON-BREAKING (safe in current version):
  → Adding a new optional field to response
  → Adding a new endpoint
  → Adding a new optional query parameter
  → Adding a new error code/type
  → Adding new enum values (if client handles unknowns)
\`\`\`

---

## Error Response Format (RFC 7807 — Problem Details)

\`\`\`javascript
// Standard error response — same structure for ALL errors
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "One or more fields failed validation.",
  "instance": "/api/v1/users",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "code": "INVALID_FORMAT",
      "rejected_value": "not-an-email"
    },
    {
      "field": "password",
      "message": "Must be at least 8 characters",
      "code": "TOO_SHORT",
      "rejected_value": "(redacted)"
    }
  ],
  "request_id": "req_abc123",
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

### Error Design Rules

\`\`\`
DO:
  - Use consistent format across ALL endpoints
  - Include machine-readable error codes (INVALID_FORMAT, NOT_FOUND)
  - Include field-level detail for validation errors
  - Include a request_id for debugging/support tickets
  - Redact sensitive values in rejected_value fields
  - Use meaningful error codes beyond HTTP status

DON'T:
  - Expose stack traces in production
  - Expose SQL queries or internal file paths
  - Use generic messages like "Something went wrong"
  - Return HTML error pages from an API endpoint
  - Mix error formats across endpoints
  - Expose existence of resources via 403 (use 404 instead)
\`\`\`

### Error Code Taxonomy

\`\`\`javascript
// Organize error codes by category for consistency
const ERROR_CODES = {
  // Validation
  REQUIRED_FIELD:    'A required field is missing',
  INVALID_FORMAT:    'Field value has incorrect format',
  TOO_SHORT:         'Value is below minimum length',
  TOO_LONG:          'Value exceeds maximum length',
  OUT_OF_RANGE:      'Numeric value outside allowed range',

  // Authentication
  TOKEN_EXPIRED:     'JWT or session token has expired',
  TOKEN_INVALID:     'Token signature verification failed',
  CREDENTIALS_INVALID: 'Email or password is incorrect',

  // Authorization
  INSUFFICIENT_PERMISSIONS: 'User lacks required role/scope',
  RESOURCE_FORBIDDEN:       'Access to this resource is denied',

  // Conflict
  DUPLICATE_ENTRY:   'Resource with this identifier already exists',
  OPTIMISTIC_LOCK:   'Resource was modified by another request',
  STATE_CONFLICT:    'Action not allowed in current resource state',

  // Not Found
  RESOURCE_NOT_FOUND: 'Requested resource does not exist',
};
\`\`\`

---

## Rate Limiting

### Standard Headers

\`\`\`
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000        ← Max requests per window
X-RateLimit-Remaining: 742     ← Requests left in current window
X-RateLimit-Reset: 1705312200  ← Unix timestamp when window resets

HTTP/1.1 429 Too Many Requests
Retry-After: 30                ← Seconds until client can retry
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705312200
Content-Type: application/json
{
  "type": "https://api.example.com/errors/rate-limit",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded 1000 requests per hour. Try again in 30 seconds."
}
\`\`\`

### Rate Limiting Strategies

\`\`\`
1. Fixed Window:
   → 1000 req/hour, resets at the top of each hour
   → Simple but burst-prone at window boundaries
   → Two bursts of 1000 can happen in 1 second (end + start of window)

2. Sliding Window:
   → 1000 req in any rolling 60-minute period
   → Smooth distribution, no boundary bursts
   → More memory to track request timestamps

3. Token Bucket:
   → "Bucket" holds N tokens, refills at R tokens/sec
   → Allows controlled bursts while enforcing average rate
   → Used by AWS, Stripe — best for most APIs

4. Leaky Bucket:
   → Requests processed at constant rate, excess queued/dropped
   → Guarantees smooth output rate
   → Good for protecting downstream services
\`\`\`

### Per-Client Rate Limits

\`\`\`javascript
// Different tiers for different API consumers
const rateLimits = {
  anonymous:   { requests: 60,    window: '1h' },
  free:        { requests: 100,   window: '1h' },
  developer:   { requests: 1000,  window: '1h' },
  enterprise:  { requests: 10000, window: '1h' },
};

// Identify client by: API key, OAuth token, IP address (fallback)
// Store counters in Redis for distributed rate limiting across instances
// Use MULTI/EXEC or Lua scripts for atomic increment + expiry
\`\`\`

---

## HATEOAS — Hypermedia-Driven APIs

HATEOAS (Hypermedia As The Engine Of Application State) is the final REST constraint that most APIs skip. It means responses include **links to related actions** so clients discover capabilities dynamically.

\`\`\`javascript
// Order response with HATEOAS links
{
  "data": {
    "id": "ord_123",
    "status": "pending",
    "total": 99.99,
    "items": [
      { "product_id": "prod_456", "quantity": 2, "price": 49.99 }
    ]
  },
  "_links": {
    "self":     { "href": "/api/v1/orders/ord_123", "method": "GET" },
    "cancel":   { "href": "/api/v1/orders/ord_123/cancel", "method": "POST" },
    "payment":  { "href": "/api/v1/orders/ord_123/payment", "method": "POST" },
    "customer": { "href": "/api/v1/users/usr_789", "method": "GET" },
    "items":    { "href": "/api/v1/orders/ord_123/items", "method": "GET" }
  }
}

// Same order AFTER shipping — notice "cancel" link is gone:
{
  "data": {
    "id": "ord_123",
    "status": "shipped",
    "total": 99.99,
    "tracking_number": "1Z999AA10123456784"
  },
  "_links": {
    "self":     { "href": "/api/v1/orders/ord_123", "method": "GET" },
    "track":    { "href": "/api/v1/orders/ord_123/tracking", "method": "GET" },
    "return":   { "href": "/api/v1/orders/ord_123/return", "method": "POST" },
    "customer": { "href": "/api/v1/users/usr_789", "method": "GET" }
  }
}
// The server controls what actions are available based on state!
\`\`\`

### Why HATEOAS Matters

\`\`\`
Without HATEOAS:
  Client hardcodes: "To cancel order 123, POST to /api/v1/orders/123/cancel"
  → If the URL structure changes, the client breaks
  → Client must know all possible actions up front

With HATEOAS:
  Client reads the "cancel" link from the response
  → Server can change URL structure freely; client adapts
  → Server controls actions based on resource state
     (shipped order has no "cancel" link — client can't even try)
  → New capabilities added via new links — no client update needed
\`\`\`

---

## API Documentation — OpenAPI / Swagger

\`\`\`yaml
# openapi.yaml (partial example)
openapi: 3.0.3
info:
  title: E-Commerce API
  version: 1.0.0
  description: RESTful API for managing products and orders

paths:
  /api/v1/products:
    get:
      summary: List all products
      tags: [Products]
      parameters:
        - name: category
          in: query
          schema:
            type: string
          description: Filter by product category
        - name: page
          in: query
          schema:
            type: integer
            default: 1
          description: Page number for pagination
      responses:
        '200':
          description: Paginated list of products
        '429':
          description: Rate limit exceeded

    post:
      summary: Create a new product
      tags: [Products]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, price]
              properties:
                name:
                  type: string
                price:
                  type: number
      responses:
        '201':
          description: Product created
          headers:
            Location:
              description: URI of the new product
              schema:
                type: string
        '422':
          description: Validation error
\`\`\`

### Documentation Best Practices

\`\`\`
1. Use OpenAPI 3.x (formerly Swagger) as the spec format
2. Generate docs from code annotations OR code from spec (design-first)
3. Include request/response examples for EVERY endpoint
4. Document error responses (not just 200s)
5. Provide a sandbox/playground (Swagger UI, Redoc)
6. Version your documentation alongside your API
7. Include authentication setup guide with real examples
8. Document rate limits, pagination, and filtering conventions
9. Provide SDKs or client libraries for popular languages
10. Maintain a changelog with breaking/non-breaking labels
\`\`\`

---

## GraphQL Overview — When REST vs GraphQL

### Comparison Table

| Aspect               | REST                                      | GraphQL                                    |
|----------------------|-------------------------------------------|--------------------------------------------|
| **Data fetching**    | Fixed response shape per endpoint         | Client specifies exact fields needed       |
| **Over-fetching**    | Common (get all fields when you need 2)   | Eliminated (request only what you need)    |
| **Under-fetching**   | Common (need multiple round trips)        | Eliminated (single query for nested data)  |
| **Endpoints**        | Many (/users, /posts, /comments)          | One (/graphql)                             |
| **Caching**          | Built-in HTTP caching (ETags, CDN)        | Requires custom caching (Apollo, Relay)    |
| **Versioning**       | Explicit (v1, v2)                         | No versioning needed (additive schema)     |
| **Error handling**   | HTTP status codes                         | Always 200 — errors in response body       |
| **Learning curve**   | Low                                       | Medium-high                                |
| **File uploads**     | Native multipart support                  | Requires workarounds                       |
| **Real-time**        | WebSockets or SSE (separate)              | Subscriptions (built-in)                   |
| **Tooling**          | Swagger/OpenAPI, Postman                  | GraphiQL, Apollo DevTools, codegen         |

### When to Use Each

\`\`\`
Choose REST when:
  → Building public APIs (simpler for third-party developers)
  → HTTP caching is critical (mature and free)
  → Simple CRUD with predictable data shapes
  → Team is new to API development
  → Microservices with well-defined boundaries

Choose GraphQL when:
  → Multiple client types need different data shapes
     (mobile app needs 3 fields, desktop dashboard needs 15)
  → Complex relational data with nested queries
  → Rapid frontend development with changing requirements
  → You control both client and server (BFF pattern)
  → Reducing network round trips is critical

Choose gRPC when:
  → Internal microservice-to-microservice communication
  → Performance-critical with high throughput needs
  → Streaming is required (bidirectional streams)
  → Strong typing with Protobuf schemas
  → Polyglot services (auto-generated clients in any language)
\`\`\`

---

## API Security — Defense in Depth

### Security Layers

\`\`\`
Layer 1 — Transport:       HTTPS everywhere (HSTS header)
Layer 2 — Authentication:  OAuth 2.0 + JWT (or API keys for simple cases)
Layer 3 — Authorization:   Role/scope-based access control (RBAC)
Layer 4 — Input Validation: Validate & sanitize every field on every request
Layer 5 — Rate Limiting:   Prevent abuse, brute force, and DDoS
Layer 6 — CORS:            Whitelist specific origins, never * with credentials
Layer 7 — Audit Logging:   Log all mutations with user context
Layer 8 — Data Masking:    Never return sensitive fields (password_hash, SSN)
\`\`\`

### CORS Configuration

\`\`\`javascript
// Express CORS setup — secure configuration
const corsOptions = {
  origin: ['https://app.example.com', 'https://admin.example.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400, // Cache preflight response for 24 hours
};

// NEVER: origin: '*' with credentials: true (browsers block this)
// NEVER: Reflect the Origin header without validation (open redirect)
// ALWAYS: Explicitly list allowed origins for production
\`\`\`

### JWT Best Practices

\`\`\`
1. Store tokens in httpOnly, secure, sameSite cookies (not localStorage)
   → httpOnly prevents XSS from reading the token
   → secure ensures HTTPS only
   → sameSite=strict prevents CSRF

2. Use short expiry for access tokens (15 min)
3. Use refresh tokens for session extension (rotate on each use)
4. Include only necessary claims (no sensitive data in payload)
5. Validate issuer (iss), audience (aud), and expiry (exp) on every request
6. Use asymmetric signing (RS256) for distributed systems
   → Auth server signs with private key
   → Resource servers verify with public key (no shared secret)
\`\`\`

### Input Validation Checklist

\`\`\`
- Validate Content-Type header matches expected type
- Enforce maximum request body size (e.g., 1MB)
- Validate all required fields are present
- Validate field types (string, number, boolean, date)
- Validate field lengths (min/max for strings)
- Validate field formats (email, URL, UUID, phone)
- Sanitize strings to prevent XSS (strip HTML tags)
- Use parameterized queries to prevent SQL injection
- Validate enum values against a whitelist
- Reject unexpected fields (strict mode) or ignore them
\`\`\`

---

## Idempotency in API Design

### Why Idempotency Matters

Network failures happen. If a client sends a POST /orders and the server processes it but the response is lost, the client retries — without idempotency protection, you get **duplicate orders**.

### Idempotency-Key Pattern

\`\`\`javascript
// Client sends a unique key with each mutating request
// POST /api/v1/orders
// Idempotency-Key: idem_abc123def456
// Content-Type: application/json
// { "product_id": "prod_789", "quantity": 2 }

// Server implementation:
async function createOrder(req, res) {
  const idempotencyKey = req.headers['idempotency-key'];

  // 1. Check if we've already processed this key
  const cached = await redis.get('idempotency:' + idempotencyKey);
  if (cached) {
    // Return the SAME response — no side effects
    return res.status(200).json(JSON.parse(cached));
  }

  // 2. Process the request normally
  const order = await orderService.create(req.body);

  // 3. Cache the response with a TTL (24 hours)
  await redis.setex(
    'idempotency:' + idempotencyKey,
    86400,
    JSON.stringify(order)
  );

  return res.status(201).json(order);
}
\`\`\`

### Idempotency by HTTP Method

\`\`\`
GET    → Naturally idempotent (reading doesn't change state)
PUT    → Naturally idempotent (full replace → same result each time)
DELETE → Naturally idempotent (deleting twice → resource still gone)
PATCH  → Depends on format (Merge Patch = yes, JSON Patch = maybe not)
POST   → NOT idempotent — requires Idempotency-Key header pattern

Key insight: Stripe, PayPal, and all payment APIs require Idempotency-Key
for POST requests because duplicate payments are catastrophic.
\`\`\`

---

## Complete API Design Checklist

\`\`\`
Resources & URLs:
  [ ] Use nouns for resources, HTTP methods for actions
  [ ] Use plural resource names consistently
  [ ] Limit URL nesting to 2-3 levels max

Responses:
  [ ] Return appropriate status codes (not just 200 for everything)
  [ ] Use consistent JSON envelope (data, meta, links, errors)
  [ ] Use ISO 8601 for all date/time fields
  [ ] Include request_id in every response for debugging

Pagination & Filtering:
  [ ] Implement pagination for all list/collection endpoints
  [ ] Whitelist sortable and filterable fields
  [ ] Include pagination metadata (total, has_next, cursors)

Versioning & Evolution:
  [ ] Version your API from day one
  [ ] Document breaking vs non-breaking changes
  [ ] Communicate deprecation via Sunset headers

Error Handling:
  [ ] Use RFC 7807 Problem Details for all error responses
  [ ] Include field-level errors for validation failures
  [ ] Never expose stack traces in production

Security:
  [ ] Use HTTPS everywhere — no exceptions
  [ ] Validate and sanitize all input
  [ ] Configure CORS properly (no wildcard with credentials)
  [ ] Implement rate limiting with standard headers

Documentation:
  [ ] Document every endpoint with OpenAPI/Swagger
  [ ] Include request/response examples
  [ ] Provide authentication setup guide

Reliability:
  [ ] Implement Idempotency-Key for POST endpoints
  [ ] Return HATEOAS links where practical
  [ ] Log all mutations with user context (audit trail)
\`\`\`

---

## Summary & Interview Cheat Sheet

| Question | Key Answer |
|----------|-----------|
| *What makes an API RESTful?* | Six constraints: client-server, stateless, cacheable, uniform interface, layered system, code-on-demand (optional); most APIs are Level 2 (resources + verbs) |
| *GET vs POST vs PUT vs PATCH?* | GET reads (safe, idempotent), POST creates (not idempotent), PUT full-replaces (idempotent), PATCH partial-updates (depends on format) |
| *401 vs 403?* | 401 = unauthenticated ("who are you?"), 403 = unauthorized ("I know you, but no permission") |
| *400 vs 422?* | 400 = malformed syntax (unparseable), 422 = valid syntax but semantic errors (validation failures) |
| *Offset vs cursor pagination?* | Offset: simple but O(n) and inconsistent; Cursor: consistent, O(1), but no page jumping |
| *How to version an API?* | URL path (/v1/) for public APIs, header versioning for internal; never break without version bump |
| *What is idempotency?* | Calling an operation N times produces the same result as calling once; POST needs Idempotency-Key headers |
| *REST vs GraphQL?* | REST: simple, cacheable, public APIs; GraphQL: flexible, one endpoint, multiple client shapes |
| *Error format?* | RFC 7807 Problem Details: type, title, status, detail, instance + field-level errors array |
| *What is HATEOAS?* | Responses include links to related actions; server controls available actions based on resource state |
`,
  },
];
