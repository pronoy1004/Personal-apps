'use client';

import { useState } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface WeightTrackerProps {
  showHistory?: boolean;
}

export default function WeightTracker({ showHistory = false }: WeightTrackerProps) {
  const { data, addWeightEntry, getCurrentWeight } = useFitness();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!data) return null;

  const currentWeight = getCurrentWeight();
  const recentEntries = [...data.weightEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const weightChange = recentEntries.length >= 2
    ? recentEntries[0].weight - recentEntries[1].weight
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || isNaN(parseFloat(weight))) return;

    setIsSubmitting(true);
    addWeightEntry(parseFloat(weight), notes || undefined);
    setWeight('');
    setNotes('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Scale className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weight Tracker</h2>
      </div>

      {/* Current Weight Display */}
      {currentWeight && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Weight</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {currentWeight.toFixed(2)} kg
              </div>
            </div>
            {weightChange !== 0 && (
              <div className="flex items-center gap-2">
                {weightChange > 0 ? (
                  <TrendingUp className="text-red-500" size={24} />
                ) : weightChange < 0 ? (
                  <TrendingDown className="text-green-500" size={24} />
                ) : (
                  <Minus className="text-gray-400" size={24} />
                )}
                <span
                  className={`text-lg font-semibold ${
                    weightChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {weightChange > 0 ? '+' : ''}
                  {weightChange.toFixed(2)} kg
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weight Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="102.5"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Morning weight, after workout, etc."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Logging...' : 'Log Weight'}
        </button>
      </form>

      {/* Weight History Chart */}
      {recentEntries.length > 1 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Weight Trend
          </h3>
          <div className="h-48 flex items-end justify-between gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {recentEntries.slice().reverse().map((entry, index) => {
              const maxWeight = Math.max(...recentEntries.map(e => e.weight));
              const minWeight = Math.min(...recentEntries.map(e => e.weight));
              const range = maxWeight - minWeight || 1;
              const height = ((entry.weight - minWeight) / range) * 100;
              
              return (
                <div key={entry.id} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${entry.weight.toFixed(2)} kg - ${format(parseISO(entry.date), 'MMM d')}`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {format(parseISO(entry.date), 'M/d')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Weight History */}
      {showHistory && recentEntries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Weight History
          </h3>
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {format(parseISO(entry.date), 'MMM d, yyyy')}
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{entry.notes}</div>
                  )}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {entry.weight.toFixed(2)} kg
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

