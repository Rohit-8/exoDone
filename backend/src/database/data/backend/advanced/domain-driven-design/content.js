// ============================================================================
// Domain-Driven Design — Content
// ============================================================================

export const topic = {
  "name": "Domain-Driven Design",
  "slug": "domain-driven-design",
  "description": "Model complex business domains using Aggregates, Value Objects, Bounded Contexts, and Ubiquitous Language.",
  "estimated_time": 250,
  "order_index": 8
};

export const lessons = [
  {
    title: "Aggregates, Entities & Value Objects",
    slug: "aggregates-entities-value-objects",
    summary: "Build rich domain models with entities that have identity, value objects that are immutable, and aggregates that enforce consistency.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "Entities have identity — two entities with the same data but different IDs are different",
  "Value Objects have no identity — equality is based on data (e.g., Money, Address)",
  "Aggregates are clusters of entities with one Aggregate Root that enforces invariants",
  "All modifications go through the Aggregate Root — it guards consistency",
  "Repository pattern loads/saves entire aggregates, not individual entities"
],
    content: `# Aggregates, Entities & Value Objects

## Entity vs Value Object

| | Entity | Value Object |
|---|---|---|
| Identity | Has a unique ID | No ID — defined by its attributes |
| Equality | Two with the same ID are the same | Two with the same data are equal |
| Mutability | Can change over time | Immutable — replace, don't modify |
| Examples | User, Order, Product | Money, Address, DateRange |

## Value Object

\`\`\`javascript
class Money {
  #amount;
  #currency;

  constructor(amount, currency = 'USD') {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    this.#amount = Math.round(amount * 100) / 100; // avoid floating point
    this.#currency = currency;
    Object.freeze(this);
  }

  get amount() { return this.#amount; }
  get currency() { return this.#currency; }

  add(other) {
    this.#assertSameCurrency(other);
    return new Money(this.#amount + other.amount, this.#currency);
  }

  subtract(other) {
    this.#assertSameCurrency(other);
    if (other.amount > this.#amount) throw new Error('Insufficient amount');
    return new Money(this.#amount - other.amount, this.#currency);
  }

  multiply(factor) {
    return new Money(this.#amount * factor, this.#currency);
  }

  equals(other) {
    return this.#amount === other.amount && this.#currency === other.currency;
  }

  #assertSameCurrency(other) {
    if (this.#currency !== other.currency) {
      throw new Error(\`Currency mismatch: \${this.#currency} vs \${other.currency}\`);
    }
  }

  toString() { return \`\${this.#currency} \${this.#amount.toFixed(2)}\`; }
}
\`\`\`

## Aggregate

\`\`\`javascript
class Order {
  #id;
  #customerId;
  #items = [];
  #status = 'draft';
  #total = new Money(0);

  constructor(id, customerId) {
    this.#id = id;
    this.#customerId = customerId;
  }

  // All modifications go through the Aggregate Root
  addItem(productId, name, unitPrice, quantity) {
    if (this.#status !== 'draft') {
      throw new Error('Cannot modify a submitted order');
    }
    if (quantity <= 0) throw new Error('Quantity must be positive');

    const existing = this.#items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.#items.push({ productId, name, unitPrice, quantity });
    }
    this.#recalculateTotal();
  }

  removeItem(productId) {
    if (this.#status !== 'draft') throw new Error('Cannot modify');
    this.#items = this.#items.filter(i => i.productId !== productId);
    this.#recalculateTotal();
  }

  submit() {
    if (this.#items.length === 0) throw new Error('Cannot submit empty order');
    this.#status = 'submitted';
    return { event: 'OrderSubmitted', orderId: this.#id, total: this.#total };
  }

  #recalculateTotal() {
    this.#total = this.#items.reduce(
      (sum, item) => sum.add(item.unitPrice.multiply(item.quantity)),
      new Money(0)
    );
  }

  get id() { return this.#id; }
  get status() { return this.#status; }
  get total() { return this.#total; }
  get items() { return this.#items.map(i => ({ ...i })); }
}
\`\`\`

## Aggregate Rules

1. **Reference by ID only** — Aggregates refer to other Aggregates by ID, not by direct object reference.
2. **One transaction per Aggregate** — Don't modify multiple Aggregates in one transaction.
3. **Eventual consistency** between Aggregates — use Domain Events.
4. **Small Aggregates** — only include what's needed to enforce invariants.
`,
  },
];
