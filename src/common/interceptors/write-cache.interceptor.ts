import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RedisService } from '../../cache/redis.service';
import { Reflector } from '@nestjs/core';
import { NO_CACHE_KEY } from '../decorators/no-cache.decorator';

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
    const prefix = url.pathname.replace(/^\//, '').split('/')[0];

    return next.handle().pipe(
      tap(async () => {
        try {
          const keys = await this.redis.keys();
          const toDelete = keys.filter((k) => k.includes(prefix));

          await Promise.all(toDelete.map((k) => this.redis.del(k)));
        } catch (err) {
          // swallow errors to avoid affecting the response
          console.error('Cache invalidation failed', err);
        }
      }),
    );
  }
}
