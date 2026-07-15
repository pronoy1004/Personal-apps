"use client";

import { useState, useTransition } from "react";
import { updatePreferences } from "@/lib/fitness/profile-actions";
import type { AppSettings } from "@/lib/fitness/settings-service";
import { cn } from "@/lib/fitness/cn";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [units, setUnits] = useState(settings.units);
  const [goal, setGoal] = useState(settings.goal);
  const [rest, setRest] = useState(settings.restTimer.defaultRestSec);
  const [, startTransition] = useTransition();

  function persist(next: Partial<Parameters<typeof updatePreferences>[0]>) {
    startTransition(() => updatePreferences(next));
  }

  return (
    <div className="flex flex-col gap-4">
      <Row label="Units">
        <Segmented
          options={[
            { v: "kg", l: "kg" },
            { v: "lb", l: "lb" },
          ]}
          value={units}
          onChange={(v) => {
            setUnits(v as typeof units);
            persist({ units: v as typeof units });
          }}
        />
      </Row>

      <Row label="Goal">
        <Segmented
          options={[
            { v: "strength", l: "Strength" },
            { v: "hypertrophy", l: "Hypertrophy" },
            { v: "endurance", l: "Endurance" },
          ]}
          value={goal}
          onChange={(v) => {
            setGoal(v as typeof goal);
            persist({ goal: v as typeof goal });
          }}
        />
      </Row>

      <Row label="Rest timer">
        <Segmented
          options={[60, 90, 120, 150, 180].map((s) => ({ v: String(s), l: `${s}s` }))}
          value={String(rest)}
          onChange={(v) => {
            setRest(Number(v));
            persist({ defaultRestSec: Number(v) });
          }}
        />
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px]">{label}</span>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[10px] bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "flex-1 rounded-[7px] py-2 text-center text-[13px] transition-colors",
            value === o.v
              ? "bg-accent font-semibold text-accent-foreground"
              : "text-muted active:bg-border",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
