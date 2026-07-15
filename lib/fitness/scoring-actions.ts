"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { recomputeAndPersist } from "./score-service";
import type { ScoreWeights } from "./scoring";

export async function saveScoringWeights(weights: ScoreWeights) {
  await prisma.setting.update({
    where: { id: 1 },
    data: { scoringWeights: JSON.stringify(weights) },
  });
  await recomputeAndPersist(weights);
  revalidatePath("/fitness/insights");
  revalidatePath("/fitness");
}

export async function setMuscleTags(
  exerciseId: string,
  primaryMuscles: string[],
  secondaryMuscles: string[],
) {
  await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      primaryMuscles: JSON.stringify(primaryMuscles),
      secondaryMuscles: JSON.stringify(secondaryMuscles),
    },
  });
  revalidatePath("/fitness/insights");
}
