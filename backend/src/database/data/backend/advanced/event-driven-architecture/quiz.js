// ============================================================================
// Event-Driven Architecture — Quiz Questions
// ============================================================================

const quiz = {
  'event-driven-fundamentals': [
    {
      question_text: "Why must event consumers be idempotent?",
      question_type: "multiple_choice",
      options: ["To improve performance","Because events can be delivered more than once","To reduce memory usage","Because events are mutable"],
      correct_answer: "Because events can be delivered more than once",
      explanation: "In distributed systems, \"at-least-once\" delivery is common. Idempotent consumers produce the same result even if the same event is processed multiple times.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text: "What is the main advantage of event-driven architecture over synchronous calls?",
      question_type: "multiple_choice",
      options: ["Faster response times always","Loose coupling between services","Simpler debugging","Guaranteed order of execution"],
      correct_answer: "Loose coupling between services",
      explanation: "Event-driven architecture decouples producers from consumers. Services can evolve independently, and new consumers can be added without modifying the producer.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'event-sourcing-cqrs': [
    {
      question_text: "What is Event Sourcing?",
      question_type: "multiple_choice",
      options: ["Logging errors to a file","Storing state as a sequence of immutable events","Making APIs event-based","Using WebSockets for real-time data"],
      correct_answer: "Storing state as a sequence of immutable events",
      explanation: "Event Sourcing persists every state change as an immutable event. Current state is derived by replaying the event sequence.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What does CQRS separate?",
      question_type: "multiple_choice",
      options: ["Frontend from backend","Read operations from write operations","Database from application","Authentication from authorization"],
      correct_answer: "Read operations from write operations",
      explanation: "CQRS uses different models for reads (queries) and writes (commands), allowing each to be optimized independently.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;
