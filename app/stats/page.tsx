'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StatisticsPanel from '@/components/stats/StatisticsPanel';

export default function StatsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </Link>
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
            width="40"
            height="40"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Statistics</h1>
        </div>

        <StatisticsPanel />
      </div>
    </main>
  );
}
