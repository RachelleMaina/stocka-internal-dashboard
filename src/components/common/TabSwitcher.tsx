import React from "react";

type Tab = {
  key: string;
  label: string;
  count?: number;
};

type TabSwitcherProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

export default function TabSwitcher({
  tabs,
  activeTab,
  onTabChange,
}: TabSwitcherProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 flex items-center space-x-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            className={`px-3 py-2 text-center text-sm font-medium sm:w-auto w-full flex items-center gap-2 transition
              ${
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/10 dark:text-neutral-300 border-b-2 border-primary dark:border-primary"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
