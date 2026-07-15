import { prisma } from "./prisma";
import { asObject, asStringArray } from "./json";
import type { Units } from "./format";
import type { Goal } from "./prescription";
import type { ScoreWeights } from "./scoring";

export interface AppSettings {
  units: Units;
  goal: Goal;
  availableEquipment: string[];
  restTimer: { defaultRestSec: number; warmupRestSec: number };
  scoringWeights: ScoreWeights;
}

const DEFAULTS: AppSettings = {
  units: "kg",
  goal: "hypertrophy",
  availableEquipment: [],
  restTimer: { defaultRestSec: 120, warmupRestSec: 60 },
  scoringWeights: { progression: 0.4, preference: 0.3, effectiveness: 0.3 },
};

export async function getSettings(): Promise<AppSettings> {
  const s = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!s) return DEFAULTS;
  return {
    units: (s.units as Units) ?? "kg",
    goal: (s.goal as Goal) ?? "hypertrophy",
    availableEquipment: asStringArray(s.availableEquipment),
    restTimer: asObject(s.restTimer, DEFAULTS.restTimer),
    scoringWeights: asObject(s.scoringWeights, DEFAULTS.scoringWeights),
  };
}
