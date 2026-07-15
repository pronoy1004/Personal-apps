"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { generateSuggestion, lastWorkingSetsFor } from "./suggestion-service";
import { recomputeAndPersist } from "./score-service";

/** Start a new empty workout and go to its logger. */
export async function startEmptyWorkout() {
  const w = await prisma.workout.create({ data: { performedAt: new Date(), source: "manual" } });
  redirect(`/fitness/workout/${w.id}`);
}

/** Start a workout pre-filled with today's suggested exercises (as targets). */
export async function startSuggestedWorkout() {
  const suggestion = await generateSuggestion();
  const w = await prisma.workout.create({
    data: {
      performedAt: new Date(),
      source: "manual",
      note: suggestion.targetMuscles.length
        ? `Suggested: ${suggestion.targetMuscles.join(", ")}`
        : null,
    },
  });
  // Seed one target set per suggested exercise (completed=false) so the logger
  // shows the recommended weight/reps to beat.
  let order = 0;
  for (const ex of suggestion.exercises) {
    for (let i = 0; i < ex.prescription.sets; i++) {
      await prisma.workoutSet.create({
        data: {
          workoutId: w.id,
          exerciseId: ex.exerciseId,
          order: order++,
          reps: ex.prescription.reps,
          weightKg: ex.prescription.weightKg,
          multiplier: ex.prescription.multiplier,
          isWarmup: false,
          completed: false,
        },
      });
    }
  }
  redirect(`/fitness/workout/${w.id}`);
}

/** Add an exercise to a workout, pre-filling from last session if available. */
export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const last = await lastWorkingSetsFor(exerciseId);
  const maxOrder = await prisma.workoutSet.aggregate({
    where: { workoutId },
    _max: { order: true },
  });
  let order = (maxOrder._max.order ?? -1) + 1;
  const template = last.length > 0 ? last : [{ weightKg: 0, reps: 8, multiplier: 1, isWarmup: false }];
  for (const s of template) {
    await prisma.workoutSet.create({
      data: {
        workoutId,
        exerciseId,
        order: order++,
        reps: s.reps,
        weightKg: s.weightKg,
        multiplier: s.multiplier,
        isWarmup: false,
        completed: false,
      },
    });
  }
  revalidatePath(`/fitness/workout/${workoutId}`);
}

export async function addSet(workoutId: string, exerciseId: string, isWarmup = false) {
  // Copy the last set of this exercise in the workout as a starting point.
  const prev = await prisma.workoutSet.findFirst({
    where: { workoutId, exerciseId },
    orderBy: { order: "desc" },
  });
  const maxOrder = await prisma.workoutSet.aggregate({
    where: { workoutId },
    _max: { order: true },
  });
  await prisma.workoutSet.create({
    data: {
      workoutId,
      exerciseId,
      order: (maxOrder._max.order ?? -1) + 1,
      reps: prev?.reps ?? 8,
      weightKg: prev?.weightKg ?? 0,
      multiplier: prev?.multiplier ?? 1,
      isWarmup,
      completed: false,
    },
  });
  revalidatePath(`/fitness/workout/${workoutId}`);
}

export async function updateSet(
  setId: string,
  data: { reps?: number; weightKg?: number; completed?: boolean; isWarmup?: boolean; multiplier?: number },
) {
  const set = await prisma.workoutSet.update({ where: { id: setId }, data });
  revalidatePath(`/fitness/workout/${set.workoutId}`);
}

export async function deleteSet(setId: string) {
  const set = await prisma.workoutSet.delete({ where: { id: setId } });
  revalidatePath(`/fitness/workout/${set.workoutId}`);
}

export async function deleteExerciseFromWorkout(workoutId: string, exerciseId: string) {
  await prisma.workoutSet.deleteMany({ where: { workoutId, exerciseId } });
  revalidatePath(`/fitness/workout/${workoutId}`);
}

export async function finishWorkout(workoutId: string) {
  // Remove any never-completed target sets, then close out the session.
  await prisma.workoutSet.deleteMany({ where: { workoutId, completed: false } });
  const remaining = await prisma.workoutSet.count({ where: { workoutId } });
  if (remaining === 0) {
    await prisma.workout.delete({ where: { id: workoutId } });
  } else {
    await prisma.workout.update({ where: { id: workoutId }, data: { finishedAt: new Date() } });
    await recomputeAndPersist();
  }
  revalidatePath("/fitness");
  revalidatePath("/fitness/history");
  redirect("/fitness/history");
}

export async function discardWorkout(workoutId: string) {
  await prisma.workout.delete({ where: { id: workoutId } });
  revalidatePath("/fitness");
  redirect("/fitness");
}
