import type { WorkoutEntry } from '../types';
import { getStartOfDay, formatDay } from './date';
import { subDays } from 'date-fns';

export interface DailyWorkout {
  date: string; // ISO date string
  caloriesBurned: number;
  totalDuration: number; // minutes
  workoutCount: number;
  workouts: WorkoutEntry[]; // individual workouts for that day
}

/**
 * Get daily workout totals from workout entries
 */
export function getDailyWorkouts(workoutEntries: WorkoutEntry[]): DailyWorkout[] {
  const dailyMap = new Map<string, DailyWorkout>();
  
  workoutEntries.forEach((entry) => {
    const dayStart = getStartOfDay(new Date(entry.date));
    const dayKey = formatDay(dayStart);
    
    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, {
        date: dayStart.toISOString(),
        caloriesBurned: 0,
        totalDuration: 0,
        workoutCount: 0,
        workouts: [],
      });
    }
    
    const day = dailyMap.get(dayKey)!;
    day.caloriesBurned += entry.caloriesBurned;
    day.totalDuration += entry.duration;
    day.workoutCount += 1;
    day.workouts.push(entry);
  });
  
  return Array.from(dailyMap.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Get workout history for charting
 */
export function getWorkoutHistory(
  dailyWorkouts: DailyWorkout[],
  days: number = 30
): DailyWorkout[] {
  const cutoff = subDays(new Date(), days);
  return dailyWorkouts
    .filter((workout) => new Date(workout.date) >= cutoff)
    .slice(-days);
}
