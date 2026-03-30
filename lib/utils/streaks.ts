import type { FoodEntry, WorkoutEntry } from '../types';

/**
 * Calculate the current consecutive logging streak for food entries.
 * A day counts if at least 1 food entry exists for that calendar day.
 */
export function calculateFoodLoggingStreak(foodEntries: FoodEntry[]): number {
  if (foodEntries.length === 0) return 0;

  const daySet = new Set<string>();
  foodEntries.forEach((e) => {
    daySet.add(new Date(e.timestamp).toISOString().split('T')[0]);
  });

  const today = new Date().toISOString().split('T')[0];

  let streak = 0;
  let checkDate = new Date();

  // If today has no entries, start check from yesterday
  if (!daySet.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (!daySet.has(dateStr)) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * Calculate the current consecutive workout streak.
 * A day counts if at least 1 workout entry exists for that calendar day.
 */
export function calculateWorkoutStreak(workoutEntries: WorkoutEntry[]): number {
  if (workoutEntries.length === 0) return 0;

  const daySet = new Set<string>();
  workoutEntries.forEach((e) => {
    daySet.add(new Date(e.date).toISOString().split('T')[0]);
  });

  const today = new Date().toISOString().split('T')[0];

  let streak = 0;
  let checkDate = new Date();

  if (!daySet.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (!daySet.has(dateStr)) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * Calculate BMI from weight (kg) and height (cm)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-500' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' };
  return { label: 'Obese', color: 'text-red-500' };
}

/**
 * Estimate body fat percentage using the BMI method (rough estimate)
 * More accurate methods require body measurements (navy method etc.)
 */
export function estimateBodyFatBMI(bmi: number, age: number, gender: 'male' | 'female'): number {
  // Deurenberg formula: body fat % = (1.2 × BMI) + (0.23 × age) − (10.8 × sex) − 5.4
  // where sex = 1 for male, 0 for female
  const sex = gender === 'male' ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4;
  return Math.max(0, Math.round(bf * 10) / 10);
}
