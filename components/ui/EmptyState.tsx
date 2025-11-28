'use client';

import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="mb-4 opacity-40">
        <Inbox size={48} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-500 max-w-sm leading-relaxed">{description}</p>
      )}
    </div>
  );
}
