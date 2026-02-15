// ============================================================================
// State Management — Quiz Questions
// ============================================================================

const quiz = {
  'context-redux-toolkit': [
    {
      question_text: "What does Redux Toolkit use internally to allow \"mutating\" syntax in reducers?",
      question_type: "multiple_choice",
      options: ["Lodash","Immutable.js","Immer","Deep clone"],
      correct_answer: "Immer",
      explanation: "Redux Toolkit integrates Immer, which intercepts mutations on a draft proxy and produces immutable updates behind the scenes.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
