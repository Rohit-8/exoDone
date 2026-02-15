// ============================================================================
// Advanced React Patterns — Quiz Questions
// ============================================================================

const quiz = {
  'hoc-render-props': [
    {
      question_text: "What is a Higher-Order Component (HOC)?",
      question_type: "multiple_choice",
      options: ["A component at the top of the tree","A function that takes a component and returns a new enhanced component","A component that renders children","A class component with lifecycle methods"],
      correct_answer: "A function that takes a component and returns a new enhanced component",
      explanation: "A HOC is a pattern where a function takes a component, wraps it with additional logic, and returns a new component.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
  'compound-headless': [
    {
      question_text: "How do compound components typically share state?",
      question_type: "multiple_choice",
      options: ["Through global variables","Via React Context","Using refs","Through the DOM"],
      correct_answer: "Via React Context",
      explanation: "Compound components use React Context to share implicit state between the parent and its sub-components without prop drilling.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
