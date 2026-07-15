import { prisma } from "./prisma";
import { asStringArray } from "./json";
import { computeRecovery, type RecoverySet, type MuscleRecovery } from "./recovery";
import { volumeLoad } from "./scoring";
import { prescribeNext, type Goal, type LastSet, type Prescription } from "./prescription";

const DAY_MS = 86_400_000;

export interface SuggestedExercise {
  exerciseId: string;
  name: string;
  primaryMuscles: string[];
  equipment: string | null;
  imageUrl: string | null;
  compositeScore: number;
  prescription: Prescription;
  targetMuscle: string;
}

export interface WorkoutSuggestion {
  targetMuscles: string[];
  recovery: MuscleRecovery[];
  exercises: SuggestedExercise[];
}

/** Pull the last `days` of sets joined with muscle info for the recovery model. */
async function recentRecoverySets(days = 10): Promise<RecoverySet[]> {
  const since = new Date(Date.now() - days * DAY_MS);
  const sets = await prisma.workoutSet.findMany({
    where: { isWarmup: false, workout: { performedAt: { gte: since } } },
    select: {
      reps: true,
      weightKg: true,
      multiplier: true,
      workout: { select: { performedAt: true } },
      exercise: { select: { primaryMuscles: true, secondaryMuscles: true } },
    },
  });
  return sets.map((s) => ({
    performedAt: s.workout.performedAt,
    primaryMuscles: asStringArray(s.exercise.primaryMuscles),
    secondaryMuscles: asStringArray(s.exercise.secondaryMuscles),
    volumeLoad: volumeLoad({
      reps: s.reps,
      weightKg: s.weightKg,
      multiplier: s.multiplier,
      isWarmup: false,
      performedAt: s.workout.performedAt,
    }),
  }));
}

function equipmentAllowed(equipment: string | null, available: string[]): boolean {
  if (available.length === 0) return true;
  if (!equipment || equipment === "body only") return true;
  return available.includes(equipment);
}

export async function generateSuggestion(
  numMuscles = 4,
  perMuscle = 2,
): Promise<WorkoutSuggestion> {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  const goal = (setting?.goal as Goal) ?? "hypertrophy";
  const available = asStringArray(setting?.availableEquipment);

  const recovery = await computeRecovery(await recentRecoverySets());

  // Target the freshest muscles, biased toward bigger groups (higher freshness
  // first; ties already even). Skip muscles below 55% fresh.
  const targets = recovery
    .filter((r) => r.freshness >= 55)
    .sort((a, b) => b.freshness - a.freshness)
    .slice(0, numMuscles)
    .map((r) => r.muscle);

  const chosen: SuggestedExercise[] = [];
  const usedIds = new Set<string>();

  for (const muscle of targets) {
    const candidates = await prisma.exercise.findMany({
      where: { isCardio: false, score: { is: { totalSets: { gt: 0 } } } },
      select: {
        id: true,
        name: true,
        equipment: true,
        primaryMuscles: true,
        imageUrls: true,
        score: { select: { compositeScore: true } },
      },
      orderBy: { score: { compositeScore: "desc" } },
      take: 60,
    });

    let added = 0;
    for (const c of candidates) {
      if (added >= perMuscle) break;
      if (usedIds.has(c.id)) continue;
      const primary = asStringArray(c.primaryMuscles);
      if (!primary.includes(muscle)) continue;
      if (!equipmentAllowed(c.equipment, available)) continue;

      const lastSets = await lastWorkingSetsFor(c.id);
      const increment = await incrementFor(c.id);
      const prescription = prescribeNext(lastSets, goal, increment);
      const images = asStringArray(c.imageUrls);

      chosen.push({
        exerciseId: c.id,
        name: c.name,
        primaryMuscles: primary,
        equipment: c.equipment,
        imageUrl: images[0] ?? null,
        compositeScore: c.score?.compositeScore ?? 0,
        prescription,
        targetMuscle: muscle,
      });
      usedIds.add(c.id);
      added++;
    }
  }

  return { targetMuscles: targets, recovery, exercises: chosen };
}

async function incrementFor(exerciseId: string): Promise<number> {
  const ex = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { defaultIncrementKg: true },
  });
  return ex?.defaultIncrementKg ?? 2.5;
}

/** Most recent session's working sets for an exercise. */
export async function lastWorkingSetsFor(exerciseId: string): Promise<LastSet[]> {
  const lastWorkout = await prisma.workoutSet.findFirst({
    where: { exerciseId, isWarmup: false },
    orderBy: { workout: { performedAt: "desc" } },
    select: { workoutId: true },
  });
  if (!lastWorkout) return [];
  const sets = await prisma.workoutSet.findMany({
    where: { exerciseId, workoutId: lastWorkout.workoutId },
    orderBy: { order: "asc" },
    select: { weightKg: true, reps: true, multiplier: true, isWarmup: true },
  });
  return sets;
}
