'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { getPrimaryItems, getSecondaryItems } from '@/lib/config/navigation';
import { cn } from '@/lib/cn';

/**
 * Mobile bottom navigation — 5 slots: the primary apps (Home, Fitness, Tasks,
 * Movies) plus a "More" launcher that surfaces the secondary apps.
 * Hidden on lg+ where the sidebar takes over.
 */
export default function BottomNav() {
  const pathname = usePathname() || '/';
  const primary = getPrimaryItems();
  const secondaryRoutes = getSecondaryItems().map((i) => i.route);

  const isActive = (route: string, exact?: boolean) =>
    exact ? pathname === route : pathname === route || pathname.startsWith(route + '/');

  const moreActive = pathname === '/more' || secondaryRoutes.some((r) => isActive(r));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#181b20] bg-background/[0.86] backdrop-blur-xl pb-safe lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-3 pt-2">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route, item.exact);
          return (
            <Link
              key={item.id}
              href={item.route}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-1 text-[10px] transition-colors',
                active ? 'font-semibold text-accent' : 'text-[#4a525c]',
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/more"
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-1 text-[10px] transition-colors',
            moreActive ? 'font-semibold text-accent' : 'text-[#4a525c]',
          )}
        >
          <LayoutGrid size={22} strokeWidth={moreActive ? 2.4 : 2} />
          More
        </Link>
      </div>
    </nav>
  );
}
