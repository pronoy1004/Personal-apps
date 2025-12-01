'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useApiKeys } from '@/contexts/ApiKeysContext';

interface PasscodeModalProps {
  mode: 'setup' | 'unlock';
}

export default function PasscodeModal({ mode }: PasscodeModalProps) {
  const { verifyPasscode, setupPasscode } = useApiKeys();
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPasscode('');
    setConfirmPasscode('');
    setError('');
  }, [mode]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'setup') {
        if (passcode.length < 6) {
          setError('Passcode must be at least 6 characters.');
          return;
        }
        if (passcode !== confirmPasscode) {
          setError('Passcodes do not match.');
          return;
        }
        await setupPasscode(passcode);
      } else {
        const success = await verifyPasscode(passcode);
        if (!success) {
          setError('Incorrect passcode. Please try again.');
          return;
        }
      }
    } catch (err) {
      console.error('Passcode submission failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            {mode === 'setup' ? (
              <Shield className="text-blue-600 dark:text-blue-300" size={28} />
            ) : (
              <Lock className="text-blue-600 dark:text-blue-300" size={28} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'setup' ? 'Set Master Passcode' : 'Enter Master Passcode'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mode === 'setup'
                ? 'Create a passcode to encrypt and unlock your API keys. Keep it safe.'
                : 'Enter your passcode to unlock and manage your API keys.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passcode
            </label>
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••"
              required
            />
          </div>

          {mode === 'setup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Passcode
              </label>
              <input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••"
                required
              />
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold transition-colors"
          >
            {submitting ? 'Please wait...' : mode === 'setup' ? 'Set Passcode' : 'Unlock'}
          </button>
        </form>

        {mode === 'unlock' && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
            Your passcode stays on this device only. API keys remain encrypted everywhere else.
          </p>
        )}
      </div>
    </div>
  );
}

