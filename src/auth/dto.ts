import { AuthRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class SignupDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Password (required if firebaseId not provided)',
  })
  @IsOptional()
  @ValidateIf((o) => !o.firebaseId)
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description: 'Firebase ID (required if password not provided)',
  })
  @IsOptional()
  @ValidateIf((o) => !o.password)
  @IsString()
  firebaseId?: string;

  @ApiProperty({ enum: AuthRole })
  @IsEnum(AuthRole)
  type: AuthRole;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Password (required if firebaseId not provided)',
  })
  @IsOptional()
  @ValidateIf((o) => !o.firebaseId)
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'Firebase ID (required if password not provided)',
  })
  @IsOptional()
  @ValidateIf((o) => !o.password)
  @IsString()
  firebaseId?: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class RequestResetDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
