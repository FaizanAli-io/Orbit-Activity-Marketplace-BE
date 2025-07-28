import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InteractionService {
  constructor(private prisma: PrismaService) {}

  async getActivityLikes(activityId: number): Promise<any[]> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { likedBy: true },
    });
    return activity?.likedBy || [];
  }

  async like(activityId: number, userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { liked: { connect: { id: activityId } } },
    });
  }

  async unlike(activityId: number, userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { liked: { disconnect: { id: activityId } } },
    });
  }

  async getActivitySubscriptions(activityId: number): Promise<any[]> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { subscribedBy: true },
    });
    return activity?.subscribedBy || [];
  }

  async subscribe(activityId: number, userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { subscribed: { connect: { id: activityId } } },
    });
  }

  async unsubscribe(activityId: number, userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { subscribed: { disconnect: { id: activityId } } },
    });
  }
}
