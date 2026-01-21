import Redis from 'ioredis';
import MockRedis from 'ioredis-mock';

const getRedisClient = () => {
  if (process.env.NODE_ENV === 'development') {
    return new MockRedis();
  }
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    lazyConnect: true,
  });
};

const redis = getRedisClient();

redis.on('error', (err) => {
  console.warn('[ioredis] Redis connection error:', err.message);
});

export default redis;
