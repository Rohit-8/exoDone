// ============================================================================
// OOP Fundamentals — Code Examples
// ============================================================================

const examples = {
  'classes-objects-encapsulation': [
    {
      title: "Encapsulated Shopping Cart",
      description: "A shopping cart class demonstrating encapsulation principles.",
      language: "javascript",
      code: `class ShoppingCart {
  #items = [];

  addItem(product, quantity = 1) {
    const existing = this.#items.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.#items.push({ product, quantity });
    }
  }

  removeItem(productId) {
    this.#items = this.#items.filter(i => i.product.id !== productId);
  }

  get total() {
    return this.#items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  get itemCount() {
    return this.#items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get items() {
    // Return a copy — don't expose the internal array
    return this.#items.map(i => ({ ...i }));
  }
}

const cart = new ShoppingCart();
cart.addItem({ id: 1, name: 'Laptop', price: 999 });
cart.addItem({ id: 2, name: 'Mouse', price: 29 }, 2);
console.log(cart.total);     // 1057
console.log(cart.itemCount); // 3`,
      explanation: "The #items array is private. The items getter returns a copy, preventing external code from mutating the internal state directly.",
      order_index: 1,
    },
  ],
  'inheritance-polymorphism': [
    {
      title: "Payment Processor with Polymorphism",
      description: "Different payment methods processed through a common interface.",
      language: "javascript",
      code: `class PaymentProcessor {
  process(amount) {
    throw new Error('process() must be implemented');
  }
}

class CreditCardProcessor extends PaymentProcessor {
  constructor(cardNumber) {
    super();
    this.cardNumber = cardNumber;
  }

  process(amount) {
    console.log(\`Charging $\${amount} to card ending in \${this.cardNumber.slice(-4)}\`);
    return { success: true, method: 'credit_card', amount };
  }
}

class PayPalProcessor extends PaymentProcessor {
  constructor(email) {
    super();
    this.email = email;
  }

  process(amount) {
    console.log(\`Sending $\${amount} payment request to \${this.email}\`);
    return { success: true, method: 'paypal', amount };
  }
}

// Polymorphic usage — the checkout doesn't care which processor
function checkout(processor, amount) {
  return processor.process(amount);
}

checkout(new CreditCardProcessor('4111111111111234'), 99.99);
checkout(new PayPalProcessor('alice@example.com'), 49.99);`,
      explanation: "The checkout function works with ANY PaymentProcessor subclass. New payment methods can be added without modifying existing code (Open-Closed Principle).",
      order_index: 1,
    },
  ],
  'abstraction-solid-intro': [
    {
      title: "Dependency Injection Example",
      description: "Demonstrating DIP with injected dependencies.",
      language: "javascript",
      code: `// Abstractions (interfaces in TS, contracts in JS)
class Logger {
  log(message) { throw new Error('Not implemented'); }
}

class NotificationService {
  send(to, message) { throw new Error('Not implemented'); }
}

// Concrete implementations
class ConsoleLogger extends Logger {
  log(message) { console.log(\`[LOG] \${message}\`); }
}

class EmailNotification extends NotificationService {
  send(to, message) { console.log(\`Email to \${to}: \${message}\`); }
}

// Service depends on abstractions, not concretions
class OrderService {
  constructor(logger, notifier) {
    this.logger = logger;
    this.notifier = notifier;
  }

  placeOrder(order) {
    this.logger.log(\`Order placed: \${order.id}\`);
    this.notifier.send(order.email, 'Your order is confirmed!');
    return { ...order, status: 'confirmed' };
  }
}

// Easy to swap implementations or mock for tests
const service = new OrderService(
  new ConsoleLogger(),
  new EmailNotification()
);`,
      explanation: "OrderService accepts any Logger and NotificationService implementation. In tests, you can inject mocks. In production, swap between providers easily.",
      order_index: 1,
    },
  ],
};

export default examples;
