import { Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePaymentDto, userId: number): Promise<Payment> {
    return this.prisma.payment.create({ data: { ...data, userId } });
  }

  async findAll(userId: number): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { user: true, vendor: true, activity: true },
    });
  }

  async findOne(id: number, userId: number): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { user: true, vendor: true, activity: true },
    });

    if (!payment || payment.userId !== userId)
      throw new NotFoundException('Payment not found');

    return payment;
  }

  async update(
    id: number,
    data: UpdatePaymentDto,
    userId: number,
  ): Promise<Payment> {
    await this.findOne(id, userId);
    return this.prisma.payment.update({ where: { id }, data });
  }

  async remove(id: number, userId: number): Promise<Payment> {
    await this.findOne(id, userId);
    return this.prisma.payment.delete({ where: { id } });
  }
}
