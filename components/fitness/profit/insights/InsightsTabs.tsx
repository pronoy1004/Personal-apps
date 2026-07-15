"use client";

import { useState } from "react";
import { ScoringTuner, type TunerExercise } from "./ScoringTuner";
import { TrendsView } from "./TrendsView";
import type { ScoreWeights } from "@/lib/fitness/scoring";
import type {
  WeeklyVolumePoint,
  MuscleVolumePoint,
  E1rmSeries,
  BodyweightPoint,
} from "@/lib/fitness/chart-service";
import { cn } from "@/lib/fitness/cn";

export function InsightsTabs({
  exercises,
  weights,
  weekly,
  muscles,
  e1rm,
  bodyweight,
}: {
  exercises: TunerExercise[];
  weights: ScoreWeights;
  weekly: WeeklyVolumePoint[];
  muscles: MuscleVolumePoint[];
  e1rm: E1rmSeries[];
  bodyweight: BodyweightPoint[];
}) {
  const [tab, setTab] = useState<"trends" | "scoring">("trends");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
        <TabBtn active={tab === "trends"} onClick={() => setTab("trends")}>
          Trends
        </TabBtn>
        <TabBtn active={tab === "scoring"} onClick={() => setTab("scoring")}>
          Scoring
        </TabBtn>
      </div>

      {tab === "trends" ? (
        <TrendsView weekly={weekly} muscles={muscles} e1rm={e1rm} bodyweight={bodyweight} />
      ) : (
        <ScoringTuner exercises={exercises} initialWeights={weights} />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-muted",
      )}
    >
      {children}
    </button>
  );
}
