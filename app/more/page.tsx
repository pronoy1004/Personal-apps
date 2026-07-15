'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { getSecondaryItems } from '@/lib/config/navigation';
import { SectionTitle } from '@/components/ui/profit-ui';

export default function MorePage() {
  const items = getSecondaryItems();
  return (
    <AppLayout>
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-extrabold tracking-tight">More</h1>
      </header>

      <SectionTitle className="mb-3">Apps & tools</SectionTitle>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.route}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:border-accent/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-surface-2 text-foreground">
                <Icon size={19} strokeWidth={2} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">{item.label}</span>
                {item.description && (
                  <span className="block text-xs text-muted">{item.description}</span>
                )}
              </span>
              <ChevronRight size={18} className="text-[#4a525c]" />
            </Link>
          );
        })}
      </div>

      <form action="/api/auth/signout" method="post" className="mt-6">
        <button
          type="submit"
          className="w-full rounded-2xl border border-border bg-surface p-3.5 text-sm font-semibold text-danger transition-colors hover:border-danger/40"
        >
          Sign out
        </button>
      </form>
    </AppLayout>
  );
}
