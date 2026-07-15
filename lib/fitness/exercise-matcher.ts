// Fuzzy matching of Fitbod exercise names to the catalog. Used by the import
// script and (later) the live logger so historical and new logging share one
// catalog. Pure functions only — no DB access.

const SYNONYMS: Record<string, string> = {
  bb: "barbell",
  db: "dumbbell",
  dbs: "dumbbell",
  ez: "ezbar",
  "e-z": "ezbar",
  machine: "machine",
  smith: "smith",
  iso: "",
  hammerstrength: "machine",
  hammer: "machine",
  cable: "cable",
  seated: "",
  standing: "",
  lying: "",
  alternating: "",
  alternate: "",
  single: "",
  one: "",
  arm: "",
  leg: "",
  bodyweight: "body",
  weighted: "",
  assisted: "assisted",
};

const PLURAL_FIXES: [RegExp, string][] = [
  [/\bcurls\b/g, "curl"],
  [/\braises\b/g, "raise"],
  [/\bextensions\b/g, "extension"],
  [/\brows\b/g, "row"],
  [/\bpresses\b/g, "press"],
  [/\bflyes\b/g, "fly"],
  [/\bflys\b/g, "fly"],
  [/\bpushdowns\b/g, "pushdown"],
  [/\bpullups\b/g, "pull up"],
  [/\bpushups\b/g, "push up"],
  [/\bsquats\b/g, "squat"],
  [/\blunges\b/g, "lunge"],
  [/\bdips\b/g, "dip"],
  [/\bcrunches\b/g, "crunch"],
];

export function normalize(raw: string): string {
  let s = raw.toLowerCase().trim();
  for (const [re, rep] of PLURAL_FIXES) s = s.replace(re, rep);
  s = s.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  return s;
}

export function tokens(raw: string): string[] {
  return normalize(raw)
    .split(" ")
    .map((t) => SYNONYMS[t] ?? t)
    .filter((t) => t.length > 0);
}

function tokenSet(raw: string): Set<string> {
  return new Set(tokens(raw));
}

/** Jaccard similarity over the normalized + synonym-expanded token sets. */
export function similarity(a: string, b: string): number {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return inter / union;
}

export interface MatchCandidate {
  name: string;
  aliases?: string[];
}

export interface MatchResult<T extends MatchCandidate> {
  match: T | null;
  score: number;
}

/**
 * Find the best catalog match for a raw name. Exact (normalized) name or alias
 * hits score 1. Otherwise the best token-overlap candidate above `threshold`.
 */
export function bestMatch<T extends MatchCandidate>(
  raw: string,
  catalog: T[],
  threshold = 0.5,
): MatchResult<T> {
  const target = normalize(raw);
  let best: T | null = null;
  let bestScore = 0;

  for (const cand of catalog) {
    const names = [cand.name, ...(cand.aliases ?? [])];
    for (const n of names) {
      if (normalize(n) === target) return { match: cand, score: 1 };
    }
    for (const n of names) {
      const s = similarity(raw, n);
      if (s > bestScore) {
        bestScore = s;
        best = cand;
      }
    }
  }

  return bestScore >= threshold ? { match: best, score: bestScore } : { match: null, score: bestScore };
}
