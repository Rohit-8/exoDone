import pool from '../config/database.js';

async function addMoreTopics() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding additional topics to match README structure...\n');

    // Get category IDs
    const categories = await client.query('SELECT id, slug FROM categories');
    const catMap = {};
    categories.rows.forEach(row => {
      catMap[row.slug] = row.id;
    });

    // Add more Architecture topics
    console.log('Adding Architecture topics...');
    await client.query(`
      INSERT INTO topics (category_id, name, slug, description, difficulty_level, order_index)
      VALUES 
      ($1, 'Cloud Architecture', 'cloud-architecture', 'Learn cloud-native design, serverless, and multi-cloud strategies', 'advanced', 5),
      ($1, 'API Design & Best Practices', 'api-design', 'Master RESTful API design, GraphQL, and API versioning strategies', 'intermediate', 6),
      ($1, 'Caching Strategies', 'caching-strategies', 'Deep dive into caching patterns, Redis, CDN, and cache invalidation', 'intermediate', 7),
      ($1, 'Database Design & Optimization', 'database-design', 'SQL vs NoSQL, sharding, replication, indexing, and query optimization', 'intermediate', 8)
      ON CONFLICT (slug) DO NOTHING
    `, [catMap['architecture']]);

    // Add more Backend topics
    console.log('Adding Backend topics...');
    await client.query(`
      INSERT INTO topics (category_id, name, slug, description, difficulty_level, order_index)
      VALUES 
      ($1, 'Authentication & Authorization', 'auth-security', 'JWT, OAuth 2.0, RBAC, session management, and security best practices', 'intermediate', 5),
      ($1, 'Testing & TDD', 'testing-tdd', 'Unit testing, integration testing, mocking, and test-driven development', 'intermediate', 6),
      ($1, 'Domain-Driven Design', 'domain-driven-design', 'DDD principles, bounded contexts, aggregates, and domain events', 'advanced', 7),
      ($1, 'Event-Driven Architecture', 'event-driven-architecture', 'Message queues, pub/sub, event sourcing, and CQRS patterns', 'advanced', 8),
      ($1, 'API Development', 'api-development', 'Building RESTful APIs, validation, error handling, and documentation', 'beginner', 9),
      ($1, 'Database Integration', 'database-integration', 'ORMs, transactions, migrations, and database best practices', 'intermediate', 10)
      ON CONFLICT (slug) DO NOTHING
    `, [catMap['backend']]);

    // Add more Frontend topics
    console.log('Adding Frontend topics...');
    await client.query(`
      INSERT INTO topics (category_id, name, slug, description, difficulty_level, order_index)
      VALUES 
      ($1, 'State Management', 'state-management', 'Redux, Zustand, Context API, and when to use each', 'intermediate', 5),
      ($1, 'React Router & Navigation', 'react-router', 'Client-side routing, protected routes, and navigation patterns', 'beginner', 6),
      ($1, 'Forms & Validation', 'forms-validation', 'React Hook Form, Formik, validation schemas, and complex forms', 'intermediate', 7),
      ($1, 'TypeScript with React', 'typescript-react', 'Typing components, props, hooks, and advanced TypeScript patterns', 'advanced', 8),
      ($1, 'Testing React Apps', 'testing-react', 'Jest, React Testing Library, mocking, and E2E testing', 'advanced', 9),
      ($1, 'Next.js & SSR', 'nextjs-ssr', 'Server-side rendering, static generation, and Next.js fundamentals', 'advanced', 10)
      ON CONFLICT (slug) DO NOTHING
    `, [catMap['frontend']]);

    await client.query('COMMIT');
    
    // Show updated count
    const topicsResult = await client.query('SELECT COUNT(*) FROM topics');
    const lessonsResult = await client.query('SELECT COUNT(*) FROM lessons');
    
    console.log('\n✅ Topics added successfully!');
    console.log(`📊 Total Topics: ${topicsResult.rows[0].count}`);
    console.log(`📚 Total Lessons: ${lessonsResult.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

addMoreTopics()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
