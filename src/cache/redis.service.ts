import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;
  private defaultTtl: number;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    if (!redisUrl) throw new Error('Missing UPSTASH_REDIS_URL');

    this.client = new Redis(redisUrl, { tls: {} });
    this.defaultTtl = parseInt(process.env.REDIS_CACHE_TTL || '300', 10);

    this.client.on('connect', () => this.logger.log('✅ Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('❌ Redis Error', err));
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      this.logger.log(`GET ${key} -> ${data ? 'HIT' : 'MISS'}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      this.logger.error(`GET ${key} failed`, e as any);
      return null;
    }
  }

  async set(key: string, value: any, ttl = this.defaultTtl): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
      this.logger.log(`SET ${key} (ttl: ${ttl})`);
    } catch (e) {
      this.logger.error(`SET ${key} failed`, e as any);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
    this.logger.log(`DEL ${key}`);
  }

  async keys(): Promise<string[]> {
    const all = await this.client.keys('*');
    this.logger.log('KEYS', all);
    return all;
  }

  async deleteAll(prefix = '*'): Promise<{ deleted: number; keys: string[] }> {
    const pattern = prefix.endsWith('*') ? prefix : `${prefix}*`;
    const keys = await this.client.keys(pattern);
    if (keys.length) {
      const pipeline = this.client.pipeline();
      keys.forEach((k) => pipeline.del(k));
      await pipeline.exec();
    }
    this.logger.log(`DELETE ALL matching "${pattern}" -> ${keys.length}`);
    return { deleted: keys.length, keys };
  }
}
