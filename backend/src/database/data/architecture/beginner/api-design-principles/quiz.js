// ============================================================================
// API Design Principles — Quiz Questions
// ============================================================================

const quiz = {
  'restful-api-design': [
    {
      question_text: "Which URL follows REST naming conventions?",
      question_type: "multiple_choice",
      options: ["GET /api/getUsers","GET /api/users","GET /api/fetchAllUsers","GET /api/user/list"],
      correct_answer: "GET /api/users",
      explanation: "REST uses plural nouns for resources and lets HTTP methods express the action. /api/users with GET means \"list all users\".",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What HTTP status should you return after successfully creating a resource?",
      question_type: "multiple_choice",
      options: ["200 OK","201 Created","204 No Content","202 Accepted"],
      correct_answer: "201 Created",
      explanation: "201 Created indicates a new resource was successfully created. Include a Location header pointing to the new resource.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
};

export default quiz;
