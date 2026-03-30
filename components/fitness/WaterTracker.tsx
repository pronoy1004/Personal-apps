'use client';

import { useState } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { Droplets, Plus, X, Settings2 } from 'lucide-react';

const QUICK_AMOUNTS = [
  { label: '150ml', value: 150 },
  { label: '250ml', value: 250 },
  { label: '350ml', value: 350 },
  { label: '500ml', value: 500 },
];

export default function WaterTracker() {
  const { data, addWaterEntry, removeWaterEntry, getTodayWaterEntries, getTodayWaterTotal, updateSettings } = useFitness();
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  if (!data) return null;

  const todayEntries = getTodayWaterEntries();
  const totalMl = getTodayWaterTotal();
  const goalMl = data.settings.waterGoalMl || 2500;
  const progressPercent = Math.min((totalMl / goalMl) * 100, 100);
  const totalL = (totalMl / 1000).toFixed(1);
  const goalL = (goalMl / 1000).toFixed(1);

  const handleQuickAdd = (amount: number) => addWaterEntry(amount);

  const handleCustomAdd = () => {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      addWaterEntry(amount);
      setCustomAmount('');
      setShowCustom(false);
    }
  };

  const handleSaveGoal = () => {
    const goal = parseFloat(goalInput);
    if (!isNaN(goal) && goal > 0) {
      updateSettings({ waterGoalMl: goal });
    }
    setEditingGoal(false);
    setGoalInput('');
  };

  const getProgressColor = () => {
    if (progressPercent >= 100) return 'bg-green-500';
    if (progressPercent >= 60) return 'bg-blue-500';
    if (progressPercent >= 30) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="text-blue-500" size={22} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Water Intake</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalL}L</span>
            {editingGoal ? (
              <span className="ml-1 text-sm">
                /{' '}
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder={goalL}
                  className="w-16 px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveGoal(); if (e.key === 'Escape') { setEditingGoal(false); setGoalInput(''); } }}
                  autoFocus
                />
                <span className="text-sm text-gray-500">L</span>
                <button onClick={handleSaveGoal} className="ml-1 text-xs text-blue-500 hover:text-blue-600">Save</button>
              </span>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400"> / {goalL}L</span>
            )}
          </div>
          <button
            onClick={() => { setEditingGoal(true); setGoalInput((goalMl / 1000).toFixed(1)); }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Edit daily water goal"
          >
            <Settings2 size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{totalMl}ml consumed</span>
          <span>{Math.max(0, goalMl - totalMl)}ml remaining</span>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex gap-2 flex-wrap mb-3">
        {QUICK_AMOUNTS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleQuickAdd(value)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Plus size={14} />
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Custom
        </button>
      </div>

      {/* Custom Amount Input */}
      {showCustom && (
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Amount in ml"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
          />
          <button
            onClick={handleCustomAdd}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Recent entries */}
      {todayEntries.length > 0 && (
        <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
          {[...todayEntries].reverse().slice(0, 6).map((entry) => {
            const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={entry.id} className="flex items-center justify-between py-1 px-2 rounded text-sm">
                <span className="text-gray-500 dark:text-gray-400">{time}</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{entry.amount}ml</span>
                <button
                  onClick={() => removeWaterEntry(entry.id)}
                  className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {totalMl >= goalMl && (
        <div className="mt-3 text-center text-sm font-medium text-green-600 dark:text-green-400">
          Daily goal reached!
        </div>
      )}
    </div>
  );
}
