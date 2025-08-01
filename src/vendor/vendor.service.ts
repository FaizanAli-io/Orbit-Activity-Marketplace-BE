import { Vendor } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { UpdateVendorDto } from './vendor.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    return this.prisma.vendor
      .findMany({
        include: { auth: { select: { email: true } } },
      })
      .then((vendors) =>
        vendors.map(({ auth, ...v }) => ({ ...v, email: auth[0]?.email })),
      );
  }

  async update(id: number, data: UpdateVendorDto): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.prisma.auth.deleteMany({ where: { vendorId: id } });
    await this.prisma.vendor.delete({ where: { id } });
    return { message: 'Vendor and auth deleted' };
  }
}
