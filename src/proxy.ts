import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Next.js Middleware — runs on every request.
 * Handles:
 * 1. Global API rate limiting using Upstash Redis
 * 2. Request logging for debugging
 */

// Initialize Redis and Ratelimit
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'),
    analytics: true,
});

// Paths to skip rate limiting
const SKIP_PATHS = [
    '/api/auth',
    '/_next',
    '/favicon',
];

export async function proxy(request: NextRequest) {
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
    // ── API Logging ──
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const method = request.method;

    console.log(`[API] ${method} ${pathname} — IP: ${ip} — ${new Date().toISOString()}`);

    // ── Global Upstash Rate Limiting ──
    const id = ip;
    const { success, limit, reset, remaining } = await ratelimit.limit(id);

    // Provide some minimal headers
    const response = success ? NextResponse.next() : NextResponse.json(
        {
            success: false,
            error: 'Too many requests. Please wait a moment.',
            code: 'RATE_LIMITED',
        },
        { status: 429 }
    );

    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(retryAfter));
    if (!success) {
        response.headers.set('Retry-After', String(retryAfter));
        console.warn(`[API] Rate limit exceeded for IP: ${ip}`);
    }

    // ── Security Headers ──
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: ['/api/:path*'],
};
