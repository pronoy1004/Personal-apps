'use client';

import Link from 'next/link';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import FitnessDashboard from '@/components/fitness/FitnessDashboard';
import { FitnessProvider } from '@/contexts/FitnessContext';

export default function FitnessPage() {
  return (
    <FitnessProvider>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Fitness & Nutrition
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <CheckSquare size={18} />
              To-Do List
            </Link>
          </div>

          <FitnessDashboard />
        </div>
      </main>
    </FitnessProvider>
  );
}

