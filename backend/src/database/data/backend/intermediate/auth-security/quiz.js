// ============================================================================
// Authentication & Security — Quiz Questions
// ============================================================================

const quiz = {
  'jwt-authentication': [
    {
      question_text: "Why should passwords be hashed with bcrypt rather than stored in plaintext?",
      question_type: "multiple_choice",
      options: ["Hashing makes login faster","If the database is compromised, hashed passwords cannot be used directly","Hashed passwords take less storage space","Browsers require hashed passwords"],
      correct_answer: "If the database is compromised, hashed passwords cannot be used directly",
      explanation: "Bcrypt creates a one-way hash with salt rounds, making it computationally expensive to crack even if the database is breached.",
      difficulty: "easy",
      order_index: 1,
    },
    {
      question_text: "What is the purpose of a refresh token?",
      question_type: "multiple_choice",
      options: ["To encrypt the access token","To obtain a new access token without re-entering credentials","To store user preferences","To speed up API requests"],
      correct_answer: "To obtain a new access token without re-entering credentials",
      explanation: "Refresh tokens are long-lived and can be used to get new short-lived access tokens, maintaining security without forcing users to re-login constantly.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
};

export default quiz;
