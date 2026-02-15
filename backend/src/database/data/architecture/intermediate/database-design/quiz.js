// ============================================================================
// Database Design & Modeling — Quiz Questions
// ============================================================================

const quiz = {
  'normalization-schema-design': [
    {
      question_text: "What problem does normalization solve?",
      question_type: "multiple_choice",
      options: ["Slow query performance","Data redundancy and update anomalies","Missing indexes","Connection pooling"],
      correct_answer: "Data redundancy and update anomalies",
      explanation: "Normalization eliminates redundant data so that updates, insertions, and deletions don't cause inconsistencies.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "When is denormalization appropriate?",
      question_type: "multiple_choice",
      options: ["Always — normalized data is too slow","When read performance is critical and data rarely changes","Never — it always causes problems","Only with NoSQL databases"],
      correct_answer: "When read performance is critical and data rarely changes",
      explanation: "Denormalization trades write complexity for read speed. It's appropriate when reads vastly outnumber writes and the data doesn't change frequently.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'indexing-query-optimization': [
    {
      question_text: "What does EXPLAIN ANALYZE do in PostgreSQL?",
      question_type: "multiple_choice",
      options: ["Adds indexes automatically","Shows the query execution plan with actual timing","Optimizes the query automatically","Deletes unused indexes"],
      correct_answer: "Shows the query execution plan with actual timing",
      explanation: "EXPLAIN ANALYZE executes the query and shows the actual execution plan, including time spent at each step. This helps identify bottlenecks and missing indexes.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
