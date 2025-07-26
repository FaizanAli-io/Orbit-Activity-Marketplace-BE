import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateActivityDto, UpdateActivityDto } from './dtos';
import { PrismaClient, ActivityCategory } from '@prisma/client';

@Injectable()
export class ActivityService {
  private prisma = new PrismaClient();

  private convertDtoToPrismaData(
    dto: CreateActivityDto | UpdateActivityDto,
    vendorId?: string,
  ) {
    const data: any = { ...dto };

    if (dto.availability) {
      data.availability = JSON.parse(JSON.stringify(dto.availability));
    }

    if (dto.images) {
      data.images = JSON.parse(JSON.stringify(dto.images));
    }

    if (vendorId) {
      data.vendorId = vendorId;
    }

    return data;
  }

  async create(createDto: CreateActivityDto, vendorId: string) {
    const data = this.convertDtoToPrismaData(createDto, vendorId);
    return this.prisma.activity.create({ data });
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.category) where.category = filters.category as ActivityCategory;
    if (filters.location) where.location = filters.location;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    return this.prisma.activity.findMany({ where });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async update(id: string, updateDto: UpdateActivityDto, vendorId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.vendorId !== vendorId)
      throw new ForbiddenException('You do not own this activity');

    const data = this.convertDtoToPrismaData(updateDto);
    return this.prisma.activity.update({ where: { id }, data });
  }

  async remove(id: string, vendorId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.vendorId !== vendorId)
      throw new ForbiddenException('You do not own this activity');
    await this.prisma.activity.delete({ where: { id } });
    return { message: 'Activity deleted' };
  }
}
