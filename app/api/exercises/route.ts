import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/fitness/prisma";
import { asStringArray } from "@/lib/fitness/json";
import { normalize } from "@/lib/fitness/exercise-matcher";

/** Searchable exercise list for the picker. Ranks by composite score. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const muscle = req.nextUrl.searchParams.get("muscle")?.trim() ?? "";

  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      name: true,
      equipment: true,
      primaryMuscles: true,
      isCustom: true,
      isCardio: true,
      score: { select: { compositeScore: true, totalSets: true } },
    },
  });

  const nq = normalize(q);
  let filtered = exercises.filter((e) => {
    const matchesQ = !nq || normalize(e.name).includes(nq);
    const matchesM = !muscle || asStringArray(e.primaryMuscles).includes(muscle);
    return matchesQ && matchesM;
  });

  filtered = filtered.sort((a, b) => {
    const sa = a.score?.compositeScore ?? -1;
    const sb = b.score?.compositeScore ?? -1;
    return sb - sa;
  });

  return NextResponse.json(
    filtered.slice(0, 80).map((e) => ({
      id: e.id,
      name: e.name,
      equipment: e.equipment,
      primaryMuscles: asStringArray(e.primaryMuscles),
      score: e.score?.compositeScore ?? null,
      used: (e.score?.totalSets ?? 0) > 0,
      isCustom: e.isCustom,
    })),
  );
}
