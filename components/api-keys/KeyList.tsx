'use client';

import { useMemo, useState } from 'react';
import { Copy, Eye, EyeOff, Trash2, Edit, AlertTriangle } from 'lucide-react';
import type { DecryptedApiKeyEntry } from '@/contexts/ApiKeysContext';

interface KeyListProps {
  keys: DecryptedApiKeyEntry[];
  onEdit: (entry: DecryptedApiKeyEntry) => void;
  onDelete: (id: string) => Promise<void> | void;
}

function getExpiryStatus(expiry?: string) {
  if (!expiry) return null;
  const today = new Date();
  const expiryDate = new Date(expiry);
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { status: 'expired', diffDays };
  if (diffDays <= 7) return { status: 'warning', diffDays };
  return { status: 'ok', diffDays };
}

export default function KeyList({ keys, onEdit, onDelete }: KeyListProps) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  const sortedKeys = useMemo(
    () => [...keys].sort((a, b) => a.service.localeCompare(b.service)),
    [keys]
  );

  const handleCopy = async (entry: DecryptedApiKeyEntry) => {
    try {
      await navigator.clipboard.writeText(entry.decryptedKey);
      setCopyStatus((prev) => ({ ...prev, [entry.id]: true }));
      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [entry.id]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!keys.length) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-semibold">No API keys stored yet</p>
        <p className="text-sm mt-2">Add your first API key using the form above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedKeys.map((entry) => {
        const status = getExpiryStatus(entry.expiry);
        return (
          <div
            key={entry.id}
            className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{entry.name}</h4>
                  {status?.status === 'warning' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <AlertTriangle size={12} />
                      {status.diffDays}d left
                    </span>
                  )}
                  {status?.status === 'expired' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      <AlertTriangle size={12} />
                      Expired
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{entry.service}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => onEdit(entry)}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => onDelete(entry.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100">
                {revealed[entry.id] ? entry.decryptedKey : '••••••••••••••••••••'}
              </div>
              <button
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => toggleReveal(entry.id)}
              >
                {revealed[entry.id] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                onClick={() => handleCopy(entry)}
              >
                {copyStatus[entry.id] ? 'Copied' : <Copy size={18} />}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Created {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>
                Updated {new Date(entry.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {entry.expiry && <span>Expires {new Date(entry.expiry).toLocaleDateString()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

