import { PrismaClient, CalendarEvent } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';

@Injectable()
export class CalendarEventService {
  private prisma = new PrismaClient();

  async create(
    dto: CreateCalendarEventDto,
    userId: string,
  ): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string): Promise<CalendarEvent[]> {
    return this.prisma.calendarEvent.findMany({ where: { userId } });
  }

  async findOne(id: string, userId: string): Promise<CalendarEvent> {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new NotFoundException('Event not found');
    return event;
  }

  async update(
    id: string,
    dto: UpdateCalendarEventDto,
    userId: string,
  ): Promise<CalendarEvent> {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new NotFoundException('Event not found');
    return this.prisma.calendarEvent.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string): Promise<CalendarEvent> {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new NotFoundException('Event not found');
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
