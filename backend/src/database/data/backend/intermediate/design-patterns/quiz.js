// ============================================================================
// Design Patterns — Quiz Questions
// ============================================================================

const quiz = {
  'creational-patterns': [
    {
      question_text: "What problem does the Singleton pattern solve?",
      question_type: "multiple_choice",
      options: [
        "Creating objects from subclasses",
        "Ensuring only one instance of a class exists and providing global access to it",
        "Building complex objects step by step",
        "Cloning existing objects to avoid expensive construction"
      ],
      correct_answer: "Ensuring only one instance of a class exists and providing global access to it",
      explanation: "Singleton restricts a class to a single instance and provides a global point of access. Common uses include database connection pools, loggers, and configuration managers. It uses a private constructor (or static #instance in JS) to prevent external instantiation.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "Which pattern is best suited for constructing an object that has many optional configuration parameters, like a SQL query with optional WHERE, ORDER BY, LIMIT, and JOIN clauses?",
      question_type: "multiple_choice",
      options: [
        "Singleton",
        "Factory Method",
        "Builder",
        "Prototype"
      ],
      correct_answer: "Builder",
      explanation: "The Builder pattern constructs complex objects step by step through a fluent API (e.g., .where().orderBy().limit().build()). It eliminates the 'telescoping constructor' anti-pattern where constructors have many optional parameters. Knex.js and Joi are real-world examples of the Builder pattern.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "What is the key difference between Factory Method and Abstract Factory?",
      question_type: "multiple_choice",
      options: [
        "Factory Method is for async creation; Abstract Factory is for sync creation",
        "Factory Method creates one product via a method; Abstract Factory creates families of related products via an object with multiple factory methods",
        "Factory Method requires inheritance; Abstract Factory uses composition only",
        "There is no practical difference — they are two names for the same pattern"
      ],
      correct_answer: "Factory Method creates one product via a method; Abstract Factory creates families of related products via an object with multiple factory methods",
      explanation: "Factory Method uses a single method to decide which class to instantiate (e.g., NotificationFactory.create('email')). Abstract Factory returns an object with multiple creation methods that produce families of compatible products (e.g., ThemeFactory.create('dark') returns { button(), input(), card() } — all from the same dark theme family).",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "In the Prototype pattern, what is the critical difference between shallow clone and deep clone?",
      question_type: "multiple_choice",
      options: [
        "Shallow clone copies the object and all nested objects; deep clone only copies top-level properties",
        "Shallow clone copies top-level properties but shares references to nested objects; deep clone creates fully independent copies at all levels",
        "Shallow clone is faster but only works with arrays; deep clone works with all types",
        "There is no difference in JavaScript because all clones are deep by default"
      ],
      correct_answer: "Shallow clone copies top-level properties but shares references to nested objects; deep clone creates fully independent copies at all levels",
      explanation: "With a shallow clone (Object.assign, spread operator), nested objects and arrays are still shared references — modifying them in the clone mutates the original. A deep clone (structuredClone(), recursive copying) creates fully independent copies. This distinction is crucial for avoiding unintended mutations in state management and configuration objects.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "A logging library must ensure only one instance writes to a log file, support lazy initialization, and allow resetting in tests. Which implementation correctly addresses all three requirements?",
      question_type: "multiple_choice",
      options: [
        "Use a global variable: let logger = new Logger(). Export it directly.",
        "Use Singleton with a static getInstance() for lazy init, private static #instance field, and a static resetInstance() method for test teardown",
        "Use Factory Method to create a new Logger each time it's needed",
        "Use Prototype to clone a template Logger for each module"
      ],
      correct_answer: "Use Singleton with a static getInstance() for lazy init, private static #instance field, and a static resetInstance() method for test teardown",
      explanation: "A proper Singleton uses: (1) a private static #instance field to store the single instance, (2) a static getInstance() method that creates the instance only on first call (lazy initialization), and (3) a static resetInstance() method to clear the instance between tests — solving the testability problem that Singletons are often criticized for. A plain global variable doesn't enforce single-instance creation and can be accidentally overwritten.",
      difficulty: "hard",
      order_index: 5,
    },
  ],
  'structural-behavioral-patterns': [
    {
      question_text: "Which pattern defines a family of interchangeable algorithms that can be swapped at runtime without changing the client code?",
      question_type: "multiple_choice",
      options: [
        "Observer",
        "Strategy",
        "Adapter",
        "Command"
      ],
      correct_answer: "Strategy",
      explanation: "The Strategy pattern encapsulates algorithms behind a common interface, allowing the client to select and swap them at runtime. For example, pricingStrategies = { regular: fn, member: fn, premium: fn } — the client calls the strategy without knowing which algorithm runs. This is a core implementation of Inversion of Control (IoC).",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is the Observer pattern primarily used for?",
      question_type: "multiple_choice",
      options: [
        "Converting one interface to another for compatibility",
        "Adding behavior to objects dynamically without subclassing",
        "Establishing a one-to-many dependency so that when one object changes state, all dependents are notified automatically",
        "Building complex objects with a fluent step-by-step API"
      ],
      correct_answer: "Establishing a one-to-many dependency so that when one object changes state, all dependents are notified automatically",
      explanation: "Observer (also known as Pub/Sub or Event Emitter) allows one subject to broadcast events to many listeners without tight coupling. Real-world examples include DOM event listeners, Node.js EventEmitter, Redux store subscriptions, and WebSocket message handlers. The key feature is the unsubscribe mechanism to prevent memory leaks.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "How does the Decorator pattern differ from using inheritance to extend behavior?",
      question_type: "multiple_choice",
      options: [
        "Decorators are compile-time only; inheritance works at runtime",
        "Decorators add behavior dynamically at runtime and can be composed in any order, while inheritance creates a fixed class hierarchy that can lead to a combinatorial explosion of subclasses",
        "Inheritance is more flexible than decorators because you can override methods",
        "There is no meaningful difference — both achieve the same result"
      ],
      correct_answer: "Decorators add behavior dynamically at runtime and can be composed in any order, while inheritance creates a fixed class hierarchy that can lead to a combinatorial explosion of subclasses",
      explanation: "With inheritance, adding N independent features requires up to 2^N subclasses (e.g., LoggingRetryAuthClient, LoggingRetryClient, LoggingAuthClient...). With Decorator, you just need N decorator functions composed in any order: withAuth(withRetry(withLogging(client))). Decorators follow the Open/Closed Principle — open for extension, closed for modification.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "In the Command pattern, what enables undo/redo functionality?",
      question_type: "multiple_choice",
      options: [
        "Each command object stores enough state to reverse its operation and implements both execute() and undo() methods, with a history stack tracking executed commands",
        "The Command pattern automatically saves database snapshots before each operation",
        "Undo is implemented by re-running all previous commands from the beginning",
        "The client code keeps a copy of the entire application state before each command"
      ],
      correct_answer: "Each command object stores enough state to reverse its operation and implements both execute() and undo() methods, with a history stack tracking executed commands",
      explanation: "Each Command encapsulates: (1) the action to perform (execute), (2) enough state to reverse it (e.g., previous values), and (3) the reverse action (undo). A CommandManager maintains a history stack of executed commands and a redo stack. Undo pops from history, calls undo(), and pushes to redo. Redo pops from redo, calls execute(), and pushes back to history. New commands clear the redo stack.",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "You're building an Express-like HTTP server. Requests must pass through authentication, rate limiting, input validation, and finally a route handler. Some middleware should stop the chain (e.g., return 401 if unauthorized). Which combination of patterns best models this architecture?",
      question_type: "multiple_choice",
      options: [
        "Strategy pattern for each middleware, with the router selecting which one to use",
        "Chain of Responsibility for the middleware pipeline (each handler calls next() or stops), with Decorator for cross-cutting concerns like logging and error handling wrapping each middleware",
        "Observer pattern where the request emits events and each middleware subscribes",
        "Facade pattern that hides all middleware behind a single processRequest() method"
      ],
      correct_answer: "Chain of Responsibility for the middleware pipeline (each handler calls next() or stops), with Decorator for cross-cutting concerns like logging and error handling wrapping each middleware",
      explanation: "Chain of Responsibility models the middleware pipeline: each handler receives (ctx, next), processes the request, and either calls next() to pass control forward or stops the chain (e.g., return 401). Decorator wraps each middleware with cross-cutting concerns: withErrorHandling(authMiddleware) catches errors, withTiming(handler) measures duration — without modifying the original middleware functions. This is exactly how Express, Koa, and similar frameworks work internally.",
      difficulty: "hard",
      order_index: 5,
    },
  ],
};

export default quiz;
