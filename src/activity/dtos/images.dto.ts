import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsUrl } from 'class-validator';

export class ActivityImagesDto {
  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/videos/activity-demo.mp4',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  video?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/images/activity-thumbnail.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  thumbnail?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://example.com/images/activity-1.jpg',
      'https://example.com/images/activity-2.jpg',
      'https://example.com/images/activity-3.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
