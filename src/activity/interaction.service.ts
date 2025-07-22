import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class InteractionService {
  private prisma = new PrismaClient();

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
