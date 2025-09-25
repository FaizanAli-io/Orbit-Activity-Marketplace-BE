import {
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
  activity: [
    'GET:/users/liked',
    'GET:/users/subscriptions',
    'GET:/recommendation/group',
    'GET:/recommendation/single',
  ],
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
          const keysToDelete: string[] = [];

          // always invalidate the list
          keysToDelete.push(`GET:/${prefix}`);

          // also invalidate the entity if ID present
          if (maybeId) {
            keysToDelete.push(`GET:/${prefix}/${maybeId}`);
          }

          // add any configured invalidations
          const extraInvalidations = INVALIDATION_MAP[prefix] ?? [];
          keysToDelete.push(...extraInvalidations);

          // deduplicate + delete
          const uniqueKeys = [...new Set(keysToDelete)];
          await Promise.all(uniqueKeys.map((k) => this.redis.del(k)));
        } catch (err) {
          console.error('Cache invalidation failed', err);
        }
      }),
    );
  }
}
