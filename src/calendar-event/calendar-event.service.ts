import { CalendarEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';

@Injectable()
export class CalendarEventService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateCalendarEventDto,
    userId: number,
  ): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.create({
      data: { ...dto, userId },
    });
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
    await this.findOne(id, userId);
    return this.prisma.calendarEvent.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number): Promise<CalendarEvent> {
    await this.findOne(id, userId);
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
