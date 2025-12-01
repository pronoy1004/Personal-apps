'use client';

import { useFitness } from '@/hooks/useFitness';
import { calculateTDEE, calculateWeightProjection, calculateActualTDEE, getCalorieRecommendations, intakeFromGoal } from '@/lib/utils/tdee';
import { TrendingDown, Calendar, Zap, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, addDays, subDays, differenceInDays } from 'date-fns';
import { getStartOfDay } from '@/lib/utils/date';
import type { FoodEntry } from '@/lib/types';

export default function WeightProjections() {
  const { data, getCurrentWeight } = useFitness();

  if (!data) return null;

  const getEstimatedWeight = (height: number, gender: string): number => {
    const heightM = height / 100;
    const bmiTarget = gender === 'male' ? 22 : 21;
    return Math.round(heightM * heightM * bmiTarget);
  };

  const currentWeight = getCurrentWeight() || getEstimatedWeight(data.userProfile.height, data.userProfile.gender);

  // Calculate formula-based TDEE
  const formulaTDEE = calculateTDEE(
    currentWeight,
    data.userProfile.height,
    data.userProfile.age,
    data.userProfile.gender,
    data.userProfile.activityLevel
  );

  // Calculate ACTUAL TDEE from observed weight changes and calorie intake
  const actualTDEEResult = calculateActualTDEE(
    data.weightEntries,
    data.foodEntries,
    data.userProfile.height,
    data.userProfile.age,
    data.userProfile.gender,
    data.userProfile.activityLevel,
    14 // Analyze last 14 days
  );

  // Use actual TDEE if available and confident, otherwise use formula
  const effectiveTDEE = actualTDEEResult && actualTDEEResult.confidence !== 'low'
    ? actualTDEEResult.actualTDEE
    : formulaTDEE;

  const tdeeSource = actualTDEEResult && actualTDEEResult.confidence !== 'low'
    ? 'Calculated from your data'
    : 'Formula-based estimate';

  // Get calorie recommendations based on effective TDEE
  const recommendations = getCalorieRecommendations(effectiveTDEE);

  // Calculate average calorie intake from historical data
  const calculateAverageIntake = (days: number): { average: number; daysWithData: number } => {
    const now = new Date();
    const entriesByDay = new Map<string, number>();
    
    // Group food entries by day
    data.foodEntries.forEach((entry: FoodEntry) => {
      const entryDate = new Date(entry.timestamp);
      const dayKey = format(getStartOfDay(entryDate), 'yyyy-MM-dd');
      
      if (!entriesByDay.has(dayKey)) {
        entriesByDay.set(dayKey, 0);
      }
      entriesByDay.set(dayKey, entriesByDay.get(dayKey)! + entry.macros.calories);
    });
    
    // Filter to last N days
    const cutoffDate = subDays(now, days);
    const recentEntries: number[] = [];
    
    entriesByDay.forEach((calories, dayKey) => {
      const dayDate = new Date(dayKey);
      if (dayDate >= cutoffDate) {
        recentEntries.push(calories);
      }
    });
    
    if (recentEntries.length === 0) {
      return { average: 0, daysWithData: 0 };
    }
    
    const average = recentEntries.reduce((sum, cal) => sum + cal, 0) / recentEntries.length;
    return { average: Math.round(average), daysWithData: recentEntries.length };
  };

  // Get averages for different time periods (prioritize longer periods for more accuracy)
  const avg7Days = calculateAverageIntake(7);
  const avg14Days = calculateAverageIntake(14);
  const avg30Days = calculateAverageIntake(30);
  
  // Use the longest period with sufficient data (at least 3 days)
  let averageIntake = 0;
  let dataSource = '';
  let daysWithData = 0;
  
  if (avg30Days.daysWithData >= 3) {
    averageIntake = avg30Days.average;
    dataSource = '30-day average';
    daysWithData = avg30Days.daysWithData;
  } else if (avg14Days.daysWithData >= 3) {
    averageIntake = avg14Days.average;
    dataSource = '14-day average';
    daysWithData = avg14Days.daysWithData;
  } else if (avg7Days.daysWithData >= 3) {
    averageIntake = avg7Days.average;
    dataSource = '7-day average';
    daysWithData = avg7Days.daysWithData;
  }
  
  // Get goal-based intake
  let goalIntake = effectiveTDEE;
  let intakeSource = 'TDEE (maintenance)';
  
  if (data.userProfile.goal && data.userProfile.goal.mode !== 'maintain') {
    goalIntake = intakeFromGoal(effectiveTDEE, data.userProfile.goal, currentWeight);
    if (data.userProfile.goal.preferRate && data.userProfile.goal.rateKgPerWeek) {
      intakeSource = `Goal: ${data.userProfile.goal.mode === 'lose' ? 'lose' : 'gain'} ${Math.abs(data.userProfile.goal.rateKgPerWeek)}kg/week`;
    } else if (data.userProfile.goal.targetWeightKg && data.userProfile.goal.targetDate) {
      const daysRemaining = differenceInDays(new Date(data.userProfile.goal.targetDate), new Date());
      intakeSource = `Goal: reach ${data.userProfile.goal.targetWeightKg}kg in ${daysRemaining} days`;
    }
  } else if (data.userProfile.dailyCalorieGoal) {
    goalIntake = data.userProfile.dailyCalorieGoal;
    intakeSource = 'Manual calorie goal';
  }
  
  // Determine which intake to use for projections
  // Use goal intake as primary, but show range based on historical variance
  let projectedIntake = goalIntake;
  
  if (averageIntake > 0) {
    const variance = Math.abs(averageIntake - goalIntake);
    if (variance > 200 && daysWithData >= 7) {
      intakeSource += ` (${dataSource}: ${averageIntake} cal)`;
    }
  }
  
  // Calculate daily deficit based on effective TDEE (positive = deficit, negative = surplus)
  const dailyDeficit = effectiveTDEE - projectedIntake;
  
  // Calculate range: ±10% of goal intake for projections
  const intakeRange = Math.round(goalIntake * 0.1);
  const minIntake = goalIntake - intakeRange;
  const maxIntake = goalIntake + intakeRange;

  // Projections for different time periods with range
  const projections = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
  ].map(({ label, days }) => {
    const baseDeficit = effectiveTDEE - projectedIntake;
    const minDeficit = effectiveTDEE - maxIntake;
    const maxDeficit = effectiveTDEE - minIntake;
    
    const projectedWeight = calculateWeightProjection(
      currentWeight,
      baseDeficit,
      days,
      data.userProfile.height,
      data.userProfile.age,
      data.userProfile.gender,
      data.userProfile.activityLevel
    );
    
    const minWeight = calculateWeightProjection(
      currentWeight,
      minDeficit,
      days,
      data.userProfile.height,
      data.userProfile.age,
      data.userProfile.gender,
      data.userProfile.activityLevel
    );
    
    const maxWeight = calculateWeightProjection(
      currentWeight,
      maxDeficit,
      days,
      data.userProfile.height,
      data.userProfile.age,
      data.userProfile.gender,
      data.userProfile.activityLevel
    );
    
    const targetDate = data.userProfile.goal?.targetDate ? new Date(data.userProfile.goal.targetDate) : null;
    const targetWeight = data.userProfile.goal?.targetWeightKg;
    const willHitTarget = targetDate && targetWeight
      ? days >= differenceInDays(targetDate, new Date())
        && projectedWeight <= targetWeight + 1 && projectedWeight >= targetWeight - 1
      : null;
    
    return {
      label,
      days,
      projectedWeight,
      minWeight,
      maxWeight,
      date: format(addDays(new Date(), days), 'MMM d, yyyy'),
      willHitTarget,
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingDown className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weight Projections</h2>
      </div>

      {/* Metabolic Insights - Show if we have actual TDEE data */}
      {actualTDEEResult && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-purple-500" size={20} />
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">Metabolic Insights</h3>
            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
              actualTDEEResult.confidence === 'high' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : actualTDEEResult.confidence === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {actualTDEEResult.confidence} confidence
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Your Actual TDEE</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {actualTDEEResult.actualTDEE} cal/day
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Based on {actualTDEEResult.daysAnalyzed} days of data
              </div>
            </div>
            <div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Formula TDEE</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {actualTDEEResult.formulaTDEE} cal/day
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Mifflin-St Jeor estimate
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-200 dark:border-purple-700">
            <div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Metabolic Factor</div>
              <div className={`text-lg font-bold ${
                actualTDEEResult.metabolicFactor >= 1 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {actualTDEEResult.metabolicFactor.toFixed(2)}x
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                {actualTDEEResult.metabolicFactor >= 1.05 
                  ? 'Faster than avg'
                  : actualTDEEResult.metabolicFactor <= 0.95
                  ? 'Slower than avg'
                  : 'Near average'}
              </div>
            </div>
            <div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Weight Change</div>
              <div className={`text-lg font-bold ${
                actualTDEEResult.weightChange < 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : actualTDEEResult.weightChange > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {actualTDEEResult.weightChange > 0 ? '+' : ''}{actualTDEEResult.weightChange.toFixed(2)} kg
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Last {actualTDEEResult.daysAnalyzed} days
              </div>
            </div>
            <div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Avg Intake</div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {actualTDEEResult.avgDailyIntake} cal
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Per day tracked
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
            <div className="flex items-start gap-2">
              {actualTDEEResult.confidence === 'high' ? (
                <CheckCircle className="text-green-500 mt-0.5" size={16} />
              ) : (
                <AlertTriangle className="text-yellow-500 mt-0.5" size={16} />
              )}
              <div className="text-sm text-purple-700 dark:text-purple-300">
                {actualTDEEResult.dataQuality}
                {actualTDEEResult.confidence !== 'high' && (
                  <span className="block text-xs mt-1">
                    Track food daily and weigh in regularly for more accurate TDEE calculation
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Weight</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentWeight.toFixed(2)} kg
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {dailyDeficit > 0 ? 'Daily Deficit' : 'Daily Surplus'}
            </div>
            <div className={`text-2xl font-bold ${dailyDeficit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {Math.round(Math.abs(dailyDeficit))} cal
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Projected Intake</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {projectedIntake} cal
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Effective TDEE:</span> {effectiveTDEE} cal/day 
            <span className="text-xs ml-2">({tdeeSource})</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Intake basis:</span> {intakeSource}
            {daysWithData > 0 && ` (${daysWithData} days of data)`}
            {averageIntake > 0 && (
              <span className="ml-2 text-xs">
                (Recent avg: {averageIntake} cal)
              </span>
            )}
          </div>
          {minIntake !== maxIntake && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Intake range:</span> {minIntake} - {maxIntake} cal/day (±{intakeRange} cal)
            </div>
          )}
        </div>
      </div>

      {/* Recommended Targets based on actual TDEE */}
      {actualTDEEResult && actualTDEEResult.confidence !== 'low' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-green-600" size={20} />
            <h3 className="font-semibold text-green-900 dark:text-green-100">Recommended Calorie Targets</h3>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 mb-3">
            Based on your actual TDEE of {actualTDEEResult.actualTDEE} cal/day
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Maintain</div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{recommendations.maintenance}</div>
            </div>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">-0.25kg/wk</div>
              <div className="font-bold text-green-600 dark:text-green-400">{recommendations.mildDeficit}</div>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded border border-green-300 dark:border-green-700">
              <div className="text-xs text-green-700 dark:text-green-300">-0.5kg/wk</div>
              <div className="font-bold text-green-700 dark:text-green-300">{recommendations.moderateDeficit}</div>
            </div>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">-0.75kg/wk</div>
              <div className="font-bold text-orange-600 dark:text-orange-400">{recommendations.aggressiveDeficit}</div>
            </div>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">-1kg/wk</div>
              <div className="font-bold text-red-600 dark:text-red-400">{recommendations.extremeDeficit}</div>
            </div>
          </div>
        </div>
      )}

      {/* Projections */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projected Weight</h3>
        {projections.map((projection) => (
          <div
            key={projection.days}
            className={`p-4 rounded-lg border ${
              projection.willHitTarget
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{projection.label}</span>
                {projection.willHitTarget && (
                  <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {projection.projectedWeight.toFixed(2)} kg
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{projection.date}</div>
              </div>
            </div>
            {projection.minWeight !== projection.maxWeight && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Range: <span className="font-medium">{projection.minWeight.toFixed(2)}</span> - <span className="font-medium">{projection.maxWeight.toFixed(2)}</span> kg
                <span className="text-xs ml-2">(based on intake variance)</span>
              </div>
            )}
            {projection.willHitTarget && (
              <div className="mt-2 text-sm text-green-700 dark:text-green-300 font-medium">
                ✓ On track to hit target weight
              </div>
            )}
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {projection.projectedWeight < currentWeight ? (
                <span className="text-green-600 dark:text-green-400">
                  Projected loss: {(currentWeight - projection.projectedWeight).toFixed(2)} kg
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  Projected gain: {(projection.projectedWeight - currentWeight).toFixed(2)} kg
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assumptions */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">How Projections Work</h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
          {actualTDEEResult && actualTDEEResult.confidence !== 'low' ? (
            <>
              <li>• Uses your <strong>actual TDEE</strong> of {actualTDEEResult.actualTDEE} cal/day (calculated from your weight & food logs)</li>
              <li>• Your metabolism is {actualTDEEResult.metabolicFactor >= 1 ? 'faster' : 'slower'} than formula prediction by {Math.abs(Math.round((actualTDEEResult.metabolicFactor - 1) * 100))}%</li>
            </>
          ) : (
            <li>• Uses formula-based TDEE of {effectiveTDEE} cal/day (track more to unlock actual TDEE)</li>
          )}
          <li>• Uses {intakeSource.toLowerCase()} for calorie intake ({projectedIntake} cal/day)</li>
          <li>• TDEE recalculates daily as weight changes (adaptive model)</li>
          <li>• 1 kg of body weight change ≈ 7,700 calories</li>
          <li>• Projections improve as you log more consistently</li>
        </ul>
      </div>
    </div>
  );
}

