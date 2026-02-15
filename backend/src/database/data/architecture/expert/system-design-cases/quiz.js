// ============================================================================
// System Design Case Studies — Quiz Questions
// ============================================================================

const quiz = {
  'design-url-shortener': [
    {
      question_text: "Why use 302 (temporary) instead of 301 (permanent) redirect for a URL shortener with analytics?",
      question_type: "multiple_choice",
      options: ["302 is faster","Browsers cache 301 redirects, so subsequent clicks wouldn't hit the server for analytics tracking","301 is deprecated","302 supports HTTPS"],
      correct_answer: "Browsers cache 301 redirects, so subsequent clicks wouldn't hit the server for analytics tracking",
      explanation: "With 301, browsers remember the redirect and bypass the shortener entirely on future visits — making click tracking impossible. 302 ensures every click goes through the server.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text: "What is the most effective scaling strategy for a read-heavy URL shortener?",
      question_type: "multiple_choice",
      options: ["Bigger database server","In-memory caching (Redis) with high TTL","More write replicas","Reducing the short code length"],
      correct_answer: "In-memory caching (Redis) with high TTL",
      explanation: "With a 100:1 read:write ratio, caching popular URLs in Redis gives sub-millisecond lookups and can achieve 90%+ cache hit rates, dramatically reducing database load.",
      difficulty: "medium",
      order_index: 2,
    },
  ],
  'design-chat-system': [
    {
      question_text: "Why is Redis Pub/Sub needed in a multi-server WebSocket chat system?",
      question_type: "multiple_choice",
      options: ["To store messages permanently","To route messages to users connected to different server instances","To authenticate WebSocket connections","To compress message data"],
      correct_answer: "To route messages to users connected to different server instances",
      explanation: "With multiple WebSocket servers, the sender and recipient may be connected to different servers. Redis Pub/Sub broadcasts messages across all servers so the right one can deliver to the connected user.",
      difficulty: "hard",
      order_index: 1,
    },
    {
      question_text: "How does TTL-based presence detection work?",
      question_type: "multiple_choice",
      options: ["The server pings each client","Clients send periodic heartbeats; if the heartbeat stops, the Redis key expires automatically","WebSocket close events trigger it","The database tracks login timestamps"],
      correct_answer: "Clients send periodic heartbeats; if the heartbeat stops, the Redis key expires automatically",
      explanation: "Each heartbeat resets a Redis key's TTL. If the client disconnects (even ungracefully), heartbeats stop, the key expires, and the user is marked offline — no explicit disconnect handling needed.",
      difficulty: "hard",
      order_index: 2,
    },
  ],
};

export default quiz;
