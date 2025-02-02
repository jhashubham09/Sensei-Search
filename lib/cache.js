// lib/cache.js
import Redis from 'ioredis';
const redis = new Redis();

export const cacheSearch = async (query, results) => {
    const key = `search:${hash(query)}`;
    await redis.set(key, JSON.stringify(results), 'EX', 3600); // 1 hour cache
    return results;
};
