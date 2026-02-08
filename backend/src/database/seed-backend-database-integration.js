import pool from '../config/database.js';

async function seedDatabaseIntegration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Database Integration lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'database-integration'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Database Integration & ORMs', 'database-integration-orms', $2, 'Master database integration using modern ORMs, handle transactions, migrations, and query optimization', 'intermediate', 55, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Database Integration & ORMs

## What is an ORM?

**ORM** (Object-Relational Mapping) is a technique that lets you query and manipulate data from a database using an object-oriented paradigm. ORMs abstract away SQL queries and allow you to work with database records as objects.

### Benefits of ORMs

✅ **Type Safety**: Get compile-time type checking (especially with TypeScript)
✅ **Less Boilerplate**: Write less repetitive SQL code
✅ **Migration Management**: Track and version database schema changes
✅ **Database Agnostic**: Switch between databases more easily
✅ **Security**: Built-in protection against SQL injection
✅ **Developer Experience**: Better autocomplete and IDE support

### Drawbacks

❌ **Learning Curve**: Need to learn ORM-specific syntax
❌ **Performance**: Can generate inefficient queries
❌ **Complexity**: Complex queries may be harder in ORM
❌ **Abstraction Leakage**: Sometimes need raw SQL anyway

## Popular Node.js ORMs

| ORM | Type Safety | Learning Curve | Performance |
|-----|-------------|----------------|-------------|
| Prisma | ⭐⭐⭐⭐⭐ | Medium | Excellent |
| TypeORM | ⭐⭐⭐⭐ | Medium | Good |
| Sequelize | ⭐⭐⭐ | High | Good |
| Drizzle | ⭐⭐⭐⭐⭐ | Low | Excellent |

## Prisma Setup

### Installation

\\\`\\\`\\\`bash
npm install prisma @prisma/client
npx prisma init
\\\`\\\`\\\`

### Schema Definition (schema.prisma)

\\\`\\\`\\\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
\\\`\\\`\\\`

### Generate Client

\\\`\\\`\\\`bash
npx prisma generate
npx prisma db push  # Apply schema to database
\\\`\\\`\\\`

## Basic CRUD Operations

### Setup Prisma Client

\\\`\\\`\\\`typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;
\\\`\\\`\\\`

### Create Operations

\\\`\\\`\\\`typescript
// Create single user
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
  },
});

// Create with nested relations
const userWithPost = await prisma.user.create({
  data: {
    email: 'jane@example.com',
    name: 'Jane Smith',
    posts: {
      create: [
        {
          title: 'My First Post',
          content: 'Hello World!',
          published: true,
        },
        {
          title: 'Draft Post',
          content: 'Work in progress...',
          published: false,
        },
      ],
    },
  },
  include: {
    posts: true,
  },
});

// Bulk create
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' },
  ],
  skipDuplicates: true, // Skip if email already exists
});
\\\`\\\`\\\`

### Read Operations

\\\`\\\`\\\`typescript
// Find unique
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
  include: { posts: true },
});

// Find first matching
const firstPublishedPost = await prisma.post.findFirst({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
});

// Find many with filtering
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@example.com',
    },
    posts: {
      some: {
        published: true,
      },
    },
  },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0, // For pagination
});

// Count
const userCount = await prisma.user.count({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
});
\\\`\\\`\\\`

### Update Operations

\\\`\\\`\\\`typescript
// Update single
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'John Updated',
  },
});

// Update many
const result = await prisma.post.updateMany({
  where: {
    published: false,
    createdAt: {
      lt: new Date('2024-01-01'),
    },
  },
  data: {
    published: true,
  },
});

// Upsert (update or create)
const user = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: {
    name: 'John Doe Updated',
  },
  create: {
    email: 'john@example.com',
    name: 'John Doe',
  },
});
\\\`\\\`\\\`

### Delete Operations

\\\`\\\`\\\`typescript
// Delete single
const deletedUser = await prisma.user.delete({
  where: { id: 1 },
});

// Delete many
const result = await prisma.post.deleteMany({
  where: {
    published: false,
    createdAt: {
      lt: new Date('2023-01-01'),
    },
  },
});
\\\`\\\`\\\`

## Transactions

### Sequential Transactions

\\\`\\\`\\\`typescript
// Simple transaction
const [user, post] = await prisma.\\\$transaction([
  prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  }),
  prisma.post.create({
    data: {
      title: 'Alice First Post',
      content: 'Hello from Alice!',
      authorId: 1, // Will be replaced with actual ID
    },
  }),
]);
\\\`\\\`\\\`

### Interactive Transactions

\\\`\\\`\\\`typescript
interface TransferInput {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
}

async function transferMoney(input: TransferInput) {
  return await prisma.\\\$transaction(async (tx) => {
    // Get source account
    const fromAccount = await tx.account.findUnique({
      where: { id: input.fromAccountId },
    });

    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    if (fromAccount.balance < input.amount) {
      throw new Error('Insufficient funds');
    }

    // Deduct from source
    await tx.account.update({
      where: { id: input.fromAccountId },
      data: {
        balance: {
          decrement: input.amount,
        },
      },
    });

    // Add to destination
    await tx.account.update({
      where: { id: input.toAccountId },
      data: {
        balance: {
          increment: input.amount,
        },
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        amount: input.amount,
        type: 'TRANSFER',
      },
    });

    return { success: true };
  }, {
    maxWait: 5000, // Maximum wait time to get a connection
    timeout: 10000, // Maximum transaction time
  });
}
\\\`\\\`\\\`

## Migrations

### Create Migration

\\\`\\\`\\\`bash
# Create migration from schema changes
npx prisma migrate dev --name add-user-role

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
\\\`\\\`\\\`

### Migration Best Practices

1. **Always review generated SQL** before applying
2. **Test migrations** on staging environment first
3. **Use transactions** for data migrations
4. **Keep migrations small** and focused
5. **Never modify existing migrations** after they are applied

### Data Migration Example

\\\`\\\`\\\`typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserData() {
  console.log('Starting data migration...');

  const users = await prisma.user.findMany();

  for (const user of users) {
    // Example: Generate username from email
    const username = user.email.split('@')[0];

    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
  }

  console.log(\\\`Migrated \\\${users.length} users\\\`);
}

migrateUserData()
  .catch(console.error)
  .finally(() => prisma.\\\$disconnect());
\\\`\\\`\\\`

## Query Optimization

### Use Select to Limit Fields

\\\`\\\`\\\`typescript
// Bad: Fetch all fields
const users = await prisma.user.findMany({
  include: { posts: true },
});

// Good: Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    posts: {
      select: {
        id: true,
        title: true,
        published: true,
      },
    },
  },
});
\\\`\\\`\\\`

### Use Indexes

\\\`\\\`\\\`prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  authorId  Int
  published Boolean
  createdAt DateTime @default(now())

  @@index([authorId])
  @@index([published, createdAt])
  @@index([authorId, published])
}
\\\`\\\`\\\`

### Batch Queries

\\\`\\\`\\\`typescript
// Bad: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
  // Process posts...
}

// Good: Single query with include
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
});
\\\`\\\`\\\`

### Raw SQL for Complex Queries

\\\`\\\`\\\`typescript
// When ORM generates inefficient SQL
const result = await prisma.\\\$queryRaw\\\`
  SELECT 
    u.id,
    u.name,
    COUNT(p.id) as post_count,
    AVG(p.likes) as avg_likes
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  WHERE p.published = true
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > 5
  ORDER BY avg_likes DESC
  LIMIT 10
\\\`;
\\\`\\\`\\\`

## Connection Pooling

\\\`\\\`\\\`typescript
// Configure connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// Properly close connections
process.on('beforeExit', async () => {
  await prisma.\\\$disconnect();
});
\\\`\\\`\\\`

## TypeORM Alternative

\\\`\\\`\\\`typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: false })
  published: boolean;

  @ManyToOne(() => User, user => user.posts)
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Usage
const userRepository = dataSource.getRepository(User);
const user = await userRepository.findOne({
  where: { email: 'john@example.com' },
  relations: ['posts'],
});
\\\`\\\`\\\`

## Best Practices

1. **Use transactions** for operations that must succeed or fail together
2. **Add indexes** on frequently queried columns
3. **Use connection pooling** to manage database connections efficiently
4. **Select only needed fields** to reduce data transfer
5. **Handle errors properly** with try-catch and rollback
6. **Use migrations** to track schema changes
7. **Monitor query performance** with logging
8. **Avoid N+1 queries** by using includes or joins
9. **Use raw SQL** when ORM is inefficient
10. **Close connections** when application shuts down`,
      [
        'ORMs provide type-safe database access and reduce boilerplate code',
        'Use transactions to ensure data consistency across multiple operations',
        'Migrations track and version database schema changes',
        'Optimize queries by selecting only needed fields and using indexes',
        'Monitor query performance and use raw SQL for complex queries'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Prisma CRUD Operations', 'Complete user and post management with Prisma', 'typescript', $2, 'Shows how to perform all CRUD operations with relations using Prisma ORM', 1),
      ($1, 'Transaction Example', 'Money transfer with proper error handling', 'typescript', $3, 'Demonstrates how to use interactive transactions for complex operations', 2),
      ($1, 'Query Optimization', 'Efficient database queries', 'typescript', $4, 'Shows techniques to optimize database queries and avoid common pitfalls', 3)
    `, [
      lesson.rows[0].id,
      `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create user with posts
async function createUserWithPosts(email: string, name: string) {
  return await prisma.user.create({
    data: {
      email,
      name,
      posts: {
        create: [
          {
            title: 'First Post',
            content: 'Hello World!',
            published: true,
          },
        ],
      },
    },
    include: {
      posts: true,
    },
  });
}

// Get user with published posts
async function getUserWithPublishedPosts(userId: number) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

// Update post
async function updatePost(postId: number, data: { title?: string; content?: string; published?: boolean }) {
  return await prisma.post.update({
    where: { id: postId },
    data,
  });
}

// Delete user and cascade delete posts
async function deleteUser(userId: number) {
  // Delete posts first if no cascade
  await prisma.post.deleteMany({
    where: { authorId: userId },
  });

  return await prisma.user.delete({
    where: { id: userId },
  });
}

// Pagination
async function getPaginatedPosts(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: pageSize,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count(),
  ]);

  return {
    posts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}`,
      `interface TransferInput {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
}

async function transferMoney(input: TransferInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Fetch source account with lock
      const fromAccount = await tx.account.findUnique({
        where: { id: input.fromAccountId },
      });

      if (!fromAccount) {
        throw new Error('Source account not found');
      }

      if (fromAccount.balance < input.amount) {
        throw new Error('Insufficient funds');
      }

      // Fetch destination account
      const toAccount = await tx.account.findUnique({
        where: { id: input.toAccountId },
      });

      if (!toAccount) {
        throw new Error('Destination account not found');
      }

      // Deduct from source
      await tx.account.update({
        where: { id: input.fromAccountId },
        data: {
          balance: {
            decrement: input.amount,
          },
        },
      });

      // Add to destination
      await tx.account.update({
        where: { id: input.toAccountId },
        data: {
          balance: {
            increment: input.amount,
          },
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          amount: input.amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
        },
      });

      return {
        success: true,
        transaction,
        newFromBalance: fromAccount.balance - input.amount,
        newToBalance: toAccount.balance + input.amount,
      };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}`,
      `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bad: N+1 query problem
async function getUsersWithPostsBad() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // This creates N additional queries
    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
    });
    user.posts = posts;
  }
  
  return users;
}

// Good: Single query with include
async function getUsersWithPostsGood() {
  return await prisma.user.findMany({
    include: {
      posts: true,
    },
  });
}

// Better: Select only needed fields
async function getUsersWithPostsOptimized() {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      posts: {
        select: {
          id: true,
          title: true,
          published: true,
          createdAt: true,
        },
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
}

// Raw SQL for complex aggregations
async function getPostStatistics() {
  const result = await prisma.$queryRaw\`
    SELECT 
      u.id,
      u.name,
      COUNT(p.id) as post_count,
      COUNT(CASE WHEN p.published = true THEN 1 END) as published_count,
      AVG(CHAR_LENGTH(p.content)) as avg_content_length
    FROM users u
    LEFT JOIN posts p ON p.author_id = u.id
    GROUP BY u.id, u.name
    HAVING COUNT(p.id) > 0
    ORDER BY post_count DESC
    LIMIT 10
  \`;
  
  return result;
}

// Batch insert with transaction
async function batchCreateUsers(userData: Array<{ email: string; name: string }>) {
  return await prisma.$transaction(
    userData.map(data => 
      prisma.user.create({ data })
    )
  );
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the main benefit of using an ORM like Prisma?', 'multiple_choice', $2, 'Type-safe database access with less boilerplate', 'ORMs provide type safety, reduce boilerplate code, and offer better developer experience with autocomplete and compile-time checks.', 'easy', 10, 1),
      ($1, 'When should you use transactions in database operations?', 'multiple_choice', $3, 'When multiple operations must succeed or fail together', 'Transactions ensure atomicity - either all operations succeed or all fail. This is critical for operations like money transfers where consistency is required.', 'medium', 15, 2),
      ($1, 'What is the N+1 query problem?', 'multiple_choice', $4, 'Making N additional queries inside a loop instead of using joins', 'The N+1 problem occurs when you fetch N records and then make N additional queries to fetch related data. This should be avoided by using includes/joins.', 'medium', 15, 3),
      ($1, 'Which Prisma method allows you to update a record if it exists, or create it if it does not?', 'multiple_choice', $5, 'upsert', 'The upsert method combines update and insert operations - it updates the record if it exists (based on unique fields) or creates it if it does not.', 'easy', 10, 4),
      ($1, 'What is the purpose of database migrations?', 'multiple_choice', $6, 'To track and version database schema changes over time', 'Migrations provide a version-controlled way to evolve your database schema. They track changes, allow rollbacks, and ensure consistency across environments.', 'medium', 15, 5)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Faster query execution', 'Type-safe database access with less boilerplate', 'Automatic database optimization', 'Built-in caching']),
      JSON.stringify(['Only for write operations', 'When multiple operations must succeed or fail together', 'For all database queries', 'Only when using PostgreSQL']),
      JSON.stringify(['Making N additional queries inside a loop instead of using joins', 'Having N+1 tables in your database', 'Using 1 more connection than needed', 'Querying N+1 records at once']),
      JSON.stringify(['updateOrCreate', 'upsert', 'merge', 'insertOrUpdate']),
      JSON.stringify(['To backup database data', 'To track and version database schema changes over time', 'To improve query performance', 'To encrypt database connections'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Database Integration lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedDatabaseIntegration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
