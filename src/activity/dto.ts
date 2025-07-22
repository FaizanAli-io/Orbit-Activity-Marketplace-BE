import { ActivityCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ActivityCategory })
  @IsEnum(ActivityCategory)
  category: ActivityCategory;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  capacity: number;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  availability?: any;

  @ApiPropertyOptional()
  @IsOptional()
  images?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;
}

export class UpdateActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ActivityCategory })
  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  availability?: any;

  @ApiPropertyOptional()
  @IsOptional()
  images?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;
}
