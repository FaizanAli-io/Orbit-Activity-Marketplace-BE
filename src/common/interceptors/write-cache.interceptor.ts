import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RedisService } from '../../cache/redis.service';

@Injectable()
export class WriteCacheInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Extract first path segment as prefix
    const u = new URL(req.originalUrl, 'http://localhost');
    const prefix = u.pathname.replace(/^\//, '').split('/')[0];

    return next.handle().pipe(
      tap(async () => {
        const allKeys = await this.redis.keys();
        const matchedKeys = allKeys.filter((k) => k.includes(prefix));
        for (const key of matchedKeys) {
          await this.redis.del(key);
        }
      }),
    );
  }
}
