"use client";

import { useState } from "react";
import { Sheet } from "@/components/fitness/profit/Sheet";
import { computePlates, DEFAULT_BAR_KG } from "@/lib/fitness/plates";

export function PlateCalculator({
  open,
  onClose,
  initialKg,
}: {
  open: boolean;
  onClose: () => void;
  initialKg: number;
}) {
  const [target, setTarget] = useState(initialKg || 60);
  const [bar, setBar] = useState(DEFAULT_BAR_KG);
  const result = computePlates(target, bar);

  return (
    <Sheet open={open} onClose={onClose} title="Plate calculator">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target (kg)">
            <input
              type="number"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-lg outline-none focus:border-accent"
            />
          </Field>
          <Field label="Bar (kg)">
            <select
              value={bar}
              onChange={(e) => setBar(parseFloat(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-lg outline-none focus:border-accent"
            >
              {[20, 15, 10, 0].map((b) => (
                <option key={b} value={b}>
                  {b === 0 ? "None" : `${b}kg`}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm text-muted">Per side:</p>
          {result.perSide.length === 0 ? (
            <p className="text-sm text-muted">Just the bar.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.perSide.map((p) => (
                <span
                  key={p.plate}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium"
                >
                  {p.count} × {p.plate}kg
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
          Loadable: <span className="font-semibold text-accent">{result.achievable}kg</span>
          {result.leftover > 0 && (
            <span className="text-muted"> (−{result.leftover}kg short of target)</span>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
