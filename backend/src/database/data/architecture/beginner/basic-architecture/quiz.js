// ============================================================================
// Architecture Fundamentals — Quiz Questions
// ============================================================================

const quiz = {
  'what-is-software-architecture': [
    {
      question_text: "What makes a decision an \"architectural\" decision?",
      question_type: "multiple_choice",
      options: ["It involves choosing a programming language","It is expensive and difficult to change later","It requires a meeting to discuss","It is documented in a README"],
      correct_answer: "It is expensive and difficult to change later",
      explanation: "Architectural decisions define the system structure and are costly to reverse — choosing a monolith vs microservices, database technology, communication patterns, etc.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "In a layered architecture, which rule governs communication between layers?",
      question_type: "multiple_choice",
      options: ["Any layer can call any other layer","Each layer only communicates with the layer directly below it","Only the top and bottom layers communicate","Layers communicate via events only"],
      correct_answer: "Each layer only communicates with the layer directly below it",
      explanation: "The strict layering rule ensures each layer depends only on its immediate lower layer, reducing coupling and making layers independently replaceable.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
  'architecture-decision-records': [
    {
      question_text: "What is the primary purpose of an Architecture Decision Record?",
      question_type: "multiple_choice",
      options: ["To document API endpoints","To capture the context and reasoning behind architectural decisions","To track bugs and issues","To document code style guidelines"],
      correct_answer: "To capture the context and reasoning behind architectural decisions",
      explanation: "ADRs record WHY a decision was made, what alternatives were considered, and what the consequences are — so future team members understand the reasoning.",
      difficulty: "easy",
      order_index: 1,
    },
  ],
};

export default quiz;
