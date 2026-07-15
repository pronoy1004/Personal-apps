'use client';

import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Constrain content to a phone-like column (default). Set false for wide boards. */
  narrow?: boolean;
}

export default function AppLayout({ children, narrow = true }: AppLayoutProps) {
  return (
    <div className="flex h-screen min-h-0 bg-background text-foreground">
      <Sidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div
          className={
            narrow
              ? 'mx-auto w-full max-w-lg px-4 pb-28 pt-safe lg:pb-8'
              : 'w-full px-4 pb-28 pt-safe lg:pb-8'
          }
        >
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
