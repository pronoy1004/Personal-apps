// Exercise scoring engine. Pure functions — fed by the DB layer or scripts.
//
// Three sub-scores, each normalized to a 0–100 percentile across all scored
// exercises, then blended into a composite using user-tunable weights:
//   • progression   — how reliably you add load over time (slope of best e1RM)
//   • preference     — recency-weighted training frequency (your de-facto favorites)
//   • effectiveness  — stimulus delivered (working volume-load, compound-weighted)

export interface ScoringSet {
  performedAt: Date;
  reps: number;
  weightKg: number;
  multiplier: number;
  isWarmup: boolean;
}

export interface ScoringInput {
  exerciseId: string;
  mechanic: string | null;
  isCardio: boolean;
  sets: ScoringSet[];
}

export interface ScoreWeights {
  progression: number;
  preference: number;
  effectiveness: number;
}

export interface ExerciseScoreResult {
  exerciseId: string;
  progressionScore: number; // 0–100
  preferenceScore: number; // 0–100
  effectivenessScore: number; // 0–100
  compositeScore: number; // 0–100
  bestE1rmKg: number;
  totalSets: number;
  lastPerformedAt: Date | null;
  details: {
    sessions: number;
    volumeLoad: number;
    progressionSlopePer30d: number; // relative slope, can be negative
    recencyWeightedFreq: number;
    daysSinceLast: number | null;
  };
}

const DAY_MS = 86_400_000;

/** Estimated 1-rep-max (Epley), reps capped to keep high-rep sets sane. */
export function e1rm(weightKg: number, reps: number, multiplier = 1): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  const r = Math.min(reps, 20);
  return weightKg * multiplier * (1 + r / 30);
}

export function volumeLoad(set: ScoringSet): number {
  return set.reps * set.weightKg * (set.multiplier || 1);
}

/** Least-squares slope of y over x (days). Returns 0 if <2 points. */
function slope(points: { x: number; y: number }[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

interface RawMetrics {
  exerciseId: string;
  bestE1rm: number;
  totalSets: number;
  lastPerformedAt: Date | null;
  sessions: number;
  volumeLoad: number;
  progressionRaw: number; // relative slope per 30d
  preferenceRaw: number; // recency-weighted frequency
  effectivenessRaw: number;
  daysSinceLast: number | null;
}

function computeRaw(input: ScoringInput, now: number): RawMetrics {
  const working = input.sets.filter(
    (s) => !s.isWarmup && s.reps > 0 && s.weightKg > 0,
  );

  // Group working sets by calendar day → session-best e1RM.
  const byDay = new Map<string, { date: Date; bestE1rm: number }>();
  let totalVolume = 0;
  let lastPerformedAt: Date | null = null;
  for (const s of working) {
    totalVolume += volumeLoad(s);
    const key = s.performedAt.toISOString().slice(0, 10);
    const est = e1rm(s.weightKg, s.reps, s.multiplier);
    const cur = byDay.get(key);
    if (!cur || est > cur.bestE1rm) byDay.set(key, { date: s.performedAt, bestE1rm: est });
    if (!lastPerformedAt || s.performedAt > lastPerformedAt) lastPerformedAt = s.performedAt;
  }

  // Also track last-performed across ALL sets (so cardio/untracked still register).
  for (const s of input.sets) {
    if (!lastPerformedAt || s.performedAt > lastPerformedAt) lastPerformedAt = s.performedAt;
  }

  const sessions = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  const bestE1rm = sessions.reduce((m, s) => Math.max(m, s.bestE1rm), 0);

  // Progression: relative slope of session-best e1RM per 30 days.
  let progressionRaw = 0;
  if (sessions.length >= 3) {
    const t0 = sessions[0].date.getTime();
    const pts = sessions.map((s) => ({ x: (s.date.getTime() - t0) / DAY_MS, y: s.bestE1rm }));
    const meanY = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const raw = slope(pts) * 30; // per 30 days
    progressionRaw = meanY > 0 ? raw / meanY : 0; // relative growth
  }

  // Preference: recency-weighted session frequency (all sets, 120-day half-life-ish).
  const sessionDays = new Set(input.sets.map((s) => s.performedAt.toISOString().slice(0, 10)));
  let preferenceRaw = 0;
  for (const key of sessionDays) {
    const daysAgo = (now - new Date(key).getTime()) / DAY_MS;
    preferenceRaw += Math.exp(-daysAgo / 120);
  }

  const compoundBonus = input.mechanic === "compound" ? 1.2 : 1;
  const effectivenessRaw = input.isCardio ? 0 : totalVolume * compoundBonus;

  const daysSinceLast = lastPerformedAt ? (now - lastPerformedAt.getTime()) / DAY_MS : null;

  return {
    exerciseId: input.exerciseId,
    bestE1rm,
    totalSets: working.length,
    lastPerformedAt,
    sessions: sessions.length,
    volumeLoad: totalVolume,
    progressionRaw,
    preferenceRaw,
    effectivenessRaw,
    daysSinceLast,
  };
}

/** Percentile rank (0–100) of each value within the array. Ties share rank. */
function percentileRanks(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  return values.map((v) => {
    // fraction of values strictly less than v
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return n === 1 ? 100 : (lo / (n - 1)) * 100;
  });
}

export function computeScores(
  inputs: ScoringInput[],
  weights: ScoreWeights,
  now: number = Date.now(),
): ExerciseScoreResult[] {
  const raws = inputs.map((i) => computeRaw(i, now));
  // Only rank exercises that have real strength data so cardio/empties don't skew.
  const scored = raws.filter((r) => r.totalSets > 0);

  const progRanks = percentileRanks(scored.map((r) => r.progressionRaw));
  const prefRanks = percentileRanks(scored.map((r) => r.preferenceRaw));
  const effRanks = percentileRanks(scored.map((r) => r.effectivenessRaw));

  const wSum = weights.progression + weights.preference + weights.effectiveness || 1;
  const w = {
    progression: weights.progression / wSum,
    preference: weights.preference / wSum,
    effectiveness: weights.effectiveness / wSum,
  };

  const rankById = new Map<string, { p: number; pr: number; e: number }>();
  scored.forEach((r, i) => {
    rankById.set(r.exerciseId, { p: progRanks[i], pr: prefRanks[i], e: effRanks[i] });
  });

  return raws.map((r) => {
    const ranks = rankById.get(r.exerciseId) ?? { p: 0, pr: 0, e: 0 };
    const composite =
      w.progression * ranks.p + w.preference * ranks.pr + w.effectiveness * ranks.e;
    return {
      exerciseId: r.exerciseId,
      progressionScore: round(ranks.p),
      preferenceScore: round(ranks.pr),
      effectivenessScore: round(ranks.e),
      compositeScore: round(composite),
      bestE1rmKg: round(r.bestE1rm),
      totalSets: r.totalSets,
      lastPerformedAt: r.lastPerformedAt,
      details: {
        sessions: r.sessions,
        volumeLoad: round(r.volumeLoad),
        progressionSlopePer30d: +(r.progressionRaw * 100).toFixed(2), // % per 30d
        recencyWeightedFreq: +r.preferenceRaw.toFixed(2),
        daysSinceLast: r.daysSinceLast == null ? null : Math.round(r.daysSinceLast),
      },
    };
  });
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
