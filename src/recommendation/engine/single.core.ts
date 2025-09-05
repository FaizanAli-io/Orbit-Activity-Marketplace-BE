import { CalendarEvent } from '@prisma/client';
import { Injectable, Module } from '@nestjs/common';
import { ActivityAvailabilityDto } from '../../activity/dtos';
import { timesOverlap, dateRangesOverlap } from './engine.utils';

export interface CategoryPreferences {
  [subcategoryId: number]: number | null;
}

export interface ActivityWithCategory {
  id: number;
  categoryId: number;
  parentCategoryId: number | null;
  availability: ActivityAvailabilityDto;
  score?: number;
}

@Injectable()
export class SingleRecommendationService {
  // ---------- CATEGORY SCORING ----------
  calculateCategoryScore(
    activity: ActivityWithCategory,
    categoryPreferences: CategoryPreferences,
  ): number {
    if (categoryPreferences[activity.categoryId] != null) {
      return 1.0;
    }

    const sharedParentCount = Object.values(categoryPreferences).filter(
      (subcategoryId) => Number(subcategoryId) === activity.parentCategoryId,
    ).length;

    return sharedParentCount > 0
      ? Math.min(0.5 + 0.1 * (sharedParentCount - 1), 1.0)
      : 0.0;
  }

  rankActivitiesByCategory(
    activities: ActivityWithCategory[],
    categoryPreferences: CategoryPreferences,
  ): ActivityWithCategory[] {
    return activities
      .map((a) => ({
        ...a,
        score: this.calculateCategoryScore(a, categoryPreferences),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  // ---------- AVAILABILITY CHECKS ----------
  private buildSlot(date: string, time: { start: string; end: string }) {
    const [sh, sm] = time.start.split(':').map(Number);
    const [eh, em] = time.end.split(':').map(Number);

    const slotStart = new Date(date);
    const slotEnd = new Date(date);
    slotStart.setUTCHours(sh, sm, 0, 0);
    slotEnd.setUTCHours(eh, em, 0, 0);

    return { slotStart, slotEnd };
  }

  private overlaps(
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date,
    time?: { start: string; end: string },
  ): boolean {
    if (!dateRangesOverlap(startA, endA, startB, endB)) return false;
    return !time || timesOverlap(startB, endB, time);
  }

  // ---------- PUBLIC CHECK: in range ----------
  isAvailableInRange(
    availability: ActivityAvailabilityDto,
    rangeStart: Date,
    rangeEnd: Date,
  ): boolean {
    if (!availability || !availability.type) {
      return false;
    }

    switch (availability.type) {
      case 'dates':
        return (
          availability.dates?.some((d) => {
            const { slotStart, slotEnd } = this.buildSlot(d.date, d.time);
            return this.overlaps(slotStart, slotEnd, rangeStart, rangeEnd);
          }) ?? false
        );

      case 'range': {
        const range = availability.range;
        if (!range) return false;
        return this.overlaps(
          new Date(range.date.start),
          new Date(range.date.end),
          rangeStart,
          rangeEnd,
          range.time,
        );
      }

      case 'weekly': {
        const w = availability.weekly;
        if (!w) return false;
        const availStart = new Date(w.date.start);
        const availEnd = new Date(w.date.end);

        if (!dateRangesOverlap(availStart, availEnd, rangeStart, rangeEnd))
          return false;

        return w.days.some((day) => {
          const candidate = new Date(rangeStart);
          candidate.setDate(
            candidate.getDate() + ((day - candidate.getDay() + 7) % 7),
          );
          return (
            candidate <= rangeEnd &&
            candidate >= availStart &&
            candidate <= availEnd &&
            timesOverlap(rangeStart, rangeEnd, w.time)
          );
        });
      }

      case 'monthly': {
        const m = availability.monthly;
        if (!m) return false;
        const availStart = new Date(m.date.start);
        const availEnd = new Date(m.date.end);

        if (!dateRangesOverlap(availStart, availEnd, rangeStart, rangeEnd))
          return false;

        return m.days.some((dom) => {
          const candidate = new Date(rangeStart);
          candidate.setDate(dom);
          return (
            candidate <= rangeEnd &&
            candidate >= availStart &&
            candidate <= availEnd &&
            timesOverlap(rangeStart, rangeEnd, m.time)
          );
        });
      }
    }
  }

  filterActivitiesAvailableInRange(
    activities: { id: number; availability: ActivityAvailabilityDto }[],
    rangeStart: Date,
    rangeEnd: Date,
  ) {
    return activities.filter((a) =>
      this.isAvailableInRange(a.availability, rangeStart, rangeEnd),
    );
  }

  // ---------- CALENDAR CONFLICT CHECK ----------
  private conflictsWithCalendar(
    availability: ActivityAvailabilityDto,
    calendar: CalendarEvent[],
  ): boolean {
    if (!availability || !availability.type) {
      return false;
    }

    return calendar.some((event) => {
      const evStart = new Date(event.startTime);
      const evEnd = new Date(event.endTime);

      switch (availability.type) {
        case 'dates':
          return (
            availability.dates?.some((d) => {
              const { slotStart, slotEnd } = this.buildSlot(d.date, d.time);
              return this.overlaps(slotStart, slotEnd, evStart, evEnd);
            }) ?? false
          );

        case 'range': {
          const r = availability.range;
          return (
            r != null &&
            this.overlaps(
              new Date(r.date.start),
              new Date(r.date.end),
              evStart,
              evEnd,
              r.time,
            )
          );
        }

        case 'weekly': {
          const w = availability.weekly;
          if (!w) return false;
          const availStart = new Date(w.date.start);
          const availEnd = new Date(w.date.end);
          return (
            dateRangesOverlap(availStart, availEnd, evStart, evEnd) &&
            w.days.includes(evStart.getDay()) &&
            timesOverlap(evStart, evEnd, w.time)
          );
        }

        case 'monthly': {
          const m = availability.monthly;
          if (!m) return false;
          const availStart = new Date(m.date.start);
          const availEnd = new Date(m.date.end);
          return (
            dateRangesOverlap(availStart, availEnd, evStart, evEnd) &&
            m.days.includes(evStart.getDate()) &&
            timesOverlap(evStart, evEnd, m.time)
          );
        }
      }
    });
  }

  filterAvailableActivities(
    activities: { id: number; availability: ActivityAvailabilityDto }[],
    calendar: CalendarEvent[],
  ) {
    return activities.filter(
      (a) => !this.conflictsWithCalendar(a.availability, calendar),
    );
  }
}

@Module({
  providers: [SingleRecommendationService],
  exports: [SingleRecommendationService],
})
export class SingleRecommendationModule {}
