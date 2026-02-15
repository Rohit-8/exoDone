// ============================================================================
// Testing & TDD — Quiz Questions
// ============================================================================

const quiz = {
  'unit-testing-jest': [
    {
      question_text: "What is the TDD cycle?",
      question_type: "multiple_choice",
      options: ["Code → Deploy → Test","Red → Green → Refactor","Plan → Build → Ship","Debug → Fix → Commit"],
      correct_answer: "Red → Green → Refactor",
      explanation: "TDD: write a failing test (Red), make it pass with minimal code (Green), then improve the code while keeping tests passing (Refactor).",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is mocking used for in unit testing?",
      question_type: "multiple_choice",
      options: ["Speeding up test execution","Isolating the unit under test from its dependencies","Generating test data randomly","Testing the UI directly"],
      correct_answer: "Isolating the unit under test from its dependencies",
      explanation: "Mocks replace real dependencies (databases, APIs) with controlled substitutes, so you test only the logic of the unit itself.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;
