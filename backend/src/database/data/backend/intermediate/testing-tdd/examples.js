// ============================================================================
// Testing & TDD — Code Examples
// ============================================================================

const examples = {
  'unit-testing-jest': [
    {
      title: "Testing an Express Route with Supertest",
      description: "Integration test for an API endpoint.",
      language: "javascript",
      code: `import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../app.js';
import pool from '../config/database.js';

describe('GET /api/products', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('returns a list of products', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
  });

  it('filters by search query', async () => {
    const res = await request(app)
      .get('/api/products?search=laptop')
      .expect(200);

    res.body.data.forEach(product => {
      expect(product.name.toLowerCase()).toContain('laptop');
    });
  });

  it('requires auth for POST', async () => {
    await request(app)
      .post('/api/products')
      .send({ name: 'Test', price: 10 })
      .expect(401);
  });

  it('creates product with valid auth', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', \`Bearer \${loginRes.body.token}\`)
      .send({ name: 'New Product', price: 49.99, description: 'A test product' })
      .expect(201);

    expect(res.body.name).toBe('New Product');
    expect(res.body.id).toBeDefined();
  });
});`,
      explanation: "Supertest makes HTTP requests to your Express app without starting a server. This integration test verifies the full request lifecycle including middleware, validation, and database.",
      order_index: 1,
    },
  ],
};

export default examples;
