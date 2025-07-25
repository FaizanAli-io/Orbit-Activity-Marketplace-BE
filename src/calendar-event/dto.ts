import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  activityId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

export class UpdateCalendarEventDto {
  @IsDateString()
  startTime?: string;

  @IsDateString()
  endTime?: string;
}
