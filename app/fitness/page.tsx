'use client';

import Link from 'next/link';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import FitnessDashboard from '@/components/fitness/FitnessDashboard';
import { FitnessProvider } from '@/contexts/FitnessContext';
import OnlineStatus from '@/components/ui/OnlineStatus';
import SyncStatus from '@/components/ui/SyncStatus';

export default function FitnessPage() {
  return (
    <FitnessProvider>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors active:bg-gray-300 dark:active:bg-gray-700"
              >
                <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
              </Link>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                Fitness & Nutrition
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors"
            >
              <CheckSquare size={18} />
              <span className="hidden sm:inline">To-Do List</span>
              <span className="sm:hidden">To-Do</span>
            </Link>
          </div>

          <FitnessDashboard />
        </div>

        {/* Online Status Indicator */}
        <OnlineStatus />
        
        {/* Sync Status */}
        <SyncStatus />
      </main>
    </FitnessProvider>
  );
}

