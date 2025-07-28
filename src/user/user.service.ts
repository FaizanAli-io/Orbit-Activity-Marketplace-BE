import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './user.dto';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class UserService {
  private prisma = new PrismaClient();

  async findAll(): Promise<any[]> {
    return this.prisma.user
      .findMany({
        include: { auth: { select: { email: true } } },
      })
      .then((users) =>
        users.map(({ auth, ...u }) => ({ ...u, email: auth[0]?.email })),
      );
  }

  async findOne(id: number): Promise<any | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { auth: { select: { email: true } } },
    });
    if (!user) return null;
    const { auth, ...u } = user;
    return { ...u, email: auth[0]?.email };
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.prisma.auth.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User and auth deleted' };
  }

  async getLiked(id: number): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { liked: true },
    });
    return user?.liked || [];
  }

  async getSubscriptions(id: number): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { subscribed: true },
    });
    return user?.subscribed || [];
  }
}
