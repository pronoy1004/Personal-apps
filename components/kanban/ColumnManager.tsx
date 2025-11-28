'use client';

import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Column } from '@/lib/types';
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function ColumnManager() {
  const { data, addColumn, updateColumn, deleteColumn } = useKanban();
  const [isOpen, setIsOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [columnName, setColumnName] = useState('');
  const [columnColor, setColumnColor] = useState('#3b82f6');

  if (!data) return null;

  const handleAdd = () => {
    if (columnName.trim()) {
      addColumn(columnName.trim(), columnColor);
      setColumnName('');
      setColumnColor('#3b82f6');
    }
  };

  const handleEdit = (column: Column) => {
    setEditingColumn(column);
    setColumnName(column.name);
    setColumnColor(column.color || '#3b82f6');
    setIsOpen(true);
  };

  const handleUpdate = () => {
    if (editingColumn && columnName.trim()) {
      updateColumn(editingColumn.id, { name: columnName.trim(), color: columnColor });
      setIsOpen(false);
      setEditingColumn(null);
      setColumnName('');
      setColumnColor('#3b82f6');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this column? Tasks in this column will be moved to the first column.')) {
      deleteColumn(id);
    }
  };

  const sortedColumns = [...data.columns].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Columns</h3>
          <button
            onClick={() => {
              setEditingColumn(null);
              setColumnName('');
              setColumnColor('#3b82f6');
              setIsOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            Add Column
          </button>
        </div>

        <div className="space-y-2">
          {sortedColumns.map((column) => (
            <div
              key={column.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <GripVertical className="text-gray-400" size={18} />
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: column.color || '#6b7280' }}
              />
              <span className="flex-1 text-gray-900 dark:text-gray-100">{column.name}</span>
              <button
                onClick={() => handleEdit(column)}
                className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Edit2 size={16} />
              </button>
              {sortedColumns.length > 1 && (
                <button
                  onClick={() => handleDelete(column.id)}
                  className="p-1.5 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingColumn(null);
          setColumnName('');
          setColumnColor('#3b82f6');
        }}
        title={editingColumn ? 'Edit Column' : 'Add Column'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Column Name
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter column name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <input
              type="color"
              value={columnColor}
              onChange={(e) => setColumnColor(e.target.value)}
              className="h-10 w-full rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600"
            />
          </div>
          <button
            onClick={editingColumn ? handleUpdate : handleAdd}
            disabled={!columnName.trim()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {editingColumn ? 'Update' : 'Add'} Column
          </button>
        </div>
      </Modal>
    </>
  );
}
