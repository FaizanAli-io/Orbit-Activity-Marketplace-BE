import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ArrayMaxSize } from 'class-validator';

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
    type: [String],
    description: 'User preferences as a list of strings',
  })
  @IsString({ each: true })
  @ArrayMaxSize(3)
  @IsOptional()
  @IsArray()
  preferences?: string[];
}
