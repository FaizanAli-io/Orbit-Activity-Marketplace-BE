import { CalendarEvent } from '@prisma/client';
import { ActivityAvailabilityDto } from '../activity/dtos';

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

export function calculateCategoryScore(
  activity: ActivityWithCategory,
  categoryPreferences: CategoryPreferences,
): number {
  if (categoryPreferences[activity.categoryId]) return 1.0;

  const sharedParentCount = Object.values(categoryPreferences).filter(
    (subcategoryId) => activity.parentCategoryId === subcategoryId,
  ).length;

  if (sharedParentCount > 0)
    return Math.min(0.5 + 0.1 * (sharedParentCount - 1), 1.0);

  return 0.0;
}

export function rankActivitiesByCategory(
  activities: ActivityWithCategory[],
  categoryPreferences: CategoryPreferences,
): ActivityWithCategory[] {
  return activities
    .map((activity) => ({
      ...activity,
      score: calculateCategoryScore(activity, categoryPreferences),
    }))
    .sort((a, b) => (b as any).score - (a as any).score);
}

export function isAvailableInRange(
  availability: ActivityAvailabilityDto,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  switch (availability.type) {
    case 'dates':
      if (availability.dates) {
        for (const d of availability.dates) {
          const date = new Date(d.date);
          if (date >= rangeStart && date <= rangeEnd) {
            return true;
          }
        }
      }
      break;
    case 'range':
      if (availability.range) {
        const availStart = new Date(availability.range.date.start);
        const availEnd = new Date(availability.range.date.end);
        if (availStart <= rangeEnd && availEnd >= rangeStart) {
          return true;
        }
      }
      break;
    case 'weekly':
      if (availability.weekly) {
        const availStart = new Date(availability.weekly.date.start);
        const availEnd = new Date(availability.weekly.date.end);
        for (
          let d = new Date(rangeStart);
          d <= rangeEnd;
          d.setDate(d.getDate() + 1)
        ) {
          if (d >= availStart && d <= availEnd) {
            const dayIdx = d.getDay();
            if (availability.weekly.days.includes(dayIdx)) {
              return true;
            }
          }
        }
      }
      break;
    case 'monthly':
      if (availability.monthly) {
        const availStart = new Date(availability.monthly.date.start);
        const availEnd = new Date(availability.monthly.date.end);
        for (
          let d = new Date(rangeStart);
          d <= rangeEnd;
          d.setDate(d.getDate() + 1)
        ) {
          if (d >= availStart && d <= availEnd) {
            const dayOfMonth = d.getDate();
            if (availability.monthly.days.includes(dayOfMonth)) {
              return true;
            }
          }
        }
      }
      break;
  }
  return false;
}

// Given activities: { id, availability }, return those available in the given range
export function filterActivitiesAvailableInRange(
  activities: { id: number; availability: ActivityAvailabilityDto }[],
  rangeStart: Date,
  rangeEnd: Date,
): { id: number; availability: ActivityAvailabilityDto }[] {
  return activities.filter((a) =>
    isAvailableInRange(a.availability, rangeStart, rangeEnd),
  );
}

// utility: check if two time ranges overlap
function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

// utility: convert HH:mm to minutes
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// check if availability overlaps with calendar events
function conflictsWithCalendar(
  availability: ActivityAvailabilityDto,
  calendar: CalendarEvent[],
): boolean {
  for (const event of calendar) {
    const evStart = new Date(event.startTime);
    const evEnd = new Date(event.endTime);

    switch (availability.type) {
      case 'dates':
        if (availability.dates) {
          for (const d of availability.dates) {
            const date = new Date(d.date);
            const slotEnd = new Date(date);
            const slotStart = new Date(date);
            const split = (time: string) => time.split(':').map(Number);
            const [startHour, startMinute] = split(d.time.start);
            const [endHour, endMinute] = split(d.time.end);
            slotStart.setHours(startHour, startMinute);
            slotEnd.setHours(endHour, endMinute);

            if (rangesOverlap(evStart, evEnd, slotStart, slotEnd)) {
              return true;
            }
          }
        }
        break;

      case 'range':
        if (availability.range) {
          const rangeStart = new Date(availability.range.date.start);
          const rangeEnd = new Date(availability.range.date.end);

          // event inside range?
          if (rangesOverlap(rangeStart, rangeEnd, evStart, evEnd)) {
            // now check time window
            const evMinutesStart =
              evStart.getHours() * 60 + evStart.getMinutes();
            const evMinutesEnd = evEnd.getHours() * 60 + evEnd.getMinutes();
            const slotStart = timeToMinutes(availability.range.time.start);
            const slotEnd = timeToMinutes(availability.range.time.end);

            if (evMinutesStart < slotEnd && slotStart < evMinutesEnd) {
              return true;
            }
          }
        }
        break;

      case 'weekly':
        if (availability.weekly) {
          const rangeStart = new Date(availability.weekly.date.start);
          const rangeEnd = new Date(availability.weekly.date.end);
          if (evStart >= rangeStart && evEnd <= rangeEnd) {
            const evDay = evStart.getDay(); // 0=Sun ... 6=Sat
            if (availability.weekly.days.includes(evDay)) {
              const evMinutesStart =
                evStart.getHours() * 60 + evStart.getMinutes();
              const evMinutesEnd = evEnd.getHours() * 60 + evEnd.getMinutes();
              const slotStart = timeToMinutes(availability.weekly.time.start);
              const slotEnd = timeToMinutes(availability.weekly.time.end);

              if (evMinutesStart < slotEnd && slotStart < evMinutesEnd) {
                return true;
              }
            }
          }
        }
        break;

      case 'monthly':
        if (availability.monthly) {
          const rangeStart = new Date(availability.monthly.date.start);
          const rangeEnd = new Date(availability.monthly.date.end);
          if (evStart >= rangeStart && evEnd <= rangeEnd) {
            const evDayOfMonth = evStart.getDate();
            if (availability.monthly.days.includes(evDayOfMonth)) {
              const evMinutesStart =
                evStart.getHours() * 60 + evStart.getMinutes();
              const evMinutesEnd = evEnd.getHours() * 60 + evEnd.getMinutes();
              const slotStart = timeToMinutes(availability.monthly.time.start);
              const slotEnd = timeToMinutes(availability.monthly.time.end);

              if (evMinutesStart < slotEnd && slotStart < evMinutesEnd) {
                return true;
              }
            }
          }
        }
        break;
    }
  }
  return false;
}

export function filterAvailableActivities(
  activities: { id: number; availability: ActivityAvailabilityDto }[],
  calendar: CalendarEvent[],
) {
  return activities.filter(
    (act) => !conflictsWithCalendar(act.availability, calendar),
  );
}
