import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Parent category ID (for subcategories)',
  })
  @IsOptional()
  @IsNumber()
  parentId?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
