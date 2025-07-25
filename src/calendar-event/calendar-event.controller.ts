import {
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Controller,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';
import { AuthRole } from '../decorators/auth-role.decorator';
import { CalendarEventService } from './calendar-event.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';

@ApiTags('Calendar Events')
@Controller('calendar-events')
@UseGuards(AuthGuard)
@AuthRole('USER')
@ApiBearerAuth('access-token')
export class CalendarEventController {
  constructor(private readonly calendarEventService: CalendarEventService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiResponse({
    status: 201,
    description: 'The event has been successfully created.',
  })
  async create(@Body() dto: CreateCalendarEventDto, @Auth() auth: any) {
    return this.calendarEventService.create(dto, auth.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all calendar events for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'List of calendar events.' })
  async findAll(@Auth() auth: any) {
    return this.calendarEventService.findAll(auth.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific calendar event by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The requested calendar event.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  async findOne(@Param('id') id: string, @Auth() auth: any) {
    return this.calendarEventService.findOne(id, auth.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a calendar event by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The updated calendar event.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
    @Auth() auth: any,
  ) {
    return this.calendarEventService.update(id, dto, auth.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calendar event by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The deleted calendar event.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  async remove(@Param('id') id: string, @Auth() auth: any) {
    return this.calendarEventService.remove(id, auth.userId);
  }
}
