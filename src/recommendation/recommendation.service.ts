import { CalendarEvent } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import {
  CategoryPreferences,
  ActivityWithCategory,
  SingleRecommendationService,
} from './engine/single.core';

import {
  UserProfile,
  ActivityGroupScore,
  GroupRecommendationService,
} from './engine/group.core';

import {
  PaginationHelper,
  PaginationOptions,
  PaginationResult,
} from '../utils/pagination.utils';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private prisma: PrismaService,
    private engineCore: SingleRecommendationService,
    private groupEngine: GroupRecommendationService,
  ) {}

  async getUserRecommendations(
    userId: number,
    dateRange: { rangeStart?: Date; rangeEnd?: Date } = {},
    paginationOptions: PaginationOptions = {},
  ): Promise<PaginationResult<any>> {
    this.logger.log(`Getting recommendations for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      select: { preferences: true, calendar: true },
      where: { id: userId },
    });
    if (!user) throw new Error('User not found');

    const allRankedActivities = await this.getAllRankedRecommendations(
      user,
      dateRange,
    );

    const { page, limit } =
      PaginationHelper.validateAndNormalize(paginationOptions);
    const { skip, take } = PaginationHelper.getPaginationParams(page, limit);

    const paginatedData = allRankedActivities.slice(skip, skip + take);

    this.logger.log(
      `Returning ${paginatedData.length} recommendations for user ${userId}`,
    );

    return PaginationHelper.buildPaginationResult(
      paginatedData,
      allRankedActivities.length,
      page,
      limit,
    );
  }

  private async getAllRankedRecommendations(
    user: any,
    dateRange: { rangeStart?: Date; rangeEnd?: Date } = {},
  ): Promise<any[]> {
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

    // Use provided date range or default to next week
    const startDate = dateRange.rangeStart || new Date();
    const endDate =
      dateRange.rangeEnd ||
      (() => {
        const defaultEnd = new Date(startDate);
        defaultEnd.setDate(startDate.getDate() + 7);
        return defaultEnd;
      })();

    this.logger.log(
      `Filtering activities from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const availableInRange = this.engineCore.filterActivitiesAvailableInRange(
      activities.map((a) => ({ id: a.id, availability: a.availability })),
      startDate,
      endDate,
    );

    this.logger.log(
      `Found ${availableInRange.length} activities available in date range`,
    );

    const availableActivityIds = availableInRange.map((a) => a.id);
    const availableActivitiesWithCategory = activities.filter((a) =>
      availableActivityIds.includes(a.id),
    );

    const nonConflictingActivities = availableActivitiesWithCategory.filter(
      (activity) => {
        const nonConflicting = this.engineCore.filterAvailableActivities(
          [{ id: activity.id, availability: activity.availability }],
          user.calendar as CalendarEvent[],
        );
        return nonConflicting.length > 0;
      },
    );

    this.logger.log(
      `Found ${nonConflictingActivities.length} activities without calendar conflicts`,
    );

    const rankedActivities = this.engineCore.rankActivitiesByCategory(
      nonConflictingActivities,
      categoryPreferences,
    );

    this.logger.log(
      `Ranked ${rankedActivities.length} activities by category preferences`,
    );

    const fullActivities = await this.prisma.activity.findMany({
      where: { id: { in: rankedActivities.map((r) => r.id) } },
      include: { vendor: true, category: true },
    });

    return rankedActivities
      .map((ranked) => {
        const activity = fullActivities.find((a) => a.id === ranked.id);
        if (activity) {
          this.logger.log(
            `Activity ${activity.id} - Score: ${ranked.score?.toFixed(2)}`,
          );
        }
        return activity ? { ...activity, score: ranked.score } : null;
      })
      .filter(Boolean);
  }

  async getGroupRecommendations(
    userIds: number[],
    dateRange: { rangeStart?: Date; rangeEnd?: Date } = {},
    paginationOptions: PaginationOptions = {},
  ): Promise<PaginationResult<any>> {
    if (userIds.length < 2) {
      throw new Error(
        'At least 2 users are required for group recommendations',
      );
    }

    // Use provided date range or default to next week
    const startDate = dateRange.rangeStart || new Date();
    const endDate =
      dateRange.rangeEnd ||
      (() => {
        const defaultEnd = new Date(startDate);
        defaultEnd.setDate(startDate.getDate() + 7);
        return defaultEnd;
      })();

    this.logger.log(
      `Starting group recommendations for ${userIds.length} users: [${userIds.join(', ')}] from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const userProfiles = await this.buildUserProfiles(userIds);
    const activities = await this.getAllActivities();

    this.logger.log(`Found ${activities.length} activities to evaluate`);

    // Use minimum of 2 participants by default and apply date range
    const groupRecommendations = this.groupEngine.generateGroupRecommendations(
      activities,
      userProfiles,
      {
        minParticipants: 2,
        rangeStart: startDate,
        rangeEnd: endDate,
      },
    );

    this.logger.log(
      `Generated ${groupRecommendations.length} group recommendations`,
    );

    // Log top 10 recommendations with detailed scoring
    const topRecommendations = groupRecommendations.slice(0, 10);
    topRecommendations.forEach((rec, index) => {
      this.logger.log(
        `Rank ${index + 1}: Activity ${rec.id} - ` +
          `Available Users: ${rec.availabilityCount}/${userIds.length} [${rec.availableUsers.join(', ')}] - ` +
          `Category Score: ${rec.aggregatedCategoryScore.toFixed(3)} - ` +
          `Final Score: ${rec.finalScore.toFixed(1)}`,
      );
    });

    const enrichedRecommendations =
      await this.enrichGroupRecommendations(groupRecommendations);

    const { page, limit } =
      PaginationHelper.validateAndNormalize(paginationOptions);
    const { skip, take } = PaginationHelper.getPaginationParams(page, limit);

    const paginatedData = enrichedRecommendations.slice(skip, skip + take);

    this.logger.log(
      `Returning page ${page} with ${paginatedData.length} activities ` +
        `(${skip + 1}-${skip + paginatedData.length} of ${enrichedRecommendations.length} total)`,
    );

    return PaginationHelper.buildPaginationResult(
      paginatedData,
      enrichedRecommendations.length,
      page,
      limit,
    );
  }

  private async buildUserProfiles(userIds: number[]): Promise<UserProfile[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, preferences: true, calendar: true },
    });

    if (users.length !== userIds.length) {
      throw new Error('One or more users not found');
    }

    this.logger.log(`Building user profiles for ${users.length} users`);

    const userProfiles: UserProfile[] = [];

    for (const user of users) {
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

      const calendarEventsCount =
        (user.calendar as CalendarEvent[])?.length || 0;
      const preferenceCategories = Object.keys(categoryPreferences);

      this.logger.log(
        `User ${user.id}: ${preferenceCategories.length} preferred categories [${preferenceCategories.join(', ')}], ` +
          `${calendarEventsCount} calendar events`,
      );

      userProfiles.push({
        userId: user.id,
        categoryPreferences,
        calendar: user.calendar as CalendarEvent[],
      });
    }

    return userProfiles;
  }

  private async getAllActivities(): Promise<ActivityWithCategory[]> {
    const activitiesRaw = await this.prisma.activity.findMany({
      select: {
        id: true,
        categoryId: true,
        availability: true,
        category: { select: { parentId: true } },
      },
    });

    return activitiesRaw
      .filter((a) => a.availability !== null)
      .map((a) => ({
        id: a.id,
        categoryId: a.categoryId,
        parentCategoryId: a.category?.parentId ?? null,
        availability: a.availability as any,
      }));
  }

  private async enrichGroupRecommendations(
    recommendations: ActivityGroupScore[],
  ): Promise<any[]> {
    if (recommendations.length === 0) return [];

    this.logger.log(
      `Enriching ${recommendations.length} recommendations with full activity details`,
    );

    const fullActivities = await this.prisma.activity.findMany({
      where: { id: { in: recommendations.map((r) => r.id) } },
      include: { vendor: true, category: true },
    });

    const enrichedResults = recommendations
      .map((recommendation) => {
        const activity = fullActivities.find((a) => a.id === recommendation.id);
        if (!activity) return null;

        return {
          ...activity,
          groupScore: {
            availableUsers: recommendation.availableUsers,
            availabilityCount: recommendation.availabilityCount,
            aggregatedCategoryScore: recommendation.aggregatedCategoryScore,
            finalScore: recommendation.finalScore,
          },
        };
      })
      .filter(Boolean);

    this.logger.log(
      `Successfully enriched ${enrichedResults.length} recommendations`,
    );

    return enrichedResults;
  }
}
