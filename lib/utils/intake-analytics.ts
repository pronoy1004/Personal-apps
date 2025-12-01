import type { FoodEntry } from '../types';
import { getStartOfDay, formatDay } from './date';
import { format, subDays } from 'date-fns';

export interface DailyIntake {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entryCount: number;
}

export interface IntakeMetrics {
  average: number;
  min: number;
  max: number;
  median: number;
  daysWithData: number;
  totalDays: number;
  compliance: number; // percentage of days meeting goal
  streak: number; // current consecutive days tracked
  trend: 'up' | 'down' | 'stable';
  variance: number;
}

export interface IntakePeriod {
  period: '7d' | '14d' | '30d' | '90d' | 'all';
  days: number;
}

/**
 * Get daily intake totals from food entries
 */
export function getDailyIntakes(foodEntries: FoodEntry[]): DailyIntake[] {
  const dailyMap = new Map<string, DailyIntake>();
  
  foodEntries.forEach((entry) => {
    const dayStart = getStartOfDay(new Date(entry.timestamp));
    const dayKey = formatDay(dayStart);
    
    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, {
        date: dayStart.toISOString(),
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        entryCount: 0,
      });
    }
    
    const day = dailyMap.get(dayKey)!;
    day.calories += entry.macros.calories;
    day.protein += entry.macros.protein;
    day.carbs += entry.macros.carbs;
    day.fat += entry.macros.fat;
    day.entryCount += 1;
  });
  
  return Array.from(dailyMap.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Get intake metrics for a specific period
 */
export function getIntakeMetrics(
  dailyIntakes: DailyIntake[],
  period: IntakePeriod,
  targetCalories?: number
): IntakeMetrics {
  const now = new Date();
  const cutoffDate = period.period === 'all' 
    ? new Date(0)
    : subDays(now, period.days);
  
  const recentIntakes = dailyIntakes.filter((intake) => 
    new Date(intake.date) >= cutoffDate
  );
  
  if (recentIntakes.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      median: 0,
      daysWithData: 0,
      totalDays: period.days,
      compliance: 0,
      streak: 0,
      trend: 'stable',
      variance: 0,
    };
  }
  
  const calories = recentIntakes.map((i) => i.calories);
  const sorted = [...calories].sort((a, b) => a - b);
  
  const average = Math.round(calories.reduce((sum, cal) => sum + cal, 0) / calories.length);
  const min = Math.min(...calories);
  const max = Math.max(...calories);
  const median = sorted.length % 2 === 0
    ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = calories.length > 1
    ? Math.round(calories.reduce((sum, cal) => sum + Math.pow(cal - average, 2), 0) / calories.length)
    : 0;
  
  let compliance = 0;
  if (targetCalories && targetCalories > 0) {
    const daysMetGoal = calories.filter((cal) => 
      Math.abs(cal - targetCalories) <= 100
    ).length;
    compliance = Math.round((daysMetGoal / calories.length) * 100);
  }
  
  const today = getStartOfDay(now);
  let streak = 0;
  for (let i = 0; i < period.days; i++) {
    const checkDate = subDays(today, i);
    const dayKey = formatDay(checkDate);
    const hasData = recentIntakes.some((intake) => formatDay(new Date(intake.date)) === dayKey);
    
    if (hasData) {
      streak++;
    } else if (streak > 0) {
      break;
    }
  }
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (calories.length >= 7) {
    const firstHalf = calories.slice(0, Math.floor(calories.length / 2));
    const secondHalf = calories.slice(Math.floor(calories.length / 2));
    const firstAvg = firstHalf.reduce((sum, cal) => sum + cal, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, cal) => sum + cal, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    
    if (diff > 50) trend = 'up';
    else if (diff < -50) trend = 'down';
  }
  
  return {
    average,
    min,
    max,
    median,
    daysWithData: calories.length,
    totalDays: period.days,
    compliance,
    streak,
    trend,
    variance: Math.round(Math.sqrt(variance)),
  };
}

/**
 * Get intake history for charting
 */
export function getIntakeHistory(
  dailyIntakes: DailyIntake[],
  days: number = 30
): DailyIntake[] {
  const cutoff = subDays(new Date(), days);
  return dailyIntakes
    .filter((intake) => new Date(intake.date) >= cutoff)
    .slice(-days);
}

