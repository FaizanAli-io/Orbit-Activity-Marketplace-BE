import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateActivityDto, UpdateActivityDto } from './dto';
import { PrismaClient, ActivityCategory } from '@prisma/client';

@Injectable()
export class ActivityService {
  private prisma = new PrismaClient();

  async create(createDto: CreateActivityDto, vendorId: string) {
    return this.prisma.activity.create({
      data: { ...createDto, vendorId },
    });
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
    return this.prisma.activity.update({ where: { id }, data: updateDto });
  }

  async remove(id: string, vendorId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.vendorId !== vendorId)
      throw new ForbiddenException('You do not own this activity');
    await this.prisma.activity.delete({ where: { id } });
    return { message: 'Activity deleted' };
  }

  async getActivityLikes(activityId: string): Promise<any[]> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { likedBy: true },
    });
    return activity?.likedBy || [];
  }

  async like(activityId: string, userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { liked: { connect: { id: activityId } } },
    });
  }

  async unlike(activityId: string, userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { liked: { disconnect: { id: activityId } } },
    });
  }

  async getActivitySubscriptions(activityId: string): Promise<any[]> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { subscribedBy: true },
    });
    return activity?.subscribedBy || [];
  }

  async subscribe(activityId: string, userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { subscribed: { connect: { id: activityId } } },
    });
  }

  async unsubscribe(activityId: string, userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { subscribed: { disconnect: { id: activityId } } },
    });
  }
}
