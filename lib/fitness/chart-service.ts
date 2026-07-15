import { prisma } from "./prisma";
import { asStringArray } from "./json";
import { e1rm, volumeLoad } from "./scoring";

const DAY_MS = 86_400_000;

export interface WeeklyVolumePoint {
  week: string; // e.g. "Jun 9"
  volume: number; // tonnes
  sets: number;
}

export interface MuscleVolumePoint {
  muscle: string;
  volume: number;
}

export interface E1rmPoint {
  date: number; // epoch ms
  e1rm: number;
}

export interface E1rmSeries {
  exerciseId: string;
  name: string;
  points: E1rmPoint[];
}

export interface BodyweightPoint {
  date: number;
  weight: number;
}

function mondayUTC(d: Date): Date {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function weeklyVolume(weeks = 16): Promise<WeeklyVolumePoint[]> {
  const since = mondayUTC(new Date(Date.now() - weeks * 7 * DAY_MS));
  const sets = await prisma.workoutSet.findMany({
    where: { isWarmup: false, workout: { performedAt: { gte: since } } },
    select: {
      reps: true,
      weightKg: true,
      multiplier: true,
      workout: { select: { performedAt: true } },
    },
  });

  const buckets = new Map<number, { volume: number; sets: number }>();
  // pre-seed all weeks so gaps render as zero
  for (let i = 0; i <= weeks; i++) {
    const w = mondayUTC(new Date(since.getTime() + i * 7 * DAY_MS)).getTime();
    buckets.set(w, { volume: 0, sets: 0 });
  }
  for (const s of sets) {
    const wk = mondayUTC(s.workout.performedAt).getTime();
    const b = buckets.get(wk) ?? { volume: 0, sets: 0 };
    b.volume += volumeLoad({ ...s, isWarmup: false, performedAt: s.workout.performedAt });
    b.sets += 1;
    buckets.set(wk, b);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([wk, b]) => ({
      week: new Date(wk).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      volume: Math.round(b.volume / 100) / 10, // tonnes, 1 decimal
      sets: b.sets,
    }));
}

export async function muscleVolume(days = 90): Promise<MuscleVolumePoint[]> {
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

  const totals = new Map<string, number>();
  for (const s of sets) {
    const vol = volumeLoad({ ...s, isWarmup: false, performedAt: s.workout.performedAt });
    for (const m of asStringArray(s.exercise.primaryMuscles)) {
      totals.set(m, (totals.get(m) ?? 0) + vol);
    }
    for (const m of asStringArray(s.exercise.secondaryMuscles)) {
      totals.set(m, (totals.get(m) ?? 0) + vol * 0.5);
    }
  }

  return [...totals.entries()]
    .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume / 1000) }))
    .filter((m) => m.volume > 0)
    .sort((a, b) => b.volume - a.volume);
}

/** e1RM trend (session-best) for the top exercises by training volume. */
export async function topE1rmSeries(count = 6): Promise<E1rmSeries[]> {
  const top = await prisma.exercise.findMany({
    where: { isCardio: false, score: { is: { totalSets: { gt: 5 } } } },
    select: { id: true, name: true, score: { select: { totalSets: true } } },
    orderBy: { score: { totalSets: "desc" } },
    take: count,
  });

  const series: E1rmSeries[] = [];
  for (const ex of top) {
    const sets = await prisma.workoutSet.findMany({
      where: { exerciseId: ex.id, isWarmup: false, weightKg: { gt: 0 } },
      select: { reps: true, weightKg: true, multiplier: true, workout: { select: { performedAt: true } } },
    });
    const byDay = new Map<string, { date: number; best: number }>();
    for (const s of sets) {
      const key = s.workout.performedAt.toISOString().slice(0, 10);
      const est = e1rm(s.weightKg, s.reps, s.multiplier);
      const cur = byDay.get(key);
      if (!cur || est > cur.best) {
        byDay.set(key, { date: s.workout.performedAt.getTime(), best: Math.round(est) });
      }
    }
    series.push({
      exerciseId: ex.id,
      name: ex.name,
      points: [...byDay.values()].sort((a, b) => a.date - b.date).map((d) => ({ date: d.date, e1rm: d.best })),
    });
  }
  return series;
}

export async function bodyweightSeries(): Promise<BodyweightPoint[]> {
  const metrics = await prisma.bodyMetric.findMany({
    where: { weightKg: { not: null } },
    orderBy: { measuredAt: "asc" },
    select: { measuredAt: true, weightKg: true },
  });
  return metrics.map((m) => ({ date: m.measuredAt.getTime(), weight: m.weightKg! }));
}
