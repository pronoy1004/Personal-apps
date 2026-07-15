import { prisma } from "./prisma";
import { asObject } from "./json";
import {
  computeScores,
  type ScoreWeights,
  type ScoringInput,
  type ExerciseScoreResult,
} from "./scoring";

export const DEFAULT_WEIGHTS: ScoreWeights = {
  progression: 0.4,
  preference: 0.3,
  effectiveness: 0.3,
};

export async function getScoringWeights(): Promise<ScoreWeights> {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!setting) return DEFAULT_WEIGHTS;
  return asObject<ScoreWeights>(setting.scoringWeights, DEFAULT_WEIGHTS);
}

/** Load every exercise with its sets and compute scores in memory. */
export async function computeAllScores(
  weights?: ScoreWeights,
): Promise<ExerciseScoreResult[]> {
  const w = weights ?? (await getScoringWeights());
  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      mechanic: true,
      isCardio: true,
      sets: {
        select: {
          reps: true,
          weightKg: true,
          multiplier: true,
          isWarmup: true,
          workout: { select: { performedAt: true } },
        },
      },
    },
  });

  const inputs: ScoringInput[] = exercises.map((e) => ({
    exerciseId: e.id,
    mechanic: e.mechanic,
    isCardio: e.isCardio,
    sets: e.sets.map((s) => ({
      performedAt: s.workout.performedAt,
      reps: s.reps,
      weightKg: s.weightKg,
      multiplier: s.multiplier,
      isWarmup: s.isWarmup,
    })),
  }));

  return computeScores(inputs, w);
}

/** Recompute and persist all ExerciseScore rows. */
export async function recomputeAndPersist(weights?: ScoreWeights): Promise<number> {
  const results = await computeAllScores(weights);
  for (const r of results) {
    await prisma.exerciseScore.upsert({
      where: { exerciseId: r.exerciseId },
      create: {
        exerciseId: r.exerciseId,
        progressionScore: r.progressionScore,
        preferenceScore: r.preferenceScore,
        effectivenessScore: r.effectivenessScore,
        compositeScore: r.compositeScore,
        bestE1rmKg: r.bestE1rmKg,
        totalSets: r.totalSets,
        lastPerformedAt: r.lastPerformedAt,
        details: JSON.stringify(r.details),
      },
      update: {
        progressionScore: r.progressionScore,
        preferenceScore: r.preferenceScore,
        effectivenessScore: r.effectivenessScore,
        compositeScore: r.compositeScore,
        bestE1rmKg: r.bestE1rmKg,
        totalSets: r.totalSets,
        lastPerformedAt: r.lastPerformedAt,
        details: JSON.stringify(r.details),
      },
    });
  }
  return results.length;
}
