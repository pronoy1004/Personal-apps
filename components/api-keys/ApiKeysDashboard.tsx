'use client';

import { useMemo, useState } from 'react';
import { KeyRound, LogOut, RefreshCw } from 'lucide-react';
import { useApiKeys, DecryptedApiKeyEntry } from '@/contexts/ApiKeysContext';
import PasscodeModal from './PasscodeModal';
import KeyForm from './KeyForm';
import KeyList from './KeyList';

export default function ApiKeysDashboard() {
  const { loading, authenticated, encryptedData, keys, addKey, updateKey, deleteKey, lock } = useApiKeys();
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<DecryptedApiKeyEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredKeys = useMemo(() => {
    if (!search.trim()) return keys;
    const query = search.toLowerCase();
    return keys.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.service.toLowerCase().includes(query)
    );
  }, [keys, search]);

  const upcomingExpiries = useMemo(() => {
    const today = new Date();
    return keys.filter((entry) => {
      if (!entry.expiry) return false;
      const diff = new Date(entry.expiry).getTime() - today.getTime();
      return diff > 0 && diff < 1000 * 60 * 60 * 24 * 30;
    }).length;
  }, [keys]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    setIsDeleting(id);
    try {
      await deleteKey(id);
      if (editingKey?.id === id) setEditingKey(null);
    } catch (error) {
      console.error('Failed to delete API key:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const showPasscodeModal = !loading && !authenticated;
  const needsSetup = !encryptedData?.passcodeHash;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin" />
          <p>Loading secure vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {showPasscodeModal && <PasscodeModal mode={needsSetup ? 'setup' : 'unlock'} />}

      <div className={`space-y-6 ${showPasscodeModal ? 'opacity-30 pointer-events-none select-none' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                <KeyRound size={24} />
              </span>
              API Key Vault
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Securely manage and encrypt all your API credentials in one place.
            </p>
          </div>
          {authenticated && (
            <button
              onClick={lock}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut size={16} />
              Lock Vault
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Stored Keys</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{keys.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Expiring Soon (30d)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{upcomingExpiries}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-2">
              {encryptedData?.lastModified
                ? new Date(encryptedData.lastModified).toLocaleString()
                : 'Never'}
            </p>
          </div>
        </div>

        {authenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KeyForm
              mode={editingKey ? 'edit' : 'add'}
              initialValues={editingKey || undefined}
              onSubmit={(values) =>
                editingKey ? updateKey(editingKey.id, values) : addKey(values)
              }
              onCancel={editingKey ? () => setEditingKey(null) : undefined}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stored Keys</h3>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or service"
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <KeyList
                keys={filteredKeys}
                onEdit={setEditingKey}
                onDelete={handleDelete}
              />
              {isDeleting && (
                <p className="text-xs text-gray-500 dark:text-gray-500">Deleting key...</p>
              )}
            </div>
          </div>
        )}

        {!authenticated && (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg font-semibold">Unlock to view your API keys</p>
            <p className="text-sm mt-2">Enter your master passcode to access the vault.</p>
          </div>
        )}
      </div>
    </div>
  );
}

