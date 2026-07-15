// Progressive-overload prescription via double progression: work up the rep
// range at a fixed weight, then add the smallest increment and drop back to the
// bottom of the range. Pure functions.

export type Goal = "strength" | "hypertrophy" | "endurance";

export interface RepRange {
  min: number;
  max: number;
  sets: number;
}

export function repRangeForGoal(goal: Goal): RepRange {
  switch (goal) {
    case "strength":
      return { min: 4, max: 6, sets: 4 };
    case "endurance":
      return { min: 12, max: 20, sets: 3 };
    case "hypertrophy":
    default:
      return { min: 8, max: 12, sets: 3 };
  }
}

export interface LastSet {
  weightKg: number;
  reps: number;
  multiplier: number;
  isWarmup: boolean;
}

export interface Prescription {
  weightKg: number;
  reps: number;
  sets: number;
  multiplier: number;
  reason: string;
}

/** Round to the nearest achievable weight given the increment. */
function roundToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return weight;
  return Math.round(weight / increment) * increment;
}

/**
 * Prescribe the next session for an exercise from its most recent working sets.
 * If no history, return a sensible bodyweight/empty starting suggestion.
 */
export function prescribeNext(
  lastWorkingSets: LastSet[],
  goal: Goal,
  incrementKg: number,
): Prescription {
  const range = repRangeForGoal(goal);
  const working = lastWorkingSets.filter((s) => !s.isWarmup);

  if (working.length === 0) {
    return {
      weightKg: 0,
      reps: range.min,
      sets: range.sets,
      multiplier: 1,
      reason: "No history yet — start light and build a baseline.",
    };
  }

  // Top working weight from last session and the reps achieved at it.
  const topWeight = Math.max(...working.map((s) => s.weightKg));
  const setsAtTop = working.filter((s) => s.weightKg === topWeight);
  const minRepsAtTop = Math.min(...setsAtTop.map((s) => s.reps));
  const multiplier = setsAtTop[0]?.multiplier || 1;
  const sets = Math.max(range.sets, setsAtTop.length);

  if (minRepsAtTop >= range.max) {
    // Hit the top of the range on every set → add load, reset reps.
    const next = roundToIncrement(topWeight + incrementKg, incrementKg);
    return {
      weightKg: next,
      reps: range.min,
      sets,
      multiplier,
      reason: `Last time you hit ${minRepsAtTop}+ reps at ${topWeight}kg across all sets — adding ${incrementKg}kg.`,
    };
  }

  // Otherwise hold weight (rounded to a sane precision) and chase one more rep.
  const held = Math.round(topWeight * 4) / 4; // nearest 0.25
  const targetReps = Math.min(minRepsAtTop + 1, range.max);
  return {
    weightKg: held,
    reps: targetReps,
    sets,
    multiplier,
    reason: `Hold ${held}kg and aim for ${targetReps} reps (was ${minRepsAtTop}).`,
  };
}
