'use client';

import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { ApiKeysProvider } from '@/contexts/ApiKeysContext';
import ApiKeysDashboard from '@/components/api-keys/ApiKeysDashboard';
import OnlineStatus from '@/components/ui/OnlineStatus';
import SyncStatus from '@/components/ui/SyncStatus';

export default function ApiKeysPage() {
  return (
    <ApiKeysProvider>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Secure Vault</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Keys</h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <CheckSquare size={18} />
              Back to Dashboard
            </Link>
          </div>

          <ApiKeysDashboard />
        </div>

        <OnlineStatus />
        <SyncStatus />
      </main>
    </ApiKeysProvider>
  );
}

