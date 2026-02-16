// ============================================================================
// Software Architecture Fundamentals — Quiz Questions (ENHANCED)
// ============================================================================

const quiz = {
  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 1: What is Software Architecture? (5 questions)
  // ─────────────────────────────────────────────────────────────────────────
  "what-is-software-architecture": [
    {
      question_text:
        "What distinguishes an 'architectural' decision from a 'design' decision, and why does this distinction matter in practice?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Architectural decisions are the ones that are expensive and difficult to reverse — they define the system's high-level structure (service boundaries, database technology, communication protocols, deployment topology); design decisions are component-level choices (class hierarchy, algorithm selection, function signatures) that a single developer can change in a day; this distinction matters because architectural decisions require more deliberation, documentation (ADRs), and stakeholder buy-in since mistakes have system-wide consequences",
        "Architectural decisions are made by senior engineers while design decisions are made by junior engineers — the distinction is purely about seniority and organizational hierarchy; architectural decisions always require formal approval from a review board, while design decisions can be made independently by any developer",
        "Architectural decisions involve choosing technologies (React vs Vue, PostgreSQL vs MongoDB) while design decisions involve writing code — any technology choice is architectural and any code-level choice is design; the distinction helps in organizing meeting agendas between tech leads and developers",
        "Architectural decisions are documented in UML diagrams while design decisions are documented in code comments — the distinction is about documentation format; architectural decisions are always made before coding starts, while design decisions are made during implementation",
      ]),
      correct_answer:
        "Architectural decisions are the ones that are expensive and difficult to reverse — they define the system's high-level structure (service boundaries, database technology, communication protocols, deployment topology); design decisions are component-level choices (class hierarchy, algorithm selection, function signatures) that a single developer can change in a day; this distinction matters because architectural decisions require more deliberation, documentation (ADRs), and stakeholder buy-in since mistakes have system-wide consequences",
      explanation:
        "The key differentiator is the cost-of-change gradient. Switching from PostgreSQL to MongoDB after a year of development might take months and risk data loss — that's architectural. Refactoring a class to use the Strategy pattern instead of if/else takes a day — that's design. The boundary is fuzzy (is choosing an ORM architectural or design?), but the principle holds: if changing it would require coordinated effort across teams and systems, it's architectural. This is why architects focus on creating 'options' — decisions that preserve flexibility and delay irreversible commitments until more information is available.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text:
        "In a strict layered (N-tier) architecture, what is the core communication rule, and what problem does violating it cause?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Each layer may only communicate with the layer directly below it (Presentation → Business Logic → Data Access → Database) — violating this rule (e.g., a Controller directly executing SQL queries, bypassing the Service layer) creates tight coupling between layers, defeats the purpose of separation of concerns, makes layers non-replaceable, and means a database schema change could break the UI layer directly instead of being absorbed by the Data Access layer",
        "Each layer must communicate with all other layers through a central message bus — violating this by making direct calls between layers causes performance issues; the message bus ensures asynchronous communication and load balancing between layers, and without it the system cannot scale horizontally",
        "Each layer must expose a REST API that the layer above calls — violating this by using direct function calls instead of HTTP prevents the layers from being deployed independently as microservices; strict layering always requires network boundaries between every layer",
        "Each layer can communicate freely with any other layer as long as the communication is documented — there is no strict ordering rule; the only requirement is that all inter-layer calls are logged for debugging purposes; violating the logging requirement makes it impossible to trace bugs across the system",
      ]),
      correct_answer:
        "Each layer may only communicate with the layer directly below it (Presentation → Business Logic → Data Access → Database) — violating this rule (e.g., a Controller directly executing SQL queries, bypassing the Service layer) creates tight coupling between layers, defeats the purpose of separation of concerns, makes layers non-replaceable, and means a database schema change could break the UI layer directly instead of being absorbed by the Data Access layer",
      explanation:
        "Strict layering creates a dependency chain: Presentation depends on Business Logic, Business Logic depends on Data Access. This means you can replace the Data Access layer (switch from PostgreSQL to MongoDB) without touching the Presentation layer — the Business Logic layer absorbs the change. When a Controller directly queries the database, you've created a shortcut that bypasses the Service layer's business rules and validation. Now the Controller has two reasons to change: UI logic changes AND database schema changes. In interviews, mention that 'relaxed layering' (allowing skip-layer calls for simple reads) exists as a pragmatic compromise, but the default should be strict.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text:
        "What is the Hexagonal Architecture (Ports & Adapters) pattern, and how does it differ from traditional layered architecture in terms of dependency direction?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Hexagonal Architecture places the domain/business logic at the center with no dependencies on external systems — it defines 'ports' (interfaces that declare what the core needs) and 'adapters' (implementations for specific technologies like PostgreSQL, Stripe, Express); unlike layered architecture where dependencies flow top-down (UI → Logic → DB), hexagonal architecture inverts the outer dependencies: the database adapter depends on the domain port interface, not the other way around — this means the domain core is testable with in-memory fakes and the database can be swapped without changing any business logic",
        "Hexagonal Architecture organizes code into exactly six layers (hence 'hexagonal') — UI, Controller, Service, Repository, Cache, and Database; it differs from traditional 3-tier layered architecture by adding three additional layers for caching, API gateway, and message queue support; the dependency direction is the same (top-down) but with more granular separation",
        "Hexagonal Architecture is a deployment pattern where services are arranged in a hexagonal mesh network topology — each service can communicate with up to six adjacent services; it differs from layered architecture by enabling peer-to-peer communication instead of hierarchical layers; it's primarily used in microservices environments for service mesh configuration",
        "Hexagonal Architecture is a frontend pattern where UI components are arranged in a hexagonal grid layout for responsive design — the 'ports' are CSS connection points and 'adapters' handle responsive breakpoints; it differs from layered architecture because it applies to visual layout rather than code organization",
      ]),
      correct_answer:
        "Hexagonal Architecture places the domain/business logic at the center with no dependencies on external systems — it defines 'ports' (interfaces that declare what the core needs) and 'adapters' (implementations for specific technologies like PostgreSQL, Stripe, Express); unlike layered architecture where dependencies flow top-down (UI → Logic → DB), hexagonal architecture inverts the outer dependencies: the database adapter depends on the domain port interface, not the other way around — this means the domain core is testable with in-memory fakes and the database can be swapped without changing any business logic",
      explanation:
        "The crucial insight is dependency inversion. In layered architecture, the Business Logic layer directly depends on the Data Access layer — if you change your database, you change the repository, and the service might need updates too. In Hexagonal Architecture, the domain core defines a port (e.g., OrderRepositoryPort with save() and findById() methods), and adapters implement it (PostgresOrderRepository, MongoOrderRepository, InMemoryOrderRepository). The domain never imports 'pg' or 'mongoose' — it only knows about the port interface. This makes the core 100% testable with in-memory fakes (no Docker, no test database). It's also called 'Clean Architecture' (Uncle Bob) or 'Onion Architecture' (Palermo). Interview key phrase: 'Dependencies point inward — the domain is the center of gravity.'",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "How do quality attributes (non-functional requirements) create trade-offs in architecture decisions? Give an example of two quality attributes that are inherently in tension.",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Quality attributes (scalability, reliability, maintainability, performance, security) inherently create trade-offs because optimizing for one often comes at the cost of another — for example, Performance vs Maintainability: highly optimized code (custom memory management, denormalized data, hand-tuned queries) delivers maximum performance but is harder to read, modify, and debug; similarly, Security vs Usability: strict security (MFA, session timeouts, IP whitelisting, complex password rules) makes the system more secure but creates friction for legitimate users; the architect's job is to prioritize based on business context, not to maximize everything",
        "Quality attributes do not create trade-offs — a well-designed system can maximize all quality attributes simultaneously if the architecture is correct; the belief that trade-offs exist is a misconception from older computing eras when hardware was limited; modern cloud infrastructure eliminates all trade-off concerns because you can scale any resource independently",
        "Quality attributes only create trade-offs during the development phase — once the system is deployed, all quality attributes can be independently tuned through configuration; for example, you can increase both performance and security after deployment by simply adding more servers and firewalls; trade-offs only apply to the initial design phase budget",
        "Quality attributes create trade-offs only between functional and non-functional requirements — two non-functional requirements never conflict with each other; the trade-off is always between adding new features (functional) versus improving system qualities (non-functional); architects must choose between building new features or improving existing quality",
      ]),
      correct_answer:
        "Quality attributes (scalability, reliability, maintainability, performance, security) inherently create trade-offs because optimizing for one often comes at the cost of another — for example, Performance vs Maintainability: highly optimized code (custom memory management, denormalized data, hand-tuned queries) delivers maximum performance but is harder to read, modify, and debug; similarly, Security vs Usability: strict security (MFA, session timeouts, IP whitelisting, complex password rules) makes the system more secure but creates friction for legitimate users; the architect's job is to prioritize based on business context, not to maximize everything",
      explanation:
        "This is a fundamental concept in software architecture. Trade-off examples: (1) Performance vs Maintainability — denormalized database tables are faster to query but harder to keep consistent; (2) Scalability vs Simplicity — microservices scale independently but add distributed systems complexity; (3) Security vs Performance — encrypting all data at rest and in transit adds computational overhead; (4) Availability vs Consistency (CAP theorem) — in a distributed system, during a network partition, you must choose between availability and consistency. The architect's job is to ask: 'What matters MOST for THIS business?' An e-commerce site prioritizes availability (downtime = lost revenue). A banking app prioritizes consistency (incorrect balances are unacceptable). An interview strong-signal is articulating trade-offs specific to the system you're discussing, not just reciting theory.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text:
        "What is the C4 model for architecture documentation, what are its four levels, and how do you decide which level to use for a given audience?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The C4 model (by Simon Brown) provides four hierarchical zoom levels for documenting software architecture: Level 1 — System Context (the system as a black box showing users and external system integrations), Level 2 — Container Diagram (deployable units: web apps, APIs, databases, message queues), Level 3 — Component Diagram (internal structure of one container: controllers, services, repositories), Level 4 — Code Diagram (class/function-level detail, usually auto-generated); choose the level based on audience: executives and product managers see Level 1, DevOps and new developers see Level 2, developers working on a specific service see Level 3, Level 4 is rarely drawn manually",
        "The C4 model stands for Create, Configure, Compile, and Containerize — it's a four-step deployment pipeline for containerized applications; Level 1 creates the Dockerfile, Level 2 configures environment variables, Level 3 compiles the application, Level 4 pushes the container to a registry; you use all four levels for every deployment regardless of audience",
        "The C4 model stands for Class, Component, Controller, and Collection — it's a naming convention for organizing code files in MVC frameworks; Level 1 defines data model classes, Level 2 defines reusable components, Level 3 defines route controllers, Level 4 defines database collections; the level you use depends on which part of the codebase you're working on",
        "The C4 model is a formal UML extension that requires four mandatory diagram types for every system: class diagrams, sequence diagrams, activity diagrams, and deployment diagrams; these four diagrams must be created before any code is written as part of the architecture approval process; all audiences receive all four diagrams to ensure complete understanding",
      ]),
      correct_answer:
        "The C4 model (by Simon Brown) provides four hierarchical zoom levels for documenting software architecture: Level 1 — System Context (the system as a black box showing users and external system integrations), Level 2 — Container Diagram (deployable units: web apps, APIs, databases, message queues), Level 3 — Component Diagram (internal structure of one container: controllers, services, repositories), Level 4 — Code Diagram (class/function-level detail, usually auto-generated); choose the level based on audience: executives and product managers see Level 1, DevOps and new developers see Level 2, developers working on a specific service see Level 3, Level 4 is rarely drawn manually",
      explanation:
        "The C4 model's power is its zoom metaphor — like Google Maps going from world → country → city → street. Each level answers different questions: Level 1 (Context): 'What does our system do and what does it integrate with?' — perfect for stakeholder presentations. Level 2 (Containers): 'What are the major deployable pieces and how do they communicate?' — perfect for DevOps and architecture reviews. Level 3 (Components): 'What's inside this API server?' — perfect for developers designing or refactoring a service. Level 4 (Code): 'What classes implement this component?' — usually auto-generated from code, rarely worth manually maintaining. In interviews, demonstrating that you match documentation depth to audience shows architectural maturity. Tools: Structurizr (by Simon Brown himself), C4-PlantUML, Mermaid C4 syntax.",
      difficulty: "medium",
      order_index: 5,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Lesson 2: Architecture Decision Records (5 questions)
  // ─────────────────────────────────────────────────────────────────────────
  "architecture-decision-records": [
    {
      question_text:
        "What is the primary purpose of an Architecture Decision Record (ADR), and what key sections must it contain to be effective?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "An ADR captures a single architectural decision along with its context (why the decision was needed), the decision itself (what was decided), and the consequences (positive and negative trade-offs) — its primary purpose is to preserve institutional knowledge so future developers (and future-you) understand WHY the system was built this way, not just HOW; a minimal ADR must contain: Title (short noun phrase like 'Use PostgreSQL for primary data store'), Status (Proposed/Accepted/Deprecated/Superseded), Context (forces at play), Decision (what was decided), and Consequences (trade-offs)",
        "An ADR is a comprehensive design document that captures all technical specifications for a system including API contracts, database schemas, deployment procedures, and test plans — it replaces the need for separate documentation by combining everything into one document; it must contain at least 20 pages covering architecture, design patterns, code samples, performance benchmarks, and risk assessments",
        "An ADR is a project management artifact that tracks the progress of architectural work items — it contains task assignments, sprint allocations, and Gantt charts for architecture implementation; its primary purpose is to help project managers estimate timelines and allocate resources for architectural changes across teams",
        "An ADR is a compliance document required by regulatory frameworks (SOC2, HIPAA, PCI-DSS) — it must contain legal language about data handling, privacy policies, and audit trails; its primary purpose is to satisfy external auditors, not to help developers; it must be reviewed and signed by legal counsel before being published",
      ]),
      correct_answer:
        "An ADR captures a single architectural decision along with its context (why the decision was needed), the decision itself (what was decided), and the consequences (positive and negative trade-offs) — its primary purpose is to preserve institutional knowledge so future developers (and future-you) understand WHY the system was built this way, not just HOW; a minimal ADR must contain: Title (short noun phrase like 'Use PostgreSQL for primary data store'), Status (Proposed/Accepted/Deprecated/Superseded), Context (forces at play), Decision (what was decided), and Consequences (trade-offs)",
      explanation:
        "ADRs solve the 'why was it built this way?' problem that every developer faces when joining an existing project. Without ADRs, the reasoning behind decisions lives in the heads of people who may have left the company, in Slack messages that are unsearchable, or in meeting notes nobody reads. The Nygard format (Title, Status, Context, Decision, Consequences) is deliberately lightweight — an ADR should take 15-30 minutes to write, not days. The key insight is that ADRs capture the DECISION and its REASONING, not the full analysis. If your ADR is 10 pages long, it's a design document, not a decision record. Keep it to 1-2 pages — enough to understand the 'why' without drowning in detail.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text:
        "What happens when an architectural decision needs to change? How does the ADR lifecycle handle superseded decisions, and why should old ADRs never be deleted or edited?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "When a decision changes, you write a NEW ADR that supersedes the old one — the old ADR's status is updated to 'Superseded by ADR-XXXX' and the new ADR's context explains why the previous decision is being replaced; old ADRs are NEVER deleted because they provide historical context (why the old approach was chosen, what changed, what was learned); editing old ADRs destroys history — if you change the context retroactively, future readers can't understand the original reasoning; the full chain (ADR-0003 → Superseded by ADR-0015 → Superseded by ADR-0028) tells the story of how the architecture evolved",
        "When a decision changes, you edit the original ADR in place with the new decision — this keeps the ADR count low and avoids confusion about which ADR is current; old versions are tracked by git history if anyone needs to see the original; creating new ADRs for every change leads to 'ADR sprawl' where nobody can find the current decisions among hundreds of outdated documents",
        "When a decision changes, you delete the old ADR and create a new one with the same number — this ensures the numbering stays clean and sequential; deleted ADRs are stored in an 'archive' folder for compliance purposes but are not meant to be read by developers; the archive is only accessed during annual security audits",
        "When a decision changes, you update the status of all related ADRs to 'Invalid' and schedule a team meeting to review all existing ADRs for cascading impacts — no new ADR is created until the review meeting concludes; this 'ADR review ceremony' happens quarterly and is the only time ADRs are modified",
      ]),
      correct_answer:
        "When a decision changes, you write a NEW ADR that supersedes the old one — the old ADR's status is updated to 'Superseded by ADR-XXXX' and the new ADR's context explains why the previous decision is being replaced; old ADRs are NEVER deleted because they provide historical context (why the old approach was chosen, what changed, what was learned); editing old ADRs destroys history — if you change the context retroactively, future readers can't understand the original reasoning; the full chain (ADR-0003 → Superseded by ADR-0015 → Superseded by ADR-0028) tells the story of how the architecture evolved",
      explanation:
        "The immutability principle is central to ADR practice. Think of ADRs like a git log — you never rewrite history, you add new commits. The supersession chain tells a valuable story: 'In 2023 we chose MongoDB (ADR-0003) because we valued schema flexibility. In 2024 we switched to PostgreSQL (ADR-0015) because we needed ACID transactions for the new payment system. In 2025 we added a read replica (ADR-0028) because reporting queries were slowing down the primary.' A future developer reading this chain understands not just what the current database is, but why it changed TWICE. If you had deleted ADR-0003, they'd never know MongoDB was tried and abandoned, and might waste time proposing it again.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text:
        "What is the difference between the Nygard ADR format and MADR (Markdown Any Decision Record), and when would you choose one over the other?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The Nygard format is the original minimal ADR template with four core sections (Title+Status, Context, Decision, Consequences) — it's fast to write and ideal for small teams with low ceremony; MADR (Markdown Any Decision Record) extends this by adding explicit 'Considered Alternatives' with structured pros/cons for each option, a 'Decision Outcome' section (chosen option + justification), and optional 'Decision Drivers' and 'Links' sections — MADR is better for larger teams or decisions that require formal evaluation of multiple options because it forces you to document why alternatives were rejected, which prevents revisiting the same debate later",
        "The Nygard format is a proprietary commercial tool that generates ADRs from UML diagrams — it requires a license and integrates with Enterprise Architect; MADR is the open-source alternative that uses plain Markdown files; choose Nygard for enterprise projects with budget and MADR for open-source projects without budget for tooling",
        "The Nygard format is for architecture decisions only (system-level choices like database selection) while MADR is for any type of decision including design decisions, process decisions, and team agreements (like code review practices or meeting schedules); choose Nygard when the decision is purely technical and MADR when the decision involves people or processes",
        "The Nygard format and MADR are identical in structure — the only difference is the file extension (.nygard vs .madr); tools like adr-tools can read both formats interchangeably; the choice between them is purely based on which CLI tool you have installed and has no impact on the content or quality of the ADR",
      ]),
      correct_answer:
        "The Nygard format is the original minimal ADR template with four core sections (Title+Status, Context, Decision, Consequences) — it's fast to write and ideal for small teams with low ceremony; MADR (Markdown Any Decision Record) extends this by adding explicit 'Considered Alternatives' with structured pros/cons for each option, a 'Decision Outcome' section (chosen option + justification), and optional 'Decision Drivers' and 'Links' sections — MADR is better for larger teams or decisions that require formal evaluation of multiple options because it forces you to document why alternatives were rejected, which prevents revisiting the same debate later",
      explanation:
        "Both formats serve the same purpose (documenting decisions), but MADR adds structure that prevents a common shortcoming: ADRs that state what was decided but not what else was considered. Without alternatives, an ADR looks arbitrary — 'We chose PostgreSQL' means nothing if the reader doesn't know what else was evaluated. MADR's 'Considered Options' section with pros/cons creates a decision matrix that future readers can evaluate: 'Yes, they considered MongoDB, but rejected it because of X.' This prevents the 'Why didn't they just use MongoDB?' question that wastes meeting time. For small teams (2-5 people) where decisions are discussed verbally, Nygard's simplicity reduces overhead. For teams of 10+ or decisions that affect multiple teams, MADR's structure ensures nothing is implicit.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text:
        "Where should ADRs be stored, and what are the advantages of keeping them in the code repository versus a separate documentation system (Confluence, Notion, Google Docs)?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "ADRs should be stored in the code repository (e.g., docs/adr/ directory) because: (1) they are version-controlled alongside the code they describe — git blame shows who wrote each ADR and when, (2) ADRs can be reviewed in pull requests alongside the code that implements the decision, (3) they are always in sync with the codebase version (checkout a branch from 2023 and see the ADRs from 2023), (4) they are discoverable by developers who are already in the repo, (5) they survive tool migrations (Confluence → Notion) because they're plain Markdown in git; separate documentation systems risk becoming stale, disconnected from code, and invisible to developers doing daily work",
        "ADRs should be stored exclusively in a wiki system like Confluence because: (1) Confluence provides rich formatting, commenting, and collaboration features that Markdown lacks, (2) non-technical stakeholders who don't use git can access and contribute to ADRs, (3) Confluence's search is superior to git grep for finding decisions across multiple repositories, (4) code repositories should only contain code, not documentation — mixing docs with code violates separation of concerns",
        "ADRs should be stored in a dedicated ADR microservice with a REST API — each ADR is a database record with fields for title, status, context, decision, and consequences; this enables programmatic querying (e.g., 'list all accepted ADRs about databases'), cross-team search, and integration with project management tools; storing ADRs as files is an outdated approach that doesn't scale beyond 100 decisions",
        "ADRs should be stored in the project management tool (Jira, Linear, Asana) as a special ticket type — this allows linking ADRs directly to implementation tasks and tracking whether the decision has been fully implemented; storing in code repos means ADRs are invisible to product managers and designers who don't read code",
      ]),
      correct_answer:
        "ADRs should be stored in the code repository (e.g., docs/adr/ directory) because: (1) they are version-controlled alongside the code they describe — git blame shows who wrote each ADR and when, (2) ADRs can be reviewed in pull requests alongside the code that implements the decision, (3) they are always in sync with the codebase version (checkout a branch from 2023 and see the ADRs from 2023), (4) they are discoverable by developers who are already in the repo, (5) they survive tool migrations (Confluence → Notion) because they're plain Markdown in git; separate documentation systems risk becoming stale, disconnected from code, and invisible to developers doing daily work",
      explanation:
        "The biggest advantage of repo-based ADRs is the PR workflow. When a developer implements a decision (e.g., migrating from Express to Fastify), the code changes AND the ADR can be in the same pull request. Reviewers see both the decision justification and the implementation together. This also means checking out a historical git tag shows you the ADRs as they were at that point in time — you see what decisions existed when that code was written. Confluence-style wikis have a persistent problem: they become 'documentation graveyards' where content is written once and never updated. Wiki ADRs also get lost during tool migrations (every company migrates their wiki every 3-5 years). Plain Markdown in git is the most durable format — it has zero dependencies and survives any tooling change. Tools like Log4brains can generate a searchable website from repo ADRs for non-technical stakeholders.",
      difficulty: "easy",
      order_index: 4,
    },
    {
      question_text:
        "What are the most common pitfalls teams encounter when adopting ADRs, and how do you avoid each one?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Common pitfalls: (1) Writing ADRs after the fact — context is forgotten, consequences are rationalized; fix: write the ADR PR alongside the implementation PR; (2) Making ADRs too long — 10-page documents are design docs, not decision records; fix: limit to 1-2 pages, move analysis to appendices; (3) Not listing alternatives — makes the decision seem arbitrary; fix: always include 2-3 alternatives with reasons for rejection; (4) Using ADRs for trivial decisions — 'Use Prettier for formatting' doesn't warrant an ADR; fix: only use ADRs for decisions costly to reverse; (5) Not linking superseded ADRs — breaks the decision chain; fix: always update old ADR status and cross-reference the new one",
        "Common pitfalls: (1) Writing too many ADRs — more than 10 ADRs per project creates confusion; fix: limit to 10 ADRs maximum and consolidate related decisions into one document; (2) Making ADRs too short — a good ADR should be at least 5 pages with detailed technical specifications; fix: include code samples, benchmarks, and deployment diagrams in every ADR; (3) Letting junior developers write ADRs — only architects should author ADRs; fix: establish a formal review board",
        "Common pitfalls: (1) Using Markdown instead of a proper document format like PDF or Word — Markdown lacks formatting capabilities for professional documents; fix: always generate PDFs from ADRs for distribution; (2) Storing ADRs in git — git conflicts make ADRs hard to edit collaboratively; fix: use Google Docs for real-time editing; (3) Numbering ADRs sequentially — gaps in numbers cause confusion; fix: use UUIDs instead of sequential numbers",
        "Common pitfalls: (1) Not getting legal approval for ADRs — architectural decisions may have compliance implications; fix: route all ADRs through legal review before marking as Accepted; (2) Not including cost estimates — every ADR should include a detailed financial analysis; fix: always attach a spreadsheet with infrastructure cost projections; (3) Not assigning a single decider — ADRs should follow the RACI matrix; fix: always name the R (Responsible) and A (Accountable) person",
      ]),
      correct_answer:
        "Common pitfalls: (1) Writing ADRs after the fact — context is forgotten, consequences are rationalized; fix: write the ADR PR alongside the implementation PR; (2) Making ADRs too long — 10-page documents are design docs, not decision records; fix: limit to 1-2 pages, move analysis to appendices; (3) Not listing alternatives — makes the decision seem arbitrary; fix: always include 2-3 alternatives with reasons for rejection; (4) Using ADRs for trivial decisions — 'Use Prettier for formatting' doesn't warrant an ADR; fix: only use ADRs for decisions costly to reverse; (5) Not linking superseded ADRs — breaks the decision chain; fix: always update old ADR status and cross-reference the new one",
      explanation:
        "The most damaging pitfall is writing ADRs after the fact. When you document a decision weeks later, you unconsciously rationalize: you remember the option you chose more favorably, forget the alternatives you considered, and overstate the positive consequences. Write the ADR when the decision is being made — ideally as a 'Proposed' ADR that gets reviewed alongside the implementation code. Another subtle pitfall is scope creep: an ADR should record ONE decision, not be an encyclopedia. If your ADR covers database choice, ORM selection, migration strategy, AND backup policy, split it into four ADRs. Each should be independently understandable. The guideline for when to write an ADR: 'Would a new team member question this decision? Would reversing it take more than a day? If yes to either, write an ADR.'",
      difficulty: "hard",
      order_index: 5,
    },
  ],
};

export default quiz;
