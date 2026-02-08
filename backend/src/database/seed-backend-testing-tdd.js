import pool from '../config/database.js';

async function seedTestingTDD() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Adding Testing & TDD lesson...');

    const topicsResult = await client.query("SELECT id FROM topics WHERE slug = 'testing-tdd'");
    const topicId = topicsResult.rows[0].id;

    const lesson = await client.query(`
      INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points) VALUES
      ($1, 'Unit Testing & Test-Driven Development', 'unit-testing-tdd', $2, 'Master unit testing with Jest, mocking, test-driven development, and integration testing strategies', 'intermediate', 60, 1, $3)
      RETURNING id
    `, [
      topicId,
      `# Unit Testing & Test-Driven Development

## What is Unit Testing?

**Unit testing** is the practice of testing individual units or components of software in isolation. A unit is the smallest testable part of an application - typically a function, method, or class.

### Benefits of Unit Testing

✅ **Early Bug Detection**: Catch bugs before they reach production
✅ **Documentation**: Tests serve as living documentation
✅ **Refactoring Confidence**: Change code without fear
✅ **Better Design**: Writing testable code leads to better architecture
✅ **Faster Development**: Less time debugging
✅ **Regression Prevention**: Ensure old bugs do not come back

## Test-Driven Development (TDD)

TDD is a development approach where you write tests **before** writing the actual code.

### The TDD Cycle: Red-Green-Refactor

1. **🔴 Red**: Write a failing test
2. **🟢 Green**: Write minimal code to make it pass
3. **🔵 Refactor**: Improve code while keeping tests green

### Benefits of TDD

✅ Forces you to think about requirements first
✅ Ensures 100% test coverage
✅ Leads to simpler, more modular design
✅ Provides immediate feedback
✅ Reduces debugging time

## Jest Setup

### Installation

\\\`\\\`\\\`bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @jest/globals
\\\`\\\`\\\`

### Configuration (jest.config.js)

\\\`\\\`\\\`javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
\\\`\\\`\\\`

### Package.json Scripts

\\\`\\\`\\\`json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
\\\`\\\`\\\`

## Basic Test Structure

### Simple Function Test

\\\`\\\`\\\`typescript
// src/utils/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}

// tests/utils/math.test.ts
import { add, subtract, divide } from '../../src/utils/math';

describe('Math utilities', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    it('should handle zero', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('should handle negative results', () => {
      expect(subtract(3, 5)).toBe(-2);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });

    it('should handle decimal results', () => {
      expect(divide(5, 2)).toBe(2.5);
    });
  });
});
\\\`\\\`\\\`

## Testing Async Code

\\\`\\\`\\\`typescript
// src/services/user.service.ts
export class UserService {
  async fetchUser(id: number): Promise<User> {
    const response = await fetch(\\\`/api/users/\\\${id}\\\`);
    if (!response.ok) {
      throw new Error('User not found');
    }
    return response.json();
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

// tests/services/user.service.test.ts
import { UserService } from '../../src/services/user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('fetchUser', () => {
    it('should fetch user successfully', async () => {
      const user = await service.fetchUser(1);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(1);
    });

    it('should throw error for non-existent user', async () => {
      await expect(service.fetchUser(999)).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const user = await service.createUser(userData);

      expect(user).toMatchObject(userData);
      expect(user.id).toBeDefined();
    });
  });
});
\\\`\\\`\\\`

## Mocking

### Mocking Functions

\\\`\\\`\\\`typescript
// src/services/email.service.ts
export class EmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Actual email sending logic
    console.log(\\\`Sending email to \\\${to}\\\`);
  }
}

export class UserService {
  constructor(private emailService: EmailService) {}

  async registerUser(email: string, name: string): Promise<User> {
    const user = await this.createUser({ email, name });
    
    await this.emailService.sendEmail(
      email,
      'Welcome!',
      \\\`Hello \\\${name}, welcome to our platform!\\\`
    );

    return user;
  }

  private async createUser(data: any): Promise<User> {
    // Create user logic
    return { id: 1, ...data };
  }
}

// tests/services/user.service.test.ts
import { UserService } from '../../src/services/user.service';
import { EmailService } from '../../src/services/email.service';

jest.mock('../../src/services/email.service');

describe('UserService', () => {
  let userService: UserService;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    emailService = new EmailService() as jest.Mocked<EmailService>;
    emailService.sendEmail = jest.fn().mockResolvedValue(undefined);
    userService = new UserService(emailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create user and send welcome email', async () => {
      const email = 'john@example.com';
      const name = 'John Doe';

      const user = await userService.registerUser(email, name);

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);

      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        email,
        'Welcome!',
        \\\`Hello \\\${name}, welcome to our platform!\\\`
      );
    });

    it('should create user even if email fails', async () => {
      emailService.sendEmail.mockRejectedValue(new Error('Email service down'));

      await expect(
        userService.registerUser('john@example.com', 'John')
      ).rejects.toThrow('Email service down');
    });
  });
});
\\\`\\\`\\\`

### Mocking Modules

\\\`\\\`\\\`typescript
// src/utils/api.ts
import axios from 'axios';

export async function fetchData(url: string) {
  const response = await axios.get(url);
  return response.data;
}

// tests/utils/api.test.ts
import axios from 'axios';
import { fetchData } from '../../src/utils/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockedAxios.get.mockResolvedValue({ data: mockData });

    const result = await fetchData('/api/test');

    expect(result).toEqual(mockData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/test');
  });

  it('should handle errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    await expect(fetchData('/api/test')).rejects.toThrow('Network error');
  });
});
\\\`\\\`\\\`

## Test Doubles

### Spies, Stubs, and Mocks

\\\`\\\`\\\`typescript
// Spy: Watches function calls without changing behavior
const spy = jest.spyOn(console, 'log');
console.log('Hello');
expect(spy).toHaveBeenCalledWith('Hello');
spy.mockRestore();

// Stub: Replaces function with predetermined behavior
const stub = jest.fn().mockReturnValue(42);
expect(stub()).toBe(42);

// Mock: Verifies function calls and provides fake implementation
const mock = jest.fn()
  .mockReturnValueOnce(1)
  .mockReturnValueOnce(2)
  .mockReturnValue(3);

expect(mock()).toBe(1);
expect(mock()).toBe(2);
expect(mock()).toBe(3);
expect(mock()).toBe(3);
\\\`\\\`\\\`

## Integration Testing

\\\`\\\`\\\`typescript
// tests/integration/api.test.ts
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear data before each test
    await prisma.user.deleteMany();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(userData);
      expect(response.body.data.id).toBeDefined();

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeDefined();
      expect(user?.name).toBe(userData.name);
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      // Create first user
      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' }) // Missing email
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const response = await request(app)
        .get(\\\`/api/users/\\\${user.id}\\\`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});
\\\`\\\`\\\`

## Test Organization

### AAA Pattern (Arrange-Act-Assert)

\\\`\\\`\\\`typescript
describe('Calculator', () => {
  it('should add two numbers', () => {
    // Arrange: Set up test data
    const calculator = new Calculator();
    const a = 5;
    const b = 3;

    // Act: Execute the function being tested
    const result = calculator.add(a, b);

    // Assert: Verify the result
    expect(result).toBe(8);
  });
});
\\\`\\\`\\\`

### Setup and Teardown

\\\`\\\`\\\`typescript
describe('UserService', () => {
  let service: UserService;
  let database: Database;

  // Runs once before all tests in this describe block
  beforeAll(async () => {
    database = await Database.connect();
  });

  // Runs before each test
  beforeEach(() => {
    service = new UserService(database);
  });

  // Runs after each test
  afterEach(async () => {
    await database.clear();
  });

  // Runs once after all tests
  afterAll(async () => {
    await database.disconnect();
  });

  it('test 1', () => {
    // Test code
  });

  it('test 2', () => {
    // Test code
  });
});
\\\`\\\`\\\`

## Test Coverage

\\\`\\\`\\\`bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
\\\`\\\`\\\`

### Coverage Metrics

- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of conditional branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

### Coverage Goals

- **Critical Code**: 100% coverage (payment, security)
- **Business Logic**: 90-100% coverage
- **Utilities**: 80-90% coverage
- **Configuration**: 60-80% coverage

## Best Practices

1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**: Focus on what code does, not how
3. **One assertion per test**: Makes failures easier to diagnose
4. **Use descriptive test names**: Should explain what is being tested
5. **Keep tests independent**: Tests should not depend on each other
6. **Mock external dependencies**: Tests should be fast and reliable
7. **Test edge cases**: Empty arrays, null values, boundary conditions
8. **Maintain tests**: Update tests when requirements change
9. **Avoid testing private methods**: Test public interface
10. **Use test fixtures**: Reusable test data

## Common Pitfalls

❌ **Testing implementation details**: Tests break when refactoring
❌ **Flaky tests**: Tests that sometimes pass, sometimes fail
❌ **Slow tests**: Tests that take too long discourage running them
❌ **Too many mocks**: Over-mocking makes tests meaningless
❌ **No negative tests**: Only testing happy path
❌ **Large test files**: Hard to navigate and maintain
❌ **Tight coupling**: Tests depend on specific implementation

## TDD Example: String Calculator

\\\`\\\`\\\`typescript
// Step 1: Red - Write failing test
describe('StringCalculator', () => {
  it('should return 0 for empty string', () => {
    const calculator = new StringCalculator();
    expect(calculator.add('')).toBe(0);
  });
});

// Step 2: Green - Make it pass
class StringCalculator {
  add(numbers: string): number {
    return 0;
  }
}

// Step 3: More tests
it('should return number for single number', () => {
  const calculator = new StringCalculator();
  expect(calculator.add('5')).toBe(5);
});

// Step 4: Update implementation
class StringCalculator {
  add(numbers: string): number {
    if (numbers === '') return 0;
    return parseInt(numbers);
  }
}

// Step 5: More tests
it('should add two numbers', () => {
  const calculator = new StringCalculator();
  expect(calculator.add('1,2')).toBe(3);
});

// Step 6: Final implementation
class StringCalculator {
  add(numbers: string): number {
    if (numbers === '') return 0;
    
    const nums = numbers.split(',').map(n => parseInt(n));
    return nums.reduce((sum, n) => sum + n, 0);
  }
}

// Step 7: Refactor while keeping tests green
class StringCalculator {
  add(numbers: string): number {
    if (!numbers) return 0;
    
    return numbers
      .split(',')
      .map(Number)
      .reduce((sum, num) => sum + num, 0);
  }
}
\\\`\\\`\\\``,
      [
        'Unit tests verify individual components in isolation',
        'TDD follows Red-Green-Refactor cycle: write failing test, make it pass, improve code',
        'Use mocks and stubs to isolate code from external dependencies',
        'Integration tests verify multiple components working together',
        'Aim for high test coverage on critical business logic'
      ]
    ]);

    await client.query(`
      INSERT INTO code_examples (lesson_id, title, description, language, code, explanation, order_index) VALUES
      ($1, 'Basic Jest Testing', 'Testing functions with different scenarios', 'typescript', $2, 'Shows how to write unit tests with Jest, including edge cases and error handling', 1),
      ($1, 'Mocking Dependencies', 'Testing with mocked services', 'typescript', $3, 'Demonstrates how to mock external dependencies to isolate code under test', 2),
      ($1, 'Integration Testing', 'Testing API endpoints end-to-end', 'typescript', $4, 'Shows how to write integration tests for API endpoints with database interactions', 3),
      ($1, 'TDD Example', 'Building string calculator with TDD', 'typescript', $5, 'Step-by-step example of test-driven development approach', 4)
    `, [
      lesson.rows[0].id,
      `import { add, subtract, divide } from '../../src/utils/math';

describe('Math utilities', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    it('should handle zero', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
    });

    it('should handle decimal numbers', () => {
      expect(add(2.5, 3.5)).toBe(6);
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('should handle negative results', () => {
      expect(subtract(3, 5)).toBe(-2);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });

    it('should handle decimal results', () => {
      expect(divide(5, 2)).toBe(2.5);
    });

    it('should handle negative numbers', () => {
      expect(divide(-10, 2)).toBe(-5);
      expect(divide(10, -2)).toBe(-5);
    });
  });
});`,
      `import { UserService } from '../../src/services/user.service';
import { EmailService } from '../../src/services/email.service';

jest.mock('../../src/services/email.service');

describe('UserService', () => {
  let userService: UserService;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    emailService = new EmailService() as jest.Mocked<EmailService>;
    emailService.sendEmail = jest.fn().mockResolvedValue(undefined);
    userService = new UserService(emailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create user and send welcome email', async () => {
      const email = 'john@example.com';
      const name = 'John Doe';

      const user = await userService.registerUser(email, name);

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);

      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        email,
        'Welcome!',
        expect.stringContaining(name)
      );
    });

    it('should handle email service failure', async () => {
      emailService.sendEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        userService.registerUser('john@example.com', 'John')
      ).rejects.toThrow('SMTP error');
    });

    it('should validate email format', async () => {
      await expect(
        userService.registerUser('invalid-email', 'John')
      ).rejects.toThrow('Invalid email');
    });
  });
});`,
      `import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User API Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(userData);
      expect(response.body.data.id).toBeDefined();

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      const response = await request(app)
        .get(\`/api/users/\${user.id}\`)
        .expect(200);

      expect(response.body.data.id).toBe(user.id);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/999')
        .expect(404);
    });
  });
});`,
      `// Step 1: Write first failing test
describe('StringCalculator', () => {
  it('should return 0 for empty string', () => {
    const calculator = new StringCalculator();
    expect(calculator.add('')).toBe(0);
  });
});

// Step 2: Make it pass with minimal code
class StringCalculator {
  add(numbers: string): number {
    return 0;
  }
}

// Step 3: Add test for single number
it('should return number for single number', () => {
  const calculator = new StringCalculator();
  expect(calculator.add('5')).toBe(5);
});

// Step 4: Update implementation
class StringCalculator {
  add(numbers: string): number {
    if (numbers === '') return 0;
    return parseInt(numbers);
  }
}

// Step 5: Add test for two numbers
it('should add two comma-separated numbers', () => {
  const calculator = new StringCalculator();
  expect(calculator.add('1,2')).toBe(3);
  expect(calculator.add('10,20')).toBe(30);
});

// Step 6: Implement addition
class StringCalculator {
  add(numbers: string): number {
    if (numbers === '') return 0;
    
    const nums = numbers.split(',').map(n => parseInt(n));
    return nums.reduce((sum, n) => sum + n, 0);
  }
}

// Step 7: Add test for multiple numbers
it('should add multiple numbers', () => {
  const calculator = new StringCalculator();
  expect(calculator.add('1,2,3,4,5')).toBe(15);
});

// Step 8: Refactor (implementation already handles this)
// Tests still pass!

// Step 9: Add test for newline separator
it('should handle newlines as separator', () => {
  const calculator = new StringCalculator();
  expect(calculator.add('1\\n2,3')).toBe(6);
});

// Step 10: Update implementation
class StringCalculator {
  add(numbers: string): number {
    if (!numbers) return 0;
    
    return numbers
      .replace(/\\n/g, ',')
      .split(',')
      .map(Number)
      .reduce((sum, num) => sum + num, 0);
  }
}`
    ]);

    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, order_index) VALUES
      ($1, 'What is the correct order of steps in the TDD cycle?', 'multiple_choice', $2, 'Red (write failing test) -> Green (make it pass) -> Refactor', 'TDD follows the Red-Green-Refactor cycle: first write a failing test (Red), then write minimal code to make it pass (Green), finally improve the code while keeping tests green (Refactor).', 'easy', 10, 1),
      ($1, 'What is the purpose of mocking in unit tests?', 'multiple_choice', $3, 'To isolate the code under test from external dependencies', 'Mocking allows you to replace real dependencies with controlled fake implementations, ensuring tests are fast, reliable, and focus only on the code being tested.', 'medium', 15, 2),
      ($1, 'Which Jest matcher should you use to test if a function throws an error?', 'multiple_choice', $4, 'toThrow()', 'The toThrow() matcher is used to test if a function throws an error. You must wrap the function call in another function: expect(() => fn()).toThrow().', 'easy', 10, 3),
      ($1, 'What is the N+1 problem in the context of integration tests?', 'multiple_choice', $5, 'Making N additional database queries in a loop instead of one efficient query', 'The N+1 problem occurs when you make one query to fetch N records, then make N additional queries to fetch related data. This should be avoided by using joins or eager loading.', 'medium', 15, 4),
      ($1, 'What is the recommended test coverage percentage for critical business logic?', 'multiple_choice', $6, '90-100%', 'Critical business logic like payments, security, and core features should have 90-100% test coverage to ensure reliability and catch bugs early.', 'easy', 10, 5)
    `, [
      lesson.rows[0].id,
      JSON.stringify(['Red (write failing test) -> Green (make it pass) -> Refactor', 'Green (write code) -> Red (write test) -> Refactor', 'Refactor -> Red -> Green', 'Red -> Refactor -> Green']),
      JSON.stringify(['To make tests run faster', 'To isolate the code under test from external dependencies', 'To increase test coverage', 'To avoid writing actual implementation']),
      JSON.stringify(['toThrow()', 'toError()', 'toFail()', 'toReject()']),
      JSON.stringify(['Having N+1 test files', 'Making N+1 assertions in a test', 'Making N additional database queries in a loop instead of one efficient query', 'Running tests N+1 times']),
      JSON.stringify(['50-60%', '70-80%', '90-100%', '100% always'])
    ]);

    await client.query('COMMIT');
    console.log('✅ Testing & TDD lesson added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedTestingTDD()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
