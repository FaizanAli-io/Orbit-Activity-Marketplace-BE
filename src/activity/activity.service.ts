import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateActivityDto, UpdateActivityDto } from './dtos';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ActivityService {
  private prisma = new PrismaClient();

  private convertDtoToPrismaData(
    dto: CreateActivityDto | UpdateActivityDto,
    vendorId?: number,
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

  async create(createDto: CreateActivityDto, vendorId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: createDto.categoryId },
    });

    if (!category)
      throw new NotFoundException(
        `Category with ID ${createDto.categoryId} not found`,
      );

    const data = this.convertDtoToPrismaData(createDto, vendorId);
    return this.prisma.activity.create({ data });
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.location) where.location = filters.location;
    if (filters.vendorId) where.vendorId = parseInt(filters.vendorId);
    if (filters.categoryId) where.categoryId = parseInt(filters.categoryId);
    return this.prisma.activity.findMany({ where });
  }

  async findOne(id: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async update(id: number, updateDto: UpdateActivityDto, vendorId: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.vendorId !== vendorId)
      throw new ForbiddenException('You do not own this activity');

    const data = this.convertDtoToPrismaData(updateDto);
    return this.prisma.activity.update({ where: { id }, data });
  }

  async remove(id: number, vendorId: number) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.vendorId !== vendorId)
      throw new ForbiddenException('You do not own this activity');
    await this.prisma.activity.delete({ where: { id } });
    return { message: 'Activity deleted' };
  }
}
