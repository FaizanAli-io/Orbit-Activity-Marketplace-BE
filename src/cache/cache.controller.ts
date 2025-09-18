import { NoCache } from '../common/decorators';
import { RedisService } from './redis.service';
import { Controller, Get, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('Cache')
@Controller('cache')
export class CacheController {
  constructor(private readonly redis: RedisService) {}

  @Get('keys')
  @NoCache()
  @ApiOperation({ summary: 'List cache keys (optionally filter by prefix)' })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description: 'Filter by key prefix (exact start of key)',
  })
  @ApiResponse({ status: 200, description: 'Returns array of cache keys.' })
  async listKeys(@Query('prefix') prefix?: string) {
    const all = await this.redis.keys();
    const keys = prefix ? all.filter((k) => k.startsWith(prefix)) : all;
    return { count: keys.length, keys };
  }

  @Delete('keys')
  @NoCache()
  @ApiOperation({ summary: 'Delete all cache keys (optionally by prefix)' })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description:
      'Optional prefix to limit deletions. If omitted, all keys are deleted.',
  })
  @ApiResponse({ status: 200, description: 'Returns deletion summary.' })
  async clearKeys(@Query('prefix') prefix?: string) {
    return this.redis.deleteAll(prefix || '*');
  }
}
