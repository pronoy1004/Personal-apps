'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Columns3,
  Clapperboard,
  KeyRound,
  BarChart3,
  Archive,
  ChevronRight,
  User,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { SectionTitle } from '@/components/ui/profit-ui';
import { computeHubSummary, greetingWord, type HubSummary } from '@/lib/hub/summary';
import type { KanbanData, MoviesData, FitnessData, ApiKeysData } from '@/lib/types';

function readStore<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [summary, setSummary] = useState<HubSummary | null>(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    setSummary(
      computeHubSummary({
        kanban: readStore<KanbanData>('kanban-data'),
        movies: readStore<MoviesData>('movies-data'),
        fitness: readStore<FitnessData>('fitness-data'),
        apiKeys: readStore<ApiKeysData>('api-keys-data'),
      }),
    );
    setToday(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    );
    // Upgrade the suggested-workout headline from the Pro-Fit engine when available.
    fetch('/api/hub/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.fitness) {
          setSummary((prev) =>
            prev
              ? {
                  ...prev,
                  fitness: {
                    workoutsThisWeek: data.fitness.workoutsThisWeek ?? prev.fitness.workoutsThisWeek,
                    suggestion: data.fitness.suggestion ?? prev.fitness.suggestion,
                  },
                }
              : prev,
          );
        }
      })
      .catch(() => {});
  }, []);

  const s = summary;

  return (
    <AppLayout>
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <div>
          <p className="text-[13px] text-muted">{today || ' '}</p>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight">
            {greetingWord()}, {s?.greetingName ?? 'Pronoy'}
          </h1>
        </div>
        <Link
          href="/more"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface-2 text-muted"
          aria-label="Account & more"
        >
          <User size={20} />
        </Link>
      </header>

      {/* Today across your hub */}
      <section className="flex flex-col gap-2.5 pt-1">
        <SectionTitle>Today across your hub</SectionTitle>
        <div
          className="flex flex-col gap-3 rounded-[20px] border p-4"
          style={{
            borderColor: 'rgba(43,229,255,.28)',
            background: 'linear-gradient(180deg,rgba(43,229,255,.06),var(--surface) 42%)',
            boxShadow: '0 0 40px -18px rgba(43,229,255,.4)',
          }}
        >
          <Link href="/fitness" className="flex items-center gap-3">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-accent text-accent-foreground shadow-glow">
              <Dumbbell size={20} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">
                {s?.fitness.suggestion?.title ?? "Today's workout"}
              </span>
              <span className="block truncate text-xs text-muted">
                {s?.fitness.suggestion?.meta ?? 'Open Pro-Fit to start training'}
              </span>
            </span>
            <span className="rounded-[11px] bg-accent px-3.5 py-2 text-[13px] font-bold text-accent-foreground">
              Start
            </span>
          </Link>

          <div className="h-px bg-[#1a1e24]" />

          <div className="flex gap-2.5">
            <Link href="/tasks" className="flex flex-1 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-surface-2">
                <Columns3 size={16} />
              </span>
              <span>
                <span className="block font-mono text-[15px] leading-none">
                  {s?.tasks.dueToday ?? '–'}
                </span>
                <span className="mt-0.5 block text-[10px] text-muted">tasks due</span>
              </span>
            </Link>
            <div className="w-px bg-[#1a1e24]" />
            <Link href="/movies" className="flex flex-1 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-surface-2">
                <Clapperboard size={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold leading-tight">
                  {s?.movies.continueWatching?.title ?? 'Nothing queued'}
                </span>
                <span className="mt-0.5 block text-[10px] text-muted">
                  {s?.movies.continueWatching ? 'continue watching' : 'browse movies'}
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Apps */}
      <section className="mt-4 flex flex-col gap-2.5">
        <SectionTitle>Apps</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <AppTile
            href="/fitness"
            icon={<Dumbbell size={19} strokeWidth={2} />}
            name="Pro-Fit"
            accent
            stat={
              <>
                <span className="font-mono text-accent">{s?.fitness.workoutsThisWeek ?? 0}</span>{' '}
                workouts this week
              </>
            }
          />
          <AppTile
            href="/tasks"
            icon={<Columns3 size={19} strokeWidth={2} />}
            name="Tasks"
            stat={
              <>
                <span className="font-mono text-foreground">{s?.tasks.active ?? 0}</span> active ·{' '}
                <span className="text-danger">{s?.tasks.dueToday ?? 0}</span> due
              </>
            }
          />
          <AppTile
            href="/movies"
            icon={<Clapperboard size={19} strokeWidth={2} />}
            name="Movies"
            stat={
              <>
                <span className="font-mono text-foreground">{s?.movies.watchlist ?? 0}</span> in
                watchlist
              </>
            }
          />
          <AppTile
            href="/api-keys"
            icon={<KeyRound size={19} strokeWidth={2} />}
            name="API Keys"
            stat={
              <>
                <span className="font-mono text-foreground">{s?.apiKeys.count ?? 0}</span> keys ·{' '}
                <span className="text-good">{s?.apiKeys.locked ? 'locked' : 'open'}</span>
              </>
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickTile href="/stats" icon={<BarChart3 size={17} />} name="Stats" />
          <QuickTile href="/archive" icon={<Archive size={17} />} name="Archive" />
        </div>
      </section>
    </AppLayout>
  );
}

function AppTile({
  href,
  icon,
  name,
  stat,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  name: string;
  stat: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3.5 rounded-[16px] border p-3.5"
      style={
        accent
          ? {
              borderColor: 'rgba(43,229,255,.25)',
              background: 'linear-gradient(180deg,rgba(43,229,255,.05),var(--surface) 50%)',
            }
          : { borderColor: 'var(--border)', background: 'var(--surface)' }
      }
    >
      <div className="flex items-center justify-between">
        <span
          className={
            'flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-surface-2 ' +
            (accent ? 'text-accent shadow-glow' : 'text-foreground')
          }
        >
          {icon}
        </span>
        <ChevronRight size={17} className="text-[#4a525c]" />
      </div>
      <div>
        <p className="text-[15px] font-bold">{name}</p>
        <p className="mt-0.5 text-[11px] text-muted">{stat}</p>
      </div>
    </Link>
  );
}

function QuickTile({ href, icon, name }: { href: string; icon: React.ReactNode; name: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[16px] border border-border bg-surface px-3.5 py-3"
    >
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-2">
        {icon}
      </span>
      <span className="text-sm font-semibold">{name}</span>
    </Link>
  );
}
