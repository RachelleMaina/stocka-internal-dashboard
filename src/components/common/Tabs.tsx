'use client';

import React from 'react';
import clsx from 'clsx';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[]; // ← Only array of objects allowed
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
  rightContent?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  rightContent,
  className = '',
}) => {
  return (
    <div className={clsx('border-b border-neutral-200 dark:border-neutral-700 mt-5', className)}>
      <div className="flex items-center justify-between">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const hasCount = tab.count !== undefined && tab.count > 0;

            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={clsx(
                  'relative px-2 pb-2 border-b-2 font-medium text-[16px] tracking-wide capitalize transition-colors flex items-center gap-1.5',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-400'
                )}
              >
                {tab.label}
                {hasCount && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {rightContent && <div>{rightContent}</div>}
      </div>
    </div>
  );
};

export default Tabs;