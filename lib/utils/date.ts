/**
 * Get start of day at 6 AM instead of midnight
 * This is useful for meal tracking where the day starts at 6 AM
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  const hour = start.getHours();
  
  // If it's before 6 AM, consider it part of the previous day
  if (hour < 6) {
    start.setDate(start.getDate() - 1);
  }
  
  start.setHours(6, 0, 0, 0);
  return start;
}

/**
 * Check if two dates are on the same day (using 6 AM cutoff)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const start1 = getStartOfDay(d1);
  const start2 = getStartOfDay(d2);
  
  return start1.getTime() === start2.getTime();
}

/**
 * Format date for comparison (using 6 AM cutoff)
 */
export function formatDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const start = getStartOfDay(d);
  return start.toISOString().split('T')[0];
}

