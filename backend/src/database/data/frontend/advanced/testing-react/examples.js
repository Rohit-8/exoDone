// ============================================================================
// Testing React Apps — Code Examples
// ============================================================================

const examples = {
  'rtl-jest-fundamentals': [
    {
      title: "Testing a Login Form",
      description: "Integration test with form validation and API mock.",
      language: "javascript",
      code: `import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

// Mock the API module
jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

import { authAPI } from '../services/api';

describe('LoginForm', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test('submits credentials and redirects on success', async () => {
    authAPI.login.mockResolvedValue({ data: { token: 'abc123' } });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'alice@test.com',
        password: 'Password123',
      });
    });
  });

  test('displays error message on login failure', async () => {
    authAPI.login.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'badpass');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});`,
      explanation: "This test file shows: mocking external modules, testing form validation UX, testing success and error flows, and using waitFor for async assertions.",
      order_index: 1,
    },
  ],
};

export default examples;
