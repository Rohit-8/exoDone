// ============================================================================
// Forms & Validation — Quiz Questions
// ============================================================================

const quiz = {
  'react-hook-form': [
    {
      question_text: "What is the main performance advantage of React Hook Form?",
      question_type: "multiple_choice",
      options: ["It uses Web Workers","It uses uncontrolled inputs to minimize re-renders","It compiles forms to native code","It batches all validations to the end"],
      correct_answer: "It uses uncontrolled inputs to minimize re-renders",
      explanation: "React Hook Form leverages uncontrolled inputs (via refs) so the form state changes do not trigger re-renders of the entire form.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
