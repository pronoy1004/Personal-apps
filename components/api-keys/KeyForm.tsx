'use client';

import { FormEvent, useEffect, useState } from 'react';

interface KeyFormProps {
  mode: 'add' | 'edit';
  initialValues?: {
    name?: string;
    service?: string;
    decryptedKey?: string;
    expiry?: string;
  };
  onSubmit(values: { name: string; service: string; decryptedKey: string; expiry?: string }): Promise<void> | void;
  onCancel?: () => void;
}

export default function KeyForm({ mode, initialValues, onSubmit, onCancel }: KeyFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [service, setService] = useState(initialValues?.service || '');
  const [secret, setSecret] = useState(initialValues?.decryptedKey || '');
  const [expiry, setExpiry] = useState(initialValues?.expiry || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(initialValues?.name || '');
    setService(initialValues?.service || '');
    setSecret(initialValues?.decryptedKey || '');
    setExpiry(initialValues?.expiry || '');
  }, [initialValues]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !service.trim() || !secret.trim()) {
      setError('Name, service, and API key value are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        service: service.trim(),
        decryptedKey: secret.trim(),
        expiry: expiry || undefined,
      });
      if (mode === 'add') {
        setName('');
        setService('');
        setSecret('');
        setExpiry('');
      }
    } catch (err) {
      console.error('Failed to save API key:', err);
      setError('Failed to save API key. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'add' ? 'Add API Key' : 'Edit API Key'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'add' ? 'Store new API credentials securely' : 'Update stored API key details'}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Production OpenAI"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service</label>
          <input
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="OpenAI"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key Value</label>
        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="sk-..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date (optional)</label>
        <input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

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
        {submitting ? 'Saving...' : mode === 'add' ? 'Add API Key' : 'Save Changes'}
      </button>
    </form>
  );
}

