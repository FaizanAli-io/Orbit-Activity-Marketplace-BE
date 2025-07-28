import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CalendarEventService } from './calendar-event.service';
import { CalendarEventController } from './calendar-event.controller';

@Module({
  controllers: [CalendarEventController],
  providers: [CalendarEventService],
  imports: [PrismaModule],
})
export class CalendarEventModule {}
