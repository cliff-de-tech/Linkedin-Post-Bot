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

// Mock fetch globally
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
);
