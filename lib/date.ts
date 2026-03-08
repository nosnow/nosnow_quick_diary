const UTC8_OFFSET_HOURS = 8;

export function toDateStringUTC8(input: Date): string {
  const shifted = new Date(input.getTime() + UTC8_OFFSET_HOURS * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function todayDateStringUTC8(): string {
  return toDateStringUTC8(new Date());
}
