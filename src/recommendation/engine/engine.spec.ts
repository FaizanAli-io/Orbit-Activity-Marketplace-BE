import { EngineCoreService, ActivityWithCategory } from './engine.core';
import { CalendarEvent } from '@prisma/client';

describe('EngineCoreService - Comprehensive Test Suite', () => {
  const service = new EngineCoreService();

  describe('Category Scoring System', () => {
    describe('calculateCategoryScore', () => {
      it('gives full score (1.0) for direct preference match', () => {
        const act: ActivityWithCategory = {
          id: 1,
          categoryId: 2,
          parentCategoryId: 5,
          availability: { type: 'dates', dates: [] } as any,
        };
        const prefs = { 2: 5 }; // direct match
        expect(service.calculateCategoryScore(act, prefs)).toBe(1.0);
      });

      it('gives partial score (0.5) for one shared parent category', () => {
        const act: ActivityWithCategory = {
          id: 1,
          categoryId: 3,
          parentCategoryId: 5,
          availability: { type: 'dates', dates: [] } as any,
        };
        const prefs = { 10: 5 }; // same parent category
        expect(service.calculateCategoryScore(act, prefs)).toBe(0.5);
      });

      it('gives increased score for multiple shared parent categories', () => {
        const act: ActivityWithCategory = {
          id: 1,
          categoryId: 3,
          parentCategoryId: 5,
          availability: { type: 'dates', dates: [] } as any,
        };
        const prefs = { 10: 5, 11: 5, 12: 5 }; // 3 preferences with same parent
        const score = service.calculateCategoryScore(act, prefs);
        expect(score).toBe(0.7); // 0.5 + 0.1 * (3-1)
      });

      it('caps score at 1.0 even with many shared parent categories', () => {
        const act: ActivityWithCategory = {
          id: 1,
          categoryId: 3,
          parentCategoryId: 5,
          availability: { type: 'dates', dates: [] } as any,
        };
        const prefs = { 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5 }; // 6 preferences
        const score = service.calculateCategoryScore(act, prefs);
        expect(score).toBe(1.0); // capped at 1.0
      });

      it('returns 0 when no category relation exists', () => {
        const act: ActivityWithCategory = {
          id: 1,
          categoryId: 3,
          parentCategoryId: 6,
          availability: { type: 'dates', dates: [] } as any,
        };
        const prefs = { 1: 1, 2: 2 }; // no matching categories or parents
        expect(service.calculateCategoryScore(act, prefs)).toBe(0);
      });

      it('handles null parent category correctly', () => {
        const act: ActivityWithCategory = {
          id: 1,
          categoryId: 3,
          parentCategoryId: null,
          availability: { type: 'dates', dates: [] } as any,
        };
        const prefs = { 1: 1 };
        expect(service.calculateCategoryScore(act, prefs)).toBe(0);
      });
    });

    describe('rankActivitiesByCategory', () => {
      it('ranks activities by score in descending order', () => {
        const activities: ActivityWithCategory[] = [
          {
            id: 1,
            categoryId: 1,
            parentCategoryId: 10,
            availability: {} as any,
          },
          {
            id: 2,
            categoryId: 2,
            parentCategoryId: 10,
            availability: {} as any,
          },
          {
            id: 3,
            categoryId: 3,
            parentCategoryId: 20,
            availability: {} as any,
          },
        ];
        const prefs = { 2: 10 }; // direct match for id 2

        const ranked = service.rankActivitiesByCategory(activities, prefs);

        expect(ranked[0].id).toBe(2); // highest score (1.0)
        expect(ranked[0].score).toBe(1.0);
        expect(ranked[1].id).toBe(1); // shared parent (0.5)
        expect(ranked[1].score).toBe(0.5);
        expect(ranked[2].id).toBe(3); // no match (0.0)
        expect(ranked[2].score).toBe(0.0);
      });

      it('preserves original activity data with added scores', () => {
        const activities: ActivityWithCategory[] = [
          {
            id: 1,
            categoryId: 1,
            parentCategoryId: 10,
            availability: { type: 'dates' } as any,
          },
        ];
        const prefs = { 1: 10 };

        const ranked = service.rankActivitiesByCategory(activities, prefs);

        expect(ranked[0]).toEqual({
          id: 1,
          categoryId: 1,
          parentCategoryId: 10,
          availability: { type: 'dates' },
          score: 1.0,
        });
      });
    });
  });

  describe('Availability Range Filtering', () => {
    describe('isAvailableInRange - dates type', () => {
      it('detects availability when date slot overlaps with range', () => {
        const avail = {
          type: 'dates',
          dates: [
            { date: '2025-09-07', time: { start: '10:00', end: '11:00' } },
          ],
        };
        const start = new Date('2025-09-06');
        const end = new Date('2025-09-08');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(true);
      });

      it('returns false when date slot is outside range', () => {
        const avail = {
          type: 'dates',
          dates: [
            { date: '2025-09-10', time: { start: '10:00', end: '11:00' } },
          ],
        };
        const start = new Date('2025-09-06');
        const end = new Date('2025-09-08');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(
          false,
        );
      });

      it('handles multiple date slots correctly', () => {
        const avail = {
          type: 'dates',
          dates: [
            { date: '2025-09-05', time: { start: '10:00', end: '11:00' } }, // before range
            { date: '2025-09-07', time: { start: '10:00', end: '11:00' } }, // in range
            { date: '2025-09-15', time: { start: '10:00', end: '11:00' } }, // after range
          ],
        };
        const start = new Date('2025-09-06');
        const end = new Date('2025-09-10');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(true);
      });

      it('handles empty dates array', () => {
        const avail = { type: 'dates', dates: [] };
        const start = new Date('2025-09-06');
        const end = new Date('2025-09-08');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(
          false,
        );
      });
    });

    describe('isAvailableInRange - range type', () => {
      it('detects overlap with activity date range', () => {
        const avail = {
          type: 'range',
          range: {
            date: { start: '2025-09-05', end: '2025-09-10' },
            time: { start: '09:00', end: '17:00' },
          },
        };
        const start = new Date('2025-09-07T10:00:00');
        const end = new Date('2025-09-08T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(true);
      });

      it('returns false when ranges do not overlap', () => {
        const avail = {
          type: 'range',
          range: {
            date: { start: '2025-09-01', end: '2025-09-03' },
            time: { start: '09:00', end: '17:00' },
          },
        };
        const start = new Date('2025-09-07T10:00:00');
        const end = new Date('2025-09-08T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(
          false,
        );
      });

      it('handles missing range data', () => {
        const avail = { type: 'range', range: null };
        const start = new Date('2025-09-07');
        const end = new Date('2025-09-08');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(
          false,
        );
      });
    });

    describe('isAvailableInRange - weekly type', () => {
      it('detects weekly availability on correct day', () => {
        const avail = {
          type: 'weekly',
          weekly: {
            date: { start: '2025-09-01', end: '2025-09-30' },
            days: [1], // Monday (0=Sunday, 1=Monday, etc.)
            time: { start: '09:00', end: '17:00' },
          },
        };
        // September 8, 2025 is a Monday
        const start = new Date('2025-09-08T10:00:00');
        const end = new Date('2025-09-08T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(true);
      });

      it('returns false for weekly availability on wrong day', () => {
        const avail = {
          type: 'weekly',
          weekly: {
            date: { start: '2025-09-01', end: '2025-09-30' },
            days: [1], // Monday only
            time: { start: '09:00', end: '17:00' },
          },
        };
        // September 9, 2025 is a Tuesday
        const start = new Date('2025-09-09T10:00:00');
        const end = new Date('2025-09-09T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(
          false,
        );
      });

      it('handles multiple weekly days', () => {
        const avail = {
          type: 'weekly',
          weekly: {
            date: { start: '2025-09-01', end: '2025-09-30' },
            days: [1, 3, 5], // Monday, Wednesday, Friday
            time: { start: '09:00', end: '17:00' },
          },
        };
        // September 10, 2025 is a Wednesday
        const start = new Date('2025-09-10T10:00:00');
        const end = new Date('2025-09-10T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(true);
      });

      it('returns false when weekly range is outside activity date range', () => {
        const avail = {
          type: 'weekly',
          weekly: {
            date: { start: '2025-08-01', end: '2025-08-31' }, // August only
            days: [1], // Monday
            time: { start: '09:00', end: '17:00' },
          },
        };
        const start = new Date('2025-09-08T10:00:00'); // September Monday
        const end = new Date('2025-09-08T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(
          false,
        );
      });
    });

    describe('isAvailableInRange - monthly type', () => {
      it('detects monthly availability on correct day of month', () => {
        const avail = {
          type: 'monthly',
          monthly: {
            date: { start: '2025-09-01', end: '2025-12-31' },
            days: [15], // 15th of each month
            time: { start: '09:00', end: '17:00' },
          },
        };
        const start = new Date('2025-09-15T10:00:00');
        const end = new Date('2025-09-15T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(true);
      });

      it('returns false for monthly availability on wrong day of month', () => {
        const avail = {
          type: 'monthly',
          monthly: {
            date: { start: '2025-09-01', end: '2025-12-31' },
            days: [15], // 15th only
            time: { start: '09:00', end: '17:00' },
          },
        };
        const start = new Date('2025-09-14T10:00:00');
        const end = new Date('2025-09-14T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(
          false,
        );
      });

      it('handles multiple monthly days', () => {
        const avail = {
          type: 'monthly',
          monthly: {
            date: { start: '2025-09-01', end: '2025-12-31' },
            days: [1, 15, 30], // 1st, 15th, 30th of each month
            time: { start: '09:00', end: '17:00' },
          },
        };
        const start = new Date('2025-09-30T10:00:00');
        const end = new Date('2025-09-30T11:00:00');
        expect(service.isAvailableInRange(avail as any, start, end)).toBe(true);
      });
    });

    describe('filterActivitiesAvailableInRange', () => {
      it('filters activities correctly based on availability', () => {
        const activities = [
          {
            id: 1,
            availability: {
              type: 'dates',
              dates: [
                { date: '2025-09-07', time: { start: '10:00', end: '11:00' } },
              ],
            },
          },
          {
            id: 2,
            availability: {
              type: 'dates',
              dates: [
                { date: '2025-09-15', time: { start: '10:00', end: '11:00' } },
              ], // outside range
            },
          },
        ];
        const start = new Date('2025-09-06');
        const end = new Date('2025-09-10');

        const filtered = service.filterActivitiesAvailableInRange(
          activities as any,
          start,
          end,
        );

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe(1);
      });
    });
  });

  describe('Calendar Conflict Detection', () => {
    const sampleCalendar: CalendarEvent[] = [
      {
        id: 1,
        userId: 1,
        activityId: null,
        startTime: new Date('2025-09-07T10:00:00Z'),
        endTime: new Date('2025-09-07T11:00:00Z'),
        timestamp: new Date(),
      },
      {
        id: 2,
        userId: 1,
        activityId: null,
        startTime: new Date('2025-09-08T14:00:00Z'),
        endTime: new Date('2025-09-08T15:30:00Z'),
        timestamp: new Date(),
      },
    ];

    describe('filterAvailableActivities', () => {
      it('filters out activities conflicting with calendar events', () => {
        const activities = [
          {
            id: 1,
            availability: {
              type: 'dates' as const,
              dates: [
                { date: '2025-09-07', time: { start: '10:00', end: '11:00' } }, // conflicts
              ],
            },
          },
          {
            id: 2,
            availability: {
              type: 'dates' as const,
              dates: [
                { date: '2025-09-07', time: { start: '12:00', end: '13:00' } }, // no conflict
              ],
            },
          },
        ];

        const filtered = service.filterAvailableActivities(
          activities,
          sampleCalendar,
        );

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe(2);
      });

      it('keeps activities when no calendar conflicts exist', () => {
        const activities = [
          {
            id: 1,
            availability: {
              type: 'dates' as const,
              dates: [
                { date: '2025-09-09', time: { start: '10:00', end: '11:00' } }, // different day
              ],
            },
          },
        ];

        const filtered = service.filterAvailableActivities(activities, []);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe(1);
      });

      it('handles partial time overlaps correctly', () => {
        const activities = [
          {
            id: 1,
            availability: {
              type: 'dates' as const,
              dates: [
                { date: '2025-09-07', time: { start: '10:30', end: '11:30' } }, // partial overlap
              ],
            },
          },
          {
            id: 2,
            availability: {
              type: 'dates' as const,
              dates: [
                { date: '2025-09-07', time: { start: '11:00', end: '12:00' } }, // edge case - starts when calendar ends
              ],
            },
          },
        ];

        const filtered = service.filterAvailableActivities(
          activities,
          sampleCalendar,
        );

        expect(filtered).toHaveLength(1); // Only activity 2 should pass (no overlap)
        expect(filtered[0].id).toBe(2);
      });

      it('handles range type availability conflicts', () => {
        const activities = [
          {
            id: 1,
            availability: {
              type: 'range' as const,
              range: {
                date: { start: '2025-09-06', end: '2025-09-08' },
                time: { start: '09:00', end: '17:00' }, // covers calendar event time
              },
            },
          },
        ];

        const filtered = service.filterAvailableActivities(
          activities,
          sampleCalendar,
        );

        expect(filtered).toHaveLength(0); // Should be filtered out due to conflict
      });

      it('handles weekly availability conflicts', () => {
        // Calendar has events on Sep 7 (Sunday) 10:00 UTC = 15:00 local and Sep 8 (Monday) 14:00 UTC = 19:00 local
        const activities = [
          {
            id: 1,
            availability: {
              type: 'weekly' as const,
              weekly: {
                date: { start: '2025-09-01', end: '2025-09-30' },
                days: [2], // Tuesday (no calendar conflict)
                time: { start: '10:00', end: '11:00' },
              },
            },
          },
          {
            id: 2,
            availability: {
              type: 'weekly' as const,
              weekly: {
                date: { start: '2025-09-01', end: '2025-09-30' },
                days: [1], // Monday (conflicts with Sep 8 calendar event 19:00-20:30 local)
                time: { start: '19:00', end: '20:00' }, // overlaps with calendar event
              },
            },
          },
        ];

        const filtered = service.filterAvailableActivities(
          activities,
          sampleCalendar,
        );

        expect(filtered).toHaveLength(1); // Only Tuesday activity should pass
        expect(filtered[0].id).toBe(1);
      });

      it('handles monthly availability conflicts', () => {
        // Calendar has events on Sep 7 (Sunday) and Sep 8 (Monday)
        const activities = [
          {
            id: 1,
            availability: {
              type: 'monthly' as const,
              monthly: {
                date: { start: '2025-09-01', end: '2025-09-30' },
                days: [8], // 8th of month (conflicts with Sep 8 calendar event 19:00-20:30 local)
                time: { start: '19:00', end: '20:00' }, // overlaps with calendar event
              },
            },
          },
          {
            id: 2,
            availability: {
              type: 'monthly' as const,
              monthly: {
                date: { start: '2025-09-01', end: '2025-09-30' },
                days: [10], // 10th of month (no calendar conflict)
                time: { start: '10:00', end: '11:00' },
              },
            },
          },
        ];

        const filtered = service.filterAvailableActivities(
          activities,
          sampleCalendar,
        );

        expect(filtered).toHaveLength(1); // Only 10th-of-month activity should pass
        expect(filtered[0].id).toBe(2);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles activities with null availability gracefully', () => {
      const activities = [
        { id: 1, availability: null },
        { id: 2, availability: undefined },
      ];
      const start = new Date('2025-09-06');
      const end = new Date('2025-09-10');

      // Should not throw, but will filter out null/undefined availability
      const result = service.filterActivitiesAvailableInRange(
        activities as any,
        start,
        end,
      );
      expect(result).toEqual([]);
    });

    it('handles empty activity arrays', () => {
      const start = new Date('2025-09-06');
      const end = new Date('2025-09-10');

      const filtered = service.filterActivitiesAvailableInRange([], start, end);
      expect(filtered).toEqual([]);
    });

    it('handles empty calendar arrays', () => {
      const activities = [
        {
          id: 1,
          availability: {
            type: 'dates' as const,
            dates: [
              { date: '2025-09-07', time: { start: '10:00', end: '11:00' } },
            ],
          },
        },
      ];

      const filtered = service.filterAvailableActivities(activities, []);
      expect(filtered).toHaveLength(1);
    });

    it('handles invalid date formats gracefully', () => {
      const avail = {
        type: 'dates',
        dates: [
          { date: 'invalid-date', time: { start: '10:00', end: '11:00' } },
        ],
      };
      const start = new Date('2025-09-06');
      const end = new Date('2025-09-10');

      expect(() => {
        service.isAvailableInRange(avail as any, start, end);
      }).not.toThrow();
    });

    it('handles category preferences with null values', () => {
      const activities: ActivityWithCategory[] = [
        {
          id: 1,
          categoryId: 1,
          parentCategoryId: null,
          availability: {} as any,
        },
      ];
      const prefs = { 1: null };

      const ranked = service.rankActivitiesByCategory(activities, prefs);
      expect(ranked[0].score).toBe(0.0); // null preference should not match
    });

    it('handles empty category preferences', () => {
      const activities: ActivityWithCategory[] = [
        { id: 1, categoryId: 1, parentCategoryId: 10, availability: {} as any },
      ];
      const prefs = {};

      const ranked = service.rankActivitiesByCategory(activities, prefs);
      expect(ranked[0].score).toBe(0.0);
    });
  });

  describe('Integration Tests', () => {
    it('processes complete recommendation flow correctly', () => {
      // Setup test data
      const activities: ActivityWithCategory[] = [
        {
          id: 1,
          categoryId: 1,
          parentCategoryId: 10,
          availability: {
            type: 'dates',
            dates: [
              { date: '2025-09-07', time: { start: '10:00', end: '11:00' } },
            ],
          } as any,
        },
        {
          id: 2,
          categoryId: 2,
          parentCategoryId: 10,
          availability: {
            type: 'dates',
            dates: [
              { date: '2025-09-08', time: { start: '14:00', end: '15:00' } },
            ],
          } as any,
        },
        {
          id: 3,
          categoryId: 3,
          parentCategoryId: 20,
          availability: {
            type: 'dates',
            dates: [
              { date: '2025-09-09', time: { start: '16:00', end: '17:00' } },
            ],
          } as any,
        },
      ];

      const prefs = { 2: 10 }; // Prefer category 2
      const calendar: CalendarEvent[] = [
        {
          id: 1,
          userId: 1,
          activityId: null,
          startTime: new Date('2025-09-07T10:00:00Z'), // Conflicts with activity 1
          endTime: new Date('2025-09-07T11:00:00Z'),
          timestamp: new Date(),
        },
      ];
      const rangeStart = new Date('2025-09-06');
      const rangeEnd = new Date('2025-09-12');

      // Step 1: Filter by availability range
      const availableInRange = service.filterActivitiesAvailableInRange(
        activities.map((a) => ({ id: a.id, availability: a.availability })),
        rangeStart,
        rangeEnd,
      );
      expect(availableInRange).toHaveLength(3); // All should be in range

      // Step 2: Filter out calendar conflicts
      const nonConflicting = service.filterAvailableActivities(
        availableInRange,
        calendar,
      );
      expect(nonConflicting).toHaveLength(2); // Activity 1 should be filtered out

      // Step 3: Find activities with categories and rank them
      const availableActivityIds = nonConflicting.map((a) => a.id);
      const availableWithCategory = activities.filter((a) =>
        availableActivityIds.includes(a.id),
      );

      const ranked = service.rankActivitiesByCategory(
        availableWithCategory,
        prefs,
      );

      // Activity 2 should be first (direct category match, score 1.0)
      expect(ranked[0].id).toBe(2);
      expect(ranked[0].score).toBe(1.0);

      // Activity 3 should be second (no category match, score 0.0)
      expect(ranked[1].id).toBe(3);
      expect(ranked[1].score).toBe(0.0);
    });
  });
});
