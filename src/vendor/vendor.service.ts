import { Injectable } from '@nestjs/common';
import { PrismaClient, Vendor, Prisma } from '@prisma/client';

@Injectable()
export class VendorService {
  private prisma = new PrismaClient();

  async create(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({ data });
  }

  async findAll(): Promise<Vendor[]> {
    return this.prisma.vendor.findMany();
  }

  async findOne(id: string): Promise<Vendor | null> {
    return this.prisma.vendor.findUnique({ where: { id } });
  }
}
