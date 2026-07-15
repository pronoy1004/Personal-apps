"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, Plus, Star } from "lucide-react";
import { Sheet } from "@/components/fitness/profit/Sheet";
import { muscleLabel } from "@/lib/fitness/stats-service";

interface PickerExercise {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  score: number | null;
  used: boolean;
  isCustom: boolean;
}

export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickerExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: PickerExercise[]) => setResults(d))
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3">
          <Search size={18} className="text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search 870+ exercises…"
            className="w-full bg-transparent py-2.5 outline-none"
          />
        </div>
        {loading && <p className="text-sm text-muted">Searching…</p>}
        <div className="flex flex-col divide-y divide-border">
          {results.map((ex) => (
            <button
              key={ex.id}
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  onPick(ex.id);
                  onClose();
                })
              }
              className="flex items-center gap-3 py-3 text-left active:opacity-60"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {ex.name}
                  {ex.used && <Star size={13} className="shrink-0 fill-accent text-accent" />}
                </p>
                <p className="truncate text-xs text-muted">
                  {ex.primaryMuscles.map(muscleLabel).join(", ") || "—"}
                  {ex.equipment ? ` · ${ex.equipment}` : ""}
                </p>
              </div>
              <Plus size={20} className="shrink-0 text-accent" />
            </button>
          ))}
          {!loading && results.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">No matches.</p>
          )}
        </div>
      </div>
    </Sheet>
  );
}
