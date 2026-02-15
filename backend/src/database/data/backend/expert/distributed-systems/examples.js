// ============================================================================
// Distributed Systems — Code Examples
// ============================================================================

const examples = {
  'cap-theorem-consistency': [
    {
      title: "Circuit Breaker Pattern",
      description: "Prevent cascading failures in distributed systems.",
      language: "javascript",
      code: `class CircuitBreaker {
  #state = 'CLOSED';    // CLOSED → OPEN → HALF_OPEN
  #failureCount = 0;
  #successCount = 0;
  #lastFailureTime = null;
  #options;

  constructor(options = {}) {
    this.#options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 3,
      timeout: options.timeout || 30000, // 30s before trying again
    };
  }

  async execute(fn) {
    if (this.#state === 'OPEN') {
      if (Date.now() - this.#lastFailureTime > this.#options.timeout) {
        this.#state = 'HALF_OPEN';
        this.#successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN — request rejected');
      }
    }

    try {
      const result = await fn();
      this.#onSuccess();
      return result;
    } catch (error) {
      this.#onFailure();
      throw error;
    }
  }

  #onSuccess() {
    if (this.#state === 'HALF_OPEN') {
      this.#successCount++;
      if (this.#successCount >= this.#options.successThreshold) {
        this.#state = 'CLOSED';
        this.#failureCount = 0;
        console.log('Circuit breaker CLOSED — service recovered');
      }
    }
    this.#failureCount = 0;
  }

  #onFailure() {
    this.#failureCount++;
    this.#lastFailureTime = Date.now();
    if (this.#failureCount >= this.#options.failureThreshold) {
      this.#state = 'OPEN';
      console.log('Circuit breaker OPEN — stopping requests');
    }
  }

  get state() { return this.#state; }
}

// Usage with an external API
const paymentBreaker = new CircuitBreaker({
  failureThreshold: 3,
  timeout: 60000,
});

async function processPayment(data) {
  return paymentBreaker.execute(async () => {
    const response = await fetch('https://payment-api.com/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(\`Payment failed: \${response.status}\`);
    return response.json();
  });
}`,
      explanation: "Circuit Breaker prevents cascading failures: after 3 failures, it stops making requests for 60 seconds, then cautiously tries again (HALF_OPEN). This protects downstream services from being overwhelmed.",
      order_index: 1,
    },
  ],
  'distributed-transactions-saga': [
    {
      title: "Generic Saga Orchestrator",
      description: "Reusable saga orchestrator with logging and retry.",
      language: "javascript",
      code: `class SagaOrchestrator {
  #name;
  #steps;

  constructor(name, steps) {
    this.#name = name;
    this.#steps = steps;
  }

  async run(initialContext = {}) {
    const ctx = { ...initialContext };
    const completed = [];
    const log = [];

    for (const step of this.#steps) {
      const entry = { step: step.name, startedAt: new Date() };
      try {
        const result = await this.#withRetry(
          () => step.action(ctx),
          step.retries || 0
        );
        if (result) Object.assign(ctx, result);
        entry.status = 'completed';
        completed.push(step);
      } catch (error) {
        entry.status = 'failed';
        entry.error = error.message;
        log.push(entry);

        // Run compensations in reverse
        console.error(\`[Saga:\${this.#name}] \${step.name} failed — compensating\`);
        await this.#compensate(completed.reverse(), ctx);
        throw new Error(\`Saga \${this.#name} failed at \${step.name}\`);
      }
      log.push(entry);
    }

    return { context: ctx, log };
  }

  async #compensate(steps, ctx) {
    for (const step of steps) {
      if (!step.compensation) continue;
      try {
        await step.compensation(ctx);
        console.log(\`  ↩ Compensated: \${step.name}\`);
      } catch (err) {
        console.error(\`  ✗ Compensation failed: \${step.name}\`, err.message);
      }
    }
  }

  async #withRetry(fn, retries) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === retries) throw err;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
}

// Define a saga
const orderSaga = new SagaOrchestrator('PlaceOrder', [
  {
    name: 'validate',
    action: async (ctx) => { /* validate order data */ },
  },
  {
    name: 'reserve-stock',
    action: async (ctx) => { return { reservationId: 'res_123' }; },
    compensation: async (ctx) => { /* release reservation */ },
    retries: 2,
  },
  {
    name: 'charge-payment',
    action: async (ctx) => { return { paymentId: 'pay_456' }; },
    compensation: async (ctx) => { /* refund payment */ },
    retries: 1,
  },
  {
    name: 'confirm',
    action: async (ctx) => { /* finalize order */ },
  },
]);

const result = await orderSaga.run({ userId: 'u1', items: [] });`,
      explanation: "This reusable orchestrator handles retries with exponential backoff and runs compensations in reverse order on failure. Each step can return data that enriches the saga context for subsequent steps.",
      order_index: 1,
    },
  ],
};

export default examples;
