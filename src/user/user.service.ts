import { UpdateUserDto } from './user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { getCategoryObjectsByIds } from '../utils/category.utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async mapUser(user: any): Promise<any> {
    const { auth, preferences, ...u } = user;
    return {
      ...u,
      email: auth[0]?.email,
      preferences: await getCategoryObjectsByIds(
        this.prisma,
        Array.isArray(preferences)
          ? preferences.filter((id): id is number => typeof id === 'number')
          : [],
      ),
    };
  }

  async findAll(): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      include: { auth: { select: { email: true } } },
    });

    return Promise.all(users.map((user) => this.mapUser(user)));
  }

  async update(id: number, data: UpdateUserDto): Promise<any> {
    if (data.preferences && Array.isArray(data.preferences)) {
      const validSubcategories = await this.prisma.category.findMany({
        where: { id: { in: data.preferences }, parentId: { not: null } },
        select: { id: true },
      });

      const validIds = validSubcategories.map((s) => s.id);
      const invalidIds = data.preferences.filter(
        (id) => !validIds.includes(id),
      );
      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Invalid subcategory IDs: ${invalidIds.join(', ')}`,
        );
      }
    }

    await this.prisma.user.update({ where: { id }, data });
    const userWithAuth = await this.prisma.user.findUnique({
      where: { id },
      include: { auth: { select: { email: true } } },
    });
    return this.mapUser(userWithAuth);
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
