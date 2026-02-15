// ============================================================================
// TypeScript with React — Quiz Questions
// ============================================================================

const quiz = {
  'typing-components-hooks': [
    {
      question_text: "What type should you use for the \"children\" prop in React + TypeScript?",
      question_type: "multiple_choice",
      options: ["React.Component","React.ReactNode","JSX.Element","string"],
      correct_answer: "React.ReactNode",
      explanation: "React.ReactNode covers strings, numbers, elements, arrays, fragments, and null — the most flexible type for children.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
