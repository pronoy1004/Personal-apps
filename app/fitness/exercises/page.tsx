import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { listUntaggedExercises } from "@/lib/fitness/exercise-admin";
import { MuscleTagger } from "@/components/fitness/profit/exercises/MuscleTagger";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const untagged = await listUntaggedExercises();

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/fitness/profile" className="rounded-lg p-1 text-muted active:bg-surface-2">
            <ChevronLeft size={22} />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">Tag exercises</h1>
            <p className="text-xs text-muted">
              {untagged.length} trained exercise{untagged.length === 1 ? "" : "s"} need muscle tags
            </p>
          </div>
        </div>
        <p className="text-sm text-muted">
          These came from your Fitbod import without a catalog match. Tagging their muscles lets them
          feed the recovery model and workout suggestions.
        </p>
        <MuscleTagger exercises={untagged} />
      </div>
    </AppLayout>
  );
}
