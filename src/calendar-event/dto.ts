import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateCalendarEventDto {
  @IsNumber()
  @IsOptional()
  activityId?: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

export class UpdateCalendarEventDto extends PartialType(
  CreateCalendarEventDto,
) {}
