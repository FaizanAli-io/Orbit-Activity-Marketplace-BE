import { CalendarEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ActivityAvailabilityDto } from '../activity/dtos';
import { isEventInValidTimeslot } from './availability-check';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';

@Injectable()
export class CalendarEventService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateCalendarEventDto,
    userId: number,
  ): Promise<CalendarEvent> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: dto.activityId },
      select: { availability: true },
    });

    if (!activity) throw new NotFoundException('Activity not found');
    const availability =
      activity.availability as unknown as ActivityAvailabilityDto;

    if (!isEventInValidTimeslot(dto.startTime, dto.endTime, availability))
      throw new BadRequestException(
        'Event is not in a valid timeslot for this activity',
      );

    return this.prisma.calendarEvent.create({ data: { ...dto, userId } });
  }

  async findAll(userId: number): Promise<CalendarEvent[]> {
    return this.prisma.calendarEvent.findMany({ where: { userId } });
  }

  async findOne(id: number, userId: number): Promise<CalendarEvent> {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });

    if (!event || event.userId !== userId)
      throw new NotFoundException('Event not found');

    return event;
  }

  async update(
    id: number,
    dto: UpdateCalendarEventDto,
    userId: number,
  ): Promise<CalendarEvent> {
    const event = await this.findOne(id, userId);

    const activity = await this.prisma.activity.findUnique({
      where: { id: event.activityId },
      select: { availability: true },
    });

    if (!activity) throw new NotFoundException('Activity not found');
    const availability =
      activity.availability as unknown as ActivityAvailabilityDto;

    const start = dto.startTime ?? event.startTime.toISOString();
    const end = dto.endTime ?? event.endTime.toISOString();

    if (!isEventInValidTimeslot(start, end, availability)) {
      throw new BadRequestException(
        'Event is not in a valid timeslot for this activity',
      );
    }

    return this.prisma.calendarEvent.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number): Promise<CalendarEvent> {
    await this.findOne(id, userId);
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
