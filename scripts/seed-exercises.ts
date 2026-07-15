// Seeds the Exercise catalog from data/free-exercise-db.json (public domain).
// Idempotent: upserts by slug. Run with `npm run seed:exercises`.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/fitness/slug";

const prisma = new PrismaClient();

const IMAGE_BASE =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises";

interface RawExercise {
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string | null;
  images: string[];
  id: string;
}

function incrementForEquipment(equipment: string | null): number {
  switch (equipment) {
    case "barbell":
    case "e-z curl bar":
      return 2.5;
    case "dumbbell":
    case "kettlebells":
      return 2; // per-hand step
    case "cable":
    case "machine":
      return 2.5;
    default:
      return 2.5;
  }
}

async function main() {
  const file = join(process.cwd(), "data", "free-exercise-db.json");
  const raw: RawExercise[] = JSON.parse(readFileSync(file, "utf8"));
  console.log(`Loaded ${raw.length} exercises from dataset.`);

  let created = 0;
  for (const ex of raw) {
    const slug = slugify(ex.name);
    const imageUrls = (ex.images ?? []).map((p) => `${IMAGE_BASE}/${p}`);
    const data = {
      name: ex.name,
      slug,
      aliases: JSON.stringify([]),
      primaryMuscles: JSON.stringify(ex.primaryMuscles ?? []),
      secondaryMuscles: JSON.stringify(ex.secondaryMuscles ?? []),
      equipment: ex.equipment || null,
      mechanic: ex.mechanic || null,
      force: ex.force || null,
      category: ex.category || null,
      instructions: JSON.stringify(ex.instructions ?? []),
      imageUrls: JSON.stringify(imageUrls),
      isCustom: false,
      isCardio: ex.category === "cardio",
      defaultIncrementKg: incrementForEquipment(ex.equipment),
    };
    await prisma.exercise.upsert({
      where: { slug },
      create: data,
      update: data,
    });
    created++;
  }
  console.log(`Seeded ${created} exercises.`);

  // Ensure the single settings row exists with sensible defaults.
  await prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      units: "kg",
      availableEquipment: JSON.stringify([]),
      goal: "hypertrophy",
      restTimer: JSON.stringify({ defaultRestSec: 120, warmupRestSec: 60 }),
      scoringWeights: JSON.stringify({
        progression: 0.4,
        preference: 0.3,
        effectiveness: 0.3,
      }),
    },
    update: {},
  });
  console.log("Settings row ready.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
