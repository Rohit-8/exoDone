// ============================================================================
// REST API Development — Quiz Questions
// ============================================================================

const quiz = {
  'rest-principles-express': [
    {
      question_text: "Which HTTP method should be used to create a new resource?",
      question_type: "multiple_choice",
      options: ["GET", "POST", "PUT", "PATCH"],
      correct_answer: "POST",
      explanation: "POST is used to create a new resource. The server typically generates an ID and returns the created resource with a 201 Created status. POST is NOT idempotent — calling it twice creates two resources.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What status code should a successful DELETE return?",
      question_type: "multiple_choice",
      options: ["200 OK", "201 Created", "204 No Content", "404 Not Found"],
      correct_answer: "204 No Content",
      explanation: "204 No Content indicates the resource was successfully deleted and there is no body to return. Alternatively, 200 OK can be used if a confirmation message is included in the body.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "What does 'idempotent' mean in the context of HTTP methods?",
      question_type: "multiple_choice",
      options: ["The request is encrypted", "Calling it multiple times produces the same result as calling it once", "The response is always empty", "The method requires authentication"],
      correct_answer: "Calling it multiple times produces the same result as calling it once",
      explanation: "An idempotent method produces the same server state whether called once or many times. GET, PUT, and DELETE are idempotent. POST is NOT — calling POST twice creates two resources. PATCH may or may not be idempotent depending on implementation.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "Which URI design follows REST best practices?",
      question_type: "multiple_choice",
      options: ["/api/getUsers", "/api/users", "/api/userList", "/api/fetch-all-users"],
      correct_answer: "/api/users",
      explanation: "REST URIs should use nouns (not verbs), be plural, lowercase, and represent resources. '/api/users' identifies the users collection. The HTTP method (GET, POST, etc.) indicates the action — not the URI.",
      difficulty: "easy",
      order_index: 4,
    },
    {
      question_text: "What is the difference between PUT and PATCH?",
      question_type: "multiple_choice",
      options: ["PUT is faster than PATCH", "PUT replaces the entire resource, PATCH updates only specific fields", "PATCH creates a resource, PUT updates it", "There is no difference"],
      correct_answer: "PUT replaces the entire resource, PATCH updates only specific fields",
      explanation: "PUT sends the complete representation of the resource — all fields are replaced. PATCH sends only the fields to be updated. For example, PATCH /users/1 { name: 'Alice' } only changes the name and leaves other fields unchanged.",
      difficulty: "medium",
      order_index: 5,
    },
  ],
  'middleware-validation-errors': [
    {
      question_text: "What makes an Express error-handling middleware different from regular middleware?",
      question_type: "multiple_choice",
      options: ["It uses app.error()", "It has 4 parameters (err, req, res, next)", "It must be the first middleware", "It returns a Promise"],
      correct_answer: "It has 4 parameters (err, req, res, next)",
      explanation: "Express identifies error-handling middleware by its 4-parameter signature: (err, req, res, next). It must be defined AFTER all routes and other middleware. When a route calls next(err), Express skips all regular middleware and jumps to the error handler.",
      difficulty: "medium",
      order_index: 1,
    },
    {
      question_text: "What does calling next() without any arguments do in middleware?",
      question_type: "multiple_choice",
      options: ["Sends a response to the client", "Passes control to the next middleware in the stack", "Ends the request immediately", "Throws an error"],
      correct_answer: "Passes control to the next middleware in the stack",
      explanation: "Calling next() without arguments passes control to the next middleware function. Calling next(err) with an error argument skips to the error handler. If neither next() nor res.send() is called, the request hangs indefinitely.",
      difficulty: "easy",
      order_index: 2,
    },
    {
      question_text: "Why should you validate input on the server even if the client validates it?",
      question_type: "multiple_choice",
      options: ["Client-side validation is always wrong", "Users can bypass client validation using dev tools, API clients, or scripts", "Server validation is faster", "It's required by HTTP specification"],
      correct_answer: "Users can bypass client validation using dev tools, API clients, or scripts",
      explanation: "Client-side validation improves UX but provides ZERO security. Anyone can send requests directly to your API (Postman, curl, scripts) bypassing all frontend checks. Server-side validation is the only reliable defense against invalid or malicious input.",
      difficulty: "medium",
      order_index: 3,
    },
    {
      question_text: "What is the purpose of the asyncHandler wrapper pattern?",
      question_type: "multiple_choice",
      options: ["Makes synchronous code run faster", "Automatically catches async errors and passes them to the error handler via next(err)", "Converts callbacks to promises", "Adds logging to async functions"],
      correct_answer: "Automatically catches async errors and passes them to the error handler via next(err)",
      explanation: "Without asyncHandler, every async route needs its own try/catch block, or unhandled promise rejections crash the server. The wrapper catches both sync and async errors and forwards them to Express's error handler via next(err).",
      difficulty: "medium",
      order_index: 4,
    },
    {
      question_text: "What HTTP status code indicates a rate limit has been exceeded?",
      question_type: "multiple_choice",
      options: ["400 Bad Request", "403 Forbidden", "429 Too Many Requests", "503 Service Unavailable"],
      correct_answer: "429 Too Many Requests",
      explanation: "429 Too Many Requests tells the client they've exceeded the rate limit. The response should include a Retry-After header indicating when the client can try again. This is used to protect APIs from abuse and DDoS attacks.",
      difficulty: "easy",
      order_index: 5,
    },
  ],
};

export default quiz;
