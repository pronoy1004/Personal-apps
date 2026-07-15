'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPrimaryItems, getSecondaryItems } from '@/lib/config/navigation';
import { cn } from '@/lib/cn';

/**
 * Desktop sidebar (lg+). Mobile uses the BottomNav instead.
 * Renders the dark matte-black chrome with all primary + secondary apps.
 */
export default function Sidebar() {
  const pathname = usePathname() || '/';
  const primary = getPrimaryItems();
  const secondary = getSecondaryItems();

  const isActive = (route: string, exact?: boolean) =>
    exact ? pathname === route : pathname === route || pathname.startsWith(route + '/');

  const renderItem = (item: ReturnType<typeof getPrimaryItems>[number]) => {
    const Icon = item.icon;
    const active = isActive(item.route, item.exact);
    return (
      <Link
        key={item.id}
        href={item.route}
        title={item.description || item.label}
        className={cn(
          'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
          active
            ? 'bg-accent/[0.10] font-semibold text-accent'
            : 'text-muted hover:bg-surface-2 hover:text-foreground',
        )}
      >
        <Icon size={19} strokeWidth={active ? 2.3 : 2} />
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-auto rounded-full bg-accent/[0.13] px-2 py-0.5 text-[11px] font-medium text-accent">
            {item.badge}
          </span>
        )}
        {active && (
          <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-accent" />
        )}
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-surface lg:flex">
      {/* Brand */}
      <div className="border-b border-border p-4">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent shadow-glow">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#06121A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.6" />
              <rect x="14" y="3" width="7" height="7" rx="1.6" />
              <rect x="3" y="14" width="7" height="7" rx="1.6" />
              <rect x="14" y="14" width="7" height="7" rx="1.6" />
            </svg>
          </span>
          <h1 className="text-lg font-extrabold tracking-tight text-foreground">Personal Hub</h1>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {primary.map(renderItem)}
        <div className="px-3.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          More
        </div>
        {secondary.map(renderItem)}
      </nav>
    </aside>
  );
}
