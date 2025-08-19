import { Injectable } from '@nestjs/common';
import { CalendarEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CategoryPreferences,
  ActivityWithCategory,
  rankActivitiesByCategory,
  filterAvailableActivities,
  filterActivitiesAvailableInRange,
} from './system';

@Injectable()
export class ReccomendationService {
  constructor(private prisma: PrismaService) {}

  async getUserRecommendations(userId: number) {
    const user = await this.prisma.user.findUnique({
      select: { preferences: true, calendar: true },
      where: { id: userId },
    });
    if (!user) throw new Error('User not found');

    const categoryPreferences: CategoryPreferences = {};
    if (user.preferences && Array.isArray(user.preferences)) {
      for (const categoryId of user.preferences) {
        if (typeof categoryId === 'number') {
          const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
            select: { parentId: true },
          });
          categoryPreferences[categoryId] = category?.parentId || null;
        }
      }
    }

    const activitiesRaw = await this.prisma.activity.findMany({
      select: {
        id: true,
        categoryId: true,
        availability: true,
        category: { select: { parentId: true } },
      },
    });

    const activities: ActivityWithCategory[] = activitiesRaw
      .filter((a) => a.availability !== null)
      .map((a) => ({
        id: a.id,
        categoryId: a.categoryId,
        parentCategoryId: a.category?.parentId ?? null,
        availability: a.availability as any,
      }));

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const availableInRange = filterActivitiesAvailableInRange(
      activities.map((a) => ({ id: a.id, availability: a.availability })),
      now,
      nextWeek,
    );

    const availableActivityIds = availableInRange.map((a) => a.id);
    const availableActivitiesWithCategory = activities.filter((a) =>
      availableActivityIds.includes(a.id),
    );

    const nonConflictingActivities = availableActivitiesWithCategory.filter(
      (activity) => {
        const conflicts = filterAvailableActivities(
          [{ id: activity.id, availability: activity.availability }],
          user.calendar as CalendarEvent[],
        );
        return conflicts.length > 0;
      },
    );

    const rankedActivities = rankActivitiesByCategory(
      nonConflictingActivities,
      categoryPreferences,
    );

    const fullActivities = await this.prisma.activity.findMany({
      where: { id: { in: rankedActivities.map((r) => r.id) } },
      include: { vendor: true, category: true },
    });

    const fullRankedActivities = rankedActivities
      .map((ranked) => {
        const activity = fullActivities.find((a) => a.id === ranked.id);
        return activity ? { ...activity, score: ranked.score } : null;
      })
      .filter(Boolean);

    return fullRankedActivities;
  }
}
