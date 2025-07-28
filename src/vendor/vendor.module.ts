import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [VendorController],
  providers: [VendorService],
  imports: [PrismaModule],
})
export class VendorModule {}
