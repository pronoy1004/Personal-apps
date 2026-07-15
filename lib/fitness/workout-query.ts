import { prisma } from "./prisma";
import { asStringArray } from "./json";

export interface LoggerSet {
  id: string;
  order: number;
  reps: number;
  weightKg: number;
  multiplier: number;
  isWarmup: boolean;
  completed: boolean;
}

export interface LoggerExercise {
  exerciseId: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  imageUrl: string | null;
  defaultIncrementKg: number;
  isCardio: boolean;
  sets: LoggerSet[];
  lastSummary: string | null;
}

export interface LoggerWorkout {
  id: string;
  performedAt: Date;
  finishedAt: Date | null;
  note: string | null;
  exercises: LoggerExercise[];
}

/** Load a workout shaped for the logger: sets grouped by exercise, in order. */
export async function getLoggerWorkout(workoutId: string): Promise<LoggerWorkout | null> {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      sets: {
        orderBy: { order: "asc" },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              equipment: true,
              primaryMuscles: true,
              imageUrls: true,
              defaultIncrementKg: true,
              isCardio: true,
            },
          },
        },
      },
    },
  });
  if (!workout) return null;

  const byExercise = new Map<string, LoggerExercise>();
  const firstOrder = new Map<string, number>();
  for (const s of workout.sets) {
    const ex = s.exercise;
    if (!byExercise.has(ex.id)) {
      firstOrder.set(ex.id, s.order);
      byExercise.set(ex.id, {
        exerciseId: ex.id,
        name: ex.name,
        equipment: ex.equipment,
        primaryMuscles: asStringArray(ex.primaryMuscles),
        imageUrl: asStringArray(ex.imageUrls)[0] ?? null,
        defaultIncrementKg: ex.defaultIncrementKg,
        isCardio: ex.isCardio,
        sets: [],
        lastSummary: null,
      });
    }
    byExercise.get(ex.id)!.sets.push({
      id: s.id,
      order: s.order,
      reps: s.reps,
      weightKg: s.weightKg,
      multiplier: s.multiplier,
      isWarmup: s.isWarmup,
      completed: s.completed,
    });
  }

  const exercises = [...byExercise.values()].sort(
    (a, b) => (firstOrder.get(a.exerciseId)! - firstOrder.get(b.exerciseId)!),
  );

  // Attach a "last time" summary for each exercise (previous workout).
  for (const ex of exercises) {
    ex.lastSummary = await lastSessionSummary(ex.exerciseId, workoutId);
  }

  return {
    id: workout.id,
    performedAt: workout.performedAt,
    finishedAt: workout.finishedAt,
    note: workout.note,
    exercises,
  };
}

async function lastSessionSummary(exerciseId: string, excludeWorkoutId: string): Promise<string | null> {
  const prevSet = await prisma.workoutSet.findFirst({
    where: { exerciseId, isWarmup: false, workoutId: { not: excludeWorkoutId } },
    orderBy: { workout: { performedAt: "desc" } },
    select: { workoutId: true },
  });
  if (!prevSet) return null;
  const sets = await prisma.workoutSet.findMany({
    where: { workoutId: prevSet.workoutId, exerciseId, isWarmup: false },
    select: { weightKg: true, reps: true },
    orderBy: { order: "asc" },
  });
  if (sets.length === 0) return null;
  const r = (n: number) => Math.round(n * 4) / 4;
  return sets.map((s) => `${r(s.weightKg)}×${s.reps}`).join(", ");
}
