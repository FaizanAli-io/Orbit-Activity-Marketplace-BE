import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  private client: Redis;
  private defaultTtl: number;

  constructor() {
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    if (!redisUrl) throw new Error('Missing UPSTASH_REDIS_URL');
    this.defaultTtl = parseInt(process.env.REDIS_CACHE_TTL || '300', 10);

    this.client = new Redis(redisUrl, { tls: {} });
    this.client.on('connect', () => console.log('✅ Connected to Redis'));
    this.client.on('error', (err) => console.error('❌ Redis Error', err));
  }

  /** Normalize cache key with method and path */
  private generateKey(method: string, url: string): string {
    const u = new URL(url, 'http://localhost');
    const sortedParams = [...u.searchParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    return `${method}:${u.pathname}${sortedParams ? '?' + sortedParams : ''}`;
  }

  /** GET data from cache */
  async get(method: string, url: string): Promise<any | null> {
    const key = this.generateKey(method, url);
    const data = await this.client.get(key);
    console.log(`[RedisService] GET ${key} -> ${data ? 'HIT' : 'MISS'}`);
    return data ? JSON.parse(data) : null;
  }

  /** SET data in cache */
  async set(method: string, url: string, value: any, ttl?: number) {
    const key = this.generateKey(method, url);
    const effectiveTtl = ttl ?? this.defaultTtl;
    await this.client.set(key, JSON.stringify(value), 'EX', effectiveTtl);
    console.log(`[RedisService] SET ${key} (ttl: ${effectiveTtl})`);
  }

  /** DELETE key from cache */
  async del(key: string) {
    await this.client.del(key);
    console.log(`[RedisService] DEL ${key}`);
  }

  /** Get all keys (for invalidation) */
  async keys(): Promise<string[]> {
    const all = await this.client.keys('*');
    console.log('[RedisService] KEYS =', all);
    return all;
  }
}
