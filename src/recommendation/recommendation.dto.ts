import {
  IsOptional,
  IsDateString,
  IsArray,
  IsNumber,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiPropertyOptional({
    description:
      'Start date for filtering activities (ISO format). Defaults to now if not provided.',
    example: '2025-09-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  rangeStart?: string;

  @ApiPropertyOptional({
    description:
      'End date for filtering activities (ISO format). Defaults to 7 days from start if not provided.',
    example: '2025-09-30T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  rangeEnd?: string;
}

export class SingleRecommendationDto extends DateRangeDto {}

export class GroupRecommendationDto extends DateRangeDto {
  @ApiProperty({
    description: 'Array of user IDs for the group (minimum 2)',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'At least 2 users are required for group recommendations',
  })
  @IsNumber({}, { each: true })
  @Type(() => Number)
  userIds: number[];
}
