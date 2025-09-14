import { Transform } from 'class-transformer';
import { PaginationDto } from '../utils/pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsArray,
  IsOptional,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';

class RecommendationBaseQueryDto extends PaginationDto {
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

export class SingleRecommendationQueryDto extends RecommendationBaseQueryDto {}

export class GroupRecommendationQueryDto extends RecommendationBaseQueryDto {
  @ApiProperty({
    description: 'Comma-separated user IDs for the group (minimum 2)',
    example: '1,2,3',
    type: String,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const ids = value.split(',').map((id) => parseInt(id.trim(), 10));
      return ids;
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'At least 2 users are required for group recommendations',
  })
  @IsInt({ each: true, message: 'All user IDs must be valid numbers' })
  userIds: number[];
}
