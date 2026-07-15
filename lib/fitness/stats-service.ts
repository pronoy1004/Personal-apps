import { prisma } from "./prisma";
import { asStringArray } from "./json";
import { e1rm, volumeLoad } from "./scoring";

const DAY_MS = 86_400_000;

export interface DashboardStats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  lastWorkoutAt: Date | null;
  weekVolumeKg: number;
  streakWeeks: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const [totalWorkouts, last, weekWorkouts] = await Promise.all([
    prisma.workout.count(),
    prisma.workout.findFirst({ orderBy: { performedAt: "desc" }, select: { performedAt: true } }),
    prisma.workout.findMany({
      where: { performedAt: { gte: weekAgo } },
      select: { sets: { select: { reps: true, weightKg: true, multiplier: true, isWarmup: true } } },
    }),
  ]);

  let weekVolume = 0;
  for (const w of weekWorkouts) {
    for (const s of w.sets) {
      if (!s.isWarmup) {
        weekVolume += volumeLoad({ ...s, performedAt: new Date(), isWarmup: false });
      }
    }
  }

  return {
    totalWorkouts,
    workoutsThisWeek: weekWorkouts.length,
    lastWorkoutAt: last?.performedAt ?? null,
    weekVolumeKg: Math.round(weekVolume),
    streakWeeks: await computeStreakWeeks(),
  };
}

/** Consecutive weeks (ending this week) with at least one workout. */
async function computeStreakWeeks(): Promise<number> {
  const workouts = await prisma.workout.findMany({
    select: { performedAt: true },
    orderBy: { performedAt: "desc" },
    take: 400,
  });
  if (workouts.length === 0) return 0;
  const weekKeys = new Set(workouts.map((w) => weekKey(w.performedAt)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    if (weekKeys.has(weekKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      // allow current week to be empty without breaking a prior streak
      if (streak === 0 && weekKey(cursor) === weekKey(new Date())) {
        cursor.setDate(cursor.getDate() - 7);
        continue;
      }
      break;
    }
  }
  return streak;
}

function weekKey(d: Date): string {
  // Use UTC consistently so getDay/toISOString don't disagree across timezones.
  const date = new Date(d);
  const day = (date.getUTCDay() + 6) % 7; // Monday=0
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

export interface ExercisePR {
  name: string;
  bestE1rmKg: number;
  bestSet: { weightKg: number; reps: number } | null;
}

/** Personal records: best estimated 1RM per exercise. */
export async function getPersonalRecords(limit = 12): Promise<ExercisePR[]> {
  const exercises = await prisma.exercise.findMany({
    where: { isCardio: false, score: { is: { totalSets: { gt: 0 } } } },
    select: {
      name: true,
      sets: { where: { isWarmup: false }, select: { weightKg: true, reps: true, multiplier: true } },
    },
  });
  const prs: ExercisePR[] = [];
  for (const ex of exercises) {
    let best = 0;
    let bestSet: { weightKg: number; reps: number } | null = null;
    for (const s of ex.sets) {
      const est = e1rm(s.weightKg, s.reps, s.multiplier);
      if (est > best) {
        best = est;
        bestSet = { weightKg: s.weightKg, reps: s.reps };
      }
    }
    if (best > 0) prs.push({ name: ex.name, bestE1rmKg: Math.round(best), bestSet });
  }
  return prs.sort((a, b) => b.bestE1rmKg - a.bestE1rmKg).slice(0, limit);
}

export function muscleLabel(m: string): string {
  return m.replace(/\b\w/g, (c) => c.toUpperCase());
}

export { asStringArray };
