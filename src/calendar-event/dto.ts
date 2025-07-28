import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateCalendarEventDto {
  @IsNumber()
  @IsNotEmpty()
  activityId: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

export class UpdateCalendarEventDto extends PartialType(
  CreateCalendarEventDto,
) {}
