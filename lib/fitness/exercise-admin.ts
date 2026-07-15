import { prisma } from "./prisma";
import { asStringArray } from "./json";

export interface TaggableExercise {
  id: string;
  name: string;
  isCustom: boolean;
  totalSets: number;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

/**
 * Exercises that have been trained but are missing muscle tags (custom imports,
 * mostly). These don't feed the recovery model until tagged.
 */
export async function listUntaggedExercises(): Promise<TaggableExercise[]> {
  const exercises = await prisma.exercise.findMany({
    where: { score: { is: { totalSets: { gt: 0 } } }, isCardio: false },
    select: {
      id: true,
      name: true,
      isCustom: true,
      primaryMuscles: true,
      secondaryMuscles: true,
      score: { select: { totalSets: true } },
    },
  });

  return exercises
    .map((e) => ({
      id: e.id,
      name: e.name,
      isCustom: e.isCustom,
      totalSets: e.score?.totalSets ?? 0,
      primaryMuscles: asStringArray(e.primaryMuscles),
      secondaryMuscles: asStringArray(e.secondaryMuscles),
    }))
    .filter((e) => e.primaryMuscles.length === 0)
    .sort((a, b) => b.totalSets - a.totalSets);
}
