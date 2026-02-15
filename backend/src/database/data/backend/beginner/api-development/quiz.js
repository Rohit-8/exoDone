// ============================================================================
// REST API Development — Quiz Questions
// ============================================================================

const quiz = {
  'rest-principles-express': [
    {
      question_text: "Which HTTP method should be used to create a new resource?",
      question_type: "multiple_choice",
      options: ["GET","POST","PUT","PATCH"],
      correct_answer: "POST",
      explanation: "POST is used to create new resources. The server generates the resource ID and returns 201 Created.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What status code should a successful DELETE return?",
      question_type: "multiple_choice",
      options: ["200 OK","201 Created","204 No Content","404 Not Found"],
      correct_answer: "204 No Content",
      explanation: "204 No Content indicates the resource was successfully deleted. There is no body to return.",
      difficulty: "easy",
      order_index: 2,
    },
  ],
  'middleware-validation-errors': [
    {
      question_text: "What makes an Express error-handling middleware different from regular middleware?",
      question_type: "multiple_choice",
      options: ["It uses app.error()","It has 4 parameters (err, req, res, next)","It must be the first middleware","It returns a Promise"],
      correct_answer: "It has 4 parameters (err, req, res, next)",
      explanation: "Express identifies error-handling middleware by its 4-parameter signature. It must be defined after all routes and other middleware.",
      difficulty: "medium",
      order_index: 1,
    },
  ],
};

export default quiz;
