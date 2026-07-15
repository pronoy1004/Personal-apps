import type { KanbanData, MoviesData, FitnessData, ApiKeysData } from '@/lib/types';

/**
 * Cross-app hub summary — the data behind the Home launcher.
 * Pure function so it can run client-side (from localStorage) now and
 * server-side (from Mongo / Prisma) later via /api/hub/summary.
 */
export interface HubSummary {
  greetingName: string;
  fitness: {
    workoutsThisWeek: number;
    /** Suggested-workout headline, when the Pro-Fit engine has data. */
    suggestion?: { title: string; meta: string } | null;
  };
  tasks: {
    active: number;
    dueToday: number;
  };
  movies: {
    watchlist: number;
    continueWatching?: { title: string } | null;
  };
  apiKeys: {
    count: number;
    locked: boolean;
  };
}

const DONE_RE = /done|complete|finished|shipped/i;

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function endOfToday(): Date {
  const x = new Date();
  x.setHours(23, 59, 59, 999);
  return x;
}

export function computeHubSummary(stores: {
  kanban?: KanbanData | null;
  movies?: MoviesData | null;
  fitness?: FitnessData | null;
  apiKeys?: ApiKeysData | null;
  name?: string;
  suggestion?: { title: string; meta: string } | null;
}): HubSummary {
  const { kanban, movies, fitness, apiKeys } = stores;

  // Fitness — workouts logged this calendar week.
  const weekStart = startOfWeek(new Date());
  const workoutsThisWeek = (fitness?.workoutEntries ?? []).filter((w) => {
    const t = new Date(w.date || w.timestamp);
    return !Number.isNaN(t.getTime()) && t >= weekStart;
  }).length;

  // Tasks — done columns identified by name; active = not done/archived.
  const doneColumnIds = new Set(
    (kanban?.columns ?? []).filter((c) => DONE_RE.test(c.name)).map((c) => c.id),
  );
  const liveTasks = (kanban?.tasks ?? []).filter(
    (t) => !t.archivedAt && !doneColumnIds.has(t.status),
  );
  const eod = endOfToday();
  const dueToday = liveTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !Number.isNaN(d.getTime()) && d <= eod;
  }).length;

  // Movies — watchlist count + first item as "continue watching".
  const watchlistEntries = (movies?.watchEntries ?? []).filter((w) => w.status === 'watchlist');
  const firstWatch = watchlistEntries[0];
  const continueMedia = firstWatch
    ? (movies?.mediaEntries ?? []).find((m) => m.id === firstWatch.mediaId)
    : undefined;

  return {
    greetingName: stores.name ?? 'Pronoy',
    fitness: { workoutsThisWeek, suggestion: stores.suggestion ?? null },
    tasks: { active: liveTasks.length, dueToday },
    movies: {
      watchlist: watchlistEntries.length,
      continueWatching: continueMedia ? { title: continueMedia.title } : null,
    },
    apiKeys: {
      count: (apiKeys?.keys ?? []).length,
      locked: !!apiKeys?.passcodeHash,
    },
  };
}

/** Time-of-day greeting word. */
export function greetingWord(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}
