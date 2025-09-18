import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../utils/pagination.dto';
import {
  IsInt,
  IsArray,
  IsString,
  IsOptional,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'User preferences as a list of subcategory ids',
  })
  @IsInt({ each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  @IsArray()
  preferences?: number[];
}

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter users by name (case-insensitive partial match)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
