import { AuthGuard } from '../guards/auth.guard';
import { Auth, AuthRole, ApiPagination } from '../decorators';
import { RecommendationService } from './recommendation.service';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

  @Get()
  @AuthRole('USER')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get paginated recommendations for authenticated user',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Paginated list of recommended activities',
  })
  async getRecommendations(@Auth() auth: any, @Query() query: PaginationDto) {
    const { page, limit } = query;
    return this.recService.getUserRecommendations(auth.userId, { page, limit });
  }
}
