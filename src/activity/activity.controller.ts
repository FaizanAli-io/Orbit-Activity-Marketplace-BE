import {
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Controller,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { ActivityService } from './activity.service';
import { PaginationDto } from '../utils/pagination.dto';
import { CreateActivityDto, UpdateActivityDto } from './dtos';
import { Auth, AuthRole, ApiPagination } from '../common/decorators';

@ApiTags('Activities')
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @AuthRole('VENDOR')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new activity (vendor only)' })
  @ApiBody({ type: CreateActivityDto })
  @ApiResponse({ status: 201, description: 'Activity created.' })
  create(@Body() dto: CreateActivityDto, @Auth() auth: any) {
    return this.activityService.create(dto, auth.vendorId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all activities (with filters, sorting and pagination)',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by activity name',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    description: 'Filter by vendor ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['likes', 'subscriptions', 'price_asc', 'price_desc', 'newest'],
    description:
      'Sort activities by: likes count, subscriptions count, price (asc/desc), or newest (default)',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Return paginated activities with filters and sorting.',
  })
  findAll(@Query() query: any & PaginationDto, @Auth() auth: any) {
    const { page, limit, ...filters } = query;
    return this.activityService.findAll(
      filters,
      { page, limit },
      auth?.userId || null,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single activity detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Return activity by id.' })
  findOne(@Param('id') id: number) {
    return this.activityService.findOne(id);
  }

  @Patch(':id')
  @AuthRole('VENDOR')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update activity info (vendor only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({ status: 200, description: 'Activity updated.' })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateActivityDto,
    @Auth() auth: any,
  ) {
    return this.activityService.update(id, dto, auth.vendorId);
  }

  @Delete(':id')
  @AuthRole('VENDOR')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete activity (vendor only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Activity deleted.' })
  remove(@Param('id') id: number, @Auth() auth: any) {
    return this.activityService.remove(id, auth.vendorId);
  }
}
