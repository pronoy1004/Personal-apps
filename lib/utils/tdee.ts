import type { Gender, ActivityLevel, WeightEntry, FoodEntry, WorkoutEntry, GoalConfig } from '../types';

// Activity multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Calories per kg of body weight change (fat + lean mass average)
const CALORIES_PER_KG = 7700;

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  // Weight in kg, height in cm
  // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(years) + s
  // s = +5 for males, -161 for females
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  const genderAdjustment = gender === 'male' ? 5 : -161;
  return baseBMR + genderAdjustment;
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR * Activity Multiplier
 * Note: Activity multiplier already accounts for exercise, so we don't add workout calories separately
 * If you want to account for additional workouts, adjust the activity level instead
 */
export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  workoutCalories: number = 0 // Kept for compatibility but not used in calculation
): number {
  const bmr = calculateBMR(weight, height, age, gender);
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  const tdee = bmr * activityMultiplier;
  return Math.round(tdee);
}

/**
 * Calculate actual TDEE from observed weight changes and calorie intake
 * This uses real data to reverse-engineer your true metabolic rate
 * 
 * Formula: Actual TDEE = (Total Calories Consumed + Weight Change * 7700) / Days
 */
export interface ActualTDEEResult {
  actualTDEE: number;
  formulaTDEE: number;
  metabolicFactor: number; // >1 means faster metabolism, <1 means slower
  weightChange: number; // kg
  avgDailyIntake: number;
  daysAnalyzed: number;
  confidence: 'low' | 'medium' | 'high';
  dataQuality: string;
}

export function calculateActualTDEE(
  weightEntries: WeightEntry[],
  foodEntries: FoodEntry[],
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  analysisWindowDays: number = 14,
  workoutEntries: WorkoutEntry[] = []
): ActualTDEEResult | null {
  if (weightEntries.length < 2) {
    return null;
  }

  // Sort weight entries by date
  const sortedWeights = [...weightEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const now = new Date();
  const cutoffDate = new Date(now.getTime() - analysisWindowDays * 24 * 60 * 60 * 1000);

  // Get weight entries in the analysis window
  const recentWeights = sortedWeights.filter(
    (w) => new Date(w.date) >= cutoffDate
  );

  if (recentWeights.length < 2) {
    return null;
  }

  // Get first and last weight in the period
  const startWeight = recentWeights[0];
  const endWeight = recentWeights[recentWeights.length - 1];
  
  // Calculate actual days between measurements
  const daysBetween = Math.max(1,
    (new Date(endWeight.date).getTime() - new Date(startWeight.date).getTime()) / 
    (24 * 60 * 60 * 1000)
  );

  // Weight change (positive = gained, negative = lost)
  const weightChange = endWeight.weight - startWeight.weight;

  // Get food entries in this period
  const startTime = new Date(startWeight.date).getTime();
  const endTime = new Date(endWeight.date).getTime();
  
  const foodInPeriod = foodEntries.filter((f) => {
    const entryTime = new Date(f.timestamp).getTime();
    return entryTime >= startTime && entryTime <= endTime;
  });

  // Get workout entries in this period
  const workoutsInPeriod = workoutEntries.filter((w) => {
    const workoutTime = new Date(w.date).getTime();
    return workoutTime >= startTime && workoutTime <= endTime;
  });

  // Group food by day to count days with tracking
  const foodByDay = new Map<string, number>();
  foodInPeriod.forEach((f) => {
    const dayKey = new Date(f.timestamp).toISOString().split('T')[0];
    foodByDay.set(dayKey, (foodByDay.get(dayKey) || 0) + f.macros.calories);
  });

  // Group workouts by day to calculate daily workout calories
  const workoutsByDay = new Map<string, number>();
  workoutsInPeriod.forEach((w) => {
    const dayKey = new Date(w.date).toISOString().split('T')[0];
    workoutsByDay.set(dayKey, (workoutsByDay.get(dayKey) || 0) + w.caloriesBurned);
  });

  const daysWithFoodData = foodByDay.size;
  
  if (daysWithFoodData < 3) {
    return null; // Need at least 3 days of food data
  }

  // Total calories consumed
  const totalCaloriesConsumed = foodInPeriod.reduce(
    (sum, f) => sum + f.macros.calories, 0
  );

  // Total workout calories burned
  const totalWorkoutCalories = workoutsInPeriod.reduce(
    (sum, w) => sum + w.caloriesBurned, 0
  );

  // Average daily intake (only counting days with data)
  const avgDailyIntake = Math.round(totalCaloriesConsumed / daysWithFoodData);

  // Calculate actual TDEE:
  // If weight changed, the calorie balance = Weight Change * 7700
  // Net calories = Total consumed - Workout calories burned
  // Total expenditure = Net calories - (Weight Change * 7700)
  // (negative weight change = loss = we spent more than we ate)
  const calorieBalance = weightChange * CALORIES_PER_KG;
  const netCalories = totalCaloriesConsumed - totalWorkoutCalories;
  const totalExpenditure = netCalories - calorieBalance;
  const actualTDEE = Math.round(totalExpenditure / daysWithFoodData);

  // Calculate formula-based TDEE for comparison
  const avgWeight = (startWeight.weight + endWeight.weight) / 2;
  const formulaTDEE = calculateTDEE(avgWeight, height, age, gender, activityLevel);

  // Metabolic factor: how your actual metabolism compares to the formula
  // >1 = you burn more than expected (faster metabolism)
  // <1 = you burn less than expected (slower metabolism)
  const metabolicFactor = actualTDEE / formulaTDEE;

  // Determine confidence based on data quality
  let confidence: 'low' | 'medium' | 'high' = 'low';
  let dataQuality = '';

  const trackingCoverage = daysWithFoodData / daysBetween;
  const weightDataPoints = recentWeights.length;
  const daysWithWorkouts = workoutsByDay.size;
  const workoutTrackingNote = daysWithWorkouts > 0 
    ? ` (${daysWithWorkouts} days with workouts)` 
    : '';

  if (trackingCoverage >= 0.9 && weightDataPoints >= 7 && daysBetween >= 7) {
    confidence = 'high';
    dataQuality = `Excellent tracking coverage${workoutTrackingNote}`;
  } else if (trackingCoverage >= 0.7 && weightDataPoints >= 4 && daysBetween >= 5) {
    confidence = 'medium';
    dataQuality = `Good tracking coverage${workoutTrackingNote}`;
  } else {
    dataQuality = `Limited data - track more consistently for accuracy${workoutTrackingNote}`;
  }

  // Sanity check: if the calculated TDEE is unrealistic, return null
  if (actualTDEE < 800 || actualTDEE > 6000) {
    return null;
  }

  return {
    actualTDEE,
    formulaTDEE,
    metabolicFactor: Math.round(metabolicFactor * 100) / 100,
    weightChange: Math.round(weightChange * 100) / 100,
    avgDailyIntake,
    daysAnalyzed: Math.round(daysBetween),
    confidence,
    dataQuality,
  };
}

/**
 * Get recommended calorie targets based on actual TDEE and goals
 */
export interface CalorieRecommendation {
  maintenance: number;
  mildDeficit: number; // 250 cal deficit (~0.25kg/week loss)
  moderateDeficit: number; // 500 cal deficit (~0.5kg/week loss)
  aggressiveDeficit: number; // 750 cal deficit (~0.75kg/week loss)
  extremeDeficit: number; // 1000 cal deficit (~1kg/week loss)
  mildSurplus: number; // 250 cal surplus
}

export function getCalorieRecommendations(tdee: number): CalorieRecommendation {
  return {
    maintenance: tdee,
    mildDeficit: tdee - 250,
    moderateDeficit: tdee - 500,
    aggressiveDeficit: tdee - 750,
    extremeDeficit: Math.max(tdee - 1000, 1200), // Don't go below 1200
    mildSurplus: tdee + 250,
  };
}

/**
 * Calculate projected weight change based on calorie deficit/surplus
 * Uses adaptive TDEE calculation that accounts for weight changes over time
 * 1 kg of fat ≈ 7700 calories
 */
export function calculateWeightProjection(
  currentWeight: number,
  dailyDeficit: number, // positive for deficit (weight loss), negative for surplus (weight gain)
  days: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): number {
  let weight = currentWeight;
  const caloriesPerKg = 7700;
  
  // Use daily simulation for more accurate projections
  // This accounts for TDEE changes as weight changes
  for (let day = 0; day < days; day++) {
    // Calculate current TDEE based on current weight
    const currentTDEE = calculateTDEE(weight, height, age, gender, activityLevel);
    
    // Calculate daily calorie intake (TDEE - deficit)
    // If dailyDeficit is positive (deficit), intake is less than TDEE
    // If dailyDeficit is negative (surplus), intake is more than TDEE
    const dailyIntake = currentTDEE - dailyDeficit;
    
    // Calculate actual deficit/surplus for this day
    const actualDeficit = currentTDEE - dailyIntake;
    
    // Calculate weight change for this day
    // Positive deficit = weight loss (subtract), negative deficit = weight gain (add)
    const dailyWeightChange = actualDeficit / caloriesPerKg;
    
    // Update weight: subtract for deficit (weight loss), add for surplus (weight gain)
    weight -= dailyWeightChange;
    
    // Prevent unrealistic projections (weight can't go below a reasonable minimum)
    if (weight < 30) weight = 30;
  }
  
  return Math.round(weight * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate daily calorie deficit/surplus
 */
export function calculateDailyBalance(
  caloriesConsumed: number,
  tdee: number
): number {
  return caloriesConsumed - tdee; // Negative = deficit, Positive = surplus
}

/**
 * Calculate daily deficit/surplus from weekly rate (kg/week)
 * Positive rate = deficit for weight loss
 * Negative rate = surplus for weight gain
 */
export function deficitFromRate(rateKgPerWeek: number): number {
  return (rateKgPerWeek * CALORIES_PER_KG) / 7;
}

/**
 * Compute weekly rate (kg/week) from target weight and date
 * Returns positive for weight loss, negative for weight gain
 */
export function computeRateFromTarget(
  currentWeight: number,
  targetWeight: number,
  targetDate: string
): number {
  const targetDateObj = new Date(targetDate);
  const now = new Date();
  const daysRemaining = Math.max(1, (targetDateObj.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const weeksRemaining = daysRemaining / 7;
  
  if (weeksRemaining <= 0) return 0;
  
  const weightDifference = currentWeight - targetWeight; // Positive = need to lose
  const rateKgPerWeek = weightDifference / weeksRemaining;
  
  return rateKgPerWeek;
}

/**
 * Calculate daily calorie intake from goal configuration
 * Returns the target daily calorie intake
 */
export function intakeFromGoal(
  tdee: number,
  goal: GoalConfig,
  currentWeight: number
): number {
  if (goal.mode === 'maintain') {
    return tdee;
  }

  let rateKgPerWeek: number | undefined;
  
  if (goal.preferRate && goal.rateKgPerWeek !== undefined) {
    rateKgPerWeek = goal.rateKgPerWeek;
  } else if (goal.targetWeightKg !== undefined && goal.targetDate !== undefined) {
    rateKgPerWeek = computeRateFromTarget(currentWeight, goal.targetWeightKg, goal.targetDate);
  } else if (goal.rateKgPerWeek !== undefined) {
    rateKgPerWeek = goal.rateKgPerWeek;
  }

  if (rateKgPerWeek === undefined) {
    return tdee;
  }

  const dailyDeficit = deficitFromRate(rateKgPerWeek);
  
  if (goal.mode === 'lose') {
    return Math.max(1200, Math.round(tdee - Math.abs(dailyDeficit)));
  } else if (goal.mode === 'gain') {
    return Math.round(tdee + Math.abs(dailyDeficit));
  }
  
  return tdee;
}

