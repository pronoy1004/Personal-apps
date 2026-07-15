"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2, MoreVertical, Flame } from "lucide-react";
import type { LoggerWorkout, LoggerExercise, LoggerSet } from "@/lib/fitness/workout-query";
import {
  addExerciseToWorkout,
  addSet,
  updateSet,
  deleteSet,
  deleteExerciseFromWorkout,
  finishWorkout,
  discardWorkout,
} from "@/lib/fitness/workout-actions";
import { muscleLabel } from "@/lib/fitness/stats-service";
import { ExercisePicker } from "./ExercisePicker";
import { PlateCalculator } from "./PlateCalculator";
import { RestTimer, triggerRest } from "./RestTimer";
import { cn } from "@/lib/fitness/cn";

export function LoggerClient({
  workout,
  restSeconds,
  warmupRestSeconds,
}: {
  workout: LoggerWorkout;
  restSeconds: number;
  warmupRestSeconds: number;
}) {
  const [exercises, setExercises] = useState<LoggerExercise[]>(workout.exercises);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [plateFor, setPlateFor] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function patchSet(exId: string, setId: string, patch: Partial<LoggerSet>) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId !== exId
          ? ex
          : { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) },
      ),
    );
    startTransition(() => {
      updateSet(setId, patch);
    });
  }

  function completeSet(ex: LoggerExercise, set: LoggerSet) {
    const next = !set.completed;
    patchSet(ex.exerciseId, set.id, { completed: next });
    if (next) triggerRest(set.isWarmup ? warmupRestSeconds : restSeconds);
  }

  function removeSet(exId: string, setId: string) {
    setExercises((prev) =>
      prev
        .map((ex) =>
          ex.exerciseId !== exId ? ex : { ...ex, sets: ex.sets.filter((s) => s.id !== setId) },
        )
        .filter((ex) => ex.sets.length > 0),
    );
    startTransition(() => {
      deleteSet(setId);
    });
  }

  return (
    <div className="flex flex-col gap-4 py-3">
      {exercises.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted">
          No exercises yet. Add your first one below.
        </div>
      )}

      {exercises.map((ex) => (
        <div key={ex.exerciseId} className="rounded-[18px] border border-border bg-surface">
          <div className="flex items-start justify-between gap-2 border-b border-[#1a1e24] p-3.5">
            <div className="min-w-0">
              <p className="truncate font-bold">{ex.name}</p>
              <p className="truncate text-xs text-muted">
                {ex.primaryMuscles.map(muscleLabel).join(", ") || "—"}
                {ex.lastSummary ? ` · last: ${ex.lastSummary}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm(`Remove ${ex.name}?`)) {
                  setExercises((prev) => prev.filter((e) => e.exerciseId !== ex.exerciseId));
                  startTransition(() => deleteExerciseFromWorkout(workout.id, ex.exerciseId));
                }
              }}
              className="shrink-0 rounded-lg p-1.5 text-muted active:bg-surface-2"
              aria-label="Exercise options"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 px-3 pt-2 text-[10px] uppercase tracking-wide text-muted">
            <span>Set</span>
            <span className="text-center">kg</span>
            <span className="text-center">Reps</span>
            <span />
          </div>

          <div className="flex flex-col px-3 pb-2">
            {ex.sets.map((set, i) => {
              const workingIndex =
                ex.sets.slice(0, i + 1).filter((s) => !s.isWarmup).length;
              return (
                <SetRow
                  key={set.id}
                  set={set}
                  label={set.isWarmup ? "W" : String(workingIndex)}
                  increment={ex.defaultIncrementKg}
                  onWeight={(v) => patchSet(ex.exerciseId, set.id, { weightKg: v })}
                  onReps={(v) => patchSet(ex.exerciseId, set.id, { reps: v })}
                  onComplete={() => completeSet(ex, set)}
                  onDelete={() => removeSet(ex.exerciseId, set.id)}
                  onPlate={() => setPlateFor(set.weightKg)}
                />
              );
            })}
          </div>

          <div className="flex gap-2 px-3.5 pb-3 pt-2">
            <SmallBtn onClick={() => addSetLocal(ex, false)}>
              <Plus size={14} /> Set
            </SmallBtn>
            <SmallBtn onClick={() => addSetLocal(ex, true)} tone="warn">
              <Flame size={14} /> Warm-up
            </SmallBtn>
          </div>
        </div>
      ))}

      <button
        onClick={() => setPickerOpen(true)}
        className="flex items-center justify-center gap-2 rounded-[14px] border border-border bg-surface py-3.5 font-semibold active:bg-surface-2"
      >
        <Plus size={18} /> Add exercise
      </button>

      <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
        <form action={finishWorkout.bind(null, workout.id)}>
          <button className="w-full rounded-[14px] bg-accent py-3.5 font-bold text-accent-foreground shadow-glow active:bg-accent-press">
            Finish workout
          </button>
        </form>
        <form
          action={discardWorkout.bind(null, workout.id)}
          onSubmit={(e) => {
            if (!confirm("Discard this workout?")) e.preventDefault();
          }}
        >
          <button className="rounded-[14px] border border-[#2a2024] px-4 py-3.5 text-danger active:bg-surface-2">
            <Trash2 size={18} />
          </button>
        </form>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exerciseId) => addExerciseLocal(exerciseId)}
      />
      <PlateCalculator
        open={plateFor !== null}
        onClose={() => setPlateFor(null)}
        initialKg={plateFor ?? 60}
      />
      <RestTimer defaultSeconds={restSeconds} />
    </div>
  );

  // Optimistic local add helpers reconcile via router refresh after the action.
  function addSetLocal(ex: LoggerExercise, isWarmup: boolean) {
    const prev = ex.sets[ex.sets.length - 1];
    const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
    const newSet: LoggerSet = {
      id: tempId,
      order: (prev?.order ?? -1) + 1,
      reps: prev?.reps ?? 8,
      weightKg: prev?.weightKg ?? 0,
      multiplier: prev?.multiplier ?? 1,
      isWarmup,
      completed: false,
    };
    setExercises((p) =>
      p.map((e) => (e.exerciseId === ex.exerciseId ? { ...e, sets: [...e.sets, newSet] } : e)),
    );
    startTransition(async () => {
      await addSet(workout.id, ex.exerciseId, isWarmup);
    });
  }

  function addExerciseLocal(exerciseId: string) {
    startTransition(async () => {
      await addExerciseToWorkout(workout.id, exerciseId);
      // Reload from server to get the new exercise with proper ids.
      const fresh = await fetch(`/api/workout/${workout.id}`).then((r) => r.json());
      if (fresh?.exercises) setExercises(fresh.exercises);
    });
  }
}

function SetRow({
  set,
  label,
  increment,
  onWeight,
  onReps,
  onComplete,
  onDelete,
  onPlate,
}: {
  set: LoggerSet;
  label: string;
  increment: number;
  onWeight: (v: number) => void;
  onReps: (v: number) => void;
  onComplete: () => void;
  onDelete: () => void;
  onPlate: () => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 border-b border-[#15181d] py-1.5 last:border-0",
        set.completed && "opacity-[0.55]",
      )}
    >
      <button
        onClick={onDelete}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold",
          set.isWarmup ? "bg-warn/15 text-warn" : "bg-surface-2 text-muted",
        )}
        title="Tap to delete set"
      >
        {label}
      </button>

      <Stepper value={set.weightKg} step={increment} onChange={onWeight} onLong={onPlate} dim={set.completed} suffix="" />
      <Stepper value={set.reps} step={1} onChange={(v) => onReps(Math.max(0, Math.round(v)))} dim={set.completed} />

      <button
        onClick={onComplete}
        className={cn(
          "flex h-[34px] w-[34px] items-center justify-center justify-self-end rounded-[10px] border transition-colors",
          set.completed
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-surface-2 text-[#4a525c]",
        )}
        aria-label="Complete set"
      >
        <Check size={17} strokeWidth={3.2} />
      </button>
    </div>
  );
}

function Stepper({
  value,
  step,
  onChange,
  onLong,
  dim = false,
}: {
  value: number;
  step: number;
  onChange: (v: number) => void;
  onLong?: () => void;
  dim?: boolean;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(0, value - step))}
        className={cn(
          "flex h-[34px] w-[30px] items-center justify-center rounded-[9px] bg-surface-2 text-lg active:bg-border",
          dim ? "text-[#5a626c]" : "text-[#9aa3ad]",
        )}
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        defaultValue={Math.round(value * 100) / 100}
        key={value}
        onBlur={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        onDoubleClick={onLong}
        className="w-full min-w-0 rounded-md bg-transparent py-1 text-center font-mono text-[17px] outline-none"
      />
      <button
        onClick={() => onChange(value + step)}
        className={cn(
          "flex h-[34px] w-[30px] items-center justify-center rounded-[9px] bg-surface-2 text-lg active:bg-border",
          dim ? "text-[#5a626c]" : "text-accent",
        )}
      >
        +
      </button>
    </div>
  );
}

function SmallBtn({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "warn";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-surface-2 py-2.5 text-[13px] font-medium active:bg-border",
        tone === "warn" ? "text-warn" : "text-[#9aa3ad]",
      )}
    >
      {children}
    </button>
  );
}
