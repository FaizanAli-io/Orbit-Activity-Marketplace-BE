import {
  Min,
  Max,
  IsIn,
  Matches,
  IsArray,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class TimeSlotDto {
  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '16:00',
  })
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'start must be in HH:mm format',
  })
  start: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '20:00',
  })
  @IsString()
  @Matches(TIME_FORMAT_REGEX, {
    message: 'end must be in HH:mm format',
  })
  end: string;
}

export class DateRangeDto {
  @ApiProperty({
    description: 'Start datetime in ISO format',
    example: '2024-01-15T00:00:00Z',
  })
  @IsDateString()
  start: string;

  @ApiProperty({
    description: 'End datetime in ISO format',
    example: '2024-01-20T23:59:59Z',
  })
  @IsDateString()
  end: string;
}

class DateWithTimeDto {
  @ApiProperty({
    description: 'Date in ISO format',
    example: '2024-01-15T00:00:00Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  time: TimeSlotDto;
}

class DateTimeRangeDto {
  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  date: DateRangeDto;

  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  time: TimeSlotDto;
}

class WeeklyRecurringDto {
  @ApiProperty({
    type: [Number],
    description: 'Day indexes: 1=Monday, ..., 7=Sunday',
    example: [1, 3, 5], // Monday, Wednesday, Friday
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days: number[];

  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  date: DateRangeDto;

  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  time: TimeSlotDto;
}

class MonthlyRecurringDto {
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

  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  date: DateRangeDto;

  @ApiProperty({ type: TimeSlotDto })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  time: TimeSlotDto;
}

export class ActivityAvailabilityDto {
  @ApiProperty({
    enum: ['dates', 'range', 'weekly', 'monthly'],
    description: 'Type of availability pattern',
  })
  @IsIn(['dates', 'range', 'weekly', 'monthly'])
  type: 'dates' | 'range' | 'weekly' | 'monthly';

  @ApiPropertyOptional({
    type: [DateWithTimeDto],
    description: 'Specific dates with time slots for availability',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DateWithTimeDto)
  dates?: DateWithTimeDto[];

  @ApiPropertyOptional({
    type: DateTimeRangeDto,
    description: 'Date/time range for availability',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateTimeRangeDto)
  range?: DateTimeRangeDto;

  @ApiPropertyOptional({
    type: WeeklyRecurringDto,
    description: 'Weekly recurring availability pattern',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyRecurringDto)
  weekly?: WeeklyRecurringDto;

  @ApiPropertyOptional({
    type: MonthlyRecurringDto,
    description: 'Monthly recurring availability pattern',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonthlyRecurringDto)
  monthly?: MonthlyRecurringDto;

  @ApiPropertyOptional({
    type: [String],
    description: 'Exclusions from availability in ISO format',
    example: ['2024-01-25T10:00:00Z'],
  })
  @IsArray()
  @IsOptional()
  @IsDateString({}, { each: true })
  exclusions?: string[];
}
