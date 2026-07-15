import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { getHistoryDetail } from "@/lib/fitness/history-service";
import { Card } from "@/components/ui/profit-ui";
import { muscleLabel } from "@/lib/fitness/stats-service";
import { fmtDate, fmtWeight } from "@/lib/fitness/format";

export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const w = await getHistoryDetail(id);
  if (!w) notFound();

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/fitness/history"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-border bg-surface-2 text-foreground active:bg-border"
            aria-label="Back"
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </Link>
          <div>
            <h1 className="text-base font-bold leading-tight">{fmtDate(w.performedAt)}</h1>
            {w.note && <p className="mt-px text-xs text-muted">{w.note}</p>}
          </div>
        </div>

        {w.exercises.map((ex) => (
          <Card key={ex.name} className="flex flex-col gap-2.5">
            <div>
              <p className="font-bold">{ex.name}</p>
              <p className="text-xs text-muted">{ex.primaryMuscles.map(muscleLabel).join(", ") || "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              {ex.sets.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[10px] bg-surface-2 px-3 py-2 text-sm"
                >
                  <span className={s.isWarmup ? "text-warn" : "text-muted"}>
                    {s.isWarmup ? "Warm-up" : `Set ${i + 1}`}
                  </span>
                  <span className="font-mono">
                    {s.weightKg > 0 ? `${fmtWeight(s.weightKg)} × ${s.reps}` : `${s.reps} reps`}
                    {s.multiplier > 1 ? ` (×${s.multiplier})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
