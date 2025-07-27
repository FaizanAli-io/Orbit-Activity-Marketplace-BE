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
import { InteractionService } from './interaction.service';
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
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiResponse({ status: 200, description: 'Return all activities.' })
  findAll(@Query() query: any) {
    return this.activityService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single activity detail' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return activity by id.' })
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @AuthRole('VENDOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update activity info (vendor only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({ status: 200, description: 'Activity updated.' })
  update(
    @Param('id') id: string,
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
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Activity deleted.' })
  remove(@Param('id') id: string, @Auth() auth: any) {
    return this.activityService.remove(id, auth.vendorId);
  }
}

@ApiTags('Interactions')
@Controller('activities')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get all users who liked an activity' })
  @ApiParam({ name: 'id', type: String })
  getActivityLikes(@Param('id') id: string) {
    return this.interactionService.getActivityLikes(id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Like an activity' })
  @ApiParam({ name: 'id', type: String })
  like(@Param('id') id: string, @Auth() auth: any) {
    return this.interactionService.like(id, auth.userId);
  }

  @Delete(':id/unlike')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove like from an activity' })
  @ApiParam({ name: 'id', type: String })
  unlike(@Param('id') id: string, @Auth() auth: any) {
    return this.interactionService.unlike(id, auth.userId);
  }

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'Get all users subscribed to an activity' })
  @ApiParam({ name: 'id', type: String })
  getActivitySubscriptions(@Param('id') id: string) {
    return this.interactionService.getActivitySubscriptions(id);
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User subscribes/signs up for an activity' })
  @ApiParam({ name: 'id', type: String })
  subscribe(@Param('id') id: string, @Auth() auth: any) {
    return this.interactionService.subscribe(id, auth.userId);
  }

  @Delete(':id/unsubscribe')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel activity subscription' })
  @ApiParam({ name: 'id', type: String })
  unsubscribe(@Param('id') id: string, @Auth() auth: any) {
    return this.interactionService.unsubscribe(id, auth.userId);
  }
}
