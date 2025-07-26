import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Min,
  Max,
  IsIn,
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TimeSlotDto {
  @ApiProperty({ description: 'Start time in HH:mm format' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format' })
  @IsString()
  endTime: string;
}

export class DateTimeRangeDto {
  @ApiProperty({ description: 'Start datetime in ISO format' })
  @IsDateString()
  start: string;

  @ApiProperty({ description: 'End datetime in ISO format' })
  @IsDateString()
  end: string;
}

export class DailyRecurringDto {
  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  timeSlot: TimeSlotDto;
}

export class WeeklyRecurringDto {
  @ApiProperty({
    type: [Number],
    description: 'Day indexes: 0=Sunday, 1=Monday, ..., 6=Saturday',
    example: [1, 3, 5], // Monday, Wednesday, Friday
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days: number[];

  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  timeSlot: TimeSlotDto;
}

export class MonthlyRecurringDto {
  @ApiProperty({
    type: [Number],
    description: 'Day of month indexes: 1-31',
    example: [1, 15, 30], // 1st, 15th, and 30th of each month
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  days: number[];

  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  timeSlot: TimeSlotDto;
}

export class RecurringDto {
  @ApiProperty({
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Type of recurring pattern',
  })
  @IsIn(['daily', 'weekly', 'monthly'])
  type: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({ type: DailyRecurringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DailyRecurringDto)
  daily?: DailyRecurringDto;

  @ApiPropertyOptional({ type: WeeklyRecurringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyRecurringDto)
  weekly?: WeeklyRecurringDto;

  @ApiPropertyOptional({ type: MonthlyRecurringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonthlyRecurringDto)
  monthly?: MonthlyRecurringDto;
}

export class ActivityAvailabilityDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Specific dates for availability in ISO format',
    example: ['2024-01-15T10:00:00Z', '2024-01-20T14:30:00Z'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  dates?: string[];

  @ApiPropertyOptional({
    type: [DateTimeRangeDto],
    description: 'Date/time ranges for availability',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateTimeRangeDto)
  ranges?: DateTimeRangeDto[];

  @ApiPropertyOptional({
    type: RecurringDto,
    description: 'Recurring availability pattern',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringDto)
  recurring?: RecurringDto;

  @ApiPropertyOptional({
    type: [String],
    description: 'Exclusions from availability in ISO format',
    example: ['2024-01-25T10:00:00Z'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  exclusions?: string[];
}
