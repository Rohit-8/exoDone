// ============================================================================
// Clean Architecture — Quiz Questions
// ============================================================================

export default {
  'clean-architecture-principles': [
    {
      question_text: "What is the Dependency Rule in Clean Architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Outer layers must not depend on inner layers",
        "Source code dependencies must only point inward — inner layers never reference outer layers",
        "All layers should depend on a shared database module",
        "Dependencies should flow outward from entities to frameworks"
      ]),
      correct_answer: "Source code dependencies must only point inward — inner layers never reference outer layers",
      explanation: "The Dependency Rule is the foundational principle of Clean Architecture. It states that source code dependencies must only point inward. Entities (innermost) know nothing about use cases, controllers, or databases. Use cases know about entities but not about controllers or frameworks. This ensures that the core business logic is completely isolated from external concerns and can be tested, reused, and maintained independently.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Which layer in Clean Architecture contains the enterprise-wide business rules and is the LEAST likely to change?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Use Cases (Application Business Rules)",
        "Interface Adapters (Controllers, Presenters)",
        "Entities (Enterprise Business Rules)",
        "Frameworks & Drivers (Database, Web Framework)"
      ]),
      correct_answer: "Entities (Enterprise Business Rules)",
      explanation: "Entities are the innermost layer and contain enterprise-wide business rules — the most general and high-level rules that would exist even if the software system didn't. They are the least likely to change when something external changes (new UI, different database, updated framework). Entities are pure business logic with no framework dependencies. For example, the rule 'an order cannot have negative quantity' is a business rule that doesn't change regardless of whether you use Express or Fastify.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "In Clean Architecture, where should a concrete PostgreSQL database implementation (e.g., PostgresUserRepository) be placed?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "In the Domain/Entities layer alongside business rules",
        "In the Use Cases layer since use cases need data",
        "In the Interface Adapters layer as a gateway implementation",
        "In the Frameworks & Drivers / Infrastructure layer as a driven adapter"
      ]),
      correct_answer: "In the Frameworks & Drivers / Infrastructure layer as a driven adapter",
      explanation: "Concrete database implementations belong in the outermost Infrastructure (Frameworks & Drivers) layer. The Use Cases layer defines an abstract port (e.g., UserRepository interface with findById, save methods). The Infrastructure layer provides the concrete adapter (PostgresUserRepository) that implements this port using PostgreSQL-specific code. This way, the use case depends on the abstraction (port), not the concrete database — following the Dependency Inversion Principle.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "What is a 'Port' in Clean Architecture / Hexagonal Architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A network port number used for server communication",
        "An abstract interface defined by the application layer that external adapters must implement",
        "A REST API endpoint exposed by the web server",
        "A database connection string configuration"
      ]),
      correct_answer: "An abstract interface defined by the application layer that external adapters must implement",
      explanation: "A Port is an abstract interface (contract) defined in the application layer that declares what the application needs from the outside world — without specifying how it's fulfilled. For example, a UserRepository port defines methods like findById(id) and save(user). Adapters (PostgresUserRepository, MongoUserRepository, FakeUserRepository) provide concrete implementations. This decoupling allows the application core to be tested and deployed with any adapter that fulfills the port contract.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "Which SOLID principle is MOST directly embodied by the Dependency Rule in Clean Architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Single Responsibility Principle (SRP)",
        "Open/Closed Principle (OCP)",
        "Liskov Substitution Principle (LSP)",
        "Dependency Inversion Principle (DIP)"
      ]),
      correct_answer: "Dependency Inversion Principle (DIP)",
      explanation: "The Dependency Inversion Principle states: 'High-level modules should not depend on low-level modules. Both should depend on abstractions.' This is exactly what the Dependency Rule enforces architecturally: Use Cases (high-level) don't depend on PostgreSQL or Express (low-level). Instead, both depend on Ports (abstractions). The Use Case defines a UserRepository port, and the Infrastructure layer provides a PostgresUserRepository that implements it. The dependency points inward (toward the abstraction), not outward (toward the implementation).",
      difficulty: "hard",
      order_index: 5,
    },
    {
      question_text: "What is the difference between a 'driving adapter' and a 'driven adapter' in Hexagonal/Clean Architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Driving adapters are faster in performance; driven adapters are slower",
        "Driving adapters call INTO the application (controllers, CLI); driven adapters are CALLED BY the application (repositories, gateways)",
        "Driving adapters handle database writes; driven adapters handle database reads",
        "Driving adapters are for production; driven adapters are for testing"
      ]),
      correct_answer: "Driving adapters call INTO the application (controllers, CLI); driven adapters are CALLED BY the application (repositories, gateways)",
      explanation: "Driving (primary) adapters initiate interaction with the application core. They include HTTP controllers, CLI handlers, event listeners, and GraphQL resolvers — anything that triggers a use case. Driven (secondary) adapters are called BY the application through ports. They include database repositories, payment gateways, email services, and cache providers. The distinction matters because driving adapters depend on use case interfaces, while driven adapters implement port interfaces defined by the application.",
      difficulty: "hard",
      order_index: 6,
    },
    {
      question_text: "A developer puts SQL queries directly inside a Use Case class. Which Clean Architecture principle does this violate?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Only the Single Responsibility Principle",
        "Only the Dependency Rule",
        "Both the Dependency Rule and the Dependency Inversion Principle",
        "No principles are violated — Use Cases can access the database directly"
      ]),
      correct_answer: "Both the Dependency Rule and the Dependency Inversion Principle",
      explanation: "Placing SQL queries in a Use Case violates two principles: (1) The Dependency Rule — the Use Case (inner layer) now depends on a database technology (outer layer), when dependencies should only point inward. (2) The Dependency Inversion Principle — a high-level module (Use Case) directly depends on a low-level module (SQL/database) instead of depending on an abstraction (Repository port). The correct approach is for the Use Case to call this.orderRepository.save(order), where orderRepository is a port injected via the constructor.",
      difficulty: "hard",
      order_index: 7,
    },
  ],

  'implementing-clean-architecture-nodejs': [
    {
      question_text: "What is the 'Composition Root' in a Clean Architecture Node.js application?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "The root index.js file that starts the Express server",
        "The single location where all concrete implementations are instantiated and injected into their consumers",
        "The package.json file that lists all project dependencies",
        "The domain/entities folder where all base classes are defined"
      ]),
      correct_answer: "The single location where all concrete implementations are instantiated and injected into their consumers",
      explanation: "The Composition Root (typically di-container.js or similar) is the ONLY place in the application that knows about all concrete implementations. It instantiates infrastructure (database pools, Redis clients), creates use cases by injecting port implementations, and creates controllers by injecting use cases. Everything else in the application depends on abstractions. This means swapping PostgreSQL for MongoDB requires changing only the Composition Root — you create MongoUserRepository instead of PostgresUserRepository and inject it in the same place.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "In a Node.js Clean Architecture project, which folder should have ZERO imports from any other application folder?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "infrastructure/ — it should be self-contained",
        "adapters/controllers/ — controllers shouldn't import anything",
        "domain/ — entities and value objects must be completely independent",
        "application/use-cases/ — use cases should not import from domain"
      ]),
      correct_answer: "domain/ — entities and value objects must be completely independent",
      explanation: "The domain/ folder (entities, value objects, domain errors) is the innermost layer and must have ZERO imports from application/, adapters/, or infrastructure/. It should only import from within itself (e.g., an entity importing a value object or a domain error class). This enforces the Dependency Rule at the filesystem level. If your User entity imports from Express, Sequelize, or even your own use case layer, you've violated Clean Architecture. Domain entities are pure JavaScript classes with business logic and self-validation.",
      difficulty: "medium",
      order_index: 2,
    },
    {
      question_text: "What is the primary purpose of a Mapper in Clean Architecture (e.g., OrderMapper)?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "To map URL routes to controller methods",
        "To convert data between different layer representations (domain ↔ persistence ↔ API response)",
        "To map environment variables to configuration objects",
        "To create mappings between microservices"
      ]),
      correct_answer: "To convert data between different layer representations (domain ↔ persistence ↔ API response)",
      explanation: "Mappers handle the 'impedance mismatch' between layers. The database uses snake_case columns (customer_id, created_at) and stores items as JSON strings. The domain uses camelCase properties (customerId, createdAt) and proper objects. The API response may need different fields, formatted values, or computed properties. A Mapper centralizes these transformations: toPersistence() converts entity → DB row, toDomain() converts DB row → entity, and toResponse() converts entity → API format. This ensures each layer works with its own data shape without exposing internals.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "How should domain errors (e.g., DomainError, ValidationError) be translated into HTTP responses in Clean Architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Entities should throw errors with HTTP status codes directly",
        "Use Cases should catch domain errors and return HTTP response objects",
        "A centralized error-handling middleware in the infrastructure layer maps error types to HTTP status codes",
        "Controllers should have try-catch blocks that map each error type individually"
      ]),
      correct_answer: "A centralized error-handling middleware in the infrastructure layer maps error types to HTTP status codes",
      explanation: "Inner layers (domain, application) throw domain-specific errors without knowing about HTTP. A centralized error-handling middleware at the outermost boundary (Express middleware) maps error types to HTTP status codes: ValidationError → 400, NotFoundError → 404, AuthorizationError → 403, DomainError → 400, unknown → 500. Controllers simply call next(error) to delegate to this middleware. This approach keeps inner layers HTTP-agnostic and provides a single place to update error-to-HTTP mapping.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "When testing a Use Case in Clean Architecture, what should you use instead of the real PostgreSQL database?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A real test database with the same schema as production",
        "Jest mock functions that simulate database behavior",
        "Fake adapter classes (in-memory implementations) that implement the same port interface",
        "SQLite as a lighter alternative to PostgreSQL"
      ]),
      correct_answer: "Fake adapter classes (in-memory implementations) that implement the same port interface",
      explanation: "Use Case tests should use fake adapters — simple in-memory implementations of the port interfaces. For example, a FakeUserRepository stores users in a Map instead of PostgreSQL. Fakes are preferred over mocking libraries because: (1) They implement the real interface, catching contract mismatches. (2) They're reusable across many tests. (3) They behave consistently without complex mock setup. (4) They run in milliseconds with no I/O. Real database tests belong in integration test suites for testing adapters, not use cases.",
      difficulty: "hard",
      order_index: 5,
    },
    {
      question_text: "What is the correct dependency direction in a Clean Architecture Node.js project?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "domain → application → adapters → infrastructure",
        "infrastructure → adapters → application → domain (inward)",
        "All layers depend on the infrastructure layer",
        "domain ← application ← adapters ← infrastructure (each layer depends on the next inner layer)"
      ]),
      correct_answer: "domain ← application ← adapters ← infrastructure (each layer depends on the next inner layer)",
      explanation: "Dependencies point INWARD: infrastructure/ imports from adapters/ and application/. adapters/ imports from application/. application/ imports from domain/. domain/ imports from nothing (except itself). This means: Express routes import controllers. Controllers import use cases. Use cases import entities. Entities import nothing external. The Composition Root (in infrastructure/) is the only place that imports across all layers to wire everything together.",
      difficulty: "hard",
      order_index: 6,
    },
    {
      question_text: "A developer wants to add GraphQL support to an existing Clean Architecture REST API. What is the minimum set of changes required?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Rewrite entities, use cases, and add GraphQL resolvers",
        "Create new GraphQL resolvers (adapters) that call the existing use cases — no changes to domain or application layers",
        "Modify use cases to return both REST and GraphQL formats",
        "Create a translation layer between REST controllers and GraphQL resolvers"
      ]),
      correct_answer: "Create new GraphQL resolvers (adapters) that call the existing use cases — no changes to domain or application layers",
      explanation: "This is the key benefit of Clean Architecture's separation. GraphQL resolvers are just another type of 'driving adapter' — like HTTP controllers, they translate external requests into use case calls. You create GraphQL resolvers that call the same CreateOrderUseCase, GetUserByIdUseCase, etc. The domain entities and use cases remain completely unchanged. You may also add GraphQL-specific presenters to format the output. The Composition Root simply wires the resolvers with the same use case instances that the REST controllers use.",
      difficulty: "hard",
      order_index: 7,
    },
    {
      question_text: "Why is constructor injection preferred over a Service Locator pattern in Clean Architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Constructor injection is faster at runtime than Service Locator",
        "Constructor injection makes dependencies explicit, visible in the constructor signature, and caught at instantiation time if missing",
        "Service Locator cannot work with JavaScript classes",
        "Constructor injection requires fewer lines of code"
      ]),
      correct_answer: "Constructor injection makes dependencies explicit, visible in the constructor signature, and caught at instantiation time if missing",
      explanation: "Constructor injection makes every dependency visible in the class constructor: constructor({ userRepository, passwordHasher, emailService }). Benefits include: (1) Dependencies are explicit — you can see exactly what a class needs by reading its constructor. (2) Missing dependencies are caught immediately at object creation time, not at runtime when a method is called. (3) Classes are easy to test — just pass fakes in the constructor. (4) No hidden coupling to a global service container. The Service Locator pattern hides dependencies inside method bodies (const repo = ServiceLocator.get('userRepo')), making code harder to understand, test, and refactor.",
      difficulty: "hard",
      order_index: 8,
    },
    {
      question_text: "What is a Value Object in Clean Architecture, and how does it differ from an Entity?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Value Objects have database IDs; Entities do not",
        "Value Objects are mutable; Entities are immutable",
        "Value Objects are immutable and defined by their attributes (no identity); Entities have a unique identity and can change over time",
        "Value Objects are used in the infrastructure layer; Entities are used in the domain layer"
      ]),
      correct_answer: "Value Objects are immutable and defined by their attributes (no identity); Entities have a unique identity and can change over time",
      explanation: "Entities have a unique identity (ID) and their state can change over time — a User entity keeps the same ID even when their name or email changes. Value Objects have NO identity — they are defined entirely by their attributes and are immutable. Two Money(10, 'USD') instances are equal because they have the same values, regardless of being different objects. Examples: Money, Email, Address are Value Objects. User, Order, Product are Entities. Value Objects use Object.freeze() and return new instances from operations (add, multiply) instead of mutating themselves.",
      difficulty: "medium",
      order_index: 9,
    },
    {
      question_text: "When should you NOT use Clean Architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "When building enterprise applications with complex business rules",
        "When building a simple CRUD application or prototype where the overhead of layered architecture outweighs the benefits",
        "When your application needs to support multiple interfaces (REST, GraphQL, CLI)",
        "When working with a team larger than 3-4 developers"
      ]),
      correct_answer: "When building a simple CRUD application or prototype where the overhead of layered architecture outweighs the benefits",
      explanation: "Clean Architecture adds structural complexity: multiple layers, ports, adapters, DTOs, mappers, composition roots. For a simple CRUD app with minimal business logic (e.g., a todo list, a blog with basic CRUD operations), this overhead isn't justified — a straightforward MVC pattern works fine. Similarly, prototypes and MVPs prioritize speed of delivery over architectural purity. The pragmatic approach is to start simple and evolve toward Clean Architecture as complexity grows — specifically when business logic starts leaking into controllers, tests require real databases, or framework changes cascade across the codebase.",
      difficulty: "medium",
      order_index: 10,
    },
  ],
};
