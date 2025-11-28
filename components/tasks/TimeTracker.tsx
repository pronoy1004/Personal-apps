'use client';

import { useState, useEffect } from 'react';
import { TimeEntry } from '@/lib/types';
import { generateId, formatTime } from '@/lib/utils';
import { Play, Square, Clock } from 'lucide-react';

interface TimeTrackerProps {
  timeTracked: number;
  timeEntries: TimeEntry[];
  onUpdate: (timeTracked: number, timeEntries: TimeEntry[]) => void;
}

export default function TimeTracker({ timeTracked, timeEntries, onUpdate }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentSession((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const stopTimer = () => {
    if (currentSession > 0) {
      const newEntry: TimeEntry = {
        id: generateId(),
        startTime: new Date(Date.now() - currentSession * 1000).toISOString(),
        endTime: new Date().toISOString(),
        duration: currentSession,
      };
      onUpdate(timeTracked + currentSession, [...timeEntries, newEntry]);
    }
    setIsRunning(false);
    setCurrentSession(0);
  };

  const totalTime = timeTracked + currentSession;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Clock size={18} />
          Time Tracking
        </h3>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {formatTime(totalTime)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Play size={16} />
            Start Timer
          </button>
        ) : (
          <button
            onClick={stopTimer}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Square size={16} />
            Stop Timer ({formatTime(currentSession)})
          </button>
        )}
      </div>

      {timeEntries.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent sessions:</p>
          {timeEntries.slice(-5).reverse().map((entry) => (
            <div
              key={entry.id}
              className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded"
            >
              {formatTime(entry.duration)} - {new Date(entry.startTime).toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
