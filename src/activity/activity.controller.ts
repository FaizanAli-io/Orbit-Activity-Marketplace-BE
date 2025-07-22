import {
  Get,
  Post,
  Put,
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
import { ActivityService } from './activity.service';
import { CreateActivityDto, UpdateActivityDto } from './dto';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/user.decorator';
import { AuthRole } from '../decorators/auth-role.decorator';

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
  create(@Body() dto: CreateActivityDto, @User() user: any) {
    return this.activityService.create(dto, user.vendorId);
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

  @Put(':id')
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
    @User() user: any,
  ) {
    return this.activityService.update(id, dto, user.vendorId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @AuthRole('VENDOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete activity (vendor only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Activity deleted.' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.activityService.remove(id, user.vendorId);
  }
}
