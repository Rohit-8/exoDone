// ============================================================================
// Clean Architecture — Quiz Questions
// ============================================================================

const quiz = {
  'layers-dependency-rule': [
    {
      question_text: "What is the Dependency Rule in Clean Architecture?",
      question_type: "multiple_choice",
      options: ["Outer layers must not depend on inner layers","Inner layers must not depend on outer layers","All layers depend on the database","Dependencies should be circular"],
      correct_answer: "Inner layers must not depend on outer layers",
      explanation: "The Dependency Rule says dependencies point inward. Entities know nothing about the database or web framework. This keeps core logic portable and testable.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Where should infrastructure implementations (e.g., PostgresUserRepository) live?",
      question_type: "multiple_choice",
      options: ["In the Domain layer","In the Use Case layer","In the Infrastructure / Frameworks layer","In the Entity layer"],
      correct_answer: "In the Infrastructure / Frameworks layer",
      explanation: "Concrete implementations of database, payment gateways, and external services belong in the outermost Infrastructure layer. Inner layers define interfaces (ports).",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'ports-adapters-hexagonal': [
    {
      question_text: "What is a \"port\" in Hexagonal Architecture?",
      question_type: "multiple_choice",
      options: ["A network port number","An abstract interface the application defines","A database connection string","A REST API endpoint"],
      correct_answer: "An abstract interface the application defines",
      explanation: "Ports are contracts (interfaces) that define how the application interacts with the outside world. Adapters provide concrete implementations.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
