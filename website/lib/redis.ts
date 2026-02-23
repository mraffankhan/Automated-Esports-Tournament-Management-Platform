import Redis from 'ioredis';

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    return 'redis://localhost:6379';
};

export const redis = new Redis(getRedisUrl(), {
    lazyConnect: true,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on('error', (err) => {
    console.warn('Redis connection error:', err);
});
