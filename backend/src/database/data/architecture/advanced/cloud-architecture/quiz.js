// ============================================================================
// Cloud Architecture — Quiz Questions
// ============================================================================

const quiz = {
  'cloud-native-patterns': [
    {
      question_text: "What does \"treat backing services as attached resources\" (12-Factor #4) mean?",
      question_type: "multiple_choice",
      options: ["Embed the database in the application","Access databases/caches via URLs from config — swappable without code changes","Always use microservices","Only use cloud-managed services"],
      correct_answer: "Access databases/caches via URLs from config — swappable without code changes",
      explanation: "Backing services (databases, message queues, caches) should be accessed via URLs stored in config. Swapping from a local PostgreSQL to a cloud-managed one should require only a config change.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What is the Strangler Fig pattern?",
      question_type: "multiple_choice",
      options: ["Build microservices from scratch","Gradually replace monolith features with new services","Remove unused code from a monolith","Deploy multiple versions simultaneously"],
      correct_answer: "Gradually replace monolith features with new services",
      explanation: "Like a strangler fig vine gradually envelops a tree, this pattern incrementally replaces monolith functionality with new services until the monolith can be decommissioned.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;
