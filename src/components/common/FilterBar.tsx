"use client";

import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { Search, X, SlidersHorizontal, CircleX } from "lucide-react";

type Option = {
  label: string;
  value: string;
};

type FilterBarProps = {
  isActive?: boolean | null;
  onToggleActive?: (value: boolean | null) => void;
    isEtimsRegistered?: boolean | null;
    onToggleIsEtimsRegistered?: (value: boolean | null) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  facets?: {
    label: string;
    options: Option[];
    value: Option | null;
    onChange: (value: Option | null) => void;
  }[];
  startDateTime?: Date | null;
  endDateTime?: Date | null;
  setStartDateTime?: (date: Date | null) => void;
  setEndDateTime?: (date: Date | null) => void;
  onApplyDateFilter?: () => void;
};

export const FilterBar: React.FC<FilterBarProps> = ({
  isActive = null,
  onToggleActive,
      isEtimsRegistered= null,
    onToggleIsEtimsRegistered,
  searchQuery,
  onSearchChange,
  facets = [],
  setStartDateTime,
  setEndDateTime,
  onApplyDateFilter,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const activeFacetCount =
    (facets?.reduce((count, facet) => (facet.value ? count + 1 : count), 0) ||
      0) + (isActive !== null ? 1 : 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions: Option[] = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ];
  const etimsOptions: Option[] = [
    { label: "Registered", value: "true" },
    { label: "Not Registered", value: "false" },
  ];
  const handleResetFilters = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onToggleActive?.(null);
    facets?.forEach((facet) => facet.onChange(null));
    if (setStartDateTime) setStartDateTime(today);
    if (setEndDateTime)
      setEndDateTime(new Date(today.setHours(23, 59, 59, 999)));
    setIsFilterOpen(false);
    onApplyDateFilter?.();
  };

  return (
    <div className="pb-3 bg-white dark:md:bg-neutral-800 dark:bg-neutral-900 ">
      <div className="flex flex-col gap-3">
        {/* Filters (Status, Facets, Date, Clear | Search) */}
        <div className="flex items-end justify-between gap-3">
          {/* Filters (Left) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-primary rounded relative"
              aria-expanded={isFilterOpen}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFacetCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {activeFacetCount}
                </span>
              )}
            </button>
            <div className="hidden sm:flex flex-wrap gap-3 items-center">
              {onToggleActive && (
                <div className="flex flex-col gap-1 min-w-[160px] max-w-[160px]">
                  <label className="text-xs font-medium">
                    Status
                  </label>
                  <Select
                    options={statusOptions}
                    value={
                      statusOptions.find(
                        (opt) => opt.value === String(isActive)
                      ) || null
                    }
                    onChange={(option) =>
                      onToggleActive(option ? option.value === "true" : null)
                    }
                    placeholder="Select status"
                    className="my-react-select-container"
                    classNamePrefix="my-react-select"
                    isClearable
                    
                  />
                </div>
              )}
               {onToggleIsEtimsRegistered && (
                <div className="flex flex-col gap-1 min-w-[160px] max-w-[160px]">
                  <label className="text-xs font-medium">
                   Etims
                  </label>
                  <Select
                    options={etimsOptions}
                    value={
                      etimsOptions.find(
                        (opt) => opt.value === String(isEtimsRegistered)
                      ) || null
                    }
                    onChange={(option) =>
                      onToggleIsEtimsRegistered(option ? option.value === "true" : null)
                    }
                    placeholder="Select status"
                    className="my-react-select-container"
                    classNamePrefix="my-react-select"
                    isClearable
                    
                  />
                </div>
              )}
              {facets.length > 0
                ? facets.map((facet, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 min-w-[160px] max-w-[160px]"
                    >
                      <label className="text-xs font-medium">
                        {facet.label}
                      </label>
                      <Select
                        options={facet.options || []}
                        value={facet.value}
                        onChange={facet.onChange}
                        placeholder={`Select ${facet.label.toLowerCase()}`}
                        className="my-react-select-container"
                        classNamePrefix="my-react-select"
                        isClearable
                        
                      />
                    </div>
                  ))
                : null}
            </div>
          </div>
          {/* Search Bar (Right) */}
          {searchQuery !== undefined && onSearchChange && (
            <div className="relative w-full md:w-[240px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-600 dark:text-neutral-500" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-8 py-2 text-xs border-2 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 rounded  placeholder-neutral-400 dark:placeholder-neutral-500 text-neutral-900 dark:text-neutral-100"
                aria-label="Search..."
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div
          ref={filterRef}
          className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-white dark:bg-neutral-900 p-4 sm:hidden overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              Filters
            </h2>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded p-2"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {onToggleActive && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">
                  Status
                </label>
                <Select
                  options={statusOptions}
                  value={
                    statusOptions.find(
                      (opt) => opt.value === String(isActive)
                    ) || null
                  }
                  onChange={(option) =>
                    onToggleActive(option ? option.value === "true" : null)
                  }
                  placeholder="Select status"
                  className="my-react-select-container w-full"
                  classNamePrefix="my-react-select"
                  isClearable
                />
              </div>
            )}
            {facets.length > 0
              ? facets.map((facet, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1"
                  >
                    <label className="text-xs font-medium">
                      {facet.label}
                    </label>
                    <Select
                      options={facet.options || []}
                      value={facet.value}
                      onChange={facet.onChange}
                      placeholder={`Select ${facet.label.toLowerCase()}`}
                      className="my-react-select-container w0full"
                      classNamePrefix="my-react-select"
                      isClearable
                    />
                  </div>
                ))
              : null}

          </div>
        </div>
      )}
    </div>
  );
};
