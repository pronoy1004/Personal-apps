'use client';

import { useState } from 'react';
import { useFitness } from '@/hooks/useFitness';
import { BookTemplate, Plus, Trash2, Play, ChevronDown, ChevronUp } from 'lucide-react';
import type { MealType } from '@/lib/types';
import { getStartOfDay, isSameDay } from '@/lib/utils/date';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function MealTemplates() {
  const { data, saveMealTemplate, deleteMealTemplate, applyMealTemplate } = useFitness();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [applyMealType, setApplyMealType] = useState<MealType>('lunch');

  if (!data) return null;

  const templates = data.mealTemplates || [];

  // Today's food entries for selection
  const today = getStartOfDay(new Date());
  const todayEntries = data.foodEntries.filter((e) => isSameDay(e.timestamp, today));

  const handleSaveTemplate = () => {
    if (!templateName.trim() || selectedEntryIds.length === 0) return;
    saveMealTemplate(templateName.trim(), selectedEntryIds);
    setTemplateName('');
    setSelectedEntryIds([]);
    setShowSaveForm(false);
  };

  const toggleEntry = (id: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApply = (templateId: string) => {
    applyMealTemplate(templateId, applyMealType);
    setApplyingTemplate(null);
  };

  const getTotalCalories = (foods: { macros: { calories: number } }[]) =>
    foods.reduce((sum, f) => sum + f.macros.calories, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookTemplate className="text-blue-500" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Meal Templates</h2>
        </div>
        {todayEntries.length > 0 && (
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Save Template
          </button>
        )}
      </div>

      {/* Save Template Form */}
      {showSaveForm && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., High Protein Breakfast"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select foods from today
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {todayEntries.map((entry) => (
                <label
                  key={entry.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEntryIds.includes(entry.id)}
                    onChange={() => toggleEntry(entry.id)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{entry.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{entry.macros.calories}cal</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || selectedEntryIds.length === 0}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setShowSaveForm(false); setTemplateName(''); setSelectedEntryIds([]); }}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          <BookTemplate size={32} className="mx-auto mb-2 opacity-30" />
          <p>No templates yet.</p>
          <p className="text-xs mt-1">Log some food today and save it as a template.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{template.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {template.foods.length} item{template.foods.length !== 1 ? 's' : ''} · {getTotalCalories(template.foods)} cal
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {expandedTemplate === template.id
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  <button
                    onClick={() => setApplyingTemplate(applyingTemplate === template.id ? null : template.id)}
                    className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                    title="Add to today"
                  >
                    <Play size={16} className="text-green-500" />
                  </button>
                  <button
                    onClick={() => deleteMealTemplate(template.id)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Delete template"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* Expanded foods */}
              {expandedTemplate === template.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-700/30 space-y-1">
                  {template.foods.map((food, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">{food.name} ({food.quantity}{food.unit})</span>
                      <span className="text-gray-500">{food.macros.calories}cal</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Apply form */}
              {applyingTemplate === template.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Add to:</span>
                  <select
                    value={applyMealType}
                    onChange={(e) => setApplyMealType(e.target.value as MealType)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleApply(template.id)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
