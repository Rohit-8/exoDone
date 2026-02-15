// ============================================================================
// Testing React Apps — Content
// ============================================================================

export const topic = {
  "name": "Testing React Apps",
  "slug": "testing-react",
  "description": "Write reliable tests with React Testing Library and Jest — unit, integration, and component testing.",
  "estimated_time": 180,
  "order_index": 9
};

export const lessons = [
  {
    title: "React Testing Library & Jest Fundamentals",
    slug: "rtl-jest-fundamentals",
    summary: "Set up Jest with React Testing Library, write accessible queries, and test user interactions.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "React Testing Library encourages testing behavior, not implementation details",
  "Prefer accessible queries: getByRole, getByLabelText, getByPlaceholderText",
  "userEvent is preferred over fireEvent for realistic interactions",
  "Use findBy* for async elements and waitFor for async assertions",
  "Mock API calls with msw (Mock Service Worker) for integration tests"
],
    content: `# React Testing Library & Jest

## Setup

\`\`\`bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest
\`\`\`

## Query Priority (Most to Least Preferred)

1. **getByRole** — accessible by everyone
2. **getByLabelText** — form elements
3. **getByPlaceholderText** — input hints
4. **getByText** — visible text
5. **getByTestId** — last resort

## Testing User Interactions

\`\`\`jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

test('increments counter on button click', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  const button = screen.getByRole('button', { name: /increment/i });
  const display = screen.getByText(/count: 0/i);

  await user.click(button);
  await user.click(button);

  expect(screen.getByText(/count: 2/i)).toBeInTheDocument();
});
\`\`\`

## Testing Forms

\`\`\`jsx
test('submits form with user data', async () => {
  const user = userEvent.setup();
  const handleSubmit = jest.fn();
  render(<SignupForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/name/i), 'Alice');
  await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'Alice',
    email: 'alice@example.com',
  });
});
\`\`\`

## Async Testing

\`\`\`jsx
test('loads and displays users', async () => {
  render(<UserList />);

  // findBy waits for the element to appear
  const users = await screen.findAllByRole('listitem');
  expect(users).toHaveLength(3);
});
\`\`\`
`,
  },
];
