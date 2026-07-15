import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import FitnessNav from "@/components/fitness/FitnessNav";
import { listHistory } from "@/lib/fitness/history-service";
import { Card, EmptyState, Pill } from "@/components/ui/profit-ui";
import { fmtDate, fmtRelative } from "@/lib/fitness/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const items = await listHistory(60);

  return (
    <AppLayout>
      <FitnessNav />
      <div className="flex flex-col gap-4 py-1">
        <h1 className="text-2xl font-extrabold tracking-tight">History</h1>
        {items.length === 0 ? (
          <EmptyState title="No workouts yet" subtitle="Finished workouts will show up here." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((w) => (
              <Link key={w.id} href={`/fitness/history/${w.id}`}>
                <Card className="active:bg-surface-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{fmtDate(w.performedAt)}</p>
                      {w.source === "fitbod-import" && (
                        <Pill className="text-[10px]">imported</Pill>
                      )}
                    </div>
                    <span className="text-xs text-muted">{fmtRelative(w.performedAt)}</span>
                  </div>
                  <p className="mt-1 mb-2.5 truncate text-xs text-muted">
                    {w.exerciseNames.slice(0, 4).join(" · ")}
                    {w.exerciseNames.length > 4 ? ` +${w.exerciseNames.length - 4}` : ""}
                  </p>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-[#9aa3ad]">
                      {w.workingSets} sets
                    </span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent">
                      {(w.volumeKg / 1000).toFixed(1)}t
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
