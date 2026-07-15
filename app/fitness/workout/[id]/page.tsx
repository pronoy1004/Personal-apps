import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { getLoggerWorkout } from "@/lib/fitness/workout-query";
import { getSettings } from "@/lib/fitness/settings-service";
import { LoggerClient } from "@/components/fitness/profit/logger/LoggerClient";
import { fmtDate } from "@/lib/fitness/format";

export const dynamic = "force-dynamic";

export default async function WorkoutLoggerPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [workout, settings] = await Promise.all([getLoggerWorkout(id), getSettings()]);
  if (!workout) notFound();

  return (
    <AppLayout>
      <div className="py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/fitness"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-border bg-surface-2 text-foreground active:bg-border"
            aria-label="Back"
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight">
              {workout.finishedAt ? "Workout" : "Active workout"}
            </h1>
            <p className="mt-px truncate text-xs text-muted">
              {fmtDate(workout.performedAt)}
              {workout.note ? <span className="text-accent"> · {workout.note}</span> : ""}
            </p>
          </div>
          {!workout.finishedAt && (
            <div className="flex items-center gap-1.5 font-mono text-[12px] text-muted">
              <span className="h-[7px] w-[7px] rounded-full bg-good animate-pf-pulse" />
              Live
            </div>
          )}
        </div>

        <LoggerClient
          workout={workout}
          restSeconds={settings.restTimer.defaultRestSec}
          warmupRestSeconds={settings.restTimer.warmupRestSec}
        />
      </div>
    </AppLayout>
  );
}
