'use client';

import { Priority } from '@/lib/types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';

interface PriorityBadgeProps {
  priority: Priority;
  onClick?: () => void;
  className?: string;
}

export default function PriorityBadge({ priority, onClick, className = '' }: PriorityBadgeProps) {
  const color = PRIORITY_COLORS[priority];
  const label = PRIORITY_LABELS[priority];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
        onClick ? 'hover:opacity-80' : ''
      } ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}
