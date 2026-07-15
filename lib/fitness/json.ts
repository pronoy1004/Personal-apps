// Helpers for the Json columns (stored as text on SQLite). Prisma returns them
// as already-parsed values on Postgres and as strings on some SQLite paths, so
// we normalize defensively.

import type { Prisma } from "@prisma/client";

export function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  const parsed = coerce(value);
  return Array.isArray(parsed) ? parsed.map(String) : [];
}

export function asRecord<T = number>(
  value: Prisma.JsonValue | null | undefined,
): Record<string, T> {
  const parsed = coerce(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, T>)
    : {};
}

export function asObject<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  const parsed = coerce(value);
  return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
}

function coerce(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
