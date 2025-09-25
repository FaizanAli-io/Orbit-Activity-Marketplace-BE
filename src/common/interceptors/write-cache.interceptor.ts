import {
  Logger,
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../cache/cache.service';
import { NO_CACHE_KEY } from '../decorators/no-cache.decorator';

// extra invalidations config
const INVALIDATION_MAP: Record<string, string[]> = {
  activities: ['users/liked', 'users/subscriptions', 'recommendation'],
};

@Injectable()
export class WriteCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const skip =
      this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    if (skip) return next.handle();

    const url = new URL(req.originalUrl, 'http://localhost');
    const [prefix, maybeId] = url.pathname.replace(/^\//, '').split('/');

    return next.handle().pipe(
      tap(async () => {
        try {
          const allKeys = await this.redis.keys();
          const patterns = [prefix, ...(INVALIDATION_MAP[prefix] ?? [])];

          const toDelete = allKeys.filter((key) =>
            patterns.some((p) => key.includes(p)),
          );

          if (toDelete.length > 0) {
            await Promise.all(toDelete.map((k) => this.redis.del(k)));
          }
        } catch (err) {
          console.error('Cache invalidation failed', err);
        }
      }),
    );
  }
}
