// ============================================================================
// API Design Principles — Content
// ============================================================================

export const topic = {
  "name": "API Design Principles",
  "slug": "api-design-principles",
  "description": "Design clean, intuitive, and consistent APIs — RESTful conventions, versioning, pagination, and documentation.",
  "estimated_time": 160,
  "order_index": 2
};

export const lessons = [
  {
    title: "RESTful API Design Best Practices",
    slug: "restful-api-design",
    summary: "Design clean, consistent REST APIs with proper resource naming, HTTP methods, status codes, and response formats.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 1,
    key_points: [
  "Use nouns for resources (/users, /orders) — not verbs (/getUsers)",
  "Use HTTP methods semantically: GET=read, POST=create, PUT=replace, PATCH=partial, DELETE=remove",
  "Return consistent response envelopes: { data, pagination, errors }",
  "Use plural nouns for collections: /users, /products, /orders",
  "Nest sub-resources: /users/:id/orders to show relationships"
],
    content: `# RESTful API Design Best Practices

## Resource Naming

\`\`\`
✅ Good                      ❌ Bad
GET  /api/users              GET  /api/getUsers
GET  /api/users/42           GET  /api/getUserById?id=42
POST /api/users              POST /api/createUser
GET  /api/users/42/orders    GET  /api/getUserOrders?userId=42
\`\`\`

### Rules

1. **Plural nouns** for collections: \`/products\`, not \`/product\`
2. **Kebab-case** for multi-word: \`/order-items\`, not \`/orderItems\`
3. **No verbs in URLs** — let HTTP methods express the action
4. **Nest for relationships**: \`/users/42/addresses\`

## Consistent Response Format

\`\`\`javascript
// Success response
{
  "data": { "id": 42, "name": "Alice" },
  "meta": { "requestId": "req_abc123" }
}

// Collection response
{
  "data": [{ "id": 1 }, { "id": 2 }],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
\`\`\`

## Status Code Cheat Sheet

| Code | Meaning | Use When |
|---|---|---|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (include Location header) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed body |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email taken) |
| 422 | Unprocessable | Valid syntax but semantic errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unhandled exception |

## Filtering, Sorting & Pagination

\`\`\`
GET /api/products?category=electronics&minPrice=100&sort=-price&page=2&limit=20

Parameters:
- category=electronics  → filter
- minPrice=100          → filter
- sort=-price           → descending by price (- prefix)
- page=2&limit=20       → pagination
\`\`\`

## API Versioning

\`\`\`
URL path:    /api/v1/users    /api/v2/users
Header:      Accept: application/vnd.myapp.v2+json
Query param: /api/users?version=2
\`\`\`

> **Recommendation:** Use URL path versioning (\`/api/v1/\`) — it's the most explicit and easiest to implement.
`,
  },
];
