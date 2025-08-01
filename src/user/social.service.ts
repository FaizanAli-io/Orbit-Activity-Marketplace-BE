import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async listFriendRequests(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { pendingFrom: true },
    });

    return user?.pendingFrom || [];
  }

  async sendFriendRequest(fromId: number, toId: number) {
    if (fromId === toId)
      throw new BadRequestException('Cannot friend yourself');

    const from = await this.prisma.user.findUnique({
      where: { id: fromId },
      include: { friends: true, pendingFriends: true },
    });

    if (!from) throw new NotFoundException('User not found');

    if (from.friends.some((f) => f.id === toId))
      throw new BadRequestException('Already friends');

    if (from.pendingFriends.some((f) => f.id === toId))
      throw new BadRequestException('Request already sent');

    await this.prisma.user.update({
      where: { id: fromId },
      data: { pendingFriends: { connect: { id: toId } } },
    });

    return { message: 'Friend request sent' };
  }

  async acceptFriendRequest(userId: number, fromId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingFrom: { disconnect: { id: fromId } } },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { friends: { connect: { id: fromId } } },
    });

    await this.prisma.user.update({
      where: { id: fromId },
      data: { friends: { connect: { id: userId } } },
    });

    return { message: 'Friend request accepted' };
  }

  async declineFriendRequest(userId: number, fromId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingFrom: { disconnect: { id: fromId } } },
    });

    return { message: 'Friend request declined' };
  }

  async listFriends(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { friends: true },
    });

    return user?.friends || [];
  }

  async removeFriend(userId: number, friendId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { friends: { disconnect: { id: friendId } } },
    });

    await this.prisma.user.update({
      where: { id: friendId },
      data: { friends: { disconnect: { id: userId } } },
    });

    return { message: 'Friend removed' };
  }
}
