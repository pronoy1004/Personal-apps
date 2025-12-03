import type { FitnessData } from '../types';
import { getDailyIntakes } from './intake-analytics';
import { getDailyWorkouts } from './workout-analytics';
import { calculateActualTDEE } from './tdee';
import { subDays, format } from 'date-fns';

/**
 * Summarize fitness data for AI analysis
 * Returns a concise text summary of key metrics and trends
 */
export function summarizeFitnessData(data: FitnessData, days: number = 30): string {
  const now = new Date();
  const cutoffDate = subDays(now, days);
  
  // Filter recent data
  const recentWeights = data.weightEntries
    .filter((entry) => new Date(entry.date) >= cutoffDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const recentFoodEntries = data.foodEntries.filter(
    (entry) => new Date(entry.timestamp) >= cutoffDate
  );
  
  const recentWorkouts = data.workoutEntries.filter(
    (entry) => new Date(entry.date) >= cutoffDate
  );

  const profile = data.userProfile;
  
  // Weight analysis
  let weightSummary = '';
  if (recentWeights.length > 0) {
    const startWeight = recentWeights[0].weight;
    const endWeight = recentWeights[recentWeights.length - 1].weight;
    const weightChange = endWeight - startWeight;
    const weightChangePercent = ((weightChange / startWeight) * 100).toFixed(1);
    
    weightSummary = `Weight: Started at ${startWeight.toFixed(1)}kg, currently ${endWeight.toFixed(1)}kg. `;
    if (weightChange !== 0) {
      weightSummary += weightChange > 0 
        ? `Gained ${Math.abs(weightChange).toFixed(1)}kg (${Math.abs(parseFloat(weightChangePercent))}%) over this period. `
        : `Lost ${Math.abs(weightChange).toFixed(1)}kg (${Math.abs(parseFloat(weightChangePercent))}%) over this period. `;
    } else {
      weightSummary += 'Weight remained stable. ';
    }
  }

  // Intake analysis
  let intakeSummary = '';
  const dailyIntakes = getDailyIntakes(recentFoodEntries);
  if (dailyIntakes.length > 0) {
    const avgCalories = Math.round(
      dailyIntakes.reduce((sum, day) => sum + day.calories, 0) / dailyIntakes.length
    );
    const avgProtein = Math.round(
      dailyIntakes.reduce((sum, day) => sum + day.protein, 0) / dailyIntakes.length
    );
    const avgCarbs = Math.round(
      dailyIntakes.reduce((sum, day) => sum + day.carbs, 0) / dailyIntakes.length
    );
    const avgFat = Math.round(
      dailyIntakes.reduce((sum, day) => sum + day.fat, 0) / dailyIntakes.length
    );
    const targetCalories = profile.dailyCalorieGoal || profile.baseTDEE || 2000;
    
    intakeSummary = `Nutrition: Average daily intake ${avgCalories} calories (target: ${targetCalories}). `;
    intakeSummary += `Macros: ${avgProtein}g protein, ${avgCarbs}g carbs, ${avgFat}g fat. `;
    intakeSummary += `Tracked ${dailyIntakes.length} days with food entries. `;
    
    if (profile.macroGoals) {
      const proteinGoal = profile.macroGoals.protein;
      if (proteinGoal > 0) {
        const proteinCompliance = Math.round((avgProtein / proteinGoal) * 100);
        intakeSummary += `Protein goal: ${proteinGoal}g (${proteinCompliance}% of goal). `;
      }
    }
  } else {
    intakeSummary = 'No food entries tracked in this period. ';
  }

  // Workout analysis
  let workoutSummary = '';
  const dailyWorkouts = getDailyWorkouts(recentWorkouts);
  if (dailyWorkouts.length > 0) {
    const totalCaloriesBurned = dailyWorkouts.reduce((sum, day) => sum + day.caloriesBurned, 0);
    const avgDailyCaloriesBurned = Math.round(totalCaloriesBurned / days);
    const totalDuration = dailyWorkouts.reduce((sum, day) => sum + day.durationMinutes, 0);
    const workoutDays = dailyWorkouts.length;
    
    workoutSummary = `Exercise: ${workoutDays} days with workouts out of ${days} days. `;
    workoutSummary += `Average ${avgDailyCaloriesBurned} calories burned per day. `;
    workoutSummary += `Total ${totalDuration} minutes of exercise. `;
    
    // Workout types
    const workoutTypes = new Set<string>();
    recentWorkouts.forEach((w) => workoutTypes.add(w.type));
    if (workoutTypes.size > 0) {
      workoutSummary += `Types: ${Array.from(workoutTypes).join(', ')}. `;
    }
  } else {
    workoutSummary = 'No workouts logged in this period. ';
  }

  // Profile information
  let profileSummary = '';
  profileSummary = `User Profile: ${profile.gender}, ${profile.age} years old, ${profile.height}cm tall. `;
  profileSummary += `Activity level: ${profile.activityLevel}. `;
  if (profile.baseTDEE) {
    profileSummary += `Estimated TDEE: ${profile.baseTDEE} calories/day. `;
  }
  
  // Goal information
  if (profile.goal) {
    profileSummary += `Goal: ${profile.goal.mode === 'lose' ? 'lose weight' : profile.goal.mode === 'gain' ? 'gain weight' : 'maintain weight'}. `;
    if (profile.goal.rateKgPerWeek) {
      profileSummary += `Target rate: ${Math.abs(profile.goal.rateKgPerWeek)}kg per week. `;
    }
    if (profile.goal.targetWeightKg) {
      profileSummary += `Target weight: ${profile.goal.targetWeightKg}kg. `;
    }
  }

  // TDEE calculation if we have enough data
  let tdeeSummary = '';
  if (recentWeights.length >= 2 && dailyIntakes.length >= 7) {
    const actualTDEEResult = calculateActualTDEE(
      data.weightEntries,
      data.foodEntries,
      profile.height,
      profile.age,
      profile.gender,
      profile.activityLevel,
      30,
      data.workoutEntries
    );
    
    if (actualTDEEResult) {
      tdeeSummary = `Calculated actual TDEE: ${actualTDEEResult.actualTDEE} calories/day (based on weight change and intake). `;
      if (actualTDEEResult.weightChange !== undefined) {
        tdeeSummary += `Weight change used in calculation: ${actualTDEEResult.weightChange.toFixed(2)}kg. `;
      }
    }
  }

  // Combine all summaries
  const summary = `
FITNESS DATA SUMMARY (Last ${days} days)

${profileSummary}

${weightSummary}

${intakeSummary}

${workoutSummary}

${tdeeSummary}
`.trim();

  return summary;
}

