// ============================================================================
// Software Architecture Fundamentals — Content (ENHANCED)
// ============================================================================

export const topic = {
  name: "Software Architecture Fundamentals",
  slug: "basic-architecture",
  description:
    "Understand architecture patterns, principles, and how to make informed design decisions.",
  estimated_time: 160,
  order_index: 1,
};

export const lessons = [
  // ─────────────────────────────────────────────────────────────────────────
  // LESSON 1 — What is Software Architecture?
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "What is Software Architecture?",
    slug: "what-is-software-architecture",
    summary:
      "Define software architecture, contrast it with design, explore major architecture patterns (monolithic, layered, client-server, microservices, event-driven, serverless, hexagonal), understand quality attributes and trade-offs, master core principles (SoC, SRP, DRY, KISS, YAGNI), coupling vs cohesion, and learn to document architecture with the C4 model.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 1,
    key_points: [
      "Software architecture is the set of high-level structures needed to reason about a system — the components, their relationships, and the principles governing their design and evolution; it is the 'things that are expensive to change later' (database choice, communication patterns, deployment topology, service boundaries)",
      "Architecture vs Design: architecture is system-level (which services exist, how they communicate, where data lives), while design is component-level (class hierarchies, function signatures, algorithms); architecture decisions are hard to reverse, design decisions are relatively easy to change — the boundary is fuzzy but the cost-of-change gradient is the key differentiator",
      "Architecture Patterns — Monolithic: single deployable unit, simple to develop/test/deploy initially, but becomes a 'big ball of mud' at scale; Layered/N-Tier: separates presentation → business logic → data access, each layer only calls the one below, enforces separation of concerns but can lead to 'lasagna code' with too many pass-through layers",
      "Architecture Patterns — Client-Server: separates UI (client) from business logic/data (server), enables multiple client types (web, mobile, CLI); Microservices: independently deployable services with own data stores, enables team autonomy and technology diversity, but adds network complexity, distributed transactions, and operational overhead",
      "Architecture Patterns — Event-Driven: components communicate through asynchronous events/messages rather than direct calls, enables loose coupling and temporal decoupling, supports CQRS and event sourcing; Serverless: functions-as-a-service (FaaS) with pay-per-invocation, zero server management, but cold starts and vendor lock-in are trade-offs; Hexagonal (Ports & Adapters): business logic at the center with ports (interfaces) and adapters (implementations), making the core independent of external systems like databases, APIs, or UI frameworks",
      "Quality Attributes (non-functional requirements) drive architecture decisions: Scalability (handling increased load — horizontal vs vertical), Reliability (uptime, fault tolerance, redundancy), Maintainability (ease of change, readability, modularity), Performance (latency, throughput, resource utilization), Security (authentication, authorization, data protection, defense in depth) — you cannot maximize all; every architecture is a trade-off",
      "Core Principles — Separation of Concerns (SoC): each module addresses a distinct concern; Single Responsibility Principle (SRP): a module should have one reason to change; DRY (Don't Repeat Yourself): eliminate knowledge duplication (not code duplication); KISS (Keep It Simple, Stupid): prefer simpler solutions; YAGNI (You Aren't Gonna Need It): don't build features until they're actually needed — premature abstraction is as dangerous as premature optimization",
      "Coupling vs Cohesion: low coupling means modules have minimal dependencies on each other (changes in one don't cascade); high cohesion means elements within a module are strongly related and focused on a single purpose; good architecture maximizes cohesion and minimizes coupling; the C4 model (Context → Containers → Components → Code) provides four zoom levels for documenting architecture — from bird's-eye system context to class-level code diagrams",
    ],
    content: `
# What is Software Architecture?

## Definition

> Software architecture is the set of **structures** needed to reason about a system — the software elements, the relations among them, and the properties of both.
> — *Software Architecture in Practice*, Bass, Clements & Kazman

In practical terms, architecture captures the **big decisions** that are costly to reverse later. Choosing PostgreSQL vs MongoDB. Monolith vs microservices. REST vs GraphQL vs gRPC. Deploying on Kubernetes vs serverless. These decisions shape the system's quality attributes for years.

### Interview Insight

When asked *"What is software architecture?"* in an interview, a strong answer is:

> Architecture is the **set of design decisions that are expensive to change** — the system's decomposition into components, how those components communicate, and the principles and constraints that govern their evolution.

---

## Architecture vs Design

| Aspect               | Architecture                            | Design                                  |
|-----------------------|-----------------------------------------|-----------------------------------------|
| **Scope**             | System-level structure                  | Component/class-level implementation    |
| **Reversibility**     | Hard & expensive to change              | Relatively easy to change               |
| **Examples**          | Service boundaries, data storage choice | Class hierarchy, function signatures    |
|                       | Communication protocols (REST/gRPC)     | Algorithm selection, data structures    |
|                       | Deployment topology                     | Code formatting, naming conventions     |
| **Who decides?**      | Architect + senior engineers            | Individual developers                   |
| **Documentation**     | C4 diagrams, ADRs                       | Code comments, inline docs              |

The boundary between architecture and design is **fuzzy** — what matters is the **cost-of-change gradient**. If changing a decision requires rewriting multiple services and coordinating across teams, it's architectural. If a single developer can change it in an afternoon, it's design.

---

## Architecture Patterns

### 1. Monolithic Architecture

All functionality lives in a **single deployable unit** — one codebase, one process, one database.

\`\`\`
┌─────────────────────────────────────────────┐
│              Monolithic Application          │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │   Auth   │ │  Orders  │ │ Payments │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │          Shared Database              │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
\`\`\`

**Pros:** Simple to develop, test, and deploy initially. Single process means no network latency between modules. Easy to debug (one log stream, one debugger).

**Cons:** Becomes a "big ball of mud" as it grows. A bug in payments can crash the entire app. Scaling means scaling everything, not just the bottleneck. Long build times. Team coordination bottlenecks.

**When to use:** Startups, MVPs, small teams (< 10 developers), when you don't yet know your domain boundaries.

---

### 2. Layered / N-Tier Architecture

Organizes code into **horizontal layers**, each with a distinct responsibility. Each layer only calls the layer directly below it.

\`\`\`
┌─────────────────────────────────┐
│      Presentation Layer         │  ← Controllers, Views, API endpoints
├─────────────────────────────────┤
│      Business Logic Layer       │  ← Services, domain rules, validation
├─────────────────────────────────┤
│      Data Access Layer          │  ← Repositories, ORM, query builders
├─────────────────────────────────┤
│      Database / External APIs   │  ← PostgreSQL, Redis, third-party APIs
└─────────────────────────────────┘
\`\`\`

**Strict vs Relaxed layering:**
- **Strict:** Each layer ONLY talks to the layer directly below (Presentation → Business → Data Access → DB).
- **Relaxed:** Layers can skip — Presentation can call Data Access directly for simple read queries.

**Pros:** Separation of concerns, testable layers in isolation, familiar to most developers, easy onboarding.

**Cons:** Can lead to "lasagna code" — too many layers with pass-through methods that add no value. Vertical features (e.g., "add a field to user profile") require changes across ALL layers.

---

### 3. Client-Server Architecture

Separates the system into **clients** (UI consumers) and **servers** (business logic + data). The most common pattern on the web.

\`\`\`
┌──────────┐     HTTP/WS      ┌──────────────┐
│  Browser │ ──────────────→  │   API Server  │
└──────────┘                  │              │
┌──────────┐     HTTP/WS      │  ┌────────┐  │
│ Mobile   │ ──────────────→  │  │   DB   │  │
└──────────┘                  │  └────────┘  │
┌──────────┐     gRPC         │              │
│   CLI    │ ──────────────→  └──────────────┘
└──────────┘
\`\`\`

**Pros:** Multiple client types share the same server. Clients and servers can evolve independently. Server controls data access and security.

**Cons:** Server is a single point of failure (unless replicated). Network latency between client and server. Requires API versioning strategy.

---

### 4. Microservices Architecture

The system is decomposed into **small, independently deployable services**, each owning its own data store and communicating over the network.

\`\`\`
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Auth    │   │  Orders  │   │ Payments │
│ Service  │   │ Service  │   │ Service  │
│  ┌────┐  │   │  ┌────┐  │   │  ┌────┐  │
│  │ DB │  │   │  │ DB │  │   │  │ DB │  │
│  └────┘  │   │  └────┘  │   │  └────┘  │
└──────────┘   └──────────┘   └──────────┘
      ↕              ↕              ↕
  ┌───────────────────────────────────────┐
  │         Message Bus / API Gateway     │
  └───────────────────────────────────────┘
\`\`\`

**Pros:** Independent deployment (ship auth without redeploying payments). Team autonomy (each team owns a service end-to-end). Technology diversity (service A in Node.js, service B in Go). Fine-grained scaling.

**Cons:** Network complexity (latency, partial failures, retries). Distributed transactions (no simple ACID across services — use Sagas or eventual consistency). Operational overhead (monitoring, logging, tracing across services). Data consistency challenges.

**When to use:** Large teams (> 20 developers), well-understood domain boundaries, when different parts of the system have different scaling/technology needs.

---

### 5. Event-Driven Architecture

Components communicate through **asynchronous events** rather than direct synchronous calls. A producer emits events, consumers react to them independently.

\`\`\`
┌──────────┐   OrderPlaced    ┌──────────────┐
│  Orders  │ ────────────→   │ Notification │
│ Service  │                  │   Service    │
└──────────┘   OrderPlaced    └──────────────┘
      │        ────────────→  ┌──────────────┐
      │                       │  Inventory   │
      │                       │   Service    │
      │                       └──────────────┘
      │        OrderPlaced    ┌──────────────┐
      └────────────────────→  │  Analytics   │
                              │   Service    │
                              └──────────────┘
\`\`\`

**Pros:** Loose coupling (producer doesn't know about consumers). Temporal decoupling (producer doesn't wait for consumers). Easy to add new consumers without modifying the producer. Enables CQRS (Command Query Responsibility Segregation) and Event Sourcing patterns.

**Cons:** Eventual consistency (not immediately consistent). Harder to debug (trace an event across 5 services). Event ordering can be tricky. Requires reliable message infrastructure (Kafka, RabbitMQ, SQS).

---

### 6. Serverless Architecture

Business logic runs as **short-lived functions** (FaaS — Function as a Service) triggered by events. No server management.

\`\`\`
  API Gateway → Lambda (process order) → DynamoDB
  S3 Upload  → Lambda (resize image)  → S3 Output
  Schedule   → Lambda (send reports)  → SES Email
  SQS Queue  → Lambda (process job)   → RDS
\`\`\`

**Pros:** Zero server management. Pay-per-invocation (no idle costs). Auto-scaling to zero and to thousands concurrently.

**Cons:** Cold starts (first invocation latency). Vendor lock-in (AWS Lambda ≠ Azure Functions ≠ GCP Cloud Functions). Hard to test locally. Maximum execution time limits (15 min for Lambda). State management complexity.

---

### 7. Hexagonal Architecture (Ports & Adapters)

Business logic sits at the **center**, completely isolated from external systems. **Ports** define interfaces (what the core needs), **adapters** implement them (how external systems fulfill those needs).

\`\`\`
              ┌──────────────────────────────────┐
              │         Adapters (outer ring)      │
              │                                    │
              │   ┌──────────────────────────┐    │
              │   │    Ports (inner ring)      │    │
              │   │                            │    │
              │   │   ┌──────────────────┐    │    │
              │   │   │   Domain Core     │    │    │
              │   │   │  (Business Logic) │    │    │
              │   │   └──────────────────┘    │    │
              │   │                            │    │
              │   └──────────────────────────┘    │
              │                                    │
              │  REST Adapter   DB Adapter         │
              │  CLI Adapter    Email Adapter      │
              └──────────────────────────────────┘
\`\`\`

**Pros:** Core business logic has zero dependencies on frameworks, databases, or UI. Easy to swap adapters (switch from PostgreSQL to MongoDB — only the adapter changes). Highly testable (test core logic with in-memory adapters). Aligns with Domain-Driven Design.

**Cons:** More upfront complexity. Requires discipline to maintain port/adapter boundaries. Can feel over-engineered for simple CRUD apps.

---

## Quality Attributes (Non-Functional Requirements)

Quality attributes are the **-ilities** that drive architecture decisions. You cannot maximize all of them — every architecture is a set of trade-offs.

| Quality Attribute  | Definition                                              | Example Trade-off                                   |
|--------------------|---------------------------------------------------------|-----------------------------------------------------|
| **Scalability**    | Handle increased load (horizontal: add nodes, vertical: bigger machine) | More scalable → more complex infrastructure          |
| **Reliability**    | Uptime, fault tolerance, graceful degradation           | Higher reliability → higher cost (redundancy)        |
| **Maintainability**| Ease of change, readability, modularity                 | More maintainable → slower initial development       |
| **Performance**    | Latency, throughput, resource utilization               | Higher performance → less abstraction, harder to read|
| **Security**       | AuthN, AuthZ, encryption, defense in depth              | More secure → more friction for developers & users   |

### Balancing Trade-offs

The **architecture trade-off triangle**: you can't have everything. A highly secure, highly performant, highly maintainable system is aspirational but never fully achievable. The architect's job is to **prioritize** based on business needs:

- **E-commerce platform:** Prioritize availability & performance (every second of downtime = lost revenue).
- **Healthcare system:** Prioritize security & reliability (HIPAA compliance, patient safety).
- **Startup MVP:** Prioritize maintainability & time-to-market (pivot quickly, refactor later).
- **Real-time gaming:** Prioritize performance & scalability (low latency is everything).

---

## Architecture Principles

### Separation of Concerns (SoC)

Each module, layer, or service should address a **distinct concern**. The UI should not contain SQL queries. The database layer should not format HTML.

### Single Responsibility Principle (SRP)

A module should have **one, and only one, reason to change**. If your UserService handles authentication, email sending, and PDF generation, it has too many responsibilities.

### DRY — Don't Repeat Yourself

Eliminate **knowledge duplication** (not necessarily code duplication). Two functions that happen to look similar but serve different domains are NOT duplication. A business rule defined in three places IS duplication.

### KISS — Keep It Simple, Stupid

Prefer the **simplest solution** that meets the requirements. Don't build a microservices architecture for a to-do app. Don't use Kubernetes when a single VPS suffices.

### YAGNI — You Aren't Gonna Need It

**Don't build features until they're actually needed.** Premature abstraction is as dangerous as premature optimization. Design for the requirements you have today, not the requirements you imagine you'll have in two years.

---

## Coupling vs Cohesion

| Concept       | Definition                                                    | Goal       |
|---------------|---------------------------------------------------------------|------------|
| **Coupling**  | Degree of interdependence between modules                     | Minimize   |
| **Cohesion**  | Degree to which elements within a module belong together      | Maximize   |

**Low coupling + high cohesion = good architecture.**

### Types of Coupling (worst → best)

1. **Content coupling** — Module A directly modifies Module B's internal data (worst)
2. **Common coupling** — Modules share global variables
3. **Control coupling** — Module A passes a flag that controls Module B's logic
4. **Stamp coupling** — Modules share a data structure but use different parts
5. **Data coupling** — Modules share only necessary data via parameters (best)

### Types of Cohesion (worst → best)

1. **Coincidental** — Elements are grouped arbitrarily (worst)
2. **Logical** — Elements perform similar operations but are unrelated (e.g., a \`Utils\` class)
3. **Temporal** — Elements are grouped because they run at the same time (e.g., init code)
4. **Functional** — Elements all contribute to a single, well-defined task (best)

---

## Documenting Architecture — The C4 Model

The **C4 model** by Simon Brown provides four zoom levels for architecture documentation:

### Level 1: System Context Diagram
Shows the system as a **black box** in its environment — who uses it, what external systems it integrates with.
\`\`\`
  [User] → [Our System] → [Payment Provider]
                         → [Email Service]
                         → [Analytics Platform]
\`\`\`

### Level 2: Container Diagram
Zooms into the system to show **containers** — applications, databases, message queues, file systems.
\`\`\`
  [SPA Frontend] → [API Server] → [PostgreSQL]
                                → [Redis Cache]
                                → [S3 Bucket]
                 → [WebSocket Server]
\`\`\`

### Level 3: Component Diagram
Zooms into a single container to show its **internal components** — controllers, services, repositories.
\`\`\`
  API Server:
    [AuthController] → [AuthService] → [UserRepository]
    [OrderController] → [OrderService] → [OrderRepository]
                                       → [PaymentGateway]
\`\`\`

### Level 4: Code Diagram
Zooms into a single component to show **classes, interfaces, and their relationships** — UML class diagrams. Usually auto-generated from code; rarely drawn manually.

### Interview Tip
When asked *"How do you document architecture?"* — mention the C4 model and emphasize that **the right level of detail depends on the audience**: executives see Level 1, new developers see Level 2–3, code reviewers see Level 4.

---

## Summary & Interview Cheat Sheet

| Question | Key Answer |
|----------|-----------|
| *What is architecture?* | Decisions expensive to change — structure, communication, deployment |
| *Architecture vs design?* | Architecture = system-level, design = component-level |
| *Monolith vs microservices?* | Monolith for simplicity, microservices for scale + team autonomy |
| *What are quality attributes?* | Non-functional requirements: scalability, reliability, performance, security, maintainability |
| *Coupling vs cohesion?* | Low coupling (independent modules), high cohesion (focused modules) |
| *C4 model?* | 4 zoom levels: Context → Containers → Components → Code |
`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LESSON 2 — Architecture Decision Records
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "Architecture Decision Records",
    slug: "architecture-decision-records",
    summary:
      "Learn what ADRs are, why documenting decisions matters, the standard ADR template (title, status, context, decision, consequences), the ADR lifecycle, real-world examples (choosing a database, choosing an architecture pattern, API versioning), lightweight formats (MADR, Nygard), tooling, and common pitfalls.",
    difficulty_level: "beginner",
    estimated_time: 30,
    order_index: 2,
    key_points: [
      "An Architecture Decision Record (ADR) is a short document that captures a single architectural decision — the context (why), the decision (what), and the consequences (trade-offs); ADRs answer the question future developers always ask: 'Why was it built this way?'",
      "Why document decisions: knowledge is lost when people leave, verbal decisions are forgotten, new team members waste time re-debating settled questions, regulatory audits may require decision traceability; ADRs are the institutional memory of a codebase",
      "Standard ADR template — Title: a short noun phrase (e.g., 'Use PostgreSQL for primary data store'); Status: Proposed → Accepted → Deprecated → Superseded; Context: the forces at play (business requirements, constraints, team skills); Decision: what was decided and why; Consequences: positive, negative, and neutral impacts of the decision",
      "ADR lifecycle and statuses — Proposed: initial draft, under discussion; Accepted: approved by the team, now the standard; Deprecated: no longer relevant (e.g., the system it pertains to was decommissioned); Superseded: replaced by a newer ADR (link to it); statuses are immutable — when an ADR is superseded, you don't edit it, you write a new one and link back",
      "Real-world ADR examples — Database selection (PostgreSQL vs MongoDB vs DynamoDB: weighing ACID compliance, query flexibility, operational cost, team expertise), Architecture pattern selection (monolith-first vs microservices: weighing team size, deployment complexity, timeline), API versioning strategy (URL versioning vs header versioning: weighing client compatibility, routing complexity, documentation)",
      "Lightweight ADR formats — Nygard format: the original minimal format (Title, Status, Context, Decision, Consequences) popularized by Michael Nygard; MADR (Markdown Any Decision Record): adds 'Considered Alternatives' and 'Pros/Cons' sections, more structured for team discussions; Y-statement format: 'In the context of [situation], facing [concern], we decided [decision] to achieve [goal], accepting [trade-off]'",
      "Storing ADRs in code repos — keep ADRs alongside the code they describe (e.g., docs/adr/ or docs/decisions/), use sequential numbering (0001-use-postgresql.md, 0002-adopt-rest-api.md), version control tracks who wrote it and when, code reviewers can reference ADRs in pull requests; tools: adr-tools (CLI by npryce), Log4brains (generates a searchable ADR website), adr-manager (VS Code extension)",
      "Common pitfalls — writing ADRs after the fact (they should be written during the decision process), making them too long (1–2 pages max), not listing alternatives considered (makes the decision seem arbitrary), using ADRs for trivial decisions (use them for decisions that are costly to reverse), not linking superseded ADRs (breaks the decision chain), treating ADRs as approval gates (they document decisions, not replace discussion)",
    ],
    content: `
# Architecture Decision Records (ADRs)

## What Are ADRs?

An **Architecture Decision Record** is a short document that captures **one** significant architectural decision — the context that motivated it, the decision itself, and the consequences (both good and bad).

ADRs answer the question every developer eventually asks when reading unfamiliar code:

> **"Why was it built this way?"**

### The Problem ADRs Solve

Without documented decisions, teams suffer from:

- **Knowledge loss** — the architect who chose MongoDB over PostgreSQL left the company; nobody remembers why
- **Decision amnesia** — six months later, the team re-debates the same decision because nobody wrote it down
- **New-hire confusion** — a new developer spends days questioning a design choice that was carefully considered
- **Architectural drift** — without clear reasoning, developers make inconsistent decisions over time
- **Audit gaps** — regulated industries (healthcare, finance) may require traceability of technical decisions

---

## The Standard ADR Template

The most widely used format is the **Nygard template**, created by Michael Nygard:

\`\`\`markdown
# ADR-NNNN: [Short Noun Phrase — Title of Decision]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]

## Context

What is the issue that we're seeing that is motivating this decision?
What are the forces at play (technical, business, political, team)?
What constraints do we have?

## Decision

What is the change that we're proposing and/or doing?
State the decision in full sentences, with active voice:
"We will use PostgreSQL as our primary data store."

## Consequences

What becomes easier or more difficult to do because of this change?
List both positive and negative consequences.
Be honest about trade-offs — there are always trade-offs.
\`\`\`

### Writing Good ADR Titles

| Bad Title ❌                  | Good Title ✅                              |
|-------------------------------|--------------------------------------------|
| Database                      | Use PostgreSQL for primary data store      |
| API stuff                     | Adopt URL-based API versioning (v1, v2)    |
| Architecture                  | Start with monolith, extract microservices later |
| Auth decision                 | Use JWT with short-lived access tokens and refresh tokens |

The title should be a **short noun phrase** that a future reader can scan and immediately understand what decision was made.

---

## ADR Lifecycle & Statuses

ADRs follow a **simple lifecycle** with four statuses:

\`\`\`
 ┌──────────┐     Team       ┌──────────┐
 │ Proposed │ ──approves──→  │ Accepted │
 └──────────┘                └──────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 ↓                                 ↓
          ┌─────────────┐                  ┌──────────────┐
          │ Deprecated  │                  │  Superseded  │
          │ (no longer  │                  │  by ADR-XXX  │
          │  relevant)  │                  └──────────────┘
          └─────────────┘
\`\`\`

### Key Rules

1. **ADRs are immutable once accepted.** If a decision changes, you write a NEW ADR that supersedes the old one.
2. **Never delete an ADR.** Even deprecated/superseded ones have historical value — they explain WHY the old approach was abandoned.
3. **Link superseded ADRs.** The old ADR's status becomes "Superseded by ADR-0042", and the new ADR's context explains why the previous decision changed.

---

## Real-World ADR Examples

### Example 1: Choosing a Database

\`\`\`markdown
# ADR-0003: Use PostgreSQL for Primary Data Store

## Status
Accepted

## Context
We need a database for our e-commerce platform. Requirements:
- ACID transactions for order processing and payments
- Complex queries for reporting (joins, aggregations)
- JSON support for flexible product attributes
- Strong ecosystem and hosting options
- Team expertise (3 of 5 developers have PostgreSQL experience)

Alternatives considered:
1. MongoDB — flexible schema, but lack of ACID for multi-document 
   transactions is risky for payments
2. MySQL — solid option, but lacks native JSON operators and 
   advanced indexing features PostgreSQL offers
3. DynamoDB — excellent scalability, but vendor lock-in to AWS 
   and limited query flexibility

## Decision
We will use PostgreSQL 16 as our primary data store, hosted on 
AWS RDS with read replicas for reporting queries.

## Consequences
**Positive:**
- ACID transactions ensure data integrity for payments
- Team already has PostgreSQL expertise → faster development
- Rich JSON support (jsonb) for flexible product attributes
- Excellent tooling (pgAdmin, psql, pgBouncer)

**Negative:**
- Horizontal scaling is harder than DynamoDB (but we don't need 
  it at our current scale of ~10k users)
- Schema migrations require careful planning (we'll use a 
  migration tool like node-pg-migrate)
- Vendor-neutral, but still tied to relational model assumptions
\`\`\`

### Example 2: Choosing an Architecture Pattern

\`\`\`markdown
# ADR-0001: Start with Modular Monolith, Extract Microservices Later

## Status
Accepted

## Context
We're a team of 6 building an MVP for a SaaS project management 
tool. We need to ship the first version in 3 months. We considered:
1. Microservices from day one
2. Traditional monolith
3. Modular monolith (monolith with clear module boundaries)

## Decision
We will build a modular monolith with clear domain boundaries 
(Auth, Projects, Tasks, Notifications, Billing). Each module will 
have its own directory, service layer, and database schema prefix. 
Modules will communicate through a shared event bus (in-process). 
This allows us to extract modules into microservices later if needed.

## Consequences
**Positive:**
- Fast to develop and deploy (single artifact)
- Clear module boundaries prepare us for future extraction
- No distributed systems complexity yet
- Easy to debug and test

**Negative:**
- Risk of module boundaries eroding over time (enforce via linting)
- Single database means shared schema evolution
- If one module is CPU-heavy, we can't scale it independently (yet)
\`\`\`

### Example 3: API Versioning Strategy

\`\`\`markdown
# ADR-0007: Adopt URL-Based API Versioning

## Status
Accepted

## Context
Our API is consumed by a mobile app (iOS/Android) and a web SPA. 
Mobile apps can't be force-updated, so we must support multiple 
API versions simultaneously. Options considered:
1. URL versioning: /api/v1/users, /api/v2/users
2. Header versioning: Accept: application/vnd.our-api.v2+json
3. Query parameter: /api/users?version=2
4. No versioning: always backward-compatible changes only

## Decision
We will use URL-based versioning (/api/v1/, /api/v2/). Version 
prefix is part of the route, making it explicit and easy to route 
at the load balancer level.

## Consequences
**Positive:**
- Crystal clear which version a client is using (visible in logs, 
  URLs, curl commands)
- Easy to route at the infrastructure level (nginx, API gateway)
- No risk of clients forgetting to set a header
- Simple to document with OpenAPI/Swagger

**Negative:**
- URL pollution (multiple URL trees)
- Temptation to create too many versions (policy: max 2 active)
- Breaking changes require a new version (we'll keep v1 for 12 
  months after v2 launch, then sunset it)
\`\`\`

---

## Lightweight ADR Formats

### Nygard Format (Original)

The simplest format — Title, Status, Context, Decision, Consequences. Best for small teams that want minimal overhead.

### MADR — Markdown Any Decision Record

Adds structure for team discussions. Includes explicit **Considered Alternatives** with pros/cons:

\`\`\`markdown
# Use React for Frontend Framework

## Context and Problem Statement
We need a frontend framework for our SPA. The team has mixed 
experience across React, Vue, and Angular.

## Considered Options
1. React — largest ecosystem, most team experience
2. Vue — simpler learning curve, smaller bundle
3. Angular — full framework, strong TypeScript integration

## Decision Outcome
Chosen option: React, because it has the largest ecosystem, 3 of 
4 frontend developers already know it, and hiring React developers 
is easier in our market.

### Positive Consequences
- Faster onboarding for current team
- Huge library ecosystem (component libraries, state management)

### Negative Consequences
- Need to choose and integrate many libraries (routing, state, forms)
- JSX learning curve for the one Angular developer on the team
\`\`\`

### Y-Statement Format

A single sentence that captures the decision:

> In the context of **[situation/problem]**, facing **[concern/constraint]**, we decided **[decision]** to achieve **[goal/quality attribute]**, accepting **[trade-off/downside]**.

Example:
> In the context of **needing persistent storage for user data**, facing **team expertise in SQL and need for ACID transactions**, we decided **to use PostgreSQL** to achieve **data integrity and query flexibility**, accepting **the operational overhead of managing a relational database**.

---

## Storing ADRs in Code Repos

### Directory Structure

\`\`\`
project/
├── docs/
│   └── adr/
│       ├── 0001-adopt-modular-monolith.md
│       ├── 0002-use-postgresql.md
│       ├── 0003-use-jwt-for-auth.md
│       ├── 0004-adopt-url-api-versioning.md
│       └── template.md
├── src/
│   └── ...
└── package.json
\`\`\`

### Why Version Control?

- **Git blame** shows who wrote the ADR and when
- **Pull requests** enable team review of proposed ADRs
- **History** shows how decisions evolved over time
- **Co-location** — ADRs live next to the code they describe

### Tools for ADRs

| Tool          | Description                                                    |
|---------------|----------------------------------------------------------------|
| **adr-tools** | CLI by Nat Pryce — \`adr new "Use PostgreSQL"\` creates a numbered file |
| **Log4brains** | Generates a searchable static website from ADR markdown files  |
| **adr-manager**| VS Code extension for browsing and creating ADRs               |
| **adr-log**   | Generates a table of contents from your ADR directory           |

---

## Common Pitfalls

### 1. Writing ADRs After the Fact
ADRs should be written **during** the decision-making process, not weeks later when context is forgotten. Ideally, the ADR PR is part of the implementation PR.

### 2. Making ADRs Too Long
Keep them to **1–2 pages**. If your ADR is 10 pages, it's a design document, not a decision record. ADRs capture the *decision*, not the full analysis.

### 3. Not Listing Alternatives
An ADR without alternatives considered looks arbitrary. Always list at least 2–3 alternatives and explain why they were rejected.

### 4. ADRs for Trivial Decisions
Don't write an ADR for "Use Prettier for code formatting." ADRs are for decisions that are **expensive to reverse** — database choice, architecture pattern, authentication strategy.

### 5. Not Linking Superseded ADRs
When ADR-0015 supersedes ADR-0003, both must reference each other. Otherwise, a future reader finds ADR-0003 and doesn't know it's outdated.

### 6. Treating ADRs as Approval Gates
ADRs **document** decisions; they don't **replace** discussion. The decision should be made through team discussion (RFC, meeting, Slack thread), then captured in an ADR.

---

## Summary & Interview Cheat Sheet

| Question | Key Answer |
|----------|-----------|
| *What is an ADR?* | A short document capturing one architectural decision: context, decision, consequences |
| *Why use ADRs?* | Preserve institutional knowledge, prevent re-debating decisions, onboard new devs faster |
| *ADR statuses?* | Proposed → Accepted → Deprecated / Superseded |
| *Nygard vs MADR?* | Nygard: minimal (4 sections); MADR: adds considered alternatives with pros/cons |
| *Where to store ADRs?* | In the code repo (docs/adr/), numbered sequentially, version-controlled |
| *Common mistake?* | Writing them after the fact instead of during the decision process |
`,
  },
];
