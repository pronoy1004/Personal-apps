// Muscle-recovery model (Fitbod-style). Each muscle group has a base recovery
// window; a muscle worked today is ~0% fresh and climbs back to 100% over that
// window. Heavier-than-usual sessions extend the window. Pure functions.

export const MUSCLE_GROUPS = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower back",
  "middle back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

const RECOVERY_DAYS: Record<string, number> = {
  quadriceps: 4,
  hamstrings: 4,
  glutes: 4,
  chest: 3.5,
  lats: 3.5,
  "middle back": 3.5,
  "lower back": 4,
  shoulders: 3,
  biceps: 2.5,
  triceps: 2.5,
  calves: 2.5,
  abdominals: 2,
  forearms: 2,
  traps: 3,
  neck: 2,
  adductors: 3,
  abductors: 3,
};

const DAY_MS = 86_400_000;

export interface RecoverySet {
  performedAt: Date;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  volumeLoad: number; // reps * weight * multiplier
}

export interface MuscleRecovery {
  muscle: string;
  freshness: number; // 0–100
  lastWorked: Date | null;
  daysSince: number | null;
}

function recoveryDays(muscle: string): number {
  return RECOVERY_DAYS[muscle] ?? 3;
}

/**
 * Compute freshness per muscle from recent sets (caller should pass the last
 * ~10 days of sets). For each muscle we look at the session that fatigued it
 * most and let it recover linearly over the (intensity-adjusted) window.
 */
export function computeRecovery(
  sets: RecoverySet[],
  now: number = Date.now(),
): MuscleRecovery[] {
  // typical per-muscle session volume → used to scale recovery window by intensity
  const muscleSessionVolumes = new Map<string, number[]>();
  // group volume per (muscle, day) with primary=1, secondary=0.5 weighting
  const perMuscleDay = new Map<string, Map<string, { date: Date; vol: number }>>();

  for (const s of sets) {
    const day = s.performedAt.toISOString().slice(0, 10);
    const apply = (muscle: string, weight: number) => {
      if (!perMuscleDay.has(muscle)) perMuscleDay.set(muscle, new Map());
      const dayMap = perMuscleDay.get(muscle)!;
      const cur = dayMap.get(day);
      const vol = s.volumeLoad * weight;
      if (cur) cur.vol += vol;
      else dayMap.set(day, { date: s.performedAt, vol });
    };
    for (const m of s.primaryMuscles) apply(m, 1);
    for (const m of s.secondaryMuscles) apply(m, 0.5);
  }

  for (const [muscle, dayMap] of perMuscleDay) {
    muscleSessionVolumes.set(
      muscle,
      [...dayMap.values()].map((d) => d.vol),
    );
  }

  return MUSCLE_GROUPS.map((muscle) => {
    const dayMap = perMuscleDay.get(muscle);
    if (!dayMap || dayMap.size === 0) {
      return { muscle, freshness: 100, lastWorked: null, daysSince: null };
    }
    const vols = muscleSessionVolumes.get(muscle) ?? [];
    const typical = median(vols) || 1;
    let minFreshness = 100;
    let lastWorked: Date | null = null;
    for (const { date, vol } of dayMap.values()) {
      const daysAgo = (now - date.getTime()) / DAY_MS;
      if (daysAgo < 0) continue;
      const intensity = clamp(vol / typical, 0.6, 1.6);
      const window = recoveryDays(muscle) * intensity;
      const fresh = clamp((daysAgo / window) * 100, 0, 100);
      if (fresh < minFreshness) minFreshness = fresh;
      if (!lastWorked || date > lastWorked) lastWorked = date;
    }
    const daysSince = lastWorked ? Math.round((now - lastWorked.getTime()) / DAY_MS) : null;
    return { muscle, freshness: Math.round(minFreshness), lastWorked, daysSince };
  });
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
