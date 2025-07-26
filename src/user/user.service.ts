import { Injectable } from '@nestjs/common';
import { PrismaClient, User, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  private prisma = new PrismaClient();

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.user
      .findMany({
        include: { auth: { select: { email: true } } },
      })
      .then((users) =>
        users.map(({ auth, ...u }) => ({ ...u, email: auth[0]?.email })),
      );
  }

  async findOne(id: string): Promise<any | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { auth: { select: { email: true } } },
    });
    if (!user) return null;
    const { auth, ...u } = user;
    return { ...u, email: auth[0]?.email };
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  async deleteAuth(id: string): Promise<void> {
    await this.prisma.auth.delete({ where: { userId: id } });
  }

  async getLiked(id: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { liked: true },
    });
    return user?.liked || [];
  }

  async getSubscriptions(id: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { subscribed: true },
    });
    return user?.subscribed || [];
  }
}
