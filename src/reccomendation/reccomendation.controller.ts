import { Auth, AuthRole } from '../decorators';
import { AuthGuard } from '../guards/auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReccomendationService } from './reccomendation.service';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Reccomendation')
@Controller('reccomendation')
export class ReccomendationController {
  constructor(private readonly recService: ReccomendationService) {}

  @Get()
  @AuthRole('USER')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get recommendations for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of recommended activities' })
  async getRecommendations(@Auth() auth: any) {
    return this.recService.getUserRecommendations(auth.userId);
  }
}
