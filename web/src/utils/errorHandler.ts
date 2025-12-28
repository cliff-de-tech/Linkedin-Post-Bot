/**
 * Typed error handling utilities for consistent error management.
 * 
 * Usage:
 *   try {
 *     await someApiCall();
 *   } catch (error) {
 *     const message = getErrorMessage(error);
 *     showToast(message);
 *   }
 */

/**
 * Safely extracts error message from unknown error type.
 * Works with Error objects, API responses, and strings.
 */
export function getErrorMessage(error: unknown): string {
    // Handle Error instances
    if (error instanceof Error) {
        return error.message;
    }

    // Handle API response errors (Axios-style)
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;

        // Check for response.data.error (Axios)
        if (err.response && typeof err.response === 'object') {
            const response = err.response as Record<string, unknown>;
            if (response.data && typeof response.data === 'object') {
                const data = response.data as Record<string, unknown>;
                if (typeof data.error === 'string') return data.error;
                if (typeof data.message === 'string') return data.message;
            }
        }

        // Check for direct error/message properties
        if (typeof err.error === 'string') return err.error;
        if (typeof err.message === 'string') return err.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    // Fallback
    return 'An unexpected error occurred';
}

/**
 * Type guard to check if error is a network error.
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
        return error.message.includes('Network') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('fetch');
    }
    return false;
}

/**
 * Type guard for API errors with status code.
 */
export function getErrorStatus(error: unknown): number | null {
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        if (err.response && typeof err.response === 'object') {
            const response = err.response as Record<string, unknown>;
            if (typeof response.status === 'number') {
                return response.status;
            }
        }
        if (typeof err.status === 'number') {
            return err.status;
        }
    }
    return null;
}
