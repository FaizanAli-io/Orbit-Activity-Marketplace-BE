import { AuthGuard } from '../common/guards/auth.guard';
import { RecommendationService } from './recommendation.service';
import { Auth, AuthRole, ApiPagination } from '../common/decorators';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  GroupRecommendationQueryDto,
  SingleRecommendationQueryDto,
} from './recommendation.dto';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Recommendation')
@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recService: RecommendationService) {}

  @Get('single')
  @AuthRole('USER')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get paginated recommendations for authenticated user',
    description:
      'Allows specifying custom start and end dates for activity filtering. Defaults to next 7 days if no dates provided.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of recommended activities',
  })
  async getRecommendations(
    @Auth() auth: any,
    @Query() queryParams: SingleRecommendationQueryDto,
  ) {
    const { rangeStart, rangeEnd, page, limit } = queryParams;
    const dateRange = {
      ...(rangeStart && { rangeStart: new Date(rangeStart) }),
      ...(rangeEnd && { rangeEnd: new Date(rangeEnd) }),
    };
    return this.recService.getUserRecommendations(auth.userId, dateRange, {
      page: page || 1,
      limit: limit || 10,
    });
  }

  @Get('group')
  @AuthRole('USER')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get group recommendations for multiple users',
    description:
      'Generate activity recommendations for a group of users (minimum 2) with optional date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of group recommendations',
  })
  async getGroupRecommendations(
    @Auth() auth: any,
    @Query() queryParams: GroupRecommendationQueryDto,
  ) {
    const { rangeStart, rangeEnd, userIds, page, limit } = queryParams;

    const dateRange = {
      ...(rangeStart && { rangeStart: new Date(rangeStart) }),
      ...(rangeEnd && { rangeEnd: new Date(rangeEnd) }),
    };

    return this.recService.getGroupRecommendations(
      userIds,
      dateRange,
      { page: page || 1, limit: limit || 10 },
      auth.userId,
    );
  }
}
