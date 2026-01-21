import Redis from 'ioredis';
import MockRedis from 'ioredis-mock';

const getRedisClient = () => {
  if (process.env.NODE_ENV === 'development') {
    return new MockRedis();
  }
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });
};

const redis = getRedisClient();

export default redis;
