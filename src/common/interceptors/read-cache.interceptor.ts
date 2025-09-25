import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { RedisService } from '../../cache/cache.service';
import { NO_CACHE_KEY } from '../decorators/no-cache.decorator';

@Injectable()
export class ReadCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    if (req.method !== 'GET') return next.handle();

    const skip =
      this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    if (skip) return next.handle();

    // Build deterministic cache key
    const url = new URL(req.originalUrl, 'http://localhost');
    const queryEntries: [string, string][] = Object.entries(req.query || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => [k, String(v)]);
    const qs = new URLSearchParams(queryEntries).toString();
    const baseKey = `GET:${url.pathname}${qs ? '?' + qs : ''}`;
    const authId = req.auth?.id ?? null;
    const cacheKey = authId ? `${baseKey}:a:${authId}` : baseKey;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try {
          return of(cached);
        } catch {
          // ignore parse issues
        }
      }
    } catch {
      // ignore cache read errors
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.redis.set(cacheKey, data);
        } catch {
          // ignore write errors
        }
      }),
    );
  }
}
