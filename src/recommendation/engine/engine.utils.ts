export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function timesOverlap(
  evStart: Date,
  evEnd: Date,
  slot: { start: string; end: string },
): boolean {
  const evStartMin = evStart.getHours() * 60 + evStart.getMinutes();
  const evEndMin = evEnd.getHours() * 60 + evEnd.getMinutes();
  const slotStart = timeToMinutes(slot.start);
  const slotEnd = timeToMinutes(slot.end);

  return evStartMin < slotEnd && slotStart < evEndMin;
}

export function dateRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Calculate the intersection of two arrays
 */
export function arrayIntersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => array2.includes(item));
}

/**
 * Calculate the union of multiple arrays
 */
export function arrayUnion<T>(...arrays: T[][]): T[] {
  const result = new Set<T>();
  arrays.forEach((array) => {
    array.forEach((item) => result.add(item));
  });
  return Array.from(result);
}

/**
 * Group items by a key function
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  items.forEach((item) => {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  });
  return result;
}

/**
 * Calculate percentage of overlap between two numbers
 */
export function calculateOverlapPercentage(
  total: number,
  overlap: number,
): number {
  if (total === 0) return 0;
  return Math.round((overlap / total) * 100);
}

/**
 * Sort array by multiple criteria
 */
export function multiSort<T>(
  array: T[],
  sortCriteria: Array<{
    key: keyof T;
    direction: 'asc' | 'desc';
  }>,
): T[] {
  return array.sort((a, b) => {
    for (const criterion of sortCriteria) {
      const { key, direction } = criterion;
      const aVal = a[key];
      const bVal = b[key];

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}
