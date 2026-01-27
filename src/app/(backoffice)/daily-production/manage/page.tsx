"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Save, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReusableTable from '@/components/common/ReusableTable';
import PageHeader from '@/components/common/PageHeader';
import { useDailyProductionItems, useUpsertDailyProduction } from '@/hooks/useProduction';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const COLUMNS = [
  { key: 'row_number', label: '#' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'produced_qty', label: 'Produced Qty' },
  { key: 'sold_qty', label: 'Sold Qty' },
  { key: 'credit_qty', label: 'Credit Qty' },
  { key: 'wasted_qty', label: 'Wasted Qty' },
  { key: 'complimentary_qty', label: 'Complimentary Qty' },
];

const NewDailyProductionPage = () => {
  const router = useRouter();
  const channelId = "685848f4-9039-481f-a380-9e26b25adff3";

  // Date defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]); // for bulk selection

  const { data: productionData, isLoading: loadingProduction, refetch } = useDailyProductionItems(selectedDate, channelId);
  const upsertMutation = useUpsertDailyProduction(channelId);

  const items = useMemo(() => productionData?.items || [], [productionData]);

  // Form values: object keyed by item.id (not array index) → much safer
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Populate existing values when production data loads
  useEffect(() => {
    if (productionData?.production_entries) {
      const newValues: Record<string, any> = {};
      productionData.production_entries.forEach((entry: any) => {
        newValues[entry.item_id] = {
          produced_qty: entry.produced_qty || '',
          sold_qty: entry.sold_qty || '',
          credit_qty: entry.credit_qty || '',
          wasted_qty: entry.wasted_qty || '',
          complimentary_qty: entry.complimentary_qty || '',
        };
      });
      setFormValues(newValues);
    }
  }, [productionData]);

  const handleInputChange = (itemId: string, field: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (selectedRows.length === 0) {
      toast.success('Please select at least one item to save');
      return;
    }

    const payload = selectedRows
      .map((rowId) => {
        const item = items.find((i: any) => i.id === rowId);
        if (!item) return null;

        const values = formValues[item.id] || {};
        return {
          item_uom_option_id: item.id,
          item_id: item.item_id,
          produced_qty: Number(values.produced_qty) || 0,
          sold_qty: Number(values.sold_qty) || 0,
          credit_qty: Number(values.credit_qty) || 0,
          wasted_qty: Number(values.wasted_qty) || 0,
          complimentary_qty: Number(values.complimentary_qty) || 0,
        };
      })
      .filter(Boolean);

    if (payload.length === 0) {
      toast.success('No valid quantities entered for selected items');
      return;
    }

    upsertMutation.mutate(
      { date: selectedDate, entries: payload },
      {
        onSuccess: () => {
          toast.success('Daily production saved successfully!');
          setSelectedRows([]);
          refetch(); // Refresh data after save
        },
        onError: () => {
          toast.error('Failed to save production');
        },
      }
    );
  };
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item: any) =>
        item.item_name?.toLowerCase().includes(lower) ||
        item.brand_name?.toLowerCase().includes(lower)
    );
  }, [items, search]);
  const tableData = useMemo(() => {
    return filteredItems.map((item: any) => ({
      id: item.id, // Use real item.id
      item_name: `${item.brand_name || ''} ${item.item_name || ''}`.trim(),
    }));
  }, [filteredItems]);

 

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <PageHeader
        title={`Daily Production - ${format(parseISO(selectedDate), 'MMM dd, yyyy')}`}
        searchValue={search}
        searchOnChange={setSearch}
        searchPlaceholder="Search items..."
        searchWidth="w-72"
        buttons={[
          {
            label: 'Save Selected',
            icon: Save,
            onClick: handleSave,
            variant: 'primary',
            disabled: selectedRows.length === 0 || upsertMutation.isPending,
          },
        ]}
      />

      {/* Date */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-6">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Production Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <ReusableTable
        data={tableData}
        columns={COLUMNS}
        enableRowSelection={true}
        onRowSelect={(selected) => setSelectedRows(selected.map((r: any) => r.id))}
        selectedIds={selectedRows}
        loading={loadingProduction}
        scopedColumns={{
          row_number: (row) => (
            <td className="text-center font-medium text-neutral-600">
              {tableData.findIndex((d) => d.id === row.id) + 1}
            </td>
          ),

          item_name: (row) => (
            <td className="font-medium">
              {row.item_name}
            </td>
          ),

          produced_qty: (row) => (
            <td>
              <input
                type="number"
                min="0"
                value={formValues[row.id]?.produced_qty ?? ''}
                onChange={(e) => handleInputChange(row.id, 'produced_qty', e.target.value)}
                disabled={!selectedRows.includes(row.id)}
                className={clsx(
                  'w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
                  !selectedRows.includes(row.id) && 'bg-neutral-50 dark:bg-neutral-800 opacity-70 cursor-not-allowed'
                )}
                placeholder="0"
              />
            </td>
          ),

          sold_qty: (row) => (
            <td>
              <input
                type="number"
                min="0"
                value={formValues[row.id]?.sold_qty ?? ''}
                onChange={(e) => handleInputChange(row.id, 'sold_qty', e.target.value)}
                disabled={!selectedRows.includes(row.id)}
                className={clsx(
                  'w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
                  !selectedRows.includes(row.id) && 'bg-neutral-50 dark:bg-neutral-800 opacity-70 cursor-not-allowed'
                )}
                placeholder="0"
              />
            </td>
          ),

          credit_qty: (row) => (
            <td>
              <input
                type="number"
                min="0"
                value={formValues[row.id]?.credit_qty ?? ''}
                onChange={(e) => handleInputChange(row.id, 'credit_qty', e.target.value)}
                disabled={!selectedRows.includes(row.id)}
                className={clsx(
                  'w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
                  !selectedRows.includes(row.id) && 'bg-neutral-50 dark:bg-neutral-800 opacity-70 cursor-not-allowed'
                )}
                placeholder="0"
              />
            </td>
          ),

          wasted_qty: (row) => (
            <td>
              <input
                type="number"
                min="0"
                value={formValues[row.id]?.wasted_qty ?? ''}
                onChange={(e) => handleInputChange(row.id, 'wasted_qty', e.target.value)}
                disabled={!selectedRows.includes(row.id)}
                className={clsx(
                  'w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
                  !selectedRows.includes(row.id) && 'bg-neutral-50 dark:bg-neutral-800 opacity-70 cursor-not-allowed'
                )}
                placeholder="0"
              />
            </td>
          ),

          complimentary_qty: (row) => (
            <td>
              <input
                type="number"
                min="0"
                value={formValues[row.id]?.complimentary_qty ?? ''}
                onChange={(e) => handleInputChange(row.id, 'complimentary_qty', e.target.value)}
                disabled={!selectedRows.includes(row.id)}
                className={clsx(
                  'w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
                  !selectedRows.includes(row.id) && 'bg-neutral-50 dark:bg-neutral-800 opacity-70 cursor-not-allowed'
                )}
                placeholder="0"
              />
            </td>
          ),
        }}
        emptyMessage="No items found for this date and channel."
      />
    </div>
  );
};

export default NewDailyProductionPage;