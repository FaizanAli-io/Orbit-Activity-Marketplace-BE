import { Injectable } from '@nestjs/common';
import { PrismaClient, Vendor, Prisma } from '@prisma/client';

@Injectable()
export class VendorService {
  private prisma = new PrismaClient();

  async create(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({ data });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.vendor
      .findMany({
        include: { auth: { select: { email: true } } },
      })
      .then((vendors) =>
        vendors.map(({ auth, ...v }) => ({ ...v, email: auth[0]?.email })),
      );
  }

  async findOne(id: string): Promise<any | null> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { auth: { select: { email: true } } },
    });
    if (!vendor) return null;
    const { auth, ...v } = vendor;
    return { ...v, email: auth[0]?.email };
  }

  async update(id: string, data: Prisma.VendorUpdateInput): Promise<Vendor> {
    return this.prisma.vendor.update({ where: { id }, data });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.prisma.auth.deleteMany({ where: { vendorId: id } });
    await this.prisma.vendor.delete({ where: { id } });
    return { message: 'Vendor and auth deleted' };
  }
}
