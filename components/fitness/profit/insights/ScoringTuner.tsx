"use client";

import { useMemo, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/profit-ui";
import { saveScoringWeights } from "@/lib/fitness/scoring-actions";
import type { ScoreWeights } from "@/lib/fitness/scoring";
import { cn } from "@/lib/fitness/cn";

export interface TunerExercise {
  id: string;
  name: string;
  progression: number;
  preference: number;
  effectiveness: number;
  bestE1rmKg: number;
  totalSets: number;
  primaryMuscles: string[];
}

export function ScoringTuner({
  exercises,
  initialWeights,
}: {
  exercises: TunerExercise[];
  initialWeights: ScoreWeights;
}) {
  const [w, setW] = useState(initialWeights);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const sum = w.progression + w.preference + w.effectiveness || 1;
  const norm = {
    progression: w.progression / sum,
    preference: w.preference / sum,
    effectiveness: w.effectiveness / sum,
  };

  const ranked = useMemo(() => {
    return exercises
      .map((e) => ({
        ...e,
        composite:
          norm.progression * e.progression +
          norm.preference * e.preference +
          norm.effectiveness * e.effectiveness,
      }))
      .sort((a, b) => b.composite - a.composite);
  }, [exercises, norm.progression, norm.preference, norm.effectiveness]);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveScoringWeights(w);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Drag to change how much each signal counts toward an exercise&apos;s score. The ranking
          below updates instantly. Save to apply it to your workout suggestions.
        </p>
        <Slider
          label="Progression"
          hint="How reliably you add load over time"
          value={w.progression}
          pct={Math.round(norm.progression * 100)}
          onChange={(v) => setW((p) => ({ ...p, progression: v }))}
        />
        <Slider
          label="Preference"
          hint="Your recency-weighted favorites"
          value={w.preference}
          pct={Math.round(norm.preference * 100)}
          onChange={(v) => setW((p) => ({ ...p, preference: v }))}
        />
        <Slider
          label="Effectiveness"
          hint="Training stimulus delivered"
          value={w.effectiveness}
          pct={Math.round(norm.effectiveness * 100)}
          onChange={(v) => setW((p) => ({ ...p, effectiveness: v }))}
        />
        <button
          onClick={save}
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-[13px] bg-accent py-3.5 font-bold text-accent-foreground shadow-glow active:bg-accent-press disabled:opacity-60 disabled:shadow-none"
        >
          {saved ? (
            <>
              <Check size={18} /> Saved
            </>
          ) : pending ? (
            "Saving…"
          ) : (
            "Save & apply to suggestions"
          )}
        </button>
      </Card>

      <SectionTitle>Ranked · live</SectionTitle>
      <div className="flex flex-col gap-2">
        {ranked.map((e, i) => {
          const top = i === 0;
          return (
            <div
              key={e.id}
              className={cn(
                "flex items-center gap-3 rounded-[16px] border bg-surface p-3.5",
                top ? "border-accent/[0.28]" : "border-border",
              )}
            >
              <div className="flex flex-col items-center">
                <span className="font-mono text-[11px] text-muted">#{i + 1}</span>
                <span
                  className={cn(
                    "font-mono text-[30px] font-medium leading-none",
                    top ? "text-accent" : "text-foreground",
                  )}
                >
                  {Math.round(e.composite)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{e.name}</p>
                <p className="mt-px mb-2 truncate text-[11px] text-muted">
                  {e.totalSets} sets · best e1RM {Math.round(e.bestE1rmKg)}kg
                </p>
                <div className="flex gap-1.5">
                  <SubScore label="PRG" value={e.progression} top={top} />
                  <SubScore label="PRF" value={e.preference} top={top} />
                  <SubScore label="EFF" value={e.effectiveness} top={top} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Slider({
  label,
  hint,
  value,
  pct,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  pct: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="font-mono text-[13px] text-accent" title={`${pct}% of total`}>
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, var(--accent) ${value * 100}%, var(--surface-2) ${value * 100}%)`,
        }}
      />
      <span className="text-[11px] text-muted">{hint}</span>
    </div>
  );
}

function SubScore({ label, value, top }: { label: string; value: number; top: boolean }) {
  return (
    <div className="flex-1">
      <div className="mb-1 text-[8px] text-muted">{label}</div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: top ? "var(--accent)" : "#5a626c",
          }}
        />
      </div>
    </div>
  );
}
