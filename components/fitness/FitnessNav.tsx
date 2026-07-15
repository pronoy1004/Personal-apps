'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const tabs = [
  { href: '/fitness', label: 'Train', exact: true },
  { href: '/fitness/workout', label: 'Workout' },
  { href: '/fitness/history', label: 'History' },
  { href: '/fitness/insights', label: 'Insights' },
  { href: '/fitness/nutrition', label: 'Nutrition' },
  { href: '/fitness/profile', label: 'Profile' },
];

/** Horizontal sub-nav for the Fitness section (Pro-Fit + nutrition). */
export default function FitnessNav() {
  const pathname = usePathname() || '/fitness';
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'bg-surface-2 text-muted hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
