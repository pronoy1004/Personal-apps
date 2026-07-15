// Imports a Fitbod CSV export into the database.
//   npm run import:fitbod -- /path/to/WorkoutExport.csv
// Groups sets by their shared timestamp into Workouts, matches exercise names to
// the catalog, and creates custom Exercises for anything unmatched. Writes a
// reconciliation report to data/import-report.json. Idempotent-ish: clears
// previously imported (source="fitbod-import") workouts before re-importing.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { bestMatch } from "../lib/fitness/exercise-matcher";
import { slugify } from "../lib/fitness/slug";

const prisma = new PrismaClient();
const MATCH_THRESHOLD = 0.5;

interface Row {
  date: string;
  exercise: string;
  reps: number;
  weightKg: number;
  durationS: number;
  distanceM: number;
  incline: number;
  resistance: number;
  isWarmup: boolean;
  note: string;
  multiplier: number;
}

/** Minimal RFC-4180-ish CSV line splitter (handles quoted fields). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** Parse "2026-06-24 13:35:46 +0000" into a Date. */
function parseFitbodDate(s: string): Date {
  const m = s.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s*([+-]\d{4})?$/,
  );
  if (!m) return new Date(s);
  const [, y, mo, d, h, mi, se, tz] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${se}${
    tz ? `${tz.slice(0, 3)}:${tz.slice(3)}` : "Z"
  }`;
  return new Date(iso);
}

function num(v: string): number {
  const n = parseFloat(v.trim());
  return Number.isFinite(n) ? n : 0;
}

async function main() {
  const csvPath = process.argv[2] || join(process.env.HOME || "", "Downloads", "WorkoutExport.csv");
  console.log(`Importing from ${csvPath}`);
  const text = readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h.startsWith(name));
  const iDate = idx("Date");
  const iEx = idx("Exercise");
  const iReps = idx("Reps");
  const iWeight = idx("Weight");
  const iDur = idx("Duration");
  const iDist = idx("Distance");
  const iIncline = idx("Incline");
  const iRes = idx("Resistance");
  const iWarm = idx("isWarmup");
  const iNote = idx("Note");
  const iMult = idx("multiplier");

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]);
    if (!c[iEx] || !c[iEx].trim()) continue;
    rows.push({
      date: c[iDate].trim(),
      exercise: c[iEx].trim(),
      reps: Math.round(num(c[iReps])),
      weightKg: num(c[iWeight]),
      durationS: num(c[iDur]),
      distanceM: num(c[iDist]),
      incline: num(c[iIncline]),
      resistance: num(c[iRes]),
      isWarmup: c[iWarm]?.trim().toLowerCase() === "true",
      note: (c[iNote] ?? "").trim(),
      multiplier: c[iMult] != null && c[iMult].trim() !== "" ? num(c[iMult]) : 1,
    });
  }
  console.log(`Parsed ${rows.length} set rows.`);

  // --- Reconcile exercise names against the catalog ---
  const catalog = await prisma.exercise.findMany({
    select: { id: true, name: true, aliases: true, isCardio: true },
  });
  const candidates = catalog.map((e) => ({
    id: e.id,
    name: e.name,
    aliases: safeArr(e.aliases),
  }));

  const uniqueNames = [...new Set(rows.map((r) => r.exercise))];
  const nameToId = new Map<string, string>();
  const report: {
    matched: { fitbod: string; catalog: string; score: number }[];
    custom: { fitbod: string; closest: string; score: number }[];
  } = { matched: [], custom: [] };

  for (const name of uniqueNames) {
    const res = bestMatch(name, candidates, MATCH_THRESHOLD);
    if (res.match) {
      nameToId.set(name, res.match.id);
      report.matched.push({
        fitbod: name,
        catalog: res.match.name,
        score: +res.score.toFixed(2),
      });
    } else {
      // Create a custom exercise. Look at whether the data is cardio-like.
      const sample = rows.find((r) => r.exercise === name)!;
      const looksCardio = sample.durationS > 0 && sample.weightKg === 0;
      const slug = slugify(name) || `custom-${nameToId.size}`;
      const ex = await prisma.exercise.upsert({
        where: { slug },
        create: {
          name,
          slug,
          aliases: JSON.stringify([]),
          primaryMuscles: JSON.stringify([]),
          secondaryMuscles: JSON.stringify([]),
          equipment: null,
          mechanic: null,
          force: null,
          category: looksCardio ? "cardio" : "strength",
          instructions: JSON.stringify([]),
          imageUrls: JSON.stringify([]),
          isCustom: true,
          isCardio: looksCardio,
          defaultIncrementKg: 2.5,
        },
        update: {},
      });
      nameToId.set(name, ex.id);
      const closest = bestMatch(name, candidates, 0);
      report.custom.push({
        fitbod: name,
        closest: closest.match?.name ?? "(none)",
        score: +closest.score.toFixed(2),
      });
    }
  }

  // --- Clear previous import, then group rows into workouts by timestamp ---
  await prisma.workoutSet.deleteMany({
    where: { workout: { source: "fitbod-import" } },
  });
  await prisma.workout.deleteMany({ where: { source: "fitbod-import" } });

  const byTimestamp = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byTimestamp.get(r.date) ?? [];
    arr.push(r);
    byTimestamp.set(r.date, arr);
  }

  let workoutCount = 0;
  let setCount = 0;
  for (const [ts, sets] of byTimestamp) {
    const performedAt = parseFitbodDate(ts);
    const workout = await prisma.workout.create({
      data: { performedAt, source: "fitbod-import" },
    });
    workoutCount++;
    await prisma.workoutSet.createMany({
      data: sets.map((s, order) => ({
        workoutId: workout.id,
        exerciseId: nameToId.get(s.exercise)!,
        order,
        reps: s.reps,
        weightKg: s.weightKg,
        multiplier: s.multiplier || 1,
        isWarmup: s.isWarmup,
        durationS: s.durationS || null,
        distanceM: s.distanceM || null,
        incline: s.incline || null,
        resistance: s.resistance || null,
        completed: true,
      })),
    });
    setCount += sets.length;
  }

  writeFileSync(
    join(process.cwd(), "data", "import-report.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(`\nImported ${workoutCount} workouts, ${setCount} sets.`);
  console.log(`Matched ${report.matched.length} exercise names.`);
  console.log(`Created ${report.custom.length} custom exercises:`);
  for (const c of report.custom) {
    console.log(`  • ${c.fitbod}  (closest: ${c.closest} @ ${c.score})`);
  }
  console.log(`\nReport written to data/import-report.json`);
}

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
