import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CalendarEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityAvailabilityDto } from '../activity/dtos';
import { isEventInValidTimeslot } from './availability-check';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';

@Injectable()
export class CalendarEventService {
  constructor(private prisma: PrismaService) {}

  private async checkAvailabilityOrThrow(
    activityId: number | null | undefined,
    start: string,
    end: string,
  ) {
    if (!activityId) return;

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { availability: true },
    });

    if (!activity) throw new NotFoundException('Activity not found');
    const availability =
      activity.availability as unknown as ActivityAvailabilityDto;

    if (!isEventInValidTimeslot(start, end, availability)) {
      throw new BadRequestException(
        'Event is not in a valid timeslot for this activity',
      );
    }
  }

  async create(
    dto: CreateCalendarEventDto,
    userId: number,
  ): Promise<CalendarEvent> {
    await this.checkAvailabilityOrThrow(
      dto.activityId,
      dto.startTime,
      dto.endTime,
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
    const start = dto.startTime ?? event.startTime.toISOString();
    const end = dto.endTime ?? event.endTime.toISOString();
    const activityId = dto.activityId ?? event.activityId;

    await this.checkAvailabilityOrThrow(activityId, start, end);
    return this.prisma.calendarEvent.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number): Promise<CalendarEvent> {
    await this.findOne(id, userId);
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
