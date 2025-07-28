import { PrismaClient, CalendarEvent } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';

@Injectable()
export class CalendarEventService {
  private prisma = new PrismaClient();

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
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new NotFoundException('Event not found');
    return this.prisma.calendarEvent.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number): Promise<CalendarEvent> {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.userId !== userId)
      throw new NotFoundException('Event not found');
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
