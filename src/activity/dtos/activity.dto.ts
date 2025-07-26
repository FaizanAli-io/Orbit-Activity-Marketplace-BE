import { ActivityCategory } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsPositive,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityAvailabilityDto } from './availability.dto';
import { ActivityImagesDto } from './images.dto';

export class BaseActivityDto {
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
  @IsPositive()
  price: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  capacity: number;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ type: ActivityAvailabilityDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => ActivityAvailabilityDto)
  availability?: ActivityAvailabilityDto;

  @ApiPropertyOptional({ type: ActivityImagesDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => ActivityImagesDto)
  images?: ActivityImagesDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;
}

export class CreateActivityDto extends BaseActivityDto {}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
