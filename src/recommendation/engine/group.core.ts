import { CalendarEvent } from '@prisma/client';
import { Injectable, Module } from '@nestjs/common';
import {
  SingleRecommendationService,
  SingleRecommendationModule,
  CategoryPreferences,
  ActivityWithCategory,
} from './single.core';

export interface UserProfile {
  userId: number;
  categoryPreferences: CategoryPreferences;
  calendar: CalendarEvent[];
}

export interface GroupRecommendationOptions {
  rangeStart?: Date;
  rangeEnd?: Date;
  minParticipants?: number; // Minimum number of users that must be available
}

export interface ActivityGroupScore extends ActivityWithCategory {
  availableUsers: number[];
  availabilityCount: number;
  aggregatedCategoryScore: number;
  finalScore: number;
}

@Injectable()
export class GroupRecommendationService {
  constructor(
    private readonly singleRecommendationService: SingleRecommendationService,
  ) {}

  /**
   * Generate recommendations for a group of users
   * Activities are ranked by:
   * 1. Number of available users (descending)
   * 2. Aggregated category score (descending)
   */
  generateGroupRecommendations(
    activities: ActivityWithCategory[],
    userProfiles: UserProfile[],
    options?: GroupRecommendationOptions,
  ): ActivityGroupScore[] {
    const minParticipants = options?.minParticipants || 2;

    // Calculate availability and scores for each activity
    const scoredActivities = activities
      .map((activity) => {
        const availableUsers = this.getAvailableUsers(
          activity,
          userProfiles,
          options,
        );
        const availabilityCount = availableUsers.length;

        // Skip activities that don't meet minimum participant requirement
        if (availabilityCount < minParticipants) {
          return null;
        }

        const aggregatedCategoryScore = this.calculateAggregatedCategoryScore(
          activity,
          userProfiles.filter((up) => availableUsers.includes(up.userId)),
        );

        // Calculate final score: prioritize availability count, then category score
        const finalScore = availabilityCount * 1000 + aggregatedCategoryScore;

        return {
          ...activity,
          availableUsers,
          availabilityCount,
          aggregatedCategoryScore,
          finalScore,
        } as ActivityGroupScore;
      })
      .filter(Boolean) as ActivityGroupScore[];

    // Sort by final score (descending)
    return scoredActivities.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Get users who are available for a specific activity
   */
  private getAvailableUsers(
    activity: ActivityWithCategory,
    userProfiles: UserProfile[],
    options?: GroupRecommendationOptions,
  ): number[] {
    return userProfiles
      .filter((userProfile) => {
        // Check range availability if specified
        if (options?.rangeStart && options?.rangeEnd) {
          if (
            !this.singleRecommendationService.isAvailableInRange(
              activity.availability,
              options.rangeStart,
              options.rangeEnd,
            )
          ) {
            return false;
          }
        }

        // Check calendar conflicts
        const hasConflict =
          !this.singleRecommendationService.filterAvailableActivities(
            [activity],
            userProfile.calendar,
          ).length;

        return !hasConflict;
      })
      .map((up) => up.userId);
  }

  /**
   * Calculate the aggregated category score for available users
   * Returns the average category score of all available users
   */
  private calculateAggregatedCategoryScore(
    activity: ActivityWithCategory,
    availableUserProfiles: UserProfile[],
  ): number {
    if (availableUserProfiles.length === 0) return 0;

    const totalScore = availableUserProfiles.reduce((sum, userProfile) => {
      const userCategoryScore =
        this.singleRecommendationService.calculateCategoryScore(
          activity,
          userProfile.categoryPreferences,
        );
      return sum + userCategoryScore;
    }, 0);

    return totalScore / availableUserProfiles.length;
  }

  /**
   * Filter recommendations by minimum number of participants
   */
  filterByMinimumParticipants(
    recommendations: ActivityGroupScore[],
    minParticipants: number,
  ): ActivityGroupScore[] {
    return recommendations.filter(
      (activity) => activity.availabilityCount >= minParticipants,
    );
  }

  /**
   * Get activities available for all users in the group
   */
  getActivitiesForAllUsers(
    activities: ActivityWithCategory[],
    userProfiles: UserProfile[],
    options?: Omit<GroupRecommendationOptions, 'minParticipants'>,
  ): ActivityGroupScore[] {
    return this.generateGroupRecommendations(activities, userProfiles, {
      ...options,
      minParticipants: userProfiles.length,
    });
  }

  /**
   * Get activities grouped by number of available participants
   */
  getActivitiesGroupedByParticipants(
    activities: ActivityWithCategory[],
    userProfiles: UserProfile[],
    options?: Omit<GroupRecommendationOptions, 'minParticipants'>,
  ): { [participantCount: number]: ActivityGroupScore[] } {
    const allRecommendations = this.generateGroupRecommendations(
      activities,
      userProfiles,
      { ...options, minParticipants: 2 },
    );

    const grouped: { [participantCount: number]: ActivityGroupScore[] } = {};

    allRecommendations.forEach((activity) => {
      const count = activity.availabilityCount;
      if (!grouped[count]) {
        grouped[count] = [];
      }
      grouped[count].push(activity);
    });

    // Sort each group by aggregated category score
    Object.keys(grouped).forEach((key) => {
      grouped[parseInt(key)].sort(
        (a, b) => b.aggregatedCategoryScore - a.aggregatedCategoryScore,
      );
    });

    return grouped;
  }

  /**
   * Get a summary of group availability statistics
   */
  getGroupAvailabilityStats(
    activities: ActivityWithCategory[],
    userProfiles: UserProfile[],
    options?: Omit<GroupRecommendationOptions, 'minParticipants'>,
  ): {
    totalActivities: number;
    activitiesForAllUsers: number;
    activitiesByParticipantCount: { [count: number]: number };
    averageAvailability: number;
  } {
    const recommendations = this.generateGroupRecommendations(
      activities,
      userProfiles,
      { ...options, minParticipants: 1 },
    );

    const activitiesForAllUsers = recommendations.filter(
      (activity) => activity.availabilityCount === userProfiles.length,
    ).length;

    const activitiesByParticipantCount: { [count: number]: number } = {};
    let totalAvailabilitySum = 0;

    recommendations.forEach((activity) => {
      const count = activity.availabilityCount;
      activitiesByParticipantCount[count] =
        (activitiesByParticipantCount[count] || 0) + 1;
      totalAvailabilitySum += count;
    });

    const averageAvailability =
      recommendations.length > 0
        ? totalAvailabilitySum / recommendations.length
        : 0;

    return {
      totalActivities: activities.length,
      activitiesForAllUsers,
      activitiesByParticipantCount,
      averageAvailability,
    };
  }
}

@Module({
  imports: [SingleRecommendationModule],
  providers: [GroupRecommendationService],
  exports: [GroupRecommendationService],
})
export class GroupRecommendationModule {}
