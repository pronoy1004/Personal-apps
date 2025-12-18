'use client';

import FitnessDashboard from '@/components/fitness/FitnessDashboard';
import { FitnessProvider } from '@/contexts/FitnessContext';
import AppLayout from '@/components/layout/AppLayout';
import OnlineStatus from '@/components/ui/OnlineStatus';

export default function FitnessPage() {
  return (
    <FitnessProvider>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6 sm:mb-8">
            Fitness & Nutrition
          </h1>
          <FitnessDashboard />
        </div>
        <OnlineStatus />
      </AppLayout>
    </FitnessProvider>
  );
}

