import {
  getDay,
  getDate,
  parseISO,
  isSameDay,
  isWithinInterval,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  TimeSlotDto,
  DateRangeDto,
  ActivityAvailabilityDto,
} from '../activity/dtos';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function formatUTC(date: Date, formatStr: string): string {
  return formatInTimeZone(date, 'UTC', formatStr);
}

function checkRangeBounds(
  start: Date,
  end: Date,
  range: DateRangeDto,
): ValidationResult {
  const rangeStart = parseISO(range.start);
  const rangeEnd = parseISO(range.end);

  if (start < rangeStart || end > rangeEnd) {
    return {
      isValid: false,
      error: `Event time ${formatUTC(start, 'yyyy-MM-dd HH:mm')} to ${formatUTC(end, 'yyyy-MM-dd HH:mm')} is outside the allowed date range ${formatUTC(rangeStart, 'yyyy-MM-dd')} to ${formatUTC(rangeEnd, 'yyyy-MM-dd')}`,
    };
  }
  return { isValid: true };
}

function checkSlotBounds(
  start: Date,
  end: Date,
  time: TimeSlotDto,
): ValidationResult {
  const [slotStartHour, slotStartMinute] = time.start.split(':').map(Number);
  const [slotEndHour, slotEndMinute] = time.end.split(':').map(Number);

  const slotStart = new Date(start);
  const slotEnd = new Date(start);

  slotStart.setUTCHours(slotStartHour, slotStartMinute, 0, 0);
  slotEnd.setUTCHours(slotEndHour, slotEndMinute, 0, 0);

  if (start < slotStart || end > slotEnd) {
    return {
      isValid: false,
      error: `Event time ${formatUTC(start, 'HH:mm')} to ${formatUTC(end, 'HH:mm')} is outside the allowed time slot ${time.start} to ${time.end}`,
    };
  }
  return { isValid: true };
}

/**
 * Checks if a calendar event is in a valid timeslot for the given activity availability.
 * @param eventStart ISO string of event start datetime
 * @param eventEnd ISO string of event end datetime
 * @param availability ActivityAvailabilityDto
 * @returns ValidationResult with isValid boolean and optional error message
 */
export function validateEventTimeslot(
  eventStart: string,
  eventEnd: string,
  availability: ActivityAvailabilityDto,
): ValidationResult {
  const start = parseISO(eventStart);
  const end = parseISO(eventEnd);

  // Check exclusions first
  if (availability.exclusions) {
    for (const ex of availability.exclusions) {
      if (isWithinInterval(start, { start: parseISO(ex), end: parseISO(ex) })) {
        return {
          isValid: false,
          error: `Event date ${formatUTC(start, 'yyyy-MM-dd')} is excluded from this activity`,
        };
      }
    }
  }

  switch (availability.type) {
    case 'dates':
      if (!availability.dates) {
        return {
          isValid: false,
          error: 'No specific dates configured for this activity',
        };
      }

      for (const dateWithTime of availability.dates) {
        if (isSameDay(start, parseISO(dateWithTime.date))) {
          return checkSlotBounds(start, end, dateWithTime.time);
        }
      }
      return {
        isValid: false,
        error: `Event date ${formatUTC(start, 'yyyy-MM-dd')} is not available for this activity`,
      };

    case 'range':
      if (!availability.range) {
        return {
          isValid: false,
          error: 'No date range configured for this activity',
        };
      }

      const rangeCheck = checkRangeBounds(start, end, availability.range.date);
      if (!rangeCheck.isValid) return rangeCheck;

      return checkSlotBounds(start, end, availability.range.time);

    case 'weekly':
      if (!availability.weekly) {
        return {
          isValid: false,
          error: 'No weekly schedule configured for this activity',
        };
      }

      const weeklyRangeCheck = checkRangeBounds(
        start,
        end,
        availability.weekly.date,
      );
      if (!weeklyRangeCheck.isValid) return weeklyRangeCheck;

      const jsDay = getDay(start) === 0 ? 7 : getDay(start);
      const dayNames = [
        '',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];

      if (!availability.weekly.days.includes(jsDay)) {
        const allowedDays = availability.weekly.days
          .map((d) => dayNames[d])
          .join(', ');
        return {
          isValid: false,
          error: `${dayNames[jsDay]} is not a valid weekday for this activity. Allowed days: ${allowedDays}`,
        };
      }

      return checkSlotBounds(start, end, availability.weekly.time);

    case 'monthly':
      if (!availability.monthly) {
        return {
          isValid: false,
          error: 'No monthly schedule configured for this activity',
        };
      }

      const monthlyRangeCheck = checkRangeBounds(
        start,
        end,
        availability.monthly.date,
      );
      if (!monthlyRangeCheck.isValid) return monthlyRangeCheck;

      const dayOfMonth = getDate(start);
      if (!availability.monthly.days.includes(dayOfMonth)) {
        return {
          isValid: false,
          error: `Day ${dayOfMonth} is not a valid day of the month for this activity. Allowed days: ${availability.monthly.days.join(', ')}`,
        };
      }

      return checkSlotBounds(start, end, availability.monthly.time);

    default:
      return {
        isValid: false,
        error: 'Unknown availability type configured for this activity',
      };
  }
}
