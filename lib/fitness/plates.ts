// Barbell plate-loading calculator (kg). Pure.

export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const DEFAULT_BAR_KG = 20;

export interface PlateResult {
  perSide: { plate: number; count: number }[];
  achievable: number; // closest weight actually loadable
  leftover: number; // kg that couldn't be represented
}

export function computePlates(
  totalKg: number,
  barKg: number = DEFAULT_BAR_KG,
  plates: number[] = KG_PLATES,
): PlateResult {
  const perSideTarget = Math.max(0, (totalKg - barKg) / 2);
  let remaining = perSideTarget;
  const perSide: { plate: number; count: number }[] = [];
  for (const p of plates) {
    const count = Math.floor(remaining / p + 1e-9);
    if (count > 0) {
      perSide.push({ plate: p, count });
      remaining -= count * p;
    }
  }
  const loadedPerSide = perSideTarget - remaining;
  return {
    perSide,
    achievable: barKg + loadedPerSide * 2,
    leftover: Math.round(remaining * 100) / 100,
  };
}
