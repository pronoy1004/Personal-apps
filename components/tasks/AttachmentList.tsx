'use client';

import { useState } from 'react';
import { Attachment } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, ExternalLink, Paperclip } from 'lucide-react';

interface AttachmentListProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

export default function AttachmentList({ attachments, onChange }: AttachmentListProps) {
  const addUrlAttachment = (url: string) => {
    const trimmed = url.trim();
    if (trimmed) {
      try {
        new URL(trimmed); // Validate URL
        onChange([
          ...attachments,
          {
            id: generateId(),
            type: 'url',
            name: trimmed,
            url: trimmed,
            addedAt: new Date().toISOString(),
          },
        ]);
      } catch {
        alert('Please enter a valid URL');
      }
    }
  };

  const deleteAttachment = (id: string) => {
    onChange(attachments.filter((att) => att.id !== id));
  };

  const [newUrl, setNewUrl] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Attachments</h3>
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Paperclip size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {attachment.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {attachment.type === 'url' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => deleteAttachment(attachment.id)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add URL */}
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrlAttachment(newUrl);
              setNewUrl('');
            }
          }}
          placeholder="Add URL..."
          className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <button
          onClick={() => {
            addUrlAttachment(newUrl);
            setNewUrl('');
          }}
          disabled={!newUrl.trim()}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
