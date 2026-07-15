"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, SectionTitle } from "@/components/ui/profit-ui";
import { muscleLabel } from "@/lib/fitness/stats-service";
import type {
  WeeklyVolumePoint,
  MuscleVolumePoint,
  E1rmSeries,
  BodyweightPoint,
} from "@/lib/fitness/chart-service";

const COLORS = {
  accent: "#2be5ff",
  good: "#34e0a1",
  muted: "#757e8a",
  grid: "#181b20",
  surface: "#0e1013",
};

export function TrendsView({
  weekly,
  muscles,
  e1rm,
  bodyweight,
}: {
  weekly: WeeklyVolumePoint[];
  muscles: MuscleVolumePoint[];
  e1rm: E1rmSeries[];
  bodyweight: BodyweightPoint[];
}) {
  const [selected, setSelected] = useState(e1rm[0]?.exerciseId ?? "");
  const series = e1rm.find((s) => s.exerciseId === selected) ?? e1rm[0];

  const muscleData = muscles.map((m) => ({ name: muscleLabel(m.muscle), volume: m.volume }));
  const lineData = series?.points.map((p) => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    e1rm: p.e1rm,
  }));

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <SectionTitle>Weekly volume (tonnes)</SectionTitle>
        <Card className="p-2">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekly} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="week" tick={{ fill: COLORS.muted, fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} width={42} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(43,229,255,0.08)" }}
                formatter={(v) => [`${v}t`, "Volume"]}
              />
              <Bar dataKey="volume" radius={[3, 3, 0, 0]}>
                {weekly.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === weekly.length - 1 ? COLORS.accent : "rgba(43,229,255,0.32)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {series && lineData && lineData.length > 1 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionTitle>Estimated 1RM trend</SectionTitle>
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
          >
            {e1rm.map((s) => (
              <option key={s.exerciseId} value={s.exerciseId}>
                {s.name}
              </option>
            ))}
          </select>
          <Card className="p-2">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} width={42} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}kg`, "e1RM"]} />
                <Line
                  type="monotone"
                  dataKey="e1rm"
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: COLORS.accent }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionTitle>Muscle split — last 90 days (tonnes)</SectionTitle>
        <Card className="p-2">
          <ResponsiveContainer width="100%" height={Math.max(180, muscleData.length * 24)}>
            <BarChart
              layout="vertical"
              data={muscleData}
              margin={{ top: 4, right: 12, left: 30, bottom: 4 }}
            >
              <CartesianGrid stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: COLORS.muted, fontSize: 10 }}
                width={64}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(43,229,255,0.08)" }}
                formatter={(v) => [`${v}t`, "Volume"]}
              />
              <Bar dataKey="volume" fill={COLORS.accent} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {bodyweight.length > 1 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Bodyweight</SectionTitle>
          <Card className="p-2">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart
                data={bodyweight.map((b) => ({
                  date: new Date(b.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                  weight: b.weight,
                }))}
                margin={{ top: 8, right: 10, left: -12, bottom: 0 }}
              >
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 10 }} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} width={42} domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}kg`, "Weight"]} />
                <Line type="monotone" dataKey="weight" stroke={COLORS.good} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </section>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.grid}`,
  borderRadius: 10,
  fontSize: 12,
  color: "#edf1f5",
};
