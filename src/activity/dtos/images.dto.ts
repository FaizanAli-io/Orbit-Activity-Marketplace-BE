import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsUrl } from 'class-validator';

export class ActivityImagesDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @IsUrl()
  video?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @IsUrl()
  thumbnail?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
