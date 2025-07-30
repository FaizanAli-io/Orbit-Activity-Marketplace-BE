import { isEventInValidTimeslot } from './availability-check';
import { ActivityAvailabilityDto } from '../activity/dtos/availability.dto';

describe('isEventInValidTimeslot', () => {
  it('should validate a "dates" type slot', () => {
    const availability: ActivityAvailabilityDto = {
      type: 'dates',
      dates: [
        {
          date: '2024-08-01T00:00:00Z',
          time: { start: '10:00', end: '12:00' },
        },
      ],
      exclusions: [],
    } as any;

    // Valid slot
    expect(
      isEventInValidTimeslot(
        '2024-08-01T10:30:00Z',
        '2024-08-01T11:00:00Z',
        availability,
      ),
    ).toBe(true);

    // Wrong day
    expect(
      isEventInValidTimeslot(
        '2024-08-02T10:30:00Z',
        '2024-08-02T11:00:00Z',
        availability,
      ),
    ).toBe(false);

    // Outside time slot
    expect(
      isEventInValidTimeslot(
        '2024-08-01T09:00:00Z',
        '2024-08-01T10:00:00Z',
        availability,
      ),
    ).toBe(false);
  });

  it('should validate a "range" type slot', () => {
    const availability: ActivityAvailabilityDto = {
      type: 'range',
      range: {
        date: { start: '2024-08-01T00:00:00Z', end: '2024-08-10T23:59:59Z' },
        time: { start: '09:00', end: '17:00' },
      },
      exclusions: [],
    } as any;

    // Valid slot
    expect(
      isEventInValidTimeslot(
        '2024-08-05T09:30:00Z',
        '2024-08-05T10:30:00Z',
        availability,
      ),
    ).toBe(true);

    // Outside date range
    expect(
      isEventInValidTimeslot(
        '2024-07-31T10:00:00Z',
        '2024-07-31T11:00:00Z',
        availability,
      ),
    ).toBe(false);

    // Outside time slot
    expect(
      isEventInValidTimeslot(
        '2024-08-05T08:00:00Z',
        '2024-08-05T09:00:00Z',
        availability,
      ),
    ).toBe(false);
  });

  it('should validate a "weekly" type slot', () => {
    const availability: ActivityAvailabilityDto = {
      type: 'weekly',
      weekly: {
        days: [1, 3, 5], // Monday, Wednesday, Friday
        date: { start: '2024-08-01T00:00:00Z', end: '2024-08-31T23:59:59Z' },
        time: { start: '14:00', end: '16:00' },
      },
      exclusions: [],
    } as any;

    // Monday (1), valid time
    expect(
      isEventInValidTimeslot(
        '2024-08-05T14:30:00Z', // 2024-08-05 is a Monday
        '2024-08-05T15:00:00Z',
        availability,
      ),
    ).toBe(true);

    // Tuesday (2), not in days
    expect(
      isEventInValidTimeslot(
        '2024-08-06T14:30:00Z',
        '2024-08-06T15:00:00Z',
        availability,
      ),
    ).toBe(false);

    // Friday (5), outside time
    expect(
      isEventInValidTimeslot(
        '2024-08-09T13:00:00Z',
        '2024-08-09T14:00:00Z',
        availability,
      ),
    ).toBe(false);
  });

  it('should validate a "monthly" type slot', () => {
    const availability: ActivityAvailabilityDto = {
      type: 'monthly',
      monthly: {
        days: [1, 15, 31],
        date: { start: '2024-08-01T00:00:00Z', end: '2024-08-31T23:59:59Z' },
        time: { start: '08:00', end: '10:00' },
      },
      exclusions: [],
    } as any;

    // 1st of the month, valid time
    expect(
      isEventInValidTimeslot(
        '2024-08-01T08:30:00Z',
        '2024-08-01T09:00:00Z',
        availability,
      ),
    ).toBe(true);

    // 2nd of the month, not in days
    expect(
      isEventInValidTimeslot(
        '2024-08-02T08:30:00Z',
        '2024-08-02T09:00:00Z',
        availability,
      ),
    ).toBe(false);

    // 15th, outside time
    expect(
      isEventInValidTimeslot(
        '2024-08-15T07:00:00Z',
        '2024-08-15T08:00:00Z',
        availability,
      ),
    ).toBe(false);
  });

  it('should return false if event is in exclusions', () => {
    const availability: ActivityAvailabilityDto = {
      type: 'range',
      range: {
        date: { start: '2024-08-01T00:00:00Z', end: '2024-08-10T23:59:59Z' },
        time: { start: '09:00', end: '17:00' },
      },
      exclusions: ['2024-08-05T09:30:00Z'],
    } as any;

    expect(
      isEventInValidTimeslot(
        '2024-08-05T09:30:00Z',
        '2024-08-05T10:00:00Z',
        availability,
      ),
    ).toBe(false);
  });
});
