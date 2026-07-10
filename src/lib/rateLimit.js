// A simple in-memory rate limiter: tracks how many requests a key
//(e.g. an IP addess) has made withing a rolling time window.

const attempts = new Map();

export function rateLimit(key, limit,windowMs) {
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || now > entry.ressetAt) {
        attempts.set(key, {count: 1, resetAt: now + windowMs });
        return { allowed: true};
    }

    if (entry.count >= limit) {
        return { allowed: false, retryAfterMs: entry.resetAt - now};
    }

    entry.count += 1;
    return { allowed: true};
}