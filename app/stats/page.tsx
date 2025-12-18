'use client';

import StatisticsPanel from '@/components/stats/StatisticsPanel';
import AppLayout from '@/components/layout/AppLayout';

export default function StatsPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Statistics</h1>
        <StatisticsPanel />
      </div>
    </AppLayout>
  );
}
