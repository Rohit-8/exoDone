// ============================================================================
// React Fundamentals — Quiz Questions
// ============================================================================

const quiz = {
  'intro-jsx': [
    {
      question_text: "What does JSX compile to?",
      question_type: "multiple_choice",
      options: ["HTML strings","React.createElement() calls","Document.createElement() calls","Template literals"],
      correct_answer: "React.createElement() calls",
      explanation: "JSX is syntactic sugar that Babel/SWC compiles to React.createElement() function calls.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "Which attribute name is correct in JSX?",
      question_type: "multiple_choice",
      options: ["class","className","cssClass","htmlClass"],
      correct_answer: "className",
      explanation: "In JSX, HTML attributes use camelCase. \"class\" is a reserved word in JavaScript, so React uses \"className\".",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "Why are keys important when rendering lists in React?",
      question_type: "multiple_choice",
      options: ["For CSS styling","To improve SEO","To help React track which items changed","Keys are optional and have no effect"],
      correct_answer: "To help React track which items changed",
      explanation: "Keys give React a stable identity for each element, enabling efficient re-renders by identifying additions, removals, and reorders.",
      difficulty: "medium",
      order_index: 3,
    },
  ],
  'components-props': [
    {
      question_text: "In React, data flows from:",
      question_type: "multiple_choice",
      options: ["Child to parent","Parent to child via props","Sibling to sibling directly","Components share global state automatically"],
      correct_answer: "Parent to child via props",
      explanation: "React enforces unidirectional data flow. Props pass data from parent components to child components.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is the \"children\" prop in React?",
      question_type: "multiple_choice",
      options: ["Child component instances","Content placed between opening and closing component tags","Array of sub-components","Props for nested routes"],
      correct_answer: "Content placed between opening and closing component tags",
      explanation: "The children prop contains any JSX elements placed between the opening and closing tags of a component.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
  'events-conditionals': [
    {
      question_text: "What is the correct way to handle a click event in React?",
      question_type: "multiple_choice",
      options: ["onclick={handleClick}","onClick={handleClick()}","onClick={handleClick}","on-click={handleClick}"],
      correct_answer: "onClick={handleClick}",
      explanation: "React uses camelCase events. Pass the function reference, not a function call (which would execute immediately).",
      difficulty: "easy",
      order_index: 1,
    },
  ],
};

export default quiz;
