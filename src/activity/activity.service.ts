import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto, UpdateActivityDto } from './dtos';
import { getCategoryObjectsByIds } from '../utils/category.utils';
import {
  PaginationHelper,
  PaginationOptions,
  PaginationResult,
} from '../utils/pagination.utils';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async buildCategory(activity: any): Promise<any> {
    const categoryInfo = await getCategoryObjectsByIds(this.prisma, [
      activity.categoryId,
    ]);

    return { ...activity, category: categoryInfo[0] };
  }

  private convertDtoToPrismaData(
    dto: CreateActivityDto | UpdateActivityDto,
    vendorId?: number,
  ) {
    const data: any = { ...dto };

    if (dto.availability)
      data.availability = JSON.parse(JSON.stringify(dto.availability));

    if (dto.images) data.images = JSON.parse(JSON.stringify(dto.images));

    if (vendorId) data.vendorId = vendorId;

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

  async findAll(
    filters: any,
    paginationOptions: PaginationOptions = {},
    userId?: number,
  ): Promise<PaginationResult<any>> {
    const where: any = {};
    if (filters.location) where.location = filters.location;
    if (filters.vendorId) where.vendorId = parseInt(filters.vendorId);
    if (filters.categoryId) where.categoryId = parseInt(filters.categoryId);
    if (filters.name)
      where.name = { mode: 'insensitive', contains: filters.name };

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }

    let orderBy: any = { timestamp: 'desc' };

    if (filters.sortBy === 'likes') {
      orderBy = { likedBy: { _count: 'desc' } };
    } else if (filters.sortBy === 'subscriptions') {
      orderBy = { subscribedBy: { _count: 'desc' } };
    } else if (filters.sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (filters.sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    return PaginationHelper.paginate(
      // Count function
      () => this.prisma.activity.count({ where }),

      // Data function
      async (paginationParams) => {
        const activities = await this.prisma.activity.findMany({
          where,
          orderBy,
          skip: paginationParams.skip,
          take: paginationParams.take,
          include: {
            vendor: true,
            category: true,
            _count: { select: { likedBy: true, subscribedBy: true } },
            ...(userId && {
              likedBy: {
                where: { id: userId },
                select: { id: true },
              },
              subscribedBy: {
                where: { id: userId },
                select: { id: true },
              },
            }),
          },
        });

        return Promise.all(
          activities.map((activity) => {
            const { likedBy, subscribedBy, ...activityData } = activity;
            const enhancedActivity = {
              ...activityData,
              liked: userId ? likedBy.length > 0 : false,
              subscribed: userId ? subscribedBy.length > 0 : false,
            };
            return this.buildCategory(enhancedActivity);
          }),
        );
      },
      paginationOptions,
    );
  }

  async findOne(id: number) {
    const args = { where: { id }, include: { vendor: true, category: true } };
    const activity = await this.prisma.activity.findUnique({ ...args });
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
