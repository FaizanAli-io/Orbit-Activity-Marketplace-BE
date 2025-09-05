import { Test, TestingModule } from '@nestjs/testing';
import { GroupRecommendationService, UserProfile } from './group.core';
import {
  SingleRecommendationService,
  ActivityWithCategory,
} from './single.core';

describe('GroupRecommendationService', () => {
  let service: GroupRecommendationService;
  let singleService: SingleRecommendationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupRecommendationService, SingleRecommendationService],
    }).compile();

    service = module.get<GroupRecommendationService>(
      GroupRecommendationService,
    );
    singleService = module.get<SingleRecommendationService>(
      SingleRecommendationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateGroupRecommendations', () => {
    let mockActivities: ActivityWithCategory[];
    let mockUserProfiles: UserProfile[];

    beforeEach(() => {
      mockActivities = [
        {
          id: 1,
          categoryId: 1,
          parentCategoryId: 10,
          availability: {
            type: 'dates',
            dates: [
              { date: '2024-01-15', time: { start: '16:00', end: '20:00' } },
            ],
          },
        },
        {
          id: 2,
          categoryId: 2,
          parentCategoryId: 10,
          availability: {
            type: 'dates',
            dates: [
              { date: '2024-01-15', time: { start: '18:00', end: '22:00' } },
            ],
          },
        },
        {
          id: 3,
          categoryId: 3,
          parentCategoryId: 20,
          availability: {
            type: 'weekly',
            weekly: {
              date: { start: '2024-01-01', end: '2024-01-31' },
              days: [1, 3, 5], // Monday, Wednesday, Friday
              time: { start: '16:00', end: '20:00' },
            },
          },
        },
        {
          id: 4,
          categoryId: 4,
          parentCategoryId: 30,
          availability: {
            type: 'range',
            range: {
              date: { start: '2024-01-10', end: '2024-01-20' },
              time: { start: '12:00', end: '18:00' },
            },
          },
        },
      ];

      mockUserProfiles = [
        {
          userId: 1,
          categoryPreferences: { 1: 1, 2: 2 }, // High interest in categories 1 and 2
          calendar: [],
        },
        {
          userId: 2,
          categoryPreferences: { 2: 2, 3: 3 }, // High interest in categories 2 and 3
          calendar: [],
        },
        {
          userId: 3,
          categoryPreferences: { 1: 1, 4: 4 }, // High interest in categories 1 and 4
          calendar: [],
        },
      ];
    });

    it('should rank activities by availability count first, then by category score', () => {
      // Mock single service methods
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockImplementation((activities) => activities); // No calendar conflicts

      jest
        .spyOn(singleService, 'calculateCategoryScore')
        .mockImplementation((activity, preferences) => {
          // Perfect match gets 1.0, others get 0.5
          return preferences[activity.categoryId] != null ? 1.0 : 0.5;
        });

      const recommendations = service.generateGroupRecommendations(
        mockActivities,
        mockUserProfiles,
        { minParticipants: 2 },
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);

      // Verify sorting: activities with more available users should come first
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];

        // Check availability count is descending
        if (current.availabilityCount !== next.availabilityCount) {
          expect(current.availabilityCount).toBeGreaterThan(
            next.availabilityCount,
          );
        } else {
          // If same availability, category score should be descending
          expect(current.aggregatedCategoryScore).toBeGreaterThanOrEqual(
            next.aggregatedCategoryScore,
          );
        }
      }

      // Verify final score calculation
      recommendations.forEach((rec) => {
        const expectedFinalScore =
          rec.availabilityCount * 1000 + rec.aggregatedCategoryScore;
        expect(rec.finalScore).toBe(expectedFinalScore);
      });
    });

    it('should filter out activities with less than minimum participants', () => {
      // Mock scenario where only 1 user is available for each activity
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockImplementation((activities, calendar) => {
          // Only return activities for the first user (userId 1), others have conflicts
          const userId = mockUserProfiles.find(
            (up) => up.calendar === calendar,
          )?.userId;
          return userId === 1 ? activities : [];
        });

      jest.spyOn(singleService, 'calculateCategoryScore').mockReturnValue(1.0);

      const recommendations = service.generateGroupRecommendations(
        mockActivities,
        mockUserProfiles,
        { minParticipants: 2 },
      );

      // Should return no recommendations since minimum is 2 but only 1 user available
      expect(recommendations).toHaveLength(0);
    });

    it('should respect minimum participants setting', () => {
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockImplementation((activities) => activities);

      jest.spyOn(singleService, 'calculateCategoryScore').mockReturnValue(1.0);

      // Test with different minimum participant requirements
      const recommendationsMin2 = service.generateGroupRecommendations(
        mockActivities,
        mockUserProfiles,
        { minParticipants: 2 },
      );

      const recommendationsMin3 = service.generateGroupRecommendations(
        mockActivities,
        mockUserProfiles,
        { minParticipants: 3 },
      );

      // All activities should be available for all 3 users in this mock
      expect(recommendationsMin2.length).toBeGreaterThanOrEqual(
        recommendationsMin3.length,
      );

      // Each recommendation should meet minimum requirements
      recommendationsMin2.forEach((rec) => {
        expect(rec.availabilityCount).toBeGreaterThanOrEqual(2);
      });

      recommendationsMin3.forEach((rec) => {
        expect(rec.availabilityCount).toBeGreaterThanOrEqual(3);
      });
    });

    it('should calculate aggregated category scores correctly', () => {
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockImplementation((activities) => activities);

      // Mock different scores for different users
      jest
        .spyOn(singleService, 'calculateCategoryScore')
        .mockImplementation((activity, preferences) => {
          // User 1: category 1 = 1.0, others = 0.3
          // User 2: category 2 = 1.0, others = 0.4
          // User 3: category 1 = 1.0, others = 0.2
          if (preferences === mockUserProfiles[0].categoryPreferences) {
            return activity.categoryId === 1 ? 1.0 : 0.3;
          }
          if (preferences === mockUserProfiles[1].categoryPreferences) {
            return activity.categoryId === 2 ? 1.0 : 0.4;
          }
          if (preferences === mockUserProfiles[2].categoryPreferences) {
            return activity.categoryId === 1 ? 1.0 : 0.2;
          }
          return 0.1;
        });

      const recommendations = service.generateGroupRecommendations(
        mockActivities,
        mockUserProfiles,
        { minParticipants: 2 },
      );

      expect(recommendations.length).toBeGreaterThan(0);

      // Verify aggregated scores are averages
      recommendations.forEach((rec) => {
        expect(rec.aggregatedCategoryScore).toBeGreaterThan(0);
        expect(rec.aggregatedCategoryScore).toBeLessThanOrEqual(1.0);
      });
    });

    it('should handle calendar conflicts correctly', () => {
      const userProfilesWithConflicts: UserProfile[] = [
        {
          userId: 1,
          categoryPreferences: { 1: 1 },
          calendar: [
            {
              id: 1,
              userId: 1,
              activityId: null,
              startTime: new Date('2024-01-15T16:30:00Z'),
              endTime: new Date('2024-01-15T17:30:00Z'),
              timestamp: new Date(),
            },
          ],
        },
        {
          userId: 2,
          categoryPreferences: { 1: 1 },
          calendar: [], // No conflicts
        },
      ];

      // Mock calendar conflict detection
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockImplementation((activities, calendar) => {
          // User with calendar events has conflicts, user without doesn't
          return calendar.length === 0 ? activities : [];
        });

      jest.spyOn(singleService, 'calculateCategoryScore').mockReturnValue(1.0);

      const recommendations = service.generateGroupRecommendations(
        mockActivities,
        userProfilesWithConflicts,
        { minParticipants: 1 },
      );

      // Should include activities where at least 1 user (user 2) is available
      expect(recommendations.length).toBeGreaterThan(0);

      recommendations.forEach((rec) => {
        // Only user 2 should be available (no calendar conflicts)
        expect(rec.availableUsers).toEqual([2]);
        expect(rec.availabilityCount).toBe(1);
      });
    });

    it('should handle edge case with no available users', () => {
      // Mock scenario where all users have conflicts for all activities
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockReturnValue([]); // All activities conflict with all calendars

      const recommendations = service.generateGroupRecommendations(
        mockActivities,
        mockUserProfiles,
        { minParticipants: 1 },
      );

      expect(recommendations).toHaveLength(0);
    });

    it('should handle default minimum participants (2)', () => {
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockImplementation((activities) => activities);

      jest.spyOn(singleService, 'calculateCategoryScore').mockReturnValue(1.0);

      // Call without specifying minParticipants - should default to 2
      const recommendations = service.generateGroupRecommendations(
        mockActivities,
        mockUserProfiles,
      );

      // All recommendations should have at least 2 participants
      recommendations.forEach((rec) => {
        expect(rec.availabilityCount).toBeGreaterThanOrEqual(2);
      });
    });

    it('should return empty array for empty input', () => {
      const recommendations = service.generateGroupRecommendations(
        [],
        mockUserProfiles,
        { minParticipants: 2 },
      );

      expect(recommendations).toEqual([]);
    });

    it('should handle single activity correctly', () => {
      jest
        .spyOn(singleService, 'filterAvailableActivities')
        .mockImplementation((activities) => activities);

      jest.spyOn(singleService, 'calculateCategoryScore').mockReturnValue(0.8);

      const singleActivity = [mockActivities[0]];
      const recommendations = service.generateGroupRecommendations(
        singleActivity,
        mockUserProfiles,
        { minParticipants: 2 },
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].id).toBe(singleActivity[0].id);
      expect(recommendations[0].availabilityCount).toBe(3); // All 3 users available
      expect(recommendations[0].aggregatedCategoryScore).toBeCloseTo(0.8, 2);
      expect(recommendations[0].finalScore).toBeCloseTo(3000.8, 2); // (3 * 1000) + 0.8
    });
  });
});
