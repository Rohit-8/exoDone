// ============================================================================
// Database Integration — Quiz Questions
// ============================================================================

const quiz = {
  'postgresql-node': [
    {
      question_text: "Why should you use parameterized queries ($1, $2) instead of string interpolation?",
      question_type: "multiple_choice",
      options: ["They are faster","They prevent SQL injection attacks","They enable caching","They are required by PostgreSQL"],
      correct_answer: "They prevent SQL injection attacks",
      explanation: "Parameterized queries ensure user input is treated as data, not SQL code, preventing injection attacks.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What does ROLLBACK do in a transaction?",
      question_type: "multiple_choice",
      options: ["Saves the transaction permanently","Undoes all changes since BEGIN","Retries the failed query","Creates a savepoint"],
      correct_answer: "Undoes all changes since BEGIN",
      explanation: "ROLLBACK reverts all changes made since the last BEGIN, maintaining database consistency when errors occur.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'migrations-schema': [
    {
      question_text: "What is the purpose of a database migration?",
      question_type: "multiple_choice",
      options: ["To back up the database","To version-control schema changes","To copy data between servers","To optimize query performance"],
      correct_answer: "To version-control schema changes",
      explanation: "Migrations track incremental schema changes in code, keeping all environments in sync and providing a history of database evolution.",
      difficulty: "easy",
      order_index: 1,
    },
  ],
};

export default quiz;
