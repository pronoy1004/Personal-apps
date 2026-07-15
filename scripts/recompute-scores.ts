// Recomputes and persists all exercise scores. Run after an import or to refresh.
//   npm run score:recompute
import { recomputeAndPersist } from "../lib/fitness/score-service";
import { computeAllScores } from "../lib/fitness/score-service";
import { prisma } from "../lib/fitness/prisma";

async function main() {
  const n = await recomputeAndPersist();
  console.log(`Recomputed ${n} exercise scores.`);

  // Print a quick top-15 preview against the real data.
  const results = await computeAllScores();
  const byComposite = results
    .filter((r) => r.totalSets > 0)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 15);
  const names = new Map(
    (await prisma.exercise.findMany({ select: { id: true, name: true } })).map((e) => [
      e.id,
      e.name,
    ]),
  );
  console.log("\nTop 15 by composite score:");
  console.log("  comp  prog  pref  effv  sets  bestE1RM  name");
  for (const r of byComposite) {
    console.log(
      `  ${pad(r.compositeScore)} ${pad(r.progressionScore)} ${pad(r.preferenceScore)} ${pad(
        r.effectivenessScore,
      )} ${String(r.totalSets).padStart(4)}  ${String(Math.round(r.bestE1rmKg)).padStart(
        6,
      )}kg  ${names.get(r.exerciseId)}`,
    );
  }
}

function pad(n: number): string {
  return n.toFixed(0).padStart(4);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
