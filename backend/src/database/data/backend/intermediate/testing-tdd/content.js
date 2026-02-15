// ============================================================================
// Testing & TDD — Content
// ============================================================================

export const topic = {
  "name": "Testing & TDD",
  "slug": "testing-tdd",
  "description": "Write reliable backend tests with Jest and supertest — unit tests, integration tests, and test-driven development.",
  "estimated_time": 200,
  "order_index": 6
};

export const lessons = [
  {
    title: "Unit Testing with Jest",
    slug: "unit-testing-jest",
    summary: "Write and organize unit tests using Jest, with assertions, mocking, and test-driven development.",
    difficulty_level: "intermediate",
    estimated_time: 35,
    order_index: 1,
    key_points: [
  "Unit tests verify individual functions/modules in isolation",
  "Use describe/it blocks to organize tests logically",
  "Jest matchers: toBe, toEqual, toThrow, toHaveBeenCalled, etc.",
  "Mocking isolates the unit under test from its dependencies",
  "TDD cycle: Red → Green → Refactor"
],
    content: `# Unit Testing with Jest

## Test Structure

\`\`\`javascript
import { calculateDiscount, validateEmail } from './utils.js';

describe('calculateDiscount', () => {
  it('applies percentage discount correctly', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  it('returns 0 for 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('throws for negative discount', () => {
    expect(() => calculateDiscount(100, -10)).toThrow('Invalid discount');
  });

  it('throws for discount over 100%', () => {
    expect(() => calculateDiscount(100, 110)).toThrow('Invalid discount');
  });
});

describe('validateEmail', () => {
  it.each([
    ['user@example.com', true],
    ['invalid-email', false],
    ['user@.com', false],
    ['a@b.co', true],
  ])('validates "%s" as %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
\`\`\`

## Mocking Dependencies

\`\`\`javascript
import { jest } from '@jest/globals';
import { UserService } from './UserService.js';

describe('UserService', () => {
  let userService;
  let mockRepo;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    userService = new UserService(mockRepo);
  });

  it('returns user by id', async () => {
    const fakeUser = { id: 1, name: 'Alice' };
    mockRepo.findById.mockResolvedValue(fakeUser);

    const user = await userService.getUser(1);

    expect(user).toEqual(fakeUser);
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });

  it('throws when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(userService.getUser(999))
      .rejects.toThrow('User not found');
  });
});
\`\`\`

## TDD Cycle — Red, Green, Refactor

1. **Red**: Write a failing test first
2. **Green**: Write the minimum code to pass
3. **Refactor**: Improve the code while tests stay green

\`\`\`javascript
// 1. RED — write the test first
describe('PasswordValidator', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('short')).toEqual({
      valid: false,
      errors: ['Must be at least 8 characters'],
    });
  });
});

// 2. GREEN — write minimal implementation
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('Must be at least 8 characters');
  return { valid: errors.length === 0, errors };
}

// 3. REFACTOR — add more rules, keep tests green
\`\`\`
`,
  },
];
