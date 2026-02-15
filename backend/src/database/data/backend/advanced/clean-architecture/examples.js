// ============================================================================
// Clean Architecture — Code Examples
// ============================================================================

const examples = {
  'layers-dependency-rule': [
    {
      title: "Wiring It Together — Composition Root",
      description: "Dependency injection at the application boundary.",
      language: "javascript",
      code: `// infrastructure/container.js — Composition Root
import pool from '../config/database.js';
import PostgresUserRepository from './PostgresUserRepository.js';
import PostgresOrderRepository from './PostgresOrderRepository.js';
import StripePaymentGateway from './StripePaymentGateway.js';
import EmailNotifier from './EmailNotifier.js';
import CreateOrderUseCase from '../application/CreateOrder.js';
import GetUserProfileUseCase from '../application/GetUserProfile.js';

// Instantiate infrastructure
const userRepo = new PostgresUserRepository(pool);
const orderRepo = new PostgresOrderRepository(pool);
const paymentGateway = new StripePaymentGateway(process.env.STRIPE_KEY);
const notifier = new EmailNotifier(process.env.SMTP_URL);

// Wire use cases with their dependencies
export const createOrder = new CreateOrderUseCase(orderRepo, paymentGateway, notifier);
export const getUserProfile = new GetUserProfileUseCase(userRepo);

// Controllers receive use cases, NOT infrastructure
// controller.js:
// import { createOrder } from '../infrastructure/container.js';
// router.post('/orders', (req, res) => {
//   const order = await createOrder.execute(req.body);
//   res.status(201).json(order);
// });`,
      explanation: "The Composition Root is the ONLY place that knows about concrete implementations. Everything else depends on abstractions (ports). Swapping PostgreSQL for MongoDB means changing only this file.",
      order_index: 1,
    },
  ],
  'ports-adapters-hexagonal': [
    {
      title: "Swappable Cache Adapter",
      description: "Cache port with Redis and in-memory adapters.",
      language: "javascript",
      code: `// Port
class CachePort {
  async get(key) { throw new Error('Not implemented'); }
  async set(key, value, ttlSeconds) { throw new Error('Not implemented'); }
  async delete(key) { throw new Error('Not implemented'); }
}

// Redis adapter (production)
class RedisCacheAdapter extends CachePort {
  constructor(redisClient) { super(); this.client = redisClient; }
  async get(key) {
    const val = await this.client.get(key);
    return val ? JSON.parse(val) : null;
  }
  async set(key, value, ttl = 3600) {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }
  async delete(key) { await this.client.del(key); }
}

// In-memory adapter (development / tests)
class MemoryCacheAdapter extends CachePort {
  #store = new Map();
  async get(key) {
    const entry = this.#store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.#store.delete(key); return null; }
    return entry.value;
  }
  async set(key, value, ttl = 3600) {
    this.#store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  }
  async delete(key) { this.#store.delete(key); }
}

// Use Case — doesn't care which adapter
class ProductService {
  constructor(productRepo, cache) {
    this.productRepo = productRepo;
    this.cache = cache;
  }

  async getProduct(id) {
    const cached = await this.cache.get(\`product:\${id}\`);
    if (cached) return cached;

    const product = await this.productRepo.findById(id);
    if (product) await this.cache.set(\`product:\${id}\`, product, 600);
    return product;
  }
}`,
      explanation: "The ProductService depends on the CachePort abstraction. In production, inject RedisCacheAdapter. In tests, inject MemoryCacheAdapter. Zero code changes required.",
      order_index: 1,
    },
  ],
};

export default examples;
