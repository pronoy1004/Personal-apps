import AppLayout from "@/components/layout/AppLayout";
import FitnessNav from "@/components/fitness/FitnessNav";
import { prisma } from "@/lib/fitness/prisma";
import { asStringArray } from "@/lib/fitness/json";
import { getSettings } from "@/lib/fitness/settings-service";
import { type TunerExercise } from "@/components/fitness/profit/insights/ScoringTuner";
import { InsightsTabs } from "@/components/fitness/profit/insights/InsightsTabs";
import {
  weeklyVolume,
  muscleVolume,
  topE1rmSeries,
  bodyweightSeries,
} from "@/lib/fitness/chart-service";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const settings = await getSettings();
  const [weekly, muscles, e1rm, bodyweight] = await Promise.all([
    weeklyVolume(16),
    muscleVolume(90),
    topE1rmSeries(8),
    bodyweightSeries(),
  ]);
  const scored = await prisma.exercise.findMany({
    where: { score: { is: { totalSets: { gt: 0 } } } },
    select: {
      id: true,
      name: true,
      primaryMuscles: true,
      score: {
        select: {
          progressionScore: true,
          preferenceScore: true,
          effectivenessScore: true,
          bestE1rmKg: true,
          totalSets: true,
        },
      },
    },
  });

  const exercises: TunerExercise[] = scored
    .filter((e) => e.score)
    .map((e) => ({
      id: e.id,
      name: e.name,
      progression: e.score!.progressionScore,
      preference: e.score!.preferenceScore,
      effectiveness: e.score!.effectivenessScore,
      bestE1rmKg: e.score!.bestE1rmKg,
      totalSets: e.score!.totalSets,
      primaryMuscles: asStringArray(e.primaryMuscles),
    }));

  return (
    <AppLayout>
      <FitnessNav />
      <div className="flex flex-col gap-4 py-1">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight">Insights</h1>
          <p className="text-sm text-muted">
            {exercises.length} scored exercises across your full history.
          </p>
        </header>
        <InsightsTabs
          exercises={exercises}
          weights={settings.scoringWeights}
          weekly={weekly}
          muscles={muscles}
          e1rm={e1rm}
          bodyweight={bodyweight}
        />
      </div>
    </AppLayout>
  );
}
