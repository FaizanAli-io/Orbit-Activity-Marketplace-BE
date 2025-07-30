import {
  getDay,
  getDate,
  parseISO,
  isSameDay,
  isWithinInterval,
} from 'date-fns';
import {
  TimeSlotDto,
  DateRangeDto,
  ActivityAvailabilityDto,
} from '../activity/dtos';

function checkRangeBounds(start: Date, end: Date, range: DateRangeDto) {
  const rangeStart = parseISO(range.start);
  const rangeEnd = parseISO(range.end);

  return start >= rangeStart && end <= rangeEnd;
}

function checkSlotBounds(start: Date, end: Date, time: TimeSlotDto) {
  const [slotStartHour, slotStartMinute] = time.start.split(':').map(Number);
  const [slotEndHour, slotEndMinute] = time.end.split(':').map(Number);

  const slotStart = new Date(start);
  const slotEnd = new Date(start);

  slotStart.setUTCHours(slotStartHour, slotStartMinute);
  slotEnd.setUTCHours(slotEndHour, slotEndMinute);

  return start >= slotStart && end <= slotEnd;
}

/**
 * Checks if a calendar event is in a valid timeslot for the given activity availability.
 * @param eventStart ISO string of event start datetime
 * @param eventEnd ISO string of event end datetime
 * @param availability ActivityAvailabilityDto
 * @returns boolean
 */
export function isEventInValidTimeslot(
  eventStart: string,
  eventEnd: string,
  availability: ActivityAvailabilityDto,
): boolean {
  const start = parseISO(eventStart);
  const end = parseISO(eventEnd);

  if (
    availability.exclusions &&
    availability.exclusions.some((ex) =>
      isWithinInterval(start, {
        start: parseISO(ex),
        end: parseISO(ex),
      }),
    )
  ) {
    return false;
  }

  switch (availability.type) {
    case 'dates':
      if (!availability.dates) return false;
      return availability.dates.some((dateWithTime) => {
        if (!isSameDay(start, parseISO(dateWithTime.date))) return false;
        return checkSlotBounds(start, end, dateWithTime.time);
      });

    case 'range':
      if (!availability.range) return false;
      {
        if (!checkRangeBounds(start, end, availability.range.date))
          return false;

        return checkSlotBounds(start, end, availability.range.time);
      }

    case 'weekly':
      if (!availability.weekly) return false;
      {
        if (!checkRangeBounds(start, end, availability.weekly.date))
          return false;

        const jsDay = getDay(start) === 0 ? 7 : getDay(start);
        if (!availability.weekly.days.includes(jsDay)) return false;

        return checkSlotBounds(start, end, availability.weekly.time);
      }

    case 'monthly':
      if (!availability.monthly) return false;
      {
        if (!checkRangeBounds(start, end, availability.monthly.date))
          return false;

        const dayOfMonth = getDate(start);
        if (!availability.monthly.days.includes(dayOfMonth)) return false;

        return checkSlotBounds(start, end, availability.monthly.time);
      }

    default:
      return false;
  }
}
