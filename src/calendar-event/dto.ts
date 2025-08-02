import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateCalendarEventDto {
  @ApiPropertyOptional({
    description: 'ID of the associated activity',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  activityId?: number;

  @ApiProperty({
    description: 'Start time of the calendar event in ISO format',
    example: '2024-08-15T10:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'End time of the calendar event in ISO format',
    example: '2024-08-15T12:00:00Z',
  })
  @IsDateString()
  endTime: string;
}

export class UpdateCalendarEventDto extends PartialType(
  CreateCalendarEventDto,
) {}
