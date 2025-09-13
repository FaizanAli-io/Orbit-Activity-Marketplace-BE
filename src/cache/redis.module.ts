import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisService } from './redis.service';
import {
  ReadCacheInterceptor,
  WriteCacheInterceptor,
} from '../common/interceptors';

@Module({
  providers: [
    RedisService,
    { provide: APP_INTERCEPTOR, useClass: ReadCacheInterceptor },
    { provide: APP_INTERCEPTOR, useClass: WriteCacheInterceptor },
  ],
  exports: [RedisService],
})
export class CacheModule {}
