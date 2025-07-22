import { ActivityCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty({ enum: ActivityCategory }) category: ActivityCategory;
  @ApiProperty() price: number;
  @ApiProperty() capacity: number;
  @ApiProperty() location: string;
  @ApiPropertyOptional() duration?: string;
  @ApiPropertyOptional() availability?: any;
  @ApiPropertyOptional() images?: any;
  @ApiPropertyOptional() quota?: number;
  @ApiPropertyOptional() discount?: number;
}

export class UpdateActivityDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional({ enum: ActivityCategory }) category?: ActivityCategory;
  @ApiPropertyOptional() price?: number;
  @ApiPropertyOptional() capacity?: number;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() duration?: string;
  @ApiPropertyOptional() availability?: any;
  @ApiPropertyOptional() images?: any;
  @ApiPropertyOptional() quota?: number;
  @ApiPropertyOptional() discount?: number;
}
