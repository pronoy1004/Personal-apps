"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Card, Pill } from "@/components/ui/profit-ui";
import { MUSCLE_GROUPS } from "@/lib/fitness/recovery";
import { muscleLabel } from "@/lib/fitness/stats-service";
import { setMuscleTags } from "@/lib/fitness/scoring-actions";
import type { TaggableExercise } from "@/lib/fitness/exercise-admin";
import { cn } from "@/lib/fitness/cn";

export function MuscleTagger({ exercises }: { exercises: TaggableExercise[] }) {
  const [items, setItems] = useState(exercises);

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-1 py-10 text-center">
        <Check className="text-good" />
        <p className="font-medium">All exercises are tagged</p>
        <p className="text-sm text-muted">Every trained movement feeds the recovery model.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((ex) => (
        <TagRow
          key={ex.id}
          exercise={ex}
          onSaved={() => setItems((prev) => prev.filter((e) => e.id !== ex.id))}
        />
      ))}
    </div>
  );
}

function TagRow({
  exercise,
  onSaved,
}: {
  exercise: TaggableExercise;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [primary, setPrimary] = useState<string[]>(exercise.primaryMuscles);
  const [secondary, setSecondary] = useState<string[]>(exercise.secondaryMuscles);
  const [pending, startTransition] = useTransition();

  function toggle(list: string[], setList: (v: string[]) => void, m: string) {
    setList(list.includes(m) ? list.filter((x) => x !== m) : [...list, m]);
  }

  function save() {
    startTransition(async () => {
      await setMuscleTags(
        exercise.id,
        primary,
        secondary.filter((m) => !primary.includes(m)),
      );
      onSaved();
    });
  }

  return (
    <Card className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{exercise.name}</p>
          <p className="text-xs text-muted">
            {exercise.totalSets} sets {exercise.isCustom && "· custom"}
          </p>
        </div>
        <ChevronDown
          size={20}
          className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3 pt-1">
          <MusclePicker
            label="Primary"
            selected={primary}
            tone="accent"
            onToggle={(m) => toggle(primary, setPrimary, m)}
          />
          <MusclePicker
            label="Secondary"
            selected={secondary}
            tone="default"
            onToggle={(m) => toggle(secondary, setSecondary, m)}
          />
          <button
            onClick={save}
            disabled={pending || primary.length === 0}
            className="rounded-xl bg-accent py-2.5 font-semibold text-accent-foreground active:bg-accent-press disabled:opacity-50"
          >
            {pending ? "Saving…" : primary.length === 0 ? "Pick a primary muscle" : "Save tags"}
          </button>
        </div>
      )}
    </Card>
  );
}

function MusclePicker({
  label,
  selected,
  tone,
  onToggle,
}: {
  label: string;
  selected: string[];
  tone: "accent" | "default";
  onToggle: (m: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_GROUPS.map((m) => {
          const on = selected.includes(m);
          return (
            <button key={m} onClick={() => onToggle(m)}>
              <Pill tone={on ? tone : "default"} className={cn(!on && "opacity-60")}>
                {muscleLabel(m)}
              </Pill>
            </button>
          );
        })}
      </div>
    </div>
  );
}
