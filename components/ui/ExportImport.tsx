'use client';

import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { exportData, importData } from '@/lib/storage';
import { Download, Upload } from 'lucide-react';

export default function ExportImport() {
  const { data, updateData } = useKanban();
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    if (!data) return;
    
    const json = exportData(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kanban-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const imported = importData(json);
          
          if (imported) {
            if (confirm('Import will replace all current data. Continue?')) {
              updateData(() => imported);
              setImportError(null);
              alert('Data imported successfully!');
            }
          } else {
            setImportError('Invalid file format');
          }
        } catch (error) {
          setImportError('Failed to import file');
          console.error(error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        <Download size={16} />
        Export Data
      </button>
      <button
        onClick={handleImport}
        className="flex items-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Upload size={16} />
        Import Data
      </button>
      {importError && (
        <p className="text-sm text-red-500">{importError}</p>
      )}
    </div>
  );
}
