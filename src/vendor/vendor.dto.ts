import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateVendorDto {
  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Vendor phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Vendor profile description' })
  @IsOptional()
  @IsString()
  profileDesc?: string;

  @ApiPropertyOptional({ description: 'Vendor location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Vendor rating' })
  @IsOptional()
  @IsNumber()
  rating?: number;
}
