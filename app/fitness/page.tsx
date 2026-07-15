import Link from "next/link";
import { ArrowRight, Flame, TrendingUp, Calendar, User } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FitnessNav from "@/components/fitness/FitnessNav";
import { SectionTitle, RadialGauge, Pill } from "@/components/ui/profit-ui";
import { getDashboardStats, muscleLabel } from "@/lib/fitness/stats-service";
import { generateSuggestion } from "@/lib/fitness/suggestion-service";
import { startSuggestedWorkout } from "@/lib/fitness/workout-actions";
import { fmtRelative, fmtWeight } from "@/lib/fitness/format";

export const dynamic = "force-dynamic";

export default async function FitnessDashboardPage() {
  const [stats, suggestion] = await Promise.all([getDashboardStats(), generateSuggestion()]);
  const topRecovery = [...suggestion.recovery]
    .sort((a, b) => a.freshness - b.freshness)
    .slice(0, 4);

  return (
    <AppLayout>
      <FitnessNav />
      <div className="flex flex-col gap-5 py-1">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent text-accent-foreground shadow-glow">
              <Flame size={20} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-[13px] text-muted">{greeting()}, Pronoy</p>
              <h1 className="text-[22px] font-extrabold tracking-tight">Pro-Fit</h1>
            </div>
          </div>
          <Link
            href="/fitness/profile"
            className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-border bg-surface-2 text-muted"
            aria-label="Profile"
          >
            <User size={19} />
          </Link>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5">
          <Stat icon={<Calendar size={13} />} label="Week" value={`${stats.workoutsThisWeek}`} sub="workouts" />
          <Stat icon={<TrendingUp size={13} />} label="Volume" value={`${(stats.weekVolumeKg / 1000).toFixed(1)}t`} sub="7-day" />
          <Stat icon={<Flame size={13} />} label="Streak" value={`${stats.streakWeeks}`} sub="weeks" />
        </div>

        {/* Suggested workout — hero */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <SectionTitle>Suggested today</SectionTitle>
            {stats.lastWorkoutAt && (
              <span className="text-xs text-muted">Last: {fmtRelative(stats.lastWorkoutAt)}</span>
            )}
          </div>
          <div
            className="flex flex-col gap-3 rounded-[20px] border border-accent/[0.28] p-4"
            style={{
              background: "linear-gradient(180deg, rgba(43,229,255,0.06), var(--surface) 38%)",
              boxShadow: "0 0 40px -18px rgba(43,229,255,0.4)",
            }}
          >
            <div className="flex flex-wrap gap-1.5">
              {suggestion.targetMuscles.map((m) => (
                <Pill key={m} tone="accent">
                  {muscleLabel(m)}
                </Pill>
              ))}
            </div>
            <div className="flex flex-col">
              {suggestion.exercises.slice(0, 5).map((e, i, arr) => (
                <div
                  key={e.exerciseId}
                  className="flex items-center justify-between py-2"
                  style={i < arr.length - 1 ? { borderBottom: "1px solid #1a1e24" } : undefined}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="mt-px text-[11px] text-muted">{muscleLabel(e.targetMuscle)}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[13px] font-medium text-accent">
                    {e.prescription.sets}×{e.prescription.reps}
                    {e.prescription.weightKg > 0 && ` · ${fmtWeight(e.prescription.weightKg)}`}
                  </span>
                </div>
              ))}
              {suggestion.exercises.length === 0 && (
                <p className="py-3 text-sm text-muted">
                  Log a few workouts and suggestions will appear here.
                </p>
              )}
            </div>
            <form action={startSuggestedWorkout}>
              <button className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-accent py-3.5 font-bold text-accent-foreground shadow-glow active:bg-accent-press">
                Start suggested workout <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </form>
            <Link href="/fitness/workout" className="text-center text-[13px] text-muted">
              or start an empty workout
            </Link>
          </div>
        </section>

        {/* Recovery */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Muscle recovery</SectionTitle>
          {topRecovery.length > 0 ? (
            <div className="flex justify-between">
              {topRecovery.map((r) => (
                <RadialGauge key={r.muscle} value={r.freshness} label={muscleLabel(r.muscle)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Recovery readiness appears once you log workouts.</p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[15px] border border-border bg-surface p-3">
      <span className="flex items-center gap-1.5 text-[11px] text-muted">
        {icon}
        {label}
      </span>
      <div className="mt-2 font-mono text-[21px] font-medium leading-none">{value}</div>
      <div className="mt-1 text-[10px] text-muted">{sub}</div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
