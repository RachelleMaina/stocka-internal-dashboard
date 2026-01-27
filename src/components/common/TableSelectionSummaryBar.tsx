// components/common/SelectionSummaryBar.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

interface SelectionSummaryBarProps {
  selectedCount: number;
  totalAvailable?: number; // Optional: show total if you want e.g. "3 of 50 selected"
  emptyMessage?: string;
  className?: string;
  selectedMessage?: (count: number) => string; // Custom message formatter
}

export default function SelectionSummaryBar({
  selectedCount,
  totalAvailable,
  emptyMessage = 'Select items to edit',
  className = '',
  selectedMessage = (count) => `${count} item(s) selected`,
}: SelectionSummaryBarProps) {
  return (
    <div 
      className={clsx(
        "border-b border-neutral-200 dark:border-neutral-700 pb-2 pt-10",
        className
      )}
    >
      <div className="flex justify-between items-center">
        <p className="font-medium text-neutral-600 dark:text-neutral-400">
          {selectedCount > 0 
            ? selectedMessage(selectedCount)
            : emptyMessage}
        </p>

        {/* Optional: show total or other info on the right */}
        {totalAvailable !== undefined && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {selectedCount} of {totalAvailable} Selected
          </p>
        )}
      </div>
    </div>
  );
}