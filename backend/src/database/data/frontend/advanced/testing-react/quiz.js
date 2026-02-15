// ============================================================================
// Testing React Apps — Quiz Questions
// ============================================================================

const quiz = {
  'rtl-jest-fundamentals': [
    {
      question_text: "Which query approach does React Testing Library recommend MOST?",
      question_type: "multiple_choice",
      options: ["getByTestId","getByClassName","getByRole","querySelector"],
      correct_answer: "getByRole",
      explanation: "getByRole queries elements by their ARIA role, which mirrors how users and assistive technologies interact with the page. It is the most inclusive query.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What is the difference between findBy* and getBy* queries?",
      question_type: "multiple_choice",
      options: ["findBy is faster","findBy waits for the element to appear (async)","getBy waits for the element to appear (async)","There is no difference"],
      correct_answer: "findBy waits for the element to appear (async)",
      explanation: "findBy* queries return a promise that resolves when the element appears in the DOM. getBy* queries immediately throw if the element is not present.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;
