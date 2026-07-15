import { NextResponse } from 'next/server';
import { getDashboardStats, muscleLabel } from '@/lib/fitness/stats-service';
import { generateSuggestion } from '@/lib/fitness/suggestion-service';

export const dynamic = 'force-dynamic';

/**
 * Cross-app hub summary (server-side). Currently surfaces the Pro-Fit
 * suggested workout + workouts-this-week from Prisma; the Home page merges
 * this with its client-side tasks/movies counts from localStorage.
 */
export async function GET() {
  try {
    const [stats, suggestion] = await Promise.all([
      getDashboardStats(),
      generateSuggestion(),
    ]);
    const muscles = suggestion.targetMuscles.map(muscleLabel).join(', ');
    const suggestionCard =
      suggestion.exercises.length > 0
        ? {
            title: 'Suggested workout',
            meta: `${suggestion.exercises.length} exercises${muscles ? ` · ${muscles}` : ''}`,
          }
        : null;

    return NextResponse.json({
      fitness: {
        workoutsThisWeek: stats.workoutsThisWeek,
        suggestion: suggestionCard,
      },
    });
  } catch {
    return NextResponse.json({ fitness: null });
  }
}
