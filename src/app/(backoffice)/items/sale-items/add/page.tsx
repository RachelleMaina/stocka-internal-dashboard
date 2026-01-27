'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReusableTable from '@/components/common/ReusableTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PageHeader from '@/components/common/PageHeader';
import { useItems, useAddSaleItems } from '@/hooks/useSaleItems';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { routes } from '@/constants/routes';
import clsx from 'clsx';
import { useStorageAreas } from '@/hooks/useSettings';

// ────────────────────────────────────────────────
const COLUMNS = [
  { key: 'item_name',       label: 'Item Name' },
  { key: 'sku',             label: 'SKU' },
  { key: 'selling_price',  label: 'Selling Price' },
  { key: 'storage_area',    label: 'Storage Area' },
];

const formatPrices = (prices: any[] = []) => {
  if (!prices?.length) return '--';

  const activePrices = prices.filter((p) => p.is_active !== false);
  if (activePrices.length === 0) return '--';

  return activePrices
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
    .map((p) => {
      const name = p.display_name || p.pricing_tier_code || 'Price';
      const value = Number(p.selling_price).toLocaleString();
      return `${name}: KES ${value}`;
    })
    .join('\n');
};

// ────────────────────────────────────────────────
const AddSaleItemsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelName = searchParams.get('channelName');
  const channelId = searchParams.get('channelId');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  // storage_area_id per uom_id — only used/sent when row is selected
  const [storageAreaMap, setStorageAreaMap] = useState<Record<string, string>>({});

  const { data: itemsResponse, isLoading: loadingItems } = useItems({
    channelId,
    params: {
      search: debouncedSearch || undefined,
      limit: 50,
      status: 'active',
    },
  });

  const { data: storageResponse, isLoading: loadingStorage } = useStorageAreas();
  const storage_areas = storageResponse?.storage_areas || [];

  const addMutation = useAddSaleItems();

  const items = itemsResponse?.available_uoms || [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── react-select options ───────────────────────────────────────
  const storageOptions = useMemo(() => {
    return storage_areas.map((area: any) => ({
      value: area.id || area._id || area.storage_area_id,
      label: area.name || area.code || area.description || 'Unnamed Storage Area',
    }));
  }, [storage_areas]);

  const handleStorageChange = (uomId: string, option: any | null) => {
    setStorageAreaMap((prev) => ({
      ...prev,
      [uomId]: option ? option.value : '',
    }));
  };

  const handleBulkAdd = () => {
    if (selectedRows.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    setShowAddConfirm(true);
  };

  const confirmBulkAdd = () => {
   
  
    const payload = selectedRows.map((uomId) => {
      // Look up the row by id (uomId)
      const row = tableData.find((r) => r.id === uomId);
  
      if (!row) {
        return null; 
      }
  
      return {
        item_uom_option_id: uomId,
        item_id: row.item_id,  
        storage_area_id: storageAreaMap[uomId] ?? null,
      };
    }).filter(Boolean); // remove any null entries from failed lookups
  
    if (payload.length === 0) {
      toast.error("No valid items selected to add");
      setShowAddConfirm(false);
      return;
    }
  

  
    addMutation.mutate(
      { channelId: channelId as string, items: payload },
      {
        onSuccess: () => {
          toast.success(`${payload.length} item(s) added successfully!`);
          setSelectedRows([]);
          setStorageAreaMap({});
          setShowAddConfirm(false);
          router.push(`/pos/items/${channelId}`);
        },
        onError: () => {
          toast.error('Failed to add items');
          setShowAddConfirm(false);
        },
      }
    );
  };
  const selectedCount = selectedRows.length;

  const renderTopActions = () => {
    if (selectedCount > 0) {
      return (
        <button
          onClick={handleBulkAdd}
          disabled={addMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus size={18} />
          {addMutation.isPending ? 'Adding...' : `Add Selected (${selectedCount})`}
        </button>
      );
    }
    return null;
  };

  const tableData = useMemo(() => {
    return items.map((item: any) => {
      const uomId = item.uom_id || item.id || item.availability_id || item.item_uom_option_id;

      // Try to show existing/current storage area (if already assigned)
      const existingStorage = item.storage_area || item.default_storage_area || null;
      const displayStorage =
        existingStorage?.name ||
        existingStorage?.code ||
        (item.tracks_stock ? '— Not assigned —' : 'N/A');

      return {
        id: uomId,
        item_id: item.item_id,
        item_name: `${item.brand_name || ''} ${item.item_name || ''}`.trim() || 'Unnamed Item',
        sku: item.sku || '--',
        selling_price: item.price?.selling_price,
        tracks_stock: !!item.tracks_stock,
        uom_id_for_select: uomId,
        existing_storage_display: displayStorage,
      };
    });
  }, [items]);

  const isLoading = loadingItems || loadingStorage;

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <PageHeader
        title={`Add Items to ${channelName}`}
        breadcrumb="Items"
        breadcrumbPath={`${routes.listSalesItems}?channelName=${encodeURIComponent(channelName ?? '')}&channelId=${channelId}`}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search catalogue items..."
        searchWidth="w-72"
      />

      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between py-2">
          <div />
          <div>{renderTopActions()}</div>
        </div>
      </div>

      <ReusableTable
        data={tableData}
        columns={COLUMNS}
        loading={isLoading}
        enableRowSelection={true}
        onRowSelect={(selected) => setSelectedRows(selected.map((r: any) => r.id))}
        selectedIds={selectedRows}
        emptyMessage="No items found in catalogue. Only active items can be added to POS."
        scopedColumns={{
          item_name: (row) => <td>{row.item_name}</td>,
          selling_price: (row) => (
            <td> KES {row.selling_price}</td>
          ),
          storage_area: (row) => {
            const uomId = row.uom_id_for_select;
            const isSelected = selectedRows.includes(uomId);
            const canEdit = row.tracks_stock && !isLoading && storageOptions.length > 0;

            if (!isSelected) {
              // Read-only mode when not selected
              return (
                <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">
                  {row.existing_storage_display}
                </td>
              );
            }

            // Edit mode: show react-select only when row is selected
            const selectedOption = storageOptions.find(
              (opt) => opt.value === storageAreaMap[uomId]
            ) || null;

            return (
              <td className="px-3 py-2 min-w-[220px]">
                <Select
                  value={selectedOption}
                  onChange={(option) => handleStorageChange(uomId, option)}
                  options={storageOptions}
                  isDisabled={!canEdit}
                  isClearable={true}
                  isSearchable={true}
                  placeholder={canEdit ? "Select storage area..." : "N/A"}
                  isLoading={loadingStorage}
                  className="text-sm"
                  classNames={{
                    control: ({ isDisabled }) =>
                      clsx(
                        '!min-h-[38px] !text-sm',
                        isDisabled
                          ? '!bg-neutral-100 dark:!bg-neutral-800 !border-neutral-300 dark:!border-neutral-700 !cursor-not-allowed'
                          : '!bg-white dark:!bg-neutral-900 !border-primary/40 focus-within:!ring-2 focus-within:!ring-primary/30'
                      ),
                    menu: () => 'dark:!bg-neutral-800 dark:!border-neutral-700 z-[999]',
                    option: () => 'dark:hover:!bg-neutral-700 dark:!text-neutral-100 text-sm',
                    singleValue: () => 'dark:!text-neutral-100',
                    placeholder: () => 'text-neutral-500 dark:text-neutral-400',
                  }}
                  styles={{
                    control: (base) => ({ ...base, borderRadius: '0.375rem' }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </td>
            );
          },
        }}
      />

      {showAddConfirm && (
        <ConfirmDialog
          title="Add Items to POS Channel"
          message={
            <p>
              Are you sure you want to add <strong>{selectedCount}</strong> selected item(s) to this POS channel?
              {Object.keys(storageAreaMap).length > 0 && (
                <span className="block mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Storage areas will be applied where selected and stock tracking is enabled.
                </span>
              )}
            </p>
          }
          confirmLabel="Add Items"
          cancelLabel="Cancel"
          onConfirm={confirmBulkAdd}
          onCancel={() => setShowAddConfirm(false)}
          destructive={false}
        />
      )}
    </div>
  );
};

export default AddSaleItemsPage;