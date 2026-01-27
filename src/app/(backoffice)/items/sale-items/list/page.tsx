'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Plus, Trash2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReusableTable from '@/components/common/ReusableTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PageHeader from '@/components/common/PageHeader';
import { useSaleItems, useRemoveSaleItems } from '@/hooks/useSaleItems';
import toast from 'react-hot-toast';
import { routes } from '@/constants/routes';
import TableSelectionSummaryBar from '@/components/common/TableSelectionSummaryBar';

// ────────────────────────────────────────────────
const COLUMNS = [
  { key: 'item_name',     label: 'Item Name' },
  { key: 'sku',           label: 'SKU' },
  { key: 'prices_display', label: 'Selling Price(s)' },   // ← changed
];

// Helper to format prices nicely in one cell
const formatPrices = (prices: any[] = []) => {
  if (!prices?.length) return '--';

  // You can filter is_active: true if you want only active prices
  const activePrices = prices.filter(p => p.is_active !== false);

  if (activePrices.length === 0) return '--';

  return activePrices
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
    .map((p) => {
      const name = p.display_name || p.pricing_tier_code || 'Price';
      const value = Number(p.selling_price).toLocaleString();
      return `${name}\nKES ${value}`;
    })
    .join('\n');
};

// ────────────────────────────────────────────────
const SaleItemsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelName = searchParams.get('channelName');
  const channelId  = searchParams.get('channelId');

  // Search & pagination states
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
      setSelectedRows([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useSaleItems({
    channelId: channelId as string,
    params: {
      search: debouncedSearch || undefined,
      page: currentPage,
      limit: 20,
    },
  });

  const removeMutation = useRemoveSaleItems();

  const items = response?.items || [];
  const pagination = response?.pagination;

  const tableData = useMemo(() => {
    return items.map((item: any) => ({
      id: item.id,                           // or item.availability_id — choose what your backend uses
      item_name: `${item.brand_name || ''} ${item.item_name || ''}`.trim() || 'Unnamed Item',
      sku: item.sku || '--',
      brand: item.brand_name || '--',
      prices_display: formatPrices(item.prices),
    }));
  }, [items]);

  const handleAddItems = () => {
    router.push(`${routes.addSalesItems}?channelName=${encodeURIComponent(channelName ?? '')}&channelId=${channelId}`);
  };

  const handleApproveItems = () => {
    router.push(`${routes.approveSalesItems}?channelName=${encodeURIComponent(channelName ?? '')}&channelId=${channelId}`);
  };

  const handleBulkRemove = () => {
    if (selectedRows.length === 0) return;
    setShowRemoveConfirm(true);
  };

  const confirmBulkRemove = () => {
    removeMutation.mutate(
      { channelId: channelId as string, item_uom_option_ids: selectedRows },
      {
        onSuccess: () => {
          toast.success(`${selectedRows.length} item(s) removed from this channel`);
          setSelectedRows([]);
          setShowRemoveConfirm(false);
        },
        onError: () => {
          toast.error('Failed to remove items');
          setShowRemoveConfirm(false);
        },
      }
    );
  };

  return (
    <div>
      <PageHeader
        title={`${channelName} Items`}
        breadcrumb="Departments"
        breadcrumbPath={routes.listSalesItemsSalesChannels}
        searchValue={searchInput}
        searchOnChange={setSearchInput}
        searchPlaceholder="Search items ..."
        searchWidth="w-72"
        buttons={[
          {
            label: 'Add Items',
            icon: Plus,
            onClick: handleAddItems,
            variant: 'primary',
          },
          {
            label: `Remove (${selectedRows.length})`,
            icon: Trash2,
            onClick: handleBulkRemove,
            variant: 'danger',
            disabled: removeMutation.isPending || selectedRows.length === 0,
          },
          {
            label: 'Approve Items',
            icon: CheckCircle,
            onClick: handleApproveItems,
            variant: 'accent',
          },
        ]}
      />

      <div className="mx-4 mt-10">
        <TableSelectionSummaryBar
          selectedCount={selectedRows.length}
          totalAvailable={tableData.length}
          emptyMessage="Select items to remove from department"
        />

        <ReusableTable
          data={tableData}
          columns={COLUMNS}
          loading={isLoading}
          enableRowSelection={true}
          onRowSelect={(selected) => setSelectedRows(selected.map((r: any) => r.id))}
          selectedIds={selectedRows}
          pagination={pagination}
          onPageChange={setCurrentPage}
          scopedColumns={{
            item_name: (row) => (
              <td className="font-medium">{row.item_name}</td>
            ),
            prices_display: (row) => (
              <td className="whitespace-pre-line">
                {row.prices_display}
              </td>
            ),
          }}
          emptyMessage="No items in this Department yet. Click 'Add Items' to get started."
        />
      </div>

      {showRemoveConfirm && (
        <ConfirmDialog
          title="Remove Items from Channel"
          message={
            <p>
              Are you sure you want to remove <strong>{selectedRows.length}</strong> selected item(s) from this POS channel?
            </p>
          }
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={confirmBulkRemove}
          onCancel={() => setShowRemoveConfirm(false)}
          destructive={true}
        />
      )}
    </div>
  );
};

export default SaleItemsPage;