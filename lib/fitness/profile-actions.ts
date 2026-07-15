"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { signOut } from "@/auth";
import type { Units } from "./format";
import type { Goal } from "./prescription";

export async function updatePreferences(data: {
  units?: Units;
  goal?: Goal;
  defaultRestSec?: number;
  warmupRestSec?: number;
}) {
  const current = await prisma.setting.findUnique({ where: { id: 1 } });
  const rest =
    current && typeof current.restTimer === "string"
      ? JSON.parse(current.restTimer)
      : { defaultRestSec: 120, warmupRestSec: 60 };

  await prisma.setting.update({
    where: { id: 1 },
    data: {
      ...(data.units ? { units: data.units } : {}),
      ...(data.goal ? { goal: data.goal } : {}),
      restTimer: JSON.stringify({
        defaultRestSec: data.defaultRestSec ?? rest.defaultRestSec,
        warmupRestSec: data.warmupRestSec ?? rest.warmupRestSec,
      }),
    },
  });
  revalidatePath("/fitness/profile");
  revalidatePath("/fitness");
}

export async function logBodyWeight(formData: FormData) {
  const weightKg = parseFloat(String(formData.get("weightKg") ?? ""));
  if (Number.isFinite(weightKg) && weightKg > 0) {
    await prisma.bodyMetric.create({
      data: { measuredAt: new Date(), weightKg, measurements: JSON.stringify({}) },
    });
  }
  revalidatePath("/fitness/profile");
}

export async function deleteBodyMetric(id: string) {
  await prisma.bodyMetric.delete({ where: { id } });
  revalidatePath("/fitness/profile");
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
