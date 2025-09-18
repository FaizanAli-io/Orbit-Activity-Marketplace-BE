import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './user.dto';
import { getCategoryObjectsByIds } from '../utils/category.utils';
import {
  PaginationHelper,
  PaginationOptions,
  PaginationResult,
} from '../utils/pagination.utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private async mapUser(
    user: any,
    opts?: { isFriend?: boolean; hasPendingRequest?: boolean },
  ): Promise<any> {
    const { auth, preferences, ...u } = user;

    const prefIds = Array.isArray(preferences)
      ? preferences.filter((id): id is number => typeof id === 'number')
      : [];

    return {
      ...u,
      email: auth?.[0]?.email,
      preferences: prefIds.length
        ? await getCategoryObjectsByIds(this.prisma, prefIds)
        : [],
      isFriend: opts?.isFriend ?? false,
      hasPendingRequest: opts?.hasPendingRequest ?? false,
    };
  }

  async findAll(
    currentUserId: number,
    search?: string,
    pagination: PaginationOptions = {},
  ): Promise<PaginationResult<any>> {
    return PaginationHelper.paginate(
      // Count function
      () =>
        this.prisma.user.count({
          where: search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {},
        }),

      // Data function
      async ({ skip, take }) => {
        const users = await this.prisma.user.findMany({
          where: search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {},
          include: {
            auth: { select: { email: true } },
            _count: {
              select: {
                friends: { where: { id: currentUserId } },
                pendingFrom: { where: { id: currentUserId } },
              },
            },
          },
          skip,
          take,
          orderBy: { id: 'asc' },
        });

        return Promise.all(
          users.map((u) => {
            const { _count, ...rest } = u;
            return this.mapUser(rest, {
              isFriend: _count.friends > 0,
              hasPendingRequest: _count.pendingFrom > 0,
            });
          }),
        );
      },

      pagination,
    );
  }

  async update(id: number, data: UpdateUserDto): Promise<any> {
    if (data.preferences?.length) {
      const validSubcategories = await this.prisma.category.findMany({
        where: { id: { in: data.preferences }, parentId: { not: null } },
        select: { id: true },
      });

      const validIds = validSubcategories.map((s) => s.id);
      const invalidIds = data.preferences.filter(
        (id) => !validIds.includes(id),
      );

      if (invalidIds.length) {
        throw new BadRequestException(
          `Invalid subcategory IDs: ${invalidIds.join(', ')}`,
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: { auth: { select: { email: true } } },
    });

    return this.mapUser(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.prisma.auth.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User and auth deleted' };
  }

  async getLiked(
    id: number,
    paginationOptions: PaginationOptions = {},
  ): Promise<PaginationResult<any>> {
    return PaginationHelper.paginate(
      async () =>
        (
          await this.prisma.user.findUnique({
            where: { id },
            select: { _count: { select: { liked: true } } },
          })
        )?._count.liked || 0,

      async ({ skip, take }) =>
        (
          await this.prisma.user.findUnique({
            where: { id },
            select: {
              liked: {
                include: { vendor: true, category: true },
                skip,
                take,
                orderBy: { timestamp: 'desc' },
              },
            },
          })
        )?.liked || [],

      paginationOptions,
    );
  }

  async getSubscriptions(
    id: number,
    paginationOptions: PaginationOptions = {},
  ): Promise<PaginationResult<any>> {
    return PaginationHelper.paginate(
      async () =>
        (
          await this.prisma.user.findUnique({
            where: { id },
            select: { _count: { select: { subscribed: true } } },
          })
        )?._count.subscribed || 0,

      async ({ skip, take }) =>
        (
          await this.prisma.user.findUnique({
            where: { id },
            select: {
              subscribed: {
                include: { vendor: true, category: true },
                skip,
                take,
                orderBy: { timestamp: 'desc' },
              },
            },
          })
        )?.subscribed || [],

      paginationOptions,
    );
  }
}
