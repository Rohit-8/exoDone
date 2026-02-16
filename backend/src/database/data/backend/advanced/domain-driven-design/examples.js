// ============================================================================
// Domain-Driven Design — Code Examples
// ============================================================================

export default {
  'ddd-strategic-patterns': [
    {
      title: "Anti-Corruption Layer for Legacy System Integration",
      description: "A complete Anti-Corruption Layer that translates a legacy billing system's data model into the new domain model, preventing legacy concepts from leaking into the modern codebase.",
      language: "javascript",
      code: `// ── Value Objects used by our domain ──────────────────────────
class Money {
  #amount;
  #currency;

  constructor(amount, currency) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be non-negative');
    }
    this.#amount = Math.round(amount * 100) / 100;
    this.#currency = currency;
    Object.freeze(this);
  }

  static of(amount, currency = 'USD') {
    return new Money(amount, currency);
  }

  get amount() { return this.#amount; }
  get currency() { return this.#currency; }

  equals(other) {
    return other instanceof Money
      && this.#amount === other.amount
      && this.#currency === other.currency;
  }
}

// ── Our clean domain model ───────────────────────────────────
class Invoice {
  constructor({ id, orderId, amount, status, lineItems, issuedAt }) {
    this.id = id;
    this.orderId = orderId;
    this.amount = amount;         // Money value object
    this.status = status;         // 'pending' | 'paid' | 'overdue' | 'cancelled'
    this.lineItems = lineItems;   // InvoiceLineItem[]
    this.issuedAt = issuedAt;
  }

  get isPaid() { return this.status === 'paid'; }
  get isOverdue() { return this.status === 'overdue'; }
}

class InvoiceLineItem {
  constructor({ description, quantity, unitPrice }) {
    this.description = description;
    this.quantity = quantity;
    this.unitPrice = unitPrice;   // Money value object
  }

  get subtotal() {
    return Money.of(this.unitPrice.amount * this.quantity, this.unitPrice.currency);
  }
}

// ── Anti-Corruption Layer ────────────────────────────────────
// Sits between our Bounded Context and the legacy system.
// Translates the legacy model into our domain model.
class LegacyBillingACL {
  constructor(legacyClient) {
    this.legacyClient = legacyClient;
  }

  async getInvoice(orderId) {
    // Legacy returns: { inv_no, ord_num, tot_amt, curr_cd, stat,
    //   inv_dt, line_items: [{ desc, qty, unit_amt }] }
    const raw = await this.legacyClient.fetchInvoice({ ord_num: orderId });

    return new Invoice({
      id: String(raw.inv_no),
      orderId: String(raw.ord_num),
      amount: Money.of(raw.tot_amt / 100, this.#mapCurrency(raw.curr_cd)),
      status: this.#mapStatus(raw.stat),
      issuedAt: new Date(raw.inv_dt),
      lineItems: raw.line_items.map(li => new InvoiceLineItem({
        description: li.desc,
        quantity: li.qty,
        unitPrice: Money.of(li.unit_amt / 100, this.#mapCurrency(raw.curr_cd)),
      })),
    });
  }

  #mapStatus(legacyCode) {
    const map = { P: 'pending', C: 'paid', O: 'overdue', X: 'cancelled' };
    return map[legacyCode] || 'unknown';
  }

  #mapCurrency(legacyCode) {
    const map = { 1: 'USD', 2: 'EUR', 3: 'GBP' };
    return map[legacyCode] || 'USD';
  }
}

// ── Usage ────────────────────────────────────────────────────
async function getInvoiceForOrder(orderId) {
  const acl = new LegacyBillingACL(legacyBillingClient);
  const invoice = await acl.getInvoice(orderId);

  // Now we work with our clean domain model — no legacy leakage
  console.log(invoice.amount.currency); // 'USD' (not mystery code '1')
  console.log(invoice.status);          // 'paid' (not 'C')
  console.log(invoice.isPaid);          // true
}`,
      explanation: "The Anti-Corruption Layer (ACL) is one of the most important context mapping patterns. It creates a translation boundary between a legacy or external system and your clean domain model. The legacy system returns cryptic codes (stat: 'C', curr_cd: 1), and the ACL translates these into meaningful domain concepts (status: 'paid', currency: 'USD'). Without the ACL, legacy naming conventions and data formats would leak into your domain layer, gradually corrupting your model. The ACL contains the translation logic so the rest of your codebase remains clean.",
      order_index: 1,
    },
    {
      title: "Domain Events for Cross-Context Communication",
      description: "Publishing domain events between Bounded Contexts to maintain eventual consistency without tight coupling — an Order context emits OrderPlaced and downstream contexts react independently.",
      language: "javascript",
      code: `// ── Event Bus (infrastructure) ────────────────────────────────
class EventBus {
  #handlers = new Map();

  subscribe(eventType, handler) {
    if (!this.#handlers.has(eventType)) {
      this.#handlers.set(eventType, []);
    }
    this.#handlers.get(eventType).push(handler);
  }

  async publish(event) {
    const handlers = this.#handlers.get(event.type) || [];
    // Handlers run independently — one failure doesn't block others
    const results = await Promise.allSettled(
      handlers.map(handler => handler.handle(event))
    );
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Event handler failed:', result.reason);
      }
    }
  }
}

// ── Domain Event ─────────────────────────────────────────────
class OrderPlacedEvent {
  constructor({ orderId, customerId, items, totalAmount, currency }) {
    this.type = 'OrderPlaced';
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
    this.payload = { orderId, customerId, items, totalAmount, currency };
    Object.freeze(this);
  }
}

// ── Inventory Context Handler (downstream) ──────────────────
class ReserveInventoryHandler {
  constructor(inventoryRepo) {
    this.inventoryRepo = inventoryRepo;
  }

  async handle(event) {
    console.log('[Inventory] Reserving stock for order', event.payload.orderId);
    for (const item of event.payload.items) {
      const stock = await this.inventoryRepo.findBySku(item.productId);
      stock.reserve(item.quantity);
      await this.inventoryRepo.save(stock);
    }
  }
}

// ── Notification Context Handler (downstream) ───────────────
class SendOrderConfirmationHandler {
  constructor(emailService) {
    this.emailService = emailService;
  }

  async handle(event) {
    console.log('[Notify] Sending confirmation for order', event.payload.orderId);
    await this.emailService.send({
      to: event.payload.customerId,
      template: 'order-confirmation',
      data: {
        orderId: event.payload.orderId,
        total: event.payload.totalAmount,
      },
    });
  }
}

// ── Wiring it together ──────────────────────────────────────
const eventBus = new EventBus();
eventBus.subscribe('OrderPlaced', new ReserveInventoryHandler(inventoryRepo));
eventBus.subscribe('OrderPlaced', new SendOrderConfirmationHandler(emailService));

// When an order is placed in the Order Context:
async function placeOrder(order) {
  order.place();
  await orderRepo.save(order);

  const event = new OrderPlacedEvent({
    orderId: order.id,
    customerId: order.customerId,
    items: order.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    totalAmount: order.total.amount,
    currency: order.total.currency,
  });

  await eventBus.publish(event);
}`,
      explanation: "This example shows how Bounded Contexts communicate through Domain Events. The Order Context publishes an OrderPlacedEvent. The Inventory Context and Notification Context each subscribe to this event and react independently. This is eventual consistency in action — the Order Context doesn't wait for inventory or email to complete. Each context can fail independently without affecting the others. In production, you'd use a message broker (RabbitMQ, Kafka) instead of an in-memory bus, and add idempotency keys to handle duplicate deliveries.",
      order_index: 2,
    },
    {
      title: "Bounded Context with Ubiquitous Language",
      description: "Demonstrates how the same real-world concept (Product) has different representations in different Bounded Contexts, each using its own Ubiquitous Language.",
      language: "javascript",
      code: `// ═══════════════════════════════════════════════════════════
// CATALOG BOUNDED CONTEXT
// In this context, a "Product" is something customers browse.
// Language: Product, Category, Price, Description
// ═══════════════════════════════════════════════════════════
class CatalogProduct {
  constructor({ id, name, description, price, categories, images }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;             // Money value object
    this.categories = categories;   // string[]
    this.images = images;           // URL[]
  }

  applyDiscount(percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Invalid discount percentage');
    }
    return new CatalogProduct({
      ...this,
      price: this.price.multiply(1 - percentage / 100),
    });
  }

  isInCategory(categoryName) {
    return this.categories.includes(categoryName);
  }
}

// ═══════════════════════════════════════════════════════════
// INVENTORY BOUNDED CONTEXT
// Here, the same real-world item is a "StockItem."
// Language: StockItem, SKU, QuantityOnHand, Reorder, Reserve
// ═══════════════════════════════════════════════════════════
class StockItem {
  #sku;
  #quantityOnHand;
  #reservedQuantity;
  #reorderThreshold;
  #warehouseLocation;

  constructor({ sku, quantityOnHand, reservedQuantity = 0,
                reorderThreshold, warehouseLocation }) {
    this.#sku = sku;
    this.#quantityOnHand = quantityOnHand;
    this.#reservedQuantity = reservedQuantity;
    this.#reorderThreshold = reorderThreshold;
    this.#warehouseLocation = warehouseLocation;
  }

  get availableQuantity() {
    return this.#quantityOnHand - this.#reservedQuantity;
  }

  get needsReorder() {
    return this.availableQuantity <= this.#reorderThreshold;
  }

  reserve(quantity) {
    if (quantity > this.availableQuantity) {
      throw new Error(
        \\\`Cannot reserve \\\${quantity} — only \\\${this.availableQuantity} available\\\`
      );
    }
    this.#reservedQuantity += quantity;
  }

  restock(quantity) {
    this.#quantityOnHand += quantity;
  }

  get sku() { return this.#sku; }
  get warehouseLocation() { return this.#warehouseLocation; }
}

// ═══════════════════════════════════════════════════════════
// SHIPPING BOUNDED CONTEXT
// Here, the item is a "Parcel" — only weight/dimensions matter.
// Language: Parcel, Weight, Dimensions, Fragile
// ═══════════════════════════════════════════════════════════
class Parcel {
  constructor({ productId, weightKg, lengthCm, widthCm, heightCm, isFragile }) {
    this.productId = productId;
    this.weightKg = weightKg;
    this.lengthCm = lengthCm;
    this.widthCm = widthCm;
    this.heightCm = heightCm;
    this.isFragile = isFragile;
  }

  get volumeCm3() {
    return this.lengthCm * this.widthCm * this.heightCm;
  }

  get isOversized() {
    return this.volumeCm3 > 100000 || this.weightKg > 30;
  }

  requiresSpecialHandling() {
    return this.isFragile || this.isOversized;
  }
}

// Each context has its own model for the same real-world thing.
// They communicate via IDs and Domain Events — never by sharing objects.`,
      explanation: "This is the essence of Bounded Contexts: the same real-world concept — a physical product — is modeled differently in each context because each context cares about different aspects. The Catalog Context cares about display (name, description, price). The Inventory Context cares about stock levels (quantity, reorder, reservation). The Shipping Context cares about physical properties (weight, dimensions, fragility). Forcing all of these into a single Product class would create a bloated, constantly-changing God Object. Instead, each context has its own model with its own Ubiquitous Language, and they communicate only through IDs and Domain Events.",
      order_index: 3,
    },
  ],

  'ddd-tactical-patterns': [
    {
      title: "Complete Value Object with Validation and Immutability",
      description: "A production-quality Money value object demonstrating immutability, self-validation, equality by value, and side-effect-free operations that return new instances.",
      language: "javascript",
      code: `class Money {
  #amount;
  #currency;

  constructor(amount, currency = 'USD') {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error(\\\`Invalid amount: \\\${amount} — must be a finite number\\\`);
    }
    if (amount < 0) {
      throw new Error('Amount cannot be negative — use Money.zero() for zero values');
    }
    if (!Money.SUPPORTED_CURRENCIES.has(currency)) {
      throw new Error(\\\`Unsupported currency: \\\${currency}\\\`);
    }

    // Round to 2 decimal places to avoid floating-point issues
    this.#amount = Math.round(amount * 100) / 100;
    this.#currency = currency;
    Object.freeze(this);  // Enforce immutability
  }

  static SUPPORTED_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD']);

  static of(amount, currency = 'USD') {
    return new Money(amount, currency);
  }

  static zero(currency = 'USD') {
    return new Money(0, currency);
  }

  get amount() { return this.#amount; }
  get currency() { return this.#currency; }

  // All operations return NEW Money instances (immutable)
  add(other) {
    this.#assertSameCurrency(other);
    return new Money(this.#amount + other.amount, this.#currency);
  }

  subtract(other) {
    this.#assertSameCurrency(other);
    const result = this.#amount - other.amount;
    if (result < 0) {
      throw new Error(
        \\\`Cannot subtract \\\${other} from \\\${this} — result would be negative\\\`
      );
    }
    return new Money(result, this.#currency);
  }

  multiply(factor) {
    if (typeof factor !== 'number') throw new Error('Factor must be a number');
    return new Money(this.#amount * factor, this.#currency);
  }

  // Value Object equality: compare by attributes, not by reference
  equals(other) {
    if (!(other instanceof Money)) return false;
    return this.#amount === other.amount && this.#currency === other.currency;
  }

  isGreaterThan(other) {
    this.#assertSameCurrency(other);
    return this.#amount > other.amount;
  }

  isZero() { return this.#amount === 0; }

  #assertSameCurrency(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only compare/operate with Money instances');
    }
    if (this.#currency !== other.currency) {
      throw new Error(
        \\\`Currency mismatch: \\\${this.#currency} vs \\\${other.currency}\\\`
      );
    }
  }

  toString() {
    return \\\`\\\${this.#currency} \\\${this.#amount.toFixed(2)}\\\`;
  }
}

// ── Usage ─────────────────────────────────────────────
const price = Money.of(29.99);
const tax = price.multiply(0.08);        // New Money: USD 2.40
const total = price.add(tax);            // New Money: USD 32.39
const refund = total.subtract(price);    // New Money: USD 2.40

console.log(price.toString());           // "USD 29.99"
console.log(tax.equals(refund));         // true — same value!

// Original never changed (immutable)
console.log(price.amount);              // 29.99 — unchanged`,
      explanation: "Money is the canonical Value Object example. Key design decisions: (1) Immutability via Object.freeze() and private fields — once created, a Money instance never changes. (2) Self-validation in the constructor ensures no invalid Money can exist. (3) Equality by value — two Money(10, 'USD') are equal even though they're different objects. (4) All operations (add, subtract, multiply) return new instances instead of mutating. (5) Currency safety prevents accidentally adding USD to EUR. This pattern eliminates entire classes of bugs around financial calculations.",
      order_index: 1,
    },
    {
      title: "Order Aggregate Root with Invariant Enforcement",
      description: "A complete Order aggregate demonstrating the Aggregate Root pattern: all modifications go through the root, which enforces business invariants and collects domain events.",
      language: "javascript",
      code: `// ── Base class for all Aggregate Roots ────────────────────
class AggregateRoot {
  #domainEvents = [];

  addDomainEvent(event) {
    this.#domainEvents.push(event);
  }

  pullDomainEvents() {
    const events = [...this.#domainEvents];
    this.#domainEvents = [];
    return events;
  }
}

// ── Order Status (Value Object / Enum) ────────────────────
class OrderStatus {
  static DRAFT = new OrderStatus('draft');
  static PLACED = new OrderStatus('placed');
  static PAID = new OrderStatus('paid');
  static SHIPPED = new OrderStatus('shipped');
  static CANCELLED = new OrderStatus('cancelled');

  #value;
  constructor(value) {
    this.#value = value;
    Object.freeze(this);
  }

  get value() { return this.#value; }

  canTransitionTo(target) {
    const allowed = {
      draft: ['placed', 'cancelled'],
      placed: ['paid', 'cancelled'],
      paid: ['shipped', 'cancelled'],
      shipped: [],          // terminal state
      cancelled: [],        // terminal state
    };
    return allowed[this.#value]?.includes(target.value) || false;
  }

  equals(other) {
    return other instanceof OrderStatus && this.#value === other.value;
  }

  toString() { return this.#value; }
}

// ── Order Line Item (Entity inside the Aggregate) ────────
class OrderLineItem {
  constructor(id, productId, productName, unitPrice, quantity) {
    if (quantity <= 0) throw new Error('Quantity must be positive');
    this.id = id;
    this.productId = productId;
    this.productName = productName;
    this.unitPrice = unitPrice;   // Money value object
    this.quantity = quantity;
  }

  get subtotal() {
    return this.unitPrice.multiply(this.quantity);
  }
}

// ── Order (Aggregate Root) ───────────────────────────────
class Order extends AggregateRoot {
  #id;
  #customerId;
  #status;
  #items = [];
  #shippingAddress;
  #createdAt;

  constructor(id, customerId, shippingAddress) {
    super();
    this.#id = id;
    this.#customerId = customerId;
    this.#status = OrderStatus.DRAFT;
    this.#shippingAddress = shippingAddress;
    this.#createdAt = new Date();
  }

  // ── All modifications go through the Aggregate Root ──
  addItem(productId, productName, unitPrice, quantity) {
    this.#assertModifiable();

    // Invariant: no duplicate products
    const existing = this.#items.find(i => i.productId === productId);
    if (existing) {
      throw new Error(\\\`Product \\\${productId} already in order — update quantity instead\\\`);
    }

    // Invariant: max 20 line items per order
    if (this.#items.length >= 20) {
      throw new Error('Order cannot have more than 20 line items');
    }

    const lineItemId = crypto.randomUUID();
    this.#items.push(
      new OrderLineItem(lineItemId, productId, productName, unitPrice, quantity)
    );
  }

  removeItem(productId) {
    this.#assertModifiable();
    const index = this.#items.findIndex(i => i.productId === productId);
    if (index === -1) throw new Error(\\\`Product \\\${productId} not in order\\\`);
    this.#items.splice(index, 1);
  }

  place() {
    // Invariant: cannot place empty order
    if (this.#items.length === 0) {
      throw new Error('Cannot place an empty order');
    }
    this.#transitionTo(OrderStatus.PLACED);

    // Record domain event
    this.addDomainEvent({
      type: 'OrderPlaced',
      orderId: this.#id,
      customerId: this.#customerId,
      total: this.total.amount,
      itemCount: this.#items.length,
      occurredAt: new Date().toISOString(),
    });
  }

  cancel(reason) {
    if (this.#status.equals(OrderStatus.SHIPPED)) {
      throw new Error('Cannot cancel a shipped order');
    }
    this.#transitionTo(OrderStatus.CANCELLED);

    this.addDomainEvent({
      type: 'OrderCancelled',
      orderId: this.#id,
      reason,
      occurredAt: new Date().toISOString(),
    });
  }

  // ── Computed properties ────────────────────────────────
  get total() {
    return this.#items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero()
    );
  }

  get id() { return this.#id; }
  get customerId() { return this.#customerId; }
  get status() { return this.#status; }
  get items() { return [...this.#items]; }  // Defensive copy

  // ── Private helpers ────────────────────────────────────
  #assertModifiable() {
    if (!this.#status.equals(OrderStatus.DRAFT)) {
      throw new Error(\\\`Cannot modify order in \\\${this.#status} status\\\`);
    }
  }

  #transitionTo(newStatus) {
    if (!this.#status.canTransitionTo(newStatus)) {
      throw new Error(
        \\\`Invalid transition: \\\${this.#status} → \\\${newStatus}\\\`
      );
    }
    this.#status = newStatus;
  }
}

// ── Usage ─────────────────────────────────────────────
const order = new Order('ord-1', 'cust-1', address);
order.addItem('prod-1', 'Keyboard', Money.of(79.99), 1);
order.addItem('prod-2', 'Mouse', Money.of(39.99), 2);

console.log(order.total.toString());  // "USD 159.97"

order.place();
const events = order.pullDomainEvents();
// events = [{ type: 'OrderPlaced', orderId: 'ord-1', ... }]`,
      explanation: "This demonstrates the complete Aggregate Root pattern. The Order is the Aggregate Root — it's the only entry point for modifying anything inside the aggregate (including OrderLineItems). Key design points: (1) The Aggregate Root enforces all invariants — no empty orders can be placed, max 20 items, no duplicates. (2) State transitions are validated — you can't go from 'shipped' to 'draft'. (3) Child entities (OrderLineItem) are never accessed directly from outside the aggregate. (4) Domain events are collected but not published — the application service handles publishing after persistence. (5) The items getter returns a defensive copy to prevent external mutation.",
      order_index: 2,
    },
    {
      title: "Repository Pattern with PostgreSQL Implementation",
      description: "A domain-layer repository interface and its infrastructure-layer PostgreSQL implementation, demonstrating how aggregates are persisted and reconstituted.",
      language: "javascript",
      code: `// ═══════════════════════════════════════════════════════════
// DOMAIN LAYER — Repository interface (abstract class)
// This file lives in: src/domain/order/OrderRepository.js
// The domain layer defines WHAT it needs, not HOW it's stored.
// ═══════════════════════════════════════════════════════════
class OrderRepository {
  async findById(orderId) {
    throw new Error('OrderRepository.findById not implemented');
  }

  async findByCustomerId(customerId) {
    throw new Error('OrderRepository.findByCustomerId not implemented');
  }

  async save(order) {
    throw new Error('OrderRepository.save not implemented');
  }

  async delete(orderId) {
    throw new Error('OrderRepository.delete not implemented');
  }
}

// ═══════════════════════════════════════════════════════════
// INFRASTRUCTURE LAYER — PostgreSQL implementation
// This file lives in: src/infrastructure/persistence/PostgresOrderRepository.js
// ═══════════════════════════════════════════════════════════
class PostgresOrderRepository extends OrderRepository {
  constructor(pool) {
    super();
    this.pool = pool; // pg.Pool instance
  }

  async findById(orderId) {
    const client = await this.pool.connect();
    try {
      const orderRow = await client.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );
      if (orderRow.rows.length === 0) return null;

      const itemRows = await client.query(
        'SELECT * FROM order_line_items WHERE order_id = $1 ORDER BY created_at',
        [orderId]
      );

      // Reconstitute the aggregate from database rows
      return this.#toDomainModel(orderRow.rows[0], itemRows.rows);
    } finally {
      client.release();
    }
  }

  async save(order) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert the order
      await client.query(
        \\\`INSERT INTO orders (id, customer_id, status, shipping_address, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id)
         DO UPDATE SET status = $3, shipping_address = $4\\\`,
        [order.id, order.customerId, order.status.value,
         JSON.stringify(order.shippingAddress), order.createdAt]
      );

      // Delete and re-insert line items (simple strategy)
      await client.query(
        'DELETE FROM order_line_items WHERE order_id = $1',
        [order.id]
      );

      for (const item of order.items) {
        await client.query(
          \\\`INSERT INTO order_line_items
             (id, order_id, product_id, product_name, unit_price_amount,
              unit_price_currency, quantity)
           VALUES ($1, $2, $3, $4, $5, $6, $7)\\\`,
          [item.id, order.id, item.productId, item.productName,
           item.unitPrice.amount, item.unitPrice.currency, item.quantity]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Reconstitute aggregate from DB rows ──────────────
  #toDomainModel(orderRow, itemRows) {
    const items = itemRows.map(row => new OrderLineItem(
      row.id,
      row.product_id,
      row.product_name,
      Money.of(parseFloat(row.unit_price_amount), row.unit_price_currency),
      row.quantity
    ));

    // Use factory method to reconstitute without triggering
    // business validation or domain events
    return OrderFactory.reconstitute({
      id: orderRow.id,
      customerId: orderRow.customer_id,
      status: orderRow.status,
      shippingAddress: JSON.parse(orderRow.shipping_address),
      items,
      createdAt: orderRow.created_at,
    });
  }
}`,
      explanation: "This shows the Repository pattern's two layers: (1) The domain layer defines an abstract OrderRepository — a contract describing WHAT persistence operations are needed, with no mention of databases. (2) The infrastructure layer provides PostgresOrderRepository, which knows HOW to persist using PostgreSQL. Key points: the repository saves/loads the ENTIRE aggregate (Order + OrderLineItems) as a unit — never individual line items. The #toDomainModel method reconstitutes the aggregate from raw database rows back into rich domain objects with Value Objects (Money) and proper types. This separation means you could swap PostgreSQL for MongoDB by writing a new implementation without touching any domain or application code.",
      order_index: 3,
    },
    {
      title: "Specification Pattern for Composable Business Rules",
      description: "The Specification pattern encapsulates business rules into named, testable, composable objects — demonstrating AND, OR, NOT composition for order eligibility checks.",
      language: "javascript",
      code: `// ── Base Specification ────────────────────────────────────
class Specification {
  isSatisfiedBy(candidate) {
    throw new Error('Subclass must implement isSatisfiedBy()');
  }

  and(other) { return new AndSpec(this, other); }
  or(other)  { return new OrSpec(this, other); }
  not()      { return new NotSpec(this); }

  // Utility: filter a collection using this spec
  filter(candidates) {
    return candidates.filter(c => this.isSatisfiedBy(c));
  }
}

class AndSpec extends Specification {
  constructor(left, right) { super(); this.left = left; this.right = right; }
  isSatisfiedBy(c) { return this.left.isSatisfiedBy(c) && this.right.isSatisfiedBy(c); }
}

class OrSpec extends Specification {
  constructor(left, right) { super(); this.left = left; this.right = right; }
  isSatisfiedBy(c) { return this.left.isSatisfiedBy(c) || this.right.isSatisfiedBy(c); }
}

class NotSpec extends Specification {
  constructor(spec) { super(); this.spec = spec; }
  isSatisfiedBy(c) { return !this.spec.isSatisfiedBy(c); }
}

// ── Domain-specific Specifications ───────────────────────
class OrderIsHighValue extends Specification {
  constructor(threshold = 500) {
    super();
    this.threshold = threshold;
  }
  isSatisfiedBy(order) {
    return order.total.amount >= this.threshold;
  }
}

class OrderHasAllItemsInStock extends Specification {
  isSatisfiedBy(order) {
    return order.items.every(item => item.inStock === true);
  }
}

class OrderShipsToCountry extends Specification {
  constructor(countryCode) {
    super();
    this.countryCode = countryCode;
  }
  isSatisfiedBy(order) {
    return order.shippingAddress?.country === this.countryCode;
  }
}

class OrderIsEligibleForFreeShipping extends Specification {
  isSatisfiedBy(order) {
    return order.total.amount >= 100
      && order.shippingAddress?.country === 'US';
  }
}

class CustomerIsInGoodStanding extends Specification {
  isSatisfiedBy(customer) {
    return customer.accountAge >= 30       // at least 30 days old
      && customer.returnRate < 0.15        // less than 15% return rate
      && !customer.isSuspended;
  }
}

// ── Compose specifications for complex business rules ────
const eligibleForPriorityShipping =
  new OrderIsHighValue(200)
    .and(new OrderHasAllItemsInStock())
    .and(new OrderShipsToCountry('US'));

const eligibleForLoyaltyDiscount =
  new OrderIsHighValue(100)
    .and(new CustomerIsInGoodStanding());

// ── Usage in application layer ───────────────────────────
function checkShippingOptions(order) {
  const options = ['standard'];

  if (new OrderIsEligibleForFreeShipping().isSatisfiedBy(order)) {
    options.push('free-standard');
  }

  if (eligibleForPriorityShipping.isSatisfiedBy(order)) {
    options.push('priority');
  }

  return options;
}

// Filter a list using specifications
function getHighValueDomesticOrders(orders) {
  const spec = new OrderIsHighValue().and(new OrderShipsToCountry('US'));
  return spec.filter(orders);
}`,
      explanation: "The Specification pattern turns business rules into first-class objects that are named (self-documenting), testable (each spec is its own unit test target), composable (combine with and/or/not), and reusable (use the same spec in services, repositories, and validation). Without this pattern, rules like 'eligible for priority shipping' get buried in if-statements scattered across multiple services. With Specifications, the business logic is explicit — you can read 'OrderIsHighValue AND OrderHasAllItemsInStock AND OrderShipsToCountry(US)' and immediately understand the rule. The filter() utility method lets you use specs to query collections, making them useful for both validation and querying.",
      order_index: 4,
    },
    {
      title: "Domain Service vs Application Service",
      description: "A clear comparison showing a Domain Service (PricingService with business logic) vs an Application Service (PlaceOrderHandler with orchestration only) to demonstrate the critical difference.",
      language: "javascript",
      code: `// ═══════════════════════════════════════════════════════════
// DOMAIN SERVICE — contains business logic
// Lives in: src/domain/pricing/PricingService.js
// Depends on: nothing outside domain layer
// ═══════════════════════════════════════════════════════════
class PricingService {
  /**
   * Calculate the final price for an order.
   * This is domain logic that doesn't belong to Order or Customer:
   * - It needs info from both Order and Customer
   * - It applies complex pricing rules
   * - It's purely business logic — no I/O, no DB
   */
  calculateFinalPrice(order, customer, promotions) {
    let total = order.subtotal;

    // Business rule: loyalty discount for long-term customers
    if (customer.memberSince.yearsAgo >= 2) {
      const loyaltyDiscount = total.multiply(0.05);
      total = total.subtract(loyaltyDiscount);
    }

    // Business rule: apply best promotion (non-stackable)
    const applicablePromos = promotions.filter(p => p.isApplicableTo(order));
    if (applicablePromos.length > 0) {
      const bestPromo = applicablePromos.reduce((best, p) =>
        p.discountAmount(total).isGreaterThan(best.discountAmount(total)) ? p : best
      );
      total = total.subtract(bestPromo.discountAmount(total));
    }

    // Business rule: minimum order total after discounts
    const minimum = Money.of(1.00, total.currency);
    if (total.amount < minimum.amount) {
      total = minimum;
    }

    return total;
  }
}

// ═══════════════════════════════════════════════════════════
// APPLICATION SERVICE — orchestration only, NO business logic
// Lives in: src/application/PlaceOrderHandler.js
// Depends on: domain layer, repository interfaces
// ═══════════════════════════════════════════════════════════
class PlaceOrderHandler {
  constructor({
    orderRepo,
    customerRepo,
    promotionRepo,
    pricingService,
    eventBus,
    unitOfWork,
  }) {
    this.orderRepo = orderRepo;
    this.customerRepo = customerRepo;
    this.promotionRepo = promotionRepo;
    this.pricingService = pricingService;
    this.eventBus = eventBus;
    this.unitOfWork = unitOfWork;
  }

  async handle(command) {
    // Step 1: Load data (orchestration)
    const order = await this.orderRepo.findById(command.orderId);
    if (!order) throw new Error('Order not found');

    const customer = await this.customerRepo.findById(order.customerId);
    const promotions = await this.promotionRepo.findActive();

    // Step 2: Call domain logic (delegate to domain service & aggregate)
    const finalPrice = this.pricingService.calculateFinalPrice(
      order, customer, promotions
    );
    order.setFinalPrice(finalPrice);
    order.place(); // business logic is inside the aggregate

    // Step 3: Persist (orchestration)
    await this.unitOfWork.execute(async () => {
      await this.orderRepo.save(order);
    });

    // Step 4: Publish events (orchestration)
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // Step 5: Return result
    return { orderId: order.id, total: finalPrice.toString(), status: order.status.value };
  }
}

// The key insight: PlaceOrderHandler has no if-statements about
// business rules. All business decisions are made by the domain
// layer (PricingService + Order aggregate). The application
// service just orchestrates the workflow.`,
      explanation: "This example draws a sharp line between Domain Services and Application Services. The PricingService is a Domain Service — it contains pure business logic (loyalty discounts, promotion rules, minimum pricing) with zero infrastructure dependencies. It doesn't know about databases, HTTP, or transactions. The PlaceOrderHandler is an Application Service — it orchestrates the use case by loading data from repositories, calling domain logic, persisting changes, and publishing events. Notice it has no business rules — no if-statements about pricing or eligibility. If a business rule changes (e.g., loyalty discount becomes 10%), only PricingService changes. If the persistence technology changes, only the repository implementation changes. The application service remains stable.",
      order_index: 5,
    },
    {
      title: "Domain Events with Event Dispatcher Inside a Bounded Context",
      description: "A complete implementation of domain events within a single Bounded Context, showing the AggregateRoot base class, event creation, dispatcher registration, and handler execution.",
      language: "javascript",
      code: `import crypto from 'node:crypto';

// ── Domain Event base ────────────────────────────────────
class DomainEvent {
  constructor(type, aggregateId, payload) {
    this.eventId = crypto.randomUUID();
    this.type = type;
    this.aggregateId = aggregateId;
    this.occurredAt = new Date().toISOString();
    this.payload = Object.freeze({ ...payload });
    Object.freeze(this);
  }
}

// ── Aggregate Root base class ────────────────────────────
class AggregateRoot {
  #domainEvents = [];
  #version = 0;

  get version() { return this.#version; }

  addDomainEvent(event) {
    this.#domainEvents.push(event);
  }

  pullDomainEvents() {
    const events = [...this.#domainEvents];
    this.#domainEvents = [];
    return events;
  }

  incrementVersion() { this.#version++; }
}

// ── Event Dispatcher ─────────────────────────────────────
class DomainEventDispatcher {
  #handlers = new Map();

  register(eventType, handler) {
    if (!this.#handlers.has(eventType)) {
      this.#handlers.set(eventType, []);
    }
    this.#handlers.get(eventType).push(handler);
    return this; // fluent interface
  }

  async dispatch(events) {
    for (const event of events) {
      const handlers = this.#handlers.get(event.type) || [];
      for (const handler of handlers) {
        try {
          await handler.handle(event);
        } catch (error) {
          console.error(
            \\\`Handler failed for \\\${event.type}: \\\${error.message}\\\`
          );
          // In production: send to dead letter queue, retry later
        }
      }
    }
  }
}

// ── Concrete Event ───────────────────────────────────────
class AccountCredited extends DomainEvent {
  constructor(accountId, amount, currency, transactionId) {
    super('AccountCredited', accountId, {
      amount, currency, transactionId,
    });
  }
}

class AccountDebited extends DomainEvent {
  constructor(accountId, amount, currency, transactionId) {
    super('AccountDebited', accountId, {
      amount, currency, transactionId,
    });
  }
}

// ── Bank Account Aggregate ───────────────────────────────
class BankAccount extends AggregateRoot {
  #id;
  #balance;
  #ownerId;

  constructor(id, ownerId, initialBalance = Money.zero()) {
    super();
    this.#id = id;
    this.#ownerId = ownerId;
    this.#balance = initialBalance;
  }

  credit(amount, transactionId) {
    this.#balance = this.#balance.add(amount);
    this.incrementVersion();

    this.addDomainEvent(new AccountCredited(
      this.#id, amount.amount, amount.currency, transactionId
    ));
  }

  debit(amount, transactionId) {
    if (amount.isGreaterThan(this.#balance)) {
      throw new Error('Insufficient funds');
    }
    this.#balance = this.#balance.subtract(amount);
    this.incrementVersion();

    this.addDomainEvent(new AccountDebited(
      this.#id, amount.amount, amount.currency, transactionId
    ));
  }

  get id() { return this.#id; }
  get balance() { return this.#balance; }
}

// ── Event Handlers ───────────────────────────────────────
class UpdateTransactionLog {
  constructor(transactionLogRepo) {
    this.repo = transactionLogRepo;
  }

  async handle(event) {
    await this.repo.append({
      transactionId: event.payload.transactionId,
      accountId: event.aggregateId,
      type: event.type,
      amount: event.payload.amount,
      occurredAt: event.occurredAt,
    });
  }
}

class CheckFraudAlert {
  async handle(event) {
    if (event.payload.amount > 10000) {
      console.log(\\\`[FRAUD ALERT] Large transaction: \\\${event.payload.amount}\\\`);
      // Notify fraud team
    }
  }
}

// ── Wiring ───────────────────────────────────────────────
const dispatcher = new DomainEventDispatcher();
dispatcher
  .register('AccountCredited', new UpdateTransactionLog(txLogRepo))
  .register('AccountDebited', new UpdateTransactionLog(txLogRepo))
  .register('AccountDebited', new CheckFraudAlert());

// ── Application Service uses it ──────────────────────────
async function transferMoney(fromId, toId, amount) {
  const from = await accountRepo.findById(fromId);
  const to = await accountRepo.findById(toId);
  const txId = crypto.randomUUID();

  from.debit(amount, txId);
  to.credit(amount, txId);

  await accountRepo.save(from);
  await accountRepo.save(to);

  // Dispatch events after persistence
  await dispatcher.dispatch(from.pullDomainEvents());
  await dispatcher.dispatch(to.pullDomainEvents());
}`,
      explanation: "This shows the complete lifecycle of domain events within a Bounded Context: (1) Events are defined as immutable data classes extending DomainEvent. (2) Aggregates collect events internally via addDomainEvent() when state changes. (3) The application layer pulls events after persistence (not before — you don't want to publish events for changes that failed to save). (4) The DomainEventDispatcher routes events to registered handlers. (5) Handlers are single-purpose — UpdateTransactionLog writes a log, CheckFraudAlert flags suspicious activity. This separation means adding new reactions to 'AccountDebited' (like sending an SMS) requires only registering a new handler — zero changes to the aggregate or application service.",
      order_index: 6,
    },
    {
      title: "Factory Pattern for Complex Aggregate Creation",
      description: "An OrderFactory demonstrating two creation paths — creating a new order from a shopping cart (with validation and events) and reconstituting an order from database data (without validation or events).",
      language: "javascript",
      code: `// ── Order Factory ─────────────────────────────────────────
// Encapsulates complex aggregate creation logic.
// Two paths: creation (new order) and reconstitution (from DB).
class OrderFactory {
  /**
   * Create a new Order from a shopping cart.
   * This path validates business rules and records a domain event.
   */
  static createFromCart({ cart, customerId, shippingAddress, idGenerator }) {
    // Validate prerequisites
    if (!cart || cart.items.length === 0) {
      throw new Error('Cannot create order from empty cart');
    }
    if (!shippingAddress) {
      throw new Error('Shipping address is required');
    }

    // Generate identity
    const orderId = idGenerator ? idGenerator() : crypto.randomUUID();

    // Create the aggregate
    const order = new Order(orderId, customerId, shippingAddress);

    // Add items from cart — Order.addItem enforces its own invariants
    for (const cartItem of cart.items) {
      order.addItem(
        cartItem.productId,
        cartItem.productName,
        Money.of(cartItem.unitPrice, cartItem.currency),
        cartItem.quantity
      );
    }

    // Record creation event
    order.addDomainEvent({
      type: 'OrderCreated',
      orderId,
      customerId,
      itemCount: cart.items.length,
      occurredAt: new Date().toISOString(),
    });

    return order;
  }

  /**
   * Reconstitute an Order from database data.
   * This path skips validation and does NOT record events —
   * the data is already valid (it was validated on creation).
   */
  static reconstitute(data) {
    // Bypass constructor validation — data is already valid
    const order = Object.create(Order.prototype);

    // Manually set private fields via a special reconstitute method
    // or use a symbol-based approach
    order._reconstituteFrom({
      id: data.id,
      customerId: data.customerId,
      status: OrderStatus.from(data.status),
      shippingAddress: Address.reconstitute(data.shippingAddress),
      items: data.items.map(itemData =>
        OrderLineItem.reconstitute({
          id: itemData.id,
          productId: itemData.productId,
          productName: itemData.productName,
          unitPrice: Money.of(itemData.unitPriceAmount, itemData.unitPriceCurrency),
          quantity: itemData.quantity,
        })
      ),
      createdAt: new Date(data.createdAt),
      version: data.version,
    });

    return order;
  }

  /**
   * Create a draft order for a repeat/reorder scenario.
   * Copies items from a previous order but generates new IDs.
   */
  static createReorder(previousOrder, customerId, shippingAddress) {
    const orderId = crypto.randomUUID();
    const order = new Order(orderId, customerId, shippingAddress);

    for (const item of previousOrder.items) {
      order.addItem(
        item.productId,
        item.productName,
        item.unitPrice,   // Reuse the Value Object (it's immutable!)
        item.quantity
      );
    }

    return order;
  }
}

// ── Usage in Application Service ─────────────────────────
class CreateOrderFromCartHandler {
  constructor(cartRepo, orderRepo, eventBus) {
    this.cartRepo = cartRepo;
    this.orderRepo = orderRepo;
    this.eventBus = eventBus;
  }

  async handle(command) {
    const cart = await this.cartRepo.findByCustomerId(command.customerId);

    // Factory handles the complex creation logic
    const order = OrderFactory.createFromCart({
      cart,
      customerId: command.customerId,
      shippingAddress: Address.create(command.shippingAddress),
    });

    await this.orderRepo.save(order);

    // Publish creation events
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return { orderId: order.id };
  }
}`,
      explanation: "The Factory pattern solves a critical DDD problem: aggregate creation can be complex, and there are usually multiple creation paths. The createFromCart() method handles new order creation — it validates input, generates IDs, maps cart items to order items, and records a domain event. The reconstitute() method handles loading from the database — it skips validation (data was already validated when first created) and doesn't emit events (loading isn't a business event). The createReorder() method handles a third path — creating an order from a previous one. Note how Value Objects like Money can be safely reused between orders because they're immutable. Without a Factory, this complex creation logic would either bloat the Order constructor or scatter across multiple services.",
      order_index: 7,
    },
  ],
};
