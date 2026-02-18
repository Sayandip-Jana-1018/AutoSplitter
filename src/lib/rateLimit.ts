// ═══════════════════════════════════════════════════════════════
// In-Memory Sliding Window Rate Limiter
// No Redis needed — works on Vercel serverless.
// ═══════════════════════════════════════════════════════════════

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
if (typeof globalThis !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now > entry.resetAt) store.delete(key);
        }
    }, 60_000);
}

interface RateLimitConfig {
    /** Max requests per window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    limit: 50,
    windowMs: 60_000, // 1 minute
};

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number; // ms until window resets
}

/**
 * Check rate limit for a given identifier (IP or userId).
 * Returns whether the request is allowed + remaining quota.
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || now > entry.resetAt) {
        // New window
        store.set(identifier, { count: 1, resetAt: now + config.windowMs });
        return { success: true, remaining: config.limit - 1, resetIn: config.windowMs };
    }

    if (entry.count >= config.limit) {
        return { success: false, remaining: 0, resetIn: entry.resetAt - now };
    }

    entry.count++;
    return { success: true, remaining: config.limit - entry.count, resetIn: entry.resetAt - now };
}

/**
 * Get rate limit headers for the response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
        ...(result.success ? {} : { 'Retry-After': String(Math.ceil(result.resetIn / 1000)) }),
    };
}
