// Display formatting helpers (units, weights, dates).

export type Units = "kg" | "lb";

const KG_PER_LB = 0.45359237;

export function kgToDisplay(kg: number, units: Units): number {
  const v = units === "lb" ? kg / KG_PER_LB : kg;
  return Math.round(v * 10) / 10;
}

export function displayToKg(value: number, units: Units): number {
  return units === "lb" ? value * KG_PER_LB : value;
}

/** Format a weight for UI: trims trailing .0 and rounds noisy machine values. */
export function fmtWeight(kg: number, units: Units = "kg"): string {
  const v = kgToDisplay(kg, units);
  const rounded = Math.round(v * 4) / 4; // nearest 0.25
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
  return `${s}${units}`;
}

export function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function fmtRelative(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
