// ============================================================================
// Architecture Fundamentals — Content
// ============================================================================

export const topic = {
  "name": "Architecture Fundamentals",
  "slug": "basic-architecture",
  "description": "Understand the foundations of software architecture — architectural styles, quality attributes, and decision making.",
  "estimated_time": 180,
  "order_index": 1
};

export const lessons = [
  {
    title: "What is Software Architecture?",
    slug: "what-is-software-architecture",
    summary: "Define software architecture, understand the architect role, and learn about common architectural styles.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 1,
    key_points: [
  "Architecture is the high-level structure of a system — components, their relationships, and principles",
  "Good architecture enables change, scalability, and maintainability",
  "Common styles: Monolith, Layered, Client-Server, Microservices, Event-Driven",
  "Architecture decisions are hard to reverse — they are the \"things that are expensive to change\"",
  "Quality attributes (performance, security, scalability) drive architecture decisions"
],
    content: `# What is Software Architecture?

## Definition

> Software architecture is the set of **structures** needed to reason about a system — the software elements, the relations among them, and the properties of both.  
> — *Software Architecture in Practice*, Bass et al.

In practical terms: architecture is about the **big decisions** that are costly to change later.

## Architecture vs Design

| Architecture | Design |
|---|---|
| System-level structure | Component-level implementation |
| Hard to change | Easier to change |
| How services communicate | How a function works internally |
| Which database to use | Which query to write |
| Deployment strategy | Code formatting |

## Common Architectural Styles

### 1. Monolithic Architecture

All code in a single deployable unit.

\`\`\`
┌───────────────────────────────┐
│         Monolith              │
│  ┌─────┐ ┌─────┐ ┌────────┐  │
│  │ UI  │ │Logic│ │Database│  │
│  └─────┘ └─────┘ └────────┘  │
└───────────────────────────────┘
\`\`\`

**Pros:** Simple to develop, test, deploy  
**Cons:** Scaling is all-or-nothing, tightly coupled

### 2. Layered (N-Tier) Architecture

\`\`\`
┌─────────────────┐
│ Presentation    │ ← UI, API controllers
├─────────────────┤
│ Business Logic  │ ← Services, rules
├─────────────────┤
│ Data Access     │ ← Repositories, ORM
├─────────────────┤
│ Database        │ ← PostgreSQL, MongoDB
└─────────────────┘
\`\`\`

**Rule:** Each layer only talks to the layer directly below it.

### 3. Client-Server

\`\`\`
┌────────┐  HTTP/API  ┌────────┐
│ Client │ ◄────────► │ Server │
│ (React)│            │(Express)│
└────────┘            └────────┘
\`\`\`

### 4. Microservices *(covered in detail later)*

### 5. Event-Driven *(covered in detail later)*

## Quality Attributes

Architecture is driven by **quality attributes** (non-functional requirements):

| Attribute | Question |
|---|---|
| Performance | How fast does it respond? |
| Scalability | Can it handle 10x users? |
| Availability | What % uptime is required? |
| Security | What are the threat models? |
| Maintainability | How easy is it to change? |
| Testability | Can it be tested in isolation? |
`,
  },
  {
    title: "Architecture Decision Records (ADRs)",
    slug: "architecture-decision-records",
    summary: "Document architectural decisions effectively using ADRs — the why behind your technical choices.",
    difficulty_level: "beginner",
    estimated_time: 20,
    order_index: 2,
    key_points: [
  "ADRs capture the context, decision, and consequences of architectural choices",
  "They answer \"why was this decision made?\" months or years later",
  "Each ADR is a short document: Title, Status, Context, Decision, Consequences",
  "Store ADRs in version control alongside the code",
  "Superseded ADRs are not deleted — they provide historical context"
],
    content: `# Architecture Decision Records (ADRs)

## Why ADRs?

Architecture decisions are often made in meetings, Slack threads, or hallway conversations — then forgotten. ADRs are lightweight documents stored in your repository that capture:

1. **What** was decided
2. **Why** it was decided (context + alternatives considered)
3. **What are the consequences** (trade-offs, risks)

## ADR Template

\`\`\`markdown
# ADR-001: Use PostgreSQL as primary database

## Status
Accepted

## Context
We need a relational database for our e-commerce platform.
The team has experience with PostgreSQL and MySQL.
We need JSONB support for flexible product attributes.
Expected data volume: 10M rows in the first year.

## Decision
We will use PostgreSQL 16 as our primary database.

## Consequences

### Positive
- Team familiarity reduces onboarding time
- JSONB support eliminates need for a separate document store
- Strong ecosystem (pg, Prisma, TypeORM) in Node.js
- Excellent performance for our expected scale

### Negative
- Horizontal scaling is harder than with Cassandra/DynamoDB
- Need to manage connection pooling (PgBouncer for >100 connections)

### Risks
- If we exceed 1B rows, may need to shard or migrate
\`\`\`

## When to Write an ADR

- Choosing a database, framework, or infrastructure
- Deciding between architectural styles (monolith vs microservices)
- Changing communication patterns (REST → gRPC → events)
- Adopting or replacing a major library
- Performance trade-offs (caching strategy, denormalization)

## Organizing ADRs

\`\`\`
docs/
  adr/
    001-use-postgresql.md
    002-adopt-microservices.md
    003-jwt-authentication.md
    004-switch-to-kafka.md     (supersedes 002 event bus choice)
\`\`\`
`,
  },
];
