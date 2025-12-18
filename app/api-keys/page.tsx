'use client';

import { ApiKeysProvider } from '@/contexts/ApiKeysContext';
import ApiKeysDashboard from '@/components/api-keys/ApiKeysDashboard';
import AppLayout from '@/components/layout/AppLayout';
import OnlineStatus from '@/components/ui/OnlineStatus';

export default function ApiKeysPage() {
  return (
    <ApiKeysProvider>
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Secure Vault</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Keys</h1>
          </div>
          <ApiKeysDashboard />
        </div>
        <OnlineStatus />
      </AppLayout>
    </ApiKeysProvider>
  );
}

