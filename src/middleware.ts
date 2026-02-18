import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware — runs on every request.
 * Handles:
 * 1. API rate limiting (50 req/min per IP)
 * 2. Request logging for debugging
 */

// ── In-memory rate limit store (serverless-safe) ──
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 50;
const WINDOW_MS = 60_000;

// Paths to skip rate limiting
const SKIP_PATHS = [
    '/api/auth',
    '/_next',
    '/favicon',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply to API routes
    if (!pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Skip auth and internal routes
    if (SKIP_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // ── API Logging ──
    const start = Date.now();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const method = request.method;

    console.log(`[API] ${method} ${pathname} — IP: ${ip} — ${new Date().toISOString()}`);

    // ── Rate Limiting ──
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else if (entry.count >= RATE_LIMIT) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
            {
                success: false,
                error: 'Too many requests. Please wait a moment.',
                code: 'RATE_LIMITED',
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(retryAfter),
                },
            }
        );
    } else {
        entry.count++;
    }

    const response = NextResponse.next();

    // Add rate limit headers
    const remaining = entry ? Math.max(0, RATE_LIMIT - entry.count) : RATE_LIMIT - 1;
    response.headers.set('X-RateLimit-Remaining', String(remaining));

    return response;
}

export const config = {
    matcher: ['/api/:path*'],
};
