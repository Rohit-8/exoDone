// ============================================================================
// Distributed Systems — Quiz Questions
// ============================================================================

const quiz = {
  'cap-theorem-consistency': [
    {
      question_text: "In the CAP theorem, what does Partition Tolerance mean?",
      question_type: "multiple_choice",
      options: ["The system can split data across partitions","The system continues operating despite network failures between nodes","The system can be divided into independent modules","The system supports database table partitioning"],
      correct_answer: "The system continues operating despite network failures between nodes",
      explanation: "Partition Tolerance means the system functions even when network communication between nodes is unreliable or lost.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What is eventual consistency?",
      question_type: "multiple_choice",
      options: ["All reads always return the latest write","Reads may return stale data but will eventually converge to the latest state","Data is never consistent","Consistency is guaranteed after a fixed timeout"],
      correct_answer: "Reads may return stale data but will eventually converge to the latest state",
      explanation: "Eventual consistency guarantees that, given enough time without new writes, all replicas will converge to the same value. It trades immediate consistency for availability.",
      difficulty: "hard",
      order_index: 2,
    },
  ],
  'distributed-transactions-saga': [
    {
      question_text: "What is the Saga pattern?",
      question_type: "multiple_choice",
      options: ["A single ACID transaction across databases","A sequence of local transactions with compensating actions for failures","A caching strategy for microservices","A load balancing algorithm"],
      correct_answer: "A sequence of local transactions with compensating actions for failures",
      explanation: "Sagas manage distributed transactions by executing local transactions in sequence. If a step fails, previous steps are undone via compensating actions.",
      difficulty: "hard",
      order_index: 1,
    },
  ],
};

export default quiz;
