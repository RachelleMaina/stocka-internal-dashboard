'use client';

import React from 'react';
import { Search, ChevronRight, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import Select from 'react-select';

interface ButtonProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  count?: number;
}

interface FilterOption {
  value: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumb?: string;
  breadcrumbPath?: string;
  searchValue?: string;
  searchOnChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchWidth?: string;
  buttons?: ButtonProps[];
  // New: Filter dropdown props
  filters?: FilterOption[];
  selectedFilter?: string | null;
  onFilterChange?: (value: string | null) => void;
  filterPlaceholder?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumb,
  breadcrumbPath,
  searchValue = '',
  searchOnChange,
  searchPlaceholder = 'Search...',
  searchWidth = 'w-72',
  buttons = [],
  // Filter props
  filters = [],
  selectedFilter = null,
  onFilterChange,
  filterPlaceholder = 'Filter by...',
}) => {
  const router = useRouter();

  const getButtonClasses = (variant: string = 'secondary') => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white';
      case 'accent':
        return 'bg-accent text-white';
      case 'danger':
        return 'bg-red-600 text-white';
      default:
        return 'border border-primary text-primary';
    }
  };

  return (
    <div className="mt-5 mx-4">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Title & Breadcrumb */}
        <nav className="flex items-center gap-2">
          {breadcrumb && (
            <>
              <button
                onClick={() => breadcrumbPath && router.push(breadcrumbPath)}
                className="text-2xl font-semibold tracking-wide text-neutral-500 dark:text-neutral-100 dark:hover:text-neutral-200 hover:text-neutral-900"
              >
                {breadcrumb}
              </button>
              <ChevronRight size={28} className="text-neutral-400 dark:text-neutral-300" />
            </>
          )}
          <h1 className="text-2xl font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
        </nav>

        {/* Filters + Search + Buttons */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 w-full md:w-auto">
          {/* Filter Dropdown (before search) */}
          {filters.length > 0 && onFilterChange && (
            <div className="w-64">
              <Select
                options={filters}
                value={filters.find(opt => opt.value === selectedFilter) || null}
                onChange={(option) => onFilterChange(option ? option.value : null)}
                placeholder={filterPlaceholder}
                isClearable
                className="my-react-select-container text-sm"
                classNamePrefix="my-react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minWidth: 130,
                  }),
                }}
              />
            </div>
          )}

          {/* Search */}
          {searchOnChange !== undefined && (
            <div className={clsx('relative', searchWidth)}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => searchOnChange(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          )}

          {/* Buttons */}
          {buttons.length > 0 && (
            <div className="flex flex-wrap gap-3 md:flex-nowrap">
              {buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-1.5 rounded transition-all whitespace-nowrap font-medium hover:opacity-90',
                    getButtonClasses(btn.variant)
                  )}
                >
                  {btn.icon && <btn.icon size={16} />}
                  <span>
                    {btn.label}
                    {btn.count !== undefined && ` (${btn.count})`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;