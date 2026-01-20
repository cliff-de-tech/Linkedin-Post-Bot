// Jest setup file
// Add custom jest matchers for DOM testing
require('@testing-library/jest-dom');

// Mock next/router
jest.mock('next/router', () => ({
    useRouter: () => ({
        route: '/',
        pathname: '/',
        query: {},
        asPath: '/',
        push: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
        back: jest.fn(),
        prefetch: jest.fn().mockResolvedValue(undefined),
        beforePopState: jest.fn(),
        events: {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        },
    }),
}));

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
    useUser: () => ({
        user: { id: 'test_user_id', firstName: 'Test', lastName: 'User' },
        isLoaded: true,
        isSignedIn: true,
    }),
    useAuth: () => ({
        userId: 'test_user_id',
        isLoaded: true,
        isSignedIn: true,
    }),
    ClerkProvider: ({ children }) => children,
    SignedIn: ({ children }) => children,
    SignedOut: () => null,
}));

// Mock matchMedia for ThemeProvider
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock fetch globally
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
);
