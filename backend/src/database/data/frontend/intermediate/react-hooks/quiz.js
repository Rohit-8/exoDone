// ============================================================================
// React Hooks Deep Dive — Quiz Questions
// ============================================================================

const quiz = {
  'usestate-useeffect': [
    {
      question_text: "What happens when you pass an empty array [] to useEffect?",
      question_type: "multiple_choice",
      options: ["Effect runs on every render","Effect runs only on mount and cleanup runs on unmount","Effect never runs","Effect runs only when state changes"],
      correct_answer: "Effect runs only on mount and cleanup runs on unmount",
      explanation: "An empty dependency array means the effect has no reactive dependencies—it runs once after mount, and its cleanup runs on unmount.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "Why should you use functional updates with useState?",
      question_type: "multiple_choice",
      options: ["It is faster","It avoids stale state in closures","It is required by React","It prevents re-renders"],
      correct_answer: "It avoids stale state in closures",
      explanation: "Functional updates (prev => prev + 1) always receive the latest state value, avoiding bugs from stale closures.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'useref-usememo-usecallback': [
    {
      question_text: "Does changing a useRef value trigger a re-render?",
      question_type: "multiple_choice",
      options: ["Yes, always","Only if connected to state","No, useRef changes are silent","Only on mount"],
      correct_answer: "No, useRef changes are silent",
      explanation: "useRef returns a mutable object whose .current property can change without causing re-renders. It is a persistent container.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
  'usereducer-usecontext': [
    {
      question_text: "When should you prefer useReducer over useState?",
      question_type: "multiple_choice",
      options: ["Always","When state has complex logic or multiple sub-values","Never — useState is always better","Only for global state"],
      correct_answer: "When state has complex logic or multiple sub-values",
      explanation: "useReducer shines when state transitions are complex or when the next state depends on the previous state in non-trivial ways.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
