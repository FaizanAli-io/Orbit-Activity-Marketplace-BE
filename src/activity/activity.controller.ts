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

import { AuthGuard } from '../guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';
import { AuthRole } from '../decorators/auth-role.decorator';

import { ActivityService } from './activity.service';
import { CreateActivityDto, UpdateActivityDto } from './dtos';

@ApiTags('Activities')
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @UseGuards(AuthGuard)
  @AuthRole('VENDOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new activity (vendor only)' })
  @ApiBody({ type: CreateActivityDto })
  @ApiResponse({ status: 201, description: 'Activity created.' })
  create(@Body() dto: CreateActivityDto, @Auth() auth: any) {
    return this.activityService.create(dto, auth.vendorId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities (with filters)' })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Return all activities.' })
  findAll(@Query() query: any) {
    return this.activityService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single activity detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Return activity by id.' })
  findOne(@Param('id') id: number) {
    return this.activityService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @AuthRole('VENDOR')
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
  @UseGuards(AuthGuard)
  @AuthRole('VENDOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete activity (vendor only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Activity deleted.' })
  remove(@Param('id') id: number, @Auth() auth: any) {
    return this.activityService.remove(id, auth.vendorId);
  }
}
