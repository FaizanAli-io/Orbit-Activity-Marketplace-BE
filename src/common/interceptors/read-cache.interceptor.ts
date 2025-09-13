import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Observable, from, tap } from 'rxjs';
import { RedisService } from '../../cache/redis.service';

@Injectable()
export class ReadCacheInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    if (req.method !== 'GET') return next.handle();

    const cached = await this.redis.get('GET', req.originalUrl);
    if (cached) return from([cached]);

    return next.handle().pipe(
      tap(async (data) => {
        await this.redis.set('GET', req.originalUrl, data);
      }),
    );
  }
}
