// ============================================================================
// Design Patterns — Quiz Questions
// ============================================================================

const quiz = {
  'creational-patterns': [
    {
      question_text: "What problem does the Singleton pattern solve?",
      question_type: "multiple_choice",
      options: ["Creating objects from subclasses","Ensuring only one instance of a class exists","Building complex objects step by step","Decoupling an abstraction from its implementation"],
      correct_answer: "Ensuring only one instance of a class exists",
      explanation: "Singleton restricts instantiation to a single object, useful for shared resources like database connections or configuration.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "Which pattern is best for constructing complex objects with many optional fields?",
      question_type: "multiple_choice",
      options: ["Singleton","Factory Method","Builder","Prototype"],
      correct_answer: "Builder",
      explanation: "Builder constructs objects step-by-step, making it ideal when objects have many optional configuration parameters.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'structural-behavioral-patterns': [
    {
      question_text: "Which pattern defines a family of interchangeable algorithms?",
      question_type: "multiple_choice",
      options: ["Observer","Strategy","Adapter","Decorator"],
      correct_answer: "Strategy",
      explanation: "Strategy encapsulates algorithms behind a common interface, allowing the client to swap them at runtime.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What is the Observer pattern used for?",
      question_type: "multiple_choice",
      options: ["Converting interfaces","Adding behavior dynamically","Notifying dependents of state changes","Building objects step by step"],
      correct_answer: "Notifying dependents of state changes",
      explanation: "Observer (pub/sub) lets one object broadcast events to many listeners without tight coupling.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;
