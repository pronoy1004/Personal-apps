'use client';

import FitnessDashboard from '@/components/fitness/FitnessDashboard';
import { FitnessProvider } from '@/contexts/FitnessContext';
import AppLayout from '@/components/layout/AppLayout';
import FitnessNav from '@/components/fitness/FitnessNav';
import OnlineStatus from '@/components/ui/OnlineStatus';

export default function NutritionPage() {
  return (
    <FitnessProvider>
      <AppLayout>
        <FitnessNav />
        <div className="py-1">
          <h1 className="mb-5 text-2xl font-extrabold tracking-tight">Nutrition &amp; body</h1>
          <FitnessDashboard />
        </div>
        <OnlineStatus />
      </AppLayout>
    </FitnessProvider>
  );
}
