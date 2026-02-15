// ============================================================================
// Microservices Architecture — Quiz Questions
// ============================================================================

const quiz = {
  'microservices-fundamentals': [
    {
      question_text: "What does \"database per service\" mean in microservices?",
      question_type: "multiple_choice",
      options: ["All services share one database","Each service has its own database that only it can access","Services must use the same database type","Databases are optional in microservices"],
      correct_answer: "Each service has its own database that only it can access",
      explanation: "Database-per-service ensures loose coupling. Other services access data through APIs, not direct database queries. This allows each service to choose the best database for its needs.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "When should you start with a monolith instead of microservices?",
      question_type: "multiple_choice",
      options: ["Never — always start with microservices","When building a new product with unclear domain boundaries","Only for prototypes","When you have 100+ developers"],
      correct_answer: "When building a new product with unclear domain boundaries",
      explanation: "Start with a monolith when domain boundaries are unclear. It's easier to extract services from a well-structured monolith than to merge poorly defined microservices.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'service-communication-resilience': [
    {
      question_text: "Why is exponential backoff important for retries?",
      question_type: "multiple_choice",
      options: ["It makes the code more readable","It prevents overwhelming a recovering service with immediate retries","It is required by HTTP standards","It reduces memory usage"],
      correct_answer: "It prevents overwhelming a recovering service with immediate retries",
      explanation: "Exponential backoff (1s, 2s, 4s, 8s…) gives a failing service time to recover instead of hammering it with rapid retries, which would make the problem worse.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
