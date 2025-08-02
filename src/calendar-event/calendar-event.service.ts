import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CalendarEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityAvailabilityDto } from '../activity/dtos';
import { validateEventTimeslot } from './availability-check';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';
import { timeStamp } from 'console';

@Injectable()
export class CalendarEventService {
  constructor(private prisma: PrismaService) {}

  private getIncludeOptions() {
    return {
      activity: {
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
          location: true,
          vendorId: true,
          timestamp: true,
          categoryId: true,
          description: true,
        },
      },
    };
  }

  private async checkAvailabilityOrThrow(
    activityId: number | null | undefined,
    start: string,
    end: string,
    userId: number,
    excludeEventId?: number,
  ) {
    // Check activity availability
    if (activityId) {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { availability: true },
      });

      if (!activity) throw new NotFoundException('Activity not found');
      const availability =
        activity.availability as unknown as ActivityAvailabilityDto;

      const { isValid, error } = validateEventTimeslot(
        start,
        end,
        availability,
      );
      if (!isValid) throw new BadRequestException(error);
    }

    // Check for user booking conflicts
    const startTime = new Date(start);
    const endTime = new Date(end);

    const conflictingEvents = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(excludeEventId && { id: { not: excludeEventId } }),
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } },
        ],
      },
    });

    if (conflictingEvents.length > 0) {
      const conflictTime = conflictingEvents[0];
      throw new BadRequestException(
        `You already have an event scheduled from ${conflictTime.startTime.toISOString().substring(11, 16)} to ${conflictTime.endTime.toISOString().substring(11, 16)} on ${conflictTime.startTime.toISOString().substring(0, 10)}`,
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
      userId,
    );
    return this.prisma.calendarEvent.create({
      data: { ...dto, userId },
      include: this.getIncludeOptions(),
    });
  }

  async findAll(userId: number): Promise<CalendarEvent[]> {
    return this.prisma.calendarEvent.findMany({
      where: { userId },
      include: this.getIncludeOptions(),
    });
  }

  async findOne(id: number, userId: number): Promise<CalendarEvent> {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

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

    await this.checkAvailabilityOrThrow(activityId, start, end, userId, id);
    return this.prisma.calendarEvent.update({
      data: dto,
      where: { id },
      include: this.getIncludeOptions(),
    });
  }

  async remove(id: number, userId: number): Promise<CalendarEvent> {
    await this.findOne(id, userId);
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
