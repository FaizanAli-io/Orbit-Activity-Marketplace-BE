import { AuthGuard } from '../common/guards/auth.guard';
import { RecommendationService } from './recommendation.service';
import { Auth, AuthRole, ApiPagination } from '../common/decorators';
import {
  GroupRecommendationDto,
  SingleRecommendationDto,
} from './recommendation.dto';
import { Controller, Post, Query, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationDto } from '../utils/pagination.dto';

@ApiTags('Recommendation')
@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recService: RecommendationService) {}

  @Post('single')
  @AuthRole('USER')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get paginated recommendations for authenticated user',
    description:
      'Allows specifying custom start and end dates for activity filtering. Defaults to next 7 days if no dates provided.',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Paginated list of recommended activities',
  })
  async getRecommendations(
    @Auth() auth: any,
    @Body() singleDto: SingleRecommendationDto,
    @Query() query: PaginationDto,
  ) {
    const { page, limit } = query;
    const dateRange = {
      ...(singleDto.rangeStart && {
        rangeStart: new Date(singleDto.rangeStart),
      }),
      ...(singleDto.rangeEnd && { rangeEnd: new Date(singleDto.rangeEnd) }),
    };
    return this.recService.getUserRecommendations(auth.userId, dateRange, {
      page,
      limit,
    });
  }

  @Post('group')
  @AuthRole('USER')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get group recommendations for multiple users',
    description:
      'Generate activity recommendations for a group of users (minimum 2) with optional date range',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Paginated list of group recommendations',
  })
  async getGroupRecommendations(
    @Auth() auth: any,
    @Body() groupDto: GroupRecommendationDto,
    @Query() query: PaginationDto,
  ) {
    const { page, limit } = query;
    const dateRange = {
      ...(groupDto.rangeStart && { rangeStart: new Date(groupDto.rangeStart) }),
      ...(groupDto.rangeEnd && { rangeEnd: new Date(groupDto.rangeEnd) }),
    };
    return this.recService.getGroupRecommendations(
      groupDto.userIds,
      dateRange,
      { page, limit },
      auth.userId,
    );
  }
}
