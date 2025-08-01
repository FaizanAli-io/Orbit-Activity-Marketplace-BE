import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  ArrayMaxSize,
  IsInt,
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
