import Link from "next/link";
import { Dumbbell, Sparkles, ChevronRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FitnessNav from "@/components/fitness/FitnessNav";
import { prisma } from "@/lib/fitness/prisma";
import { startEmptyWorkout, startSuggestedWorkout } from "@/lib/fitness/workout-actions";
import { SectionTitle } from "@/components/ui/profit-ui";
import { fmtRelative } from "@/lib/fitness/format";

export const dynamic = "force-dynamic";

export default async function WorkoutStartPage() {
  const inProgress = await prisma.workout.findFirst({
    where: { finishedAt: null, source: "manual" },
    orderBy: { performedAt: "desc" },
    include: { _count: { select: { sets: true } } },
  });

  return (
    <AppLayout>
      <FitnessNav />
      <div className="flex flex-col gap-4 py-1">
        <h1 className="text-[27px] font-extrabold tracking-tight">Start a workout</h1>

        {inProgress && (
          <Link
            href={`/fitness/workout/${inProgress.id}`}
            className="flex items-center gap-3.5 rounded-[18px] border border-border bg-surface p-4 active:bg-surface-2"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-good/[0.13]">
              <span className="h-2.5 w-2.5 rounded-full bg-good shadow-[0_0_10px_var(--good)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.1em] text-good">In progress</p>
              <p className="mt-0.5 font-bold">{inProgress._count.sets} sets logged</p>
              <p className="mt-px text-xs text-muted">Started {fmtRelative(inProgress.performedAt)}</p>
            </div>
            <span className="rounded-[11px] border border-[#2a2f37] bg-surface-2 px-3.5 py-2 text-[13px] font-semibold">
              Resume
            </span>
          </Link>
        )}

        <SectionTitle className="mt-1">New session</SectionTitle>

        <form action={startSuggestedWorkout}>
          <button
            className="w-full rounded-[20px] border border-accent/[0.28] p-[18px] text-left"
            style={{
              background: "linear-gradient(180deg, rgba(43,229,255,0.07), var(--surface) 45%)",
              boxShadow: "0 0 40px -18px rgba(43,229,255,0.4)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent text-accent-foreground shadow-glow">
                <Sparkles size={24} />
              </div>
              <ChevronRight size={20} className="text-muted" />
            </div>
            <p className="text-lg font-bold">Suggested workout</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#9aa3ad]">
              Auto-built from your recovery and exercise scores.
            </p>
          </button>
        </form>

        <form action={startEmptyWorkout}>
          <button className="w-full rounded-[20px] border border-border bg-surface p-[18px] text-left active:bg-surface-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-border bg-surface-2 text-foreground">
                <Dumbbell size={24} />
              </div>
              <ChevronRight size={20} className="text-muted" />
            </div>
            <p className="text-lg font-bold">Empty workout</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#9aa3ad]">
              Build it yourself — add exercises as you go.
            </p>
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
