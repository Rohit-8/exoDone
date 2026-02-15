// ============================================================================
// Scalability & Performance — Quiz Questions
// ============================================================================

const quiz = {
  'caching-strategies': [
    {
      question_text: "What does \"cache-aside\" (lazy loading) mean?",
      question_type: "multiple_choice",
      options: ["Write to cache before the database","Check cache first, populate on miss from the database","Cache never expires","Database handles caching automatically"],
      correct_answer: "Check cache first, populate on miss from the database",
      explanation: "Cache-aside checks the cache first. On a miss, it fetches from the database and populates the cache for future requests.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What is the hardest problem in caching?",
      question_type: "multiple_choice",
      options: ["Choosing a cache library","Cache invalidation","Setting up Redis","Serializing data"],
      correct_answer: "Cache invalidation",
      explanation: "\"There are only two hard things in Computer Science: cache invalidation and naming things.\" Knowing WHEN to invalidate or refresh cached data without serving stale data is genuinely difficult.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
  'load-balancing-horizontal-scaling': [
    {
      question_text: "Why must servers be stateless for horizontal scaling?",
      question_type: "multiple_choice",
      options: ["Because JavaScript doesn't support state","Because any server must handle any request — state should be in shared storage","Because stateless servers are faster","Because load balancers require it"],
      correct_answer: "Because any server must handle any request — state should be in shared storage",
      explanation: "With multiple servers behind a load balancer, the next request may go to a different server. Shared state (Redis, database) ensures all servers can handle any request.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
