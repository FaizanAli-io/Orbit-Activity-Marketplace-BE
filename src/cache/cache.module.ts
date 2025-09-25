import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisService } from './cache.service';
import { CacheController } from './cache.controller';
import {
  ReadCacheInterceptor,
  WriteCacheInterceptor,
} from '../common/interceptors';

@Module({
  controllers: [CacheController],
  providers: [
    RedisService,
    { provide: APP_INTERCEPTOR, useClass: ReadCacheInterceptor },
    { provide: APP_INTERCEPTOR, useClass: WriteCacheInterceptor },
  ],
  exports: [RedisService],
})
export class CacheModule {}
