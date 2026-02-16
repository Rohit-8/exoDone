// ============================================================================
// Design Patterns — Code Examples
// ============================================================================

const examples = {
  'creational-patterns': [
    {
      title: "Plugin System with Factory Method and Singleton Registry",
      description: "A plugin registry (Singleton) that uses Factory Method to create and manage plugins by type. Demonstrates how creational patterns combine in real architectures.",
      language: "javascript",
      code: `// ---- Singleton Plugin Registry ----
class PluginRegistry {
  static #instance = null;
  #plugins = new Map();
  #factories = new Map();

  constructor() {
    if (PluginRegistry.#instance) {
      return PluginRegistry.#instance;
    }
    PluginRegistry.#instance = this;
  }

  static getInstance() {
    if (!PluginRegistry.#instance) {
      PluginRegistry.#instance = new PluginRegistry();
    }
    return PluginRegistry.#instance;
  }

  // Register a factory function for a plugin type
  registerFactory(type, factoryFn) {
    if (this.#factories.has(type)) {
      throw new Error(\`Factory for "\${type}" already registered\`);
    }
    this.#factories.set(type, factoryFn);
    console.log(\`[Registry] Factory registered: \${type}\`);
  }

  // Factory Method — create plugin by type
  create(type, config = {}) {
    const factory = this.#factories.get(type);
    if (!factory) {
      const available = [...this.#factories.keys()].join(', ');
      throw new Error(\`Unknown plugin type: "\${type}". Available: \${available}\`);
    }
    const plugin = factory(config);
    const id = \`\${type}_\${Date.now()}_\${Math.random().toString(36).slice(2, 6)}\`;
    this.#plugins.set(id, { type, plugin, createdAt: new Date() });
    console.log(\`[Registry] Created plugin: \${id}\`);
    return { id, plugin };
  }

  getAll() {
    return [...this.#plugins.entries()].map(([id, info]) => ({
      id,
      type: info.type,
      createdAt: info.createdAt,
    }));
  }

  static reset() { PluginRegistry.#instance = null; }
}

// ---- Concrete Plugins ----
class LoggerPlugin {
  constructor({ level = 'info', prefix = '' }) {
    this.level = level;
    this.prefix = prefix;
  }
  log(message) {
    console.log(\`[\${this.level.toUpperCase()}] \${this.prefix}\${message}\`);
  }
}

class CachePlugin {
  constructor({ maxSize = 100, ttl = 60000 }) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  set(key, value) {
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttl });
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
}

// ---- Register Factories & Use ----
const registry = PluginRegistry.getInstance();

registry.registerFactory('logger', (config) => new LoggerPlugin(config));
registry.registerFactory('cache', (config) => new CachePlugin(config));

const { plugin: logger } = registry.create('logger', { level: 'warn', prefix: '[App] ' });
logger.log('Something might be wrong');  // [WARN] [App] Something might be wrong

const { plugin: cache } = registry.create('cache', { maxSize: 50, ttl: 30000 });
cache.set('user:1', { name: 'Alice' });
console.log(cache.get('user:1'));  // { name: 'Alice' }

// Singleton guarantee
const registry2 = PluginRegistry.getInstance();
console.log(registry === registry2);  // true
console.log(registry2.getAll().length);  // 2`,
      explanation: "This example combines Singleton (one global registry) with Factory Method (create plugins by type string). The registry stores factory functions and instantiates plugins on demand — a common pattern in frameworks like Express (middleware), Webpack (loaders), and Babel (plugins). The registry doesn't know about concrete plugin classes, only their factory functions.",
      order_index: 1,
    },
    {
      title: "HTTP Request Builder with Prototype Cloning",
      description: "A Builder pattern for constructing HTTP requests with a fluent API, combined with Prototype to clone base configurations for different API clients.",
      language: "javascript",
      code: `// ---- Builder Pattern for HTTP Requests ----
class RequestBuilder {
  #method = 'GET';
  #url = '';
  #headers = {};
  #query = {};
  #body = null;
  #timeout = 30000;
  #retries = 0;

  constructor(baseConfig = {}) {
    if (baseConfig._snapshot) {
      // Restore from prototype clone
      Object.assign(this, baseConfig._snapshot);
      this.#method = baseConfig._snapshot.method;
      this.#url = baseConfig._snapshot.url;
      this.#headers = { ...baseConfig._snapshot.headers };
      this.#query = { ...baseConfig._snapshot.query };
      this.#timeout = baseConfig._snapshot.timeout;
      this.#retries = baseConfig._snapshot.retries;
    }
  }

  method(m)         { this.#method = m.toUpperCase(); return this; }
  url(u)            { this.#url = u; return this; }
  header(key, val)  { this.#headers[key] = val; return this; }
  queryParam(k, v)  { this.#query[k] = v; return this; }
  body(data)        { this.#body = data; return this; }
  timeout(ms)       { this.#timeout = ms; return this; }
  retries(n)        { this.#retries = n; return this; }

  // Prototype: snapshot current state for cloning
  _getSnapshot() {
    return {
      method: this.#method,
      url: this.#url,
      headers: { ...this.#headers },
      query: { ...this.#query },
      timeout: this.#timeout,
      retries: this.#retries,
    };
  }

  // Clone current builder state (Prototype pattern)
  clone() {
    return new RequestBuilder({ _snapshot: this._getSnapshot() });
  }

  build() {
    const queryString = Object.entries(this.#query)
      .map(([k, v]) => \`\${encodeURIComponent(k)}=\${encodeURIComponent(v)}\`)
      .join('&');

    const fullUrl = queryString ? \`\${this.#url}?\${queryString}\` : this.#url;

    return Object.freeze({
      method: this.#method,
      url: fullUrl,
      headers: { ...this.#headers },
      body: this.#body,
      timeout: this.#timeout,
      retries: this.#retries,
    });
  }
}

// ---- Create a base builder (prototype) for an API ----
const apiBase = new RequestBuilder()
  .url('https://api.example.com')
  .header('Content-Type', 'application/json')
  .header('Accept', 'application/json')
  .timeout(10000)
  .retries(2);

// Clone the base and customize for specific endpoints
const getUsers = apiBase.clone()
  .url('https://api.example.com/users')
  .queryParam('page', 1)
  .queryParam('limit', 20)
  .build();

const createUser = apiBase.clone()
  .method('POST')
  .url('https://api.example.com/users')
  .header('Authorization', 'Bearer token123')
  .body({ name: 'Alice', email: 'alice@test.com' })
  .build();

console.log(getUsers);
// { method: 'GET', url: 'https://api.example.com/users?page=1&limit=20',
//   headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
//   body: null, timeout: 10000, retries: 2 }

console.log(createUser);
// { method: 'POST', url: 'https://api.example.com/users',
//   headers: { ..., Authorization: 'Bearer token123' },
//   body: { name: 'Alice', email: 'alice@test.com' }, timeout: 10000, retries: 2 }

// Original base is untouched (deep clone)
console.log(apiBase._getSnapshot().method); // 'GET'`,
      explanation: "The Builder pattern provides a fluent API (.method().url().header()) for step-by-step construction, avoiding a constructor with 8+ parameters. The Prototype pattern (clone()) lets you create a base configuration and derive specialized requests from it without mutation — exactly how HTTP client libraries like Axios work internally with instance defaults.",
      order_index: 2,
    },
  ],
  'structural-behavioral-patterns': [
    {
      title: "Middleware Pipeline with Chain of Responsibility and Decorator",
      description: "An Express-style middleware pipeline (Chain of Responsibility) where individual handlers are enhanced with logging and error-handling decorators.",
      language: "javascript",
      code: `// ---- Chain of Responsibility: Middleware Pipeline ----
class MiddlewarePipeline {
  #middlewares = [];

  use(fn) {
    this.#middlewares.push(fn);
    return this;
  }

  async execute(context) {
    let index = 0;
    const middlewares = this.#middlewares;

    const next = async () => {
      if (index >= middlewares.length) return;
      const current = middlewares[index++];
      await current(context, next);
    };

    await next();
    return context;
  }
}

// ---- Decorator: wrap any middleware with error handling ----
function withErrorHandling(middlewareFn, name = 'middleware') {
  return async (ctx, next) => {
    try {
      await middlewareFn(ctx, next);
    } catch (err) {
      console.error(\`[ERROR in \${name}] \${err.message}\`);
      ctx.status = ctx.status || 500;
      ctx.body = { error: err.message, middleware: name };
      // Don't call next() — stop the chain on error
    }
  };
}

// ---- Decorator: wrap any middleware with timing ----
function withTiming(middlewareFn, name = 'middleware') {
  return async (ctx, next) => {
    const start = Date.now();
    await middlewareFn(ctx, next);
    const duration = Date.now() - start;
    ctx.timings = ctx.timings || {};
    ctx.timings[name] = duration;
    console.log(\`[\${name}] completed in \${duration}ms\`);
  };
}

// ---- Define raw middleware handlers ----
async function authMiddleware(ctx, next) {
  const token = ctx.headers?.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No auth token provided');
  // Simulate token verification
  ctx.user = { id: 1, name: 'Alice', role: 'admin' };
  await next();
}

async function validateMiddleware(ctx, next) {
  if (ctx.method === 'POST' && !ctx.body) {
    throw new Error('Request body is required for POST');
  }
  ctx.validated = true;
  await next();
}

async function rateLimitMiddleware(ctx, next) {
  // Simulate rate limit check
  const requestCount = 5; // would come from Redis/memory store
  if (requestCount > 100) throw new Error('Rate limit exceeded');
  ctx.rateLimited = false;
  await next();
}

async function businessLogic(ctx, next) {
  ctx.status = 200;
  ctx.body = {
    message: \`Hello, \${ctx.user.name}!\`,
    validated: ctx.validated,
    timestamp: new Date().toISOString(),
  };
}

// ---- Compose the pipeline with decorated middleware ----
const pipeline = new MiddlewarePipeline();

pipeline
  .use(withTiming(withErrorHandling(rateLimitMiddleware, 'rateLimit'), 'rateLimit'))
  .use(withTiming(withErrorHandling(authMiddleware, 'auth'), 'auth'))
  .use(withTiming(withErrorHandling(validateMiddleware, 'validate'), 'validate'))
  .use(withTiming(withErrorHandling(businessLogic, 'handler'), 'handler'));

// ---- Execute ----
const ctx = await pipeline.execute({
  method: 'GET',
  path: '/api/profile',
  headers: { authorization: 'Bearer valid-token-123' },
});

console.log('Response:', ctx.body);
// Response: { message: 'Hello, Alice!', validated: true, timestamp: '...' }
console.log('Timings:', ctx.timings);
// Timings: { rateLimit: 0, auth: 1, validate: 0, handler: 0 }`,
      explanation: "This combines Chain of Responsibility (the pipeline passes context through a chain of middleware via next()) with Decorator (withErrorHandling and withTiming wrap each middleware to add cross-cutting concerns without modifying the original functions). This is exactly how production Express/Koa apps are structured — raw handler logic stays clean while decorators add logging, error handling, and metrics.",
      order_index: 1,
    },
    {
      title: "Shopping Cart with Observer, Strategy, and Command Patterns",
      description: "A shopping cart that uses Observer for event notification, Strategy for discount calculations, and Command for undo/redo of cart actions.",
      language: "javascript",
      code: `// ---- Observer: Event Bus ----
class EventBus {
  #listeners = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.#listeners.get(event)?.delete(handler);
  }

  emit(event, data) {
    this.#listeners.get(event)?.forEach(handler => handler(data));
  }
}

// ---- Strategy: Discount Calculators ----
const discountStrategies = {
  none:       (total) => ({ discount: 0, final: total, label: 'No discount' }),
  percentage: (total, pct) => {
    const discount = +(total * pct / 100).toFixed(2);
    return { discount, final: +(total - discount).toFixed(2), label: \`\${pct}% off\` };
  },
  fixed:      (total, amount) => {
    const discount = Math.min(amount, total);
    return { discount, final: +(total - discount).toFixed(2), label: \`$\${amount} off\` };
  },
  buyXgetY:   (total, items, buyX, getY) => {
    // For every buyX items, getY free (cheapest)
    const sorted = [...items].sort((a, b) => a.price - b.price);
    let freeCount = Math.floor(sorted.length / (buyX + getY)) * getY;
    let discount = 0;
    for (let i = 0; i < freeCount && i < sorted.length; i++) {
      discount += sorted[i].price;
    }
    return { discount: +discount.toFixed(2), final: +(total - discount).toFixed(2), label: \`Buy \${buyX} get \${getY} free\` };
  },
};

// ---- Command: Cart Actions with Undo ----
class AddToCartCommand {
  constructor(cart, item) { this.cart = cart; this.item = item; }
  execute() { this.cart._items.push({ ...this.item }); }
  undo() { this.cart._items = this.cart._items.filter(i => i.id !== this.item.id); }
}

class RemoveFromCartCommand {
  constructor(cart, itemId) { this.cart = cart; this.itemId = itemId; this.removed = null; }
  execute() {
    const idx = this.cart._items.findIndex(i => i.id === this.itemId);
    if (idx !== -1) this.removed = this.cart._items.splice(idx, 1)[0];
  }
  undo() { if (this.removed) this.cart._items.push(this.removed); }
}

class UpdateQuantityCommand {
  constructor(cart, itemId, qty) { this.cart = cart; this.itemId = itemId; this.qty = qty; this.prev = null; }
  execute() {
    const item = this.cart._items.find(i => i.id === this.itemId);
    if (item) { this.prev = item.quantity; item.quantity = this.qty; }
  }
  undo() {
    const item = this.cart._items.find(i => i.id === this.itemId);
    if (item && this.prev !== null) item.quantity = this.prev;
  }
}

// ---- Shopping Cart: brings it all together ----
class ShoppingCart {
  _items = [];
  #events = new EventBus();
  #history = [];
  #redoStack = [];
  #discountStrategy = 'none';
  #discountParams = [];

  // Observer: subscribe to cart events
  on(event, handler) { return this.#events.on(event, handler); }

  // Strategy: set discount algorithm
  setDiscount(strategy, ...params) {
    this.#discountStrategy = strategy;
    this.#discountParams = params;
  }

  // Command: execute with history tracking
  #execute(command) {
    command.execute();
    this.#history.push(command);
    this.#redoStack = [];
    this.#events.emit('cart:updated', this.getSummary());
  }

  addItem(item) { this.#execute(new AddToCartCommand(this, item)); }
  removeItem(id) { this.#execute(new RemoveFromCartCommand(this, id)); }
  updateQuantity(id, qty) { this.#execute(new UpdateQuantityCommand(this, id, qty)); }

  undo() {
    const cmd = this.#history.pop();
    if (!cmd) return;
    cmd.undo();
    this.#redoStack.push(cmd);
    this.#events.emit('cart:updated', this.getSummary());
    this.#events.emit('cart:undo', { action: cmd.constructor.name });
  }

  redo() {
    const cmd = this.#redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.#history.push(cmd);
    this.#events.emit('cart:updated', this.getSummary());
  }

  getSummary() {
    const subtotal = +this._items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
    const strategyFn = discountStrategies[this.#discountStrategy] || discountStrategies.none;
    const pricing = strategyFn(subtotal, ...this.#discountParams, this._items);
    return {
      itemCount: this._items.length,
      items: this._items.map(i => ({ ...i })),
      subtotal,
      ...pricing,
    };
  }
}

// ---- Usage ----
const cart = new ShoppingCart();

// Observer: listen for updates
const unsub = cart.on('cart:updated', (summary) => {
  console.log(\`Cart: \${summary.itemCount} items, $\${summary.final}\`);
});
cart.on('cart:undo', (data) => console.log(\`Undid: \${data.action}\`));

// Strategy: apply 15% discount
cart.setDiscount('percentage', 15);

// Command: add items
cart.addItem({ id: 1, name: 'Laptop', price: 999, quantity: 1 });
// Cart: 1 items, $849.15

cart.addItem({ id: 2, name: 'Mouse', price: 29, quantity: 2 });
// Cart: 2 items, $898.45

cart.undo();
// Undid: AddToCartCommand
// Cart: 1 items, $849.15

cart.redo();
// Cart: 2 items, $898.45

unsub(); // unsubscribe from updates`,
      explanation: "This real-world example integrates three behavioral/creational patterns: Observer (EventBus notifies UI of cart changes), Strategy (swappable discount algorithms: percentage, fixed, buyXgetY), and Command (every cart action is an undoable/redoable object). This mirrors how production e-commerce carts work — Redux uses similar observer patterns, pricing engines use strategies, and undo systems use command stacks.",
      order_index: 2,
    },
  ],
};

export default examples;
