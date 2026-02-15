// ============================================================================
// React Performance — Quiz Questions
// ============================================================================

const quiz = {
  'memo-profiling': [
    {
      question_text: "What does React.memo do?",
      question_type: "multiple_choice",
      options: ["Caches API responses","Prevents re-renders when props are shallowly equal","Moves rendering to a Web Worker","Compresses component output"],
      correct_answer: "Prevents re-renders when props are shallowly equal",
      explanation: "React.memo is a higher-order component that memoizes the result. It only re-renders if props change (shallow equality by default).",
      difficulty: "medium",
      order_index: 1,
    },
  ],
  'code-splitting-lazy': [
    {
      question_text: "What does React.lazy() require?",
      question_type: "multiple_choice",
      options: ["A named export","A default export","A class component","A useEffect hook"],
      correct_answer: "A default export",
      explanation: "React.lazy() only supports default exports. For named exports, create an intermediate module that re-exports as default.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
