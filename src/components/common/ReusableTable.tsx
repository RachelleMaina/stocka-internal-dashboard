'use client';

import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import clsx from 'clsx';
import { List } from 'lucide-react';

interface Pagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface ReusableTableProps<T extends { id: string }> {
  data: T[];
  columns: {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    render?: (item: T, index: number) => React.ReactNode;
  }[];
  scopedColumns?: {
    [key: string]: (item: T, index: number) => React.ReactNode;
  };
  pageSize?: number;
  heading?: string;
  renderCard?: (item: T, index: number) => React.ReactNode;
  renderActions?: (item: T, index: number) => React.ReactNode;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  enableRowSelection?: boolean;
  onRowSelect?: (selectedRows: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const ReusableTable = <T extends { id: string }>({
  data,
  columns,
  scopedColumns,
  pageSize = 10,
  heading = '',
  renderCard,
  renderActions,
  pagination,
  onPageChange,
  enableRowSelection = false,
  onRowSelect,
  loading = false,
  emptyMessage,
}: ReusableTableProps<T>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [displayedData, setDisplayedData] = useState<T[]>(data);
  const [hasMore, setHasMore] = useState(true);

  const { currentPage, totalPages, totalItems } = pagination
    ? {
        currentPage: Number(pagination.page),
        totalPages: Number(pagination.total_pages),
        totalItems: Number(pagination.total_items),
      }
    : { currentPage: 1, totalPages: 1, totalItems: data.length };

  const toggleSelect = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];

    setSelectedIds(updated);
    if (onRowSelect) {
      onRowSelect(data.filter((d) => updated.includes(d.id)));
    }
  };

  const selectAll = () => {
    if (selectedIds.length === displayedData.length) {
      setSelectedIds([]);
      onRowSelect?.([]);
    } else {
      const allIds = displayedData.map((item) => item.id);
      setSelectedIds(allIds);
      onRowSelect?.(displayedData);
    }
  };

  useEffect(() => {
    setDisplayedData(data);
    setHasMore(pagination ? currentPage < totalPages : false);
  }, [data, pagination, currentPage, totalPages]);

  return (
    <div className="space-y-4 relative">
   

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[14px]  text-neutral-700 dark:text-neutral-300">Loading...</p>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <div className="overflow-hidden">
          {/* Always render header */}
          <Table
            columns={columns}
            scopedColumns={scopedColumns}
            data={displayedData}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            selectAll={selectAll}
            renderActions={renderActions}
            enableRowSelection={enableRowSelection}
            allSelected={selectedIds.length === displayedData.length && displayedData.length > 0}
          />

          {/* Empty State - only if no data */}
          {displayedData.length === 0 && !loading && (
            <div className="py-20">
              <EmptyState message={emptyMessage} />
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && onPageChange && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {/* Mobile Cards */}
      <div className="block sm:hidden flex-1 overflow-auto">
        {displayedData.length === 0 && !loading ? (
          <EmptyState message={emptyMessage} />
        ) : pagination && onPageChange ? (
          <InfiniteScroll
            dataLength={displayedData.length}
            next={() => onPageChange(currentPage + 1)}
            hasMore={hasMore}
            loader={<Loader />}
            scrollThreshold={0.95}
          >
            <div className="space-y-2">
              {displayedData.map((item, index) =>
                renderCard ? (
                  renderCard(item, index)
                ) : (
                  <MobileCard
                    key={item.id}
                    item={item}
                    index={index}
                    columns={columns}
                    scopedColumns={scopedColumns}
                    renderActions={renderActions}
                    enableRowSelection={enableRowSelection}
                    isSelected={selectedIds.includes(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                  />
                )
              )}
            </div>
          </InfiniteScroll>
        ) : (
          <div className="space-y-2">
            {displayedData.map((item, index) =>
              renderCard ? (
                renderCard(item, index)
              ) : (
                <MobileCard
                  key={item.id}
                  item={item}
                  index={index}
                  columns={columns}
                  scopedColumns={scopedColumns}
                  renderActions={renderActions}
                  enableRowSelection={enableRowSelection}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function Table<T extends { id: string }>({
  columns,
  scopedColumns,
  data,
  selectedIds,
  toggleSelect,
  selectAll,
  renderActions,
  enableRowSelection,
  allSelected,
}: {
  columns: ReusableTableProps<T>['columns'];
  scopedColumns?: ReusableTableProps<T>['scopedColumns'];
  data: T[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  renderActions?: (item: T, index: number) => React.ReactNode;
  enableRowSelection?: boolean;
  allSelected: boolean;
}) {
  return (
    <table className="min-w-full border-collapse rounded overflow-hidden">
      <thead>
        <tr className="bg-white dark:bg-neutral-900 text-left text-[14px]">
          {enableRowSelection && (
            <th className="border-b border-neutral-200 dark:border-neutral-700 text-[16px] py-3 w-3 pr-1 pl-3 font-medium text-neutral-900 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={selectAll}
                className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "/>
            </th>
          )}
          {columns.map((col) => (
            <th
              key={col.key}
              className={clsx(
                'border-b border-neutral-200 dark:border-neutral-700 pr-3 py-3 pl-3 font-medium text-[16px] text-neutral-900 dark:text-neutral-300',
                {
                  'text-right': col.align === 'right',
                  'text-center': col.align === 'center',
                }
              )}
            >
              {col.label}
            </th>
          ))}
          {renderActions && <th className="pr-2 py-3 text-[14px]">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr
            key={item.id}
            className=" text-[14px]"
          >
            {enableRowSelection && (
              <td className="py-3 pl-3 w-3 pr-1 border-b border-neutral-200  dark:border-neutral-600">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="
                  w-4 h-4
                  rounded
                  border-neutral-300 dark:border-neutral-700
                  bg-white dark:bg-neutral-800
                  accent-primary dark:accent-primary/90
                  focus:ring-primary focus:ring-offset-0
                "/>
              </td>
            )}
            {columns.map((col) => {
              const columnKey = col.key;

              return (
                <td
                  key={columnKey}
                  className={clsx(
                    'pr-3 pl-3 py-3 font-medium border-b border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200',
                    {
                      'text-right': col.align === 'right',
                      'text-center': col.align === 'center',
                    }
                  )}
                >
                  {scopedColumns && scopedColumns[columnKey]
                    ? scopedColumns[columnKey](item, index)
                    : col.render
                    ? col.render(item, index)
                    : String((item as any)[columnKey] ?? '-')}
                </td>
              );
            })}
            {renderActions && (
              <td className="pr-2 py-3 border-b border-neutral-200 dark:border-neutral-600">
                {renderActions(item, index)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MobileCard<T extends { id: string }>({
  item,
  index,
  columns,
  scopedColumns,
  renderActions,
  enableRowSelection,
  isSelected,
  onToggleSelect,
}: {
  item: T;
  index: number;
  columns: ReusableTableProps<T>['columns'];
  scopedColumns?: ReusableTableProps<T>['scopedColumns'];
  renderActions?: (item: T, index: number) => React.ReactNode;
  enableRowSelection?: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-600">
      {enableRowSelection && (
        <div className="flex justify-end mb-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary focus:ring-offset-0 bg-white checked:bg-primary"
          />
        </div>
      )}
      {columns.map((col) => {
        const columnKey = col.key;
        const scoped = scopedColumns?.[columnKey];

        return (
          <div key={col.key} className="flex justify-between text-[14px] mb-2">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {col.label}:
            </span>
            <span className="text-right text-neutral-700 dark:text-neutral-200">
              {scoped
                ? scoped(item, index)
                : col.render
                ? col.render(item, index)
                : String((item as any)[col.key] ?? '-')}
            </span>
          </div>
        );
      })}
      {renderActions && <div className="mt-3 text-right">{renderActions(item, index)}</div>}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, page - 2);
      let end = Math.min(totalPages - 1, page + 2);

      if (start > 2) pages.push('...');

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push('...');

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-end gap-2 mt-5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-1.5 text-[14px] rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
      >
        Previous
      </button>

      {pageNumbers.map((p, i) =>
        p === '...' ? (
          <span key={i} className="px-3 py-1.5 text-[14px] text-neutral-500 dark:text-neutral-100">
            ...
          </span>
        ) : (
          <button
            key={i}
            onClick={() => onPageChange(p as number)}
            className={clsx(
              'px-3 py-1.5 text-[14px] rounded border transition',
              page === p
                ? 'bg-primary text-white border-primary font-medium'
                : 'border-neutral-300 dark:border-neutral-700 hover:opacity-90 text-neutral-700 dark:text-neutral-100'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-1.5 text-[14px] rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
      >
        Next
      </button>
    </div>
  );
}

function Loader() {
  return (
    <p className="text-[14px] text-center text-neutral-400 dark:text-neutral-400 py-3">
      Loading more...
    </p>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
        <List size={32} className="text-primary" />
      </div>
      <p className="tfont-medium text-neutral-600 dark:text-neutral-400">
        {message || 'No data found.'}
      </p>
    </div>
  );
}

export default ReusableTable;