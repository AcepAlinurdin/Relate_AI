type RateLimitConfig = {
    interval: number; // in milliseconds
    uniqueTokenPerInterval: number; // Max number of unique tokens (users/IPs) to track per interval
};

export class RateLimit {
    private tokenCache: Map<string, number[]>;
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
        this.tokenCache = new Map();
    }

    public check(limit: number, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const now = Date.now();
            const windowStart = now - this.config.interval;

            // Get existing timestamps for this token
            const timestamps = this.tokenCache.get(token) || [];

            // Filter out timestamps older than the window
            const validTimestamps = timestamps.filter(ts => ts > windowStart);

            if (validTimestamps.length >= limit) {
                // Rate limit exceeded
                reject(new Error('Rate limit exceeded'));
                return;
            }

            // Add current timestamp
            validTimestamps.push(now);
            this.tokenCache.set(token, validTimestamps);

            // Cleanup old tokens if cache gets too big (simple LRU-ish safety)
            if (this.tokenCache.size > this.config.uniqueTokenPerInterval) {
                // Just clear it for simplicity in MVP, or remove oldest. 
                // A better approach is to not clear everything but strictly implementing LRU is overkill for now.
                // We'll just delete the oldest key we find effectively.
                const firstKey = this.tokenCache.keys().next().value;
                if (firstKey) this.tokenCache.delete(firstKey);
            }

            resolve();
        });
    }
}

// Singleton instance for global use if needed, or helper function
export const rateLimit = (options: RateLimitConfig) => {
    // We persist the limiter instance in a semi-global scope for the module
    // Note: In Next.js serverless, this might reset per lambda boot, 
    // which is why Redis is better for "strict" strict limiting. 
    // But for "hot" containers, this works fine for basic protection.
    const limiter = new RateLimit(options);

    return {
        check: (limit: number, token: string) => limiter.check(limit, token),
    };
};
