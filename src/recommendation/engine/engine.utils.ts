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
