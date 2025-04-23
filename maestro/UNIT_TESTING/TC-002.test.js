import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import Index from '../../app/index'; // Adjust the import path if necessary
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext'; 

// Mocking expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(), // Also mock replace as it's used in useEffect
  },
  Link: ({ children, href }) => <mock-link href={href}>{children}</mock-link>, // Basic mock for Link
}));

// Mocking the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));


describe('Index Screen', () => {
  beforeEach(() => {
    // Reset the mock before each test
    router.push.mockClear();
    router.replace.mockClear();
    // Default mock implementation for useAuth - assume not authenticated initially
    useAuth.mockReturnValue({ user: { isAuthenticated: false, roleId: null } });
  });

  test('pressing "Get Started" navigates to "/sign-up"', async () => {
    render(<Index />);

    // Wait for the loading state to clear and the buttons to appear
    await waitFor(() => {
        // Ensure the ActivityIndicator is not present
        expect(screen.queryByTestId('activity-indicator')).toBeNull();
        // Ensure the "GET STARTED" button is present
        expect(screen.getByText('GET STARTED')).toBeVisible();
    }, { timeout: 2000 }); // Increase timeout if needed

    const getStartedButton = screen.getByText('GET STARTED');

    // Simulate a press on the button
    fireEvent.press(getStartedButton);

    // Assert that router.push was called with the correct path
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/sign-up');
  });

  test('redirects to /home if user is authenticated and roleId is 1', async () => {
    // Mock useAuth to return an authenticated user with roleId 1
    useAuth.mockReturnValue({ user: { isAuthenticated: true, roleId: 1 } });

    render(<Index />);

    // Wait for the useEffect to potentially trigger the redirect
    await waitFor(() => {
        expect(router.replace).toHaveBeenCalledTimes(1);
        expect(router.replace).toHaveBeenCalledWith('/home');
    }, { timeout: 1500 }); // Adjust timeout as needed
  });
});