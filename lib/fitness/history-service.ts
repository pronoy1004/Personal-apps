import { prisma } from "./prisma";
import { asStringArray } from "./json";
import { volumeLoad } from "./scoring";

export interface HistoryItem {
  id: string;
  performedAt: Date;
  source: string;
  exerciseNames: string[];
  totalSets: number;
  workingSets: number;
  volumeKg: number;
}

export async function listHistory(take = 50, skip = 0): Promise<HistoryItem[]> {
  const workouts = await prisma.workout.findMany({
    where: { OR: [{ finishedAt: { not: null } }, { source: "fitbod-import" }] },
    orderBy: { performedAt: "desc" },
    take,
    skip,
    include: {
      sets: {
        select: {
          reps: true,
          weightKg: true,
          multiplier: true,
          isWarmup: true,
          exercise: { select: { name: true } },
        },
      },
    },
  });

  return workouts.map((w) => {
    const names: string[] = [];
    let volume = 0;
    let working = 0;
    for (const s of w.sets) {
      if (!names.includes(s.exercise.name)) names.push(s.exercise.name);
      if (!s.isWarmup) {
        working++;
        volume += volumeLoad({ ...s, isWarmup: false, performedAt: w.performedAt });
      }
    }
    return {
      id: w.id,
      performedAt: w.performedAt,
      source: w.source,
      exerciseNames: names,
      totalSets: w.sets.length,
      workingSets: working,
      volumeKg: Math.round(volume),
    };
  });
}

export interface HistoryDetailExercise {
  name: string;
  primaryMuscles: string[];
  sets: { weightKg: number; reps: number; isWarmup: boolean; multiplier: number }[];
}

export async function getHistoryDetail(id: string) {
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      sets: {
        orderBy: { order: "asc" },
        include: { exercise: { select: { name: true, primaryMuscles: true } } },
      },
    },
  });
  if (!workout) return null;

  const byEx = new Map<string, HistoryDetailExercise>();
  for (const s of workout.sets) {
    if (!byEx.has(s.exercise.name)) {
      byEx.set(s.exercise.name, {
        name: s.exercise.name,
        primaryMuscles: asStringArray(s.exercise.primaryMuscles),
        sets: [],
      });
    }
    byEx.get(s.exercise.name)!.sets.push({
      weightKg: s.weightKg,
      reps: s.reps,
      isWarmup: s.isWarmup,
      multiplier: s.multiplier,
    });
  }
  return {
    id: workout.id,
    performedAt: workout.performedAt,
    note: workout.note,
    source: workout.source,
    exercises: [...byEx.values()],
  };
}
