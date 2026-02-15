// ============================================================================
// Domain-Driven Design — Quiz Questions
// ============================================================================

const quiz = {
  'aggregates-entities-value-objects': [
    {
      question_text: "What defines two Value Objects as equal?",
      question_type: "multiple_choice",
      options: ["Their object references","Their unique IDs","Their attribute values","Their creation timestamps"],
      correct_answer: "Their attribute values",
      explanation: "Value Objects have no identity — two Money(10, \"USD\") instances are equal because their data is the same, regardless of being different objects.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Why do all modifications go through the Aggregate Root?",
      question_type: "multiple_choice",
      options: ["For better performance","To enforce business invariants and maintain consistency","Because JavaScript requires it","To enable polymorphism"],
      correct_answer: "To enforce business invariants and maintain consistency",
      explanation: "The Aggregate Root is the single entry point for modifications, ensuring all business rules and invariants are checked before any change is allowed.",
      difficulty: "hard",
      order_index: 2,
    },
  ],
};

export default quiz;
