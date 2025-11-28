/**
 * Calculate recommended macro distribution based on TDEE and protein goal
 * If protein goal is set, calculate remaining calories for carbs and fat
 */
export function calculateMacroDistribution(
  tdee: number,
  proteinGoal?: number,
  carbsGoal?: number,
  fatGoal?: number
): {
  protein: number;
  carbs: number;
  fat: number;
  proteinCalories: number;
  carbsCalories: number;
  fatCalories: number;
} {
  const proteinCalPerGram = 4;
  const carbsCalPerGram = 4;
  const fatCalPerGram = 9;

  let proteinCalories = 0;
  let carbsCalories = 0;
  let fatCalories = 0;

  // If protein goal is set, use it
  if (proteinGoal && proteinGoal > 0) {
    proteinCalories = proteinGoal * proteinCalPerGram;
  } else {
    // Default: 30% of TDEE from protein
    proteinCalories = tdee * 0.3;
  }

  // If carbs goal is set, use it
  if (carbsGoal && carbsGoal > 0) {
    carbsCalories = carbsGoal * carbsCalPerGram;
  }

  // If fat goal is set, use it
  if (fatGoal && fatGoal > 0) {
    fatCalories = fatGoal * fatCalPerGram;
  }

  // If both carbs and fat are set, use them
  // Otherwise, distribute remaining calories
  const remainingCalories = tdee - proteinCalories - carbsCalories - fatCalories;

  if (remainingCalories > 0) {
    if (!carbsGoal || carbsGoal === 0) {
      if (!fatGoal || fatGoal === 0) {
        // Distribute remaining: 50% carbs, 50% fat (after protein)
        // This ensures we use all available calories
        carbsCalories = remainingCalories * 0.5;
        fatCalories = remainingCalories * 0.5;
      } else {
        // Fat is set, use remaining for carbs
        carbsCalories = remainingCalories;
      }
    } else if (!fatGoal || fatGoal === 0) {
      // Carbs is set, use remaining for fat
      fatCalories = remainingCalories;
    }
  } else if (remainingCalories < 0) {
    // If goals exceed TDEE, scale them down proportionally
    const scale = tdee / (proteinCalories + carbsCalories + fatCalories);
    proteinCalories *= scale;
    carbsCalories *= scale;
    fatCalories *= scale;
  }

  return {
    protein: proteinCalories / proteinCalPerGram,
    carbs: carbsCalories / carbsCalPerGram,
    fat: fatCalories / fatCalPerGram,
    proteinCalories,
    carbsCalories,
    fatCalories,
  };
}

