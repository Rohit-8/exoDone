// ============================================================================
// Security Architecture — Quiz Questions
// ============================================================================

const quiz = {
  'owasp-top-10-secure-coding': [
    {
      question_text: "What is the most effective way to prevent SQL injection?",
      question_type: "multiple_choice",
      options: ["Escaping special characters in strings","Using parameterized queries / prepared statements","Validating input length","Encrypting the database"],
      correct_answer: "Using parameterized queries / prepared statements",
      explanation: "Parameterized queries ($1, $2) separate SQL code from data. The database treats parameters as data — never as executable SQL — eliminating injection entirely.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What does \"Defense in Depth\" mean?",
      question_type: "multiple_choice",
      options: ["Using the strongest possible single security measure","Applying multiple overlapping layers of security controls","Encrypting everything twice","Hiding server implementation details"],
      correct_answer: "Applying multiple overlapping layers of security controls",
      explanation: "Defense in Depth means no single security measure is sufficient. Multiple layers (network, application, data, monitoring) ensure that if one layer fails, others still protect the system.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;
