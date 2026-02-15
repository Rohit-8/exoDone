// ============================================================================
// Cloud Architecture — Code Examples
// ============================================================================

const examples = {
  'cloud-native-patterns': [
    {
      title: "Graceful Shutdown (Factor IX)",
      description: "Handle container termination gracefully — drain connections and finish in-flight requests.",
      language: "javascript",
      code: `import express from 'express';
import pool from './config/database.js';

const app = express();
let isShuttingDown = false;

// Middleware: reject new requests during shutdown
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({ error: 'Server is shutting down' });
    return;
  }
  next();
});

// ... routes ...

const server = app.listen(5000, () => {
  console.log('Server started on port 5000');
});

// Graceful shutdown handler
function shutdown(signal) {
  console.log(\`Received \${signal}. Graceful shutdown starting...\`);
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');

    // Close database pool
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (err) {
      console.error('Error closing pool:', err);
    }

    process.exit(0);
  });

  // Force exit after 30s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));`,
      explanation: "When Kubernetes sends SIGTERM, this handler stops accepting new requests, finishes in-flight requests, closes the database pool, and exits cleanly. The 30-second timeout ensures the process doesn't hang forever.",
      order_index: 1,
    },
  ],
};

export default examples;
