import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// Standardized API Response Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Return a success JSON response.
 */
export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

/**
 * Return an error JSON response with user-friendly message.
 */
export function apiError(
    message: string,
    status: number,
    code?: string
) {
    return NextResponse.json(
        { success: false, error: message, code: code ?? httpCodeToError(status) },
        { status }
    );
}

/** Map HTTP status to an error code string */
function httpCodeToError(status: number): string {
    switch (status) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'UNAUTHORIZED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 409: return 'CONFLICT';
        case 429: return 'RATE_LIMITED';
        case 500: return 'INTERNAL_ERROR';
        default: return 'UNKNOWN_ERROR';
    }
}

/** User-friendly error messages for common scenarios */
export const ErrorMessages = {
    UNAUTHORIZED: 'Please sign in to continue.',
    USER_NOT_FOUND: 'Account not found. Please sign in again.',
    GROUP_NOT_FOUND: 'This group doesn\'t exist or you don\'t have access.',
    PERMISSION_DENIED: 'You don\'t have permission for this action.',
    UNSETTLED_BALANCE: 'This member has unsettled balances. Settle debts first.',
    RATE_LIMITED: 'Too many requests. Please wait a moment.',
    INVALID_INPUT: 'Please check your input and try again.',
    NETWORK_ERROR: 'Something went wrong. Please check your connection.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again.',
} as const;
