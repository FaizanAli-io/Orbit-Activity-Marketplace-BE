import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { IsInt, IsEnum, IsNumber, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsInt()
  userId: number;

  @ApiProperty()
  @IsInt()
  vendorId: number;

  @ApiProperty()
  @IsInt()
  activityId: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
