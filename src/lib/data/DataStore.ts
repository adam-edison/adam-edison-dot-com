import { Redis } from '@upstash/redis';

export interface DataStore {
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
}

export class RedisDataStore implements DataStore {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async del(...keys: string[]): Promise<number> {
    return this.redis.del(...keys);
  }

  static fromEnv(): RedisDataStore {
    return new RedisDataStore(Redis.fromEnv());
  }
}
