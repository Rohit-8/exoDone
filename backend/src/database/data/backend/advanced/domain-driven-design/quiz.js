// ============================================================================
// Domain-Driven Design — Quiz Questions
// ============================================================================

export default {
  'ddd-strategic-patterns': [
    {
      question_text: "What is the primary purpose of Ubiquitous Language in DDD?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "To enforce consistent code formatting across the entire codebase",
        "To create a shared, rigorous language between developers and domain experts used in code, conversation, and documentation",
        "To standardize API naming conventions for REST endpoints",
        "To generate documentation automatically from code comments"
      ]),
      correct_answer: "To create a shared, rigorous language between developers and domain experts used in code, conversation, and documentation",
      explanation: "Ubiquitous Language is the most impactful DDD concept. It's a shared language between developers and domain experts that is used consistently in code (class names, method names), conversations (meetings, Slack), documentation, and tests. The key insight is that miscommunication between developers and business stakeholders is the #1 cause of building the wrong software. By forcing everyone to use the same precise terms — and reflecting those terms directly in code — you dramatically reduce translation errors. For example, if the business says 'place an order,' the code should have Order.place(), not DataProcessor.process().",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What problem do Bounded Contexts solve in a large domain model?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "They improve database query performance by partitioning data",
        "They prevent the same term from having conflicting meanings by giving each model explicit boundaries within which every term has exactly one meaning",
        "They enforce authentication and authorization between microservices",
        "They reduce code duplication by sharing a single unified model everywhere"
      ]),
      correct_answer: "They prevent the same term from having conflicting meanings by giving each model explicit boundaries within which every term has exactly one meaning",
      explanation: "In a large system, a single unified model becomes contradictory. Consider 'Product': in the Catalog Context it has name, description, and images; in Inventory it has warehouse location and stock count; in Shipping it has weight and dimensions. Forcing all these into one Product class creates a God Object. Bounded Contexts solve this by defining explicit boundaries — inside each boundary, every term has exactly one meaning. The Catalog Context has CatalogProduct, Inventory has StockItem, and Shipping has Parcel. They communicate via IDs and Domain Events, never by sharing objects.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "When should you use an Anti-Corruption Layer (ACL) in DDD?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "When two Bounded Contexts share the same database schema",
        "When integrating with a legacy system or external API whose model differs fundamentally from your domain model, to prevent foreign concepts from leaking in",
        "When you need to validate user input before it reaches the domain layer",
        "When you want to cache data between microservice calls for performance"
      ]),
      correct_answer: "When integrating with a legacy system or external API whose model differs fundamentally from your domain model, to prevent foreign concepts from leaking in",
      explanation: "An Anti-Corruption Layer (ACL) is a translation layer between your Bounded Context and an upstream system whose model is fundamentally different from yours. For example, a legacy billing system might return stat_cd='C' and curr_cd=1, while your domain uses status='paid' and currency='USD'. Without an ACL, these legacy concepts leak into your code — you'd have if(stat_cd === 'C') scattered everywhere. The ACL contains all translation logic in one place, converting the foreign model into your domain model. It's essential when integrating with legacy systems, third-party APIs, or any system whose model you don't control and don't want contaminating your domain.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text: "What is a Core Domain (Core Subdomain) in DDD, and how should it be treated?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The database schema at the center of the architecture — use the most advanced ORM for it",
        "The part of the system with the most users — optimize it for performance above all else",
        "The part of the business that provides competitive advantage — invest the most talent, time, and DDD rigor here",
        "The authentication and authorization module — it must be the most secure component"
      ]),
      correct_answer: "The part of the business that provides competitive advantage — invest the most talent, time, and DDD rigor here",
      explanation: "A Core Domain is the part of the business that makes the company unique and provides competitive advantage. For Amazon, it's the recommendation engine and logistics optimization. For Uber, it's dynamic pricing and driver matching. The strategy for Core Domains is to build them in-house with your best engineers, applying full DDD tactical patterns (Aggregates, Value Objects, Domain Events). In contrast, Supporting Subdomains (necessary but not differentiating, like internal reporting) can use simpler patterns, and Generic Subdomains (solved problems like authentication) should use off-the-shelf solutions. This classification drives investment decisions — not everything deserves the same engineering effort.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "In the Customer-Supplier context mapping pattern, what is the relationship between the upstream and downstream contexts?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Both teams have equal power and share a common codebase",
        "The upstream (supplier) team provides data/services and should accommodate the downstream (customer) team's needs",
        "The downstream team must conform to whatever the upstream provides with no negotiation",
        "Both teams communicate exclusively through a shared database"
      ]),
      correct_answer: "The upstream (supplier) team provides data/services and should accommodate the downstream (customer) team's needs",
      explanation: "In the Customer-Supplier pattern, the upstream context (supplier) provides data or services that the downstream context (customer) depends on, and the upstream team is willing to prioritize the downstream team's needs. For example, the Order Management team (upstream) provides order data that the Shipping team (downstream) needs. The key distinction from the Conformist pattern is that the upstream team actively supports the downstream team. In the Conformist pattern, the upstream team has no motivation to help — the downstream team must take what the upstream provides as-is, which is typical when integrating with external APIs you don't control (like Stripe or Twilio).",
      difficulty: "hard",
      order_index: 5,
    },
  ],

  'ddd-tactical-patterns': [
    {
      question_text: "What is the fundamental difference between an Entity and a Value Object in DDD?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Entities are stored in databases while Value Objects are only used in memory",
        "Entities are distinguished by their unique identity (compared by ID), while Value Objects have no identity and are defined entirely by their attribute values",
        "Entities are mutable and Value Objects are always strings or numbers",
        "Entities belong to the domain layer while Value Objects belong to the infrastructure layer"
      ]),
      correct_answer: "Entities are distinguished by their unique identity (compared by ID), while Value Objects have no identity and are defined entirely by their attribute values",
      explanation: "This is perhaps the most common DDD interview question. An Entity has a unique identity — two User entities with the same name and email but different IDs are different users. An Entity maintains its identity even when all its attributes change (a user who changes their name is still the same user). A Value Object has no identity — two Money(10, 'USD') instances are equal and interchangeable because they have the same attributes. Value Objects are immutable (operations return new instances) and self-validating (an invalid email address cannot be created as an Email value object). Common Value Objects include Money, Email, Address, DateRange, and PhoneNumber.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Why must all modifications to entities inside an Aggregate go through the Aggregate Root?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "For better database query performance and indexing",
        "Because JavaScript doesn't support modifying nested objects directly",
        "To enforce business invariants and maintain consistency — the root ensures all business rules are checked before any change is allowed",
        "To enable lazy loading of child entities from the database"
      ]),
      correct_answer: "To enforce business invariants and maintain consistency — the root ensures all business rules are checked before any change is allowed",
      explanation: "The Aggregate Root is the single entry point for all modifications. It enforces business invariants — rules that must always be true. For example, in an Order aggregate, the root ensures: (1) you can't add items to a placed order, (2) you can't place an empty order, (3) you can't exceed the maximum number of line items. If you could modify OrderLineItems directly (bypassing the Order root), you could violate these invariants. The root also collects domain events — when an order is placed, the root records an OrderPlaced event. Think of the Aggregate Root as a gatekeeper that validates every change before allowing it.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "According to Vaughn Vernon's Aggregate design rules, how should one Aggregate reference another?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "By holding a direct object reference so the related aggregate can be accessed immediately",
        "By storing the other aggregate's identity (ID) only — never hold direct object references to other aggregates",
        "Through a shared database table that both aggregates read from",
        "By inheriting from a common base class that provides cross-aggregate access"
      ]),
      correct_answer: "By storing the other aggregate's identity (ID) only — never hold direct object references to other aggregates",
      explanation: "Vaughn Vernon's four rules for effective aggregates include: (1) Protect invariants inside aggregate boundaries, (2) Design small aggregates, (3) Reference other aggregates by identity only, (4) Update other aggregates eventually via Domain Events. Referencing by ID (not by object reference) means Order stores customerId (a string or UUID), not a Customer object. This prevents loading the entire object graph when you only need the Order. It also enforces the rule that each aggregate is a separate consistency boundary — you can't accidentally modify a Customer object while working with an Order. When you need the actual Customer, load it separately through its own Repository.",
      difficulty: "hard",
      order_index: 3,
    },
    {
      question_text: "What is the key difference between a Domain Service and an Application Service in DDD?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Domain Services are synchronous and Application Services are asynchronous",
        "Domain Services contain business logic that doesn't fit in entities; Application Services only orchestrate use cases without any business logic",
        "Domain Services are stateful and Application Services are stateless",
        "Domain Services interact with databases while Application Services handle HTTP requests"
      ]),
      correct_answer: "Domain Services contain business logic that doesn't fit in entities; Application Services only orchestrate use cases without any business logic",
      explanation: "A Domain Service lives in the domain layer and contains business logic that doesn't naturally belong to any single Entity or Value Object. Example: PricingService.calculateFinalPrice() needs data from both Order and Customer and applies complex pricing rules — it doesn't fit in either entity. A Domain Service is stateless, named using Ubiquitous Language, and has zero infrastructure dependencies. An Application Service lives in the application layer and orchestrates use cases: it loads aggregates from repositories, calls domain methods, saves changes, publishes events, and manages transactions. It contains NO business logic — no if-statements about pricing or eligibility. If a business rule appears in an application service, it belongs in a domain service or entity instead.",
      difficulty: "hard",
      order_index: 4,
    },
    {
      question_text: "Which of the following is a correct rule about Repositories in DDD?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "There should be one Repository per Entity in the system, including child Entities inside Aggregates",
        "Repositories should return raw database rows or DTOs for maximum flexibility",
        "There should be one Repository per Aggregate Root — it saves and loads the entire Aggregate, returning fully reconstituted domain objects",
        "Repositories should be defined and implemented in the domain layer alongside the Entities they serve"
      ]),
      correct_answer: "There should be one Repository per Aggregate Root — it saves and loads the entire Aggregate, returning fully reconstituted domain objects",
      explanation: "Repositories follow strict rules in DDD: (1) One repository per Aggregate Root — never for child Entities inside an aggregate. You have OrderRepository but never OrderLineItemRepository because line items are part of the Order aggregate. (2) Repositories return fully reconstituted Aggregates — rich domain objects with Value Objects and behavior, not raw database rows. (3) The repository interface is defined in the domain layer (it defines WHAT persistence is needed), but the implementation lives in the infrastructure layer (it defines HOW using PostgreSQL, MongoDB, etc.). (4) Repositories handle the entire aggregate — saving an Order automatically saves its OrderLineItems as a unit.",
      difficulty: "medium",
      order_index: 5,
    },
    {
      question_text: "Why are Value Objects designed to be immutable in DDD?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Because JavaScript const prevents reassignment, which makes all objects immutable",
        "Because immutability ensures thread safety, eliminates aliasing bugs, enables safe sharing, and guarantees that equality checks remain valid throughout the object's lifetime",
        "Because immutable objects use less memory than mutable objects",
        "Because database columns cannot be updated once they are created"
      ]),
      correct_answer: "Because immutability ensures thread safety, eliminates aliasing bugs, enables safe sharing, and guarantees that equality checks remain valid throughout the object's lifetime",
      explanation: "Immutability in Value Objects provides several critical benefits: (1) Thread safety — immutable objects can be shared across threads/async operations without locks. (2) No aliasing bugs — if two entities hold the same Money object and one 'changes' it, the other isn't affected because changes create new instances. (3) Safe sharing — since Value Objects are defined by their values and can't change, two entities holding Money(10, 'USD') can share the exact same instance. (4) Reliable equality — if a Value Object could mutate after being used as a Map key or compared, you'd get subtle bugs. In JavaScript, immutability is enforced with Object.freeze() and private fields (#), with all operations returning new instances (e.g., money.add(other) returns a new Money).",
      difficulty: "medium",
      order_index: 6,
    },
    {
      question_text: "What is the purpose of the Specification pattern in DDD?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "To define the technical specifications (CPU, RAM) required to run the application",
        "To encapsulate business rules into named, testable, reusable, and composable objects that answer 'Does this object satisfy this rule?'",
        "To specify the interface contract that all repository implementations must follow",
        "To generate OpenAPI specification documents from domain models"
      ]),
      correct_answer: "To encapsulate business rules into named, testable, reusable, and composable objects that answer 'Does this object satisfy this rule?'",
      explanation: "The Specification pattern turns business rules into first-class objects. Instead of scattering if-statements across services and controllers (e.g., if(order.total >= 50 && order.items.every(i => i.inStock) && order.address.country === 'US')), you create OrderIsEligibleForFreeShipping as a named class with an isSatisfiedBy(order) method. Benefits: (1) Named — the class name documents the business rule. (2) Testable — each spec is its own unit test target. (3) Composable — combine specs with .and(), .or(), .not() to build complex rules from simple ones. (4) Reusable — use the same spec in validation, querying, and filtering. Example: 'const priorityShipping = highValue.and(inStock).and(domesticOnly)' reads like the business requirement.",
      difficulty: "hard",
      order_index: 7,
    },
    {
      question_text: "When should you use a Factory instead of a constructor for creating Aggregates?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Always — constructors should never be used for Aggregates in DDD",
        "When the creation process is complex (multiple child entities, business validation, conditional logic) or when there are multiple creation paths (new creation vs database reconstitution)",
        "Only when the Aggregate has more than 5 properties",
        "Only when using the Abstract Factory design pattern from the Gang of Four"
      ]),
      correct_answer: "When the creation process is complex (multiple child entities, business validation, conditional logic) or when there are multiple creation paths (new creation vs database reconstitution)",
      explanation: "Factories are used when Aggregate creation is non-trivial. Two key scenarios: (1) Complex creation — creating an Order from a Cart requires generating IDs, mapping cart items to order line items, validating prerequisites, and recording a domain event. Putting all this in the constructor would make it bloated and hard to test. (2) Multiple creation paths — creating a new Order (with validation and events) is fundamentally different from reconstituting one from database rows (skip validation, no events). A Factory provides named static methods like OrderFactory.createFromCart() and OrderFactory.reconstitute() that make each path explicit. The reconstitute path is particularly important — it bypasses business validation because the data was already validated when first created, and it doesn't emit events because loading from a database is not a business occurrence.",
      difficulty: "hard",
      order_index: 8,
    },
    {
      question_text: "What does it mean for Domain Events to enable 'eventual consistency' between Aggregates?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "All aggregates are updated simultaneously in a single database transaction",
        "When one Aggregate changes state, it publishes a Domain Event, and other Aggregates react asynchronously — there is a brief window where data may be inconsistent across Aggregates, but it will eventually converge",
        "Events are stored in an event log and replayed to rebuild the current state of an aggregate",
        "All aggregates share a single event handler that ensures immediate consistency"
      ]),
      correct_answer: "When one Aggregate changes state, it publishes a Domain Event, and other Aggregates react asynchronously — there is a brief window where data may be inconsistent across Aggregates, but it will eventually converge",
      explanation: "DDD rule: don't modify multiple Aggregates in the same transaction. Instead, when one Aggregate changes (e.g., Order is placed), it publishes a Domain Event (OrderPlaced). Other Aggregates react asynchronously — the Inventory aggregate reserves stock, the Notification aggregate sends an email. During the window between the Order being placed and inventory being reserved, the system is temporarily inconsistent. This is 'eventual consistency' — the system will converge to a consistent state, but not instantly. Implications for developers: (1) UIs must handle 'processing' states, (2) Events must be idempotent (safe to process more than once), (3) Compensating actions are needed if a downstream step fails (e.g., cancel the order if payment fails). This trade-off buys better scalability, autonomy, and fault isolation.",
      difficulty: "hard",
      order_index: 9,
    },
    {
      question_text: "In a DDD project structure, which layer should have ZERO external dependencies — no imports from application or infrastructure layers?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The Infrastructure layer, because it should be self-contained",
        "The Application layer, because it only orchestrates domain objects",
        "The Domain layer — it contains pure business logic with no framework, database, or HTTP dependencies",
        "The Presentation layer, because UI components should be independent"
      ]),
      correct_answer: "The Domain layer — it contains pure business logic with no framework, database, or HTTP dependencies",
      explanation: "The dependency rule in DDD states: Infrastructure → Application → Domain. The Domain layer is the innermost layer and depends on nothing external. It contains pure JavaScript/TypeScript classes: Entities, Value Objects, Aggregates, Domain Events, Repository interfaces (abstract classes), Domain Services, and Specifications. It has zero imports from Express, Sequelize, pg, RabbitMQ, or any infrastructure library. The Application layer imports from Domain and depends on abstractions (repository interfaces) for infrastructure. The Infrastructure layer implements those interfaces (PostgresOrderRepository implements OrderRepository) and connects to databases, message brokers, and HTTP. This means you can test the entire domain layer without mocking any infrastructure — just pure unit tests.",
      difficulty: "medium",
      order_index: 10,
    },
  ],
};
